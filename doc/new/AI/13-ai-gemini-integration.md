# 13 — Gemini AI Integration Specification

## 1. Overview
The platform uses **Google Gemini 1.5 Pro** (via Vertex AI or Google AI SDK) as the primary intelligence engine. Gemini replaces all previous OpenAI integrations to leverage its superior vision capabilities and large context window for product recognition and data enrichment.

---

## 2. Core Capabilities

### 2.1 Visual Product Recognition
- **Model**: `gemini-1.5-pro` (or `gemini-1.5-flash` for speed).
- **Input**: Base64 encoded image from mobile camera.
- **Output**: Structured JSON containing:
  - `product_name`: Identified name.
  - `brand`: Producer or brand name.
  - `category_guess`: Best fit from system categories.
  - `confidence_score`: 0.0 - 1.0.
  - `extracted_text`: All OCR data from the label.

### 2.2 Data Enrichment (Product Passport)
- **OCR**: Extracting fine-print details like Alcohol %, Volume, Vintage, and Ingredients.
- **Content Generation**: Generating professional product descriptions based on identified labels.

---

## 3. Implementation Details

### 3.1 Prompt Engineering (System Instructions)
Gemini is configured with specific system instructions to ensure consistency:
```text
You are an expert inventory assistant. Your task is to identify products from images. 
Always return results in valid JSON format.
For bottles, identify the producer, name, and size.
If the product is wine, identify: Vintage, Region, Grapes, and ABV.
Compare the identified product against the provided list of system categories.
```

### 3.2 Edge Function Flow
1. **Request**: Frontend sends image + `business_id`.
2. **Context**: Edge Function fetches current `categories` list to provide context to Gemini.
3. **Execution**:
   - Initialize Google AI SDK with `GEMINI_API_KEY`.
   - Call `generateContent` with multi-modal input (text + image).
4. **Processing**:
   - Receive JSON.
   - Fuzzy match `product_name` against the `products` table.
5. **Response**: Return identified data and top database matches.

---

## 4. API Key Management

The system supports a dual-key approach:
1. **System Default**: A master key provided by the platform (managed via Supabase Vault).
2. **User Provided**: Admins can enter their own Google Cloud / AI Studio key in Settings.
   - User keys are stored encrypted in the `business_profile` table.
   - If a user key exists and is enabled, the Edge Function uses it instead of the system default.

---

## 5. Performance & Cost Optimization

- **Flash vs Pro**: Use `gemini-1.5-flash` for real-time camera recognition (faster, cheaper) and `gemini-1.5-pro` for complex Product Passport enrichment.
- **Image Resizing**: Frontend resizes images to a maximum of 1024px before upload to reduce latency and token usage.
- **Caching**: Common product recognition results (hashes of labels) can be cached in Supabase to avoid redundant AI calls.
