import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: robust XML value extractor
function extractTagValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
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
    // 1. Get Config (New Table)
    const { data: config, error: configError } = await supabase
      .from('integration_syrve_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configError || !config) throw new Error('Syrve configuration not found');
    if (!config.api_password_hash) throw new Error('API password hash missing');

    const { base_url, api_login, api_password_hash } = config;
    const cleanUrl = base_url.replace(/\/$/, '');

    // 2. Auth
    console.log('Authenticating with Syrve...');
    // Note: If hash is already stored, use it. If not, might need to hash plain password.
    // Assuming stored as hash for now based on migration comment.
    
    const authRes = await fetch(`${cleanUrl}/api/1/auth/access_token?login=${encodeURIComponent(api_login)}&password=${api_password_hash}`);
    if (!authRes.ok) throw new Error('Authentication failed');
    const token = (await authRes.text()).replace(/"/g, '');

    // 3. Fetch Nomenclature
    console.log('Fetching nomenclature...');
    const nomRes = await fetch(`${cleanUrl}/api/1/nomenclature?key=${token}`);
     if (!nomRes.ok) throw new Error('Failed to fetch nomenclature');
    const xmlData = await nomRes.text();

    // 4. Parse & Upsert to Integration Layer
    const groupMatches = xmlData.match(/<productGroup>[\s\S]*?<\/productGroup>/g) || [];
    const productMatches = xmlData.match(/<product>[\s\S]*?<\/product>/g) || [];

    console.log(`Found ${groupMatches.length} groups and ${productMatches.length} products`);

    let itemsProcessed = 0;

    // --- Categories (Groups) ---
    // We map Syrve Groups to local Categories
    for (const groupXml of groupMatches) {
        const id = extractTagValue(groupXml, 'id');
        const name = extractTagValue(groupXml, 'name');
        const parentId = extractTagValue(groupXml, 'parentGroup');
        const orderStr = extractTagValue(groupXml, 'order');
        const order = orderStr ? parseInt(orderStr) : 0;

        if (id && name) {
            await supabase.from('categories').upsert({
                syrve_group_id: id,
                name: name,
                syrve_parent_group_id: parentId,
                sort_order: order,
                updated_at: new Date().toISOString()
            }, { onConflict: 'syrve_group_id' });
        }
    }

    // --- Products ---
    const productsBatch = [];
    const syrveProductsBatch = [];
    
    // Cache categories for lookup
    const { data: allCategories } = await supabase.from('categories').select('id, syrve_group_id');
    const categoryMap = new Map();
    if (allCategories) {
        allCategories.forEach(c => categoryMap.set(c.syrve_group_id, c.id));
    }

    for (const productXml of productMatches) {
        const id = extractTagValue(productXml, 'id');
        const name = extractTagValue(productXml, 'name');
        const num = extractTagValue(productXml, 'num'); // SKU
        const parentGroup = extractTagValue(productXml, 'parentGroup');
        const type = extractTagValue(productXml, 'type');
        const unit = extractTagValue(productXml, 'mainUnit');
        const priceStr = extractTagValue(productXml, 'price'); // Hypothetical field
        
        if (id && name) {
             const localCategoryId = parentGroup ? categoryMap.get(parentGroup) : null;
             
             // 1. Prepare Integration Layer Record
             syrveProductsBatch.push({
                 syrve_product_id: id,
                 name: name,
                 product_code: num,
                 measure_unit: unit,
                 product_type: type,
                 price: priceStr ? parseFloat(priceStr) : 0,
                 syrve_parent_group_id: parentGroup,
                 raw_data: { xml_snippet: productXml.substring(0, 500) },
                 last_synced_at: new Date().toISOString()
             });

             // 2. Prepare Base Product Record
             // We use syrve_product_id as the unique key to map to local products
             productsBatch.push({
                 syrve_product_id: id,
                 name: name,
                 sku: num,
                 category_id: localCategoryId,
                 unit_name: unit,
                 product_type: type,
                 is_active: true,
                 synced_at: new Date().toISOString()
             });
        }
    }

    // Batch Upsert: Integration Layer
    // Using chunking to avoid request size limits
    const chunkSize = 50;
    
    for (let i = 0; i < syrveProductsBatch.length; i += chunkSize) {
        const chunk = syrveProductsBatch.slice(i, i + chunkSize);
        await supabase.from('integration_syrve_products').upsert(chunk, { onConflict: 'syrve_product_id' });
    }

    // Batch Upsert: Base Products
    for (let i = 0; i < productsBatch.length; i += chunkSize) {
        const chunk = productsBatch.slice(i, i + chunkSize);
        const { data: upsertedProducts, error } = await supabase
            .from('products')
            .upsert(chunk, { onConflict: 'syrve_product_id' })
            .select('id, name');
            
        if (!error && upsertedProducts) {
            itemsProcessed += upsertedProducts.length;
            
            // Auto-create Wine entries for new products if they don't exist
            // This ensures every product has a corresponding wine entry for detailed editing
            const wineInserts = upsertedProducts.map(p => ({
                product_id: p.id,
                // Simple heuristic: Try to extract vintage from name
                vintage: (p.name.match(/\b(19|20)\d{2}\b/) || [])[0] ? parseInt((p.name.match(/\b(19|20)\d{2}\b/) || [])[0]) : null
            }));
            
            if (wineInserts.length > 0) {
                await supabase.from('wines').upsert(wineInserts, { onConflict: 'product_id', ignoreDuplicates: true });
            }
        } else {
            console.error('Product sync error:', error);
        }
    }
    
    // 5. Log Success
    await supabase.from('integration_syrve_sync_log').insert({
        action_type: 'CATALOG_SYNC',
        status: 'SUCCESS',
        items_processed: itemsProcessed,
        duration_ms: 0, // TODO: measure time
        request_payload: 'Scheduled Sync'
    });

    // 6. Logout
    await fetch(`${cleanUrl}/api/1/auth/logout?key=${token}`);

    return new Response(
      JSON.stringify({ success: true, items_processed: itemsProcessed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync Error:', error);
    
    // Log Failure
    await supabase
       .from('integration_syrve_sync_log')
       .insert({
          action_type: 'CATALOG_SYNC',
          status: 'ERROR',
          error_message: error.message
       });

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
