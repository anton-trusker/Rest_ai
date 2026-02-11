# 05 — Implementation Roadmap

## Phased Execution Strategy

The project is divided into 6 distinct phases to ensure a stable foundation before layering complex features.

---

## Phase 1: Foundation & Auth (Weeks 1-2)
**Goal**: Establish the platform, security, and user management.

- [ ] **Infrastructure**: Set up Supabase project, enable extensions (`pg_cron`, `pg_net`).
- [ ] **Auth**: Implement RBAC schema (`roles`, `permissions`, `profiles`).
- [ ] **User Management**: Build Admin UI for creating and managing users.
- [ ] **Navigation**: Implement sidebar/bottom-nav based on user roles.

**Deliverable**: A secure web application where Admins can manage users and roles.

---

## Phase 2: Syrve Core Integration (Weeks 3-4)
**Goal**: Connect to the master data source.

- [ ] **Configuration**: Build `/settings/syrve` with "Test Connection" logic.
- [ ] **Edge Functions**: Create `syrve-connect-test` and `syrve-product-sync`.
- [ ] **Catalog Sync**: Implement hierarchical category sync and product upsert logic.
- [ ] **Cron**: Schedule nightly product syncs.

**Deliverable**: A local database populated with live product data from Syrve.

---

## Phase 3: Inventory Counting (Weeks 5-6)
**Goal**: Enable the core physical counting functionality.

- [ ] **Session Logic**: Implement `inventory_sessions` and `inventory_items` logic.
- [ ] **Scanning**: Integrate `html5-qrcode` for robust mobile barcode scanning.
- [ ] **Counting UI**: Build the mobile-optimized quantity entry drawer.
- [ ] **Search**: Implement high-performance full-text search across all categories.

**Deliverable**: Staff can start sessions, scan products, and record quantities on mobile.

---

## Phase 4: AI & Offline Optimization (Weeks 7-8)
**Goal**: Enhance speed and reliability in difficult environments.

- [ ] **AI Recognition**: Integrate OpenAI Vision API for label/product recognition.
- [ ] **Offline Mode**: Implement `zustand-persist` and Service Worker for offline counting.
- [ ] **Background Sync**: Logic to upload queued counts when connectivity returns.
- [ ] **PWA**: Finalize manifest and icon assets for "Install to Home Screen" support.

**Deliverable**: The app works without internet; AI assists in product identification.

---

## Phase 5: Review & Syrve Commit (Weeks 9-10)
**Goal**: Complete the data loop back to Syrve.

- [ ] **Session Review**: Build Admin dashboard for variance analysis and approval.
- [ ] **Commit Logic**: Edge Function to generate and POST Syrve Inventory XML.
- [ ] **Movements**: Implement `inventory_movements` audit trail.
- [ ] **Realtime**: Add live progress tracking for collaborative sessions.

**Deliverable**: Admins can approve counts and update Syrve master stock with one click.

---

## Phase 6: Reporting & Polish (Weeks 11-12)
**Goal**: Insights, optimization, and handoff.

- [ ] **Reports**: Build Stock Value, Low Stock, and Variance reports.
- [ ] **Exports**: Implement PDF/CSV export for all major tables.
- [ ] **Performance**: Optimize database indexes and frontend bundle size.
- [ ] **UAT**: Comprehensive user acceptance testing and bug fixing.

**Deliverable**: A production-ready system with full reporting capabilities.

---

## Milestone Summary

| Milestone | Description | Est. Date |
|-----------|-------------|-----------|
| **M1** | Auth & User Management Live | End of W2 |
| **M2** | Syrve Product Sync Successful | End of W4 |
| **M3** | First Mobile Inventory Count | End of W6 |
| **M4** | Offline Mode & AI Recognition | End of W8 |
| **M5** | Full Loop (App → Syrve) | End of W10 |
| **M6** | Production Handoff | End of W12 |
