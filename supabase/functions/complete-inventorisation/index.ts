/**
 * Edge Function: complete-inventorisation
 * 
 * Purpose: Marks inventorisation session as ready for review
 * - Check 'inventory.complete' permission
 * - Calculate variances for all counted items
 * - Update session status to 'review'
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

interface CompleteInventorisationRequest {
    session_id: string
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
        const body: CompleteInventorisationRequest = await req.json()

        if (!body.session_id) {
            return new Response(
                JSON.stringify({ error: 'session_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Check permission: inventory.complete
        const { data: permissions, error: permError } = await supabaseClient
            .from('user_permissions')
            .select(`
        permission_id,
        permissions!inner (
          module,
          action
        )
      `)
            .eq('user_id', user.id)

        if (permError) {
            throw permError
        }

        const hasPermission = permissions?.some(
            p => p.permissions.module === 'inventory' && p.permissions.action === 'complete'
        )

        if (!hasPermission) {
            return new Response(
                JSON.stringify({ error: 'Insufficient permissions. You need inventory.complete permission.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Verify session exists and is active
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
                    error: `Cannot complete session. Current status is '${session.status}'. Only 'active' sessions can be completed.`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Get all inventory items and expected stock for variance calculation
        const { data: items, error: itemsError } = await supabaseClient
            .from('inventory_items')
            .select(`
        *,
        product:products (
          id,
          name,
          syrve_product_id
        ),
        expected:inventory_expected_stock!inner (
          expected_amount,
          expected_sum
        )
      `)
            .eq('global_session_id', body.session_id)

        if (itemsError) {
            throw itemsError
        }

        // 4. Calculate summary statistics
        let totalProducts = 0
        let totalCounted = 0
        let totalExpected = 0
        let totalVariance = 0
        let highVarianceCount = 0

        const varianceThreshold = 10 // 10% variance is considered high

        items?.forEach(item => {
            totalProducts++
            totalCounted += item.total_amount || 0
            totalExpected += item.expected[0]?.expected_amount || 0
            totalVariance += item.variance || 0

            const variancePercent = Math.abs(item.variance_percentage || 0)
            if (variancePercent > varianceThreshold) {
                highVarianceCount++
            }
        })

        const overallVariancePercentage = totalExpected > 0
            ? ((totalCounted - totalExpected) / totalExpected) * 100
            : 0

        // 5. Update session status to 'review'
        const { data: updatedSession, error: updateError } = await supabaseClient
            .from('global_inventory_session')
            .update({
                status: 'review',
                completed_by: user.id,
                completed_at: new Date().toISOString(),
            })
            .eq('id', body.session_id)
            .select()
            .single()

        if (updateError) {
            throw updateError
        }

        // 6. Return summary for review
        return new Response(
            JSON.stringify({
                success: true,
                session: updatedSession,
                summary: {
                    total_products: totalProducts,
                    total_counted: totalCounted,
                    total_expected: totalExpected,
                    total_variance: totalVariance,
                    variance_percentage: overallVariancePercentage.toFixed(2),
                    high_variance_items: highVarianceCount,
                    status: 'ready_for_review',
                },
                message: 'Inventorisation completed successfully. Ready for review and approval.',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )

    } catch (error) {
        console.error('Error completing inventorisation:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
