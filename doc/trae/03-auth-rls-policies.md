# Authentication & RLS Policies

Complete authentication system with synthetic email login, role-based permissions, and multi-tenant row-level security (RLS) policies.

## 🔐 Authentication Architecture

### **Synthetic Email Pattern**
- **Pattern**: `{loginName}@inventory.local`
- **Purpose**: Bridge username-based login with Supabase's email auth
- **Collision Prevention**: Unique per business via `login_name` constraint
- **Migration Safe**: Existing auth flows continue unchanged

### **Auth Flow Overview**
```
User Login (loginName + password)
    ↓
Frontend: email = `${loginName}@inventory.local`
    ↓
Supabase Auth: signInWithPassword(email, password)
    ↓
Backend: Fetch profile + roles
    ↓
Session: User object with permissions
```

## 👥 User Management

### **Profile Creation Process**

```sql
-- Trigger to auto-create profile on auth.user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract login name from email
    DECLARE
        login_name TEXT;
        business_uuid UUID;
    BEGIN
        login_name := split_part(NEW.email, '@', 1);
        
        -- Find business by slug (default to first business if not found)
        SELECT id INTO business_uuid 
        FROM business_profile 
        WHERE slug = 'default' 
        LIMIT 1;
        
        IF business_uuid IS NULL THEN
            -- Create default business if none exists
            INSERT INTO business_profile (name, slug)
            VALUES ('Default Business', 'default')
            RETURNING id INTO business_uuid;
        END IF;
        
        -- Create profile
        INSERT INTO profiles (id, business_id, login_name, full_name, email)
        VALUES (NEW.id, business_uuid, login_name, NEW.raw_user_meta_data->>'full_name', NEW.email);
        
        -- Assign default role (Staff)
        INSERT INTO user_roles (business_id, user_id, role_id)
        SELECT business_uuid, NEW.id, r.id
        FROM roles r
        WHERE r.business_id = business_uuid 
        AND r.name = 'Staff'
        LIMIT 1;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### **Role Assignment Logic**

```sql
-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
    target_user_id UUID,
    target_role_name TEXT,
    make_primary BOOLEAN DEFAULT false
) RETURNS BOOLEAN AS $$
DECLARE
    user_business_id UUID;
    target_role_id UUID;
    existing_primary UUID;
BEGIN
    -- Get user's business
    SELECT business_id INTO user_business_id 
    FROM profiles 
    WHERE id = target_user_id;
    
    IF user_business_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get role ID
    SELECT id INTO target_role_id
    FROM roles
    WHERE business_id = user_business_id
    AND name = target_role_name;
    
    IF target_role_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- If making primary, unset existing primary
    IF make_primary THEN
        UPDATE user_roles 
        SET is_primary = false 
        WHERE user_id = target_user_id 
        AND business_id = user_business_id;
    END IF;
    
    -- Insert or update role assignment
    INSERT INTO user_roles (business_id, user_id, role_id, is_primary)
    VALUES (user_business_id, target_user_id, target_role_id, make_primary)
    ON CONFLICT (business_id, user_id, role_id)
    DO UPDATE SET is_primary = EXCLUDED.is_primary;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🛡️ Row Level Security (RLS) Policies

### **Base RLS Setup**

```sql
-- Enable RLS on all business-scoped tables
ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_product_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_raw_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE syrve_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recognition_attempts ENABLE ROW LEVEL SECURITY;
```

### **Business Isolation Policies**

```sql
-- Business profile access (everyone can see their business)
CREATE POLICY "Users can view their business" ON business_profile
    FOR SELECT USING (
        id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Profile access (users can see profiles in their business)
CREATE POLICY "Users can view profiles in their business" ON profiles
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Profile updates (users can update their own profile)
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Role access (users can see roles in their business)
CREATE POLICY "Users can view roles in their business" ON roles
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- User roles access (users can see role assignments in their business)
CREATE POLICY "Users can view user roles in their business" ON user_roles
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );
```

### **Product Catalog Policies**

```sql
-- Categories (business-scoped access)
CREATE POLICY "Categories are business-scoped" ON categories
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Products (business-scoped access)
CREATE POLICY "Products are business-scoped" ON products
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Wines (business-scoped access)
CREATE POLICY "Wines are business-scoped" ON wines
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );
```

### **Inventory Management Policies**

```sql
-- Inventory sessions (business-scoped + permission-based)
CREATE POLICY "Inventory sessions are business-scoped" ON inventory_sessions
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Inventory count events (business-scoped)
CREATE POLICY "Inventory count events are business-scoped" ON inventory_count_events
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Inventory aggregates (business-scoped, read-only)
CREATE POLICY "Inventory aggregates are business-scoped" ON inventory_product_aggregates
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );
```

### **Integration Policies**

```sql
-- Syrve config (business-scoped, admin-only for updates)
CREATE POLICY "Syrve config is business-scoped" ON syrve_config
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Only admins can update Syrve config" ON syrve_config
    FOR UPDATE USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
        AND check_user_permission(auth.uid(), 'integrations.syrve', 'edit')
    );

-- Syrve products (business-scoped)
CREATE POLICY "Syrve products are business-scoped" ON syrve_products
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

-- AI config (business-scoped, admin-only)
CREATE POLICY "AI config is business-scoped" ON ai_config
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Only admins can update AI config" ON ai_config
    FOR UPDATE USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
        AND check_user_permission(auth.uid(), 'integrations.ai', 'edit')
    );

-- AI recognition attempts (business-scoped)
CREATE POLICY "AI recognition attempts are business-scoped" ON ai_recognition_attempts
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
    );
```

## 🔑 Permission-Based Access Control

### **Permission Checking in RLS**

```sql
-- Function to check permissions in RLS context
CREATE OR REPLACE FUNCTION has_permission(
    permission_key TEXT,
    required_level permission_level DEFAULT 'view'
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN check_user_permission(auth.uid(), permission_key, required_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin-only role management
CREATE POLICY "Only admins can manage roles" ON roles
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM profiles WHERE id = auth.uid()
        )
        AND check_user_permission(auth.uid(), 'users.manage_roles', 'edit')
    );

-- Super admin bypass for all policies
CREATE POLICY "Super admins bypass all restrictions" ON ALL TABLES
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN user_roles ur ON ur.user_id = p.id
            JOIN roles r ON r.id = ur.role_id
            WHERE p.id = auth.uid()
            AND p.business_id IN (
                SELECT business_id FROM profiles WHERE id = auth.uid()
            )
            AND r.is_super_admin = true
        )
    );
```

## 🚀 Authentication Flow Implementation

### **Frontend Auth Store (Updated)**

```typescript
// Enhanced auth store with tenant awareness
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  businessId: string | null;
  permissions: Record<string, permission_level>;
}

class AuthStore {
  async login(loginName: string, password: string) {
    const email = `${loginName}@inventory.local`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    // Fetch profile with business and role info
    const { data: profileData } = await supabase
      .from('profiles')
      .select(`
        *,
        business:business_profile(id, name, slug),
        roles:user_roles!inner(
          role:roles!inner(name, permissions, is_super_admin)
        )
      `)
      .eq('id', data.user.id)
      .single();

    if (profileData) {
      this.user = {
        id: profileData.id,
        name: profileData.full_name,
        email: profileData.email,
        loginName: profileData.login_name,
        roleId: profileData.roles[0]?.role?.id,
        isSuperAdmin: profileData.roles[0]?.role?.is_super_admin || false,
        businessId: profileData.business_id,
      };
      
      this.businessId = profileData.business_id;
      this.permissions = profileData.roles[0]?.role?.permissions || {};
    }
  }

  hasPermission(permission: string, level: permission_level = 'view'): boolean {
    if (this.user?.isSuperAdmin) return true;
    
    const userLevel = this.permissions[permission] || this.permissions['*'] || 'none';
    const levels: permission_level[] = ['none', 'view', 'edit', 'full'];
    const userIndex = levels.indexOf(userLevel);
    const requiredIndex = levels.indexOf(level);
    
    return userIndex >= requiredIndex;
  }
}
```

## 🛡️ Security Best Practices

### **1. Service Role Usage**
- **Rule**: Never use service role in frontend code
- **Exception**: Only in Edge Functions with explicit authorization
- **Audit**: Log all service role operations

### **2. Permission Validation**
- **Frontend**: Client-side permission checks for UI
- **Backend**: RLS policies enforce data access
- **Edge Functions**: Double-check permissions before service role usage

### **3. Multi-tenant Isolation**
- **Business ID**: Every query filtered by business_id
- **Cross-tenant**: Prevent data leakage between businesses
- **Admin Access**: Super admin can access all business data

### **4. Session Management**
- **JWT Tokens**: Automatic refresh via Supabase
- **Session Storage**: localStorage with encryption
- **Logout**: Clear all session data

## 🔍 Debugging & Monitoring

### **Auth Event Logging**

```sql
-- Auth events table for monitoring
CREATE TABLE auth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- login, logout, password_change, etc.
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to log auth events
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auth_events (user_id, event_type, success)
        VALUES (NEW.id, 'user_created', true);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auth_user_event_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION log_auth_event();
```

### **Permission Audit Queries**

```sql
-- Find users with specific permissions
SELECT 
    p.login_name,
    p.full_name,
    r.name AS role_name,
    r.permissions
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
WHERE p.business_id = 'specific-business-id'
AND r.permissions ? 'inventory';

-- Find super admins
SELECT 
    p.login_name,
    p.full_name,
    b.name AS business_name
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
JOIN business_profile b ON b.id = p.business_id
WHERE r.is_super_admin = true;
```

---

**Next Step**: Review [Edge Functions specification](04-edge-functions-spec.md) for backend business logic implementation.