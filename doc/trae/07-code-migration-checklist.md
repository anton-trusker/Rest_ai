# Code Migration Checklist

Comprehensive checklist for migrating frontend code from legacy schema to the new multi-tenant, Syrve-first canonical schema. This guide ensures a smooth transition while maintaining backward compatibility.

## 🎯 Migration Strategy

### **Phase 1: Compatibility Layer** ✅ (Immediate)
- Use compatibility views for zero-downtime migration
- Test all existing functionality
- Identify performance bottlenecks
- Plan migration priorities

### **Phase 2: Gradual Migration** (Weeks 1-4)
- Update stores to use canonical tables
- Implement multi-tenant features
- Add new Syrve integration capabilities
- Maintain backward compatibility

### **Phase 3: Full Adoption** (Weeks 5-8)
- Remove compatibility dependencies
- Optimize for canonical schema
- Add advanced features
- Cleanup deprecated code

## 📋 Migration Checklist by Component

### **1. Authentication Store** (`src/stores/authStore.ts`)

#### ✅ **Current State (Compatible)**
- Synthetic email pattern: `{loginName}@inventory.local`
- JSONB permissions structure
- Business ID awareness needed

#### 🔧 **Required Changes**

**Add Business Context:**
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  businessId: string | null;        // ➕ Add business ID
  businessName: string | null;       // ➕ Add business name
  businessSlug: string | null;      // ➕ Add business slug
  permissions: Record<string, permission_level>;
}

interface User {
  id: string;
  name: string;
  email: string;
  loginName: string;
  roleId: string;
  isSuperAdmin?: boolean;
  avatar?: string;
  businessId: string;               // ➕ Add business ID
}
```

**Update Profile Query:**
```typescript
// Old query (works with compatibility)
const { data: profile } = await supabase
  .from('profiles')
  .select(`
    *,
    roles:user_roles!inner(
      role:roles!inner(name, permissions, is_super_admin)
    )
  `)
  .eq('id', data.user.id)
  .single();

// New query (canonical schema)
const { data: profile } = await supabase
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
```

**Add Business Context to Login:**
```typescript
async login(loginName: string, password: string) {
  // ... existing login logic ...
  
  if (profileData) {
    this.user = {
      id: profileData.id,
      name: profileData.full_name,
      email: profileData.email,
      loginName: profileData.login_name,
      roleId: profileData.roles[0]?.role?.id,
      isSuperAdmin: profileData.roles[0]?.role?.is_super_admin || false,
      businessId: profileData.business_id,      // ➕ Add business ID
      avatar: profileData.avatar_url,
    };
    
    this.businessId = profileData.business_id;
    this.businessName = profileData.business?.name;
    this.businessSlug = profileData.business?.slug;
    this.permissions = profileData.roles[0]?.role?.permissions || {};
  }
}
```

### **2. Settings Store** (`src/stores/settingsStore.ts`)

#### ✅ **Current State**
- Role CRUD operations
- Permission checking
- User management

#### 🔧 **Required Changes**

**Update Role Queries:**
```typescript
// Old query (compatibility view)
const { data: roles } = await supabase
  .from('roles')
  .select('*')
  .order('name');

// New query (with business scoping)
const { data: roles } = await supabase
  .from('roles')
  .select('*')
  .eq('business_id', this.businessId)  // ➕ Add business filter
  .order('name');
```

**Add Business Scoping:**
```typescript
class SettingsStore {
  businessId: string | null = null;
  
  constructor() {
    makeAutoObservable(this);
    // Watch for auth changes to update business context
    authStore.subscribe(() => {
      this.businessId = authStore.businessId;
    });
  }
  
  async fetchRoles() {
    if (!this.businessId) return;
    
    const { data } = await supabase
      .from('roles')
      .select('*')
      .eq('business_id', this.businessId)
      .order('name');
      
    // ... rest of logic
  }
}
```

### **3. Session Store** (`src/stores/sessionStore.ts`)

#### ✅ **Current State**
- Uses `inventory_items` compatibility view
- Wine-centric approach
- Direct quantity updates

#### 🔧 **Required Changes**

**Add Event-Sourced Support:**
```typescript
interface SessionStore {
  sessions: InventorySession[];
  currentSession: InventorySession | null;
  sessionItems: InventoryItem[];
  countEvents: InventoryCountEvent[];     // ➕ Add event tracking
  useEventSourcing: boolean;            // ➕ Feature flag
}

interface InventoryCountEvent {
  id: string;
  sessionId: string;
  productId: string;
  countedBy: string;
  location?: string;
  quantityUnopened: number;
  quantityOpened: number;
  quantityTotal: number;
  countingMethod: 'manual' | 'barcode' | 'image_ai' | 'voice';
  confidenceScore?: number;
  imageUrl?: string;
  countedAt: string;
}
```

**Update Count Submission:**
```typescript
// Old method (direct update)
async submitCount(sessionId: string, wineId: string, unopened: number, opened: number) {
  const { error } = await supabase
    .from('inventory_items')
    .upsert({
      session_id: sessionId,
      wine_id: wineId,
      counted_quantity_unopened: unopened,
      counted_quantity_opened: opened,
    });
}

// New method (event-sourced)
async submitCount(sessionId: string, productId: string, unopened: number, opened: number, method: string = 'manual') {
  if (this.useEventSourcing) {
    // Create count event
    const { error } = await supabase
      .from('inventory_count_events')
      .insert({
        business_id: authStore.businessId,
        session_id: sessionId,
        product_id: productId,
        counted_by: authStore.user?.id,
        quantity_unopened: unopened,
        quantity_opened: opened,
        counting_method: method,
        counted_at: new Date().toISOString(),
      });
      
    // Aggregates will be updated automatically via trigger
  } else {
    // Fallback to compatibility view
    await this.legacySubmitCount(sessionId, productId, unopened, opened);
  }
}
```

**Add Concurrent Counting Support:**
```typescript
// Enable multiple users to count simultaneously
async enableConcurrentCounting(sessionId: string) {
  this.useEventSourcing = true;
  
  // Subscribe to real-time count events
  const subscription = supabase
    .channel(`session-${sessionId}`)
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'inventory_count_events', filter: `session_id=eq.${sessionId}` },
      (payload) => {
        this.handleCountEvent(payload.new);
      }
    )
    .subscribe();
}

private handleCountEvent(event: InventoryCountEvent) {
  // Update local state with new count
  const existingIndex = this.countEvents.findIndex(e => e.id === event.id);
  if (existingIndex >= 0) {
    this.countEvents[existingIndex] = event;
  } else {
    this.countEvents.push(event);
  }
  
  // Recalculate aggregates
  this.recalculateAggregates();
}
```

### **4. Wine Store** (`src/stores/wineStore.ts`)

#### ✅ **Current State**
- Uses `view_wine_products` compatibility view
- Wine-centric product model
- Direct wine table operations

#### 🔧 **Required Changes**

**Update to Product-First Model:**
```typescript
// Update interfaces
interface WineProduct {
  id: string;                    // Product ID (was wine_id)
  wineId?: string;              // Wine ID (optional)
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;
  
  // Wine-specific fields (optional)
  vintage?: number;
  producer?: string;
  region?: string;
  wineType?: string;
  grapeVarieties?: string[];
  alcoholPercentage?: number;
  
  // Stock info
  stockOnHand: number;
  stockReserved: number;
  stockAvailable: number;
  
  // Syrve mapping
  syrveProductId?: string;
  syrveName?: string;
}
```

**Update Fetch Methods:**
```typescript
// Old method (compatibility view)
async fetchWines(search?: string) {
  let query = supabase.from('view_wine_products').select('*');
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  const { data, error } = await query;
  return { data, error };
}

// New method (canonical tables)
async fetchWines(search?: string) {
  let query = supabase
    .from('products')
    .select(`
      *,
      wine:wines(*),
      category:categories(id, name),
      syrve:syrve_products(name, group_name)
    `)
    .eq('business_id', authStore.businessId);
    
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  
  const { data, error } = await query;
  
  // Transform to WineProduct format
  return {
    data: data?.map(this.transformToWineProduct),
    error
  };
}

private transformToWineProduct(product: any): WineProduct {
  return {
    id: product.id,
    wineId: product.wine?.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    categoryId: product.category?.id,
    categoryName: product.category?.name,
    
    // Wine fields
    vintage: product.wine?.vintage,
    producer: product.wine?.producer,
    region: product.wine?.region,
    wineType: product.wine?.wine_type,
    grapeVarieties: product.wine?.grape_varieties,
    alcoholPercentage: product.wine?.alcohol_percentage,
    
    // Stock info
    stockOnHand: product.stock_on_hand,
    stockReserved: product.stock_reserved,
    stockAvailable: product.stock_available,
    
    // Syrve mapping
    syrveProductId: product.syrve_product_id,
    syrveName: product.syrve?.name,
  };
}
```

**Update Save Method:**
```typescript
// New save method (product-first)
async saveWine(wineData: Partial<WineProduct>) {
  try {
    // 1. Save product first
    const { data: product, error: productError } = await supabase
      .from('products')
      .upsert({
        id: wineData.id,
        business_id: authStore.businessId,
        name: wineData.name,
        sku: wineData.sku,
        barcode: wineData.barcode,
        category_id: wineData.categoryId,
        cost_price: wineData.costPrice,
        selling_price: wineData.sellingPrice,
        image_url: wineData.imageUrl,
        syrve_product_id: wineData.syrveProductId,
      })
      .select()
      .single();

    if (productError) throw productError;

    // 2. Save wine enrichment if wine data exists
    if (wineData.wineId || wineData.vintage || wineData.producer) {
      const { error: wineError } = await supabase
        .from('wines')
        .upsert({
          business_id: authStore.businessId,
          product_id: product.id,
          vintage: wineData.vintage,
          producer: wineData.producer,
          region: wineData.region,
          wine_type: wineData.wineType,
          grape_varieties: wineData.grapeVarieties,
          alcohol_percentage: wineData.alcoholPercentage,
        });

      if (wineError) throw wineError;
    }

    return { data: product, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
```

### **5. Syrve Store** (`src/stores/syrveStore.ts`)

#### ✅ **Current State**
- Uses `integration_syrve_*` compatibility views
- Basic sync functionality
- Limited configuration management

#### 🔧 **Required Changes**

**Update Table Names:**
```typescript
// Old references
const { data: config } = await supabase
  .from('integration_syrve_config')
  .select('*')
  .single();

// New references (canonical tables)
const { data: config } = await supabase
  .from('syrve_config')
  .select('*')
  .eq('business_id', authStore.businessId)
  .single();
```

**Add Business Scoping:**
```typescript
class SyrveStore {
  businessId: string | null = null;
  
  constructor() {
    makeAutoObservable(this);
    authStore.subscribe(() => {
      this.businessId = authStore.businessId;
    });
  }
  
  async fetchConfig() {
    if (!this.businessId) return;
    
    const { data, error } = await supabase
      .from('syrve_config')
      .select('*')
      .eq('business_id', this.businessId)
      .single();
      
    // ... rest of logic
  }
}
```

**Update Sync Methods:**
```typescript
// Enhanced sync with business context
async syncProducts() {
  if (!this.businessId) {
    throw new Error('Business context not available');
  }
  
  const { error } = await supabase.functions.invoke('syrve-product-sync', {
    body: {
      businessId: this.businessId,
      syncType: 'products',
      fullSync: true
    }
  });
  
  return { error };
}
```

### **6. Product Store** (`src/stores/productStore.ts`)

#### ✅ **Current State**
- Basic product management
- Category operations
- Limited Syrve integration

#### 🔧 **Required Changes**

**Add Business Scoping:**
```typescript
class ProductStore {
  businessId: string | null = null;
  
  constructor() {
    makeAutoObservable(this);
    authStore.subscribe(() => {
      this.businessId = authStore.businessId;
    });
  }
  
  async fetchCategories() {
    if (!this.businessId) return;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('business_id', this.businessId)
      .order('name');
      
    return { data, error };
  }
}
```

**Update Syrve Mapping:**
```typescript
// Enhanced Syrve product mapping
async mapSyrveProduct(syrveProductId: string, productId: string) {
  const { error } = await supabase
    .from('syrve_products')
    .update({
      mapped_product_id: productId,
      mapping_confidence: 1.0,
      mapping_notes: 'Manual mapping',
      last_sync_at: new Date().toISOString()
    })
    .eq('business_id', this.businessId)
    .eq('syrve_product_id', syrveProductId);
    
  return { error };
}
```

## 🧪 Testing Strategy

### **Unit Tests**
- Test business scoping in queries
- Verify permission checks
- Test event-sourced counting
- Validate Syrve integration

### **Integration Tests**
- Test multi-user concurrent counting
- Verify Syrve sync workflows
- Test AI recognition integration
- Validate RLS policy enforcement

### **Performance Tests**
- Test inventory aggregation performance
- Verify real-time sync responsiveness
- Test large dataset handling
- Validate concurrent user limits

## 📈 Migration Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Auth & Business Context | Business scoping in auth store, user management |
| **Week 2** | Inventory Event Sourcing | Count events, concurrent counting, aggregates |
| **Week 3** | Product-First Catalog | Wine store migration, product management |
| **Week 4** | Syrve Integration | Enhanced sync, mapping, configuration |
| **Week 5** | Testing & Optimization | Performance tuning, bug fixes |
| **Week 6** | Feature Flags & Rollback | Safe deployment mechanisms |
| **Week 7** | Production Deployment | Gradual rollout, monitoring |
| **Week 8** | Cleanup & Documentation | Remove compatibility code, finalize |

## 🚨 Rollback Plan

### **Emergency Rollback**
1. **Immediate**: Switch back to compatibility views
2. **Short-term**: Fix critical issues
3. **Long-term**: Plan retry migration

### **Feature Flags**
```typescript
// Use feature flags for safe rollout
const features = {
  useEventSourcing: false,        // Start with false
  useCanonicalSchema: false,      // Start with false
  useEnhancedSyrve: false,        // Start with false
};

// Gradually enable features
features.useEventSourcing = true;  // Enable after testing
```

## ✅ Final Validation

### **Pre-Migration Checklist**
- [ ] All stores updated with business scoping
- [ ] Event-sourced inventory tested
- [ ] Product-first catalog verified
- [ ] Syrve integration enhanced
- [ ] Performance benchmarks met
- [ ] Security policies enforced
- [ ] User acceptance testing complete
- [ ] Rollback plan tested

### **Post-Migration Monitoring**
- [ ] Error rates monitored
- [ ] Performance metrics tracked
- [ ] User feedback collected
- [ ] System stability verified
- [ ] Compatibility views usage tracked

---

**Next Step**: All documentation is complete. Review the complete integration package and begin deployment following the [integration guide](06-integration-guide.md).