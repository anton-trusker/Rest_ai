# 04 — Inventory Process & Collaborative Counting

## Overview

The inventory counting process is **category-agnostic** — it works identically whether counting wine bottles, spirit bottles, beer kegs, food items, or cleaning supplies. All products come from Syrve, and results can be sent back to Syrve.

---

## Session Types

| Type | Description | Scope | When Used |
|------|-------------|-------|-----------|
| **Full** | Count every product in the venue | All categories, all locations | Monthly scheduled inventory |
| **Partial** | Count specific category or location | Filtered by category and/or location | Weekly bar check, category audit |
| **Spot Check** | Quick count of flagged items | Admin-selected products | Discrepancy investigation |

---

## Session Lifecycle

### Phase 1: Setup

```
Component: CountSetup.tsx

  ┌──────────────────────────────────────┐
  │  Count Type: [Full ▼]                │
  │  Category: [All Categories ▼]        │  ← Dynamic from Syrve groups
  │  Location: [All Locations ▼]         │
  │  Notes: [________________________]   │
  │  [Start Session]                     │
  └──────────────────────────────────────┘

Actions:
  1. Select count type
  2. Optional: filter by category (from categories table, synced from Syrve)
  3. Optional: filter by location
  4. Click "Start Session"

Backend:
  INSERT INTO inventory_sessions (
    session_type, status: 'in_progress',
    created_by: auth.uid(),
    started_at: NOW(),
    category_filter: selected_category_id,  -- NULL = all
    location_filter: selected_location,       -- NULL = all
    notes
  )
```

### Phase 2: Scanning & Counting

Three recognition modes work for ANY product type:

#### Mode 1: Barcode Scanning

```
1. Camera activates (html5-qrcode)
2. Supported formats: EAN_13, UPC_A, UPC_E, EAN_8, QR_CODE
3. Debounce: 1500ms between same-code scans

4. On scan:
   SELECT p.* FROM product_barcodes pb
   JOIN products p ON p.id = pb.product_id
   WHERE pb.barcode = :scanned_code

5. Found → QuantityPopup with product info
6. Not found → toast "Product not found" → manual search
```

#### Mode 2: AI Image Recognition

```
1. Camera captures product photo (label, package, shelf)
2. Edge Function: ai-recognize
3. AI extracts product info (category-aware prompting)
4. Matches against products table
5. Confidence-based display:
   ≥80%: auto-select → QuantityPopup
   50-79%: show candidates for selection
   <50%: fallback to manual search
```

#### Mode 3: Manual Search

```
Search across ALL product categories:
  SELECT * FROM products
  WHERE name ILIKE '%query%'
     OR sku ILIKE '%query%'
     OR barcode_primary LIKE '%query%'
  ORDER BY
    CASE WHEN :category_filter IS NOT NULL 
         AND category_id = :category_filter THEN 0 ELSE 1 END,
    name ASC
  LIMIT 20
```

### Phase 3: Quantity Entry

```
Component: QuantityPopup.tsx

  ┌──────────────────────────────────────┐
  │  📦 Château Margaux 2018              │  ← Product name
  │  Category: Wines > Red | 750ml бут    │  ← Category + unit info
  │  SKU: W-001                           │
  │                                       │
  │  Quantity: [- ] 3 [+ ]               │  ← Single quantity field
  │  Unit: бут (bottle)                   │  ← From Syrve product unit
  │                                       │
  │  Location: [Main Bar ▼]               │
  │  Notes: [________________________]    │
  │                                       │
  │  [Cancel]          [Confirm Count]    │
  └──────────────────────────────────────┘

On Confirm:
  INSERT INTO inventory_items (
    session_id, product_id, counted_by: auth.uid(),
    counted_quantity: quantity,
    expected_quantity: product.stock_on_hand,
    variance: quantity - product.stock_on_hand,
    counting_method, ai_confidence,
    location, notes, image_url
  )
```

**Note on units**: The unit displayed (bottles, kg, liters, pieces) comes from the Syrve product data (`unit_name` field). The quantity popup adapts — for bottles it shows whole numbers, for kg it allows decimals.

### Phase 4: Session Summary

```
Component: SessionSummary.tsx

  ┌──────────────────────────────────────────┐
  │  📊 Session Summary                       │
  │                                           │
  │  Session: INV-2024-005                    │
  │  Duration: 45 minutes                     │
  │  Type: Full Inventory                     │
  │                                           │
  │  Products Counted: 84                     │  ← Any category
  │  Total Units:      312                    │
  │  Categories:       5                      │  ← Dynamic
  │  Variances Found:  7                      │
  │                                           │
  │  📋 Category Breakdown:                    │
  │  ┌──────────────────────────────────┐     │
  │  │ Wines:    24 products, 156 units │     │
  │  │ Spirits:  18 products, 45 units  │     │
  │  │ Beer:     22 products, 88 units  │     │
  │  │ Soft:     12 products, 15 units  │     │
  │  │ Food:     8 products, 8 units    │     │
  │  └──────────────────────────────────┘     │
  │                                           │
  │  ⚠️ Top Variances:                        │
  │  ┌──────────────────────────────────┐     │
  │  │ Margaux 2018     +2 (expected 8) │     │
  │  │ Absolut Vodka    -3 (expected 12)│     │
  │  │ Guinness 0.5l    +5 (expected 0) │     │
  │  └──────────────────────────────────┘     │
  │                                           │
  │  [New Session]  [Send to Syrve]           │
  └──────────────────────────────────────────┘
```

---

## Collaborative Counting

### How It Works

Same principle as before — multiple users count simultaneously within one session, items are **additive**.

```
SCENARIO: Full Inventory, 3 users

Session INV-2024-010 (status: in_progress)

User A (Bar area):
  - Margaux 2018 (Wine):     3 bottles
  - Absolut Vodka (Spirit):  2 bottles
  - Coca-Cola (Soft):        12 cans

User B (Cellar):
  - Margaux 2018 (Wine):     12 bottles
  - Opus One (Wine):         3 bottles

User C (Kitchen):
  - Olive Oil (Food):        5 bottles
  - Coca-Cola (Soft):        6 cans

ON COMPLETION — Aggregation:
  Margaux 2018:   3 + 12 = 15 bottles
  Absolut Vodka:  2 bottles
  Coca-Cola:      12 + 6 = 18 cans
  Opus One:       3 bottles
  Olive Oil:      5 bottles
```

### Rules

1. **Additive** — each user creates a new record, NOT overwriting
2. **Location-aware** — different locations preserved for reporting
3. **Category-mixed** — one session can count products from any/all categories
4. **Aggregation on completion** — stock updated only when session completes
5. **Per-session scope** — completing a new full session replaces stock values

---

## Session Review (Admin)

```
Admin capabilities:
  1. View all sessions with status/category/date filters
  2. Drill into session details
  3. See per-item breakdown grouped by category
  4. See variance highlighting (color-coded thresholds)
  5. See who counted what and where
  6. Approve → status 'completed' → stock updates
  7. Flag → return to counters with notes
  8. Send to Syrve → trigger inventory commit Edge Function
```

### Variance Thresholds

| Variance | Color | Action |
|----------|-------|--------|
| 0 | Green | No action |
| ±1-2 units | Yellow | Minor — note only |
| ±3-5 units | Orange | Moderate — flag for review |
| >±5 or >10% | Red | Critical — investigation required |

---

## Category-Aware Session Filtering

When starting a partial count, admin can filter by Syrve category:

```
┌──────────────────────────────┐
│ Category Filter:              │
│ ┌──────────────────────────┐ │
│ │ □ All Categories         │ │
│ │ ■ Wines                  │ │
│ │   □ Red Wines            │ │
│ │   □ White Wines          │ │
│ │   □ Sparkling            │ │
│ │ □ Spirits                │ │
│ │ □ Beer                   │ │
│ │ □ Soft Drinks            │ │
│ │ □ Food                   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

This category tree is **dynamically built from Syrve product groups** — no hardcoded categories.

---

## Session Expiry & Cleanup

```
Rules:
  - in_progress > 24 hours → auto-cancelled
  - draft > 1 hour → auto-deleted
  - pending_review > 72 hours → admin notification

Supabase scheduled function runs every hour.
```
