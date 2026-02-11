# 06 — Settings & Configuration Module

## 6.1. Overview
The **Settings Module** is the administrative control center of the application. It defines the business environment, manages external integrations, governs user access, and toggles platform-wide feature flags.

### 6.1.1. Business Objectives
- **Governance**: Define strict rules for how inventory is counted, reviewed, and synchronized.
- **Connectivity**: Manage the vital bi-directional link between the platform and Syrve (iiko).
- **Identity**: Personalize the application with business branding and essential contact information.
- **Customization**: Tailor measurements, units, and UI behavior to specific operational needs.

---

## 6.2. Configuration Pages & Detailed Logic

### 6.2.1. Business Profile & Identity
- **Purpose**: Manage the core identity and localization of the business.
- **Business Identity**:
    - **App Logo**: Admin can upload a custom logo image or use the **Business Name** as a text-based logo.
    - **Branding**: Option to set primary brand colors for the mobile interface.
- **Business Information**:
    - **Legal Details**: Full business name, tax ID, and legal address.
    - **Contact Details**: Primary email, phone number, and point of contact (used for future automated order requests to suppliers).
- **Localization**:
    - **Currency**: Select base currency (USD, EUR, etc.) for all financial valuations.
    - **Language**: Select system language (English, etc.) for the UI.

### 6.2.2. Integration Management (Syrve/iiko)
- **Purpose**: Configure the deep integration with the POS system.
- **Detailed Syrve Logic**:
    - **Connection Setup**: Server URL, API Login, and Encrypted Password.
    - **Mapping**: Select specific `Organization` and `Store` from the retrieved Syrve list.
    - **Inventory Workflow Configuration**:
        - **Approval Required**: Toggle (`ON/OFF`). If `ON`, inventory counts *must* be reviewed and approved by an Admin before they can be sent to Syrve.
        - **Auto-Sync Mode**: If `OFF`, counts stay in the app until an Admin manually clicks "Push to Syrve".
        - **Variance Thresholds**: Configure percentage-based alerts (e.g., flag any item with >5% variance for manual review).
    - **Bi-directional Sync**:
        - **Pull**: Catalog, groups, and current stock levels from Syrve.
        - **Push**: Approved inventory documents (Incoming Inventory/Stock Adjustment) to Syrve.

### 6.2.3. Measurements & Measurement Logic
- **Purpose**: Standardize how liquids are measured and entered across the app.
- **Display Units**: Global toggle to show inventory in **Litres (L)** or **Millilitres (ml)**.
- **Glass Dimensions & Volume Logic**:
    - **Standard Dimensions**: Admin defines global glass sizes (e.g., 150ml, 175ml, 250ml).
    - **Category-Specific Overrides**:
        - **Wines**: Default glass sizes (e.g., 150/200/250).
        - **Spirits**: Custom dimensions for shots (e.g., 20ml, 40ml, 50ml).
        - **Fortified/Port Wines**: Specialized sizes (e.g., 75ml, 100ml, 125ml).
- **Volume Options**: Configure standard bottle sizes (Split 187ml, Standard 750ml, Magnum 1.5L) available in the catalog.

### 6.2.4. AI & Identification Configuration
- **Purpose**: Control the behavior of AI label recognition.
- **API Key Management**:
    - **Provider Choice**: OpenAI or Google Gemini.
    - **Key Selection**: Use the **System Default Key** or provide a **Custom Business Key** (Google Gemini/OpenAI).
- **Confidence Settings**: Set the threshold for AI "High Confidence" matches.

---

## 6.3. User Management & Granular RBAC

### 6.3.1. Role & Permission Management
The system implements a strict "If no access, no UI" policy.
- **Role Creation**: Admins can create custom roles beyond the defaults.
- **Granular Permissions**: For every module (Catalog, Inventory, Settings), set access levels: `None`, `View`, `Edit`, `Full`.
- **UI Hiding Logic**:
    - **Menu Items**: If a user lacks `View` access to a module (e.g., "Reports"), the menu item is completely hidden.
    - **Actions/Buttons**: If a user has `View` but not `Edit`, action buttons (e.g., "Add Product", "Sync to Syrve") are removed from the UI.
    - **Protected Routes**: Hard redirects to `/unauthorized` if a user attempts to access a URL they don't have permission for.

### 6.3.2. User Status & Access Control
- **Active/Inactive**: Immediate revocation of session tokens when a user is deactivated.
- **Access Logs**: View which users accessed sensitive reports or changed integration settings.

---

## 6.4. Location Management
- **Purpose**: Map physical storage to digital inventory.
- **Detailed Hierarchy**:
    - **Top Level**: Primary zones (e.g., "Main Cellar", "Front Bar").
    - **Sub-Locations**: Granular mapping (e.g., "Rack A", "Fridge 1", "Shelf 4").
- **Logic**: Items can be restricted to specific locations to prevent cross-location counting errors.

---

## 6.5. Technical Implementation Details
- **Data Persistence**: Settings are stored in the `business_profile` and `syrve_config` tables.
- **Real-time Updates**: Changes to feature flags or permissions are pushed to active sessions via Supabase Realtime to ensure immediate UI updates.
- **Encryption**: All external API keys and passwords are encrypted using `pgsodium` before storage.
