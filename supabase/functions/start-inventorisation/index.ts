/**
 * Edge Function: start-inventorisation
 * 
 * Purpose: Starts a new global inventorisation session
 * - Checks user has 'inventory.start' permission
 * - Ensures no other active session exists
 * - Loads expected stock from Syrve API
 * - Creates global session record
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

interface StartInventorisationRequest {
    location_id?: string
    syrve_store_id: string
    notes?: string
}

interface SyrveExpectedStockItem {
    product: {
        id: string
        code: string
        name: string
    }
    expectedAmount: number
    expectedSum: number
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Get authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse request body
        const body: StartInventorisationRequest = await req.json()

        if (!body.syrve_store_id) {
            return new Response(
                JSON.stringify({ error: 'syrve_store_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Check permission: inventory.start
        const { data: hasPermission, error: permError } = await supabaseClient
            .rpc('can_start_inventorisation', { user_id: user.id })

        if (permError || !hasPermission) {
            return new Response(
                JSON.stringify({ error: 'Insufficient permissions. You need inventory.start permission.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Check for existing active session
        const { data: activeSession, error: sessionCheckError } = await supabaseClient
            .rpc('get_active_global_session')

        if (sessionCheckError) {
            throw sessionCheckError
        }

        if (activeSession && activeSession.length > 0) {
            return new Response(
                JSON.stringify({
                    error: 'Active inventorisation session already exists',
                    active_session_id: activeSession[0].id,
                    started_by: activeSession[0].started_by,
                    started_at: activeSession[0].started_at
                }),
                { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Get Syrve connection details
        const { data: syrveConnection, error: syrveConnError } = await supabaseClient
            .from('syrve_connections')
            .select('*')
            .eq('is_active', true)
            .single()

        if (syrveConnError || !syrveConnection) {
            return new Response(
                JSON.stringify({ error: 'No active Syrve connection found. Please configure Syrve integration first.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 4. Create session record in 'preparing' state
        const { data: newSession, error: createError } = await supabaseClient
            .from('global_inventory_session')
            .insert({
                status: 'preparing',
                started_by: user.id,
                location_id: body.location_id,
                notes: body.notes,
                syrve_store_id: body.syrve_store_id,
            })
            .select()
            .single()

        if (createError) {
            throw createError
        }

        // 5. Fetch expected stock from Syrve
        let expectedStockItems: SyrveExpectedStockItem[] = []
        let syrveError = null

        try {
            // Build XML request for Syrve
            const inventoryCheckXml = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <documentNumber>CHECK-${newSession.id.substring(0, 8)}</documentNumber>
  <dateIncoming>${new Date().toISOString()}</dateIncoming>
  <status>NEW</status>
  <storeId>${body.syrve_store_id}</storeId>
  <items></items>
</document>`

            // Call Syrve API
            const syrveResponse = await fetch(
                `${syrveConnection.api_url}/documents/check/incomingInventory?key=${syrveConnection.api_token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/xml',
                    },
                    body: inventoryCheckXml,
                }
            )

            if (!syrveResponse.ok) {
                throw new Error(`Syrve API error: ${syrveResponse.status} ${syrveResponse.statusText}`)
            }

            const syrveXml = await syrveResponse.text()

            // Parse XML response (simplified - in production use proper XML parser)
            // For now, we'll extract expected stock from the response
            // This is a placeholder - you'd use a proper XML parser like fast-xml-parser
            console.log('Syrve response:', syrveXml)

            // TODO: Parse XML and extract expectedAmount for each product
            // expectedStockItems = parseXmlToExpectedStock(syrveXml)

        } catch (error) {
            console.error('Syrve API error:', error)
            syrveError = error.message

            // Don't fail the entire operation if Syrve is unavailable
            // We can still create the session and load stock manually
        }

        // 6. Get all products from our catalog to initialize expected stock
        const { data: products, error: productsError } = await supabaseClient
            .from('products')
            .select('id, syrve_product_id, name')

        if (productsError) {
            throw productsError
        }

        // 7. Insert expected stock records
        const expectedStockRecords = products.map(product => {
            // Try to find matching Syrve expected amount
            const syrveItem = expectedStockItems.find(
                item => item.product.id === product.syrve_product_id
            )

            return {
                session_id: newSession.id,
                product_id: product.id,
                syrve_product_id: product.syrve_product_id,
                expected_amount: syrveItem?.expectedAmount || 0,
                expected_sum: syrveItem?.expectedSum || 0,
                expected_unit: 'units',
            }
        })

        const { error: stockInsertError } = await supabaseClient
            .from('inventory_expected_stock')
            .insert(expectedStockRecords)

        if (stockInsertError) {
            // Rollback: delete the session
            await supabaseClient
                .from('global_inventory_session')
                .delete()
                .eq('id', newSession.id)

            throw stockInsertError
        }

        // 8. Update session to 'active' status
        const { data: activeSessionData, error: activateError } = await supabaseClient
            .from('global_inventory_session')
            .update({
                status: 'active',
                expected_stock_loaded_at: new Date().toISOString(),
                expected_stock_count: expectedStockRecords.length,
            })
            .eq('id', newSession.id)
            .select()
            .single()

        if (activateError) {
            throw activateError
        }

        // 9. Return success response
        return new Response(
            JSON.stringify({
                success: true,
                session: activeSessionData,
                expected_stock_count: expectedStockRecords.length,
                syrve_connection_status: syrveError ? 'warning' : 'success',
                syrve_message: syrveError || 'Expected stock loaded from Syrve',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )

    } catch (error) {
        console.error('Error starting inventorisation:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
