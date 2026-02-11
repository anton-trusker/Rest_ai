/**
 * Edge Function: update-inventory-count
 * 
 * Purpose: Updates product count during active inventorisation session
 * - Verifies active session exists
 * - Logs change to audit table
 * - Updates inventory_items with new values
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

interface UpdateCountRequest {
    session_id: string
    product_id: string
    full_bottles?: number
    partial_amount?: number
    notes?: string
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
        const body: UpdateCountRequest = await req.json()

        if (!body.session_id || !body.product_id) {
            return new Response(
                JSON.stringify({ error: 'session_id and product_id are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Verify session exists and is active
        const { data: session, error: sessionError } = await supabaseClient
            .from('global_inventory_session')
            .select('*')
            .eq('id', body.session_id)
            .single()

        if (sessionError || !session) {
            return new Response(
                JSON.stringify({ error: 'Session not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (session.status !== 'active') {
            return new Response(
                JSON.stringify({
                    error: `Cannot update count. Session status is '${session.status}'. Only 'active' sessions can be updated.`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Get existing inventory item (if it exists)
        const { data: existingItem, error: itemFetchError } = await supabaseClient
            .from('inventory_items')
            .select('*')
            .eq('global_session_id', body.session_id)
            .eq('product_id', body.product_id)
            .maybeSingle()

        if (itemFetchError) {
            throw itemFetchError
        }

        // 3. Get expected stock for variance calculation
        const { data: expectedStock } = await supabaseClient
            .from('inventory_expected_stock')
            .select('expected_amount')
            .eq('session_id', body.session_id)
            .eq('product_id', body.product_id)
            .maybeSingle()

        const expectedAmount = expectedStock?.expected_amount || 0

        // 4. Calculate total counted amount
        const fullBottles = body.full_bottles ?? 0
        const partialAmount = body.partial_amount ?? 0
        const totalCounted = fullBottles + partialAmount

        // Calculate variance
        const variance = totalCounted - expectedAmount
        const variancePercentage = expectedAmount > 0
            ? (variance / expectedAmount) * 100
            : 0

        // 5. Log changes to audit table
        const changeLogs = []

        if (existingItem) {
            // Log each changed field
            if (existingItem.full_bottles !== fullBottles) {
                changeLogs.push({
                    session_id: body.session_id,
                    product_id: body.product_id,
                    field_name: 'full_bottles',
                    old_value: String(existingItem.full_bottles || 0),
                    new_value: String(fullBottles),
                    changed_by: user.id,
                    ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                    user_agent: req.headers.get('user-agent'),
                })
            }

            if (existingItem.partial_amount !== partialAmount) {
                changeLogs.push({
                    session_id: body.session_id,
                    product_id: body.product_id,
                    field_name: 'partial_amount',
                    old_value: String(existingItem.partial_amount || 0),
                    new_value: String(partialAmount),
                    changed_by: user.id,
                    ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                    user_agent: req.headers.get('user-agent'),
                })
            }

            if (existingItem.notes !== body.notes) {
                changeLogs.push({
                    session_id: body.session_id,
                    product_id: body.product_id,
                    field_name: 'notes',
                    old_value: existingItem.notes || '',
                    new_value: body.notes || '',
                    changed_by: user.id,
                    ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                    user_agent: req.headers.get('user-agent'),
                })
            }
        } else {
            // New item - log creation
            changeLogs.push({
                session_id: body.session_id,
                product_id: body.product_id,
                field_name: 'created',
                old_value: null,
                new_value: `full_bottles: ${fullBottles}, partial_amount: ${partialAmount}`,
                changed_by: user.id,
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                user_agent: req.headers.get('user-agent'),
            })
        }

        // Insert change logs
        if (changeLogs.length > 0) {
            const { error: logError } = await supabaseClient
                .from('inventory_change_log')
                .insert(changeLogs)

            if (logError) {
                console.error('Failed to log changes:', logError)
                // Don't fail the entire operation if logging fails
            }
        }

        // 6. Upsert inventory_items
        const itemData = {
            global_session_id: body.session_id,
            product_id: body.product_id,
            full_bottles: fullBottles,
            partial_amount: partialAmount,
            total_amount: totalCounted,
            expected_amount: expectedAmount,
            variance: variance,
            variance_percentage: variancePercentage,
            notes: body.notes,
            last_updated_by: user.id,
            last_updated_at: new Date().toISOString(),
        }

        const { data: updatedItem, error: upsertError } = await supabaseClient
            .from('inventory_items')
            .upsert(itemData, {
                onConflict: 'global_session_id,product_id',
            })
            .select()
            .single()

        if (upsertError) {
            throw upsertError
        }

        // 7. Return success response
        return new Response(
            JSON.stringify({
                success: true,
                item: updatedItem,
                changes_logged: changeLogs.length,
                variance: {
                    amount: variance,
                    percentage: variancePercentage.toFixed(2),
                    status: Math.abs(variancePercentage) > 10 ? 'high' : 'normal',
                },
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )

    } catch (error) {
        console.error('Error updating inventory count:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
