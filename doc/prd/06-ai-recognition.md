# 06 — AI Label Recognition

**AI-Powered Wine Label Recognition Pipeline**

This document defines the complete AI recognition system using OCR, embeddings, and vision verification.

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Stage 1: OCR Text Extraction](#stage-1-ocr-text-extraction)
3. [Stage 2: Vector Similarity Search](#stage-2-vector-similarity-search)
4. [Stage 3: Vision Verification](#stage-3-vision-verification)
5. [Feedback Loop](#feedback-loop)
6. [Performance Optimization](#performance-optimization)

---

## Pipeline Overview

### **Architecture**

```
Mobile Camera → Label Image
        ↓
[1] Google Cloud Vision OCR
        ↓
Extract: producer, wine name, vintage, region, ABV
        ↓
[2] OpenAI Embeddings (text-embedding-3-small)
        ↓
Generate 1536-dim vector
        ↓
[3] pgvector Similarity Search
        ↓
Top 10 candidates from product_search_index
        ↓
[4] Gemini 1.5 Flash Vision Verification
        ↓
Rank candidates + return confidence
        ↓
[5] User Confirmation → ai_feedback
        ↓
Continuous Learning
```

### **Why This Approach?**

1. **OCR First**: Wine labels are text-heavy (best cheap signal)
2. **Vector Search**: Fast candidate retrieval (milliseconds for 10K+ products)
3. **Vision Verification**: High-precision confirmation on shortlist
4. **Feedback Loop**: Improves over time from user corrections

### **Cost Optimization**

- **OCR**: $1.50 per 1,000 images (Google Vision)
- **Embeddings**: $0.02 per 1M tokens (OpenAI)
- **Vision**: $0.075 per 1K images for Gemini 1.5 Flash
- **Total**: ~$0.10 per 100 scans (assuming 10 candidates verified)

---

## Stage 1: OCR Text Extraction

### **Google Cloud Vision API**

**Purpose**: Extract all text from wine label

**Request**:
```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

async function extractTextFromLabel(imageBuffer) {
  const [result] = await client.textDetection(imageBuffer);
  const detections = result.textAnnotations;
  
  return {
    fullText: detections[0]?.description || '',
    blocks: detections.slice(1).map(block => ({
      text: block.description,
      bounds: block.boundingPoly.vertices
    }))
  };
}
```

**Example Output**:
```json
{
  "fullText": "CHÂTEAU MARGAUX\n2015\nGrand Cru Classé\nMargaux\n13.5% Vol.\n750ml",
  "blocks": [
    { "text": "CHÂTEAU", "bounds": [...] },
    { "text": "MARGAUX", "bounds": [...] },
    { "text": "2015", "bounds": [...] }
  ]
}
```

### **Field Extraction**

Parse OCR text into structured fields:

```typescript
interface ExtractedFields {
  producer?: string;
  wine_name?: string;
  vintage?: number;
  region?: string;
  appellation?: string;
  alcohol_content?: number;
  volume_ml?: number;
}

function parseOCRText(fullText: string): ExtractedFields {
  const lines = fullText.split('\n').filter(l => l.trim());
  
  const fields: ExtractedFields = {};
  
  // Extract vintage (4-digit year)
  const vintageMatch = fullText.match(/\b(19|20)\d{2}\b/);
  if (vintageMatch) {
    fields.vintage = parseInt(vintageMatch[0]);
  }
  
  // Extract ABV (alcohol content)
  const abvMatch = fullText.match(/(\d+\.?\d*)\s*%\s*(Vol|Alc)/i);
  if (abvMatch) {
    fields.alcohol_content = parseFloat(abvMatch[1]);
  }
  
  // Extract volume
  const volumeMatch = fullText.match(/(\d+)\s*ml/i);
  if (volumeMatch) {
    fields.volume_ml = parseInt(volumeMatch[1]);
  }
  
  // Extract producer (usually first line or contains "Château", "Domaine", etc.)
  const producerPatterns = /(château|domaine|bodega|tenuta|estate)/i;
  const producerLine = lines.find(l => producerPatterns.test(l));
  if (producerLine) {
    fields.producer = producerLine.trim();
  }
  
  return fields;
}
```

---

## Stage 2: Vector Similarity Search

### **Embedding Generation**

**OpenAI text-embedding-3-small** (1536 dimensions):

```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}
```

### **Product Index Table**

```sql
CREATE TABLE product_search_index (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    search_text TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    model_name TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX idx_product_search_embedding ON product_search_index 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### **Build Index** (Run periodically or on product updates)

```typescript
async function rebuildProductIndex() {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, wines(producer, region, appellation, vintage)')
    .eq('is_active', true);
  
  for (const product of products) {
    // Build searchable content
    const content = [
      product.name,
      product.wines?.producer,
      product.wines?.region,
      product.wines?.appellation,
      product.wines?.vintage
    ].filter(Boolean).join(' ');
    
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Upsert into index
    await supabase
      .from('product_search_index')
      .upsert({
        product_id: product.id,
        search_text: product.name,
        content: content,
        embedding: embedding
      });
  }
}
```

### **Vector Similarity Search**

```sql
-- RPC function for vector search
CREATE OR REPLACE FUNCTION vector_search_products(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    name TEXT,
    producer TEXT,
    vintage INT,
    similarity FLOAT
)
LANGUAGE SQL
AS $$
    SELECT
        psi.product_id,
        p.name,
        w.producer,
        w.vintage,
        1 - (psi.embedding <=> query_embedding) AS similarity
    FROM product_search_index psi
    JOIN products p ON p.id = psi.product_id
    LEFT JOIN wines w ON w.product_id = p.id
    WHERE 1 - (psi.embedding <=> query_embedding) > match_threshold
    ORDER BY psi.embedding <=> query_embedding
    LIMIT match_count;
$$;
```

**Usage**:
```typescript
const { data: candidates } = await supabase.rpc('vector_search_products', {
  query_embedding: embeddingVector,
  match_threshold: 0.7,
  match_count: 10
});
```

---

## Stage 3: Vision Verification

### **Gemini 1.5 Flash**

**Purpose**: Verify which candidate matches the label image

**Request**:
```typescript
async function verifyWithVision(
  imageBase64: string,
  candidates: Product[]
): Promise<VerificationResult> {
  const prompt = `You are a wine expert. Analyze this wine label image and determine which product from the candidate list it matches.

Candidates:
${candidates.map((c, idx) => `${idx + 1}. ${c.name} - ${c.producer} (${c.vintage})`).join('\n')}

Return JSON with:
- chosen_index: The 1-based index of the matching product (or null if no match)
- confidence: 0.0 to 1.0
- reason: Brief explanation
- extracted_vintage: Vintage visible on label
- extracted_volume: Bottle size (ml) if visible`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          response_mime_type: 'application/json'
        }
      })
    }
  );
  
  const data = await response.json();
  const result = JSON.parse(data.candidates[0].content.parts[0].text);
  
  return {
    product_id: result.chosen_index ? candidates[result.chosen_index - 1].id : null,
    confidence: result.confidence,
    reason: result.reason,
    extracted_fields: {
      vintage: result.extracted_vintage,
      volume_ml: result.extracted_volume
    }
  };
}
```

**Response Example**:
```json
{
  "chosen_index": 2,
  "confidence": 0.95,
  "reason": "Label clearly shows 'Château Margaux' with 2015 vintage, matching candidate #2",
  "extracted_vintage": 2015,
  "extracted_volume": 750
}
```

---

## Feedback Loop

### **Storing Recognition Results**

```sql
-- ai_runs table stores each recognition attempt
INSERT INTO ai_runs (run_type, status, input_asset_id, confidence, result)
VALUES (
    'label_recognition',
    'succeeded',
    'asset-uuid',
    0.95,
    '{"ocr_text": "...", "top_match": {...}, "candidates": [...]}'
);

-- ai_match_candidates stores all candidates with scores
INSERT INTO ai_match_candidates (ai_run_id, product_id, score, rank)
VALUES
    ('run-uuid', 'product-1-uuid', 0.95, 1),
    ('run-uuid', 'product-2-uuid', 0.82, 2),
    ('run-uuid', 'product-3-uuid', 0.71, 3);
```

### **User Feedback**

```typescript
async function submitFeedback(
  aiRunId: string,
  chosenProductId: string,
  feedbackType: 'correct' | 'incorrect' | 'partial' | 'no_match',
  notes?: string
) {
  await supabase
    .from('ai_feedback')
    .insert({
      ai_run_id: aiRunId,
      chosen_product_id: chosenProductId,
      chosen_by: userId,
      feedback_type: feedbackType,
      notes: notes
    });
  
  // If user corrected AI, update learning dataset
  if (feedbackType === 'incorrect') {
    // Future: retrain or adjust embeddings
    console.log('User correction logged for model improvement');
  }
}
```

### **Learning Loop Dashboard** (Future)

```sql
-- Accuracy metrics
SELECT
    COUNT(*) FILTER (WHERE af.feedback_type = 'correct') * 100.0 / COUNT(*) AS accuracy_pct,
    AVG(ar.confidence) AS avg_confidence
FROM ai_runs ar
JOIN ai_feedback af ON af.ai_run_id = ar.id
WHERE ar.created_at > NOW() - INTERVAL '30 days';

-- Common failure patterns
SELECT
    p.name,
    COUNT(*) AS incorrect_count
FROM ai_feedback af
JOIN ai_runs ar ON ar.id = af.ai_run_id
JOIN ai_match_candidates amc ON amc.ai_run_id = ar.id AND amc.rank = 1
JOIN products p ON p.id = amc.product_id
WHERE af.feedback_type = 'incorrect'
GROUP BY p.id, p.name
ORDER BY incorrect_count DESC
LIMIT 20;
```

---

## Performance Optimization

### **1. Image Pre-processing**

```typescript
async function preprocessLabelImage(imageBlob: Blob): Promise<Blob> {
  // Resize to max 1024px (reduces API costs)
  const maxSize = 1024;
  
  // Crop to label area (simple center crop)
  // Enhance contrast
  // Reduce glare
  
  return processedBlob;
}
```

### **2. Caching**

```typescript
// Cache OCR results by image hash
const imageHash = await computePerceptualHash(imageBuffer);

const { data: cached } = await supabase
  .from('ai_runs')
  .select('*')
  .eq('result->image_hash', imageHash)
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days
  .single();

if (cached) {
  return cached.result;
}
```

### **3. Index Optimization**

```sql
-- Tune IVFFlat index for dataset size
-- lists = sqrt(rows) for optimal performance
-- For 10K products: lists ≈ 100
-- For 100K products: lists ≈ 316

CREATE INDEX idx_product_search_embedding ON product_search_index 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Rebuild index periodically
REINDEX INDEX idx_product_search_embedding;
```

### **4. Batch Processing**

```typescript
// Process multiple images in parallel
async function batchRecognize(images: string[]) {
  const promises = images.map(img => recognizeLabel(img));
  return await Promise.all(promises);
}
```

---

## Next Steps

- Review [07-inventory-management.md](07-inventory-management.md) for inventory workflow
- Study [05-edge-functions.md](05-edge-functions.md) for AI scan implementation
- Examine [08-deployment-guide.md](08-deployment-guide.md) for AI API key configuration
