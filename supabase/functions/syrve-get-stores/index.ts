
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { server_url, api_login, api_password } = await req.json()

        // In production, we might fetch credentials from DB if not provided
        // For now, we expect them in the body or we can fetch them if missing

        // Mock Store Data
        const mockStores = [
            { id: 'store_001', name: 'Main Bar' },
            { id: 'store_002', name: 'Rooftop Lounge' },
            { id: 'store_003', name: 'Basement Speakeasy' }
        ]

        console.log(`Fetching stores from ${server_url}`)
        await new Promise(resolve => setTimeout(resolve, 800));

        return createSuccessResponse({
            success: true,
            stores: mockStores
        })

    } catch (error) {
        return createErrorResponse(error.message, 500)
    }
})
