# UI Components

## Overview

The Wine Inventory Management System uses shadcn/ui as the component library foundation, with custom components for domain-specific features.

---

## Component Architecture

```
src/components/
├── ui/                    # shadcn/ui primitives (49 components)
├── count/                 # Inventory counting components (6)
├── AppLayout.tsx         # Main layout wrapper
├── AppSidebar.tsx        # Navigation sidebar
├── MobileBottomNav.tsx   # Mobile navigation tabs
├── DataTable.tsx         # Reusable data table
├── FilterManager.tsx     # Filter controls
├── ColumnManager.tsx     # Column visibility
└── ...                   # Other shared components
```

---

## Layout Components

### AppLayout

**File:** `src/components/AppLayout.tsx`

Root layout component that wraps all authenticated pages.

```tsx
<AppLayout>
  <AppSidebar />
  <main className="flex-1 overflow-auto">
    <Outlet />
  </main>
  <MobileBottomNav /> {/* Mobile only */}
</AppLayout>
```

### AppSidebar

**File:** `src/components/AppSidebar.tsx`

Desktop navigation sidebar with collapsible sections.

Structure:
- Logo/brand
- Navigation links (role-aware)
- User menu
- Theme toggle

Navigation items:
| Icon | Label | Route | Access |
|------|-------|-------|--------|
| 📊 | Dashboard | `/dashboard` | All |
| 🍷 | Wine Catalog | `/catalog` | All |
| 📋 | Inventory Count | `/count` | All |
| 📦 | Current Stock | `/stock` | Admin |
| 📜 | History | `/history` | All |
| 📄 | Sessions | `/sessions` | Admin |
| 👥 | Users | `/users` | Admin |
| 📈 | Reports | `/reports` | Admin |
| ⚙️ | Settings | `/settings` | Admin |

### MobileBottomNav

**File:** `src/components/MobileBottomNav.tsx`

Bottom tab navigation for mobile devices.

Tabs:
- Home → Dashboard
- Count → Inventory Count
- History → Inventory History
- Profile → User Profile

---

## Inventory Count Components

### CameraScanner

**File:** `src/components/count/CameraScanner.tsx`  
**Size:** 11,864 bytes

Full-screen camera interface for barcode/image scanning.

Features:
- Camera stream display
- Barcode detection overlay
- Capture button
- Flash toggle
- Camera switch (front/back)
- Cancel/close button

Props:
```typescript
interface CameraScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onImageCaptured: (image: File) => void;
  onClose: () => void;
  mode: 'barcode' | 'image';
}
```

### ManualSearchSheet

**File:** `src/components/count/ManualSearchSheet.tsx`

Bottom sheet for manual wine search.

Features:
- Search input with debounce
- Filtered wine list
- Wine card with image/details
- Select to add to count

### QuantityPopup

**File:** `src/components/count/QuantityPopup.tsx`  
**Size:** 11,384 bytes

Modal dialog for entering bottle quantities.

Fields:
- Wine display (name, vintage, image)
- Closed bottles (number input)
- Open bottles (number input)
- Notes (optional text)
- Location selection

Key features:
- +/- buttons for quick adjust
- Numeric keypad on mobile
- Validation (no negative values)
- Save/Cancel actions

### CountSetup

**File:** `src/components/count/CountSetup.tsx`

Initial setup for new count session.

Options:
- Count scope (all/location/category)
- Location filter
- Wine type filter
- Session name

### ScanProgressDialog

**File:** `src/components/count/ScanProgressDialog.tsx`

Progress indicator during AI processing.

States:
- Uploading image
- Processing with AI
- Matching to catalog
- Complete/Error

### SessionSummary

**File:** `src/components/count/SessionSummary.tsx`

Session completion summary view.

Displays:
- Total wines counted
- Variances found
- Session duration
- Item-by-item breakdown
- Complete/Cancel actions

---

## Data Display Components

### DataTable

**File:** `src/components/DataTable.tsx`  
**Size:** 6,933 bytes

Reusable table component with advanced features.

Features:
- Server-side pagination
- Column sorting
- Column visibility toggle
- Row selection
- Bulk actions
- Custom cell renderers
- Loading/empty states

Props:
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (rows: T[]) => void;
}
```

### ColumnManager

**File:** `src/components/ColumnManager.tsx`

Dropdown to toggle column visibility.

Integration:
- Uses `columnStore` for persistence
- Per-table column preferences
- Drag-and-drop reordering (future)

### FilterManager

**File:** `src/components/FilterManager.tsx`

Filter panel for data tables.

Filter types:
- Text search
- Select dropdown
- Multi-select
- Date range
- Number range

### MultiSelectFilter

**File:** `src/components/MultiSelectFilter.tsx`

Multi-value filter with checkboxes.

Features:
- Search within options
- Select all/none
- Tag display for selected
- Clear button

---

## Form Components

### UserFormDialog

**File:** `src/components/UserFormDialog.tsx`  
**Size:** 7,243 bytes

Modal form for creating/editing users.

Fields:
- Email (required)
- First name
- Last name
- Display name
- Phone
- Role (Admin/Staff)
- Active status

Validation:
- Email format
- Required fields
- Unique email check

### CollapsibleSection

**File:** `src/components/CollapsibleSection.tsx`

Expandable form section.

Props:
```typescript
interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
```

---

## UI Primitives (shadcn/ui)

**Location:** `src/components/ui/`

49 components from shadcn/ui:

### Core Components
- `button` - Standard button with variants
- `input` - Text input field
- `textarea` - Multi-line text input
- `select` - Dropdown select
- `checkbox` - Checkbox input
- `radio-group` - Radio button group
- `switch` - Toggle switch

### Layout
- `card` - Content card container
- `separator` - Horizontal/vertical divider
- `sheet` - Slide-out panel
- `dialog` - Modal dialog
- `drawer` - Drawer component
- `tabs` - Tab navigation
- `accordion` - Collapsible sections
- `collapsible` - Single collapsible

### Navigation
- `navigation-menu` - Dropdown nav
- `breadcrumb` - Breadcrumb trail
- `pagination` - Page navigation
- `sidebar` - Sidebar navigation

### Feedback
- `toast` - Toast notifications
- `sonner` - Alternative toasts
- `alert` - Alert messages
- `progress` - Progress bar
- `skeleton` - Loading skeleton
- `spinner` - Loading spinner

### Data Display
- `table` - Data table
- `badge` - Status badges
- `avatar` - User avatar
- `tooltip` - Hover tooltips

### Form
- `form` - Form wrapper (react-hook-form)
- `label` - Form label
- `calendar` - Date picker calendar
- `popover` - Floating popover
- `command` - Command palette
- `combobox` - Searchable select
- `date-picker` - Date picker

### Typography
- `typography` - Text styles

---

## Theme System

### ThemeToggle

**File:** `src/components/ThemeToggle.tsx`

Dark/light mode toggle button.

Uses `themeStore` (Zustand) to persist preference.

```tsx
const { theme, setTheme } = useThemeStore();

<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```

### CSS Variables

Theme colors defined in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... */
}
```

---

## Responsive Design

### Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile-first Patterns

```tsx
// Sidebar visible on desktop only
<div className="hidden lg:flex">
  <AppSidebar />
</div>

// Bottom nav visible on mobile only
<div className="lg:hidden">
  <MobileBottomNav />
</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* cards */}
</div>
```
