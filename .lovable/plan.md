

# Improvements: Quantity Popup, Location Hierarchy, and Role-Based Access Control

## 1. QuantityPopup -- Editable Number via Keyboard

**Current:** The counter shows a `<span>` with the number; users can only use +/- buttons.

**Change:** Replace the `<span>` in `BottleCounter` with a clickable number that becomes an `<input type="number">` on click (or tap). Users can type a value directly, then blur or press Enter to confirm.

**Also:** Remove the manual litres `<Input>` field from `PartialBottleRow` -- keep only the glass dimension buttons for quick selection. The user picks a glass size to set the partial amount.

**Also:** Add the wine's label image (if available) in the popup header alongside the wine name/producer.

**Also:** Add a location selector in the popup so the user can tag which location the wine is being counted at.

**File:** `src/components/count/QuantityPopup.tsx`

---

## 2. Hierarchical Location System in General Settings

**Current:** Locations are flat: just a name and type (cellar/bar/storage). No sub-locations.

**Change:** Add a `subLocations` array to `LocationConfig`. Each sub-location has an `id` and `name` (e.g., "Shelf 1", "Rack 3"). In General Settings, each location card expands to show and manage its sub-locations.

A wine's location becomes `locationId` + optional `subLocationId` referencing this hierarchy (e.g., "Cellar A" > "Shelf 2").

**Files:**
- `src/data/referenceData.ts` -- update `LocationConfig` interface to include `subLocations: SubLocation[]`
- `src/stores/settingsStore.ts` -- add `addSubLocation(locationId, subLoc)` and `removeSubLocation(locationId, subLocId)` actions
- `src/pages/GeneralSettings.tsx` -- show sub-locations under each location with add/remove UI

---

## 3. Custom Roles and Granular Permissions

**Current:** Only two hardcoded roles: `admin` and `staff`. Access is checked with `user?.role !== 'admin'`.

**Change:** Create a configurable roles and permissions system:

### Data Model
- New interface `AppRole` with `id`, `name`, `color`, and a `permissions` object
- Permissions are a map of module keys to access levels:

```text
Module keys: dashboard, catalog, stock, count, history, sessions, reports, settings, users
Access levels: none, view, edit, full
```

- `none` = no access (hidden from nav)
- `view` = read-only access
- `edit` = can create/modify data
- `full` = all actions including delete/approve

### Default Roles
- **Admin** -- full access to everything
- **Staff** -- view+edit on count/history, view on catalog, none on settings/users/sessions

### Admin Configuration
- New section in General Settings (or a dedicated "Roles & Permissions" page linked from Settings hub) where admin can:
  - Create custom roles (e.g., "Sommelier", "Bar Manager", "Auditor")
  - Set per-module permission levels via a grid of dropdowns/toggles
  - Delete custom roles (cannot delete Admin)

### Integration
- `settingsStore.ts` -- add `roles` array and CRUD actions
- `authStore.ts` -- user gets a `roleId` instead of a hardcoded string; add a helper `hasPermission(module, level)` that checks the role's permissions
- `UserFormDialog.tsx` -- role dropdown populated from the settings store's roles list
- Navigation (`AppSidebar.tsx`, `MobileBottomNav.tsx`) -- filter nav items based on user's permissions (hide modules with `none` access)
- Page guards -- each page checks `hasPermission` instead of `role !== 'admin'`

**Files:**
- `src/data/referenceData.ts` -- add `AppRole` interface and `defaultRoles`
- `src/stores/settingsStore.ts` -- add roles state and CRUD
- `src/stores/authStore.ts` -- update user model, add `hasPermission` helper
- `src/pages/RolesPermissions.tsx` -- new page for managing roles with a permission matrix grid
- `src/pages/AppSettings.tsx` -- add link to Roles & Permissions page
- `src/App.tsx` -- add route `/settings/roles`
- `src/components/AppSidebar.tsx` -- filter nav by permissions
- `src/components/MobileBottomNav.tsx` -- filter nav by permissions
- `src/components/UserFormDialog.tsx` -- use dynamic roles list
- All protected pages -- replace `role !== 'admin'` checks with `hasPermission()`

---

## Technical Details

### QuantityPopup Changes
- `BottleCounter`: replace `<span>` with a component that renders as text by default, switches to `<input>` on click, and commits on blur/Enter
- `PartialBottleRow`: remove the `<Input type="number">` field; keep only glass dimension buttons
- Add wine image thumbnail (48x48) in the header if `wine.imageUrl` exists
- Add a `Select` for location (populated from `settingsStore.locations`) with optional sub-location

### Location Hierarchy
- `SubLocation` interface: `{ id: string; name: string }`
- `LocationConfig` gets `subLocations: SubLocation[]` (default `[]`)
- Default data updated: e.g., Cellar A gets sub-locations ["Rack 1", "Rack 2", "Shelf 1"]
- Settings UI: each location row becomes expandable (collapsible) showing sub-locations with add/delete

### Roles & Permissions
- Permission matrix UI: rows = modules, columns = access levels (none/view/edit/full) as radio buttons
- Each role card shows name, color badge, and permission summary
- Cannot delete the built-in Admin role
- When a role is deleted, users with that role should be flagged (but this is a future DB concern)

