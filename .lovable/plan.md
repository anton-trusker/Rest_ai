

# Wine Inventory System -- Gap Analysis and Implementation Plan

## Gap Analysis: Current App vs. Documentation

After a detailed review of the three uploaded documents against the current codebase, here is a comprehensive list of what is missing or incomplete.

---

## 1. Missing Pages and Screens

### 1.1 Wine Detail Page (NEW)
- **Route:** `/catalog/:id`
- No wine detail page exists. Clicking a wine card does nothing.
- Per docs: should show full wine info, image, tasting notes, stock levels (admin only), movement history link, and edit/duplicate/archive actions.

### 1.2 Add Wine Form (NEW)
- **Route:** `/catalog/new`
- The "Add Wine" button exists but does nothing.
- Per docs: Multi-section form with basic info, classification, origin, product details, inventory settings, barcodes, images, and notes.

### 1.3 Edit Wine Form (NEW)
- **Route:** `/catalog/:id/edit`
- No edit functionality exists.
- Per docs: Same as Add Wine but pre-filled, with read-only metadata, image management, and a "Danger Zone" for archiving.

### 1.4 Add/Create User Form (NEW)
- **Route:** `/users/new` (or modal)
- The "Create User" button exists but does nothing.
- Per docs: Form with name, email, password (with strength indicator), role, status, phone, notes.

### 1.5 Edit User Form (NEW)
- **Route:** `/users/:id/edit` (or modal)
- The "Edit" button exists but does nothing.
- Per docs: Pre-filled form with activity summary, optional password change, and danger zone for deletion.

### 1.6 Inventory Session Summary / Completion Screen (NEW)
- When a user ends a counting session, there is no summary screen.
- Per docs: Should show total wines counted, total bottles (closed/open breakdown), duration, recognition method breakdown, and options to view report, start new count, or return to dashboard.

### 1.7 Inventory Results Review and Approval (Admin -- NEW)
- **Route:** `/history/sessions` or integrated into History
- Admin should be able to view completed inventory sessions, see results with variance highlighting (color-coded), and approve/reject them.
- Per docs: Variance = counted vs. expected. Color coding: green (match), yellow (minor variance), red (large variance).

---

## 2. Missing Filters and Sorting

### 2.1 Wine Catalog -- Missing Filters
- **Country filter** -- not implemented
- **Vintage range filter** -- not implemented
- **Stock status filter** (In Stock / Low / Out) -- not implemented
- **Has Images filter** (With / Without) -- not implemented
- **Sort options** -- only type filter exists; missing: Name A-Z/Z-A, Producer, Vintage, Stock level, Last Updated

### 2.2 Current Stock -- Missing Filters
- **Type filter** (Red/White/Rose/Sparkling) -- not implemented
- **Location filter** (Cellar A/B/Bar) -- not implemented
- **Sort options** -- missing: Name, Stock level, Value, Last movement
- **Color-coded rows** -- per docs: green (healthy), yellow (low), red (out of stock) -- partially done via badges but not row backgrounds

### 2.3 Inventory History -- Missing Filters
- **Date range filter** -- not implemented
- **User filter** (admin: select specific user) -- not implemented
- **Wine search/autocomplete** -- basic search exists but no autocomplete
- **Session filter** -- not implemented
- **Action type filter** -- not implemented
- **Date quick presets** (Today, This Week, Last 30 Days) -- not implemented

### 2.4 User Management -- Missing Filters
- **Search by name/email** -- not implemented
- **Role filter** (All/Admin/Staff) -- not implemented
- **Status filter** (All/Active/Inactive) -- not implemented
- **Sort** (Name, Last Login, Most Active) -- not implemented

---

## 3. Missing Data Fields (from DB Schema Document)

### 3.1 Wine Model -- Missing Fields
The current `Wine` interface is minimal compared to the DB schema. Missing fields to add to the mock data model:

- `fullName`, `estate` (basic info)
- `subRegion`, `appellation` (origin)
- `bottleSize` label (e.g., "Standard", "Magnum")
- `purchasePrice`, `salePrice`, `glassPrice`, `availableByGlass` (pricing)
- `maxStockLevel`, `reorderPoint`, `reorderQuantity`, `stockStatus` (stock management)
- `cellarSection`, `rackNumber`, `shelfPosition` (location details, currently a single string)
- `supplierName` (supplier)
- `foodPairing` (pairing)
- `primaryBarcode`, `barcodeType` (barcode details)
- `closureType`, `bottleColor` (packaging)
- `body`, `sweetness`, `acidity`, `tannins` (characteristics)
- `isDiscontinued`, `isArchived` (lifecycle)
- `createdAt`, `updatedAt` (audit)

### 3.2 Inventory Session Model -- Missing
No inventory session tracking exists. Need:
- `sessionName`, `sessionType`, `description`, `status` (draft/in_progress/completed/paused)
- `locationFilter`, `totalWinesExpected`, `totalWinesCounted`
- `startedAt`, `completedAt`, `duration`
- `createdBy`

### 3.3 Inventory Items Model -- Missing
Individual wine counts within a session are not tracked. Need:
- `expectedQuantityUnopened/Opened` (previous count)
- `countedQuantityUnopened/Opened`
- `varianceUnopened/Opened/Total` (calculated)
- `hasVariance` flag
- `countingMethod`, `countingDurationSeconds`

### 3.4 User Model -- Missing Fields
- `phone`, `jobTitle`, `department`, `notes`
- `avatarUrl`, `isLocked`, `failedLoginAttempts`

---

## 4. Missing Functional Features

### 4.1 Role-Based Visibility Gaps
- Staff can currently see the Wine Catalog page with stock levels -- per docs, staff should NOT see stock quantities (prevents counting bias)
- Navigation is correct but stock numbers are visible on catalog cards for all users

### 4.2 Session Management
- No session pause/resume functionality
- No session timer (elapsed time)
- No progress tracking (X of Y wines counted)
- No session completion flow with summary

### 4.3 Variance and Approval Workflow (Admin)
- No comparison of current count vs. previous count
- No variance calculation or display
- No color-coded variance highlighting
- No approval/reject workflow for admin

### 4.4 Movement Detail View
- No detail modal/page for individual inventory movements
- Per docs: Should show wine details, recognition details (method, confidence, processing time), quantity details (before/after/variance), and attached images

### 4.5 Image Upload for Wines
- No image upload functionality on Add/Edit wine forms
- No "missing image" alert on dashboard

### 4.6 Export Functionality
- Export buttons exist but do nothing (Stock, History, Reports)

### 4.7 Quick Stock Adjustment (Admin)
- No modal for admin to quickly adjust stock outside of inventory sessions

---

## Implementation Plan (Phased)

Given the scope, this should be broken into phases. Here is the recommended order:

### Phase 1: Data Model Enhancement
1. Expand the `Wine` interface with missing fields from the DB schema
2. Create `InventorySession` and `InventoryItem` interfaces with mock data
3. Expand `MockUser` interface with missing fields
4. Update mock data to include the new fields

### Phase 2: Missing CRUD Pages
5. **Wine Detail Page** (`/catalog/:id`) -- full wine info display with all new fields
6. **Add Wine Form** (`/catalog/new`) -- multi-section form with all fields from docs
7. **Edit Wine Form** (`/catalog/:id/edit`) -- pre-filled form with archive option
8. **Create User Form** (modal or `/users/new`) -- form with validation
9. **Edit User Form** (modal or `/users/:id/edit`) -- pre-filled with danger zone

### Phase 3: Filters and Sorting Everywhere
10. **Wine Catalog** -- add country, vintage range, stock status, has-images filters and all sort options
11. **Current Stock** -- add type, location filters, sort options, and color-coded row backgrounds (green/yellow/red)
12. **Inventory History** -- add date range, user, session, action type filters
13. **User Management** -- add search, role, status filters, and sort

### Phase 4: Inventory Session Improvements
14. **Session tracking** -- timer, progress counter, pause/resume
15. **Session completion screen** -- summary with stats breakdown
16. **Inventory items tracking** -- store each counted wine with expected vs. counted

### Phase 5: Admin Variance Review and Approval
17. **Session results page** -- admin views completed sessions
18. **Variance display** -- color-coded comparison (green = match, yellow = minor, red = large)
19. **Approval workflow** -- admin can approve/flag/reject session results
20. **Movement detail modal** -- full detail view for each count entry

### Phase 6: Remaining Features
21. **Role-based stock hiding** -- hide stock quantities from staff in catalog
22. **Quick stock adjustment modal** -- admin adjusts stock outside sessions
23. **Export functionality** -- CSV/Excel export for stock and history
24. **Dashboard alerts** -- missing images count, low stock alerts with links

---

## Technical Notes

- All pages will use the existing component patterns: `wine-glass-effect` cards, `wine-badge` status indicators, shadcn/ui components
- Forms will use `react-hook-form` + `zod` for validation (already installed)
- State management continues with `zustand` for auth; local state for form/filter state
- Mock data will be stored in `src/data/` files until Lovable Cloud/Supabase is connected
- Color coding for variance: Tailwind classes like `bg-green-500/10`, `bg-yellow-500/10`, `bg-red-500/10` for row highlighting
- New routes will be added to `App.tsx` under the existing `AppLayout` wrapper

