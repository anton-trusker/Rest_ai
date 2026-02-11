# 07 — Technical Architecture & Integrations

## 7.1. System Architecture
Inventory AI follows a modern, cloud-native architecture optimized for real-time synchronization and mobile performance.

### 7.1.1. Core Components
1. **Frontend (React)**: A Single Page Application (SPA) that manages the user interface, local state, and offline persistence.
2. **Backend-as-a-Service (Supabase)**:
   - **PostgreSQL**: Relational database with Row Level Security (RLS) for multi-tenancy.
   - **Auth**: Secure JWT-based authentication and user management.
   - **Edge Functions**: Serverless TypeScript functions for heavy logic and secure API integrations.
   - **Storage**: Asset hosting for product images and count verification photos.
3. **State Management (Zustand)**: Orchestrates global application state (Auth, Catalog, Stock, Inventory) with shallow reactivity for performance.

---

## 7.2. Integration: Syrve (iiko)

### 7.2.1. Connectivity Protocol
The system connects to the **Syrve API** using a secure Bridge pattern implemented in Supabase Edge Functions.
- **Authentication**: Uses API Login and Password to obtain a session token.
- **Endpoints**:
    - `GET /products`: For catalog synchronization.
    - `GET /groups`: For category mapping.
    - `POST /documents/inventory`: For pushing approved counts.

### 7.2.2. Synchronization Logic & Workflow
1. **Catalog Sync**: A bi-directional process that prioritizes Syrve for SKU/Price but preserves local metadata (Vintage, Region).
2. **Review State**: If "Approval Required" is enabled in settings, the session status is set to `Pending Review`.
3. **Document Commitment**: 
    - When approved, the system generates a formatted XML/JSON document.
    - It maps local `product_id` to Syrve's internal UUID.
    - It pushes the document to Syrve's `/import/incomingInventory` endpoint.
    - It records the resulting Syrve Document ID in the local session for auditability.

---

## 7.3. Integration: AI Vision Engine

### 7.3.1. Vision AI Workflow
1. **Capture**: User takes a photo of a wine label in the mobile app.
2. **Pre-processing**: Image is resized and optimized for transmission.
3. **Analysis**: Sent to the configured AI provider (OpenAI or Google Gemini).
4. **Key Management Logic**:
    - **Fallback Logic**: The Edge Function first checks for a `business_ai_api_key`.
    - **Execution**: If a custom key exists, it is used for the request; otherwise, the platform's `system_ai_api_key` is used.
    - **Matching**: The extracted text is compared against the local `products` table using fuzzy matching logic to suggest the most likely product.

---

## 7.4. Data Flow & Security

### 7.4.1. Multi-Tenancy (RLS)
Security is enforced at the database level using PostgreSQL **Row Level Security**.
- Every query is automatically scoped: `WHERE business_id = current_user_business_id()`.
- This ensures that User A from Business X can never see data from Business Y, even if they bypass the frontend.

### 7.4.2. Offline Strategy
- **Persistence**: React Query's `persistQueryClient` is used to cache data in `localStorage` or `IndexedDB`.
- **Synchronization**: A background sync worker monitors connection status and retries failed inventory item uploads when the user returns online.

---

## 7.5. Performance & Scalability Factors
- **Edge Computing**: API logic is executed close to the user via Supabase Edge Functions to minimize latency.
- **Image Optimization**: Images are processed via an image proxy to serve appropriate sizes for mobile vs. desktop, reducing data usage.
- **Database Partitioning**: The `audit_logs` table is designed for future partitioning by `business_id` or `month` to maintain query performance as the system grows.
