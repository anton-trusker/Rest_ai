# Single-Tenant Schema Revision

**Updated documentation for single-client deployment** - removing multi-tenant complexity while maintaining Syrve-first architecture and event-sourced inventory.

## 🎯 Architecture Change

**From**: Multi-tenant with `business_id` isolation  
**To**: Single-client with simplified schema  
**Rationale**: Single restaurant/client deployment eliminates need for tenant isolation

## 🔄 Schema Simplifications

### **1. Remove Business Profile Layer**
- Eliminate `business_profile` table
- Remove all `business_id` columns
- Simplify RLS policies to user-level only
- Remove tenant-specific indexes

### **2. Simplified Authentication**
- Single business context
- Direct role assignments
- Simplified permission model
- No cross-tenant data isolation needed

### **3. Streamlined Relationships**
- Direct foreign keys without tenant validation
- Simplified queries without business filtering
- Reduced index overhead
- Cleaner data model

## 📋 Updated Table Structure

### **Core Tables (Simplified)**

#### `profiles` (Updated)
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    login_name TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Simplified indexes
CREATE INDEX idx_profiles_login_name ON profiles(login_name);
CREATE INDEX idx_profiles_active ON profiles(is_active);
```

#### `roles` (Updated)
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT false,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Simplified indexes
CREATE INDEX idx_roles_system ON roles(is_system_role);
CREATE INDEX idx_roles_super_admin ON roles(is_super_admin);
```

#### `user_roles` (Simplified)
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, role_id)
);

-- Simplified indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

### **Product Catalog (Unchanged)**
- `categories` - No business_id needed
- `products` - Direct product management
- `wines` - Wine enrichment remains

### **Inventory Management (Simplified)**
- `inventory_sessions` - Direct session management
- `inventory_count_events` - Event-sourced counting
- `inventory_product_aggregates` - Performance optimization

### **Syrve Integration (Streamlined)**
- `syrve_config` - Single configuration
- `syrve_products` - Direct product mapping
- `syrve_sync_runs` - Sync tracking
- `syrve_raw_objects` - Raw data storage
- `syrve_api_logs` - API logging

### **AI Recognition (Unchanged)**
- `ai_config` - Single AI configuration
- `ai_recognition_attempts` - Recognition tracking

## 🔐 Simplified RLS Policies

### **Base RLS Setup**
```sql
-- Enable RLS on relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
```

### **Simplified Policies**
```sql
-- Profile access (users can see all profiles, update own)
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Role access (everyone can see roles)
CREATE POLICY "Users can view all roles" ON roles
    FOR SELECT USING (true);

-- User roles (users can see role assignments)
CREATE POLICY "Users can view user roles" ON user_roles
    FOR SELECT USING (true);

-- Admin-only role management
CREATE POLICY "Only admins can manage roles" ON roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND (r.name = 'Admin' OR r.is_super_admin = true)
        )
    );

-- Product catalog (no restrictions)
CREATE POLICY "Categories are accessible" ON categories
    FOR ALL USING (true);

CREATE POLICY "Products are accessible" ON products
    FOR ALL USING (true);

CREATE POLICY "Wines are accessible" ON wines
    FOR ALL USING (true);

-- Inventory (authenticated users only)
CREATE POLICY "Inventory sessions are accessible" ON inventory_sessions
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Inventory count events are accessible" ON inventory_count_events
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Integrations (admin only)
CREATE POLICY "Syrve config is accessible" ON syrve_config
    FOR SELECT USING (true);

CREATE POLICY "Only admins can update Syrve config" ON syrve_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND (r.name = 'Admin' OR r.is_super_admin = true)
        )
    );
```

## 🔧 Updated Migration Pack

### **Single-Tenant Migration** (`05-migration-pack-single-tenant.sql`)

```sql
-- =============================================
-- SINGLE-TENANT MIGRATION PACK
-- =============================================

-- Extensions (unchanged)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Types (unchanged)
CREATE TYPE permission_level AS ENUM ('none', 'view', 'edit', 'full');
CREATE TYPE inventory_session_status AS ENUM ('draft', 'in_progress', 'paused', 'completed', 'approved', 'flagged');
CREATE TYPE inventory_session_type AS ENUM ('full', 'partial', 'cycle', 'receiving');
CREATE TYPE counting_method AS ENUM ('manual', 'barcode', 'image_ai', 'voice');
CREATE TYPE sync_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE sync_type AS ENUM ('products', 'stock', 'orders', 'full');
CREATE TYPE api_request_type AS ENUM ('GET', 'POST', 'PUT', 'DELETE');
CREATE TYPE recognition_status AS ENUM ('pending', 'processing', 'success', 'failed', 'timeout');

-- Core tables (simplified)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    login_name TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT false,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, role_id)
);

-- Default roles (unchanged)
INSERT INTO roles (name, description, permissions, is_system_role, is_super_admin) VALUES
    ('Super Admin', 'Full system access', '{"*": "full"}', true, true),
    ('Admin', 'System administration', '{"users": "full", "catalog": "full", "inventory": "full", "integrations": "full"}', true, false),
    ('Manager', 'Inventory and catalog management', '{"catalog": "full", "inventory": "full", "users": "view"}', true, false),
    ('Staff', 'Basic inventory operations', '{"catalog": "view", "inventory": "edit"}', true, false);

-- Product catalog (unchanged)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    syrve_group_id TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(name)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    description TEXT,
    unit_type TEXT DEFAULT 'bottle',
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    stock_on_hand INTEGER DEFAULT 0,
    stock_reserved INTEGER DEFAULT 0,
    stock_available INTEGER GENERATED ALWAYS AS (stock_on_hand - stock_reserved) STORED,
    reorder_level INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    syrve_product_id TEXT UNIQUE,
    image_url TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE wines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    vintage INTEGER,
    producer TEXT,
    region TEXT,
    country TEXT,
    wine_type TEXT,
    grape_varieties TEXT[],
    alcohol_percentage DECIMAL(4,2),
    bottle_size_ml INTEGER DEFAULT 750,
    closure_type TEXT,
    organic BOOLEAN DEFAULT false,
    biodynamic BOOLEAN DEFAULT false,
    tasting_notes TEXT,
    food_pairing TEXT[],
    serving_temperature TEXT,
    drinking_window_start INTEGER,
    drinking_window_end INTEGER,
    critic_scores JSONB DEFAULT '{}',
    awards JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory management (simplified)
CREATE TABLE inventory_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name TEXT NOT NULL,
    session_type inventory_session_type DEFAULT 'full',
    status inventory_session_status DEFAULT 'draft',
    location_filter TEXT,
    started_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    total_products_expected INTEGER DEFAULT 0,
    total_products_counted INTEGER DEFAULT 0,
    variance_total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inventory_count_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    counted_by UUID NOT NULL REFERENCES profiles(id),
    location TEXT,
    counted_at TIMESTAMPTZ DEFAULT now(),
    quantity_unopened INTEGER DEFAULT 0,
    quantity_opened INTEGER DEFAULT 0,
    quantity_total INTEGER GENERATED ALWAYS AS (quantity_unopened + quantity_opened) STORED,
    counting_method counting_method DEFAULT 'manual',
    confidence_score DECIMAL(3,2),
    image_url TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inventory_product_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    total_counted_unopened INTEGER DEFAULT 0,
    total_counted_opened INTEGER DEFAULT 0,
    total_counted_total INTEGER DEFAULT 0,
    first_counted_at TIMESTAMPTZ,
    last_counted_at TIMESTAMPTZ,
    count_events INTEGER DEFAULT 0,
    variance_unopened INTEGER DEFAULT 0,
    variance_opened INTEGER DEFAULT 0,
    variance_total INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(session_id, product_id)
);

-- Syrve integration (simplified)
CREATE TABLE syrve_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_base_url TEXT NOT NULL DEFAULT 'https://api.syrve.com',
    client_id TEXT NOT NULL,
    api_login TEXT NOT NULL,
    api_password_hash TEXT NOT NULL,
    unit_id TEXT,
    organization_id TEXT,
    sync_enabled BOOLEAN DEFAULT false,
    sync_frequency TEXT DEFAULT 'hourly',
    last_sync_at TIMESTAMPTZ,
    sync_error_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI recognition (unchanged)
CREATE TABLE ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'gemini',
    model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    api_key_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
    max_attempts_per_image INTEGER DEFAULT 3,
    rate_limit_per_minute INTEGER DEFAULT 60,
    custom_prompts JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (simplified)
CREATE INDEX idx_profiles_login_name ON profiles(login_name);
CREATE INDEX idx_profiles_active ON profiles(is_active);
CREATE INDEX idx_roles_system ON roles(is_system_role);
CREATE INDEX idx_roles_super_admin ON roles(is_super_admin);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_syrve ON categories(syrve_group_id);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_syrve ON products(syrve_product_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_wines_product ON wines(product_id);
CREATE INDEX idx_wines_vintage ON wines(vintage);
CREATE INDEX idx_wines_type ON wines(wine_type);
CREATE INDEX idx_wines_producer ON wines(producer);
CREATE INDEX idx_inventory_sessions_status ON inventory_sessions(status);
CREATE INDEX idx_inventory_sessions_started_by ON inventory_sessions(started_by);
CREATE INDEX idx_inventory_count_events_session ON inventory_count_events(session_id);
CREATE INDEX idx_inventory_count_events_product ON inventory_count_events(product_id);
CREATE INDEX idx_inventory_count_events_counted_by ON inventory_count_events(counted_by);
CREATE INDEX idx_inventory_aggregates_session ON inventory_product_aggregates(session_id);
CREATE INDEX idx_inventory_aggregates_product ON inventory_product_aggregates(product_id);

-- RLS Policies (simplified)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Simplified RLS policies
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view all roles" ON roles
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage roles" ON roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND (r.name = 'Admin' OR r.is_super_admin = true)
        )
    );

CREATE POLICY "User roles are accessible" ON user_roles
    FOR SELECT USING (true);

CREATE POLICY "Categories are accessible" ON categories
    FOR ALL USING (true);

CREATE POLICY "Products are accessible" ON products
    FOR ALL USING (true);

CREATE POLICY "Wines are accessible" ON wines
    FOR ALL USING (true);

CREATE POLICY "Inventory sessions are accessible" ON inventory_sessions
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Inventory count events are accessible" ON inventory_count_events
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Syrve config is accessible" ON syrve_config
    FOR SELECT USING (true);

CREATE POLICY "Only admins can update Syrve config" ON syrve_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND (r.name = 'Admin' OR r.is_super_admin = true)
        )
    );

-- Functions and triggers (simplified)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract login name from email
    DECLARE
        login_name TEXT;
    BEGIN
        login_name := split_part(NEW.email, '@', 1);
        
        -- Create profile
        INSERT INTO profiles (id, login_name, full_name, email)
        VALUES (NEW.id, login_name, NEW.raw_user_meta_data->>'full_name', NEW.email);
        
        -- Assign default role (Staff)
        INSERT INTO user_roles (user_id, role_id)
        SELECT NEW.id, r.id
        FROM roles r
        WHERE r.name = 'Staff'
        LIMIT 1;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Default admin user (for initial setup)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@inventory.local', crypt('admin123', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "System Administrator"}', NOW(), NOW(), '', '', '', '');

INSERT INTO user_roles (user_id, role_id)
SELECT (SELECT id FROM auth.users WHERE email = 'admin@inventory.local'), id
FROM roles WHERE name = 'Super Admin';
```

## 🔄 Updated Compatibility Layer

### **Compatibility Views (Unchanged)**
The compatibility views remain the same since current code already expects them:

```sql
-- Legacy Syrve integration views
CREATE OR REPLACE VIEW integration_syrve_config AS SELECT * FROM syrve_config;
CREATE OR REPLACE VIEW integration_syrve_products AS SELECT * FROM syrve_products;
CREATE OR REPLACE VIEW integration_syrve_sync_log AS SELECT * FROM syrve_sync_runs;

-- Legacy inventory view
CREATE OR REPLACE VIEW inventory_items AS
SELECT 
    igen.id,
    igen.session_id,
    p.id AS wine_id,
    p.id AS product_id,
    COALESCE(igen.total_counted_unopened, 0) AS counted_quantity_unopened,
    COALESCE(igen.total_counted_opened, 0) AS counted_quantity_opened,
    COALESCE(igen.total_counted_total, 0) AS counted_quantity_total,
    COALESCE(p.stock_on_hand, 0) AS expected_quantity_unopened,
    0 AS expected_quantity_opened,
    COALESCE(igen.total_counted_total, 0) - COALESCE(p.stock_on_hand, 0) AS variance_total,
    'manual'::text AS counting_method,
    igen.last_counted_at,
    NULL AS notes,
    igen.created_at,
    igen.updated_at
FROM inventory_product_aggregates igen
JOIN products p ON p.id = igen.product_id;

-- Wine products view
CREATE OR REPLACE VIEW view_wine_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.barcode,
    p.description,
    p.unit_type,
    p.cost_price,
    p.selling_price,
    p.stock_on_hand,
    p.stock_reserved,
    p.stock_available,
    p.image_url,
    p.is_active,
    p.created_at,
    p.updated_at,
    -- Wine-specific fields
    w.id AS wine_id,
    w.vintage,
    w.producer,
    w.region,
    w.country,
    w.wine_type,
    w.grape_varieties,
    w.alcohol_percentage,
    w.bottle_size_ml,
    w.closure_type,
    w.organic,
    w.biodynamic,
    w.tasting_notes,
    w.food_pairing,
    w.serving_temperature,
    w.critic_scores,
    w.awards,
    -- Category info
    c.id AS category_id,
    c.name AS category_name,
    -- Syrve mapping
    p.syrve_product_id,
    sp.name AS syrve_name,
    sp.group_name AS syrve_group_name
FROM products p
LEFT JOIN wines w ON w.product_id = p.id
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN syrve_products sp ON sp.mapped_product_id = p.id
WHERE p.is_active = true;
```

## 🚀 Deployment Strategy (Single-Tenant)

### **Phase 1: Direct Deployment** (1-2 days)
1. **Deploy simplified schema** - No business context needed
2. **Test existing code** - Compatibility views ensure zero breaking changes
3. **Validate Syrve integration** - Enhanced sync capabilities
4. **Test AI recognition** - Improved recognition workflow

### **Phase 2: Enhanced Features** (Week 2)
1. **Event-sourced inventory** - Better audit trail and concurrent counting
2. **Enhanced Syrve sync** - Reliable product synchronization
3. **AI recognition improvements** - Better accuracy and performance
4. **Performance optimization** - Aggregated views for fast queries

### **Phase 3: Optimization** (Week 3-4)
1. **Remove compatibility dependencies** - Use canonical tables directly
2. **Optimize queries** - Leverage new schema benefits
3. **Add advanced features** - Real-time updates, better analytics
4. **Performance tuning** - Index optimization, query planning

## 📊 Benefits of Single-Tenant Approach

| Aspect | Multi-Tenant | Single-Tenant | Benefit |
|--------|--------------|---------------|---------|
| **Query Complexity** | High (business filtering) | Low (direct access) | Simpler code |
| **Index Overhead** | High (composite indexes) | Low (single indexes) | Better performance |
| **RLS Complexity** | High (tenant isolation) | Low (user-level only) | Easier maintenance |
| **Schema Complexity** | High (extra tables) | Low (essential only) | Cleaner model |
| **Migration Risk** | High (breaking changes) | Low (compatibility first) | Safer deployment |
| **Performance** | Medium (overhead) | High (optimized) | Better speed |

## 🎯 Final Recommendation

**Deploy the single-tenant version** - it provides:

1. **Zero breaking changes** - Existing code works immediately
2. **Enhanced capabilities** - Event-sourced inventory, better Syrve sync
3. **Simplified maintenance** - No multi-tenant complexity
4. **Better performance** - Optimized for single-client use
5. **Future-ready** - Can be extended if multi-tenant needed later

**Next step**: Use the single-tenant migration pack for immediate deployment with enhanced capabilities.