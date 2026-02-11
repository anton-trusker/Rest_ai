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

    // 3. Authenticate
    console.log(`Attempting login to ${cleanUrl} for user ${login}`);
    const authUrl = `${cleanUrl}/api/1/auth/access_token?login=${encodeURIComponent(login)}&password=${passwordHash}`;

    // Set timeout for fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const authRes = await fetch(authUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!authRes.ok) {
      const errorText = await authRes.text();
      throw new Error(`Authentication failed: ${authRes.status} ${errorText}`);
    }

    const token = await authRes.text();
    const cleanToken = token.replace(/"/g, ''); // Remove quotes if present

    if (!cleanToken || cleanToken.includes('<error>')) {
      throw new Error(`Authentication failed: ${cleanToken}`);
    }

    console.log('Authentication successful, fetching organizations...');

    // 4. Fetch Organizations/Stores
    const orgUrl = `${cleanUrl}/api/1/organization/list?key=${cleanToken}`;
    const orgRes = await fetch(orgUrl);

    if (!orgRes.ok) {
      // Try logout to be polite
      await fetch(`${cleanUrl}/api/1/auth/logout?key=${cleanToken}`);
      const errorText = await orgRes.text();
      throw new Error(`Failed to fetch organizations: ${orgRes.status} ${errorText}`);
    }

    const orgText = await orgRes.text();

    // Parse XML (Basic generic parser since we don't have XML parser in standard lib easily without import)
    // We will return the raw XML for now, or just basic regex extraction for verification
    // In a real prod app, use a proper XML parser library found in Deno/NPM

    // 5. Logout immediately (the token is just for testing)
    await fetch(`${cleanUrl}/api/1/auth/logout?key=${cleanToken}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Connection successful',
        server_version: 'Unknown', // TODO: Fetch version if needed
        raw_org_data: orgText.substring(0, 500) + "..." // truncated
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
