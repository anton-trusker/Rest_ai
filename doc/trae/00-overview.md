# Supabase Integration Overview & Roadmap

This documentation set provides a complete blueprint for integrating the Wine Inventory Management System with a **new Supabase project**, resolving architectural differences between current code expectations and the target multi-tenant, Syrve-first schema.

## 🎯 Integration Goals

1. **Multi-tenant Architecture**: Support multiple restaurants/businesses with complete data isolation
2. **Product-First Catalog**: Generic products with optional wine enrichment (vs wine-only approach)
3. **Event-Sourced Inventory**: Append-only counting events for audit trail and concurrent access
4. **Syrve Integration**: Native support for Syrve POS synchronization
5. **Backward Compatibility**: Maintain existing code interfaces during transition period

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vite/React)                    │
├─────────────────────────────────────────────────────────────┤
│  Auth Store · Session Store · Wine Store · Syrve Store    │
│  (Synthetic email login · Product-first queries)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase (Postgres + Edge Functions)           │
├─────────────────────────────────────────────────────────────┤
│  RLS Policies (business_id isolation)                       │
│  Canonical Schema (multi-tenant · event-sourced)         │
│  Compatibility Views (legacy code support)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              External Integrations                          │
│  Syrve POS · AI Recognition · Future APIs                 │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Documentation Structure

| Document | Purpose |
|----------|---------|
| [01-canonical-schema.md](01-canonical-schema.md) | Complete canonical database schema with multi-tenant design |
| [02-compatibility-layer.md](02-compatibility-layer.md) | Views and RPCs for current code compatibility |
| [03-auth-rls-policies.md](03-auth-rls-policies.md) | Authentication flows and RLS policies |
| [04-edge-functions-spec.md](04-edge-functions-spec.md) | Edge Functions specification with security guards |
| [05-migration-pack.sql](05-migration-pack.sql) | Ordered SQL migrations for new project |
| [06-integration-guide.md](06-integration-guide.md) | Step-by-step deployment guide |
| [07-code-migration-checklist.md](07-code-migration-checklist.md) | Required code updates for full adoption |

## 🔑 Key Architectural Decisions

### **1. Canonical Schema Choice**
- **Primary**: Multi-tenant product-first with event-sourced inventory (from wind_spec)
- **Rationale**: Better scalability, audit trail, Syrve integration alignment
- **Trade-off**: Requires compatibility layer for current wine-centric code

### **2. Compatibility Strategy**
- **Approach**: Database views maintain legacy interfaces
- **Duration**: Temporary bridge during code migration phase
- **Benefit**: Zero-downtime deployment to new Supabase project

### **3. Auth Model Preservation**
- **Synthetic Email**: Keep `{loginName}@inventory.local` pattern
- **JSONB Permissions**: Maintain current role.permission structure
- **Rationale**: Minimize frontend auth code changes

### **4. Migration Path**
- **Clean Slate**: New Supabase project with ordered migrations
- **Parallel Operation**: Old system continues while new system is prepared
- **Gradual Cutover**: Move users/functions incrementally

## ⚠️ Critical Schema Conflicts Resolved

| Conflict | Resolution |
|----------|------------|
| `wine_id` vs `product_id` | Product-first schema with wine enrichment + compatibility view |
| `inventory_items` vs `inventory_count_events` | Event-sourced canonical + mutable view for legacy |
| `integration_syrve_*` vs `syrve_*` | Views mapping old names to new canonical tables |
| Single-tenant vs Multi-tenant | `business_id` RLS policies with compatibility views |
| `roles.permissions` JSONB vs junction table | Keep JSONB (matches current code) |

## 🚀 Implementation Roadmap

### **Phase 1: Foundation** (Week 1)
1. Create new Supabase project
2. Deploy canonical schema migrations
3. Set up compatibility views
4. Configure RLS policies

### **Phase 2: Core Functions** (Week 2)
1. Deploy existing Edge Functions with tenant guards
2. Create missing functions (syrve-save-config, outbox-processor)
3. Test auth flows with synthetic email
4. Validate Syrve integration

### **Phase 3: Compatibility Testing** (Week 3)
1. Point development environment to new project
2. Test all current features via compatibility layer
3. Identify performance bottlenecks
4. Plan code migration priorities

### **Phase 4: Gradual Migration** (Weeks 4-8)
1. Migrate frontend stores to use canonical schema directly
2. Update Edge Functions to remove compatibility dependencies
3. Add multi-tenant UI features
4. Deprecate compatibility views

## 🔧 Environment Variables

```bash
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Edge Functions (service role)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co

# Syrve Integration
SYRVE_API_BASE_URL=https://api.syrve.com
```

## 📊 Performance Considerations

- **Event-sourced inventory**: Aggregate views for fast reads
- **Multi-tenant indexes**: Composite indexes on `(business_id, ...)`
- **Compatibility views**: Materialized views for complex aggregations
- **Edge Function caching**: Redis for Syrve API responses

## 🔐 Security Model

- **RLS Policies**: Every table filtered by `business_id`
- **Service Role Usage**: Only in Edge Functions with explicit authorization
- **Synthetic Email**: Prevents auth user enumeration
- **Permission System**: JSONB with module.sub-action granularity

## 📈 Future Extensibility

- **Additional POS Integrations**: Follow Syrve pattern
- **Multi-location Support**: Extend `business_id` to `location_id`
- **Advanced Analytics**: Build on event-sourced data
- **API Gateway**: Expose public APIs with tenant isolation

---

**Next Step**: Review the [canonical schema](01-canonical-schema.md) to understand the complete database structure.