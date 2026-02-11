# Feature Specifications

## Overview

This document details all features of the Wine Inventory Management System.

---

## 1. Wine Catalog Management

### 1.1 Wine Listing

**Page:** `/catalog`  
**Access:** All users  
**Component:** `WineCatalog.tsx`

Features:
- Paginated table with customizable columns
- Advanced filtering (type, region, country, stock status)
- Full-text search across name, producer, region
- Sort by any column
- Export to Excel
- Bulk actions (Admin only)

| Filter | Options |
|--------|---------|
| Wine Type | Red, White, Rosé, Sparkling, Fortified |
| Country | Dynamic from catalog |
| Region | Dynamic from catalog |
| Stock Status | In Stock, Low Stock, Out of Stock |
| Price Range | Min/Max slider |
| Active Status | Active, Inactive, All |

### 1.2 Wine Detail

**Page:** `/catalog/:id`  
**Access:** All users  
**Component:** `WineDetail.tsx`

Displays:
- Full wine information (100+ fields)
- Primary image + gallery
- Stock levels (closed/open)
- Pricing information
- Tasting notes and critic scores
- Inventory history
- Associated barcodes

### 1.3 Add/Edit Wine

**Page:** `/catalog/new`, `/catalog/:id/edit`  
**Access:** Admin only  
**Component:** `WineForm.tsx`

Form sections:
1. **Basic Information** - Name, producer, vintage, type
2. **Origin** - Country, region, appellation, vineyard
3. **Specifications** - Volume, ABV, grape varieties
4. **Tasting Profile** - Body, tannins, acidity, notes
5. **Pricing** - Purchase, retail, sale, glass prices
6. **Inventory** - Stock levels, par levels, location
7. **Barcodes** - Primary + alternative barcodes
8. **Images** - Primary label + additional photos

### 1.4 Import Wines

**Page:** `/catalog/import`  
**Access:** Admin only  
**Component:** `ImportInventory.tsx`

Features:
- CSV/Excel file upload
- Column mapping interface
- Preview before import
- Validation with error reporting
- Duplicate detection
- Bulk insert/update

---

## 2. Inventory Counting

### 2.1 Start Count Session

**Page:** `/count`  
**Access:** All users  
**Component:** `InventoryCount.tsx`

Flow:
1. Click "Start New Count"
2. Select count scope (all wines, specific location, wine type)
3. Session created in `draft` status
4. Transition to counting interface

### 2.2 Counting Interface

**Component:** `CameraScanner.tsx`, `ManualSearchSheet.tsx`

Recognition methods:
- **Manual Search** - Type wine name, select from list
- **Barcode Scan** - Use camera to scan UPC/EAN
- **AI Image Recognition** - Photograph wine label

### 2.3 Barcode Scanning

**Hook:** `useBarcodeScanner.ts`

Process:
1. Activate camera
2. Detect barcode in frame
3. Look up in `wine_barcodes` table
4. If found → show quantity popup
5. If not found → prompt manual search

Supported formats: UPC-A, EAN-13, EAN-8

### 2.4 AI Image Recognition

**Integration:** OpenAI Vision API

Process:
1. Capture image of wine label
2. Send to OpenAI Vision API
3. Extract wine information (name, producer, vintage)
4. Match against catalog
5. Return matched wine with confidence score
6. If confidence < 80% → prompt for confirmation

### 2.5 Quantity Entry

**Component:** `QuantityPopup.tsx`

Fields:
- Closed bottles (unopened)
- Open bottles
- Notes (optional)
- Location (optional)

Separate tracking for closed/open bottles enables:
- Accurate value calculation
- Waste identification
- By-glass service management

### 2.6 Session Completion

**Component:** `SessionSummary.tsx`

Process:
1. Review all counted items
2. View variances (expected vs. counted)
3. Add session notes
4. Complete session → `completed` status
5. Stock levels updated automatically
6. Audit trail created

---

## 3. Stock Management

### 3.1 Current Stock View

**Page:** `/stock`  
**Access:** Admin only  
**Component:** `CurrentStock.tsx`

> **Important:** Staff users cannot view current stock to prevent counting bias.

Features:
- Real-time stock levels
- Closed vs. open bottle breakdown
- Par level indicators (green/yellow/red)
- Total value calculation
- Low stock alerts
- Stock history per wine

Columns:
| Column | Description |
|--------|-------------|
| Wine | Name, producer, vintage |
| Closed | Unopened bottles |
| Open | Opened bottles |
| Total | Combined count |
| Par | Minimum stock level |
| Status | In Stock / Low / Out |
| Value | Total stock value |
| Last Count | Date of last count |

### 3.2 Stock Alerts

Automatic alerts when:
- Stock falls below par level
- Stock reaches zero
- Unusual variance detected (>10%)

---

## 4. Session Management

### 4.1 Session Review

**Page:** `/sessions`  
**Access:** Admin only  
**Component:** `SessionReview.tsx`

Features:
- View all inventory sessions
- Filter by status, date, user
- Drill down to session details
- Approve pending sessions
- Flag sessions for review
- Export session data

Session statuses:
| Status | Description |
|--------|-------------|
| `draft` | Created, not started |
| `in_progress` | Currently counting |
| `pending_review` | Awaiting admin approval |
| `completed` | Finalized |
| `cancelled` | Aborted |

### 4.2 Variance Analysis

After session completion:
- Highlight items with variance
- Show expected vs. counted
- Calculate value impact
- Generate variance report

---

## 5. Inventory History

**Page:** `/history`  
**Access:** Admin views all, Staff views own only  
**Component:** `InventoryHistory.tsx`

Features:
- Complete audit trail
- Filter by date range, user, wine, action
- View recognition method used
- Access captured images
- Export history report

Logged information:
- Timestamp
- User who performed action
- Wine affected
- Quantity change
- Recognition method (manual/barcode/AI)
- AI confidence score (if applicable)
- Captured image (if applicable)
- Session reference

---

## 6. User Management

### 6.1 User List

**Page:** `/users`  
**Access:** Admin only  
**Component:** `UserManagement.tsx`

Features:
- View all users
- Create new users
- Edit user details
- Assign roles
- Activate/deactivate accounts
- Reset passwords

### 6.2 User Roles

**Page:** `/settings/roles`  
**Access:** Admin only  
**Component:** `RolesPermissions.tsx`

Roles:
| Role | Description | Key Permissions |
|------|-------------|-----------------|
| Admin | Full access | All features, user management, stock view |
| Staff | Limited access | Counting, own history, profile |

Permission categories:
- Wine catalog (view/edit/delete)
- Inventory (count/approve/export)
- Stock (view current levels)
- Users (manage/assign roles)
- Settings (configure app)
- Reports (generate/export)

---

## 7. Reports

**Page:** `/reports`  
**Access:** Admin only  
**Component:** `Reports.tsx`

Available reports:
- **Stock Valuation** - Current stock with values
- **Inventory Variance** - Discrepancies from counts
- **Movement History** - All stock changes
- **User Activity** - Actions per user
- **Low Stock** - Items below par level
- **Consumption** - Usage trends over time

Export formats: Excel, PDF, CSV

---

## 8. Settings

### 8.1 General Settings

**Page:** `/settings/general`  
**Access:** Admin only  
**Component:** `GeneralSettings.tsx`

Configurable options:
- Business name and details
- Default currency
- Stock alert thresholds
- AI recognition settings
- Barcode scanner settings
- Email notifications

### 8.2 App Settings

**Page:** `/settings`  
**Access:** Admin only  
**Component:** `AppSettings.tsx`

Settings categories:
- General configuration
- Roles & permissions
- Locations management
- Suppliers management
- Reference data (grape varieties, volumes)

---

## 9. User Profile

**Page:** `/profile`  
**Access:** All users  
**Component:** `Profile.tsx`

Features:
- View/edit personal information
- Change password
- Set preferences (theme, language)
- View activity history
- Notification settings

---

## 10. Dashboard

**Page:** `/dashboard`  
**Access:** All users (content varies by role)  
**Component:** `Dashboard.tsx`

### Admin Dashboard
- Total wines in catalog
- Total stock value
- Low stock alerts
- Recent activity (all users)
- Quick actions

### Staff Dashboard
- Personal stats (counts today)
- Recent personal activity
- Quick start counting button

---

## 11. Mobile Experience

The application is fully responsive with mobile-optimized features:

**Component:** `MobileBottomNav.tsx`

Mobile navigation tabs:
- Home (Dashboard)
- Count (Inventory)
- History
- Profile

Mobile-specific features:
- Camera access for scanning
- Touch-optimized quantity input
- Swipe navigation
- Offline capability (planned)
