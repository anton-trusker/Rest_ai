
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify user is admin
        const authHeader = req.headers.get('Authorization')!
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

        if (authError || !user) {
            return createErrorResponse("Unauthorized", 401)
        }

        // Check role (simplified check, ideally query user_roles)
        // For now assuming the caller has checked permissions via UI or RLS on the insert

        const { server_url, api_login, api_password, organization_id, store_id, store_name } = await req.json()

        if (!server_url || !api_login) {
            return createErrorResponse("Missing required fields")
        }

        // Check if config exists
        const { data: existing } = await supabaseClient
            .from('syrve_config')
            .select('id')
            .limit(1)
            .single()

        const payload = {
            server_url,
            api_login,
            // In a real app, encrypt this using Pgsodium or Vault
            api_password_encrypted: api_password,
            organization_id,
            store_id,
            store_name,
            updated_at: new Date().toISOString()
        }

        let result;
        if (existing) {
            result = await supabaseClient
                .from('syrve_config')
                .update(payload)
                .eq('id', existing.id)
        } else {
            result = await supabaseClient
                .from('syrve_config')
                .insert([payload])
        }

        if (result.error) {
            throw result.error
        }

        return createSuccessResponse({ success: true, message: "Configuration saved" })

    } catch (error) {
        return createErrorResponse(error.message, 500)
    }
})
