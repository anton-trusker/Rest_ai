# 03 — Catalog Module

## 3.1. Overview
The **Catalog Module** serves as the central repository for all products (wines, spirits, beverages) within the application. It acts as the "Source of Truth" for product metadata, pricing, and identification markers (barcodes).

### 3.1.1. Business Objectives
- **Centralization**: Provide a single interface to manage products across all business locations.
- **Data Enrichment**: Allow administrators to add industry-specific metadata (vintage, region, ABV) that POS systems often lack.
- **Identification**: Enable rapid counting via barcode and AI label recognition.
- **Stock Governance**: Establish par levels to automate reordering workflows.

---

## 3.2. Feature Breakdown

### 3.2.1. Product Management
- **Description**: A comprehensive list and detail view of all items in the inventory.
- **Functionality**:
    - **Search & Filter**: Filter by category, region, country, or status (Active/Inactive).
    - **Product CRUD**: Manually create, update, or deactivate products.
    - **Metadata Fields**: Support for Vintage, Color, Region, Appellation, and Grape Varieties.
- **Acceptance Criteria**:
    - Users can view a paginated list of products.
    - Search results update in real-time as the user types.
    - Deactivating a product hides it from counting sessions but preserves historical data.

### 3.2.2. Barcode Management
- **Description**: Associating physical barcodes (EAN/UPC) with digital product records.
- **Functionality**:
    - **Multiple Barcodes**: Support for multiple barcodes per product (e.g., different vintages or packaging).
    - **Scanning Interface**: Mobile-optimized scanner to link a barcode to a product instantly.
- **Business Justification**: Accelerates inventory counting by 80% compared to manual name searching.

### 3.2.3. Category Hierarchy
- **Description**: A flexible system for grouping products.
- **Functionality**:
    - **Syrve Mapping**: Map local categories to Syrve Product Groups.
    - **Inheritance**: Set default units and glass dimensions at the category level.

---

## 3.3. Technical Implementation

### 3.3.1. Data Model
- **Primary Table**: `products`
    - `syrve_product_id`: Links to external POS system.
    - `unit_capacity`: Decimal value (e.g., 0.75 for a standard wine bottle).
    - `metadata`: JSONB column for flexible wine-specific attributes.
- **Supporting Table**: `product_barcodes`
    - Scoped to `business_id` to allow shared barcodes across different tenants.

### 3.3.2. Integration Points
- **Syrve Sync**: The catalog is periodically refreshed from Syrve to pull new items and updated pricing.
- **AI Recognition**: The catalog provides the reference images and names used by the AI Vision engine to match labels during counting.

---

## 3.4. User Interaction Flow
1. **Import**: Admin clicks "Sync from POS" to pull new items.
2. **Review**: Admin opens a newly imported wine.
3. **Enrich**: Admin adds the "Vintage" and scans the "Barcode".
4. **Configure**: Admin sets a "Par Level" of 12 bottles.
5. **Ready**: Product is now available for staff to count in the next session.

---

## 3.5. Validation & Edge Cases
- **Duplicate Barcodes**: System prevents the same barcode from being assigned to two different products within the same business.
- **Missing Syrve ID**: Items created manually without a Syrve ID are flagged as "Local Only" and cannot be synced back to the POS.
- **Price Changes**: If a price changes in Syrve, the system highlights the discrepancy during the next sync for admin review.
