# 05 — Stock & Reports Module

## 5.1. Overview
The **Stock & Reports Module** provides the analytical layer of the platform. It translates raw inventory counts into actionable business intelligence, focusing on stock levels, financial value, and operational trends.

### 5.1.1. Business Objectives
- **Financial Oversight**: Provide an accurate valuation of current stock on hand.
- **Operational Efficiency**: Identify slow-moving items and high-turnover products.
- **Proactive Management**: Alert administrators when stock falls below critical thresholds (Par Levels).
- **Audit Compliance**: Maintain a permanent, immutable record of all inventory changes.

---

## 5.2. Feature Breakdown

### 5.2.1. Real-time Stock View
- **Description**: A "Live" view of current inventory levels.
- **Functionality**:
    - **Global Stock**: Aggregated view of stock across all locations.
    - **Location Breakdown**: Drill down into specific cellars or bars.
    - **Status Indicators**: Highlighting items that are "Out of Stock" or "Below Par".
- **Business Justification**: Enables quick decision-making for daily ordering without needing a full inventory count.

### 5.2.2. Financial Reporting
- **Description**: Calculation of inventory value based on purchase prices.
- **Key Metrics**:
    - **Total Stock Value**: `Quantity on Hand` * `Purchase Price`.
    - **Category Valuation**: Financial breakdown by Wine, Spirits, Beer, etc.
    - **Value at Risk**: Value of items approaching their expiration or peak drinking window (for wine).

### 5.2.3. Variance Analysis
- **Description**: A historical look at discrepancies found during inventory sessions.
- **Insights**:
    - **Top Loss Items**: Products with the highest negative variance.
    - **Location Trends**: Identifying bars or storage areas with consistent discrepancies.
    - **User Accuracy**: Tracking the accuracy and speed of different staff members.

---

## 5.3. Technical Implementation

### 5.3.1. Data Aggregation
The Stock view is a **Derived View** calculated from:
1. The last approved **Syrve Sync**.
2. Any **Inventory Sessions** approved since the last sync.
3. (Future) Real-time **Sales Data** pulled from the POS.

### 5.3.2. Export Engine
- **Formats**: CSV, Excel, and PDF.
- **Architecture**: Large reports are generated asynchronously via Supabase Edge Functions to prevent frontend timeout.

---

## 5.4. User Interaction Flow
1. **Check**: Admin opens the "Stock" page on Monday morning.
2. **Identify**: Sees that "House Chardonnay" is highlighted in red (Below Par).
3. **Analyze**: Switches to the "Reports" module to see the consumption rate for the last 7 days.
4. **Export**: Generates a PDF "Ordering List" based on par level deficits.
5. **Act**: Places an order with the supplier to replenish stock.

---

## 5.5. Performance Considerations
- **Caching**: Stock levels are cached in the `stockStore` to ensure the UI remains responsive during heavy filtering.
- **Incremental Updates**: Instead of recalculating the entire stock table, the system applies "deltas" from approved inventory sessions.
- **Lazy Loading**: The Stock table uses infinite scrolling to handle catalogs with thousands of SKUs.
