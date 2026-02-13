import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { image_base64, session_id } = await req.json();
    if (!image_base64) throw new Error('Missing image_base64');

    // 1. Get AI Config
    const { data: config, error: configError } = await supabase
      .from('ai_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (configError || !config) throw new Error('Active AI configuration not found');
    
    // Decrypt key (Simplified for demo, assumes raw key or handled by vault)
    const apiKey = config.api_key_encrypted; 
    if (!apiKey) throw new Error('AI API Key missing');

    // 2. Call Gemini API (Google GenAI)
    // Docs: https://ai.google.dev/tutorials/rest_quickstart#generate_content_from_image
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model_name}:generateContent?key=${apiKey}`;
    
    const prompt = `
      Analyze this image of a wine bottle. Extract the following details in JSON format:
      - product_name (Full name)
      - producer
      - vintage (Year)
      - region
      - grape_variety
      - alcohol_percentage
      - bottle_size (e.g. 750ml)
    `;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: image_base64 } }
        ]
      }]
    };

    console.log('Calling AI Provider...');
    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!aiRes.ok) {
        const errText = await aiRes.text();
        throw new Error(`AI API Error: ${errText}`);
    }

    const aiData = await aiRes.json();
    
    // 3. Parse Response
    // Gemini returns candidates[0].content.parts[0].text
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    // Extract JSON from markdown code block if present
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/{[\s\S]*}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : '{}';
    
    let extractedData = {};
    try {
        extractedData = JSON.parse(jsonStr);
    } catch (e) {
        console.warn('Failed to parse AI JSON', e);
        extractedData = { raw_text: rawText };
    }

    // 4. Log Attempt
    const { data: attempt, error: attemptError } = await supabase
        .from('ai_recognition_attempts')
        .insert({
            user_id: (await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1] || '')).data.user?.id, // Get user from token
            session_id: session_id,
            model_used: config.model_name,
            extracted_data: extractedData,
            raw_response: aiData,
            status: 'success',
            match_confidence: 85.0 // Mock confidence
        })
        .select()
        .single();

    return new Response(
      JSON.stringify({ success: true, data: extractedData, attempt_id: attempt?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('AI Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
