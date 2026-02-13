import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, login, password } = await req.json()

    if (!url || !login || !password) {
      throw new Error('Missing url, login, or password')
    }

    // 1. Clean URL
    const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash

    // 2. Hash Password (SHA1)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Authenticate (Server API)
    console.log(`Attempting login to ${cleanUrl} for user ${login}`);
    // Server API uses /auth?login=...&pass=...
    const authUrl = `${cleanUrl}/auth?login=${encodeURIComponent(login)}&pass=${passwordHash}`;

    // Set timeout for fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s

    let authRes;
    try {
      authRes = await fetch(authUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'InventoryAI/1.0',
          'Accept': '*/*'
        }
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      throw new Error(`Network request to Syrve failed: ${fetchErr.message} (URL: ${authUrl})`);
    }
    clearTimeout(timeoutId);

    if (!authRes.ok) {
      const errorText = await authRes.text();
      throw new Error(`Syrve Login Failed [${authRes.status}]: ${errorText.substring(0, 200)}`);
    }

    const token = await authRes.text();
    const cleanToken = token.replace(/["\r\n]/g, '').trim(); 

    if (!cleanToken || cleanToken.includes('<error>') || cleanToken.length < 5) {
      throw new Error(`Invalid Token Received: ${cleanToken.substring(0, 100)}`);
    }

    console.log('Authentication successful, fetching stores...');

    // 4. Fetch Stores
    // Try Server API endpoint for stores
    // Note: Some versions use /corporation/stores, others /organization/list
    let orgRes;
    let usedEndpoint = '/corporation/stores';
    
    try {
        orgRes = await fetch(`${cleanUrl}/corporation/stores?key=${cleanToken}`, {
            headers: { 'User-Agent': 'InventoryAI/1.0' }
        });
        
        if (!orgRes.ok) {
            console.log('Failed to fetch /corporation/stores, trying /organization/list');
            usedEndpoint = '/organization/list';
            orgRes = await fetch(`${cleanUrl}/organization/list?key=${cleanToken}`, {
                headers: { 'User-Agent': 'InventoryAI/1.0' }
            });
        }
    } catch (fetchErr) {
        // Try to logout even if store fetch fails
        await fetch(`${cleanUrl}/auth/logout?key=${cleanToken}`);
        throw new Error(`Network request for Stores failed: ${fetchErr.message}`);
    }

    if (!orgRes.ok) {
      await fetch(`${cleanUrl}/auth/logout?key=${cleanToken}`);
      const errorText = await orgRes.text();
      throw new Error(`Fetch Stores Failed [${orgRes.status}] (${usedEndpoint}): ${errorText.substring(0, 200)}`);
    }

    const orgText = await orgRes.text();

    // 5. Logout immediately
    await fetch(`${cleanUrl}/auth/logout?key=${cleanToken}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Connection successful',
        server_version: 'Unknown',
        raw_org_data: orgText.substring(0, 1000) // truncated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Connection Test Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
