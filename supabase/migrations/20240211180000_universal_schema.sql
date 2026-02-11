-- 01_universal_schema.sql
-- Replaces wine-specific schema with Universal Inventory Schema (Syrve-First)

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- 2. Clean up old tables (if fresh start is acceptable)
DROP TABLE IF EXISTS wine_syrve_mappings CASCADE;
DROP TABLE IF EXISTS wine_images CASCADE;
DROP TABLE IF EXISTS wine_barcodes CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS inventory_sessions CASCADE;
DROP TABLE IF EXISTS wines CASCADE;
DROP TABLE IF EXISTS wine_variants CASCADE;
DROP TABLE IF EXISTS wine_producers CASCADE;
DROP TABLE IF EXISTS grape_varieties CASCADE;

-- 3. Syrve Configuration Table (Singleton)
CREATE TABLE syrve_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  server_url TEXT NOT NULL CHECK (server_url ~ '^https?://'), -- e.g. http://192.168.1.100:8080
  api_login TEXT NOT NULL,
  api_password_encrypted TEXT NOT NULL, -- Stored encrypted
  
  -- Store selection (populated after connection test)
  store_id UUID,
  store_name TEXT,
  organization_id UUID,
  server_version TEXT,
  
  -- Sync settings
  auto_sync_enabled BOOLEAN DEFAULT false,
  auto_sync_interval_minutes INTEGER DEFAULT 1440, -- Daily
  
  -- Status tracking
  connection_status TEXT CHECK (connection_status IN ('connected', 'disconnected', 'error', 'testing')),
  connection_tested_at TIMESTAMPTZ,
  last_product_sync_at TIMESTAMPTZ,
  last_sync_products_count INTEGER DEFAULT 0,
  last_sync_categories_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Ensure only one config row exists
CREATE UNIQUE INDEX idx_syrve_config_singleton ON syrve_config ((TRUE));

-- 4. Categories Table (Synced from Syrve Product Groups)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  syrve_group_id UUID UNIQUE NOT NULL, -- Source of truth
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id),
  syrve_parent_group_id UUID, -- Used for tree reconstruction during sync
  
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon TEXT, -- UI icon name
  
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);

-- 5. Products Table (Generic Model)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  syrve_product_id UUID UNIQUE NOT NULL, -- Source of truth
  
  -- Core fields common to all products
  name TEXT NOT NULL,
  sku TEXT, -- Syrve 'num'
  category_id UUID REFERENCES categories(id),
  syrve_group_id UUID, -- Backup ref
  
  product_type TEXT, -- GOODS, DISH, SERVICE, MODIFIER
  
  -- Unit info (from Syrve)
  unit_name TEXT, -- e.g. "бут", "kg", "pcs"
  unit_capacity NUMERIC, -- e.g. 0.75
  unit_measure TEXT, -- e.g. "l"
  
  -- Price info
  purchase_price NUMERIC DEFAULT 0,
  retail_price NUMERIC DEFAULT 0,
  
  -- Stock (Cached from Syrve or calculated locally)
  stock_on_hand NUMERIC DEFAULT 0,
  stock_expected NUMERIC DEFAULT 0,
  par_level NUMERIC, -- Minimum threshold for alerts
  
  image_url TEXT,
  barcode_primary TEXT,
  
  -- ⭐ The Magic: Full Syrve object storage
  syrve_data JSONB DEFAULT '{}'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  is_countable BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops); -- Fuzzy search

-- 6. Product Barcodes (Many-to-One)
CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL UNIQUE,
  barcode_type TEXT DEFAULT 'ean13',
  is_primary BOOLEAN DEFAULT false,
  synced_from_syrve BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_barcodes_lookup ON product_barcodes(barcode);

-- 7. Inventory Sessions
CREATE TABLE inventory_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_number TEXT NOT NULL, -- e.g., INV-2024-001
  session_type TEXT CHECK (session_type IN ('full', 'partial', 'spot_check')),
  status TEXT CHECK (status IN ('draft', 'in_progress', 'pending_review', 'completed', 'cancelled')) DEFAULT 'draft',
  
  created_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Filters defining the session scope
  category_filter UUID REFERENCES categories(id),
  location_filter TEXT,
  
  notes TEXT,
  
  -- Summary stats
  total_products_counted INTEGER DEFAULT 0,
  total_units NUMERIC DEFAULT 0,
  total_variance NUMERIC DEFAULT 0,
  
  -- Syrve Sync info
  syrve_document_id TEXT,
  syrve_sync_status TEXT DEFAULT 'not_required',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Inventory Items (Count Records)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  counted_by UUID REFERENCES auth.users(id),
  counted_quantity NUMERIC NOT NULL DEFAULT 0,
  expected_quantity NUMERIC NOT NULL DEFAULT 0,
  variance NUMERIC GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
  
  counting_method TEXT CHECK (counting_method IN ('manual', 'barcode', 'ai_image')),
  ai_confidence NUMERIC, -- 0.0 to 1.0
  
  location TEXT,
  notes TEXT,
  image_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_items_session ON inventory_items(session_id);
CREATE INDEX idx_inventory_items_product ON inventory_items(product_id);

-- 9. Syrve Sync Logs (Audit Trail)
CREATE TABLE syrve_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation TEXT NOT NULL, -- product_sync, inventory_commit, connection_test
  status TEXT NOT NULL, -- success, failed, warning
  
  details JSONB,
  error_message TEXT,
  session_id UUID, -- optional link to inventory session
  
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  categories_synced INTEGER DEFAULT 0,
  
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Triggers
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_syrve_config_modtime BEFORE UPDATE ON syrve_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sessions_modtime BEFORE UPDATE ON inventory_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Fuzzy Search Function
CREATE OR REPLACE FUNCTION search_products_fuzzy(
  search_name TEXT,
  search_brand TEXT DEFAULT NULL,
  threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID, name TEXT, sku TEXT,
  category_name TEXT, unit_name TEXT,
  image_url TEXT, similarity_score FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.sku,
    c.name AS category_name, p.unit_name,
    p.image_url,
    GREATEST(
      similarity(p.name, search_name),
      CASE WHEN search_brand IS NOT NULL 
        THEN similarity(p.name, search_brand) * 0.7
        ELSE 0 END
    ) AS similarity_score
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.is_active = true
    AND (similarity(p.name, search_name) > threshold
         OR (search_brand IS NOT NULL AND p.name ILIKE '%' || search_brand || '%'))
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$;

-- RLS Policies (Basic Setup)
ALTER TABLE syrve_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Admins: Full access
CREATE POLICY "Admins have full access" ON syrve_config
  FOR ALL USING (auth.role() = 'authenticated'); -- TODO: Add precise role check later

CREATE POLICY "Everyone can read products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read categories" ON categories
  FOR SELECT USING (true);
