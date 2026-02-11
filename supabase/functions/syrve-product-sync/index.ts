import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: Basic XML Parser (Node/Deno friendly without external deps if simple structure)
// For complex XML, better to use a library, but since we can't easily npm install here without import map setup,
// we'll do a robust regex extraction for MVP or use a CDN import if needed.
// Actually, let's try to use a regex approach for now as it's cleaner than huge deps.
// The structure is predictable: <productGroup>...</productGroup>, <product>...</product>

function extractTagContent(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'g');
  const matches = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function extractValue(xmlSnippet: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`);
  const match = regex.exec(xmlSnippet);
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
    // 1. Get Config
    const { data: config, error: configError } = await supabase
      .from('syrve_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) throw new Error('Syrve configuration not found');
    if (!config.api_password_encrypted) throw new Error('API password missing');

    const { server_url, api_login, api_password_encrypted } = config;
    const cleanUrl = server_url.replace(/\/$/, '');

    // 2. Auth
    console.log('Authenticating with Syrve...');
    // Hash Password
    const encoder = new TextEncoder();
    const data = encoder.encode(api_password_encrypted);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const authRes = await fetch(`${cleanUrl}/api/1/auth/access_token?login=${encodeURIComponent(api_login)}&password=${passwordHash}`);
    if (!authRes.ok) throw new Error('Authentication failed');
    const token = (await authRes.text()).replace(/"/g, '');

    // 3. Fetch Nomenclature
    console.log('Fetching nomenclature...');
    // If we have a store_id/org_id, we could filter, but usually we want all products
    // Determine organization ID if available, else fetch for user
    const nomRes = await fetch(`${cleanUrl}/api/1/nomenclature?key=${token}`);
     if (!nomRes.ok) throw new Error('Failed to fetch nomenclature');
    const xmlData = await nomRes.text();

    // 4. Parse & Upsert Categories (Product Groups)
    // <productGroup>
    //   <id>UUID</id>
    //   <name>Name</name>
    //   <parentGroup>UUID</parentGroup> (optional)
    // </productGroup>
    
    // Naive Regex approach for MVP - acceptable for flat lists or simple trees
    // Splitting by <productGroup> first
    
    // We need to robustly parse the XML. 
    // Since regex parsing HTML/XML is fragile, limits apply. 
    // For MVP, we assume standard iiko API structure.
    
    const groupMatches = xmlData.match(/<productGroup>[\s\S]*?<\/productGroup>/g) || [];
    const productMatches = xmlData.match(/<product>[\s\S]*?<\/product>/g) || [];

    console.log(`Found ${groupMatches.length} groups and ${productMatches.length} products`);

    let categoriesSynced = 0;
    let productsSynced = 0;

    // --- Process Categories ---
    for (const groupXml of groupMatches) {
        const id = extractValue(groupXml, 'id');
        const name = extractValue(groupXml, 'name');
        const parentId = extractValue(groupXml, 'parentGroup');
        const order = parseInt(extractValue(groupXml, 'order') || '0');

        if (id && name) {
            const { error } = await supabase.from('categories').upsert({
                syrve_group_id: id,
                name: name,
                syrve_parent_group_id: parentId, // We sync this, trigger/logic can resolve local parent_id later
                sort_order: order,
                synced_at: new Date().toISOString() // Fixed: calling toISOString()
            }, { onConflict: 'syrve_group_id' });

            if (!error) categoriesSynced++;
        }
    }

    // Fix Parent IDs (Self-join update)
    // Call a stored procedure or do a second pass? 
    // Let's rely on `syrve_parent_group_id` for now, application layer handles tree building.
    // Ideally we run a SQL update: UPDATE categories c SET parent_id = p.id FROM categories p WHERE c.syrve_parent_group_id = p.syrve_group_id;
    // We can do this via RPC or a raw query if enabled, or simple update loop.
    // For now, let's assume the frontend uses recursive lookups or we add a SQL function.
    
    // --- Process Products ---
    const productsBatch = [];
    
    for (const productXml of productMatches) {
        const id = extractValue(productXml, 'id');
        const name = extractValue(productXml, 'name');
        const num = extractValue(productXml, 'num'); // SKU
        const parentGroup = extractValue(productXml, 'parentGroup');
        const type = extractValue(productXml, 'type'); // GOODS, DISH, etc.
        const unit = extractValue(productXml, 'mainUnit'); // Assume name for now
        
        // Price (simplified extraction)
        // <price> <value>100</value> </price> ??? iiko/Syrve structure varies. 
        // Usually nested in <priceCategories>??
        // For MVP, set 0 if not easily found.
        
        if (id && name) {
             // Map to our DB
             // First find local category ID
             let categoryId = null;
             if (parentGroup) {
                const { data: cat } = await supabase.from('categories').select('id').eq('syrve_group_id', parentGroup).maybeSingle();
                if (cat) categoryId = cat.id;
             }

             productsBatch.push({
                 syrve_product_id: id,
                 name: name,
                 sku: num,
                 category_id: categoryId,
                 syrve_group_id: parentGroup,
                 product_type: type,
                 unit_name: unit,
                 syrve_data: { raw_xml: productXml.substring(0, 1000) }, // Store snippet or parsed obj
                 synced_at: new Date().toISOString()
             });
        }
    }

    // Bulk Upsert Products (chunking 100 at a time)
    const chunkSize = 100;
    for (let i = 0; i < productsBatch.length; i += chunkSize) {
        const chunk = productsBatch.slice(i, i + chunkSize);
        const { error } = await supabase.from('products').upsert(chunk, { onConflict: 'syrve_product_id' });
        if (!error) productsSynced += chunk.length;
        else console.error('Product sync error:', error);
    }
    
    // 5. Log Success
    await supabase.from('syrve_sync_logs').insert({
        operation: 'product_sync',
        status: 'success',
        products_created: productsSynced,
        categories_synced: categoriesSynced,
        details: { message: `Synced ${productsSynced} products and ${categoriesSynced} categories` }
    });

    // 6. Update Config Status
    await supabase.from('syrve_config').update({
        last_product_sync_at: new Date().toISOString(),
        last_sync_products_count: productsSynced,
        last_sync_categories_count: categoriesSynced
    }).eq('id', config.id);

    // 7. Logout
    await fetch(`${cleanUrl}/api/1/auth/logout?key=${token}`);

    return new Response(
      JSON.stringify({ success: true, products: productsSynced, categories: categoriesSynced }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync Error:', error);
    
    // Log Failure
    const { error: logError } = await supabase
       .from('syrve_sync_logs')
       .insert({
          operation: 'product_sync',
          status: 'failed',
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
