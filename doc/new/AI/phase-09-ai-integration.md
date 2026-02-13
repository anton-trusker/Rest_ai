# Phase 9: AI Integration

## Overview

Integrate OpenAI Vision API for wine label recognition during inventory counting.

---

## Architecture

```
User captures image
       ↓
Image processed (resize, compress)
       ↓
Edge Function calls OpenAI Vision
       ↓
Extract: name, producer, vintage, type
       ↓
Fuzzy match against wines table
       ↓
Return matches with confidence scores
```

---

## Edge Function

**File:** `supabase/functions/recognize-wine/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.28.0/mod.ts";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

serve(async (req) => {
  const { image } = await req.json(); // base64 image

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this wine label image. Extract:
- Wine name
- Producer/winery
- Vintage year
- Wine type (red/white/rose/sparkling)
- Region/country
- Grape varieties (if visible)

Return as JSON: { name, producer, vintage, wineType, region, grapes }`,
          },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
        ],
      },
    ],
    max_tokens: 500,
  });

  const extracted = JSON.parse(response.choices[0].message.content);
  return new Response(JSON.stringify(extracted));
});
```

---

## Matching Algorithm

```typescript
// src/services/aiRecognitionService.ts
interface WineMatch {
  wine: Wine;
  score: number;
  matchDetails: string[];
}

const WEIGHTS = {
  exactName: 40,
  partialName: 25,
  vintage: 20,
  producer: 20,
  region: 10,
  type: 10,
};

export async function matchWine(extracted: ExtractedWine): Promise<WineMatch[]> {
  const { data: wines } = await supabase
    .from("wines")
    .select("*")
    .eq("is_active", true);

  const matches: WineMatch[] = wines
    .map((wine) => {
      let score = 0;
      const details: string[] = [];

      // Name matching
      if (wine.name.toLowerCase() === extracted.name?.toLowerCase()) {
        score += WEIGHTS.exactName;
        details.push("Exact name match");
      } else if (extracted.name && wine.name.toLowerCase().includes(extracted.name.toLowerCase())) {
        score += WEIGHTS.partialName;
        details.push("Partial name match");
      }

      // Vintage
      if (extracted.vintage && wine.vintage === extracted.vintage) {
        score += WEIGHTS.vintage;
        details.push("Vintage match");
      }

      // Producer
      if (extracted.producer && wine.producer?.toLowerCase().includes(extracted.producer.toLowerCase())) {
        score += WEIGHTS.producer;
        details.push("Producer match");
      }

      return { wine, score, matchDetails: details };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return matches;
}
```

---

## UI Flow

```typescript
// CameraScanner.tsx
async function handleCapture(imageData: string) {
  setIsProcessing(true);
  
  try {
    // Call edge function
    const { data } = await supabase.functions.invoke("recognize-wine", {
      body: { image: imageData },
    });

    // Match wines
    const matches = await matchWine(data);

    if (matches.length === 0) {
      toast.error("No matching wine found. Please search manually.");
      return;
    }

    if (matches[0].score >= 80) {
      // High confidence - auto-select
      onWineDetected(matches[0].wine.id);
    } else {
      // Show confirmation dialog
      setMatchResults(matches);
      setShowConfirmDialog(true);
    }
  } catch (error) {
    toast.error("Recognition failed. Try again or search manually.");
  } finally {
    setIsProcessing(false);
  }
}
```

---

## Error Handling

| Error | Action |
|-------|--------|
| API timeout | Retry 3x with backoff |
| Rate limit (429) | Queue and retry |
| Low confidence (<50%) | Fallback to manual |
| No text detected | Prompt better lighting |

---

## Next Phase

→ [Phase 10: Syrve Integration](./phase-10-syrve-integration.md)
