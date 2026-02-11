# 07 — Implementation Roadmap

## Key Change: Syrve-First Approach

The roadmap is restructured to prioritize **Syrve connectivity and data import** before any other feature. Without Syrve connection, the app has no product data.

---

## Phase Overview

| Phase | Name | Duration | Dependencies | Status |
|-------|------|----------|--------------|--------|
| **1** | Supabase Project Setup | 1 day | None | ❌ Blocked (project ID) |
| **2** | Database Schema (Universal) | 2 days | Phase 1 | ❌ Not started |
| **3** | Authentication & Auth Guard | 1 day | Phase 2 | ❌ Not started |
| **4** | **Syrve Connection UI + Edge Functions** | 3 days | Phase 3 | ❌ Not started |
| **5** | **Syrve Product/Category Sync** | 3 days | Phase 4 | ❌ Not started |
| **6** | Product Catalog (Generic) | 2 days | Phase 5 | ❌ Not started |
| **7** | Barcode Scanner Integration | 1 day | Phase 6 | ❌ Not started |
| **8** | Inventory Session Backend | 3 days | Phase 6 | ❌ Not started |
| **9** | AI Recognition (Generic) | 2 days | Phase 6 | ❌ Not started |
| **10** | Syrve Inventory Commit | 2 days | Phase 8 | ❌ Not started |
| **11** | Dashboard & Reports | 2 days | Phase 8 | ❌ Not started |
| **12** | UI Polish & Enhancements | 3 days | Phase 6 | ❌ Not started |
| **13** | Notifications & Realtime | 2 days | Phase 8 | ❌ Not started |
| **14** | Testing & QA | 3 days | Phase 12 | ❌ Not started |
| **15** | Deployment | 1 day | Phase 14 | ❌ Not started |

**Total: ~31 working days**

---

## Dependency Graph

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 ─┬→ Phase 7
                                                               ├→ Phase 8 ─┬→ Phase 10
     ★ CRITICAL PATH: Syrve must work before               ├→ Phase 9  ├→ Phase 11
        any product data is available                         └→ Phase 12 ├→ Phase 13
                                                                          └→ Phase 14 → Phase 15
```

---

## Phase Details

### Phase 1: Supabase Project Setup

**Blocker**: Resolve project ID mismatch in `.env`.

**Deliverables**:
- Working Supabase project
- Correct credentials in `.env`
- Storage bucket `inventory-images`

---

### Phase 2: Database Schema (Universal Model)

**Deliverables**:
- `syrve_config` table (admin connection settings)
- `categories` table (from Syrve groups, hierarchical)
- `products` table (generic, with `syrve_data` JSONB)
- `product_barcodes` table
- `inventory_sessions`, `inventory_items`, `inventory_movements`
- `syrve_sync_logs`
- `profiles`, `audit_logs`
- RLS policies on all tables
- `pg_trgm` extension for fuzzy search
- Database functions (`search_products_fuzzy`)
- Triggers (user creation, stock update, audit)

---

### Phase 3: Authentication & Auth Guard

**Deliverables**:
- Supabase Auth login flow
- `ProtectedRoute` component with role checking
- Profile creation trigger

---

### Phase 4: Syrve Connection UI + Edge Functions ⭐ NEW

**This is the most critical new phase.** Admin must be able to connect to Syrve before anything else works.

**Deliverables**:
- **`/settings/syrve` page** — connection form UI
- **Edge Function: `syrve-connect-test`** — tests URL + credentials, returns stores
- **Connection test button** — with loading state and result display
- **Store selector** — dropdown from test results
- **Save config** — encrypted password storage
- **`syrveConfigStore`** — Zustand store for config state
- **Connection status indicator** — in app header

---

### Phase 5: Syrve Product/Category Sync ⭐ NEW

**Deliverables**:
- **Edge Function: `syrve-product-sync`** — full sync logic
- **Category sync** — Syrve product groups → `categories` table (hierarchical)
- **Product sync** — Syrve products → `products` table (with `syrve_data` JSONB)
- **Barcode sync** — Syrve barcodes → `product_barcodes` table
- **Sync status UI** — progress indicator, result summary
- **Sync history** — logged to `syrve_sync_logs`
- **Auto-sync scheduling** — configurable cron interval

---

### Phase 6: Product Catalog (Generic)

**Deliverables**:
- Rename `WineCatalog` → `ProductCatalog`
- `productStore` replaces `wineStore`
- Dynamic category tabs from `categories` table
- Category tree sidebar filter
- Generic product cards and detail pages
- `syrve_data` JSONB field renderer for category-specific attributes
- Remove ALL wine-specific hardcoding

---

### Phase 7: Barcode Scanner Integration

**Deliverables**:
- Barcode lookup against `product_barcodes` table
- Works for ANY product (not just wine)
- "Not found" → manual search

---

### Phase 8: Inventory Session Backend

**Deliverables**:
- Session lifecycle (create → items → complete → stock update)
- Category-aware session filtering
- Collaborative counting (additive, multi-user)
- Variance calculation
- Movement audit trail
- Session expiry cleanup

---

### Phase 9: AI Recognition (Generic)

**Deliverables**:
- Edge Function: `ai-recognize` with category-aware prompt
- Generic product matching pipeline
- Confidence-based UI display
- Image storage in Supabase Storage

---

### Phase 10: Syrve Inventory Commit

**Deliverables**:
- Edge Function: `syrve-inventory-commit`
- XML document builder
- Session-to-Syrve submission
- Response handling and logging
- "Send to Syrve" button on session review

---

### Phase 11-15: Dashboard, Polish, Testing, Deployment

Standard phases — updated with generic product model and Syrve status indicators.

---

## Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Supabase project mismatch** | Critical — blocks everything | Resolve first |
| **Syrve server unreachable from Edge Functions** | Critical — no data | Test network path; consider VPN/tunneling |
| **Syrve credentials unknown** | High — blocks Phase 4-5 | Admin provides via UI; document requirements |
| **Large product catalog (>5K)** | Medium — sync performance | Batch processing; incremental sync |
| **Complex Syrve group hierarchy** | Medium — UI complexity | Limit tree depth; collapse deep branches |
| **Category-specific attributes** | Medium — rendering challenge | `syrve_data` JSONB with dynamic renderer |
| **Syrve API license limits** | Medium — blocks operations | Try/finally pattern; monitor usage |
| **Syrve server version differences** | Low — API changes | Version detection on connect; adapter pattern |

---

## Migration from Wine-Specific to Universal

### Database Changes

| Old | New |
|-----|-----|
| `wines` | `products` |
| `wine_barcodes` | `product_barcodes` |
| `wine_images` | `product_images` |
| `wine_producers` | Absorbed into `syrve_data` JSONB |
| `wine_variants` | Absorbed into `syrve_data` JSONB |
| `wine_type_enum` | Replaced by dynamic `categories` |
| — | `syrve_config` (NEW) |
| — | `categories` (NEW, from Syrve) |
| — | `products.syrve_data` JSONB (NEW) |

### Frontend Renames

| Old Component | New Component |
|---------------|---------------|
| `WineCatalog.tsx` | `ProductCatalog.tsx` |
| `WineDetail.tsx` | `ProductDetail.tsx` |
| `WineForm.tsx` | Remove (products come from Syrve) |
| `WineCard.tsx` | `ProductCard.tsx` |
| `wineStore.ts` | `productStore.ts` |
| — | `SyrveConnection.tsx` (NEW) |
| — | `syrveConfigStore.ts` (NEW) |
| — | `CategoryTree.tsx` (NEW) |
