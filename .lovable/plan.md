

# Detailed Roles & Permissions Management

## Overview
Expand the permission system from a single permission level per module to granular sub-actions within each module. Instead of just "Catalog: Edit", admins can control specific capabilities like "Catalog: Add Wine", "Catalog: Delete Wine", "Catalog: Edit Pricing", etc.

## What Changes

### New Permission Structure
Each module will have specific actions that can be individually toggled. The permission matrix will show modules as collapsible groups, with sub-actions listed underneath.

**Module breakdown:**

- **Dashboard** -- View analytics, View stock alerts, Export reports
- **Wine Catalog** -- View wines, Add/edit wines, Delete wines, Edit pricing, Manage categories
- **Inventory (Current Stock)** -- View stock levels, Adjust stock, Transfer between locations, View cost/value
- **Inventory Count** -- Start count session, Perform count, Edit counted quantities, Submit count
- **Session Review** -- View sessions, Approve/reject sessions, Reopen sessions, Delete sessions
- **History & Audit** -- View history logs, Export history
- **Reports** -- View reports, Export reports, View financial data
- **Settings** -- View settings, Edit general settings, Manage locations, Manage volumes/glasses
- **User Management** -- View users, Create/edit users, Delete users, Assign roles

Each sub-action remains a simple `none | view | edit | full` radio, keeping the existing pattern but applied at a finer level.

## Technical Details

### 1. Update `referenceData.ts`
- Expand `ModuleKey` to include sub-module keys (e.g., `catalog.add`, `catalog.delete`, `catalog.pricing`)
- Or introduce a new `SubPermission` type with a `moduleSubActions` config that maps each `ModuleKey` to an array of named sub-actions
- Update `ALL_MODULES` to include a `subActions` array per module
- Update default roles with the new granular permissions

### 2. Update `AppRole` interface
- Change `permissions` from `Record<ModuleKey, PermissionLevel>` to `Record<string, PermissionLevel>` where the key is `module.action` (e.g., `"catalog.add"`)
- Or keep a nested structure: `Record<ModuleKey, Record<string, PermissionLevel>>`

### 3. Update `RolesPermissions.tsx` UI
- Render modules as collapsible group headers in the permission table
- Each module row expands to show its sub-actions indented underneath
- Add "Select All" toggle per module to quickly set all sub-actions to the same level
- Add a module-level summary showing how many sub-actions are enabled

### 4. Update `authStore.ts`
- Update `hasPermission` and `useHasPermission` to accept both module-level and sub-action-level checks (e.g., `hasPermission('catalog', 'view')` checks the module, `hasPermission('catalog.delete', 'full')` checks a specific action)
- Maintain backward compatibility so existing permission checks still work

### 5. Update `settingsStore.ts`
- Update `setRolePermission` to handle the new granular keys
- Add a `setModulePermissions` helper to bulk-set all sub-actions for a module

### 6. Update consuming components
- Review pages that call `useHasPermission` and update them to use more specific sub-action keys where relevant (e.g., hiding the "Delete" button based on `catalog.delete` instead of just `catalog: edit`)

## UI Design
The permission table will look like:

```text
Module / Action           None  View  Edit  Full
--------------------------------------------------
v Dashboard               [select all row]
    View analytics          o    (o)    o     o
    View stock alerts       o    (o)    o     o
    Export reports           o     o     o    (o)
v Wine Catalog             [select all row]
    View wines              o    (o)    o     o
    Add / edit wines         o     o    (o)    o
    Delete wines             o     o     o    (o)
    Edit pricing             o     o    (o)    o
    ...
```

Each module header is clickable to expand/collapse its sub-actions, with a colored indicator showing the overall access level for that module.

