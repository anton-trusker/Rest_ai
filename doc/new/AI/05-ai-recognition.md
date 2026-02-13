# 05 — AI Recognition Engine (Gemini 1.5 Pro)

## 1. Overview
The platform uses **Google Gemini 1.5 Pro** as the primary intelligence engine for product recognition. Gemini replaces previous OpenAI-based logic to provide superior multi-modal capabilities (vision + text) specifically tuned for product labels, barcodes, and package identification.

---

## 2. Core Capabilities

### 2.1 Visual Product Identification
- **Input**: Image captured from mobile camera (base64).
- **Process**:
  1. Image is sent to a Supabase Edge Function (`ai-recognize-product`).
  2. The function passes the image to Gemini 1.5 Pro with a context-aware prompt.
  3. Gemini identifies the product name, brand, size, and category.
- **Output**: Structured JSON with identification details and confidence scores.

### 2.2 Category-Aware Recognition
Gemini is provided with the current business's category list as context, allowing it to "guess" the most appropriate category for a newly identified item.

### 2.3 Product Passport Enrichment (OCR)
- Extracts Alcohol %, Volume, Producer, Region, and Vintage from labels.
- Automatically populates the `metadata` JSONB field in the `products` table.
- Generates marketing descriptions and tasting notes (if wine/spirits).

---

## 3. Technical Implementation

### 3.1 Edge Function: `ai-recognize-product`
- **Model**: `gemini-1.5-flash` for high-speed identification, `gemini-1.5-pro` for deep enrichment.
- **Safety**: Stateless processing; images are not stored unless explicitly saved by the user for product images.
- **Dual-Key Logic**:
  - Uses the system-default Gemini key if no user key is provided.
  - Uses the business's own API key if configured in Admin Settings.

### 3.2 Prompt Logic
```text
System: You are an expert inventory assistant.
Input: [Image of Product]
Context: [List of Business Categories: Wines, Spirits, Beer, Soft Drinks]
Task: Identify the product. Return JSON: { "name": string, "sku": string, "category": string, "confidence": number }
```

---

## 4. AI-Driven Matching Logic
1. **Visual Match**: Gemini identifies "Chateau Margaux 2015".
2. **Database Lookup**: The app queries the `products` table for "Chateau Margaux".
3. **Selection**: If a high-confidence match exists, the app suggests it. If not, it creates a "Draft" product for admin review.

---

## 5. Privacy & Ethics
- No personally identifiable information (PII) is sent to Gemini.
- Images are processed in a stateless session.
- AI is used as an assistant; all final inventory counts must be verified by a human user.
