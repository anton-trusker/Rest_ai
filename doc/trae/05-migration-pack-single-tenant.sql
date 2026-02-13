-- Wine Inventory Management System - Single-Tenant Migration Pack
-- Simplified schema for single-client deployment
-- Execute in sequence: supabase db push --file migration-pack-single-tenant.sql

-- =============================================
-- MIGRATION 01: Extensions and Base Setup
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch"; -- For similarity matching
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For GIN indexes

-- Create custom types
CREATE TYPE permission_level AS ENUM ('none', 'view', 'edit', 'full');
CREATE TYPE inventory_session_status AS ENUM ('draft', 'in_progress', 'paused', 'completed', 'approved', 'flagged');
CREATE TYPE inventory_session_type AS ENUM ('full', 'partial', 'cycle', 'receiving');
CREATE TYPE counting_method AS ENUM ('manual', 'barcode', 'image_ai', 'voice');
CREATE TYPE sync_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE sync_type AS ENUM ('products', 'stock', 'orders', 'full');
CREATE TYPE api_request_type AS ENUM ('GET', 'POST', 'PUT', 'DELETE');
CREATE TYPE recognition_status AS ENUM ('pending', 'processing', 'success', 'failed', 'timeout');

-- =============================================
-- MIGRATION 02: Core Authentication Tables
-- =============================================

-- User profiles (linked to auth.users)
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

-- Roles with JSONB permissions
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

-- Default roles
INSERT INTO roles (name, description, permissions, is_system_role, is_super_admin) VALUES
    ('Super Admin', 'Full system access', '{"*": "full"}', true, true),
    ('Admin', 'System administration', '{"users": "full", "catalog": "full", "inventory": "full", "integrations": "full"}', true, false),
    ('Manager', 'Inventory and catalog management', '{"catalog": "full", "inventory": "full", "users": "view"}', true, false),
    ('Staff', 'Basic inventory operations', '{"catalog": "view", "inventory": "edit"}', true, false);

-- User role assignments
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, role_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_login_name ON profiles(login_name);
CREATE INDEX idx_profiles_active ON profiles(is_active);
CREATE INDEX idx_roles_system ON roles(is_system_role);
CREATE INDEX idx_roles_super_admin ON roles(is_super_admin);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- =============================================
-- MIGRATION 03: Product Catalog Tables
-- =============================================

-- Categories
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

-- Products (generic product catalog)
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

-- Wines (wine-specific product enrichment)
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

-- Indexes for product catalog
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

-- =============================================
-- MIGRATION 04: Inventory Management Tables
-- =============================================

-- Inventory sessions
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

-- Inventory count events (event-sourced)
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

-- Inventory product aggregates (materialized for performance)
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

-- Indexes for inventory
CREATE INDEX idx_inventory_sessions_status ON inventory_sessions(status);
CREATE INDEX idx_inventory_sessions_started_by ON inventory_sessions(started_by);
CREATE INDEX idx_inventory_count_events_session ON inventory_count_events(session_id);
CREATE INDEX idx_inventory_count_events_product ON inventory_count_events(product_id);
CREATE INDEX idx_inventory_count_events_counted_by ON inventory_count_events(counted_by);
CREATE INDEX idx_inventory_count_events_counted_at ON inventory_count_events(counted_at);
CREATE INDEX idx_inventory_aggregates_session ON inventory_product_aggregates(session_id);
CREATE INDEX idx_inventory_aggregates_product ON inventory_product_aggregates(product_id);

-- =============================================
-- MIGRATION 05: Syrve Integration Tables
-- =============================================

-- Syrve configuration (singleton)
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

-- Syrve products (raw Syrve data)
CREATE TABLE syrve_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    group_id TEXT,
    group_name TEXT,
    unit TEXT,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    stock_on_hand INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    raw_data JSONB NOT NULL,
    mapped_product_id UUID REFERENCES products(id),
    mapping_confidence DECIMAL(3,2),
    mapping_notes TEXT,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(syrve_product_id)
);

-- Syrve sync runs
CREATE TABLE syrve_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type sync_type NOT NULL,
    status sync_status DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    items_processed INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '[]',
    sync_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Syrve raw objects (lossless storage)
CREATE TABLE syrve_raw_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_type TEXT NOT NULL,
    object_id TEXT NOT NULL,
    sync_run_id UUID REFERENCES syrve_sync_runs(id) ON DELETE SET NULL,
    raw_data JSONB NOT NULL,
    hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(object_type, object_id, hash)
);

-- Syrve API logs
CREATE TABLE syrve_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_run_id UUID REFERENCES syrve_sync_runs(id) ON DELETE SET NULL,
    request_type api_request_type NOT NULL,
    endpoint TEXT NOT NULL,
    request_body JSONB,
    response_status INTEGER,
    response_body JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Syrve integration
CREATE INDEX idx_syrve_config_sync_enabled ON syrve_config(sync_enabled);
CREATE INDEX idx_syrve_products_syrve_id ON syrve_products(syrve_product_id);
CREATE INDEX idx_syrve_products_mapped ON syrve_products(mapped_product_id);
CREATE INDEX idx_syrve_products_group ON syrve_products(group_id);
CREATE INDEX idx_syrve_sync_runs_type ON syrve_sync_runs(sync_type);
CREATE INDEX idx_syrve_sync_runs_status ON syrve_sync_runs(status);
CREATE INDEX idx_syrve_sync_runs_created_at ON syrve_sync_runs(created_at DESC);
CREATE INDEX idx_syrve_raw_objects_type ON syrve_raw_objects(object_type);
CREATE INDEX idx_syrve_raw_objects_sync ON syrve_raw_objects(sync_run_id);
CREATE INDEX idx_syrve_api_logs_sync ON syrve_api_logs(sync_run_id);
CREATE INDEX idx_syrve_api_logs_created ON syrve_api_logs(created_at DESC);

-- =============================================
-- MIGRATION 06: AI Recognition Tables
-- =============================================

-- AI configuration
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

-- AI recognition attempts
CREATE TABLE ai_recognition_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    session_id UUID REFERENCES inventory_sessions(id),
    image_url TEXT NOT NULL,
    image_hash TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    status recognition_status DEFAULT 'pending',
    recognized_product_id UUID REFERENCES products(id),
    recognized_product_name TEXT,
    confidence_score DECIMAL(3,2),
    raw_response JSONB,
    error_message TEXT,
    processing_duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for AI tables
CREATE INDEX idx_ai_config_active ON ai_config(is_active);
CREATE INDEX idx_ai_recognition_user ON ai_recognition_attempts(user_id);
CREATE INDEX idx_ai_recognition_session ON ai_recognition_attempts(session_id);
CREATE INDEX idx_ai_recognition_status ON ai_recognition_attempts(status);
CREATE INDEX idx_ai_recognition_image ON ai_recognition_attempts(image_hash);

-- =============================================
-- MIGRATION 07: Row Level Security (Simplified)
-- =============================================

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

-- Simplified RLS policies (single-tenant)
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

CREATE POLICY "AI config is accessible" ON ai_config
    FOR SELECT USING (true);

CREATE POLICY "Only admins can update AI config" ON ai_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND (r.name = 'Admin' OR r.is_super_admin = true)
        )
    );

CREATE POLICY "AI recognition attempts are accessible" ON ai_recognition_attempts
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =============================================
-- MIGRATION 08: Functions and Triggers
-- =============================================

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    user_id UUID,
    permission_key TEXT,
    required_level permission_level DEFAULT 'view'
) RETURNS BOOLEAN AS $$
DECLARE
    user_role RECORD;
    permission_value TEXT;
    permission_hierarchy permission_level[] := ARRAY['none', 'view', 'edit', 'full'];
    user_level_index INTEGER;
    required_level_index INTEGER;
BEGIN
    -- Check super admin first
    SELECT r.* INTO user_role
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = user_id 
    AND r.is_super_admin = true
    LIMIT 1;
    
    IF user_role IS NOT NULL THEN
        RETURN true;
    END IF;
    
    -- Get user's primary role permissions
    SELECT r.* INTO user_role
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = user_id 
    AND (ur.is_primary = true OR NOT EXISTS (
        SELECT 1 FROM user_roles ur2 
        WHERE ur2.user_id = user_id 
        AND ur2.is_primary = true
    ))
    ORDER BY ur.is_primary DESC
    LIMIT 1;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check wildcard permission
    IF user_role.permissions ? '*' THEN
        permission_value := user_role.permissions->>'*';
        IF permission_value = 'full' THEN
            RETURN true;
        END IF;
    END IF;
    
    -- Check specific permission
    IF user_role.permissions ? permission_key THEN
        permission_value := user_role.permissions->>permission_key;
    ELSE
        -- Check module-level permission
        DECLARE
            module_name TEXT;
            module_perms JSONB;
        BEGIN
            module_name := split_part(permission_key, '.', 1);
            IF user_role.permissions ? module_name THEN
                module_perms := user_role.permissions->module_name;
                IF jsonb_typeof(module_perms) = 'object' THEN
                    -- Get highest permission in module
                    SELECT MAX(
                        CASE 
                            WHEN value = 'full' THEN 3
                            WHEN value = 'edit' THEN 2
                            WHEN value = 'view' THEN 1
                            ELSE 0
                        END
                    ) INTO user_level_index
                    FROM jsonb_each_text(module_perms);
                ELSE
                    permission_value := module_perms::TEXT;
                END IF;
            END IF;
        END;
    END IF;
    
    -- Convert permission levels to indices
    user_level_index := CASE 
        WHEN permission_value = 'full' THEN 3
        WHEN permission_value = 'edit' THEN 2
        WHEN permission_value = 'view' THEN 1
        ELSE 0
    END;
    
    required_level_index := CASE 
        WHEN required_level = 'full' THEN 3
        WHEN required_level = 'edit' THEN 2
        WHEN required_level = 'view' THEN 1
        ELSE 0
    END;
    
    RETURN user_level_index >= required_level_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh inventory aggregates
CREATE OR REPLACE FUNCTION refresh_inventory_aggregates(
    session_uuid UUID
) RETURNS VOID AS $$
BEGIN
    -- Delete old aggregates
    DELETE FROM inventory_product_aggregates 
    WHERE session_id = session_uuid;
    
    -- Insert new aggregates
    INSERT INTO inventory_product_aggregates (
        session_id,
        product_id,
        total_counted_unopened,
        total_counted_opened,
        total_counted_total,
        first_counted_at,
        last_counted_at,
        count_events,
        variance_unopened,
        variance_opened,
        variance_total
    )
    SELECT 
        session_id,
        product_id,
        SUM(quantity_unopened) AS total_unopened,
        SUM(quantity_opened) AS total_opened,
        SUM(quantity_total) AS total_total,
        MIN(counted_at) AS first_count,
        MAX(counted_at) AS last_count,
        COUNT(*) AS event_count,
        SUM(quantity_unopened) - COALESCE(MAX(p.stock_on_hand), 0) AS var_unopened,
        SUM(quantity_opened) AS var_opened,
        SUM(quantity_total) - COALESCE(MAX(p.stock_on_hand), 0) AS var_total
    FROM inventory_count_events ice
    JOIN products p ON p.id = ice.product_id
    WHERE session_id = session_uuid
    GROUP BY session_id, product_id;
    
    -- Update session totals
    UPDATE inventory_sessions 
    SET 
        total_products_counted = (
            SELECT COUNT(DISTINCT product_id) 
            FROM inventory_count_events 
            WHERE session_id = session_uuid
        ),
        variance_total = (
            SELECT SUM(variance_total) 
            FROM inventory_product_aggregates 
            WHERE session_id = session_uuid
        ),
        updated_at = now()
    WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on auth.user creation
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

-- Trigger to refresh inventory aggregates
CREATE OR REPLACE FUNCTION handle_inventory_count_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh aggregates for the session
    PERFORM refresh_inventory_aggregates(NEW.session_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER inventory_count_event_trigger
    AFTER INSERT ON inventory_count_events
    FOR EACH ROW EXECUTE FUNCTION handle_inventory_count_event();

-- =============================================
-- MIGRATION 09: Compatibility Views
-- =============================================

-- Legacy Syrve integration views (for current code compatibility)
CREATE OR REPLACE VIEW integration_syrve_config AS
SELECT 
    id,
    api_base_url,
    client_id,
    api_login,
    api_password_hash,
    unit_id,
    organization_id,
    sync_enabled,
    sync_frequency,
    last_sync_at,
    sync_error_count,
    metadata,
    created_at,
    updated_at
FROM syrve_config;

CREATE OR REPLACE VIEW integration_syrve_products AS
SELECT 
    id,
    syrve_product_id,
    name,
    sku,
    barcode,
    group_id,
    group_name,
    unit,
    price,
    cost,
    stock_on_hand,
    is_active,
    raw_data,
    mapped_product_id,
    mapping_confidence,
    mapping_notes,
    last_sync_at,
    created_at,
    updated_at
FROM syrve_products;

CREATE OR REPLACE VIEW integration_syrve_sync_log AS
SELECT 
    id,
    sync_type,
    status,
    started_at,
    completed_at,
    duration_ms,
    items_processed,
    items_created,
    items_updated,
    items_skipped,
    errors_count,
    error_details,
    sync_config,
    created_by,
    created_at
FROM syrve_sync_runs;

-- Legacy inventory view (aggregates events to match current code expectations)
CREATE OR REPLACE VIEW inventory_items AS
SELECT 
    igen.id,
    igen.session_id,
    p.id AS wine_id,              -- Map to wine_id for compatibility
    p.id AS product_id,           -- Also provide product_id
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

-- Wine products view for catalog display
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

-- =============================================
-- MIGRATION 10: Final Setup and Validation
-- =============================================

-- Insert default admin user (for initial setup)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES 
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@inventory.local', crypt('admin123', gen_salt('bf')), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "System Administrator"}', NOW(), NOW(), '', '', '', '');

-- Grant admin role to default user
INSERT INTO user_roles (user_id, role_id)
SELECT (SELECT id FROM auth.users WHERE email = 'admin@inventory.local'), id
FROM roles WHERE name = 'Super Admin';

-- Final validation
SELECT 
    'Single-tenant migration completed successfully!' as message,
    (SELECT COUNT(*) FROM profiles) as profile_count,
    (SELECT COUNT(*) FROM roles) as role_count,
    (SELECT COUNT(*) FROM categories) as category_count,
    (SELECT COUNT(*) FROM products) as product_count,
    (SELECT COUNT(*) FROM inventory_sessions) as session_count;

-- Notes for deployment:
-- 1. Update auth.users insert with secure password for production
-- 2. Configure environment variables for Edge Functions
-- 3. Deploy Edge Functions after database migration
-- 4. Test RLS policies with different user roles
-- 5. Set up monitoring and alerting
-- 6. This is single-tenant version - no business_id columns needed