# Inventory AI - Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1. Business Purpose
**Inventory AI** is an intelligent wine inventory management platform designed to solve the critical challenges of beverage management in hospitality. Traditional wine inventory is labor-intensive, prone to human error, and often disconnected from real-time sales data. Inventory AI bridges this gap by combining modern mobile technology, AI-powered vision, and deep POS integration to provide a seamless, accurate, and actionable inventory experience.

### 1.2. Value Proposition
- **Efficiency**: Reduces inventory counting time by up to 60% through AI label recognition and barcode scanning.
- **Accuracy**: Eliminates manual entry errors and provides visual verification for partial bottle counting.
- **Real-time Insights**: Connects directly to **Syrve (iiko)** to sync stock levels, prices, and variances instantly.
- **Bias Prevention**: Role-based access ensures staff perform blind counts without seeing expected stock levels.
- **Scalability**: Multi-tenant architecture designed to support individual bars up to large restaurant groups.

---

## 2. Platform Architecture Overview

### 2.1. Tech Stack
- **Frontend**: React 18 with TypeScript, Vite for build tooling.
- **UI/UX**: Tailwind CSS with shadcn/ui components, optimized for both desktop and mobile views.
- **State Management**: Zustand for fast, reactive global state.
- **Data Layer**: TanStack React Query for robust data fetching, caching, and synchronization.
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime).
- **AI Engine**: OpenAI Vision API (Gemini-ready) for label recognition.
- **POS Bridge**: Custom Syrve API integration for catalog and stock synchronization.

### 2.2. Multi-Tenancy Model
The platform uses a **Business Profile** entity as the root for all data. Every transaction, product, and user is scoped to a `business_id`, ensuring strict data isolation and enabling a SaaS-ready platform.

---

## 3. Administrative User Journey

### 3.1. Onboarding & Setup
1. **Business Registration**: Super Admin creates the initial business profile.
2. **Integration Pairing**: Admin configures Syrve API credentials and maps organizations/stores.
3. **Catalog Sync**: System pulls initial product data, categories, and units from Syrve.
4. **Configuration**: Admin sets up locations (cellars, bars), glass dimensions, and business rules.
5. **Team Invite**: Admin creates users (Managers, Staff) and assigns granular roles.

### 3.2. Operational Cycle
1. **Catalog Maintenance**: Admin reviews imported products, adds barcodes, and sets par levels.
2. **Session Initiation**: Admin or Manager starts a "Full" or "Partial" inventory session.
3. **Execution Oversight**: Admin monitors live counting progress across multiple locations.
4. **Review & Approval**: Admin reviews variances, flags discrepancies, and approves the session.
5. **POS Commitment**: Approved counts are pushed back to Syrve to update official stock records.
6. **Analysis**: Admin reviews reports for stock value, loss patterns, and par level alerts.

---

## 4. Navigation & Module Map

| Module | Purpose | Key Actions |
|:---|:---|:---|
| **Dashboard** | Performance Snapshot | View alerts, recent sessions, and stock value. |
| **Catalog** | Product Database | Manage wines, barcodes, and categories. |
| **Inventory** | Operations | Start counts, scan bottles, view current stock. |
| **Reports** | Analytics | Export CSV/PDF, view variance and financial data. |
| **Settings** | Configuration | Manage business, users, integrations, and flags. |
| **Super Admin** | Platform Control | Manage multi-tenancy and system-wide feature flags. |

---

## 5. Document Navigation
- [01-Executive-Summary.md](./01-executive-summary.md)
- [02-Admin-User-Journey.md](./02-admin-user-journey.md)
- [03-Catalog-Module.md](./03-catalog-module.md)
- [04-Inventory-Module.md](./04-inventory-module.md)
- [05-Stock-Reports-Module.md](./05-stock-reports-module.md)
- [06-Settings-Configuration-Module.md](./06-settings-configuration-module.md)
- [07-Technical-Architecture-Integrations.md](./07-technical-architecture-integrations.md)
- [08-Feature-Flags-System.md](./08-feature-flags-system.md)
