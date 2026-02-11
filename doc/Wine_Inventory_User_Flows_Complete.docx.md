# Wine Inventory Management System

Complete User Flows & Screen-by-Screen Guide

### **Version 2.0 \- Detailed User Flows**

February 2026

# **Table of Contents**

1\. User Roles & Permission Matrix

2\. Admin Workflows

   2.1 Admin Dashboard

   2.2 User Management (Create/Edit/Suspend Users)

   2.3 Wine Catalog Management

   2.4 View Current Stock (Admin Only)

   2.5 History & Audit Trail Verification

   2.6 Manual Image Upload

3\. Staff Workflows

   3.1 Staff Login & Dashboard

   3.2 Start Inventory Count Session

   3.3 Manual Search Flow

   3.4 Barcode Scanning Flow

   3.5 Image Recognition Flow

   3.6 Quantity Entry (Open vs Closed Bottles)

   3.7 Complete Count Session

4\. Wine Variants (Same Name, Different Vintage/Size)

5\. Image Management

   5.1 Missing Image Handling

   5.2 Image Capture During Count

   5.3 Image Storage Architecture

6\. History & Audit System

   6.1 What Gets Logged

   6.2 Admin History Verification

   6.3 Viewing Images in History

7\. All Screen Specifications

8\. Database Schema for User Flows

# **1\. User Roles & Permission Matrix**

The system has two distinct user roles with different capabilities:

| Feature / Capability | Admin | Staff |
| :---- | :---- | :---- |
| **Login to System** | ✓ | ✓ |
| **Perform Inventory Counts** | ✓ | ✓ |
| **Use Manual Search** | ✓ | ✓ |
| **Use Barcode Scanner** | ✓ | ✓ |
| **Use Image Recognition** | ✓ | ✓ |
| **Add Images During Count** | ✓ | ✓ |
| **Track Open/Closed Bottles** | ✓ | ✓ |
| **View Own History** | ✓ | ✓ |
| **— ADMIN ONLY FEATURES —** | — | — |
| **View Current Stock Levels** | ✓ | ✗ |
| **Create New Users** | ✓ | ✗ |
| **Edit/Suspend Users** | ✓ | ✗ |
| **Add/Edit Wine Catalog** | ✓ | ✗ |
| **Upload Wine Images Manually** | ✓ | ✗ |
| **View All Users' History** | ✓ | ✗ |
| **Verify Scan Methods** | ✓ | ✗ |
| **Access Audit Logs** | ✓ | ✗ |
| **Export Reports** | ✓ | ✗ |
| **System Configuration** | ✓ | ✗ |

## **Critical Distinction**

* ADMIN CAN VIEW CURRENT STOCK: Real-time inventory quantities visible  
* STAFF CANNOT view current stock: Prevents bias during counting  
* Admin has complete audit trail: Can see who scanned what, when, and how  
* Staff sees only own activity: Limited to personal count history  
* Images uploaded during counts are logged: Admin can review captured photos  
* All recognition methods tracked: Barcode, Image AI, or Manual search

# **2\. Admin Workflows**

## **2.1 Admin Dashboard**

SCREEN: Admin Dashboard

Header:  
• Welcome, \[Admin Name\]  
• \[Logout\] button  
• Navigation menu (sidebar or top):  
  \- Dashboard  
  \- Current Stock ← ADMIN ONLY  
  \- Inventory Counts  
  \- Wine Catalog  
  \- User Management ← ADMIN ONLY  
  \- History & Audit ← ADMIN ONLY  
  \- Reports  
  \- Settings

Main Content:

Quick Stats Cards:  
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  
│ Total Wines: 247    │  │ Total Value:        │  │ Low Stock: 12       │  
│ Active in Catalog   │  │ $45,230             │  │ ⚠ Needs Attention   │  
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  
│ Active Users: 8     │  │ Last Count:         │  
│ Staff Members       │  │ Feb 8, 3:45 PM      │  
└─────────────────────┘  └─────────────────────┘

Action Buttons:  
\[📋 Start New Count\]  \[📊 View Current Stock\]  \[🍷 Add New Wine\]

Recent Activity (All Users):  
• Sarah M. counted Château Margaux 2015 (12 bottles) \- 2 min ago \[View\]  
• John D. scanned Barolo 2018 via Image AI (8 bottles) \- 15 min ago \[View\]  
• Admin added new wine: Sassicaia 2019 \- 1 hour ago  
• Sarah M. uploaded image for Opus One 2020 \- 2 hours ago \[View Image\]

Alerts:  
⚠ 12 wines below par level \- \[View List\]  
📷 3 wines missing images \- \[Review\]

## **2.2 User Management Flow**

Admin creates, edits, and manages user accounts.

FLOW: Create New User

Step 1: Admin clicks "User Management" → SCREEN: User List

  Table showing all users:

  Name | Email | Role | Status | Last Login | Actions

  Sarah Miller | sarah@rest.com | Staff | Active | 2h ago | \[Edit\] \[Suspend\]

  \[+ Create New User\] button

Step 2: Click \[+ Create New User\] → SCREEN: Create User Form

  Fields:

  • Full Name: \[text\]

  • Email: \[email\]

  • Username: \[text\]

  • Role: \[dropdown: Admin / Staff\] ← Controls permissions

  • Password: \[password with show/hide\]

  • Confirm Password: \[password\]

  • Status: \[toggle: Active / Inactive\]

  \[Cancel\] \[Create User\]

Step 3: Fill form and click \[Create User\]

  System:

  • Validates all fields

  • Hashes password with bcrypt

  • Creates user record

  • LOGS: "Admin created user: sarah@rest.com (Staff role)"

  → Success notification

  → Redirect to User List

FLOW: Edit/Suspend User

Step 1: From User List, click \[Edit\]

  → Pre-filled form with user data

Step 2: Admin can:

  • Change role: Staff → Admin (or vice versa)

  • Toggle Status to Inactive (suspends account)

  • Click \[Reset Password\] to generate temp password

Step 3: Save changes

  System LOGS: "Admin suspended user: john@rest.com"

  If suspended: User cannot login until reactivated

## **2.3 Wine Catalog Management**

FLOW: Add New Wine to Catalog

Step 1: Navigate to Wine Catalog

  → SCREEN: Wine List (table view)

  Columns: Image | Name | Producer | Vintage | Size | Type | Stock | Actions

  \[+ Add New Wine\] button

Step 2: Click \[+ Add New Wine\]

  → SCREEN: Add Wine Form

  BASIC INFORMATION:

  • Wine Name\*: \[text\] e.g., "Château Margaux"

  • Producer\*: \[text\] e.g., "Château Margaux"

  • Vintage: \[number\] e.g., "2015" (optional for NV)

  • Wine Type\*: \[dropdown: Red/White/Rosé/Sparkling/Fortified\]

  • Region: \[text\] e.g., "Bordeaux"

  • Country\*: \[dropdown\] e.g., "France"

  BOTTLE SPECIFICATIONS:

  • Bottle Size\*: \[dropdown: 187ml/375ml/500ml/750ml/1000ml/1500ml/3000ml\]

  • ABV %: \[number\] e.g., "13.5"

  • Grape Varieties: \[text\] e.g., "Cabernet Sauvignon, Merlot"

  INVENTORY & PRICING:

  • SKU: \[text\] Auto-generated option

  • UPC/EAN Barcode: \[text\] e.g., "012345678901"

  • Purchase Price: \[$\] e.g., "$250.00"

  • Selling Price (Bottle)\*: \[$\] e.g., "$450.00"

  • Selling Price (Glass): \[$\] e.g., "$18.00" (optional)

  • Storage Location: \[dropdown\] e.g., "Cellar A \- Rack 3"

  • Par Level: \[number\] e.g., "6" (minimum stock)

  • Reorder Point: \[number\] e.g., "3"

  IMAGES:

  • Wine Label Image: \[file upload or drag-drop\]

    Accepted: JPG, PNG, WebP | Max 5MB

    NOTE: Image is OPTIONAL \- can be added later

    If no image: Placeholder shown, can be added during inventory

  • Additional Images: \[multi-upload\] (optional)

  DESCRIPTION:

  • Tasting Notes: \[textarea\]

  • Food Pairings: \[textarea\]

  \[Cancel\] \[Save Wine\]

Step 3: Fill required fields, optionally upload image

Step 4: Click \[Save Wine\]

  System:

  • Validates required fields

  • Checks for duplicates (same name+producer+vintage+size)

  • If duplicate: Confirmation dialog

    "Similar wine exists: Château Margaux 2015 750ml"

    "Add as separate variant?"

    \[Cancel\] \[Yes, Add Variant\]

  • Creates wine record with unique wine\_id

  • If image uploaded: Processes and stores

  • If no image: sets has\_image \= false

  • LOGS: "Admin added wine: Château Margaux 2015 750ml"

  → Success notification

  → Wine appears in catalog

HANDLING VARIANTS:

Same wine name can exist with:

  • Different vintages: Margaux 2015, Margaux 2014, Margaux 2013

  • Different sizes: Margaux 750ml, Margaux 375ml, Margaux 1500ml

  → Each is separate wine\_id in database

  → All appear in search results

  → Staff selects correct variant during count

## **2.4 View Current Stock (ADMIN ONLY)**

This feature is EXCLUSIVELY for Admin users.

Staff users DO NOT have access \- they cannot see current stock levels.

SCREEN: Current Stock Inventory

Access: Admin clicks "Current Stock" in navigation menu

(This menu item does NOT appear for Staff users)

Header:

• Title: "Current Stock Levels"

• Last Updated: "Real-time as of Feb 9, 2026 2:45 PM"

• Total Stock Value: $45,230.00

• \[Export to Excel\] \[Print Report\]

Filters:

• Search: "Search wine name, producer..."

• Type: \[All | Red | White | Rosé | Sparkling\]

• Status: \[All | In Stock | Low Stock | Out of Stock\]

• Location: \[All | Cellar A | Cellar B | Bar\]

• Sort: \[Name | Stock Level | Value | Last Counted\]

Stock Table (scrollable):

Columns:

Image | Wine | Vintage | Size | Closed | Open | Total | Par | Status | Value | Last Count | Actions

Example Rows:

\[img\] Château Margaux  2015  750ml   10    2    12    6   ✓ In Stock    $5,400   Feb 8 3:45 PM  \[History\]

\[img\] Barolo Riserva   2018  750ml    2    0     2    6   ⚠ Low Stock   $180     Feb 7 2:15 PM  \[History\]

\[img\] Sassicaia        2019  750ml    0    0     0    4   ✗ Out         $0       Feb 5 10:20 AM \[History\]

\[img\] Opus One         2020  750ml   15    1    16    8   ✓ In Stock    $7,200   Feb 8 4:10 PM  \[History\]

Color Coding:

• Green row: Stock \>= Par Level (healthy)

• Yellow row: Stock \< Par Level but \> 0 (low stock)

• Red row: Stock \= 0 (out of stock)

CRITICAL COLUMNS:

• Closed: Full, unopened bottles

• Open: Partial bottles (for by-glass service)

• Total: Closed \+ Open

Why separate Closed vs Open?

  Restaurants track:

  • Closed bottles in cellar storage

  • Open bottles at bar for glass pours

  • Helps identify waste (too many open bottles)

User Actions:

Action 1: Filter by Low Stock

  • Select "Low Stock" filter

  • Table shows only wines below par level

  • Useful for reordering

Action 2: Click \[History\] on any wine

  → Opens History Modal (see Section 2.5)

  → Shows all counts for that wine

Action 3: Export Report

  • Click \[Export to Excel\]

  • Generates XLSX with all current stock

  • Includes: Wine details, quantities, values, dates

  • Downloads immediately

Action 4: Print

  • Click \[Print Report\]

  • Browser print dialog

  • Can print or save as PDF

STAFF RESTRICTION:

✗ Staff users do NOT see "Current Stock" menu

✗ Staff cannot view existing quantities

✗ Prevents bias during counting

✓ Staff only enter what they physically count

## **2.5 History & Audit Trail Verification**

Admin can view COMPLETE history of ALL inventory activities.

SCREEN: History & Audit Log

Access: Admin clicks "History & Audit" in navigation

Filters Section:

• Date Range: \[From: \_\_/\_\_/\_\_\_\_\] \[To: \_\_/\_\_/\_\_\_\_\]

  Default: Last 30 days

• User: \[dropdown: All Users | Select specific user\]

• Wine: \[autocomplete search: All Wines | Specific wine\]

• Recognition Method: \[All | Manual | Barcode | Image AI\]

• Action Type: \[All | Count Entry | Image Upload | Wine Edit\]

• \[Apply Filters\] button

History Table:

Columns:

Timestamp | User | Action | Wine | Method | Quantity | Open/Closed | Confidence | Image | Details

Example Rows:

Feb 9 2:45 PM  Sarah Miller  Count    Château Margaux 2015 750ml  Barcode   12  C:10 O:2   N/A    \[View\]  \[Details\]

Feb 9 2:38 PM  John Davis    Count    Barolo 2018 750ml           Image AI   8  C:8 O:0    92.5%  \[View\]  \[Details\]

Feb 9 2:30 PM  Sarah Miller  Image    Sassicaia 2019 750ml        Manual     —  —          N/A    \[View\]  \[Details\]

               Upload

Feb 9 1:15 PM  Admin         Wine     Opus One 2020 750ml         N/A        —  —          N/A    N/A     \[Details\]

               Created

Admin Actions:

Action 1: Filter by User

  • Select "Sarah Miller" from dropdown

  • Click \[Apply Filters\]

  • Table shows only Sarah's activity

  • Verify: What did Sarah count? When? How?

Action 2: Filter by Recognition Method

  • Select "Image AI"

  • Shows all AI-recognized wines

  • Check confidence scores

  • Identify low-confidence scans for review

Action 3: View Captured Image

  • Click \[View\] in Image column

  → IMAGE VIEWER MODAL:

    • Full-size photo of bottle

    • Metadata:

      \- Captured by: Sarah Miller

      \- Timestamp: Feb 9, 2026 2:38:15 PM

      \- Filename: wine\_20260209\_143802.jpg

      \- Size: 2.3 MB

      \- Dimensions: 1920x1080

    • \[Download\] \[Close\]

  Admin can download for verification

Action 4: View Entry Details

  • Click \[Details\] button

  → DETAILS MODAL:

    COUNT DETAILS:

    • Wine: Barolo Riserva 2018 750ml

    • Count Session: \#SESSION-004

    • User: Sarah Miller (sarah@restaurant.com)

    • Timestamp: Feb 9, 2026 at 2:38:15 PM

    • Device: iPhone 13 Pro

    • IP Address: 192.168.1.45

    RECOGNITION DETAILS:

    • Method: Image AI Recognition

    • Confidence Score: 92.5%

    • Processing Time: 1.23 seconds

    • AI Model: v2.1.0

    • Extracted Text: \["Barolo", "Riserva", "2018", "Giuseppe Rinaldi"\]

    • Matched Wine ID: wine-uuid-xyz

    QUANTITY DETAILS:

    • Total Bottles: 8

    • Closed Bottles: 8

    • Open Bottles: 0

    • Previous Count: 10 bottles (Feb 7\)

    • Variance: \-2 bottles

    ADDITIONAL INFO:

    • User Notes: "Found 2 expired, removed"

    • Image Attached: Yes \[View\]

    • Session Duration: 2h 15m

    \[Export as PDF\] \[Close\]

Action 5: Filter by Specific Wine

  • Type "Château Margaux" in Wine autocomplete

  • Select "Château Margaux 2015 750ml"

  • Table shows all counts for this wine:

    Feb 9: 12 bottles (Sarah)

    Feb 7: 14 bottles (John)

    Feb 5: 15 bottles (Admin)

  • Track consumption pattern over time

Action 6: Export Audit Report

  • After applying filters

  • Click \[Export Report\]

  • Generates Excel with filtered history

  • Includes all metadata

  • For compliance audits

WHAT GETS LOGGED:

✓ Every inventory count entry

✓ Recognition method used (manual/barcode/AI)

✓ AI confidence scores

✓ Images captured during counts

✓ User who performed action

✓ Timestamp of action

✓ Device and IP address

✓ Wine catalog changes

✓ User account changes

✓ Image uploads (manual and during count)

STAFF RESTRICTION:

✗ Staff can only view OWN history

✗ Staff cannot see other users' activity

✓ Staff can review personal count sessions

## **2.6 Manual Image Upload Flow**

Admin can manually add images to wines without performing count.

FLOW: Upload Image to Existing Wine

Step 1: Navigate to Wine Catalog

  → Find wine missing image (placeholder icon shown)

Step 2: Click \[Edit\] on wine row

  → SCREEN: Edit Wine Form

  → Scroll to Images section

Step 3: In Images section

  Current: Wine Label Image: \[No image uploaded\]

  \[Upload Image\] button

Step 4: Click \[Upload Image\]

  → File picker opens

  → Admin selects image from computer

  → Formats: JPG, PNG, WebP | Max 5MB

Step 5: Image preview with crop tool

  → Admin can crop to focus on label

  → \[Cancel\] \[Use This Image\]

Step 6: Click \[Use This Image\]

  → Image uploads to server

  → Processed and optimized

  → Thumbnails generated

Step 7: Click \[Save Changes\] on wine form

  System:

  • Updates wine record with image URL

  • Sets has\_image \= true

  • Stores metadata:

    \- uploaded\_by: Admin

    \- upload\_source: "manual\_upload"

    \- timestamp: current time

  • LOGS: "Admin uploaded image for Sassicaia 2019"

  → Success notification

  → Wine now has image in catalog

# **3\. Staff Workflows**

## **3.1 Staff Login & Dashboard**

SCREEN: Login

• Restaurant logo

• Username/Email: \[input\]

• Password: \[input with show/hide\]

• \[Remember Me\] checkbox

• \[Login\] button

After successful login:

SCREEN: Staff Dashboard

Header:

• "Welcome, Sarah\!"

• \[Profile\] → Logout

Navigation (Bottom tabs):

• \[Home\] \[Count\] \[History\] \[Profile\]

NOTE: NO "Current Stock" or "Admin" tabs

Main Content:

Large Action Button:

\[📋 Start New Inventory Count\]

"Begin counting wine inventory"

Secondary Button:

\[📊 My Recent Counts\]

"View your counting history"

Personal Stats (YOUR stats only):

• Your Counts Today: 3

• Bottles Counted Today: 147

• Last Count: 45 minutes ago

Your Recent Activity (YOUR activity only):

• You counted Château Margaux 2015 (12 bottles) \- 45 min

• You counted Barolo 2018 (8 bottles) \- 1 hour

• You uploaded image for Sassicaia 2019 \- 2 hours

WHAT STAFF CANNOT SEE:

✗ Current stock levels

✗ Other users' activity

✗ Wine catalog management

✗ User management

✗ System-wide statistics

## **3.2 Start Inventory Count Session**

FLOW: Starting a New Count

Step 1: Staff taps \[Start New Inventory Count\]

  → SCREEN: New Count Setup

Form:

• Count Type: \[dropdown\]

  \- Full Inventory (all wines)

  \- Partial Count (specific section)

  \- Spot Check (random verify)

• If Partial: Location \[dropdown: Cellar A/B/Bar\]

• Notes: \[textarea\] "Weekly count" (optional)

• \[Cancel\] \[Start Counting\]

Step 2: Fill form and tap \[Start Counting\]

  System:

  • Generates session ID: \#SESSION-004

  • Creates inventory\_counts record:

    \- user\_id: sarah-uuid

    \- status: "in\_progress"

    \- started\_at: NOW()

  • LOGS: "Sarah Miller started count \#SESSION-004"

  → Redirects to Mode Selection

SCREEN: Inventory Mode Selection

Header:

• "Count Session \#SESSION-004"

• Status: In Progress

• Timer: 00:05:23 (elapsed)

• Progress: 15 of 247 counted

Three Mode Cards:

┌───────────────────────┐

│ 🔍 MANUAL SEARCH      │

│ "Search & Type"       │

│ \~30 sec per wine      │

│ \[Select\]              │

└───────────────────────┘

┌───────────────────────┐

│ 📊 BARCODE SCANNER    │

│ "Scan Barcode"        │

│ \~5 sec per wine       │

│ \[Select\]              │

└───────────────────────┘

┌───────────────────────┐

│ 📷 IMAGE RECOGNITION  │

│ "Photo Label"         │

│ \~10 sec per wine      │

│ \[Select\]              │

└───────────────────────┘

Bottom:

• \[Finish Count\] (red, prominent)

• \[Pause Session\]

Staff can switch modes any time

All entries go to same session

## **3.3 Manual Search Flow**

FLOW: Manual Wine Search

Step 1: Tap \[Select\] on Manual Search

  → SCREEN: Wine Search

Layout:

• Large search input: "Type wine name, producer..."

• Quick filters: \[Red\] \[White\] \[Sparkling\] \[All\]

• Recently Counted section (in this session)

• Search results list

Step 2: Type "Barolo" in search

  → Autocomplete results appear:

┌──────────────────────────────┐

│ \[img\] Barolo Riserva 2018    │

│ Giuseppe Rinaldi             │

│ 750ml | Piedmont | $89       │

│ \[+ Add to Count\]             │

└──────────────────────────────┘

┌──────────────────────────────┐

│ \[img\] Barolo Cannubi 2017    │

│ Luciano Sandrone             │

│ 750ml | Piedmont | $125      │

│ \[+ Add to Count\]             │

└──────────────────────────────┘

┌──────────────────────────────┐

│ \[img\] Barolo Riserva 2018    │

│ Giuseppe Rinaldi             │

│ 375ml (Half) | Piedmont | $48│

│ \[+ Add to Count\]             │

└──────────────────────────────┘

NOTE: All variants shown (different sizes/vintages)

Step 3: Tap \[+ Add to Count\] on desired wine

  → Continues to Quantity Entry (Section 3.6)

## **3.4 Barcode Scanning Flow**

FLOW: Barcode Scanner

Step 1: Tap \[Select\] on Barcode Scanner

  → SCREEN: Camera View (Barcode Mode)

Full-screen camera with:

• Scanning frame overlay (center)

• Animated scanning line

• "Align barcode within frame"

• \[← Back\] \[💡 Flash\]

• \[Manual Entry\] button (if scan fails)

Step 2: Point camera at barcode

  • QuaggaJS processes frames

  • Detects UPC/EAN/Code 128

  • Auto-capture when detected

  • Green flash \+ vibration

Step 3: System processes barcode

  → Loading: "Searching for wine..."

  Backend:

  • Extracts barcode: "012345678901"

  • Query: SELECT \* FROM wines WHERE upc\_ean \= ... Response time: \~100-200ms

Result Scenarios:

A) Wine Found (Single Match):

  → Transitions to Quantity Entry

B) Wine Found (Multiple Variants):

  → SCREEN: Select Variant

    "We found 2 wines with this barcode:"

    ┌────────────────────────┐

    │ Château Margaux 2015   │

    │ 750ml                  │

    │ \[Select This\]          │

    └────────────────────────┘

    ┌────────────────────────┐

    │ Château Margaux 2015   │

    │ 375ml (Half Bottle)    │

    │ \[Select This\]          │

    └────────────────────────┘

  Staff selects correct variant

  → Continues to Quantity Entry

C) Wine Not Found:

  → SCREEN: Not Found

    ❌ "Wine not found"

    Barcode: 012345678901

    \[Try Again\] \[Search Manually\] \[Report Missing\]

  If \[Report Missing\]:

    → Form: Wine Name, Producer

    → Sent to admin for review

Manual Barcode Entry:

  If camera fails:

  • Tap \[Manual Entry\]

  • Numeric keyboard

  • Type barcode digits

  • \[Search\]

  → Same search logic

## **3.5 Image Recognition Flow**

FLOW: Image AI Recognition

Step 1: Tap \[Select\] on Image Recognition

  → SCREEN: Camera View (Photo Mode)

• Guide overlay: Rectangle frame

• "Center wine label in frame"

• Grid lines for alignment

• \[← Back\] \[💡 Flash\]

• Large \[Capture\] button

• Tap-to-focus enabled

Step 2: Position bottle and tap \[Capture\]

  → Photo preview appears

  → \[Retake\] \[Use Photo\]

Step 3: Tap \[Use Photo\]

  → Processing screen:

    🍷 "Analyzing wine label..."

    ✓ Image uploaded

    ⏳ Detecting label...

    ⏳ Reading text...

    ⏳ Matching wine...

  Backend Processing:

  1\. Compress image (JPEG 85%, max 1MB)

  2\. Upload to server

  3\. Google Cloud Vision API:

     • LABEL\_DETECTION

     • TEXT\_DETECTION (OCR)

  4\. Extract text:

     \- Wine: "Barolo"

     \- Producer: "Giuseppe Rinaldi"

     \- Vintage: "2018"

  5\. Custom ML model (TensorFlow):

     \- Visual classification

     \- Top 5 candidates

  6\. Text fuzzy matching

  7\. Combined scoring:

     \- Visual: 45%

     \- Text: 35%

     \- ML: 20%

     → Final: 92.5%

Result Scenarios:

A) High Confidence (≥85%):

  → SCREEN: Wine Found

    ✓ "Wine Identified\!"

    Confidence: 92.5%

    ┌────────────────────────┐

    │ \[img\]                  │

    │ Barolo Riserva 2018    │

    │ Giuseppe Rinaldi       │

    │ 750ml | $89            │

    │ Match: 92.5%           │

    └────────────────────────┘

    \[✓ This is Correct\]

    \[✗ Not Correct\]

  Staff taps \[✓ This is Correct\]

  → Check if wine has image...

B) Medium Confidence (60-84%):

  → SCREEN: Possible Matches

    "Several possible matches:"

    Match 1 (82%):

    \[Wine card\] \[Select\]

    Match 2 (75%):

    \[Wine card\] \[Select\]

    Match 3 (68%):

    \[Wine card\] \[Select\]

    \[None of These\]

    \[Try Again\]

  Staff selects correct match

C) Low Confidence (\<60%):

  → SCREEN: Unable to Identify

    😕 "Could not identify wine"

    Confidence: 45% (too low)

    Suggestions:

    • Better lighting

    • Clearer label view

    • Clean bottle

    \[Retake Photo\]

    \[Search Manually\]

    \[Scan Barcode\]

CRITICAL: Missing Image Handling

(see Section 5.2 for complete flow)

If AI identifies wine BUT wine has no image:

After staff confirms correct:

  → Dialog:

    💾 "Save Photo for This Wine?"

    "This wine doesn't have a photo yet."

    "Save to help identify faster next time?"

    \[No Thanks\]

    \[Yes, Save Photo\] ← Recommended

If \[Yes, Save Photo\]:

  System:

  • Associates captured image with wine

  • Updates wine.image\_url

  • Sets wine.has\_image \= true

  • Stores metadata:

    \- uploaded\_by: Sarah Miller

    \- source: "inventory\_count\_recognition"

    \- session\_id: \#SESSION-004

  • LOGS: "Image added to Barolo 2018 by Sarah Miller"

  → Toast: "Photo saved\!"

If \[No Thanks\]:

  • Image discarded

  • Wine still has no image

  → Continues to Quantity Entry

## **3.6 Quantity Entry (Open vs Closed Bottles)**

SCREEN: Wine Detail & Quantity Entry

Reached from any recognition method

Header:

• \[← Back\]

• Session \#SESSION-004

• Progress: 16/247

Wine Details (top):

┌────────────────────────┐

│ \[Wine image 300x300\]   │

│                        │

│ BAROLO RISERVA 2018    │

│ (large, bold)          │

│                        │

│ Giuseppe Rinaldi       │

│ Piedmont, Italy        │

│ 750ml | Red Wine       │

│ $89.00 per bottle      │

│                        │

│ \[📷 AI \- 92.5%\] badge  │

└────────────────────────┘

Quantity Entry (bottom):

━━━━━━━━━━━━━━━━━━━━━━━━

CLOSED BOTTLES (Full/Unopened)

      \[-\]    8    \[+\]

   Large touch targets

━━━━━━━━━━━━━━━━━━━━━━━━

OPEN BOTTLES (Partial/By Glass)

      \[-\]    2    \[+\]

   "For wines sold by glass"

━━━━━━━━━━━━━━━━━━━━━━━━

TOTAL BOTTLES: 10

(Closed: 8, Open: 2\)

(Large, prominent)

\[+ Add Notes\] (expandable)

  → Textarea: "Notes about condition..."

\[📷 Attach Photo\] (optional)

  → Camera → Attach documentation

Buttons:

\[Cancel\]

\[Confirm & Add to Count\] ← Large, green

User Interaction:

Step 1: Set closed bottles

  • Tap \[+\] eight times → 8

  • Or tap number, keyboard input "8"

Step 2: Set open bottles

  • Tap \[+\] twice → 2

Step 3: Total auto-calculates

  • Shows: TOTAL: 10 (C:8, O:2)

Step 4: (Optional) Add notes

  • Tap \[+ Add Notes\]

  • Type: "2 open bottles at bar"

Step 5: Tap \[Confirm & Add\]

  System:

  • Creates inventory\_items record:

    \- count\_id: \#SESSION-004

    \- wine\_id: wine-uuid

    \- quantity\_closed: 8

    \- quantity\_open: 2

    \- quantity\_total: 10

    \- recognition\_method: "image\_ai"

    \- recognition\_confidence: 92.5

    \- user\_notes: "2 open bottles..."

    \- created\_at: NOW()

  • Updates count session:

    \- total\_items++

    \- total\_bottles \+= 10

  • LOGS:

    "Sarah Miller counted Barolo 2018:",

    "10 bottles (8 closed, 2 open)"

  → Success animation ✓

  → Toast: "Barolo Riserva 2018 added"

  → Returns to Mode Selection

  → Progress: 17/247

WHY SEPARATE CLOSED vs OPEN?

Restaurants track:

• Closed bottles: Cellar storage

• Open bottles: Bar (by-glass service)

Examples:

High-End Wine:

  Château Margaux $450

  Closed: 15, Open: 0

  → Not sold by glass

Popular Pour:

  Meiomi Pinot $32 bottle, $12 glass

  Closed: 8, Open: 3

  → Mix of bottle/glass sales

House Wine:

  Chardonnay $24 bottle, $8 glass

  Closed: 24, Open: 6

  → High by-glass volume

Admin Analysis:

• If open bottles \> 5: Potential waste

• Ratio bottle vs glass sales

• Reorder decisions

## **3.7 Complete Count Session**

FLOW: Finishing Inventory Count

Step 1: Staff finishes counting

  • Returns to Mode Selection

  • Progress: 247/247 (or partial complete)

Step 2: Tap \[Finish Count\]

  → Confirmation dialog:

    "Complete Inventory Count?"

    Session \#SESSION-004

    Counted: 247 wines

    Total bottles: 3,482

    Elapsed: 2h 15m

    \[Cancel\] \[Yes, Complete\]

Step 3: Tap \[Yes, Complete\]

  System:

  • Updates inventory\_counts:

    \- status: "completed"

    \- completed\_at: NOW()

    \- total\_items: 247

    \- total\_bottles: 3,482

    \- duration\_minutes: 135

  • Calculates variance vs previous

  • LOGS: "Sarah Miller completed \#SESSION-004"

  • Notifies admin (email/alert)

  → SCREEN: Completion Summary

    ✓ "Inventory Count Complete\!"

    Summary:

    • Wines Counted: 247

    • Total Bottles: 3,482

    • Closed: 3,298

    • Open: 184

    • Duration: 2h 15m

    • Recognition Methods:

      \- Barcode: 145

      \- Image AI: 78

      \- Manual: 24

    \[View Summary Report\]

    \[Start New Count\]

    \[Return to Dashboard\]

Optional: View Summary

  • Tap \[View Summary Report\]

  → PDF preview with:

    \- All wines counted

    \- Quantities

    \- Variance from previous

    \- Low stock alerts

  → \[Download\] \[Email\] \[Print\]

PAUSE Option:

If staff needs break:

  • Tap \[Pause Session\]

  → "Pause count? Resume later"

  • \[Cancel\] \[Pause\]

  → Updates status: "paused"

  → Dashboard shows: \[Resume Count \#SESSION-004\]

Resume Paused:

  • Tap \[Resume Count\]

  → Returns to Mode Selection

  → Progress restored: 147/247

  → Continue where left off

# **4\. Wine Variants (Same Name, Different Vintage/Size)**

How system handles same wine with different attributes

DATABASE APPROACH:

Each variant \= SEPARATE wine\_id

Example 1: Different Vintages

  wine\_id: uuid-001 | Château Margaux | 2015 | 750ml

  wine\_id: uuid-002 | Château Margaux | 2014 | 750ml

  wine\_id: uuid-003 | Château Margaux | 2013 | 750ml

Example 2: Different Sizes

  wine\_id: uuid-101 | Sassicaia | 2019 | 375ml | $120

  wine\_id: uuid-102 | Sassicaia | 2019 | 750ml | $225

  wine\_id: uuid-103 | Sassicaia | 2019 | 1500ml | $480

MANUAL SEARCH DISPLAY:

User types "Château Margaux"

→ ALL vintages/sizes appear:

┌────────────────────────┐

│ Château Margaux 2015   │

│ 750ml | Bordeaux       │

│ Vintage: 2015 ← Bold   │

│ \[+ Add\]                │

└────────────────────────┘

┌────────────────────────┐

│ Château Margaux 2014   │

│ 750ml | Bordeaux       │

│ Vintage: 2014 ← Bold   │

│ \[+ Add\]                │

└────────────────────────┘

┌────────────────────────┐

│ Château Margaux 2015   │

│ 375ml (Half) | Bordeaux│

│ Size: 375ml ← Bold     │

│ \[+ Add\]                │

└────────────────────────┘

BARCODE BEHAVIOR:

• Usually unique barcode per variant

• Direct match to one wine

• If shared barcode → Variant selection

IMAGE AI BEHAVIOR:

• OCR reads vintage from label

• Attempts size detection

• If multiple matches → Show all

• Staff selects correct one

VARIANT SELECTION SCREEN:

When multiple detected:

SCREEN: Select Wine Variant

  "Multiple variants found"

  "Select the wine you're counting:"

  ┌─────────────────────────┐

  │ Sassicaia 2019          │

  │ 375ml (Half) ← Highlight│

  │ $120                    │

  │ \[Select\]                │

  └─────────────────────────┘

  ┌─────────────────────────┐

  │ Sassicaia 2019          │

  │ 750ml (Standard) ← Highl│

  │ $225                    │

  │ \[Select\]                │

  └─────────────────────────┘

  ┌─────────────────────────┐

  │ Sassicaia 2019          │

  │ 1500ml (Magnum) ← Highli│

  │ $480                    │

  │ \[Select\]                │

  └─────────────────────────┘

  \[None of These\]

Staff visually confirms and selects

INVENTORY REPORTING:

Each variant tracked separately:

  Château Margaux 2015 750ml: 12 bottles

  Château Margaux 2014 750ml: 8 bottles

  Château Margaux 2015 375ml: 6 bottles

Can group by name for total:

  Total Château Margaux: 26 bottles

Value calculated per variant:

  2015 750ml: 12 × $450 \= $5,400

  2014 750ml: 8 × $420 \= $3,360

  2015 375ml: 6 × $240 \= $1,440

  Total: $10,200

# **5\. Image Management**

## **5.1 Missing Image Detection**

How System Identifies Wines Without Images:

1\. Wine Catalog View:

   • Placeholder icon instead of photo

   • Badge: \[📷 No Photo\]

2\. Database Check:

   • wine.image\_url IS NULL

   • wine.has\_image \= false

3\. Admin Dashboard Alert:

   • "3 wines missing images \- \[Review\]"

   • Links to filtered view

4\. During Image Recognition:

   • AI finds wine via text OCR

   • But wine has no image for visual match

   • Lower confidence scores

Why Images Missing:

• Wine added without photo upload

• Imported from old catalog

• Rare wine without available image

• Upload failed during creation

Solution:

→ Admin uploads manually (Section 2.6)

→ Staff captures during count (Section 5.2)

## **5.2 Image Capture During Inventory Count**

COMPLETE FLOW: Saving Image During Count

Scenario: Wine has no image, staff uses AI recognition

Step 1: Staff captures bottle photo

  • AI processes

  • OCR extracts: "Barolo", "Giuseppe Rinaldi", "2018"

  • Text matching finds wine (no visual match)

  • Confidence: 78% (text only)

Step 2: AI returns match

  → SCREEN: Wine Found

    ✓ "Wine Identified\!"

    Barolo Riserva 2018

    Confidence: 78% (Text Match)

    \[Placeholder \- no image\]

    ⚠ "This wine doesn't have a photo yet."

    \[✓ This is Correct\]

    \[✗ Not Correct\]

Step 3: Staff taps \[✓ This is Correct\]

  → DIALOG APPEARS IMMEDIATELY:

    💾 "Save Photo for This Wine?"

    "This wine doesn't have a photo."

    "Save the photo you just took?"

    Benefits:

    ✓ Faster recognition next time

    ✓ Visual confirmation in searches

    ✓ Helps other staff

    \[No Thanks\]

    \[Yes, Save Photo\] ← Highlighted

Step 4A: Tap \[Yes, Save Photo\]

  SYSTEM ACTIONS:

  1\. Image already uploaded (temp storage):

     /temp/recognition/img\_12345.jpg

  2\. Move to permanent storage:

     → /wines/images/barolo-rinaldi-2018.jpg

  3\. Generate optimized versions:

     • Thumbnail: 200x200px

     • Display: 800x800px

     • Original preserved

  4\. Update wine record:

     UPDATE wines SET

       image\_url \= 'https://cdn.../barolo-rinaldi-2018.jpg',

       has\_image \= true

     WHERE wine\_id \= 'uuid-xyz'

  5\. Store metadata:

     INSERT INTO wine\_images (

       wine\_id,

       uploaded\_by\_user\_id, ← Sarah

       upload\_source, ← "inventory\_count\_recognition"

       session\_id, ← \#SESSION-004

       timestamp

     )

  6\. Log action:

     "Image added to Barolo 2018 by Sarah Miller"

  7\. Success notification:

     Toast: "✓ Photo saved\!"

     Haptic feedback

  → Continues to Quantity Entry

  → Wine NOW HAS image

Step 4B: Tap \[No Thanks\]

  • Image stays in temp folder

  • Auto-deleted after 24h

  • Wine still has no image

  • Logs: "User declined image save"

  → Continues to Quantity Entry

FUTURE IMPACT:

Next time this wine counted:

If image WAS saved:

  • Visual matching now possible

  • Confidence increases: 78% → 90%+

  • Manual search shows actual photo

  • Better user experience

If image NOT saved:

  • Same flow repeats

  • Another chance to save

  • Eventually someone will save it

## **5.3 Image Storage Architecture**

STORAGE STRUCTURE (AWS S3 / Google Cloud Storage):

wineventory-images/

  wines/

    originals/          ← Full resolution

    display/            ← 800x800 optimized

    thumbnails/         ← 200x200 thumbs

  temp/

    recognition/        ← AI processing temp

    uploads/            ← Admin temp uploads

  inventory/

    attachments/        ← Count entry photos

FILE NAMING:

  \[wine-name\]-\[vintage\]-\[size\]-\[uuid\].jpg

  chateau-margaux-2015-750ml-a1b2c3.jpg

CDN URLS:

  https://cdn.wineventory.com/wines/display/...

DATABASE SCHEMA:

wines table:

  • image\_url TEXT

  • image\_thumbnail\_url TEXT

  • has\_image BOOLEAN

wine\_images table:

  • id UUID

  • wine\_id UUID → wines(id)

  • image\_url TEXT

  • is\_primary BOOLEAN

  • uploaded\_by\_user\_id UUID

  • upload\_source VARCHAR

    \- "admin\_manual"

    \- "inventory\_count\_recognition"

    \- "bulk\_upload"

  • upload\_timestamp TIMESTAMP

  • session\_id VARCHAR

  • original\_filename TEXT

  • file\_size INTEGER

  • dimensions VARCHAR

PROCESSING PIPELINE:

1\. Upload → Server receives

2\. Validation:

   • Check type (JPEG/PNG/WebP)

   • Check size (max 5MB)

   • Virus scan

3\. EXIF stripping (remove metadata)

4\. Optimization (Sharp library):

   • Resize to max 1920x1920

   • Generate 800x800 display

   • Generate 200x200 thumbnail

   • Convert to WebP \+ JPEG fallback

5\. Upload all versions to storage

6\. Database update

7\. CDN cache invalidation

ACCESS CONTROL:

• Public bucket (for CDN)

• Obscure URLs (security by obscurity)

• Or signed URLs with expiration

BACKUP:

• S3 versioning enabled

• Cross-region replication

• Daily Glacier backup

# **6\. History & Audit System**

## **6.1 What Gets Logged**

AUDIT LOG ENTRIES:

✓ Every inventory count entry

  \- Which wine

  \- Quantity (closed/open/total)

  \- User who counted

  \- Timestamp

  \- Recognition method

  \- AI confidence score (if applicable)

✓ Recognition method details

  \- "manual" \- Manual search

  \- "barcode" \- Barcode scan

  \- "image\_ai" \- Image recognition

✓ Images captured

  \- Photo taken during count

  \- Associated with count entry

  \- Stored with metadata

  \- Link to view in history

✓ Images uploaded

  \- Manual admin upload

  \- During-count save

  \- Source tracked

✓ User actions

  \- Login/logout

  \- Account created/edited

  \- Role changes

✓ Wine catalog changes

  \- Wine added

  \- Wine edited

  \- Image added

✓ Count sessions

  \- Started

  \- Paused

  \- Completed

  \- Cancelled

STORED METADATA:

• User ID and name

• Action type

• Entity type (wine/user/count)

• Entity ID

• Timestamp

• Device info

• IP address

• Session ID

• Details (JSON)

RETENTION:

• Keep 2 years active

• Archive to cold storage

• Purge after 7 years (compliance)

