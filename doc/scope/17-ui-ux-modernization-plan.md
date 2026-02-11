# UI/UX Modernization & Style Guide

This document outlines the strategy for transforming the current wine-centric inventory app into a modern, high-end, category-agnostic universal inventory platform. The goal is to provide a "native-feel" experience that is both aesthetically pleasing and functionally superior.

## 1. Visual Language & Branding

### 1.1 From Wine to Universal
We are moving away from hardcoded "wine" branding to a semantic, brand-driven theme.

- **Color Palette Refactoring**:
    - `primary`: Replace `wine-red` with a sophisticated `brand-primary` (e.g., Deep Charcoal or Indigo).
    - `accent`: Replace `wine-gold` with `brand-accent` (e.g., Electric Blue or Vibrant Amber).
    - `surface`: Use a layered approach with `surface-sunken`, `surface-card`, and `surface-overlay`.
- **Glassmorphism 2.0**:
    - Enhance the `.wine-glass-effect` to a more subtle `glass-panel`.
    - Use `backdrop-blur-xl` and thin `1px` borders with low opacity for a premium feel.
- **Typography**:
    - **Headings**: Keep `Playfair Display` for a touch of elegance in titles, but use `Inter` or `Geist` for all functional headers to improve readability.
    - **Body**: Use `Inter` with improved line-height (`1.6`) and letter-spacing for better legibility on mobile.

## 2. Mobile-First UX Strategy

The app must feel like a native iOS/Android application.

- **Bottom Sheets (Drawers)**:
    - Replace full-screen modals and complex dropdowns with bottom sheets on mobile.
    - Used for: Filters, Product Selection, Quantity Input, and Quick Actions.
- **Haptic Feedback**:
    - Implement subtle haptic triggers (via PWA capabilities) for successful scans, count commits, and error states.
- **Touch-Optimized Targets**:
    - Minimum touch target of `44x44px`.
    - Generous padding in lists and buttons to prevent accidental taps.
- **Gestures**:
    - Swipe-to-delete in lists.
    - Pull-to-refresh on dashboard and catalog.
    - Edge-swipe for navigation.

## 3. Component Modernization

### 3.1 Advanced Dashboard
- **Dynamic Widgets**: Move from simple stat cards to interactive widgets with sparkline charts.
- **Contextual Actions**: A floating action button (FAB) for "Quick Scan" that changes based on the user's current context.
- **Progress Visualization**: Circular progress bars for inventory completion status.

### 3.2 Product Passport (Details)
- **Sticky Header**: Product name and image remain visible while scrolling through details.
- **Tabbed Information**: Group details into "Info", "Inventory", "History", and "Settings".
- **Visual Richness**: Use high-quality image placeholders and skeleton loaders for a smooth transition.

### 3.3 Smart Inventory Table
- **Horizontal Scrolling**: Optimized for mobile with "frozen" first columns.
- **Inline Editing**: Tap-to-edit for quantities directly in the table view (tablet/desktop).
- **Status Indicators**: Pulse animations for "Low Stock" or "Pending Sync" items.

## 4. Interaction & Motion

- **Micro-interactions**:
    - Button scaling on tap (`active:scale-95`).
    - Staggered entry animations for list items.
    - Smooth transitions between routes using `framer-motion` or CSS View Transitions API.
- **State Feedback**:
    - **Skeletons**: Detailed skeleton screens that match the final layout exactly.
    - **Toasts**: Non-intrusive, floating toast notifications for background tasks (e.g., "Syrve Sync Complete").
    - **Empty States**: Illustrated, helpful empty states with clear "Call to Action" buttons.

## 5. Information Architecture

### 5.1 Module-Based Navigation
Consolidate the sidebar into logical modules:
- **Dashboard**: Overview and daily tasks.
- **Inventory**: (Merged Catalog + Counting)
    - *Sub-pages*: All Products, Active Counts, History.
- **Analytics**: Reports and trends.
- **Admin**: Settings, Users, Config.

### 5.2 Global Search
- A Command-K style global search (`Cmd+K`) available on all pages to quickly find products, users, or settings.

## 6. Accessibility (a11y)

- **Contrast**: Ensure all text meets WCAG AA standards.
- **Screen Readers**: Proper ARIA labels for all icon-only buttons.
- **Dark Mode**: A first-class dark mode that isn't just "inverted colors" but a carefully crafted palette for low-light environments (warehouses, bars).

## 7. Implementation Checklist

- [ ] Refactor `src/index.css` variables to semantic names.
- [ ] Implement `MobileDrawer` component for bottom sheets.
- [ ] Create `SkeletonLoader` variants for all major pages.
- [ ] Update `AppSidebar` to the module-based structure.
- [ ] Enhance `DataTable` with mobile-optimized horizontal scroll and frozen columns.
- [ ] Add `framer-motion` for page transitions and micro-interactions.
- [ ] Design a new set of custom icons or refine the use of `Lucide-react` with consistent stroke weights.
