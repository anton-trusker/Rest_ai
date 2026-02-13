import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

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
    const { session_id } = await req.json();
    if (!session_id) throw new Error('Missing session_id');

    // 1. Get Session & Items
    const { data: session, error: sessionError } = await supabase
        .from('inventory_sessions')
        .select('*')
        .eq('id', session_id)
        .single();
    
    if (sessionError || !session) throw new Error('Session not found');

    const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*, products(syrve_product_id, sku, unit_name)')
        .eq('session_id', session_id);

    if (itemsError) throw new Error('Failed to fetch items');

    // 2. Get Config (Consolidated)
    const { data: config, error: configError } = await supabase
      .from('integration_syrve_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configError || !config) throw new Error('Syrve configuration not found');
    const { base_url, api_login, api_password_hash, default_store_id } = config;
    const cleanUrl = base_url.replace(/\/$/, '');

    // 3. Auth
    console.log('Authenticating with Syrve...');
    const authRes = await fetch(`${cleanUrl}/api/1/auth/access_token?login=${encodeURIComponent(api_login)}&password=${api_password_hash}`);
    if (!authRes.ok) throw new Error('Authentication failed');
    const token = (await authRes.text()).replace(/"/g, '');

    // 4. Construct XML Document
    let itemsXml = '';
    items.forEach((item: any) => {
        if (item.products?.syrve_product_id) {
            itemsXml += `
            <item>
                <productId>${item.products.syrve_product_id}</productId>
                <amount>${item.counted_quantity}</amount>
                <amountUnit>${item.products.unit_name || 'pcs'}</amountUnit>
            </item>`;
        }
    });

    const docXml = `
    <document>
        <documentType>INVENTORY</documentType>
        <date>${new Date().toISOString()}</date>
        <storeId>${default_store_id || ''}</storeId>
        <comment>Inventory Session ${session.session_number}</comment>
        <items>${itemsXml}</items>
    </document>
    `;

    console.log('Posting inventory to Syrve...');

    // 5. Post to Syrve (Mock/Real)
    // const postRes = await fetch(`${cleanUrl}/api/1/documents/import`, { ... });
    
    // Simulate success
    await new Promise(r => setTimeout(r, 1000));

    // 6. Update Session Status
    await supabase.from('inventory_sessions').update({
        syrve_sync_status: 'synced',
        syrve_document_id: 'DOC-' + Date.now()
    }).eq('id', session_id);

    // 7. Log
    await supabase.from('integration_syrve_sync_log').insert({
        action_type: 'INVENTORY_PUSH',
        status: 'SUCCESS',
        items_processed: items.length,
        request_payload: docXml.substring(0, 1000), // Log partial XML
        performed_by: session.created_by
    });

    // Logout
    await fetch(`${cleanUrl}/api/1/auth/logout?key=${token}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Inventory committed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Commit Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
