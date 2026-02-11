
-- Syrve configuration (1 row per connection)
CREATE TABLE IF NOT EXISTS syrve_config (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_url      TEXT NOT NULL,
  api_login       TEXT NOT NULL,
  api_password_encrypted TEXT NOT NULL,   -- Stored via Vault/pgsodium in real app, here simple text for demo/dev if vault not available
  organization_id TEXT,
  store_id        TEXT,
  store_name      TEXT,
  is_active       BOOLEAN DEFAULT true,
  last_sync_at    TIMESTAMPTZ,
  sync_status     TEXT DEFAULT 'never',       -- never, syncing, success, error
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (from Syrve Product Groups)
CREATE TABLE IF NOT EXISTS categories (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  syrve_id        UUID UNIQUE,
  name            TEXT NOT NULL,
  parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  depth           INTEGER DEFAULT 0,
  sort_order      INTEGER DEFAULT 0,
  default_glass_id UUID REFERENCES glass_dimensions(id),
  measure_method  TEXT DEFAULT 'count',    -- count, weight, volume
  is_active       BOOLEAN DEFAULT true,
  syrve_data      JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Products (from Syrve nomenclature)
CREATE TABLE IF NOT EXISTS products (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  syrve_id        UUID UNIQUE,
  name            TEXT NOT NULL,
  sku             TEXT,
  code            TEXT,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit            TEXT DEFAULT 'pcs',
  unit_capacity   NUMERIC,                  -- e.g., 0.75 for 750ml bottle
  purchase_price  NUMERIC(12,2),
  description     TEXT,
  image_url       TEXT,
  par_level       NUMERIC,
  is_countable    BOOLEAN DEFAULT true,
  default_location_id UUID REFERENCES locations(id),
  metadata        JSONB DEFAULT '{}',            -- alcohol%, country, producer, vintage, etc.
  syrve_data      JSONB DEFAULT '{}',          -- Raw Syrve fields
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Product barcodes (1:N)
CREATE TABLE IF NOT EXISTS product_barcodes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  barcode         TEXT NOT NULL,
  barcode_type    TEXT DEFAULT 'unknown',
  is_primary      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barcode)
);

-- Product images (1:N)
CREATE TABLE IF NOT EXISTS product_images (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  source          TEXT DEFAULT 'syrve',            -- syrve, upload, ai
  is_primary      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sync logs
CREATE TABLE IF NOT EXISTS syrve_sync_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type       TEXT NOT NULL,                -- products, categories, stock, inventory_commit
  status          TEXT NOT NULL,                   -- started, success, partial, error
  items_total     INTEGER DEFAULT 0,
  items_created   INTEGER DEFAULT 0,
  items_updated   INTEGER DEFAULT 0,
  items_skipped   INTEGER DEFAULT 0,
  error_message   TEXT,
  duration_ms     INTEGER,
  triggered_by    UUID REFERENCES profiles(id),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- Barcode miss logs (unknown scans)
CREATE TABLE IF NOT EXISTS barcode_miss_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode         TEXT NOT NULL,
  scanned_by      UUID REFERENCES profiles(id),
  location_id     UUID REFERENCES locations(id),
  session_id      UUID,                        -- FK added in Phase 4
  resolved_product_id UUID REFERENCES products(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE syrve_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_miss_logs ENABLE ROW LEVEL SECURITY;

-- Reading catalogs is public (for auth users)
CREATE POLICY "Authenticated users can read categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read barcodes" ON product_barcodes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read images" ON product_images FOR SELECT USING (auth.role() = 'authenticated');

-- Config and logs: limited to admins
CREATE POLICY "Admins can manage syrve config" ON syrve_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can view sync logs" ON syrve_sync_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin'))
  );

-- Barcode miss logs: Scanners can create, Admins can manage
CREATE POLICY "Users can create barcode miss logs" ON barcode_miss_logs FOR INSERT WITH CHECK (auth.uid() = scanned_by);
CREATE POLICY "Admins can manage barcode miss logs" ON barcode_miss_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin'))
  );
