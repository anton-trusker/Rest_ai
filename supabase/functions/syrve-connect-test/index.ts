
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/cors.ts'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { server_url, api_login, api_password } = await req.json()

        if (!server_url || !api_login || !api_password) {
            return createErrorResponse("Missing required fields")
        }

        // Mock Syrve API Authentication
        // In production, this would make a POST request to ${server_url}/api/auth/login
        console.log(`Testing connection to ${server_url} for user ${api_login}`)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simple validation simulation
        if (server_url.includes('error')) {
            throw new Error("Failed to connect to Syrve server");
        }

        // Mock successful token response
        const mockToken = "mock_syrve_token_" + Math.random().toString(36).substr(2);

        return createSuccessResponse({
            success: true,
            token: mockToken,
            message: "Connection successful"
        })

    } catch (error) {
        return createErrorResponse(error.message, 500)
    }
})
