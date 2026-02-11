# 18 — Super Admin Implementation Plan

## 1. Executive Summary
This document outlines the technical specification for a production-ready **Super Admin Role** and **Super Admin Panel**. This system provides platform-level management, bypassing standard organizational boundaries (preparing for future multi-tenancy) and offering granular control over application modules, feature flags, system configurations, and cross-tenant user management.

---

## 2. Technical Architecture & Roles
The Super Admin is the highest level in the application hierarchy.

### 2.1. Role Definition: `super_admin`
- **Identifier:** `role_super_admin` (or name `super_admin`)
- **Hierarchy Level:** 0 (Highest)
- **Special Capabilities:**
  - **Permission Bypass:** Automatically granted `*` (all) permissions in `authStore.ts`.
  - **System Protection:** Cannot be deleted, deactivated, or demoted by other users (including other Super Admins).
  - **Platform Access:** Access to `/super-admin/*` routes and administrative Edge Functions.

### 2.2. Access Control Model (RBAC+)
Building upon the existing [09-roles-permissions.md](./09-roles-permissions.md):
- **Super Admin:** Can manage all organizations, global feature flags, and system-wide users.
- **Admin:** Manages their specific organization (tenants).
- **Security Guard:** RLS (Row Level Security) policies will use a `is_super_admin()` helper function to allow cross-tenant access for this role.

---

## 3. Database Schema Extensions

### 3.1. Audit Logging (`audit_logs`)
Essential for tracking administrative actions.
```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,          -- e.g., 'user.create', 'flag.toggle', 'system.config_update'
  entity_type TEXT NOT NULL,          -- e.g., 'profile', 'feature_flag', 'settings'
  entity_id   TEXT,                   -- ID of the affected entity
  old_value   JSONB,
  new_value   JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2. System Configuration (`system_config`)
Global settings that affect the entire platform.
```sql
CREATE TABLE system_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES profiles(id)
);
```

---

## 4. Super Admin Panel UI/UX Design

The Super Admin Panel will be accessible via a dedicated sidebar section or a separate route `/super-admin`.

### 4.1. Dashboard (`/super-admin/dashboard`)
- **System Health:** Real-time status of integrations (Syrve, OpenAI).
- **Usage Analytics:** Total users, active sessions, storage metrics.
- **Recent Activity:** Feed from `audit_logs`.

### 4.2. Feature Flag Management (`/super-admin/feature-flags`)
*Extending current [FeatureFlagsAdmin.tsx](../../src/core/settings/pages/FeatureFlagsAdmin.tsx)*
- **Advanced Filtering:** By phase, category, or status.
- **Targeting:** Capability to enable flags for specific organizations or users.
- **Bulk Actions:** Reset all flags to default, export/import flag state.

### 4.3. User & Role Control (`/super-admin/users`)
- **Global Search:** Search users across all organizations.
- **Impersonation:** (Optional) Ability to view the app "as" a specific user for support.
- **Permission Matrix Editor:** UI to modify `role_permissions` for built-in or custom roles.

### 4.4. System Logs (`/super-admin/logs`)
- Filterable view of the `audit_logs` table.
- Error log aggregation from Supabase/Edge Functions.

---

## 5. API & Edge Functions

All administrative functions must be handled via Edge Functions with `service_role` to ensure security and bypass standard RLS when necessary.

### 5.1. Endpoints
| Function | Method | Description |
|:---|:---:|:---|
| `admin-create-user` | POST | Creates Auth user and Profile. |
| `admin-manage-role` | PATCH | Updates permissions/hierarchy of roles. |
| `admin-system-config` | PUT | Updates global platform settings. |
| `admin-export-data` | GET | Exports cross-tenant analytics data. |

---

## 6. Security & Compliance

1. **Service Role Isolation:** Sensitive operations (password resets, role elevation) *never* happen directly from the frontend.
2. **Double-Factor Authentication (2FA):** Recommended for all Super Admin accounts.
3. **Session Invalidation:** Changing a user's role or deactivating them must trigger a session refresh/logout (via `auth.refreshSession`).
4. **Environment Isolation:** Super Admin credentials must never be hardcoded and should be managed via Supabase Vault or environment variables.

---

## 7. Performance & Optimization

- **Data Partitioning:** As audit logs grow, implement monthly partitioning.
- **Caching:** Feature flag states should be cached in the frontend (e.g., `zustand` with `persist`) to avoid fetching on every page load.
- **Pagination:** All administrative lists (users, logs) must use server-side pagination.

---

## 8. Testing & Deployment

### 8.1. Testing Requirements
- **Unit Tests:** Permission checking logic in `authStore.ts`.
- **Integration Tests:** Edge Function authorization checks (verify non-admins are blocked).
- **E2E Tests:** Super Admin login flow and "God Mode" verification (seeing all modules).

### 8.2. Deployment
1. **Migration:** Run SQL migrations for `audit_logs` and `system_config`.
2. **Seeding:** Ensure the initial Super Admin is created via a secure seed script.
3. **Monitoring:** Set up alerts for failed administrative login attempts.

---

## 9. Implementation Roadmap

1. **Phase 1: Database & RLS (Week 1)**
   - Create `audit_logs` and `system_config` tables.
   - Implement `is_super_admin()` SQL function.
2. **Phase 2: Core Infrastructure (Week 1)**
   - Update `authStore.ts` to fully support `super_admin` logic.
   - Implement `admin-create-user` Edge Function.
3. **Phase 3: UI Development (Week 2)**
   - Build Super Admin Sidebar and Dashboard.
   - Enhance Feature Flag and User Management pages.
4. **Phase 4: Audit & Security (Week 2)**
   - Hook up audit logging to all admin actions.
   - Implement 2FA requirements.
