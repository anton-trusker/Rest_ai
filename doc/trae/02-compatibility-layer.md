# Compatibility Layer & Views

Database views and RPC functions that maintain backward compatibility with existing code while the canonical schema evolves. These provide a bridge during the migration period.

## 🔄 Compatibility Strategy

### **Phase 1: Views (Immediate)**
- Create views with legacy table/column names
- Map canonical schema to expected interfaces
- Zero code changes required

### **Phase 2: Gradual Migration**
- Update frontend stores to use canonical tables directly
- Maintain views for legacy integrations
- Monitor view usage for deprecation timeline

### **Phase 3: Cleanup**
- Remove unused views after full migration
- Optimize queries for canonical schema
- Archive compatibility documentation

## 📋 Compatibility Views

### **1. Legacy Syrve Integration Views**

#### `integration_syrve_config`
Maps to canonical `syrve_config` table.

```sql
CREATE OR REPLACE VIEW integration_syrve_config AS
SELECT 
    id,
    business_id,
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
```

#### `integration_syrve_products`
Maps to canonical `syrve_products` table.

```sql
CREATE OR REPLACE VIEW integration_syrve_products AS
SELECT 
    id,
    business_id,
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
```

#### `integration_syrve_sync_log`
Maps to canonical `syrve_sync_runs` table.

```sql
CREATE OR REPLACE VIEW integration_syrve_sync_log AS
SELECT 
    id,
    business_id,
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
```

### **2. Legacy Inventory Views**

#### `inventory_items`
Aggregates `inventory_count_events` to mimic mutable inventory items.

```sql
CREATE OR REPLACE VIEW inventory_items AS
SELECT 
    igen.uuid AS id,
    igen.session_id,
    p.id AS wine_id, -- Maps to product_id for wine compatibility
    p.id AS product_id,
    COALESCE(igen.total_counted_unopened, 0) AS counted_quantity_unopened,
    COALESCE(igen.total_counted_opened, 0) AS counted_quantity_opened,
    COALESCE(igen.total_counted_total, 0) AS counted_quantity_total,
    COALESCE(p.stock_on_hand, 0) AS expected_quantity_unopened,
    0 AS expected_quantity_opened,
    COALESCE(igen.total_counted_total, 0) - COALESCE(p.stock_on_hand, 0) AS variance_total,
    'manual'::counting_method AS counting_method,
    igen.last_counted_at,
    NULL AS notes,
    igen.created_at,
    igen.updated_at
FROM inventory_product_aggregates igen
JOIN products p ON p.id = igen.product_id
WHERE igen.session_id IS NOT NULL;
```

#### `view_wine_products`
Wine-centric view combining products and wines for catalog display.

```sql
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
LEFT JOIN syrve_products sp ON sp.mapped_product_id = p.id AND sp.business_id = p.business_id
WHERE p.is_active = true;
```

### **3. Legacy Role Views**

#### `roles` (with permissions compatibility)
Maintains current code expectations for role permissions.

```sql
CREATE OR REPLACE VIEW roles_compat AS
SELECT 
    r.id,
    r.business_id,
    r.name,
    r.description,
    r.color,
    r.permissions,
    r.is_system_role,
    r.is_super_admin,
    r.created_at,
    r.updated_at,
    -- Computed fields for legacy compatibility
    CASE 
        WHEN r.permissions ? 'catalog' THEN r.permissions->>'catalog'
        ELSE 'none'
    END AS catalog_permission,
    CASE 
        WHEN r.permissions ? 'users' THEN r.permissions->>'users'
        ELSE 'none'
    END AS users_permission,
    CASE 
        WHEN r.permissions ? 'inventory' THEN r.permissions->>'inventory'
        ELSE 'none'
    END AS inventory_permission
FROM roles r;
```

## 🔧 Utility Functions

### **Permission Checking Functions**

```sql
-- Check if user has specific permission
CREATE OR REPLACE FUNCTION check_user_permission(
    user_id UUID,
    permission_key TEXT,
    required_level permission_level DEFAULT 'view'
) RETURNS BOOLEAN AS $$
DECLARE
    user_business_id UUID;
    user_role RECORD;
    permission_value TEXT;
    permission_hierarchy permission_level[] := ARRAY['none', 'view', 'edit', 'full'];
    user_level_index INTEGER;
    required_level_index INTEGER;
BEGIN
    -- Get user's business
    SELECT business_id INTO user_business_id 
    FROM profiles 
    WHERE id = user_id;
    
    -- Check super admin first
    SELECT r.* INTO user_role
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = user_id 
    AND ur.business_id = user_business_id
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
    AND ur.business_id = user_business_id
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

-- Convenience function for checking module permissions
CREATE OR REPLACE FUNCTION check_module_permission(
    user_id UUID,
    module_name TEXT,
    required_level permission_level DEFAULT 'view'
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN check_user_permission(user_id, module_name, required_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Inventory Aggregation Functions**

```sql
-- Refresh inventory aggregates for a session
CREATE OR REPLACE FUNCTION refresh_inventory_aggregates(
    session_uuid UUID
) RETURNS VOID AS $$
BEGIN
    -- Delete old aggregates
    DELETE FROM inventory_product_aggregates 
    WHERE session_id = session_uuid;
    
    -- Insert new aggregates
    INSERT INTO inventory_product_aggregates (
        business_id,
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
        business_id,
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
    JOIN products p ON p.id = ice.product_id AND p.business_id = ice.business_id
    WHERE session_id = session_uuid
    GROUP BY business_id, session_id, product_id;
    
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
```

### **Syrve Mapping Functions**

```sql
-- Find best matching product for Syrve product
CREATE OR REPLACE FUNCTION find_syrve_product_match(
    business_uuid UUID,
    syrve_name TEXT,
    syrve_sku TEXT,
    syrve_barcode TEXT,
    syrve_group_name TEXT
) RETURNS TABLE (
    product_id UUID,
    confidence_score DECIMAL(3,2),
    match_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        CASE 
            WHEN p.barcode = syrve_barcode AND syrve_barcode IS NOT NULL THEN 1.0
            WHEN p.sku = syrve_sku AND syrve_sku IS NOT NULL THEN 0.9
            WHEN similarity(p.name, syrve_name) > 0.8 THEN 0.7
            WHEN similarity(p.name, syrve_name) > 0.6 THEN 0.5
            ELSE 0.0
        END AS confidence_score,
        CASE 
            WHEN p.barcode = syrve_barcode AND syrve_barcode IS NOT NULL THEN 'barcode_match'
            WHEN p.sku = syrve_sku AND syrve_sku IS NOT NULL THEN 'sku_match'
            WHEN similarity(p.name, syrve_name) > 0.8 THEN 'name_high_similarity'
            WHEN similarity(p.name, syrve_name) > 0.6 THEN 'name_medium_similarity'
            ELSE 'no_match'
        END AS match_reason
    FROM products p
    WHERE p.business_id = business_uuid
    AND p.is_active = true
    AND (
        p.barcode = syrve_barcode 
        OR p.sku = syrve_sku 
        OR similarity(p.name, syrve_name) > 0.6
    )
    ORDER BY confidence_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🎯 Usage Examples

### **Legacy Code Compatibility**

```typescript
// Current code continues to work
const { data: inventoryItems } = await supabase
  .from('inventory_items')
  .select('*')
  .eq('session_id', sessionId);

// Actually queries the compatibility view
// Behind the scenes: aggregates inventory_count_events
```

### **New Code Using Canonical Schema**

```typescript
// New code uses canonical tables directly
const { data: countEvents } = await supabase
  .from('inventory_count_events')
  .select('*')
  .eq('session_id', sessionId);

// More efficient for event-sourced operations
```

## 📈 Performance Optimization

### **Materialized Views for Heavy Aggregations**

```sql
-- Create materialized view for frequently accessed inventory summaries
CREATE MATERIALIZED VIEW inventory_session_summary AS
SELECT 
    s.id AS session_id,
    s.business_id,
    s.session_name,
    s.status,
    COUNT(DISTINCT ice.product_id) AS products_counted,
    SUM(ice.quantity_total) AS total_items_counted,
    SUM(ice.quantity_total) - SUM(p.stock_on_hand) AS total_variance,
    COUNT(CASE WHEN ice.quantity_total != p.stock_on_hand THEN 1 END) AS products_with_variance
FROM inventory_sessions s
LEFT JOIN inventory_count_events ice ON ice.session_id = s.id
LEFT JOIN products p ON p.id = ice.product_id AND p.business_id = ice.business_id
WHERE s.status IN ('completed', 'approved')
GROUP BY s.id, s.business_id, s.session_name, s.status;

-- Refresh strategy
CREATE INDEX idx_inventory_session_summary_business ON inventory_session_summary(business_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_session_summary;
```

## 🔄 Migration Timeline

| Phase | Duration | Actions |
|-------|----------|---------|
| **Phase 1** | Week 1-2 | Deploy compatibility views, test existing code |
| **Phase 2** | Week 3-6 | Gradually migrate stores to canonical tables |
| **Phase 3** | Week 7-8 | Remove unused views, optimize canonical queries |
| **Phase 4** | Week 9+ | Monitor, cleanup, document final state |

## ⚠️ Important Notes

1. **View Performance**: Some views may be slower than direct table queries
2. **Data Consistency**: Views show real-time data but aggregates may have slight delays
3. **Migration Order**: Always test compatibility views before migrating code
4. **Monitoring**: Track view usage to identify migration priorities

---

**Next Step**: Review [authentication and RLS policies](03-auth-rls-policies.md) for security implementation.