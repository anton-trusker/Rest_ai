# User Flows

## Overview

This document describes the key user journeys for both Admin and Staff roles.

---

## Role Permissions Matrix

| Feature | Admin | Staff |
|---------|:-----:|:-----:|
| Login | ✓ | ✓ |
| Dashboard | ✓ | ✓ |
| View wine catalog | ✓ | ✓ |
| Add/Edit wines | ✓ | ✗ |
| Perform inventory count | ✓ | ✓ |
| View current stock | ✓ | ✗ |
| View all history | ✓ | ✗ |
| View own history | ✓ | ✓ |
| Manage users | ✓ | ✗ |
| Approve sessions | ✓ | ✗ |
| Generate reports | ✓ | ✗ |
| Configure settings | ✓ | ✗ |

> **Important:** Staff cannot view current stock levels to prevent counting bias.

---

## 1. Authentication Flow

```mermaid
flowchart TD
    A[User visits app] --> B{Has session?}
    B -->|No| C[Login page]
    B -->|Yes| D[Dashboard]
    C --> E[Enter credentials]
    E --> F{Valid?}
    F -->|No| G[Show error]
    G --> E
    F -->|Yes| H[Create session]
    H --> I{Get user role}
    I --> J[Store in authStore]
    J --> D
```

### Login Steps

1. User navigates to `/login`
2. Enter email and password
3. Click "Sign In"
4. System validates credentials via Supabase Auth
5. On success: redirect to `/dashboard`
6. On failure: display error message

---

## 2. Inventory Count Flow

### 2.1 Start Session

```mermaid
flowchart TD
    A[Staff clicks 'Start Count'] --> B[Count setup screen]
    B --> C{Select scope}
    C -->|All wines| D[Create session]
    C -->|By location| E[Select location]
    C -->|By category| F[Select category]
    E --> D
    F --> D
    D --> G[Session: draft → in_progress]
    G --> H[Counting interface]
```

### 2.2 Count Wine (Barcode)

```mermaid
flowchart TD
    A[User taps 'Scan Barcode'] --> B[Camera opens]
    B --> C[Point at barcode]
    C --> D{Barcode detected?}
    D -->|Yes| E[Lookup in database]
    D -->|No| C
    E --> F{Wine found?}
    F -->|Yes| G[Show wine details]
    F -->|No| H[Not found message]
    G --> I[Enter quantity]
    H --> J{Add to catalog?}
    J -->|Yes| K[Add wine form]
    J -->|No| L[Manual search]
    I --> M[Save count]
    M --> N[Add more or finish]
```

### 2.3 Count Wine (AI Image)

```mermaid
flowchart TD
    A[User taps 'Scan Label'] --> B[Camera opens]
    B --> C[Capture photo]
    C --> D[Send to AI]
    D --> E{AI processing}
    E --> F{Match found?}
    F -->|High confidence| G[Show match]
    F -->|Low confidence| H[Confirm match]
    F -->|No match| I[Manual search]
    G --> J[Enter quantity]
    H --> K{User confirms?}
    K -->|Yes| J
    K -->|No| I
    I --> J
    J --> L[Save count]
```

### 2.4 Complete Session

```mermaid
flowchart TD
    A[User clicks 'Finish Count'] --> B[Show summary]
    B --> C{Review items}
    C --> D{Variances found?}
    D -->|Yes| E[Highlight variances]
    D -->|No| F[All matches]
    E --> G{User confirms?}
    F --> G
    G -->|Yes| H[Complete session]
    G -->|No| I[Continue counting]
    H --> J[Update stock levels]
    J --> K[Create audit records]
    K --> L[Show completion message]
```

---

## 3. Admin Wine Management

### 3.1 Add New Wine

1. Admin navigates to `/catalog`
2. Clicks "Add Wine" button
3. Fills wine form (multiple sections)
4. Optionally uploads label image
5. Clicks "Save"
6. System validates and creates wine
7. Redirects to wine detail page

### 3.2 Edit Wine

1. Admin navigates to `/catalog/:id`
2. Clicks "Edit" button
3. Modifies fields
4. Clicks "Save"
5. System updates wine record
6. Shows success message

### 3.3 Import Wines

1. Admin navigates to `/catalog/import`
2. Uploads CSV/Excel file
3. Maps columns to fields
4. Reviews preview
5. Clicks "Import"
6. System bulk inserts/updates
7. Shows import report

---

## 4. Admin Session Review

```mermaid
flowchart TD
    A[Admin views /sessions] --> B[Session list]
    B --> C[Filter by status/date/user]
    C --> D[Select session]
    D --> E[View session details]
    E --> F[Review count items]
    F --> G{Approve or flag?}
    G -->|Approve| H[Mark approved]
    G -->|Flag| I[Add flag reason]
    H --> J[Session finalized]
    I --> K[Session flagged for review]
```

---

## 5. Admin User Management

### 5.1 Create User

1. Admin navigates to `/users`
2. Clicks "Add User"
3. Fills form (email, name, role)
4. Clicks "Create"
5. System creates user via Supabase Auth
6. Creates profile record
7. Assigns role

### 5.2 Edit User Role

1. Admin opens user edit dialog
2. Changes role dropdown
3. Clicks "Save"
4. System updates `user_roles` table
5. User permissions update immediately

### 5.3 Deactivate User

1. Admin opens user edit dialog
2. Toggles "Active" off
3. Clicks "Save"
4. User can no longer login

---

## 6. View History

### Admin View

```mermaid
flowchart TD
    A[Admin views /history] --> B[All user activity]
    B --> C[Apply filters]
    C --> D[Filter by user]
    C --> E[Filter by date]
    C --> F[Filter by wine]
    C --> G[Filter by method]
    D --> H[View filtered results]
    E --> H
    F --> H
    G --> H
    H --> I[Click entry for details]
    I --> J[View full audit record]
```

### Staff View

```mermaid
flowchart TD
    A[Staff views /history] --> B[Own activity only]
    B --> C[Apply filters]
    C --> D[Date range]
    C --> E[Wine filter]
    D --> F[View filtered results]
    E --> F
```

---

## 7. Dashboard Experience

### Admin Dashboard

```
┌────────────────────────────────────────────────────────┐
│  Welcome, Admin                                   [☾]   │
├────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 247      │ │ $45,230  │ │ 12       │ │ 8        │  │
│  │ Wines    │ │ Value    │ │ Low Stock│ │ Users    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
│  Quick Actions:                                        │
│  [Start Count]  [View Stock]  [Add Wine]              │
│                                                        │
│  Recent Activity (All Users):                          │
│  • Sarah counted Margaux 2015 (12) - 5 min ago        │
│  • John scanned Barolo 2018 via AI (8) - 15 min       │
│  • Admin added Sassicaia 2019 - 1 hour ago            │
│                                                        │
│  Alerts:                                               │
│  ⚠ 12 wines below par level                           │
│  📷 3 wines missing images                             │
└────────────────────────────────────────────────────────┘
```

### Staff Dashboard

```
┌────────────────────────────────────────────────────────┐
│  Welcome, Sarah                                  [☾]   │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │           [📋 Start New Inventory Count]          │ │
│  │              Begin counting wine inventory        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Your Stats Today:                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ 3        │ │ 147      │ │ 45 min   │              │
│  │ Counts   │ │ Bottles  │ │ Last     │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                        │
│  Your Recent Activity:                                 │
│  • You counted Margaux 2015 (12) - 45 min ago         │
│  • You counted Barolo 2018 (8) - 1 hour ago           │
│  • You uploaded image for Sassicaia - 2 hours ago     │
└────────────────────────────────────────────────────────┘
```

---

## 8. Mobile Experience

### Bottom Navigation

```
┌────────────────────────────────────────────────────────┐
│                      [App Content]                     │
│                                                        │
│                                                        │
│                                                        │
├────────────────────────────────────────────────────────┤
│    🏠        📋        📜        👤                    │
│   Home     Count    History   Profile                  │
└────────────────────────────────────────────────────────┘
```

### Mobile Count Flow

1. Tap "Count" tab
2. Tap "Start New Count"
3. Camera opens full screen
4. Scan barcode or capture image
5. Quantity popup appears
6. Enter counts with +/- buttons
7. Tap "Save" to record
8. Continue or tap "Finish"

---

## 9. Error Handling Flows

### Network Error

```mermaid
flowchart TD
    A[User action] --> B{Network available?}
    B -->|No| C[Show offline warning]
    B -->|Yes| D[Proceed with action]
    C --> E{Critical action?}
    E -->|Yes| F[Block with error]
    E -->|No| G[Queue for later]
    G --> H[Show pending indicator]
```

### Session Conflict

```mermaid
flowchart TD
    A[User tries to start count] --> B{Active session exists?}
    B -->|Yes| C[Show warning dialog]
    B -->|No| D[Create new session]
    C --> E{Continue or switch?}
    E -->|Continue| F[Resume existing]
    E -->|New| G[Close existing]
    G --> D
```
