-- Global Inventory Session System
-- Migration: Create global inventory session tables
-- Purpose: Replace per-user sessions with single global session model
-- Author: System
-- Date: 2026-02-11

-- =====================================================
-- 1. Global Inventory Session Table
-- =====================================================
CREATE TABLE IF NOT EXISTS global_inventory_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL CHECK (status IN ('preparing', 'active', 'review', 'approved', 'cancelled')),
    started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    notes TEXT,
    syrve_store_id TEXT,
    expected_stock_loaded_at TIMESTAMPTZ,
    expected_stock_count INTEGER DEFAULT 0,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    syrve_document_number TEXT,
    syrve_document_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_session 
ON global_inventory_session (status) 
WHERE status IN ('preparing', 'active', 'review');

CREATE INDEX IF NOT EXISTS idx_global_inv_session_started_by ON global_inventory_session(started_by);
CREATE INDEX IF NOT EXISTS idx_global_inv_session_created_at ON global_inventory_session(created_at DESC);

-- =====================================================
-- 2. Expected Stock Table
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_expected_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES global_inventory_session(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    syrve_product_id TEXT,
    expected_amount DECIMAL(10,3) NOT NULL,
    expected_sum DECIMAL(12,2) DEFAULT 0,
    expected_unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_expected_stock_session ON inventory_expected_stock(session_id);
CREATE INDEX IF NOT EXISTS idx_expected_stock_product ON inventory_expected_stock(product_id);

-- =====================================================
-- 3. Inventory Change Log (Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES global_inventory_session(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_change_log_session ON inventory_change_log(session_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_log_product ON inventory_change_log(product_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_log_user ON inventory_change_log(changed_by, changed_at DESC);

-- =====================================================
-- 4. Modify Existing inventory_items Table
-- =====================================================
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS global_session_id UUID REFERENCES global_inventory_session(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS expected_amount DECIMAL(10,3),
    ADD COLUMN IF NOT EXISTS variance DECIMAL(10,3),
    ADD COLUMN IF NOT EXISTS variance_percentage DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_inventory_items_global_session ON inventory_items(global_session_id);

-- =====================================================
-- 5. Add New Permissions
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'inventory' AND action = 'start') THEN
        INSERT INTO permissions (module, action, display_name, description) 
        VALUES ('inventory', 'start', 'Start Inventorisation', 'Can start a global inventorisation session');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'inventory' AND action = 'complete') THEN
        INSERT INTO permissions (module, action, display_name, description) 
        VALUES ('inventory', 'complete', 'Complete Inventorisation', 'Can mark inventorisation as complete for review');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'inventory' AND action = 'approve') THEN
        INSERT INTO permissions (module, action, display_name, description) 
        VALUES ('inventory', 'approve', 'Approve Inventorisation', 'Can approve and submit inventorisation to Syrve');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE module = 'inventory' AND action = 'cancel') THEN
        INSERT INTO permissions (module, action, display_name, description) 
        VALUES ('inventory', 'cancel', 'Cancel Inventorisation', 'Can cancel active inventorisation session');
    END IF;
END $$;

-- =====================================================
-- 6. Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_inventory_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_items_timestamp ON inventory_items;
CREATE TRIGGER update_inventory_items_timestamp
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_item_timestamp();

CREATE OR REPLACE FUNCTION update_global_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_global_inventory_session_timestamp ON global_inventory_session;
CREATE TRIGGER update_global_inventory_session_timestamp
    BEFORE UPDATE ON global_inventory_session
    FOR EACH ROW
    EXECUTE FUNCTION update_global_session_timestamp();

-- =====================================================
-- 7. RLS Policies (Fixed: Direct Joins)
-- =====================================================
ALTER TABLE global_inventory_session ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view global session" ON global_inventory_session;
CREATE POLICY "Anyone can view global session"
    ON global_inventory_session FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Only authorized users can start session" ON global_inventory_session;
CREATE POLICY "Only authorized users can start session"
    ON global_inventory_session FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN user_roles ur ON rp.role_id = ur.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND p.module = 'inventory'
            AND p.action = 'start'
        )
    );

DROP POLICY IF EXISTS "Only authorized users can update session" ON global_inventory_session;
CREATE POLICY "Only authorized users can update session"
    ON global_inventory_session FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN user_roles ur ON rp.role_id = ur.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND p.module = 'inventory'
            AND p.action IN ('start', 'complete', 'approve', 'cancel')
        )
    );

ALTER TABLE inventory_expected_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view expected stock" ON inventory_expected_stock;
CREATE POLICY "Users can view expected stock"
    ON inventory_expected_stock FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "System can manage expected stock" ON inventory_expected_stock;
CREATE POLICY "System can manage expected stock"
    ON inventory_expected_stock FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN user_roles ur ON rp.role_id = ur.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = auth.uid()
            AND p.module = 'inventory'
            AND p.action = 'start'
        )
    );

ALTER TABLE inventory_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view change log" ON inventory_change_log;
CREATE POLICY "Anyone can view change log"
    ON inventory_change_log FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "System can write to change log" ON inventory_change_log;
CREATE POLICY "System can write to change log"
    ON inventory_change_log FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = changed_by);

-- =====================================================
-- 8. Helper Functions
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_global_session()
RETURNS TABLE (
    id UUID,
    status TEXT,
    started_by UUID,
    started_at TIMESTAMPTZ,
    location_id UUID,
    notes TEXT,
    syrve_store_id TEXT,
    expected_stock_loaded_at TIMESTAMPTZ,
    expected_stock_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gis.id,
        gis.status,
        gis.started_by,
        gis.started_at,
        gis.location_id,
        gis.notes,
        gis.syrve_store_id,
        gis.expected_stock_loaded_at,
        gis.expected_stock_count
    FROM global_inventory_session gis
    WHERE gis.status IN ('preparing', 'active', 'review')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_start_inventorisation(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN user_roles ur ON rp.role_id = ur.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1
        AND p.module = 'inventory'
        AND p.action = 'start'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. Comments
-- =====================================================
COMMENT ON TABLE global_inventory_session IS 'Single global inventorisation session - only one active at a time';
COMMENT ON TABLE inventory_expected_stock IS 'Expected stock levels loaded from Syrve at session start';
COMMENT ON TABLE inventory_change_log IS 'Audit trail of all inventory changes during a session';
