# **Wine Inventory Management System \- Complete Solution Document**

## **Table of Contents**

1. User Roles & Permissions  
2. Admin User Flows  
3. Staff User Flows  
4. Image Management System  
5. History & Audit Trail  
6. Wine Variants & Bottle States  
7. Complete Screen Specifications  
8. Updated Data Model

---

## **1\. User Roles & Permissions {\#user-roles}**

## **Admin Role**

**Full access to:**

* Create, edit, delete users  
* Manage complete wine catalog (CRUD operations)  
* View all inventory sessions and movements across all users  
* Access complete audit history with images and user details  
* View real-time stock levels for all wines  
* Export reports and analytics  
* Manually add/edit wine images  
* Close/reopen inventory sessions  
* Configure system settings

## **Staff Role**

**Limited access to:**

* Perform inventory operations (search, scan, add quantities)  
* View wine details during inventory process  
* Contribute images during scanning (automatic capture)  
* See their own inventory history  
* **Cannot:**  
  * View current stock levels  
  * Access other users' activities  
  * Manage wine catalog  
  * Create users  
  * Access admin reports

---

## **2\. Admin User Flows {\#admin-flows}**

## **2.1 Admin Login & Dashboard**

**Screen: Login**

* Email/Username field  
* Password field  
* "Login" button  
* "Forgot password?" link  
* Role is determined by backend after authentication

**Screen: Admin Dashboard**

**Header:**

* Logo (left)  
* "Admin Dashboard" title (center)  
* User avatar with dropdown (right):  
  * Profile  
  * Settings  
  * Logout

**Main Content:**

* **Quick Stats Cards (4 cards in 2x2 grid):**  
  * Total Wines in Catalog  
    * Number with trend indicator  
  * Total Current Stock (all bottles)  
    * Unopened \+ Opened counts  
  * Low Stock Alerts  
    * Number of wines below minimum threshold  
  * Active Users  
    * Staff members currently logged in  
* **Action Buttons (large touch-friendly):**  
  * "Manage Wine Catalog"  
  * "Manage Users"  
  * "View Current Stock"  
  * "Inventory History"  
  * "Analytics & Reports"  
* **Recent Activity Feed:**  
  * Last 10 inventory movements  
  * Each entry shows:  
    * User name \+ avatar  
    * Wine name \+ vintage  
    * Quantity added/removed  
    * Method (Search/Barcode/Image)  
    * Timestamp  
    * "View details" link

---

## **2.2 User Management Flow**

**Screen: Users List**

**Header:**

* Back arrow (to dashboard)  
* "Users Management"  
* "+ Add User" button (top-right)

**Filter/Search Bar:**

* Search by name or email  
* Filter by role (All/Admin/Staff)  
* Filter by status (All/Active/Inactive)

**Users Table/List:**  
Each row/card shows:

* Avatar (generated or uploaded)  
* Name  
* Email  
* Role badge (Admin/Staff)  
* Status badge (Active/Inactive)  
* Last login timestamp  
* Actions:  
  * Edit icon  
  * Activate/Deactivate toggle  
  * Delete icon (with confirmation)

**Tap on user row → User Detail Screen**

---

**Screen: Add New User**

**Form Fields:**

* Full Name\*  
* Email Address\*  
* Password\* (with show/hide toggle)  
* Confirm Password\*  
* Role dropdown:\* (Admin / Staff)  
* Status toggle: Active/Inactive (default: Active)  
* Phone (optional)  
* Notes (optional)

**Buttons:**

* "Cancel"  
* "Create User"

**Validation:**

* Email format check  
* Password strength indicator (min 8 chars, 1 uppercase, 1 number)  
* Duplicate email check

**After creation:**

* Success message: "User \[Name\] created successfully"  
* Option: "Send credentials via email" checkbox  
* Return to Users List

---

**Screen: Edit User**

Same form as Add User, but:

* Pre-filled with existing data  
* "Update Password" section (optional):  
  * New Password  
  * Confirm New Password  
  * Leave blank to keep existing  
* "Last Login" info displayed (read-only)  
* "Created At" info displayed (read-only)

**Additional Admin-only fields:**

* View user's inventory history link  
* Total movements count  
* Total bottles counted by this user

**Buttons:**

* "Cancel"  
* "Save Changes"  
* "Delete User" (red, bottom, with confirmation)

**Delete Confirmation Modal:**

* "Are you sure you want to delete \[User Name\]?"  
* Warning: "This will not delete their inventory history, but they will no longer be able to log in."  
* "Cancel" / "Delete User"

---

## **2.3 Wine Catalog Management Flow**

**Screen: Wine Catalog**

**Header:**

* Back arrow  
* "Wine Catalog"  
* "+ Add Wine" button

**Filter/Search Panel:**

* Search bar: "Search by name, producer, grape, SKU..."  
* Filters (collapsible):  
  * Type (All/Red/White/Rosé/Sparkling/Fortified/Other)  
  * Country (dropdown or multi-select)  
  * Vintage range (from/to)  
  * Status (All/Active/Archived)  
  * Stock status (All/In Stock/Low Stock/Out of Stock)

**Sort Options:**

* Name (A-Z)  
* Producer (A-Z)  
* Vintage (newest/oldest)  
* Current Stock (high/low)  
* Last Updated

**Wine List (card or table view toggle):**

**Card View (mobile-friendly):**  
Each card shows:

* Wine image thumbnail (or placeholder if no image)  
* Name \+ Vintage  
* Producer  
* Type badge \+ Volume badge (0.75L)  
* Current Stock: **XX unopened \+ YY opened**  
* Low stock indicator (if below min\_stock)  
* Quick actions:  
  * Edit icon  
  * Duplicate icon (for creating variants)  
  * Archive icon

**Tap on card → Wine Detail Screen**

---

**Screen: Add New Wine**

**Form Sections (scrollable):**

**1\. Basic Information**

* Wine Name\*  
* Producer/Winery\*  
* Vintage (Year)\* (number input or dropdown)  
* Internal SKU/Code (auto-generated option)

**2\. Classification**

* Type\* (dropdown: Red, White, Rosé, Sparkling, Fortified, Dessert, Other)  
* Grape Varieties (multi-select or text with chips)  
  * E.g., "Cabernet Sauvignon, Merlot"

**3\. Origin**

* Country\* (dropdown)  
* Region (text)  
* Sub-Region (text)  
* Appellation (text, optional)

**4\. Product Details**

* Volume (ml)\*  
  * Dropdown: 375ml (Half), 500ml, 750ml (Standard), 1000ml, 1500ml (Magnum), Custom  
  * If custom, numeric input  
* Alcohol % (optional)  
* Price per bottle (optional, for reference)

**5\. Inventory Settings**

* Initial Stock \- Unopened (number, default 0\)  
* Initial Stock \- Opened (number, default 0\)  
* Minimum Stock Level (number, for alerts)

**6\. Barcodes**

* Barcode 1 (EAN-13/UPC)  
  * Input field with "Scan" button (if on mobile with camera)  
* Add more barcodes (button)  
  * Allows multiple barcodes per wine variant

**7\. Images**

* Primary Label Image\*  
  * Upload button  
  * Camera button (mobile)  
  * Preview  
* Additional Images (up to 5\)  
  * Gallery upload

**8\. Notes**

* Tasting Notes (rich text)  
* Internal Notes (text area)

**Buttons (sticky footer):**

* "Cancel"  
* "Save Wine"

**After saving:**

* Success message  
* Option: "Add Another" or "View Wine"

---

**Screen: Edit Wine**

Same form as Add Wine, with:

* All fields pre-populated  
* Additional Info Section (read-only):  
  * Created At  
  * Created By (admin name)  
  * Last Updated At  
  * Last Updated By  
  * Total Movements Count  
  * Link to "View Movement History for This Wine"

**Additional Options:**

* "Duplicate Wine" button (creates a copy, useful for same wine different vintage)  
* "Archive Wine" button (soft delete, removes from active lists)

**Image Management:**

* Existing images shown with:  
  * Delete icon (X)  
  * "Set as Primary" button  
* Upload new images

---

**Screen: Wine Detail View (Read-Only for Admin)**

**Header:**

* Back arrow  
* Wine name \+ vintage  
* Edit icon (top right)

**Content:**

**Image Gallery:**

* Large primary image  
* Thumbnail strip below (scroll horizontally)  
* Tap thumbnail to enlarge

**Info Cards:**

1. **Basic Info Card:**  
   * Producer  
   * Type \+ Volume  
   * Grape varieties  
   * Origin (Country, Region)  
   * Vintage  
2. **Current Stock Card (Admin Only):**  
   * **Unopened Bottles: XX**  
   * **Opened Bottles: YY**  
   * **Total: ZZ bottles**  
   * Stock status indicator:  
     * Green: In Stock (above min)  
     * Yellow: Low Stock (below min)  
     * Red: Out of Stock (0)  
   * Last movement: \[date, user\]  
3. **Barcodes Card:**  
   * List of all barcodes  
   * Copy icon next to each  
4. **Notes Card:**  
   * Tasting notes  
   * Internal notes

**Action Buttons:**

* "View Movement History"  
* "Quick Adjust Stock" (opens modal)

**Quick Adjust Stock Modal:**

* Wine name \+ vintage displayed  
* Current Stock shown  
* Adjustment Type:  
  * Radio: Add Unopened / Add Opened / Remove Unopened / Remove Opened  
* Quantity input  
* Reason/Notes (text area)  
* "Cancel" / "Confirm"  
* After confirm: logged as manual adjustment by admin

---

## **2.4 Current Stock View Flow**

**Screen: Current Stock Overview**

**Header:**

* Back arrow  
* "Current Stock"  
* Export icon (CSV/Excel)

**Summary Cards (top):**

* Total Wines: XX  
* Total Unopened: YYY bottles  
* Total Opened: ZZZ bottles  
* Low Stock Alerts: NN wines

**Filter Panel:**

* Search wine name  
* Type filter  
* Stock status filter:  
  * All  
  * In Stock  
  * Low Stock  
  * Out of Stock  
* Bottle state filter:  
  * All  
  * Has Unopened  
  * Has Opened

**Stock Table/List:**

Each row shows:

* Wine Image (thumbnail)  
* Wine Name \+ Vintage  
* Producer  
* Type \+ Volume  
* **Unopened: XX** | **Opened: YY**  
* **Total: ZZ**  
* Stock Status badge  
* Last Movement (date \+ user)  
* Actions:  
  * View details icon  
  * Quick adjust icon

**Mobile View:**  
Cards with:

* Image \+ name on left  
* Stock numbers large on right  
* Color-coded border based on stock status

**Tap row → Wine Detail View**

**Export Function:**

* Generates CSV/Excel with:  
  * All wine details  
  * Current unopened stock  
  * Current opened stock  
  * Total stock  
  * Last movement date  
  * Stock status

---

## **2.5 Inventory History & Audit Trail Flow**

**Screen: Inventory History**

**Header:**

* Back arrow  
* "Inventory History"  
* Export icon

**Filter Panel (collapsible):**

* Date Range:  
  * Preset: Today/Last 7 days/Last 30 days/Custom  
  * From date picker  
  * To date picker  
* User Filter (multi-select dropdown):  
  * All Users  
  * \[List of users with checkboxes\]  
* Wine Filter:  
  * Search/autocomplete wine name  
* Method Filter:  
  * All Methods  
  * Search  
  * Barcode Scan  
  * Image Recognition  
  * Manual Adjustment (admin)  
* Bottle State:  
  * All  
  * Unopened  
  * Opened  
* Session Filter:  
  * All Sessions  
  * \[List of recent sessions\]

**Sort Options:**

* Date (newest/oldest)  
* User (A-Z)  
* Wine (A-Z)  
* Quantity (high/low)

**History List/Timeline:**

Each entry card shows:

* **Timestamp** (date \+ time)  
* **User info:**  
  * Avatar \+ Name  
  * Role badge  
* **Wine info:**  
  * Image thumbnail  
  * Name \+ Vintage \+ Volume  
* **Action:**  
  * "+X Unopened" or "+Y Opened" or "-Z Unopened" or "-W Opened"  
  * Color-coded (green for add, red for remove)  
* **Method badge:**  
  * Search / Barcode Scan / Image Recognition / Manual  
* **Session name** (if part of session)  
* **"View Details"** button

**Tap on entry → Movement Detail Screen**

---

**Screen: Movement Detail**

**Header:**

* Back arrow  
* "Movement Details"  
* Movement ID (small, top)

**Content Sections:**

**1\. Summary Card:**

* Large quantity display: "+12 Unopened Bottles"  
* Wine name \+ vintage \+ volume  
* Status: Completed

**2\. Wine Information:**

* Image (tapped to enlarge)  
* Name, Producer, Type, Vintage, Volume  
* "View Full Wine Details" link

**3\. User Information:**

* Avatar \+ Name  
* Role  
* Email  
* "View User Profile" link (admin only)

**4\. Method Details:**

* Method Used: \[Badge\]  
* If **Barcode Scan:**  
  * Barcode value displayed  
  * Barcode type (EAN-13, etc.)  
* If **Image Recognition:**  
  * **Captured Image thumbnail** (tap to enlarge)  
  * AI Confidence score: "92%"  
  * AI Provider response data (collapsible JSON)  
  * Alternative matches shown to user (if any)  
* If **Search:**  
  * Search query used: "château margaux"  
* If **Manual:**  
  * Admin notes displayed

**5\. Bottle State:**

* Type: Unopened / Opened

**6\. Session Information:**

* Session Name  
* Session Location  
* Session Status  
* "View Full Session" link

**7\. Timestamp Information:**

* Created At: \[Full timestamp\]  
* Device/Browser info (optional, from request headers)

**8\. Notes:**

* User notes (if any)  
* Admin notes (if any)

**9\. Captured Image (if Image Recognition method):**

* Full-size image viewer  
* Download button  
* "Set as Wine Reference Image" button (admin only)

**Action Buttons (admin only):**

* "Revert This Movement" (creates opposite movement)  
* "Edit Notes"  
* "Flag for Review"

---

## **2.6 Analytics & Reports Flow**

**Screen: Reports Dashboard**

**Header:**

* Back arrow  
* "Analytics & Reports"

**Report Categories:**

**1\. Inventory Reports**

* Current Stock Report (export)  
* Stock Movement Report (date range, filters)  
* Low Stock Report  
* Out of Stock Report  
* Stock Valuation Report (if prices entered)

**2\. User Activity Reports**

* User Performance Report (movements per user)  
* Method Usage Report (search vs barcode vs image %)  
* Session Report (all sessions with completion %)

**3\. Wine Reports**

* Top 10 Most Moved Wines  
* Slow-Moving Wines  
* New Additions Report  
* Wines Without Images

**4\. Audit Reports**

* Complete Audit Trail (all movements, all users)  
* Image Recognition Accuracy Report  
* Failed Recognition Attempts

Each report card has:

* Icon  
* Title  
* Description  
* "Generate Report" button  
* Filter options (date range, user, etc.)  
* Export format options (CSV, Excel, PDF)

---

## **3\. Staff User Flows {\#staff-flows}**

## **3.1 Staff Login & Home**

**Screen: Login**

* Same as admin login  
* After login, role determines which dashboard is shown

**Screen: Staff Home**

**Header:**

* Logo  
* "Inventory" title  
* User avatar with dropdown:  
  * My Profile  
  * My History  
  * Logout

**Main Content:**

**Active Session Card (if session is open):**

* Session name  
* Location  
* Started at (timestamp)  
* Your movements: XX bottles counted  
* "Continue Session" button (large, primary)

**OR (if no active session):**

* "Start New Inventory Session" button (large)  
  * Opens modal to name session and select location

**Quick Actions:**

* "Search Wine" (card with search icon)  
* "Scan Barcode" (card with barcode icon)  
* "Scan Label" (card with camera icon)

**Recent Wines (Your Last 10):**

* Scrollable horizontal cards  
* Each card:  
  * Wine image  
  * Name \+ vintage  
  * "Added \+X" timestamp  
  * Tap to quickly add more of the same wine

**Stats (Small):**

* Today's movements: XX bottles  
* This session: YY bottles

---

## **3.2 Start Inventory Session**

**Modal: New Inventory Session**

**Fields:**

* Session Name\*  
  * Auto-suggestion: "Inventory \- \[Date\]"  
  * Can customize  
* Location\* (dropdown or text)  
  * Options: Main Cellar, Bar, Storage Room, Custom  
* Notes (optional)

**Buttons:**

* "Cancel"  
* "Start Session"

**After starting:**

* Redirected to Inventory Session Screen  
* Session is now "active" for this user

---

## **3.3 Search & Add Workflow (Staff)**

**Screen: Search Wine**

**Header:**

* Back arrow (to home)  
* "Search Wine"  
* Session name badge (top right)

**Search Bar (large, prominent):**

* Placeholder: "Type wine name, producer, grape, or vintage..."  
* Clear button (X)

**Search Results (live, as typing):**

* List updates in real-time  
* Each result card shows:  
  * Wine image thumbnail  
  * **Name \+ Vintage \+ Volume**  
  * Producer  
  * Type badge  
  * Grape varieties (small text)  
  * **Tap anywhere on card → Wine Quick View**

**If no results:**

* "No wines found matching '\[query\]'"  
* "Try different keywords"  
* "Scan barcode" button  
* "Scan label" button

---

**Screen: Wine Quick View (Staff)**

**Modal or New Screen:**

**Header:**

* Back/Close  
* Wine name \+ vintage

**Content:**

**Image:**

* Large wine image  
* Swipe if multiple images available

**Wine Details Card:**

* Producer  
* Type \+ Volume  
* Grape varieties  
* Vintage  
* Origin (country, region)

**Bottle State Selection (New Feature):**

* Radio buttons or toggle:  
  * **Unopened Bottles**  
  * **Opened Bottles**  
* Default: Unopened

**Quantity Input Section:**

* Label: "How many \[Unopened/Opened\] bottles?"  
* Large numeric input  
  * Shows numeric keyboard on mobile  
* Quick add buttons:  
  * \+1  
  * \+6  
  * \+12  
  * \+24  
* Minus button (to reduce if needed)

**Notes Field (optional):**

* Placeholder: "Add notes (optional)..."  
* E.g., "Found in back corner", "2 bottles damaged"

**Buttons (sticky footer):**

* "Cancel"  
* "Confirm & Add" (large, primary)

**After confirm:**

* Success toast: "✓ \+X \[Unopened/Opened\] bottles of \[Wine Name\] added"  
* Vibration feedback (mobile)  
* Options:  
  * "Add More" (reopens quantity input, reset to 0\)  
  * "Search Another Wine" (back to search)  
  * "Done" (back to home)

---

## **3.4 Barcode Scan Workflow (Staff)**

**Screen: Barcode Scanner**

**Full-screen camera preview**

**UI Overlay:**

* Semi-transparent top bar:  
  * "Scan Barcode" title  
  * Close button (X)  
* Center: Scanning frame (animated borders)  
  * Hint: "Align barcode within frame"  
* Bottom bar:  
  * Flashlight toggle (if supported)  
  * Switch to "Scan Label" button

**Behavior:**

* Continuous scanning  
* When barcode detected:  
  * Beep sound \+ vibration  
  * Camera freezes  
  * Loading indicator: "Looking up wine..."  
  * Backend call: `GET /api/wines/by-barcode/{code}`

**Result Scenarios:**

**A) Single Wine Found:**

* Scanner closes  
* Navigate to Wine Quick View modal (same as search result)  
* Pre-filled with scanned wine  
* User selects bottle state (unopened/opened) and quantity  
* User confirms

**B) Multiple Wines Found (e.g., same barcode, different vintages/sizes):**

* Scanner closes  
* **Screen: Select Wine Variant**  
  * Header: "Multiple matches found"  
  * List of candidates:  
    * Each card shows: Image, Name, **Vintage**, **Volume**, Producer  
    * Differences highlighted (vintage in bold, volume in badge)  
  * Tap on correct variant → Wine Quick View

**C) No Wine Found:**

* Scanner closes  
* **Screen: Barcode Not Found**  
  * Icon: Warning/info  
  * Message: "No wine found for barcode \[XXXXX\]"  
  * Options:  
    * "Search by Name" (opens search screen, prefilled if possible)  
    * "Try Again" (reopen scanner)  
    * "Scan Label Instead" (switch to image recognition)  
    * "Cancel" (back to home)

---

## **3.5 Image Recognition Workflow (Staff)**

**Screen: Label Scanner**

**Full-screen camera preview**

**UI Overlay:**

* Top bar:  
  * "Scan Wine Label" title  
  * Close button (X)  
* Center: Focus frame (larger than barcode frame)  
  * Hint: "Center the label in the frame"  
  * Guidance: "Make sure label is clear and well-lit"  
* Bottom bar:  
  * Flashlight toggle  
  * Gallery button (choose from photos)  
  * **Capture button (large circle)**  
  * Switch to "Scan Barcode" button

**Capture Flow:**

**Step 1: Capture**

* User taps capture button  
* Camera captures image  
* Shutter animation

**Step 2: Preview**

* **Screen: Image Preview**  
  * Captured image displayed  
  * Buttons:  
    * "Retake" (back to camera)  
    * "Use This Image" (proceed)

**Step 3: Processing**

* Loading screen:  
  * Animated icon  
  * "Analyzing label..."  
  * "This may take a few seconds"  
* Backend:  
  * Compresses image if needed  
  * Calls AI recognition API  
  * Matches results to internal DB  
  * Stores captured image temporarily

**Result Scenarios:**

**A) Single High-Confidence Match (\>85%):**

* **Screen: Confirm Wine**  
  * Header: "Is this the wine?"  
  * **Captured image shown (top)**  
  * **Matched wine card:**  
    * Wine DB image (for comparison)  
    * Name \+ Vintage \+ Volume  
    * Producer  
    * Confidence badge: "92% match"  
  * Buttons:  
    * "Yes, This is Correct" → Proceed to Quick View  
    * "No, Try Again" → Back to scanner  
    * "Search Instead" → Open search

**B) Multiple Candidates (or medium confidence 60-85%):**

* **Screen: Select Matching Wine**  
  * Header: "Which wine is this?"  
  * **Captured image shown (small, top)**  
  * List of candidates (sorted by confidence):  
    * Each card:  
      * Wine DB image  
      * Name \+ Vintage \+ Volume  
      * Producer  
      * Confidence badge (e.g., "78%")  
      * "Select" button  
  * "None of these" button (opens search)  
  * Tap on card → Confirmation screen → Quick View

**C) Low Confidence or No Match (\<60%):**

* **Screen: Label Not Recognized**  
  * Header: "Could not identify wine"  
  * **Captured image shown**  
  * Message: "The label could not be recognized. You can:"  
  * Options:  
    * "Search by Name" (open search)  
    * "Try Again" (better lighting, different angle)  
    * "Enter Manually" (search, then after adding, ask to link image)  
    * "Cancel"

---

**After Wine Identified (all methods) → Wine Quick View:**

**If Wine Has NO Image in Database:**

* **Special flow triggered**  
* After user confirms quantity (in Quick View):  
  * **Modal: Add Image to Catalog**  
    * Message: "This wine doesn't have an image yet. Would you like to add the one you just captured?"  
    * **Preview of captured image**  
    * Buttons:  
      * "Yes, Add Image" (image stored as primary label image for this wine)  
      * "No, Skip" (image stored in history only, not linked to wine catalog)  
  * **Backend:**  
    * If "Yes": Image linked to `wine_images` table, `is_reference_label = true`  
    * If "No": Image stored in `stock_movements` table as `captured_image_url` only  
  * Success message: "Image added to \[Wine Name\] successfully"  
* Then proceed to normal "Confirm & Add" flow

**After Confirm & Add:**

* Movement recorded with:  
  * method \= IMAGE\_RECOGNITION  
  * captured\_image\_url stored  
  * ai\_confidence score stored  
  * ai\_raw\_response stored (in ai\_recognition\_logs)

---

## **3.6 My History (Staff)**

**Screen: My Inventory History**

**Header:**

* Back arrow  
* "My History"

**Filter (simple):**

* Date Range: Today / Last 7 days / Last 30 days / All Time  
* Session Filter: All / \[List of sessions I participated in\]

**Stats Cards (top):**

* Total Bottles Counted: XXX  
* Sessions Participated: YY  
* Most Used Method: \[Badge\]

**History List:**

* Chronological list (newest first)  
* Each entry:  
  * Timestamp  
  * Wine image \+ name \+ vintage  
  * "+X Unopened" or "+Y Opened"  
  * Method badge  
  * Session name  
  * Tap → View details (limited detail view, no edit)

**Staff Detail View (limited):**

* Same info as admin detail view, but:  
  * No "Revert" button  
  * No "Edit Notes" button  
  * No user info section (it's their own)  
  * Can see captured image if image recognition

---

## **4\. Image Management System {\#image-management}**

## **4.1 Image Sources**

**1\. Admin Manual Upload:**

* During wine creation/editing  
* From wine detail screen  
* Can upload multiple images per wine  
* Can set primary label image

**2\. Staff Capture During Inventory (Auto-Capture):**

* When using Image Recognition method  
* Image automatically captured when user takes photo of label  
* **If wine has no image:**  
  * User prompted to add captured image to wine catalog after confirming quantity  
  * If user accepts: image becomes primary label image  
  * If user declines: image stored in movement history only  
* **If wine already has image:**  
  * Captured image stored in movement history only (for audit)  
  * Not offered to add to catalog

## **4.2 Image Storage Structure**

**Database Tables:**

**`wine_images` table:**

* id  
* wine\_id (FK)  
* image\_url (cloud storage URL)  
* is\_primary\_label (boolean)  
* source (ADMIN\_UPLOAD, STAFF\_CAPTURE\_ADDED)  
* uploaded\_by (user\_id)  
* uploaded\_at  
* image\_hash (for duplicate detection)

**`stock_movements` table (updated):**

* ... existing fields ...  
* captured\_image\_url (nullable, for image recognition method)  
* ai\_confidence (float, 0-1)  
* ai\_raw\_response\_id (FK to ai\_recognition\_logs)

**`ai_recognition_logs` table:**

* id  
* user\_id  
* session\_id  
* request\_timestamp  
* response\_timestamp  
* image\_url (captured image)  
* raw\_request (JSON)  
* raw\_response (JSON \- AI API full response)  
* matched\_wine\_id (nullable)  
* confidence (float)  
* status (SUCCESS, FAILED, NO\_MATCH)

## **4.3 Image Processing Flow**

**Upload/Capture:**

1. Client sends image (base64 or multipart/form-data)  
2. Backend validates:  
   * File type (JPEG, PNG, WebP)  
   * File size (max 10MB)  
   * Image dimensions (min 300x300, max 4096x4096)  
3. Backend processes:  
   * Generate thumbnail (300x300)  
   * Compress original if needed  
   * Calculate image hash (for duplicate detection)  
4. Upload to cloud storage (S3-compatible)  
5. Store URLs in database

**For AI Recognition:**

1. Capture → Backend receives image  
2. Backend calls AI API with image  
3. Store AI response in `ai_recognition_logs`  
4. Match AI result to internal wines  
5. Return candidates to frontend  
6. After user confirms and adds quantity:  
   * Store movement with captured\_image\_url  
   * If wine has no image, offer to add it

---

## **5\. History & Audit Trail {\#audit-trail}**

## **5.1 What Gets Logged**

**Every Stock Movement Logs:**

* Movement ID  
* Timestamp (with timezone)  
* User ID \+ Name \+ Role  
* Wine ID \+ Full wine details at time of movement  
* Quantity change (+ or \-)  
* Bottle state (UNOPENED or OPENED)  
* Method (SEARCH, BARCODE\_SCAN, IMAGE\_RECOGNITION, MANUAL\_ADMIN)  
* Session ID (if part of session)  
* Notes  
* **If Barcode:** Barcode value \+ type  
* **If Image Recognition:**  
  * Captured image URL  
  * AI confidence score  
  * AI recognition log ID (link to full AI response)  
  * Alternative matches shown to user (JSON)  
* Device/browser info (user agent)

**AI Recognition Attempts Log:**

* All calls to AI API (success or failure)  
* Request image  
* Full AI response (for debugging/training)  
* Whether it led to successful match  
* User who made the request  
* Session context

**User Actions Log (optional, for advanced audit):**

* Login/logout events  
* Failed login attempts  
* Profile changes  
* Permission changes (admin actions)

## **5.2 Admin Audit Features**

**In Movement Detail Screen (Admin):**

* Full transparency:  
  * See exact captured image (if image recognition)  
  * See AI raw response data  
  * See what alternatives were shown to user  
  * See device info  
  * See session context  
* Actions:  
  * Download captured image  
  * Set captured image as wine reference image  
  * Flag movement for review  
  * Revert movement (creates opposite entry)  
  * Add admin notes

**Audit Reports:**

* Generate compliance reports  
* Export full audit trail  
* Filter by any field  
* Search within notes

**Image Recognition Accuracy Tracking:**

* Report showing:  
  * Total recognition attempts  
  * Success rate by confidence threshold  
  * Most commonly misidentified wines  
  * Wines with no successful recognition  
* Helps admin decide which wines need better reference images

---

## **6\. Wine Variants & Bottle States {\#wine-variants}**

## **6.1 Handling Wine Variants**

**Problem:**  
Same wine name can have:

* Different vintages (2018, 2019, 2020\)  
* Different volumes (0.375L, 0.5L, 0.75L, 1.5L Magnum)  
* Different bottle states (Unopened, Opened)

**Solution:**

**1\. Separate Database Records for Each Variant:**

* Each unique combination of (Name \+ Producer \+ Vintage \+ Volume) \= separate wine record  
* Examples:  
  * Château Margaux 2018 0.75L (id: 1\)  
  * Château Margaux 2019 0.75L (id: 2\)  
  * Château Margaux 2018 1.5L (id: 3\)

**2\. Volume Field in Wine Table:**

* Standard volumes dropdown:  
  * 187ml (Piccolo/Split)  
  * 375ml (Half/Demi)  
  * 500ml  
  * 750ml (Standard)  
  * 1000ml  
  * 1500ml (Magnum)  
  * 3000ml (Double Magnum)  
  * Custom (numeric input)

**3\. Bottle State Tracking:**

**New approach: Track unopened and opened separately in stock**

**Updated `wines` table:**

* current\_stock\_unopened (integer, default 0\)  
* current\_stock\_opened (integer, default 0\)

**Updated `stock_movements` table:**

* bottle\_state (ENUM: UNOPENED, OPENED)  
* quantity\_change (integer, positive or negative)

**Why:**

* Restaurant needs to track bottles sold by the glass (opened bottles)  
* Inventory includes both sealed bottles and opened bottles in use  
* Different handling: unopened for full bottle sales, opened for glass sales

**UI Implications:**

**In Search/Scan Results (when multiple variants exist):**

* Show all variants grouped by name:  
  text

`Château Margaux 2018`  
  `├─ 0.75L (Standard) - Stock: 12 unopened, 2 opened`  
  `└─ 1.5L (Magnum) - Stock: 3 unopened, 0 opened`

`Château Margaux 2019`  
  `└─ 0.75L (Standard) - Stock: 24 unopened, 1 opened`

*   
* User taps on specific variant → Quick View

**In Barcode/Image Recognition:**

* If same barcode/label matches multiple variants (common for same wine, different vintages):  
  * Show disambiguation screen  
  * Highlight differences: **Vintage** and **Volume** in bold  
  * User selects correct variant

**In Quick View (after selecting wine):**

* Show variant details clearly:  
  * "Château Margaux **2018** \- **0.75L**"  
* Bottle State Selection:  
  * Radio buttons: **Unopened** / **Opened**  
* Quantity input

---

## **6.2 Bottle State User Flows**

**Scenario 1: Counting Unopened Bottles (Full Inventory)**

Staff member:

1. Scans/searches wine: "Château X 2020 0.75L"  
2. Quick View opens  
3. Selects: **Unopened Bottles**  
4. Enters quantity: \+12  
5. Confirms  
6. Backend logs: `{wine_id: 123, bottle_state: UNOPENED, quantity_change: +12}`  
7. Updates: `wine.current_stock_unopened += 12`

**Scenario 2: Counting Opened Bottles (Bar Inventory)**

Staff member:

1. Scans wine: "Château X 2020 0.75L"  
2. Quick View opens  
3. Selects: **Opened Bottles**  
4. Enters quantity: \+2 (two bottles opened for by-the-glass service)  
5. Confirms  
6. Backend logs: `{wine_id: 123, bottle_state: OPENED, quantity_change: +2}`  
7. Updates: `wine.current_stock_opened += 2`

**Scenario 3: Mixed Counting (Cellar Inventory)**

Staff member finds:

* 18 unopened bottles of Château X 2020 0.75L  
* 1 opened bottle (sample pour)

Process:

1. Search/scan wine  
2. Quick View → Select **Unopened** → Enter 18 → Confirm  
3. Success message  
4. Tap "Add More" (or search same wine again)  
5. Quick View → Select **Opened** → Enter 1 → Confirm  
6. Two separate movements logged

**Admin Stock View shows:**

text  
`Château X 2020 0.75L`  
`Unopened: 18 bottles`  
`Opened: 1 bottle`  
`Total: 19 bottles`

---

## **6.3 Variant Disambiguation UI**

**When Barcode/Image Matches Multiple Variants:**

**Screen: Select Wine Variant**

**Header:**

* "Multiple variants found"  
* "Select the exact wine you're counting"

**Captured/Scanned Context (top):**

* If image recognition: show captured image thumbnail  
* If barcode: show barcode number

**Variant List:**  
Cards showing:

text  
`┌─────────────────────────────────────────┐`  
`│ [Image]  Château Margaux                │`  
`│          Vintage: **2018**               │`  
`│          Volume: **750ml (Standard)**    │`  
`│          Producer: Château Margaux       │`  
`│          Stock: 12 unopened, 2 opened    │`  
`│          [Select This Variant] ───────→ │`  
`└─────────────────────────────────────────┘`

`┌─────────────────────────────────────────┐`  
`│ [Image]  Château Margaux                │`  
`│          Vintage: **2019**               │`  
`│          Volume: **750ml (Standard)**    │`  
`│          Producer: Château Margaux       │`  
`│          Stock: 24 unopened, 1 opened    │`  
`│          [Select This Variant] ───────→ │`  
`└─────────────────────────────────────────┘`

`┌─────────────────────────────────────────┐`  
`│ [Image]  Château Margaux                │`  
`│          Vintage: **2018**               │`  
`│          Volume: **1.5L (Magnum)**       │`  
`│          Producer: Château Margaux       │`  
`│          Stock: 3 unopened, 0 opened     │`  
`│          [Select This Variant] ───────→ │`  
`└─────────────────────────────────────────┘`

**Key differences highlighted:**

* Vintage in bold \+ color highlight  
* Volume in bold \+ badge  
* Different stock levels shown

**Bottom Button:**

* "None of these \- Search manually"

**Tap on variant → Quick View with bottle state selection**

---

## **7\. Complete Screen Specifications {\#screen-specs}**

## **7.1 Screen Layout Patterns**

**Mobile-First Responsive Design:**

* Max content width: 480px (mobile), 768px (tablet), 1200px (desktop)  
* Touch targets: min 44x44px (Apple), 48x48px (Android)  
* Bottom navigation on mobile (sticky)  
* Top navigation on desktop (fixed)

**Color Scheme:**

* Primary: Wine red (\#8B0000) for actions  
* Secondary: Gold/amber (\#D4AF37) for accents  
* Success: Green (\#28A745)  
* Warning: Amber (\#FFC107)  
* Error: Red (\#DC3545)  
* Background: Light gray (\#F5F5F5)  
* Surface: White (\#FFFFFF)  
* Text: Dark gray (\#212529)

**Typography:**

* Headers: Bold, 24-32px  
* Subheaders: Semibold, 18-20px  
* Body: Regular, 14-16px  
* Small text: Regular, 12px  
* Wine names: Serif font for elegance (Georgia, Crimson)  
* UI text: Sans-serif (system fonts)

---

## **7.2 Complete Screen Inventory**

**Admin Screens (23 screens):**

1. Login  
2. Admin Dashboard  
3. Users List  
4. Add User  
5. Edit User  
6. User Detail  
7. Wine Catalog List  
8. Add Wine  
9. Edit Wine  
10. Wine Detail (Admin View)  
11. Quick Adjust Stock Modal  
12. Current Stock Overview  
13. Inventory History  
14. Movement Detail  
15. Reports Dashboard  
16. Stock Report Screen  
17. User Activity Report  
18. Audit Report  
19. Settings  
20. Profile  
21. Session Management (Admin View)  
22. Image Gallery (Wine Images)  
23. Bulk Import Wines

**Staff Screens (18 screens):**

1. Login  
2. Staff Home  
3. Start Session Modal  
4. Search Wine  
5. Search Results  
6. Wine Quick View (Staff)  
7. Confirm & Add Success  
8. Barcode Scanner  
9. Barcode Not Found  
10. Select Wine Variant  
11. Label Scanner (Image Recognition)  
12. Image Preview  
13. Processing/Loading  
14. Confirm Wine Match  
15. Select Matching Wine (Multiple)  
16. Label Not Recognized  
17. Add Image to Catalog Modal (Staff)  
18. My History

**Shared Screens (5 screens):**

1. Profile/Settings  
2. Change Password  
3. Forgot Password  
4. Logout Confirmation  
5. Error Screens (404, 500, No Connection)

**Total: 46 screens**

---

## **8\. Updated Data Model {\#data-model}**

## **Complete Database Schema**

sql  
*`-- Users table`*  
`CREATE TABLE users (`  
    `id SERIAL PRIMARY KEY,`  
    `name VARCHAR(255) NOT NULL,`  
    `email VARCHAR(255) UNIQUE NOT NULL,`  
    `password_hash VARCHAR(255) NOT NULL,`  
    `role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),`  
    `is_active BOOLEAN DEFAULT TRUE,`  
    `phone VARCHAR(50),`  
    `notes TEXT,`  
    `last_login_at TIMESTAMP,`  
    `created_at TIMESTAMP DEFAULT NOW(),`  
    `updated_at TIMESTAMP DEFAULT NOW()`  
`);`

*`-- Wines table with separate stock fields`*  
`CREATE TABLE wines (`  
    `id SERIAL PRIMARY KEY,`  
    `name VARCHAR(255) NOT NULL,`  
    `producer VARCHAR(255) NOT NULL,`  
    `country VARCHAR(100),`  
    `region VARCHAR(100),`  
    `sub_region VARCHAR(100),`  
    `appellation VARCHAR(100),`  
    `grape_varieties TEXT, -- JSON array or comma-separated`  
    `vintage INTEGER, -- Year`  
    `type VARCHAR(50) CHECK (type IN ('RED', 'WHITE', 'ROSE', 'SPARKLING', 'FORTIFIED', 'DESSERT', 'OTHER')),`  
    `volume_ml INTEGER NOT NULL, -- 375, 500, 750, 1500, etc.`  
    `alcohol_percentage DECIMAL(4,2),`  
    `price_per_bottle DECIMAL(10,2),`  
    `sku VARCHAR(100) UNIQUE,`  
      
    `-- Stock tracking (separate for unopened and opened)`  
    `current_stock_unopened INTEGER DEFAULT 0,`  
    `current_stock_opened INTEGER DEFAULT 0,`  
    `min_stock_level INTEGER DEFAULT 0,`  
      
    `is_active BOOLEAN DEFAULT TRUE,`  
    `tasting_notes TEXT,`  
    `internal_notes TEXT,`  
      
    `created_by INTEGER REFERENCES users(id),`  
    `created_at TIMESTAMP DEFAULT NOW(),`  
    `updated_at TIMESTAMP DEFAULT NOW(),`  
      
    `-- Composite index for common queries`  
    `UNIQUE(name, producer, vintage, volume_ml)`  
`);`

*`-- Wine barcodes (one wine can have multiple barcodes)`*  
`CREATE TABLE wine_barcodes (`  
    `id SERIAL PRIMARY KEY,`  
    `wine_id INTEGER REFERENCES wines(id) ON DELETE CASCADE,`  
    `barcode_value VARCHAR(255) NOT NULL,`  
    `barcode_type VARCHAR(50) DEFAULT 'EAN_13', -- EAN_13, UPC_A, CODE_128, etc.`  
    `created_at TIMESTAMP DEFAULT NOW(),`  
      
    `UNIQUE(barcode_value)`  
`);`

*`-- Wine images`*  
`CREATE TABLE wine_images (`  
    `id SERIAL PRIMARY KEY,`  
    `wine_id INTEGER REFERENCES wines(id) ON DELETE CASCADE,`  
    `image_url VARCHAR(500) NOT NULL,`  
    `thumbnail_url VARCHAR(500),`  
    `is_primary_label BOOLEAN DEFAULT FALSE,`  
    `source VARCHAR(50) CHECK (source IN ('ADMIN_UPLOAD', 'STAFF_CAPTURE_ADDED')),`  
    `uploaded_by INTEGER REFERENCES users(id),`  
    `image_hash VARCHAR(64), -- For duplicate detection`  
    `created_at TIMESTAMP DEFAULT NOW()`  
`);`

*`-- Inventory sessions`*  
`CREATE TABLE inventory_sessions (`  
    `id SERIAL PRIMARY KEY,`  
    `name VARCHAR(255) NOT NULL,`  
    `location VARCHAR(255),`  
    `status VARCHAR(20) CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',`  
    `notes TEXT,`  
    `created_by INTEGER REFERENCES users(id),`  
    `created_at TIMESTAMP DEFAULT NOW(),`  
    `closed_at TIMESTAMP,`  
    `closed_by INTEGER REFERENCES users(id)`  
`);`

*`-- Stock movements (with bottle state)`*  
`CREATE TABLE stock_movements (`  
    `id SERIAL PRIMARY KEY,`  
    `session_id INTEGER REFERENCES inventory_sessions(id),`  
    `wine_id INTEGER REFERENCES wines(id),`  
    `user_id INTEGER REFERENCES users(id) NOT NULL,`  
      
    `quantity_change INTEGER NOT NULL, -- Positive or negative`  
    `bottle_state VARCHAR(20) NOT NULL CHECK (bottle_state IN ('UNOPENED', 'OPENED')),`  
    `method VARCHAR(50) NOT NULL CHECK (method IN ('SEARCH', 'BARCODE_SCAN', 'IMAGE_RECOGNITION', 'MANUAL_ADMIN')),`  
      
    `-- Additional data based on method`  
    `barcode_scanned VARCHAR(255), -- If method = BARCODE_SCAN`  
    `captured_image_url VARCHAR(500), -- If method = IMAGE_RECOGNITION`  
    `ai_confidence DECIMAL(5,4), -- 0.0000 to 1.0000, if IMAGE_RECOGNITION`  
    `ai_recognition_log_id INTEGER, -- FK to ai_recognition_logs`  
      
    `notes TEXT,`  
    `device_info TEXT, -- User agent string`  
    `created_at TIMESTAMP DEFAULT NOW()`  
`);`

*`-- AI recognition logs`*  
`CREATE TABLE ai_recognition_logs (`  
    `id SERIAL PRIMARY KEY,`  
    `user_id INTEGER REFERENCES users(id),`  
    `session_id INTEGER REFERENCES inventory_sessions(id),`  
      
    `request_timestamp TIMESTAMP DEFAULT NOW(),`  
    `response_timestamp TIMESTAMP,`  
      
    `captured_image_url VARCHAR(500) NOT NULL,`  
    `raw_request JSONB, -- Full request sent to AI API`  
    `raw_response JSONB, -- Full response from AI API`  
      
    `status VARCHAR(50) CHECK (status IN ('SUCCESS', 'FAILED', 'NO_MATCH', 'LOW_CONFIDENCE')),`  
    `matched_wine_id INTEGER REFERENCES wines(id), -- Final matched wine`  
    `confidence DECIMAL(5,4),`  
    `alternative_matches JSONB, -- Array of other candidate wines shown to user`  
      
    `created_at TIMESTAMP DEFAULT NOW()`  
`);`

*`-- User activity log (optional, for advanced audit)`*  
`CREATE TABLE user_activity_log (`  
    `id SERIAL PRIMARY KEY,`  
    `user_id INTEGER REFERENCES users(id),`  
    `action_type VARCHAR(100), -- LOGIN, LOGOUT, PROFILE_UPDATE, etc.`  
    `action_details JSONB,`  
    `ip_address VARCHAR(45),`  
    `user_agent TEXT,`  
    `created_at TIMESTAMP DEFAULT NOW()`  
`);`

*`-- Indexes for performance`*  
`CREATE INDEX idx_wines_name ON wines(name);`  
`CREATE INDEX idx_wines_producer ON wines(name);`  
`CREATE INDEX idx_wines_vintage ON wines(vintage);`  
`CREATE INDEX idx_wines_type ON wines(type);`  
`CREATE INDEX idx_wines_active ON wines(is_active);`  
`CREATE INDEX idx_wine_barcodes_value ON wine_barcodes(barcode_value);`  
`CREATE INDEX idx_stock_movements_wine ON stock_movements(wine_id);`  
`CREATE INDEX idx_stock_movements_user ON stock_movements(user_id);`  
`CREATE INDEX idx_stock_movements_session ON stock_movements(session_id);`  
`CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);`  
`CREATE INDEX idx_ai_logs_user ON ai_recognition_logs(user_id);`  
`CREATE INDEX idx_ai_logs_matched_wine ON ai_recognition_logs(matched_wine_id);`

---

## **9\. Technical Implementation Notes**

## **9.1 Stock Update Logic (Critical)**

**When movement is added:**

javascript  
*`// Backend transaction (pseudocode)`*  
`BEGIN TRANSACTION;`

*`// 1. Insert movement`*  
`INSERT INTO stock_movements (`  
    `wine_id, user_id, session_id,`  
    `quantity_change, bottle_state, method,`  
    `barcode_scanned, captured_image_url, ai_confidence,`  
    `notes, device_info`  
`) VALUES (...);`

*`// 2. Update wine stock atomically`*  
`IF bottle_state = 'UNOPENED' THEN`  
    `UPDATE wines`   
    `SET current_stock_unopened = current_stock_unopened + quantity_change,`  
        `updated_at = NOW()`  
    `WHERE id = wine_id;`  
`ELSE IF bottle_state = 'OPENED' THEN`  
    `UPDATE wines`   
    `SET current_stock_opened = current_stock_opened + quantity_change,`  
        `updated_at = NOW()`  
    `WHERE id = wine_id;`  
`END IF;`

*`// 3. Validate stock doesn't go negative (if removal)`*  
`IF new_stock < 0 THEN`  
    `ROLLBACK;`  
    `RETURN ERROR "Stock cannot be negative";`  
`END IF;`

`COMMIT;`

## **9.2 Image Recognition Integration**

**Provider: API4AI Wine Recognition (or similar)**

**Backend endpoint: POST /api/ai/recognize-label**

javascript  
`async function recognizeWineLabel(imageFile, userId, sessionId) {`  
    `// 1. Validate and compress image`  
    `const compressedImage = await compressImage(imageFile, {`  
        `maxWidth: 1024,`  
        `maxHeight: 1024,`  
        `quality: 0.85`  
    `});`  
      
    `// 2. Upload to storage`  
    `const imageUrl = await uploadToStorage(compressedImage);`  
      
    `// 3. Call AI API`  
    `const aiResponse = await fetch('https://api.api4ai.io/v1/results', {`  
        `method: 'POST',`  
        `headers: {`  
            ``'Authorization': `Bearer ${AI_API_KEY}`,``  
            `'Content-Type': 'application/json'`  
        `},`  
        `body: JSON.stringify({`  
            `image: imageUrl,`  
            `` // or base64: `data:image/jpeg;base64,${base64Image}` ``  
        `})`  
    `});`  
      
    `const aiResult = await aiResponse.json();`  
      
    `// 4. Log the recognition attempt`  
    `const logEntry = await db.ai_recognition_logs.create({`  
        `user_id: userId,`  
        `session_id: sessionId,`  
        `captured_image_url: imageUrl,`  
        `raw_request: { image_url: imageUrl },`  
        `raw_response: aiResult,`  
        `status: aiResult.status,`  
        `created_at: new Date()`  
    `});`  
      
    `// 5. Match AI results to internal wines`  
    `const candidates = await matchAIResultsToWines(aiResult);`  
      
    `// 6. Update log with matched wine`  
    `if (candidates.length > 0) {`  
        `await db.ai_recognition_logs.update(logEntry.id, {`  
            `matched_wine_id: candidates[0].wine_id,`  
            `confidence: candidates[0].confidence,`  
            `alternative_matches: candidates.slice(1, 5) // Top 5 alternatives`  
        `});`  
    `}`  
      
    `// 7. Return candidates to frontend`  
    `return {`  
        `log_id: logEntry.id,`  
        `captured_image_url: imageUrl,`  
        `candidates: candidates,`  
        `status: candidates.length > 0 ? 'SUCCESS' : 'NO_MATCH'`  
    `};`  
`}`

`async function matchAIResultsToWines(aiResult) {`  
    `// Extract predictions from AI response`  
    `const predictions = aiResult.results[0].entities[0].classes;`  
      
    `const candidates = [];`  
      
    `for (const prediction of predictions) {`  
        `// prediction = { class: "Château Margaux", prob: 0.92 }`  
          
        `// Fuzzy search in database`  
        `const matches = await db.wines.search({`  
            `name: prediction.class,`  
            `vintage: extractVintage(prediction.class),`  
            `fuzzy: true,`  
            `is_active: true`  
        `});`  
          
        `for (const match of matches) {`  
            `candidates.push({`  
                `wine_id: match.id,`  
                `wine: match,`  
                `confidence: prediction.prob,`  
                `ai_class: prediction.class`  
            `});`  
        `}`  
    `}`  
      
    `// Sort by confidence`  
    `candidates.sort((a, b) => b.confidence - a.confidence);`  
      
    `return candidates;`  
`}`

## **9.3 Barcode Scanning (Frontend)**

**Using STRICH SDK (example):**

javascript  
`import { BarcodeReader } from '@strich/strich-sdk';`

`async function startBarcodeScanner() {`  
    `const reader = new BarcodeReader({`  
        `selector: '#barcode-scanner', // DOM element`  
        `engine: {`  
            `symbologies: ['ean13', 'upca', 'code128'],`  
            `duplicateInterval: 2000 // Prevent duplicate scans`  
        `},`  
        `feedback: {`  
            `audio: true,`  
            `vibration: true`  
        `}`  
    `});`  
      
    `await reader.initialize();`  
      
    `reader.detected = async (detections) => {`  
        `const barcode = detections[0].data;`  
          
        `// Stop scanner`  
        `await reader.stop();`  
          
        `// Look up wine`  
        ``const response = await fetch(`/api/wines/by-barcode/${barcode}`);``  
        `const wines = await response.json();`  
          
        `if (wines.length === 1) {`  
            `// Single match - go to quick view`  
            `navigateToQuickView(wines[0]);`  
        `} else if (wines.length > 1) {`  
            `// Multiple matches - show selection`  
            `navigateToVariantSelection(wines, barcode);`  
        `} else {`  
            `// No match`  
            `showBarcodeNotFound(barcode);`  
        `}`  
    `};`  
      
    `await reader.start();`  
`}`

---

## **10\. Summary & Next Steps**

## **What This Solution Provides**

✅ **Complete user role separation** (Admin vs Staff with different permissions)  
✅ **Full admin control** (users, catalog, stock view, audit trail)  
✅ **Fast staff inventory workflows** (search, barcode, image recognition)  
✅ **Image management** (manual upload \+ auto-capture with prompt to add)  
✅ **Complete audit history** (all actions, methods, images, users logged)  
✅ **Wine variant handling** (same name, different vintage/volume tracked separately)  
✅ **Bottle state tracking** (unopened vs opened bottles counted separately)  
✅ **Mobile-first responsive design** (works on phones, tablets, desktop)  
✅ **AI integration** (wine label recognition with confidence scores)  
✅ **Barcode scanning** (in-browser, no native app needed)  
✅ **46 detailed screens** with flows, UI elements, and interactions  
✅ **Complete data model** with all relationships and indexes

## **Ready for Implementation**

This document provides:

* Every screen layout and user interaction  
* Complete database schema with relationships  
* API endpoint structure  
* Integration specifications (AI, barcode scanning)  
* Security and audit requirements  
* Mobile-responsive design guidelines

**Next steps:**

1. Review and approve this specification  
2. Choose specific technologies (React/Vue, Node/Python, PostgreSQL, etc.)  
3. Set up development environment  
4. Create clickable prototypes (Figma recommended)  
5. Begin phased development (Auth → Catalog → Search → Barcode → AI)  
6. Beta testing with actual staff  
7. Production deployment

Would you like me to:

* Create a **detailed API specification document** (all endpoints with request/response schemas)?  
* Create a **visual wireframe document** (screen layouts in more detail)?  
* Create a **technical architecture diagram** (system components, data flow)?  
* Create a **project timeline & estimation** (development phases with time estimates)?

