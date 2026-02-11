# 07 — Operations & Security

## 1. Security Implementation Guidelines

### Authentication & Authorization
- **No Public Signup**: All users must be created by an Admin via the `admin-create-user` Edge Function.
- **RBAC Enforcement**: Use a custom `usePermission` hook on the frontend and strict RLS policies on the backend.
- **JWT Security**: Short-lived access tokens with secure refresh token rotation (handled by Supabase).

### Data Protection
- **Syrve Credentials**: The Syrve API password must be stored encrypted using **Supabase Vault** or a symmetric encryption key. It must NEVER be sent to the frontend.
- **Audit Logging**: Every sensitive action (login, sync, approval, setting change) must be logged in the `audit_logs` table with the user's ID, IP address, and a timestamp.
- **Image Privacy**: Product images stored in Supabase Storage must use private buckets with signed URLs for access.

---

## 2. Performance & Scalability

### Database Optimization
- **Indexes**: Create indexes on frequently queried columns:
    - `products.sku`, `products.name` (GIN index for fuzzy search)
    - `inventory_items.session_id`
    - `product_barcodes.barcode`
- **Views**: Use Materialized Views for complex reports (e.g., Stock Value by Category) to reduce query time.

### Frontend Optimization
- **Virtualization**: Use `react-window` or `tanstack-virtual` for the Product Catalog to handle thousands of items without lag.
- **Caching**: Utilize TanStack Query with `staleTime` and `cacheTime` to minimize redundant API calls.
- **Bundle Size**: Use code-splitting (React.lazy) to load administrative modules only when needed.

---

## 3. Testing Strategy

### Quality Gates
1.  **Unit Tests**: Vitest for utility functions and business logic (e.g., variance calculations).
2.  **Component Tests**: React Testing Library for UI components.
3.  **End-to-End (E2E) Tests**: Playwright for critical flows (Login -> Sync -> Count -> Commit).
4.  **Integration Tests**: Test Edge Functions against a mock Syrve API.

### Test Cases (Critical)
- **TC1**: Product Sync handles 1000+ items without timeout.
- **TC2**: Offline count successfully syncs when connection is restored.
- **TC3**: Staff user cannot access `/settings/syrve`.
- **TC4**: Variance is calculated correctly for additive counts from multiple users.

---



---

## 5. Rollback Plan

### Database
- **Point-in-Time Recovery (PITR)**: Enable Supabase PITR to restore the database to any specific second in the last 7 days.
- **Migration Rollback**: Always include a `down.sql` script for every migration.

### Application
- **Frontend**: Versioned deployments allow instant rollback to the previous stable build.
- **Edge Functions**: Deploy previous function versions if a bug is detected in production.
