/**
 * Edge Function: approve-inventorisation
 * 
 * Purpose: Final approval and Syrve submission
 * - Check 'inventory.approve' permission
 * - Generate Syrve XML document
 * - POST to /documents/import/incomingInventory
 * - Update session status to 'approved'
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

interface ApproveInventorisationRequest {
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
        const body: ApproveInventorisationRequest = await req.json()

        if (!body.session_id) {
            return new Response(
                JSON.stringify({ error: 'session_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Check permission: inventory.approve
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
            p => p.permissions.module === 'inventory' && p.permissions.action === 'approve'
        )

        if (!hasPermission) {
            return new Response(
                JSON.stringify({ error: 'Insufficient permissions. You need inventory.approve permission.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Verify session exists and is in review status
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

        if (session.status !== 'review') {
            return new Response(
                JSON.stringify({
                    error: `Cannot approve session. Current status is '${session.status}'. Only 'review' sessions can be approved.`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Get Syrve connection
        const { data: syrveConnection, error: syrveConnError } = await supabaseClient
            .from('syrve_connections')
            .select('*')
            .eq('is_active', true)
            .single()

        if (syrveConnError || !syrveConnection) {
            return new Response(
                JSON.stringify({ error: 'No active Syrve connection found' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 4. Get all inventory items with product details
        const { data: items, error: itemsError } = await supabaseClient
            .from('inventory_items')
            .select(`
        *,
        product:products (
          id,
          name,
          syrve_product_id
        )
      `)
            .eq('global_session_id', body.session_id)

        if (itemsError) {
            throw itemsError
        }

        if (!items || items.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No inventory items found for this session' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 5. Generate document number
        const documentNumber = `INV-${new Date().getFullYear()}-${session.id.substring(0, 8).toUpperCase()}`

        // 6. Build XML for Syrve
        const itemsXml = items
            .filter(item => item.product?.syrve_product_id) // Only include items with Syrve IDs
            .map(item => `
    <item>
      <productId>${item.product.syrve_product_id}</productId>
      <amountContainer>${item.total_amount || 0}</amountContainer>
      ${item.notes ? `<comment>${escapeXml(item.notes)}</comment>` : ''}
    </item>`)
            .join('')

        const syrveXml = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <documentNumber>${documentNumber}</documentNumber>
  <dateIncoming>${new Date().toISOString().split('.')[0]}</dateIncoming>
  <status>PROCESSED</status>
  <storeId>${session.syrve_store_id}</storeId>
  <comment>Inventorisation completed via Inventory AI system</comment>
  <items>${itemsXml}
  </items>
</document>`

        console.log('Syrve XML payload:', syrveXml)

        // 7. Submit to Syrve
        let syrveSuccess = false
        let syrveDocumentId = null
        let syrveError = null

        try {
            const syrveResponse = await fetch(
                `${syrveConnection.api_url}/documents/import/incomingInventory?key=${syrveConnection.api_token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/xml',
                    },
                    body: syrveXml,
                }
            )

            const syrveResponseText = await syrveResponse.text()
            console.log('Syrve response:', syrveResponseText)

            if (!syrveResponse.ok) {
                throw new Error(`Syrve API error: ${syrveResponse.status} - ${syrveResponseText}`)
            }

            // Parse response to get document ID
            // In a real implementation, use a proper XML parser
            syrveSuccess = syrveResponseText.includes('<valid>true</valid>')

            // Extract document number or ID from response
            const docIdMatch = syrveResponseText.match(/<documentNumber>(.*?)<\/documentNumber>/)
            if (docIdMatch) {
                syrveDocumentId = docIdMatch[1]
            }

        } catch (error) {
            console.error('Syrve submission error:', error)
            syrveError = error.message

            // Don't fail the approval if Syrve is unavailable
            // We can mark it as approved locally and retry Syrve submission later
        }

        // 8. Update current_stock table with final counts
        const stockUpdates = items.map(item => ({
            product_id: item.product_id,
            quantity: item.total_amount || 0,
            last_counted_at: new Date().toISOString(),
            last_counted_by: user.id,
        }))

        const { error: stockUpdateError } = await supabaseClient
            .from('current_stock')
            .upsert(stockUpdates, {
                onConflict: 'product_id',
            })

        if (stockUpdateError) {
            console.error('Failed to update current stock:', stockUpdateError)
            // Don't fail the entire operation
        }

        // 9. Update session to 'approved'
        const { data: approvedSession, error: approveError } = await supabaseClient
            .from('global_inventory_session')
            .update({
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                syrve_document_number: documentNumber,
                syrve_document_id: syrveDocumentId,
            })
            .eq('id', body.session_id)
            .select()
            .single()

        if (approveError) {
            throw approveError
        }

        // 10. Return success response
        return new Response(
            JSON.stringify({
                success: true,
                session: approvedSession,
                syrve_status: syrveSuccess ? 'submitted' : 'pending_retry',
                syrve_document_number: documentNumber,
                syrve_document_id: syrveDocumentId,
                syrve_error: syrveError,
                items_updated: stockUpdates.length,
                message: syrveSuccess
                    ? 'Inventorisation approved and submitted to Syrve successfully'
                    : 'Inventorisation approved locally. Syrve submission will be retried.',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )

    } catch (error) {
        console.error('Error approving inventorisation:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// Helper function to escape XML special characters
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}
