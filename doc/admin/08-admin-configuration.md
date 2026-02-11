# 08 — Admin Configuration & Business Settings

## Overview

The admin configuration system provides comprehensive control over all aspects of the application's behavior, business identity, integration workflows, and measurement systems. All settings are **stored in the database** (not hardcoded) and configurable via the admin UI.

---

## Configuration Architecture

```
Settings Page (/settings)
├── 🔌 Syrve Connection         (doc 03)
├── 🏢 Business Profile          (this doc, section 1)
├── ⚙️ Inventory Workflow        (this doc, section 2)
├── 📏 Measurement & Units       (this doc, section 3)
├── 🥃 Glass Dimensions          (this doc, section 4)
├── 📍 Location Management       (this doc, section 5)
├── 💱 Currency & Language       (this doc, section 6)
├── 🤖 AI Configuration          (this doc, section 7)
├── 🎨 Branding & Appearance     (this doc, section 8)
├── 👥 User & Role Management    (doc 09)
└── 🚩 Feature Flags             (doc 10, Super Admin only)
```

---

## Data Model: `app_settings` Table

All configuration settings use a **key-value store** for flexibility and extensibility.

```sql
CREATE TABLE app_settings (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category       TEXT NOT NULL,       -- 'business', 'inventory', 'measurement', 'appearance', 'ai', 'integration'
  key            TEXT NOT NULL,       -- Setting key (e.g., 'require_review_before_syrve')
  value          JSONB NOT NULL,      -- Setting value (flexible type)
  display_name   TEXT NOT NULL,       -- Human-readable label
  description    TEXT,                -- Help text shown in UI
  setting_type   TEXT NOT NULL,       -- 'boolean', 'string', 'number', 'select', 'multi_select', 'json', 'image'
  options        JSONB,               -- For 'select'/'multi_select' type: array of {value, label}
  default_value  JSONB NOT NULL,      -- Factory default
  is_secret      BOOLEAN DEFAULT false, -- If true, value encrypted and masked in UI
  requires_restart BOOLEAN DEFAULT false,
  updated_by     UUID REFERENCES profiles(id),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(category, key)
);

-- RLS: only admin/super_admin can read/write
```

---

## Section 1: Business Profile

### Table: `business_profile` (singleton)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `business_name` | text | **Required**. Shown in app header, reports, documents |
| `legal_name` | text | Full legal entity name |
| `tax_id` | text | Tax identification number (INN, VAT, etc.) |
| `registration_number` | text | Business registration number |
| `phone` | text | Primary contact phone |
| `email` | text | Business email |
| `website` | text | Website URL |
| `address_line1` | text | Street address |
| `address_line2` | text | Additional address |
| `city` | text | City |
| `state_region` | text | State or region |
| `postal_code` | text | ZIP/postal code |
| `country` | text | Country |
| `logo_url` | text | Uploaded logo (Supabase Storage) |
| `currency_code` | text | Default currency (e.g., `RUB`, `USD`, `EUR`) |
| `default_language` | text | Default app language (e.g., `en`, `ru`) |
| `timezone` | text | Business timezone (e.g., `Europe/Moscow`) |
| `syrve_organization_name` | text | Auto-filled from Syrve sync |
| `syrve_organization_id` | UUID | Auto-filled from Syrve |
| `notes` | text | Internal notes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### UI: Business Profile Page

```
┌──────────────────────────────────────────────────────┐
│  🏢 Business Profile                                  │
│                                                       │
│  Logo                                                 │
│  ┌──────────┐                                         │
│  │ [LOGO]   │  [Upload New Logo]                      │
│  │ 200x200  │  Supported: PNG, JPG, SVG (max 2MB)    │
│  └──────────┘                                         │
│                                                       │
│  Business Name *    Legal Name                        │
│  [Restaurant X ]    [Restaurant X LLC_____]           │
│                                                       │
│  Phone              Email                             │
│  [+7 999 123 456]   [info@restaurantx.com]           │
│                                                       │
│  Address                                              │
│  [123 Main Street, Moscow, Russia 123456_____]       │
│                                                       │
│  Tax ID             Registration #                    │
│  [7701234567___]    [1027700000001___]                │
│                                                       │
│  ── Syrve Organization (auto-synced) ──────────────  │
│  Organization:  Restaurant X Group                    │
│  ID:            abc-def-123-456                       │
│  ℹ️ Synced from Syrve. Override manually if needed.    │
│                                                       │
│  [💾 Save Changes]                                    │
└──────────────────────────────────────────────────────┘
```

**Data sources priority:**
1. Syrve organization data (auto-filled on connection)
2. Admin manual entry (overrides Syrve data)

---

## Section 2: Inventory Workflow Configuration

These settings control the inventory counting and approval process.

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `require_review_before_syrve` | boolean | `true` | **Sessions must be reviewed and approved by admin before sending to Syrve** |
| `auto_approve_zero_variance` | boolean | `false` | Auto-approve sessions with zero total variance |
| `allow_staff_to_start_full_count` | boolean | `false` | If false, only Admin can start Full Inventory sessions |
| `allow_staff_to_start_spot_check` | boolean | `true` | If true, Staff can start Spot Check sessions |
| `require_session_notes` | boolean | `false` | Require notes when starting a session |
| `require_item_notes_on_variance` | boolean | `false` | Require notes on items with variance > threshold |
| `variance_note_threshold` | number | `3` | Variance amount that triggers mandatory notes |
| `session_expiry_hours` | number | `24` | Auto-cancel in_progress sessions after N hours |
| `draft_expiry_hours` | number | `1` | Auto-delete draft sessions after N hours |
| `review_deadline_hours` | number | `72` | Notify admin if pending_review exceeds N hours |
| `allow_recount_after_complete` | boolean | `false` | Allow reopening completed sessions for recount |
| `show_expected_quantity_during_count` | boolean | `false` | **If true, counters can see expected stock (NOT recommended — causes bias)** |
| `allow_negative_variance_override` | boolean | `true` | Allow admin to accept negative variance without investigation |
| `enable_variance_threshold_alerts` | boolean | `true` | Send notifications for high variance items |
| `max_concurrent_sessions` | number | `3` | Maximum simultaneous active sessions |
| `auto_send_to_syrve_on_approve` | boolean | `false` | Automatically send approved sessions to Syrve |
| `syrve_document_comment_template` | string | `"Inventory App - Session {session_number}"` | Template for Syrve document comments |

### UI: Inventory Workflow Settings

```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️ Inventory Workflow Configuration                          │
│                                                               │
│  ── Approval Flow ─────────────────────────────────────────  │
│                                                               │
│  Review & Approval                                            │
│  [✓] Require review and approval before sending to Syrve     │
│  [ ] Auto-approve sessions with zero variance                 │
│  [ ] Auto-send to Syrve after approval                        │
│                                                               │
│  ── Session Permissions ───────────────────────────────────  │
│                                                               │
│  Staff Can Start:                                             │
│  [ ] Full Inventory     [✓] Spot Check                       │
│                                                               │
│  ── Counting Behavior ─────────────────────────────────────  │
│                                                               │
│  ⚠️ Show expected stock during counting (NOT recommended)     │
│  [ ] Show expected quantities to counters                     │
│  ℹ️ Showing expected stock may cause confirmation bias in     │
│     counts. Best practice: staff counts blind.                │
│                                                               │
│  ── Variance Rules ────────────────────────────────────────  │
│                                                               │
│  Variance threshold for mandatory notes: [3___] units         │
│  [✓] Enable variance threshold alerts                         │
│  [✓] Allow negative variance without investigation            │
│                                                               │
│  ── Session Timeouts ──────────────────────────────────────  │
│                                                               │
│  Active session expiry: [24__] hours                          │
│  Draft session expiry:  [1___] hours                          │
│  Review deadline:       [72__] hours                          │
│  Max concurrent sessions: [3___]                              │
│                                                               │
│  ── Syrve Document Settings ────────────────────────────── │
│  Comment template: [Inventory App - Session {session_number}] │
│                                                               │
│  [💾 Save]  [↻ Reset to Defaults]                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Section 3: Measurement & Display Units

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `stock_display_unit` | select | `native` | How to show stock: `native` (Syrve units), `liters`, `milliliters`, `pieces` |
| `allow_fractional_count` | boolean | `true` | Allow decimal quantities (0.5 bottles, 0.75 kg) |
| `count_in_base_units` | boolean | `false` | If true, count in base units (ml/grams), else in Syrve container units |
| `show_unit_conversion` | boolean | `true` | Show "(= 750ml)" next to "1 бут" in catalog |
| `default_decimal_places` | number | `2` | Decimal places for displayed quantities |
| `volume_display_unit` | select | `ml` | `ml` or `l` for volume display |
| `weight_display_unit` | select | `kg` | `kg` or `g` for weight display |

### Unit Conversion Logic

```
Product: "Absolut Vodka 0.7L"
  Syrve unit_name: "бут" (bottle)
  Syrve unit_capacity: 0.7
  Syrve unit_measure: "л" (liters)

Display depends on stock_display_unit setting:
  - "native"     → "12 бут" (bottles)
  - "liters"     → "8.4 л"  (12 × 0.7)
  - "milliliters" → "8400 мл" (12 × 700)
  - "pieces"     → "12 шт"

UI shows both when show_unit_conversion = true:
  "12 бут (= 8.4 л)"
```

---

## Section 4: Glass Dimension Management

### Purpose

For bars and restaurants, counting partial bottles requires knowing glass sizes. When a bottle is open and partially used, staff counts remaining volume using known glass dimensions as reference, OR directly enters a fraction.

### Table: `glass_dimensions`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `name` | text | Human label (e.g., "Wine Standard", "Spirit Shot", "Port Glass") |
| `volume_ml` | integer | Glass volume in milliliters |
| `is_active` | boolean | Show in selection lists |
| `sort_order` | integer | Display order |
| `created_at` | timestamptz | |

### Table: `category_glass_defaults`

Links categories (from Syrve groups) to their default glass dimensions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `category_id` | UUID | FK → categories.id (NULL = global default) |
| `glass_dimension_id` | UUID | FK → glass_dimensions.id |
| `is_default` | boolean | Default glass for this category |
| `created_at` | timestamptz | |

### Predefined Glass Dimensions (admin can edit/add)

| Name | Volume (ml) | Typical Category |
|------|-------------|------------------|
| Wine Standard | 150 | Wines |
| Wine Large | 200 | Wines |
| Wine Tasting | 100 | Wines |
| Spirit Shot | 50 | Spirits |
| Spirit Double | 100 | Spirits |
| Spirit Tasting | 20 | Spirits |
| Port Glass | 75 | Fortified Wines |
| Port Large | 100 | Fortified Wines |
| Port Small | 50 | Fortified Wines |
| Champagne Flute | 150 | Sparkling |
| Beer Tasting | 100 | Beer |
| Beer Half Pint | 250 | Beer |
| Beer Pint | 500 | Beer |

### UI: Glass Dimensions Settings

```
┌──────────────────────────────────────────────────────────────┐
│  🥃 Glass Dimensions                                          │
│                                                               │
│  ── Glass Types ──────────────────────────────────────────── │
│  ┌─────────────────┬──────────┬────────┬───────────────────┐ │
│  │ Name            │ Volume   │ Active │ Actions           │ │
│  ├─────────────────┼──────────┼────────┼───────────────────┤ │
│  │ Wine Standard   │ 150 ml   │ ✅     │ [Edit] [🗑️]       │ │
│  │ Wine Large      │ 200 ml   │ ✅     │ [Edit] [🗑️]       │ │
│  │ Wine Tasting    │ 100 ml   │ ✅     │ [Edit] [🗑️]       │ │
│  │ Spirit Shot     │ 50 ml    │ ✅     │ [Edit] [🗑️]       │ │
│  │ Spirit Double   │ 100 ml   │ ✅     │ [Edit] [🗑️]       │ │
│  │ Port Glass      │ 75 ml    │ ✅     │ [Edit] [🗑️]       │ │
│  │ Port Large      │ 100 ml   │ ✅     │ [Edit] [🗑️]       │ │
│  └─────────────────┴──────────┴────────┴───────────────────┘ │
│  [+ Add Glass Type]                                           │
│                                                               │
│  ── Category Defaults ────────────────────────────────────── │
│  ┌──────────────────┬──────────────────────────────────────┐ │
│  │ Category         │ Default Glass          │ Available   │ │
│  ├──────────────────┼────────────────────────┼─────────────┤ │
│  │ 🍷 Wines         │ [Wine Standard 150ml▼] │ 3 glasses   │ │
│  │ 🥃 Spirits       │ [Spirit Shot 50ml  ▼]  │ 3 glasses   │ │
│  │ 🍾 Sparkling     │ [Champagne Flute▼]     │ 1 glass     │ │
│  │ 🍺 Beer          │ [Beer Pint 500ml ▼]    │ 3 glasses   │ │
│  │ 🍷 Port/Fortified│ [Port Glass 75ml ▼]    │ 3 glasses   │ │
│  │ ⚙️ Global Default │ [Wine Standard 150ml▼] │ All glasses │ │
│  └──────────────────┴────────────────────────┴─────────────┘ │
│                                                               │
│  [💾 Save]                                                    │
└──────────────────────────────────────────────────────────────┘
```

### How Glass Dimensions Work in Counting

```
SCENARIO: Counting an open bottle of wine

1. Staff scans bottle of Château Margaux 2018 (750ml / бут)
2. QuantityPopup opens:

   ┌──────────────────────────────────────────┐
   │  Château Margaux 2018                     │
   │  Category: Wines > Red | 750ml            │
   │                                           │
   │  Full Bottles:  [- ] 5 [+ ]              │
   │                                           │
   │  ☑ Has Open Bottle                        │
   │                                           │
   │  Remaining in open bottle:                │
   │  Method: [Glass Count ▼]                  │
   │                                           │
   │  Glasses remaining: [- ] 3 [+ ]          │
   │  Glass size: [Wine Standard 150ml ▼]      │
   │  = 450 ml remaining (0.60 бут)            │
   │                                           │
   │  ── OR ──                                 │
   │  Method: [Visual Estimate ▼]              │
   │  [|||||||░░░]  ~70%  = 525ml (0.70 бут)   │
   │                                           │
   │  ── OR ──                                 │
   │  Method: [Direct ml Entry ▼]              │
   │  [450___] ml = 0.60 бут                   │
   │                                           │
   │  Total: 5.60 бут (4200 ml)                │
   │  [Confirm]                                │
   └──────────────────────────────────────────┘

3. Saved quantity: 5.60 (5 full + 0.60 open)

Glass selection defaults:
  - If category = "Wines" → default glass = "Wine Standard 150ml"
  - If category = "Spirits" → default glass = "Spirit Shot 50ml"
  - If no category mapping → use Global Default
  - Staff can always override glass selection
```

---

## Section 5: Location Management

### Table: `locations`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | PK |
| `name` | text | Location name (e.g., "Main Bar", "Wine Cellar", "Kitchen") |
| `short_code` | text | Short code for scanning (e.g., "BAR", "CEL", "KIT") |
| `type` | text | `storage`, `bar`, `kitchen`, `display`, `other` |
| `parent_id` | UUID | FK → locations.id (hierarchical locations) |
| `syrve_store_id` | UUID | Mapped to Syrve store (if applicable) |
| `is_active` | boolean | Show in location selectors |
| `sort_order` | integer | Display order |
| `description` | text | Notes |
| `created_at` | timestamptz | |

### UI: Location Management

```
┌──────────────────────────────────────────────────────────────┐
│  📍 Location Management                                       │
│                                                               │
│  ┌──────────────────┬────────┬───────┬───────────┬─────────┐ │
│  │ Name             │ Code   │ Type  │ Syrve     │ Actions │ │
│  ├──────────────────┼────────┼───────┼───────────┼─────────┤ │
│  │ Main Bar         │ BAR    │ Bar   │ Mapped    │ [✏️][🗑️] │ │
│  │ ├─ Bar Top       │ BAR-T  │ Bar   │ —         │ [✏️][🗑️] │ │
│  │ └─ Bar Back      │ BAR-B  │ Bar   │ —         │ [✏️][🗑️] │ │
│  │ Wine Cellar      │ CEL    │ Store │ Mapped    │ [✏️][🗑️] │ │
│  │ Kitchen          │ KIT    │ Kitch │ Mapped    │ [✏️][🗑️] │ │
│  │ Terrace Bar      │ TER    │ Bar   │ —         │ [✏️][🗑️] │ │
│  └──────────────────┴────────┴───────┴───────────┴─────────┘ │
│  [+ Add Location]                                             │
│                                                               │
│  ── Syrve Store Mapping ─────────────────────────────────── │
│  ℹ️ Map locations to Syrve stores for accurate inventory     │
│     reporting. Multiple locations can map to one Syrve store. │
└──────────────────────────────────────────────────────────────┘
```

**Location hierarchy uses:**
- During counting: select specific sub-location
- In reports: aggregate by parent location
- In Syrve sync: map to Syrve store ID for document submission

---

## Section 6: Currency & Language

### Currency Settings

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `currency_code` | select | `RUB` | Currency for all monetary values |
| `currency_symbol` | string | `₽` | Display symbol |
| `currency_position` | select | `after` | `before` ("$100") or `after` ("100 ₽") |
| `currency_decimal_separator` | select | `,` | `.` or `,` |
| `currency_thousands_separator` | select | ` ` | ` `, `.`, or `,` |

**Supported currencies:**
```
RUB (₽), USD ($), EUR (€), GBP (£), KZT (₸), 
GEL (₾), AED (د.إ), UAH (₴), TRY (₺), ...
```

### Language Settings

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `default_language` | select | `en` | Application UI language |
| `available_languages` | multi_select | `["en", "ru"]` | Languages enabled for user selection |
| `date_format` | select | `DD.MM.YYYY` | Date display format |
| `time_format` | select | `HH:mm` | 24h or 12h |
| `first_day_of_week` | select | `monday` | Calendar start day |

**Supported languages (Phase 1):**
- English (`en`)
- Russian (`ru`)

**Future languages:**
- Turkish (`tr`), Arabic (`ar`), Georgian (`ka`), Spanish (`es`)

### Internationalization Architecture

```
/src/i18n/
  ├── locales/
  │   ├── en.json
  │   └── ru.json
  ├── i18n.ts         ← i18next configuration
  └── useTranslation  ← hook for components

All UI strings use translation keys:
  t('settings.syrve.test_connection') → "Test Connection" / "Проверить подключение"
```

---

## Section 7: AI Configuration

Admin can configure the AI Vision Engine behavior and API keys.

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `use_custom_ai_key` | boolean | `false` | If true, uses the business's own API key instead of the system default |
| `custom_openai_api_key` | string | `null` | Encrypted OpenAI API key (Secret) |
| `custom_gemini_api_key` | string | `null` | Encrypted Google Gemini API key (Secret) |
| `ai_provider_preference` | select | `openai` | `openai` or `gemini` |
| `ai_confidence_threshold` | number | `0.7` | Minimum confidence score for auto-matching products |

### AI Key Management Logic
1. **Fallback Mechanism**: The backend check sequence is: `Business Key (if enabled)` -> `System Default Key`.
2. **Security**: All API keys are stored as `is_secret: true` in `app_settings`, encrypted at rest using Vault or similar.
3. **Validation**: Key validity is checked upon saving via a test ping to the provider's health endpoint.

---

## Section 8: Branding & Business Identity

Control the visual identity of the app for the specific business.

| Setting Key | Type | Default | Description |
|-------------|------|---------|-------------|
| `branding_type` | select | `text` | `text` (Business Name) or `logo` (Image) |
| `app_logo_url` | image | `null` | Business logo for header and reports |
| `accent_color` | string | `#3B82F6` | Primary brand color for buttons and UI elements |
| `include_business_info_in_reports` | boolean | `true` | Show address/contact in PDF exports |

### Business Details Management
Business information (Address, Tax ID, Contacts) is crucial for:
- **Order Generation**: Automatically populating supplier request forms.
- **Syrve Sync**: Matching legal entity details for document headers.
- **Reporting**: Generating compliant financial and stock audit reports.

---

## Section 9: Advanced User Management & RBAC

Granular control over what users can see and do.

### Access Control Logic: "If no access, no UI"
The application implements a strict permission-based UI filtering system:

1. **Module Hiding**: If a user lacks `view` permission for a module (e.g., `reports`), the entire menu item and route are removed.
2. **Functionality Hiding**: Buttons like "Add Product", "Sync to Syrve", or "Approve Session" are conditionally rendered based on `create`, `update`, or `approve` permissions.
3. **Read-Only Mode**: Users with `view` but no `edit` permissions see forms in a disabled/read-only state.

### Role Management
Admin can create custom roles with specific permission matrices:
- **Permissions Grid**: A matrix of `Module` (Catalog, Inventory, Reports, Users, Settings) x `Action` (View, Create, Edit, Delete, Approve, Export).
- **Inheritance**: Roles can be based on templates (Staff, Manager, Admin).

---

## Section 10: Feature Flags System

A platform-wide mechanism for controlled feature rollout, managed by Super Admins.

### Global vs. Business Flags
- **Global Flags**: Enable/disable features for the entire platform (e.g., `maintenance_mode`).
- **Business Flags**: Toggle features for specific tenants (e.g., `enable_ai_module`, `beta_reports_v2`).

### List of Feature Flags (Initial)
| Flag Key | Description |
|:---|:---|
| `feat_ai_label_scan` | Toggles the AI label recognition module |
| `feat_syrve_sync` | Enables/Disables bi-directional Syrve synchronization |
| `feat_offline_sync` | Toggles IndexedDB caching for offline counting |
| `feat_visual_bottle_slider` | Enables the decimal/slider UI for partials |
| `feat_custom_roles` | Allows businesses to create non-standard roles |

---

## Section 11: Location, Currency & Language

### Multi-Location Management
- **Hierarchy**: Zones -> Sub-locations (e.g., Main Bar -> Fridge 1, Fridge 2).
- **Syrve Mapping**: Each location can be mapped to a specific Syrve Store/Point of Sale ID.

### Currency & Language
- **Currency**: Supports all ISO codes. Influences report generation and price display.
- **Language**: App-wide translation toggle (defaulting to English/Russian).

---

## Settings Page Layout

```
/settings route — tabs or sidebar navigation:

┌─────────────────┬─────────────────────────────────────────────┐
│ Settings         │                                             │
│                  │  [Active section content]                   │
│ 🏢 Business     │                                             │
│ 🔌 Syrve        │                                             │
│ ⚙️ Inventory    │                                             │
│ 📏 Units        │                                             │
│ 🥃 Glass Dims   │                                             │
│ 📍 Locations    │                                             │
│ 💱 Currency     │                                             │
│ 🌐 Language     │                                             │
│ 🤖 AI Config    │                                             │
│ 🎨 Branding     │                                             │
│ 👥 Users        │  ← links to /users route                    │
│ 🚩 Feature Flags│  ← Super Admin only (doc 10)               │
│                  │                                             │
└─────────────────┴─────────────────────────────────────────────┘
```

---

## Settings Change Audit

All setting changes are logged:

```sql
CREATE TABLE settings_audit_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name  TEXT NOT NULL,          -- 'app_settings', 'business_profile', etc.
  record_id   UUID,
  field_name  TEXT,
  old_value   JSONB,
  new_value   JSONB,
  changed_by  UUID REFERENCES profiles(id),
  changed_at  TIMESTAMPTZ DEFAULT NOW(),
  ip_address  TEXT
);
```

This ensures full traceability for compliance and debugging.
