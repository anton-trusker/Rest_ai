# 03 — UI/UX Specifications

## Design Philosophy: "Speed & Accuracy"

The Inventory Management System is primarily used in high-intensity hospitality and retail environments. The UI must prioritize:
1.  **Thumb-Friendly Interactions**: Large touch targets for mobile users.
2.  **High Contrast**: Legibility in dim lighting (e.g., cellars, bars).
3.  **Minimal Clicks**: Fast-path for scanning and quantity entry.
4.  **Information Density**: Professional-grade tables for administrative tasks.

---

## 1. Global UI Standards

### Color Palette
- **Primary**: Indigo/Blue (System actions, navigation)
- **Success**: Green (In stock, sync successful)
- **Warning**: Yellow/Amber (Low stock, pending review)
- **Danger**: Red (Out of stock, sync failed, critical variance)
- **Background**: Neutral Gray/White (Light Mode) or Deep Navy/Black (Dark Mode)

### Typography
- **Headings**: Inter / Sans-serif (Bold)
- **Body**: Inter / Sans-serif (Regular)
- **Monospace**: JetBrains Mono (SKUs, Barcodes, API logs)

### Components
- **Drawers**: Use bottom-sheet drawers for mobile actions (e.g., Quantity Entry).
- **Modals**: Use centered dialogs for desktop administrative tasks.
- **Toasts**: Non-intrusive feedback for background actions (e.g., "Syncing...").

---

## 2. Core Page Mockups (Wireframes)

### A. Mobile Counting Interface (`/count`)
*Optimized for one-handed operation.*

```
┌──────────────────────────────────────┐
│ [≡]      Inventory Count         [👤] │
├──────────────────────────────────────┤
│ Session: INV-2024-012                │
│ Location: Main Bar                   │
├──────────────────────────────────────┤
│                                      │
│  [       SCAN BARCODE / PHOTO     ]  │
│  [           (Camera View)        ]  │
│                                      │
├──────────────────────────────────────┤
│ Recent Counts:                       │
│ ------------------------------------ │
│ ● Heineken 0.33l      | 24 шт  | 2m  │
│ ● Coca-Cola 0.5l      | 12 шт  | 5m  │
│ ● Absolut Vodka 1l    | 3 бут  | 8m  │
├──────────────────────────────────────┤
│ [ 🔍 Search ]         [ 🏁 Finish ]  │
└──────────────────────────────────────┘
```

### B. Quantity Entry Drawer (Mobile)
*Appears after scan or search.*

```
┌──────────────────────────────────────┐
│ 📦 Heineken 0.33l                    │
│ SKU: B-102 | Unit: шт (piece)        │
├──────────────────────────────────────┤
│                                      │
│      [ - ]      [ 24 ]      [ + ]    │
│                                      │
├──────────────────────────────────────┤
│ Location: [ Main Bar           [v] ] │
│ Note:     [ Add note...            ] │
├──────────────────────────────────────┤
│ [ Cancel ]        [ Confirm Count ]  │
└──────────────────────────────────────┘
```

### C. Admin "Super Table" (Desktop - `/catalog`)
*Advanced data management interface.*

```
┌──────────────────────────────────────────────────────────────┐
│ Product Catalog                          [ 🔄 Sync from Syrve ] │
├──────────────────────────────────────────────────────────────┤
│ [ Search Name/SKU... ] [ Category: All [v] ] [ Stock: All [v] ] │
├──────────────────────────────────────────────────────────────┤
│ SKU   | Name            | Category | Stock | Par | Unit | Val  │
│ ------------------------------------------------------------ │
│ W-001 | Merlot 2018     | Wine     | 12    | 10  | бут  | $120 │
│ S-045 | Absolut 1l      | Spirits  | 3     | 5   | бут  | $75  │
│ B-102 | Heineken 0.33l  | Beer     | 48    | 24  | шт   | $96  │
├──────────────────────────────────────────────────────────────┤
│ Items: 124 | Page: 1 of 5 | [ < ] [ 1 ] [ 2 ] [ 3 ] [ > ]     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Interaction Design

### 3.1 Design Principles
-   **Mobile-First**: Single-column layout, large touch targets (min 44x44px).
-   **Thumb-Zone Optimization**: Primary actions (Scan, Save, Next) located in the bottom 30% of the screen.
-   **High Contrast**: Dark mode support with high-contrast text for low-light environments (cellars).
-   **Immediate Feedback**: Haptic feedback on scan/save, visual progress bars for sync status.

### 3.2 Key Screens & Components
1.  **Dashboard**: Summary of active sessions, sync status (Offline/Online), and quick-start scan.
2.  **Counting Interface**:
    -   **Product Card**: Large image, Name, SKU, and Current Syrve Stock.
    -   **State Toggle**: "Full" vs "Partial" (Opened) toggle.
    -   **Numeric Keypad**: Large, custom on-screen keypad (avoiding system keyboard overlap).
    -   **Quick Increments**: `+1`, `+6`, `+12` buttons for rapid entry.
3.  **Search & Filter**: Fuzzy search with category filters and "Recently Counted" list.
4.  **Sync Center**: List of pending offline changes with "Sync Now" button and conflict resolution modal.
