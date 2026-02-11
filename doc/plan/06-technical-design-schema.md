# 06 — Technical Design & Schema

## 1. Database Schema (PostgreSQL)

The schema is designed for high performance, data integrity, and category-agnostic flexibility.

### 6.2 Key Tables (Enhanced)
#### `products`
- `id`: UUID (Primary Key)
- `syrve_id`: UUID (External Reference)
- `sku`: String
- `name`: String
- `category_id`: UUID
- `parent_id`: UUID (Self-reference for variants like vintages/sizes)
- `image_url`: Text (For AI matching)
- `metadata`: JSONB (For specific attributes like alcohol %, origin)

#### `inventory_items`
- `id`: UUID
- `session_id`: UUID
- `product_id`: UUID
- `quantity`: Decimal
- `is_opened`: Boolean (Default: false)
- `user_id`: UUID
- `location_id`: UUID
- `captured_at`: Timestamp (Default: now())
- `sync_status`: Enum ('pending', 'synced', 'failed')

---

## 2. API Specifications (Edge Functions)

All external integrations and sensitive operations are handled via Supabase Edge Functions.

### `syrve-product-sync`
- **Method**: POST
- **Auth**: Service Role or Admin JWT
- **Process**:
    1. Authenticate with Syrve using credentials from `syrve_config`.
    2. Fetch `/entities/products/group/list` and upsert `categories`.
    3. Fetch `/entities/products/list` and upsert `products`.
    4. Update `syrve_config.last_product_sync_at`.

### `syrve-inventory-commit`
- **Method**: POST
- **Payload**: `{ session_id: string }`
- **Process**:
    1. Validate session status is `completed`.
    2. Aggregate counts from `inventory_items` grouped by `syrve_product_id`.
    3. Construct Syrve-compatible XML document.
    4. POST to Syrve `/documents/import/incomingInventory`.
    5. Update session `syrve_sync_status`.

### `ai-recognize`
- **Method**: POST
- **Payload**: `{ image_base64: string }`
- **Process**:
    1. Send image to OpenAI Vision API with context-aware prompt.
    2. Receive structured JSON (Name, SKU, Category, Confidence).
    3. Query local `products` table for matches.
    4. Return top candidates to frontend.

---

## 3. State Management (Zustand)

### `productStore`
- `products`: Cached list of products for search.
- `categories`: Category tree.
- `fetchProducts()`: Loads from Supabase.
- `search(query)`: Client-side fuzzy search.

### `inventoryStore`
- `activeSession`: Current session metadata.
- `items`: Local queue of counts (persisted for offline).
- `addCount(item)`: Adds to local state and syncs to DB when online.

---

## 4. Row Level Security (RLS) Examples

```sql
-- Profiles: Users can only read their own profile, Admins can read all.
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Inventory Items: Staff can create, Managers/Admins can read all.
CREATE POLICY "Staff can insert counts" ON inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('staff', 'manager', 'admin'))
  );

-- Syrve Config: Only Admins can read/write.
CREATE POLICY "Admins only" ON syrve_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```
