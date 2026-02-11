# 04 — Inventory Module

## 4.1. Overview
The **Inventory Module** is the operational core of the application. It handles the physical process of counting stock, managing sessions, and reconciling variances between physical counts and digital records.

### 4.1.1. Business Objectives
- **Process Integrity**: Ensure every bottle is counted and verified.
- **Accuracy in Partials**: Provide tools for precise measurement of open bottles.
- **Auditability**: Maintain a complete record of who counted what, when, and how.
- **POS Reconciliation**: Facilitate the seamless transfer of final counts to the financial system.

---

## 4.2. Feature Breakdown

### 4.2.1. Session Management
- **Description**: Control center for inventory counting events.
- **Functionality**:
    - **Session Types**: "Full" (all products) or "Partial" (specific categories or locations).
    - **Status Workflow**: `Draft` -> `In Progress` -> `Pending Review` -> `Approved` -> `Synced`.
    - **Assignment**: (Optional) Assign specific staff members to locations.
- **Acceptance Criteria**:
    - Only one "Full" session can be active at a time per business.
    - Admins can force-close a session if needed.

### 4.2.2. Intelligent Counting (Staff View)
- **Description**: The mobile-first interface used by staff to record stock.
- **Methods**:
    - **Barcode Scan**: Instant identification via camera.
    - **AI Label Scan**: Visual identification using Vision AI for bottles without barcodes.
    - **Manual Search**: Fallback search by name or SKU.
- **Partial Bottle Logic**:
    - **Visual Slider**: A UI component representing a bottle where staff can "slide" to indicate the liquid level.
    - **Weight/Volume**: (Future) Support for Bluetooth scales or direct volume entry.

### 4.2.3. Review & Reconciliation (Admin View)
- **Description**: Tools for administrators to verify count accuracy.
- **Functionality**:
    - **Variance Analysis**: Comparison of `Expected` (from POS) vs `Counted` (Physical).
    - **Discrepancy Highlighting**: Color-coded rows for items with significant differences.
    - **Recount Request**: Ability to flag specific items for a second check.

---

## 4.3. Technical Implementation

### 4.3.1. Data Model
- **`inventory_sessions`**: Tracks the metadata of the counting event.
- **`inventory_items`**: Individual count records.
    - `method`: Tracks if item was counted via `manual`, `barcode`, or `ai`.
    - `is_opened`: Boolean flag for partial bottle tracking.
    - `image_url`: Optional photo taken by staff for verification.

### 4.3.2. Business Logic: The "Blind Count"
The system implements a **Blind Count** strategy for the `Staff` role. 
- **Rule**: The `expected_stock` field is never sent to the frontend for users with the `Staff` role.
- **Purpose**: Prevents staff from entering the expected number instead of performing a physical count.

---

## 4.4. User Interaction Flow
1. **Start**: Admin creates a "Weekly Wine Count" session.
2. **Execute**: Staff member opens the app on their phone, selects "Bar Fridge", and begins scanning.
3. **Capture**: For an open bottle of Gin, the staff member uses the slider to indicate it is 40% full.
4. **Submit**: Once all items in the location are counted, the staff member submits their section.
5. **Review**: Admin reviews the "Weekly Wine Count", sees a -2 bottle variance in Sauvignon Blanc, and investigates.
6. **Sync**: Admin approves the session, and a "Stock Adjustment" document is created in Syrve.

---

## 4.5. Performance & Scalability
- **Offline Support**: Inventory items are cached locally using `IndexedDB` (via React Query/Zustand) to allow counting in thick-walled cellars with no Wi-Fi.
- **Real-time Sync**: As soon as a connection is restored, counts are pushed to Supabase using a "Last Write Wins" conflict resolution strategy.
- **Pagination**: The count interface uses virtualized lists to handle locations with 500+ SKUs without UI lag.
