## Comprehensive Supabase Integration Documentation Plan

Based on deep analysis of existing docs, code, and schema conflicts, I will create a complete documentation set in `/Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae` that resolves all architectural differences between current code expectations and the new multi-tenant Syrve-first schema.

### **Documentation Structure:**

1. **[00-overview.md](file:///Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae/00-overview.md)** - Integration roadmap, architecture decisions, compatibility strategy

2. **[01-canonical-schema.md](file:///Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae/01-canonical-schema.md)** - Complete canonical database schema with:
   - Multi-tenant `business_id` scoping across all tables
   - Product-first architecture with optional wine enrichment
   - Event-sourced inventory counting with `inventory_count_events`
   - JSONB permissions in roles table
   - Syrve integration tables with proper naming

3. **[02-compatibility-layer.md](file:///Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae/02-compatibility-layer.md)** - Views and RPCs to support current code:
   - `integration_syrve_config` view mapping to `syrve_config`
   - `inventory_items` view aggregating `inventory_count_events`
   - `view_wine_products` view for wine catalog
   - Wine-centric queries maintaining current interfaces

4. **[03-auth-rls-policies.md](file:///Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae/03-auth-rls-policies.md)** - Authentication and security:
   - Synthetic email pattern `{loginName}@inventory.local`
   - Role-based permissions with JSONB structure
   - Row-level security policies by `business_id`
   - Staff vs Admin vs Super-admin access levels

5. **[04-edge-functions-spec.md](file:///Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae/04-edge-functions-spec.md)** - Edge Functions documentation:
   - Existing functions with tenant guards (`manage-users`, `syrve-product-sync`, etc.)
   - Missing functions needed (`syrve-save-config`, `inventory-outbox-processor`)
   - Service-role usage patterns and security considerations

6. **[05-migration-pack.sql](file:///Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae/05-migration-pack.sql)** - Ordered SQL migrations:
   - Extensions and base types
   - Auth and business profile tables
   - Product catalog with Syrve integration
   - Inventory event-sourced system
   - Compatibility views for legacy code

7. **[06-integration-guide.md](file:///Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae/06-integration-guide.md)** - Step-by-step deployment:
   - Environment variables (`VITE_SUPABASE_PUBLISHABLE_KEY`)
   - Migration execution order
   - Edge Function deployment
   - Testing and validation procedures

8. **[07-code-migration-checklist.md](file:///Users/antonkhrabrov/Workspace/GIT/inventory_ai/doc/trae/07-code-migration-checklist.md)** - Code updates needed:
   - Frontend store updates for multi-tenancy
   - Tenant scoping in queries
   - Event-sourced inventory updates
   - Syrve integration table name changes

### **Key Architectural Decisions:**

- **Canonical Schema**: Multi-tenant product-first with event-sourced inventory
- **Compatibility Layer**: Views maintain current code interfaces during transition
- **Auth Model**: Keep synthetic email + JSONB permissions (matches current code)
- **Migration Strategy**: Ordered SQL pack for clean new project setup
- **Security**: RLS by business_id + service-role guards in Edge Functions

This documentation will provide a complete blueprint for integrating with a new Supabase project while maintaining backward compatibility with existing code during the transition period.