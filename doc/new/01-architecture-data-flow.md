# 01 — Application Architecture & Data Flow

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 18)                       │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────────────┐  │
│  │  Pages   │──│ Components│──│  Zustand Stores            │  │
│  │ (18 rts) │  │  (66+)    │  │  ├─ authStore              │  │
│  └──────────┘  └───────────┘  │  ├─ inventoryStore         │  │
│       │             │         │  ├─ productStore (was wine) │  │
│       ▼             ▼         │  ├─ settingsStore           │  │
│  ┌─────────────────────────┐  │  ├─ syrveConfigStore       │  │
│  │  React Query (TanStack) │  │  └─ themeStore              │  │
│  │  Queries + Mutations    │  └───────────────────────────┘  │
│  └─────────┬───────────────┘                                  │
└────────────┼──────────────────────────────────────────────────┘
             │ HTTPS / WebSocket
             ▼
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE PLATFORM                          │
│  ┌──────────┐  ┌───────────┐  ┌─────────────────────────┐   │
│  │PostgreSQL│  │   Auth    │  │    Edge Functions        │   │
│  │          │  │ (JWT/RLS) │  │  ├─ syrve-connect-test   │   │
│  │ Tables:  │  └───────────┘  │  ├─ syrve-product-sync   │   │
│  │ products │                 │  ├─ syrve-inventory-commit│   │
│  │ categories│ ┌───────────┐  │  ├─ ai-recognize          │   │
│  │ syrve_   │  │ Storage  │  │  └─ notifications          │   │
│  │  config  │  │ (images) │  └─────────────────────────┘   │
│  │ sessions │  └───────────┘           │                     │
│  └──────────┘  ┌───────────┐           │                     │
│                │ Realtime  │           │                     │
│                └───────────┘           │                     │
└────────────────────────────────────────┼─────────────────────┘
                                         │ HTTPS (XML/JSON)
                                         ▼
                              ┌──────────────────────┐
                              │   SYRVE SERVER API    │
                              │   (master data)       │
                              │  ├─ /auth             │
                              │  ├─ /products (ALL)   │
                              │  ├─ /product groups   │
                              │  ├─ /stores           │
                              │  └─ /documents        │
                              └──────────────────────┘
```

---

## Data Flow: Syrve as Primary Data Source

### Initial Setup Flow (First Time)

```
1. Admin deploys app → logs in
2. Admin opens Settings → Syrve Connection
3. Admin enters:
   - Server URL (e.g. http://192.168.1.100:8080)
   - API Login
   - API Password
4. Admin clicks "Test Connection"
   → Edge Function: syrve-connect-test
   → Tries login/logout cycle
   → Returns: success + server info (stores list, version)
5. If success:
   - Admin selects target Store from dropdown
   - Admin clicks "Save & Connect"
   - Credentials stored in syrve_config table (password hashed)
6. Admin clicks "Sync Products"
   → Edge Function: syrve-product-sync
   → Fetches ALL product groups → stored as categories
   → Fetches ALL products → stored as products
   → Maps Syrve units, prices, barcodes
   → Returns summary: X categories, Y products synced
7. App is now ready for inventory counting
```

### Ongoing Data Flow

```
SYRVE → APP (Product Sync):
  Triggered by: Admin manual sync OR scheduled cron
  1. Fetch product groups → upsert categories
  2. Fetch products → upsert products
  3. New products: created in app
  4. Changed products: updated in app
  5. Deleted products: soft-deleted in app

APP → SYRVE (Inventory Results):
  Triggered by: Admin approves session → clicks "Send to Syrve"
  1. Aggregate session items by product
  2. Build Syrve inventory document (XML)
  3. Submit to Syrve
  4. Log result
```

---

## Frontend Layer

### Pages (Updated for Universal Inventory)

| Route | Component | Role | Purpose |
|-------|-----------|------|---------|
| `/login` | `Login.tsx` | Public | Email/password authentication |
| `/dashboard` | `Dashboard.tsx` | All | KPIs, recent activity, quick actions |
| `/catalog` | `ProductCatalog.tsx` | All | Browse/filter/search ALL products (any category) |
| `/catalog/:id` | `ProductDetail.tsx` | All | View product details + movements |
| `/count` | `InventoryCount.tsx` | All | Start/execute inventory count |
| `/stock` | `CurrentStock.tsx` | Admin | Real-time stock levels (hidden from Staff) |
| `/history` | `InventoryHistory.tsx` | All | Audit log |
| `/sessions` | `SessionReview.tsx` | Admin | Review/approve count sessions |
| `/users` | `UserManagement.tsx` | Admin | User CRUD + role assignment |
| `/reports` | `Reports.tsx` | Admin | Analytics + export |
| `/settings` | `AppSettings.tsx` | Admin | App configuration hub |
| `/settings/syrve` | `SyrveConnection.tsx` | Admin | **NEW**: Syrve server configuration + test |
| `/settings/general` | `GeneralSettings.tsx` | Admin | Business name, thresholds |
| `/settings/roles` | `RolesPermissions.tsx` | Admin | Role definitions |
| `/profile` | `Profile.tsx` | All | Personal info, preferences |

### Zustand Stores

#### `productStore.ts` (replaces `wineStore.ts`)
```
State:
  - products: Product[]         ← Synced from Syrve
  - categories: Category[]     ← Synced from Syrve product groups
  - filters: FilterState
  - sortConfig: SortConfig

Actions:
  - loadProducts() → from Supabase (originally from Syrve)
  - loadCategories() → from Supabase (originally from Syrve)
  - searchProducts(query) → full-text filter across all categories
  - getProductsByCategory(categoryId) → filtered view
```

#### `syrveConfigStore.ts` (NEW)
```
State:
  - config: SyrveConfig | null
  - connectionStatus: 'disconnected' | 'testing' | 'connected' | 'error'
  - lastSyncAt: Date | null
  - syncInProgress: boolean

Actions:
  - loadConfig() → from syrve_config table
  - testConnection(url, login, password) → calls syrve-connect-test
  - saveConfig(config) → saves to syrve_config table
  - triggerSync() → calls syrve-product-sync
  - getSyncStatus() → checks last sync log
```

#### Other stores remain similar but with generic naming:
- `authStore.ts` — unchanged
- `inventoryStore.ts` — unchanged (works with products instead of wines)
- `settingsStore.ts` — locations, units, roles (many settings now come from Syrve)
- `themeStore.ts` — unchanged

---

## Key Data Flow Patterns

### 1. Product Catalog (Syrve-Driven)

```
Initial Load:
  Syrve products → syrve-product-sync Edge Function → products table → React Query → UI

Ongoing:
  User opens /catalog
  → useProducts() hook → supabase.from('products').select('*, categories(*)')
  → Filter by category, search by name/barcode/SKU
  → Category tabs or sidebar filter (dynamic from Syrve groups)
```

### 2. Inventory Count (Category-Agnostic)

```
Same core flow as before, but works with ANY product:

1. Setup: Select count type + optional category/location filter
2. Scan: Barcode scan works for ANY product barcode (not just wine)
3. AI: Image recognition identifies any product type
4. Quantity: Enter quantities (units configurable per product from Syrve)
5. Complete: Aggregate, calculate variance, update stock
```

### 3. Syrve Connection Setup

```
Admin → Settings → Syrve Connection
  ┌──────────────────────────────────────┐
  │  🔌 Syrve Server Connection           │
  │                                       │
  │  Server URL: [http://192.168.1.100:8080]│
  │  Login:      [apiuser_________]        │
  │  Password:   [••••••••________]        │
  │                                       │
  │  [🔍 Test Connection]                  │
  │                                       │
  │  ✅ Connected! Server v7.8.2           │
  │  Available stores:                     │
  │  ● Main Warehouse                     │
  │  ○ Bar Storage                        │
  │  ○ Kitchen Storage                    │
  │                                       │
  │  [Save Configuration]                  │
  └──────────────────────────────────────┘
```

---

## Authentication & Authorization

### Role Enforcement (unchanged conceptually)

```
Admin:
  - Full CRUD on all tables
  - Can view current stock (/stock)
  - Can configure Syrve connection (/settings/syrve)
  - Can trigger product sync
  - Can approve/flag sessions
  - Can send inventory to Syrve

Staff:
  - Can start inventory sessions
  - Can scan and count ANY product type
  - Can view own history only
  - CANNOT view current stock (prevents bias)
  - CANNOT access Syrve settings
```

---

## Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| **Syrve Connection** | Test before save; clear error messages; retry with backoff |
| **Product Sync** | Partial success supported; log failures per product |
| **Network** | React Query retry (3x with exponential backoff) |
| **Auth** | Auto-refresh JWT; redirect to /login on 401 |
| **AI** | Graceful fallback to manual search on failure |
| **Barcode** | "Product not found" toast → manual search prompt |
| **Offline** | Queue operations; sync on reconnect |
