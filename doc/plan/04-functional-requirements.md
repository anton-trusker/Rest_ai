# 04 — Functional Requirements

## 1. User Stories

### Staff Member (Counter)
- **As a Staff Member**, I want to scan product barcodes so that I can quickly record quantities without manual searching.
- **As a Staff Member**, I want to use AI image recognition to identify products with missing or damaged barcodes.
- **As a Staff Member**, I want to see a history of my counts within the current session so that I can correct mistakes before finishing.
- **As a Staff Member**, I want the app to work offline so that I can continue counting in the cellar where there is no Wi-Fi.

### Manager (Reviewer)
- **As a Manager**, I want to see real-time progress of an inventory session so that I can allocate staff effectively.
- **As a Manager**, I want to review variances between counted and expected stock so that I can investigate discrepancies immediately.
- **As a Manager**, I want to flag specific items for recount so that I can ensure data accuracy.

### Administrator (System Owner)
- **As an Admin**, I want to connect the app to our Syrve server so that our product data is always up-to-date.
- **As an Admin**, I want to schedule automatic product syncs so that I don't have to trigger them manually every day.
- **As an Admin**, I want to send completed inventory results back to Syrve so that our master stock records are updated automatically.
- **As an Admin**, I want to manage user roles and permissions so that only authorized personnel can see sensitive stock value data.

---

### 4.2 Core Functional Requirements
-   **Offline Operation**:
    -   Requirement: App must allow scanning and counting without internet.
    -   Verification: Enter "Airplane Mode", scan 5 items, turn off mode, items sync to Supabase.
-   **Partial/Opened Bottle Tracking**:
    -   Requirement: User can mark an item as "Opened" and enter a decimal quantity.
    -   Logic: `quantity` column stores total volume/units; `is_opened` flag denotes state.
-   **AI Label Recognition (Visual Match)**:
    -   Requirement: Identify items by photo when barcode is missing.
    -   Logic: Edge Function compares image embeddings against known product images.
-   **Variant Management**:
    -   Requirement: Handle products with multiple sizes or vintages under a parent SKU.
    -   Logic: Display variant picker if child records exist in Syrve data.
-   **Collaborative Sessions**:
    -   Requirement: Multiple staff can contribute to the same session simultaneously.
    -   Conflict Resolution: Last-write-wins at the line-item level with audit trail.

---

## 3. Acceptance Criteria (Sample)

### AC1: Successful Product Sync
- **Given** a valid Syrve connection is configured
- **When** the Admin clicks "Sync Products Now"
- **Then** the system should fetch all product groups and products from Syrve
- **And** it should create new records for new items
- **And** it should update existing records for changed items
- **And** it should deactivate items no longer present in Syrve
- **And** it should log the total count of synced items.

### AC2: Barcode Lookup
- **Given** an active inventory session
- **When** a user scans a valid product barcode
- **Then** the system should instantly display the product name, unit, and SKU
- **And** it should open the quantity entry interface.
- **If** the barcode is unknown, it should display a "Product Not Found" message and offer manual search.
