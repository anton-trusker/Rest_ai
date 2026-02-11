# 06 — UI/UX Improvements & Proposed Features

## Critical: Syrve Connection Page (NEW)

This is the **first thing an admin does after deploying the app**. Without it, no data exists.

### `/settings/syrve` — Syrve Server Connection

```
┌────────────────────────────────────────────────────────────┐
│  🔌 Syrve Server Connection                                │
│                                                             │
│  ─── Connection Settings ──────────────────────────────── │
│                                                             │
│  Server URL                                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ http://192.168.1.100:8080                           │    │
│  └────────────────────────────────────────────────────┘    │
│  ℹ️ Base URL without /resto/api                             │
│                                                             │
│  Login                          Password                    │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │ apiuser             │        │ ••••••••            │      │
│  └────────────────────┘        └────────────────────┘      │
│                                                             │
│  ┌────────────────────────┐                                 │
│  │ 🔍 Test Connection     │                                 │
│  └────────────────────────┘                                 │
│                                                             │
│  ── Result ──────────────────────────────────────────────  │
│  ✅ Connected to Syrve Server v7.8.2                        │
│                                                             │
│  Select Store:                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ ● Main Restaurant Storage                        │      │
│  │ ○ Bar Storage                                    │      │
│  │ ○ Kitchen Cold Storage                           │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ── Sync Settings ──────────────────────────────────────  │
│  Auto-sync products: [✓]   Interval: [Daily ▼]             │
│                                                             │
│  ┌──────────┐  ┌──────────────────────────────┐            │
│  │ 💾 Save  │  │ 🔄 Sync Products Now         │            │
│  └──────────┘  └──────────────────────────────┘            │
│                                                             │
│  ── Sync Status ────────────────────────────────────────  │
│  Last sync: 2024-02-10 14:30 ✅                             │
│  Products: 245 (12 new, 3 updated)                          │
│  Categories: 18                                             │
│                                                             │
│  [View Full Sync History]                                   │
└────────────────────────────────────────────────────────────┘
```

### States & Behavior

| State | UI Display |
|-------|-----------|
| **No config** | Form empty, "Test Connection" button primary, "Save" & "Sync" disabled |
| **Testing** | Spinner on "Test Connection", fields disabled |
| **Test failed** | ❌ Error message (network, auth, etc.), fields re-enabled |
| **Test success** | ✅ Connected, store list appears, "Save" enabled |
| **Saved** | Green badge "Connected", "Sync Products Now" enabled |
| **Syncing** | Progress indicator, product/category counts updating live |
| **Sync error** | ⚠️ Warning with error details, retry button |

---

## 🔴 Priority 1: Critical Changes (Wine → Universal)

### 1.1 Product Catalog (replaces Wine Catalog)

**Current**: Hardcoded wine columns (grape, vintage, region, ABV).

**Required changes**:
- Rename "Wine Catalog" → "Product Catalog" throughout
- Dynamic column generation based on product category
- Category tabs/sidebar for filtering (from Syrve groups)
- Generic product cards (not wine-specific)
- Remove hardcoded wine-type filters

```
┌──────────────────────────────────────────────────────┐
│  Product Catalog                     [🔄 Sync Syrve] │
│                                                       │
│  Categories:                                          │
│  [All] [Wines] [Spirits] [Beer] [Soft] [Food]        │  ← Dynamic from Syrve
│                                                       │
│  Search: [________________________] [🔍]              │
│                                                       │
│  ┌─────┬──────────┬──────────┬──────┬───────┬──────┐ │
│  │ SKU │ Name     │ Category │ Unit │ Stock │ Price│ │
│  ├─────┼──────────┼──────────┼──────┼───────┼──────┤ │
│  │W001 │Margaux 18│Wines>Red │ бут  │  15   │ 450  │ │
│  │S005 │Absolut   │Spirits   │ бут  │  8    │ 120  │ │
│  │B012 │Guinness  │Beer>Draft│ бут  │  24   │ 35   │ │
│  └─────┴──────────┴──────────┴──────┴───────┴──────┘ │
└──────────────────────────────────────────────────────┘
```

### 1.2 Product Detail Page

**Current**: Wine-specific fields (grape variety, vintage, tasting notes).

**Required changes**:
- Show common fields: name, SKU, category, unit, price, stock, barcode
- Show category-specific fields from `syrve_data` JSONB dynamically
- Product image gallery
- Stock history / movement log
- Syrve sync status badge

### 1.3 Count Setup

**Current**: No category filter option.

**Required**: Add category tree selector from Syrve groups (dynamic).

### 1.4 Dashboard

**Current**: Wine-specific KPIs.

**Required changes**:
- "Total Products" (not "Total Wines")
- Category breakdown chart (dynamic)
- Syrve connection status indicator
- Last sync timestamp

### 1.5 Remove All Wine-Specific Hardcoding

| Current | Replace With |
|---------|-------------|
| `wines` table references | `products` table |
| `wineStore` | `productStore` |
| `mockWines.ts` | Data from Syrve via Supabase |
| Wine type filter (red/white/etc.) | Dynamic category filter from Syrve |
| Grape variety, vintage fields | `syrve_data` JSONB fields |
| "Wine" in all labels | "Product" or category name |

---

## 🟡 Priority 2: UI Enhancements

### 2.1 Dashboard Widgets

| Widget | Description |
|--------|-------------|
| **Syrve Status Badge** | Green/Red dot + "Connected" / "Disconnected" |
| **Last Sync Card** | Time since last sync + products count |
| **Active Sessions** | Live counting sessions with progress |
| **Low Stock by Category** | Grouped alert list |
| **Category Stock Pie Chart** | Dynamic from Syrve groups |
| **Quick Spot Check** | One-tap start button |

### 2.2 Product Catalog Enhancements

| Feature | Description |
|---------|-------------|
| **Category Tree Sidebar** | Hierarchical filter from Syrve groups |
| **View Switcher** | Table ↔ Card grid toggle |
| **Product Card** | Image + name + category + stock badge |
| **Syrve Sync Badge** | 🔄 icon on products from Syrve |
| **Batch Select** | Multi-select for bulk operations |
| **Inline Edit** | Click-to-edit price and par level |

### 2.3 Counting Page Enhancements

| Feature | Description |
|---------|-------------|
| **Category Progress** | If filtered by category, show progress bar |
| **Recent Scans List** | Bottom sheet with last 5 scans |
| **Undo Last** | Swipe to undo last count |
| **Session Timer** | Live duration counter |
| **Unit Display** | Show product's unit from Syrve (бут, шт, кг) |

### 2.4 Session Review Enhancements

| Feature | Description |
|---------|-------------|
| **Category Breakdown** | Group variances by category |
| **User Contribution** | Who counted what |
| **Send to Syrve Button** | Prominent, with status feedback |
| **Export PDF** | Printable session report |

### 2.5 Current Stock Enhancements

| Feature | Description |
|---------|-------------|
| **Category Tabs** | Filter stock view by category |
| **Stock Value Card** | Total inventory value |
| **Category Value Chart** | Value breakdown by Syrve group |

---

## 🟢 Priority 3: New Feature Proposals

### 3.1 Syrve Sync History Page

Full log of all sync operations:
```
┌──────────────────────────────────────────────┐
│  Syrve Sync History                           │
│                                               │
│  📅 2024-02-10 14:30  Product Sync  ✅        │
│     245 products, 18 categories               │
│  📅 2024-02-10 10:15  Inventory Commit ✅     │
│     Session INV-005 → Document D-123          │
│  📅 2024-02-09 14:30  Product Sync  ⚠️        │
│     240 products, 5 warnings                  │
│  📅 2024-02-08 14:30  Connection Test ✅      │
│     Server v7.8.2                             │
└──────────────────────────────────────────────┘
```

### 3.2 Product Mapping Review

For products that couldn't be auto-matched during sync:
- Admin reviews unmatched items
- Manual mapping or "skip" option

### 3.3 Receiving Module

Log deliveries from suppliers:
- Scan products on arrival
- Update stock levels
- Optionally sync to Syrve

### 3.4 Waste / Breakage Logging

- Log broken, spoiled, or returned items
- Negative inventory movement
- Auto stock reduction

### 3.5 Offline Mode

- Cache products + barcodes in IndexedDB
- Queue count items locally
- Sync on reconnection

### 3.6 Notifications

- Low stock alerts
- Session completion notifications
- Syrve sync status changes
- System messages

---

## New Components Needed

| Component | Purpose |
|-----------|---------|
| `SyrveConnectionForm` | Server URL, login, password form with test button |
| `ConnectionTestResult` | Success/failure display with store list |
| `StoreSelector` | Radio button list of Syrve stores |
| `SyncStatusBadge` | Header bar indicator |
| `SyncHistoryList` | Sync operation log |
| `CategoryTree` | Hierarchical category selector |
| `CategoryTabs` | Tab bar from Syrve groups |
| `ProductCard` | Grid view card (generic, not wine) |
| `DynamicFieldRenderer` | Renders fields from syrve_data JSONB |
| `SessionCategoryBreakdown` | Pie chart of categories in session |

---

## Action Buttons

### Product Detail Page
| Button | Action | Role |
|--------|--------|------|
| 📊 View History | Navigate to filtered movement history | All |
| 🗑️ Log Waste | Open waste/breakage dialog | Admin |
| 📋 Copy Barcode | Copy to clipboard | All |

### Session Review Page
| Button | Action | Role |
|--------|--------|------|
| ✅ Approve | Complete session → update stock | Admin |
| 🚩 Flag | Return with notes | Admin |
| 🔄 Send to Syrve | Commit to Syrve | Admin |
| 📄 Export PDF | Printable report | Admin |

### Dashboard
| Button | Action | Role |
|--------|--------|------|
| ⚡ Quick Spot Check | Start spot check immediately | All |
| 📊 Full Inventory | Start full count | Admin |
| 🔄 Sync Syrve | Trigger product sync | Admin |
| 📋 Stock Report | Download CSV | Admin |

### Settings — Syrve Page
| Button | Action | Role |
|--------|--------|------|
| 🔍 Test Connection | Verify Syrve credentials | Admin |
| 💾 Save | Store config in DB | Admin |
| 🔄 Sync Now | Trigger immediate product sync | Admin |
| 📜 View History | Show sync log | Admin |
