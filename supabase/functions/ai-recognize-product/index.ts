/**
 * Edge Function: ai-recognize-product
 * 
 * Purpose: Process product images using Google Gemini for visual recognition
 * - Accepts Base64 image or URL
 * - Calls Gemini 1.5 Flash with structured prompt
 * - Fuzzy matches against product catalog
 * - Returns ranked matches with confidence scores
 * 
 * Method: POST
 * Auth: Required (Supabase JWT)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecognizeRequest {
    image: string  // Base64 or URL
    sessionId?: string
    context?: {
        categoryHint?: string
        locationId?: string
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const body: RecognizeRequest = await req.json()
        const startTime = Date.now()

        // 1. Get AI config
        const { data: aiConfig, error: configError } = await supabaseClient
            .from('ai_config')
            .select('*')
            .eq('is_active', true)
            .eq('provider', 'google')
            .single()

        if (configError || !aiConfig || !aiConfig.api_key_encrypted) {
            return new Response(JSON.stringify({
                error: 'AI not configured. Please add Google Gemini API key in settings.'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Get product catalog context (for better matching)
        const { data: categories } = await supabaseClient
            .from('categories')
            .select('name')
            .eq('is_active', true)
            .limit(50)

        const categoryList = categories?.map(c => c.name).join(', ') || 'wine, spirits, beer, beverages'

        // 3. Build Gemini prompt
        const prompt = `You are a product recognition assistant for an inventory management system.

Analyze this product image and extract the following information in JSON format:

{
  "product_name": "Full product name as it appears on the label",
  "brand": "Brand or producer name",
  "type": "Product type/category (e.g., Red Wine, Whiskey, Vodka, Beer)",
  "volume": "Bottle size if visible (e.g., 750ml, 1L, 500ml)",
  "alcohol_percentage": "Alcohol % if visible (e.g., 40, 13.5)",
  "vintage": "Year if this is wine (e.g., 2015, 2020)",
  "country": "Country of origin if visible",
  "confidence": 0-100
}

Available product categories: ${categoryList}

${body.context?.categoryHint ? `Hint: User is looking for ${body.context.categoryHint}` : ''}

IMPORTANT: Return ONLY valid JSON, no markdown, no additional text.`

        // 4. Call Gemini API
        const geminiApiKey = aiConfig.api_key_encrypted
        const modelName = aiConfig.model_name || 'gemini-1.5-flash'

        // Prepare image data
        let imageBase64 = body.image
        if (body.image.startsWith('data:image')) {
            // Extract base64 from data URL
            imageBase64 = body.image.split(',')[1]
        } else if (body.image.startsWith('http')) {
            // Fetch image and convert to base64
            const imageResponse = await fetch(body.image)
            const imageBlob = await imageResponse.blob()
            const arrayBuffer = await imageBlob.arrayBuffer()
            imageBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: imageBase64,
                                },
                            },
                        ],
                    }],
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 256,
                    },
                }),
            }
        )

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`)
        }

        const geminiData = await geminiResponse.json()
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        if (!responseText) {
            throw new Error('No response from Gemini API')
        }

        // 5. Parse response
        let extractedData
        try {
            // Remove markdown code blocks if present
            const jsonText = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim()
            extractedData = JSON.parse(jsonText)
        } catch (e) {
            console.error('Failed to parse AI response:', responseText)
            throw new Error(`Failed to parse AI response: ${responseText.substring(0, 200)}`)
        }

        // 6. Fuzzy match against products table
        const searchTerms = [
            extractedData.product_name,
            extractedData.brand,
            `${extractedData.brand} ${extractedData.product_name}`.trim(),
        ].filter(term => term && term.length > 2)

        // Build OR query for fuzzy matching
        const orQuery = searchTerms
            .map(term => `name.ilike.%${term}%`)
            .join(',')

        const { data: matches } = await supabaseClient
            .from('products')
            .select(`
        id,
        name,
        sku,
        code,
        category:categories(name)
      `)
            .or(orQuery)
            .limit(10)

        // Calculate match confidence using Levenshtein distance
        const matchesWithConfidence = (matches || []).map(product => {
            const similarity = calculateSimilarity(
                extractedData.product_name?.toLowerCase() || '',
                product.name.toLowerCase()
            )
            return {
                product_id: product.id,
                product_name: product.name,
                sku: product.sku,
                code: product.code,
                category: product.category?.name,
                confidence: Math.round(similarity * 100),
            }
        }).sort((a, b) => b.confidence - a.confidence)

        const processingTime = Date.now() - startTime
        const bestMatch = matchesWithConfidence[0]

        // 7. Log attempt to audit table
        const { data: attempt } = await supabaseClient
            .from('ai_recognition_attempts')
            .insert({
                user_id: user.id,
                session_id: body.sessionId,
                model_used: modelName,
                prompt_version: 'v1',
                raw_response: { text: responseText },
                extracted_data: extractedData,
                matched_product_id: bestMatch?.product_id,
                match_confidence: bestMatch?.confidence || 0,
                match_method: matchesWithConfidence.length > 0 ? 'fuzzy' : 'none',
                processing_time_ms: processingTime,
                tokens_used: geminiData.usageMetadata?.totalTokenCount || 0,
                status: 'success',
                processed_at: new Date().toISOString(),
            })
            .select()
            .single()

        return new Response(JSON.stringify({
            attempt_id: attempt.id,
            matches: matchesWithConfidence,
            extracted_data: extractedData,
            processing_time_ms: processingTime,
            tokens_used: geminiData.usageMetadata?.totalTokenCount || 0,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('AI recognition error:', error)

        return new Response(JSON.stringify({
            error: error.message || 'AI recognition failed',
            details: error.toString(),
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

// Levenshtein distance for string similarity
function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                )
            }
        }
    }

    return matrix[str2.length][str1.length]
}
