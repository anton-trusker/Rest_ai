# Phase 10: Syrve POS Integration

## Overview

Integrate with Syrve (iiko) POS system for bidirectional stock synchronization.

---

## API Endpoints

- **EU:** `https://api-eu.iiko.services`
- **RU:** `https://api-ru.iiko.services`

---

## Authentication

```typescript
// src/services/syrveService.ts
const API_BASE = "https://api-eu.iiko.services";

interface TokenResponse {
  token: string;
  tokenLifeTime: number;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const response = await fetch(`${API_BASE}/api/1/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiLogin: Deno.env.get("SYRVE_API_LOGIN") }),
  });

  const data: TokenResponse = await response.json();
  
  cachedToken = {
    value: data.token,
    expiresAt: Date.now() + (data.tokenLifeTime - 60) * 1000,
  };

  return data.token;
}
```

---

## Data Sync Operations

### Get Stock from Syrve

```typescript
export async function getSyrveStock(organizationId: string) {
  const token = await getAccessToken();

  // Get nomenclature (products)
  const response = await fetch(`${API_BASE}/api/1/nomenclature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationId }),
  });

  const { products } = await response.json();
  return products;
}

export async function syncStockWithSyrve() {
  const syrveProducts = await getSyrveStock(ORG_ID);
  
  // Get wine mappings
  const { data: mappings } = await supabase
    .from("wine_syrve_product_mappings")
    .select("wine_id, syrve_product_id");

  // Match and update
  for (const mapping of mappings) {
    const syrveProduct = syrveProducts.find(
      (p) => p.id === mapping.syrve_product_id
    );
    
    if (syrveProduct) {
      await supabase
        .from("wines")
        .update({ current_stock_unopened: syrveProduct.balance })
        .eq("id", mapping.wine_id);
    }
  }

  // Log sync
  await supabase.from("syrve_sync_logs").insert({
    sync_type: "pull",
    status: "completed",
    items_synced: mappings.length,
  });
}
```

### Push Updates to Syrve

```typescript
export async function pushStockToSyrve(sessionId: string) {
  const token = await getAccessToken();
  
  // Get session items with variances
  const { data: items } = await supabase
    .from("inventory_items")
    .select(`
      *,
      wine:wines(id, name, wine_syrve_product_mappings(syrve_product_id))
    `)
    .eq("session_id", sessionId)
    .neq("variance_total", 0);

  for (const item of items) {
    const syrveId = item.wine?.wine_syrve_product_mappings?.[0]?.syrve_product_id;
    if (!syrveId) continue;

    // Create writeoff document for negative variance
    if (item.variance_total < 0) {
      await fetch(`${API_BASE}/api/1/writeoff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: ORG_ID,
          items: [{ productId: syrveId, amount: Math.abs(item.variance_total) }],
        }),
      });
    }
  }
}
```

---

## Product Mapping

| Priority | Method |
|----------|--------|
| 1 | Match by `syrve_product_id` |
| 2 | Match by barcode |
| 3 | Fuzzy name match |
| 4 | Manual admin mapping |

---

## Edge Function

**File:** `supabase/functions/sync-syrve/index.ts`

```typescript
serve(async (req) => {
  const { action, sessionId } = await req.json();

  switch (action) {
    case "pull":
      await syncStockWithSyrve();
      break;
    case "push":
      await pushStockToSyrve(sessionId);
      break;
  }

  return new Response(JSON.stringify({ success: true }));
});
```

---

## Next Phase

→ [Phase 11: Error Handling](./phase-11-error-handling.md)
