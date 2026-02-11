# 02 — Administrative User Journey

## 2.1. Overview
This document details the end-to-end journey of an **Administrator** within the Inventory AI platform. It covers the setup phase, daily operations, and high-level management tasks.

---

## 2.2. Phase 1: Platform Onboarding & Configuration

### 2.2.1. Business Profile & Identity
- **Action**: Administrator logs in and navigates to `Settings > Business`.
- **Details**: 
    - Enters legal name, tax ID, address, currency, and language.
    - **Identity**: Uploads a business logo or selects "Text Logo" (using Business Name).
    - **Contact**: Enters primary contact details for future supplier orders.
- **Goal**: Establish the tenant context and branding for the application.

### 2.2.2. Integration Bridge (Syrve) & Logic
- **Action**: Navigates to `Settings > Integrations`.
- **Details**: Enters Syrve API credentials and selects the target store.
- **Advanced Logic Configuration**:
    - **Approval Toggle**: Configures whether counts require Admin approval before Syrve sync.
    - **Sync Behavior**: Sets up automatic vs. manual sync preferences.
- **Outcome**: A secure, bi-directional link with customized workflow logic.

### 2.2.3. Measurement & Units Setup
- **Action**: Navigates to `Settings > Measurements`.
- **Details**: 
    - Selects display unit (Litres vs. Millilitres).
    - Defines global and category-specific glass dimensions (e.g., 150ml for Wine, 50ml for Spirits).
- **Goal**: Ensure consistent measurement entry for partial bottle counting.

### 2.2.4. Organizational Hierarchy
- **Action**: Navigates to `Settings > Locations`.
- **Details**: Defines zones (Cellars, Bars) and granular sub-locations (Racks, Fridges).
- **Goal**: Enable precise location-based tracking.

---

## 2.3. Phase 2: Catalog Management

### 2.3.1. Initial Catalog Sync
- **Action**: Navigates to `Catalog > Import`.
- **Details**: Triggers a "Full Sync" from Syrve.
- **Process**: System imports categories, products, SKUs, and current prices.
- **Result**: The local catalog is populated with POS data.

### 2.3.2. Product Enrichment
- **Action**: Navigates to `Catalog`.
- **Details**: Adds barcodes (UPC/EAN) to products, sets par levels, and defines unit capacities (e.g., 750ml, 1500ml).
- **Goal**: Prepare the catalog for high-speed scanning and par level monitoring.

---

## 2.4. Phase 3: Inventory Operations (The Admin Perspective)

### 2.4.1. Session Initiation
- **Action**: Navigates to `Inventory > Sessions`.
- **Details**: Creates a new session, selects the type (Full/Partial), and adds notes.
- **Goal**: Open the "counting window" for staff members.

### 2.4.2. Monitoring Progress
- **Action**: Views the active session dashboard.
- **Details**: Sees real-time updates as staff members scan items in different locations.
- **Insight**: Identify slow-moving counts or missing locations.

### 2.4.3. Review & Reconciliation
- **Action**: Navigates to `Inventory > Sessions > [ID] > Review`.
- **Details**: System highlights **Variances** (Expected vs. Counted).
- **Interactions**: Admin can flag items for recount or manually adjust quantities.
- **Outcome**: Finalization of the physical count data.

---

## 2.5. Phase 4: Finalization & Reporting

### 2.5.1. POS Sync (Commitment)
- **Action**: Clicks "Approve and Sync to Syrve".
- **Details**: System generates an inventory document in Syrve and pushes the counted values.
- **Outcome**: Official POS stock records are updated.

### 2.5.2. Analytics & Reporting
- **Action**: Navigates to `Reports`.
- **Details**: Generates "Stock Value Report", "Variance Report", and "Par Level Alerts".
- **Outcome**: Data-driven decisions for ordering and loss prevention.

---

## 2.6. User Management & Security

### 2.6.1. Team Management
- **Action**: Navigates to `Settings > Users`.
- **Details**: Invites staff, assigns roles (Admin, Manager, Staff), and manages active/inactive status.
- **Goal**: Maintain secure, role-based access to the platform.
