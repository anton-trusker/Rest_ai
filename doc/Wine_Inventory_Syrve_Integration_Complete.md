# Wine Inventory Management System
## Syrve (iiko) Integration - Complete Technical Specification

**Document Version:** 1.0  
**Date:** February 9, 2026  
**Integration Type:** Bi-directional Stock Synchronization  
**API Version:** iiko Transport API (Cloud API)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Integration Architecture](#integration-architecture)
3. [Authentication & Authorization](#authentication)
4. [API Endpoints Reference](#api-endpoints)
5. [Stock Retrieval from Syrve](#stock-retrieval)
6. [Stock Updates to Syrve](#stock-updates)
7. [Product Synchronization](#product-sync)
8. [Data Models & Schemas](#data-models)
9. [Error Handling](#error-handling)
10. [Webhooks & Real-time Updates](#webhooks)
11. [Implementation Guide](#implementation)
12. [Security Best Practices](#security)
13. [Testing Strategy](#testing)
14. [Monitoring & Logging](#monitoring)

---

<a name="executive-summary"></a>
## 1. Executive Summary

### Integration Overview

This document provides a comprehensive technical specification for integrating the Wine Inventory Management System with Syrve (formerly iiko) restaurant management system. The integration enables:

- **Real-time stock synchronization** between Wine Inventory and Syrve
- **Bi-directional data flow**: Retrieve current stock levels from Syrve and push inventory count updates back
- **Product catalog synchronization**: Wines, vintages, and variants
- **Automated inventory reconciliation** after physical counts
- **Webhook notifications** for stock changes in Syrve

### Key Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    Wine Inventory System                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  - Mobile inventory counting interface                    │ │
│  │  - AI-powered bottle recognition                          │ │
│  │  - Physical inventory sessions                            │ │
│  │  - Stock movement tracking                                │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Integration Layer
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         [1] Get Stock  [2] Update    [3] Sync Products
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                   Syrve (iiko) System                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  iiko Transport API (Cloud API)                           │ │
│  │  - Nomenclature (Products)                                │ │
│  │  - Stock Balance                                          │ │
│  │  - Inventory Write-offs                                   │ │
│  │  - Organizations & Terminals                              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Benefits

1. **Eliminate double data entry** - Inventory counts automatically update Syrve
2. **Real-time accuracy** - Always have current stock levels from POS
3. **Audit compliance** - Complete trail of all stock movements
4. **Automatic reconciliation** - Physical counts reconcile with system stock
5. **Reduce discrepancies** - Single source of truth for inventory

---

<a name="integration-architecture"></a>
## 2. Integration Architecture

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Wine Inventory Mobile/Web App                          │  │
│  │   - Staff performs physical count                        │  │
│  │   - Scans bottles, records quantities                    │  │
│  │   - Views current stock from Syrve                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS/REST
┌──────────────────────────────┴──────────────────────────────────┐
│              WINE INVENTORY API LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Integration Service (Node.js/Express)                  │  │
│  │   ┌────────────┬─────────────┬──────────────────────┐   │  │
│  │   │ Auth       │ Sync        │ Mapping              │   │  │
│  │   │ Manager    │ Service     │ Service              │   │  │
│  │   │            │             │                      │   │  │
│  │   │ - API keys │ - Scheduler │ - Product matching   │   │  │
│  │   │ - Tokens   │ - Queue     │ - Unit conversion    │   │  │
│  │   │ - Sessions │ - Retries   │ - Variant mapping    │   │  │
│  │   └────────────┴─────────────┴──────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS/REST
┌──────────────────────────────┴──────────────────────────────────┐
│                 Syrve API Gateway                               │
│  Base URL: https://api-eu.iiko.services                        │
│  (or https://api-ru.iiko.services for RU region)               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                   SYRVE (iiko) BACKEND                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   iiko Transport API Services                            │  │
│  │   - Authentication Service                               │  │
│  │   - Nomenclature Service (Products)                      │  │
│  │   - Organizations Service                                │  │
│  │   - Stock Management Service                             │  │
│  │   - Inventory Operations Service                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Patterns

#### Pattern 1: Initial Stock Retrieval (Start of Inventory Session)

```
User Action: Staff clicks "Start Inventory"
     │
     ├─> Wine Inventory: GET /api/inventory/start-session
     │   - Create new inventory session in local DB
     │   - Set status: "in_progress"
     │
     ├─> Integration Service: GET /api/syrve/stock/current
     │   - Triggers Syrve sync
     │
     ├─> Syrve API: POST /api/1/access_token
     │   - Obtain authentication token
     │   Response: { token, lifetime }
     │
     ├─> Syrve API: POST /api/1/organizations
     │   - Get organization IDs
     │   Response: { organizations: [...] }
     │
     ├─> Syrve API: POST /api/1/nomenclature
     │   - Get all products (wines) with current stock
     │   Request: { organizationId, startRevision }
     │   Response: { products, groups, revision }
     │
     ├─> Integration Service: Process & Map
     │   - Match Syrve products to Wine Inventory catalog
     │   - Convert units (if needed)
     │   - Store current stock as baseline
     │
     └─> Wine Inventory: Display stock levels
         - Show current quantities from Syrve
         - Enable counting interface
```

#### Pattern 2: Inventory Count Update (After Physical Count)

```
User Action: Staff completes counting & clicks "Submit Inventory"
     │
     ├─> Wine Inventory: POST /api/inventory/complete-session
     │   - Calculate variances (counted vs. Syrve stock)
     │   - Create stock movement records
     │   - Prepare update payload
     │
     ├─> Integration Service: POST /api/syrve/stock/update
     │   - Validate variance data
     │   - Queue update request
     │
     ├─> Syrve API: POST /api/1/access_token
     │   - Refresh authentication token
     │
     ├─> Syrve API: POST /api/1/documents/writeoff/create
     │   - For each product with variance (shortage/excess)
     │   Request: {
     │       organizationId,
     │       documentId (UUID),
     │       items: [
     │         { productId, amount, reason: "inventory_variance" }
     │       ],
     │       comment: "Physical inventory count: [Session ID]"
     │   }
     │   Response: { correlationId, status }
     │
     ├─> Integration Service: Poll Status
     │   - Check write-off document processing status
     │   - Retry on failure (with exponential backoff)
     │
     └─> Wine Inventory: Confirm Sync
         - Mark session as "completed" & "synced"
         - Log sync status for audit
```

#### Pattern 3: Real-time Updates via Webhooks (Optional)

```
Syrve Event: Product sold, stock changed
     │
     ├─> Syrve: POST [Your Webhook URL]
     │   Payload: {
     │     eventType: "StockUpdate",
     │     organizationId,
     │     productId,
     │     newBalance,
     │     timestamp
     │   }
     │
     ├─> Wine Inventory Webhook Handler
     │   - Validate webhook signature
     │   - Update local stock cache
     │   - Notify active inventory sessions (WebSocket)
     │
     └─> Client: Real-time UI Update
         - Show updated stock if session active
         - Display notification of change
```

### 2.3 Component Responsibilities

| Component | Responsibilities |
|-----------|------------------|
| **Wine Inventory Frontend** | - User interface for inventory<br>- Display stock from Syrve<br>- Capture physical counts<br>- Show sync status |
| **Wine Inventory API** | - Session management<br>- Variance calculation<br>- Local data persistence<br>- API orchestration |
| **Integration Service** | - Syrve authentication<br>- Product mapping<br>- Data transformation<br>- Retry logic<br>- Queue management |
| **Syrve API** | - Authentication<br>- Product catalog<br>- Stock levels<br>- Inventory write-offs<br>- Webhooks |

---

<a name="authentication"></a>
## 3. Authentication & Authorization

### 3.1 Obtaining API Credentials

**Prerequisites:**
1. Active Syrve (iiko) account with API license
2. API-login credentials from Syrve administrator
3. Organization ID(s) for your restaurant(s)

**How to get API access:**
1. Contact your Syrve account manager or support (api@iiko.ru)
2. Request "API License" activation
3. Receive API-login credentials (username-like string)
4. Store credentials securely (environment variables, secret manager)

### 3.2 Authentication Flow

Syrve uses **Bearer Token Authentication** with time-limited tokens.

#### Step 1: Obtain Access Token

**Endpoint:** `POST /api/1/access_token`  
**Base URL:** `https://api-eu.iiko.services` (EU) or `https://api-ru.iiko.services` (RU)

**Request:**
```http
POST /api/1/access_token HTTP/1.1
Host: api-eu.iiko.services
Content-Type: application/json

{
  "apiLogin": "your_api_login_here"
}
```

**Request Schema:**
```typescript
interface AccessTokenRequest {
  apiLogin: string; // API login provided by Syrve
}
```

**Response:**
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenLifeTime": 3600
}
```

**Response Schema:**
```typescript
interface AccessTokenResponse {
  correlationId: string;     // UUID for request tracking
  token: string;              // JWT Bearer token
  tokenLifeTime: number;      // Token validity in seconds (typically 3600 = 1 hour)
}
```

#### Step 2: Use Token in Requests

**All subsequent API requests must include the token in Authorization header:**

```http
POST /api/1/nomenclature HTTP/1.1
Host: api-eu.iiko.services
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### Step 3: Token Refresh Strategy

**Implementation:**
```typescript
class SyrveAuthService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private apiLogin: string;

  constructor(apiLogin: string) {
    this.apiLogin = apiLogin;
  }

  async getValidToken(): Promise<string> {
    // Check if token exists and is still valid (with 5 min buffer)
    if (this.token && this.tokenExpiry && 
        this.tokenExpiry.getTime() > Date.now() + 300000) {
      return this.token;
    }

    // Token expired or doesn't exist - get new one
    return await this.refreshToken();
  }

  async refreshToken(): Promise<string> {
    const response = await fetch('https://api-eu.iiko.services/api/1/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiLogin: this.apiLogin })
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data: AccessTokenResponse = await response.json();
    
    this.token = data.token;
    this.tokenExpiry = new Date(Date.now() + (data.tokenLifeTime * 1000));

    return this.token;
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const token = await this.getValidToken();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}
```

### 3.3 Error Handling for Authentication

| Error Scenario | HTTP Status | Error Code | Action |
|----------------|-------------|------------|--------|
| Invalid API login | 401 | `InvalidApiLogin` | Check credentials, contact Syrve support |
| Token expired | 401 | `TokenExpired` | Automatically refresh token and retry |
| API license inactive | 403 | `LicenseInactive` | Contact Syrve to activate API license |
| Rate limit exceeded | 429 | `RateLimitExceeded` | Implement exponential backoff |

---

<a name="api-endpoints"></a>
## 4. API Endpoints Reference

### 4.1 Base URLs

| Region | Base URL |
|--------|----------|
| **Europe** | `https://api-eu.iiko.services` |
| **Russia** | `https://api-ru.iiko.services` |

**Note:** Use the URL corresponding to your Syrve instance region.

### 4.2 Core Endpoints for Integration

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/api/1/access_token` | POST | Obtain authentication token | 10 req/min |
| `/api/1/organizations` | POST | Get list of organizations | 60 req/min |
| `/api/1/nomenclature` | POST | Get products catalog with stock | 30 req/min |
| `/api/1/stop_lists` | POST | Get out-of-stock items | 60 req/min |
| `/api/1/documents/writeoff/create` | POST | Create inventory write-off | 30 req/min |
| `/api/1/commands/status` | POST | Check command status | 120 req/min |

### 4.3 Request/Response Headers

**Standard Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer {token}
User-Agent: WineInventory/1.0
```

**Standard Response Headers:**
```http
Content-Type: application/json
X-Correlation-Id: {correlationId}
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1709999999
```

---

<a name="stock-retrieval"></a>
## 5. Stock Retrieval from Syrve

### 5.1 Get Organizations

**Purpose:** Retrieve organization IDs (required for all subsequent requests)

**Endpoint:** `POST /api/1/organizations`

**Request:**
```http
POST /api/1/organizations HTTP/1.1
Host: api-eu.iiko.services
Authorization: Bearer {token}
Content-Type: application/json

{
  "returnAdditionalInfo": true,
  "includeDisabled": false
}
```

**Request Schema:**
```typescript
interface OrganizationsRequest {
  returnAdditionalInfo?: boolean;  // Include full organization details
  includeDisabled?: boolean;        // Include disabled organizations
}
```

**Response:**
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "organizations": [
    {
      "id": "7bc05553-4b68-44e8-b7bc-37be63c6d9e9",
      "name": "Wine Restaurant - Main Location",
      "country": "PT",
      "restaurantAddress": "Rua do Alecrim 12, Lisbon",
      "latitude": 38.7223,
      "longitude": -9.1393,
      "useUaeAddressingSystem": false,
      "currencyIsoName": "EUR",
      "currencyMinimumDenomination": 0.01,
      "countryPhoneCode": "+351",
      "marketingSourceRequiredInDelivery": false,
      "defaultCallCenterPaymentTypeId": "uuid-here",
      "orderServiceType": "DeliveryAndPickup",
      "deliveryServiceType": "Native"
    }
  ]
}
```

**Response Schema:**
```typescript
interface OrganizationsResponse {
  correlationId: string;
  organizations: Array<{
    id: string;                    // Organization UUID (REQUIRED for all requests)
    name: string;
    country: string;
    restaurantAddress: string;
    latitude: number;
    longitude: number;
    currencyIsoName: string;       // e.g., "EUR", "USD"
    currencyMinimumDenomination: number;
    // ... additional fields
  }>;
}
```

**Usage:**
```typescript
// Store organization ID for use in all subsequent requests
const orgId = organizations[0].id;
```

---

### 5.2 Get Nomenclature (Product Catalog with Stock)

**Purpose:** Retrieve all products (wines) with current stock levels

**Endpoint:** `POST /api/1/nomenclature`

**Request:**
```http
POST /api/1/nomenclature HTTP/1.1
Host: api-eu.iiko.services
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationId": "7bc05553-4b68-44e8-b7bc-37be63c6d9e9",
  "startRevision": 0
}
```

**Request Schema:**
```typescript
interface NomenclatureRequest {
  organizationId: string;  // Organization UUID from /organizations
  startRevision?: number;  // 0 for full sync, or last known revision for delta sync
}
```

**Response:**
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "revision": 12345,
  "groups": [
    {
      "id": "group-uuid-wines",
      "name": "Wines",
      "description": "Wine Category",
      "order": 100,
      "isIncludedInMenu": true,
      "isGroupModifier": false,
      "parentGroup": null,
      "imageLinks": []
    }
  ],
  "products": [
    {
      "id": "product-uuid-1",
      "name": "Quinta do Crasto Reserva Tinto 2019",
      "description": "Full-bodied Douro red wine",
      "productCategoryId": "group-uuid-wines",
      "order": 1,
      "fullNameEnglish": "Quinta do Crasto Reserva Red 2019",
      "useBalanceForSell": true,
      "canSetOpenPrice": false,
      "code": "WINE-001",
      "parentGroup": "group-uuid-wines",
      "isIncludedInMenu": true,
      "isDeleted": false,
      "measureUnit": "bottle",
      "prices": [
        {
          "organizationId": "7bc05553-4b68-44e8-b7bc-37be63c6d9e9",
          "price": 25.00
        }
      ],
      "sizePrices": [],
      "modifiers": [],
      "groupModifiers": [],
      "imageLinks": [
        "https://images.syrve.io/wines/product-uuid-1.jpg"
      ],
      "doNotPrintInCheque": false,
      "productType": "Dish",
      "tags": ["wine", "red", "douro"],
      "isMarked": false,
      "energyFullAmount": null,
      "fatsFullAmount": null,
      "proteinsFullAmount": null,
      "carbohydratesFullAmount": null
    }
  ],
  "sizePrices": [],
  "revision": 12346
}
```

**Response Schema:**
```typescript
interface NomenclatureResponse {
  correlationId: string;
  revision: number;           // Current revision number (use for delta sync)
  groups: ProductGroup[];
  products: Product[];
  sizePrices: SizePrice[];
}

interface Product {
  id: string;                 // Product UUID (CRITICAL for stock operations)
  name: string;
  description: string;
  productCategoryId: string;  // References groups[].id
  order: number;
  fullNameEnglish?: string;
  useBalanceForSell: boolean; // TRUE = stock-controlled item
  canSetOpenPrice: boolean;
  code: string;               // SKU/Barcode (use for matching)
  parentGroup: string;
  isIncludedInMenu: boolean;
  isDeleted: boolean;
  measureUnit: string;        // "bottle", "piece", "liter", etc.
  prices: Array<{
    organizationId: string;
    price: number;
  }>;
  imageLinks: string[];
  productType: string;        // "Dish", "Goods", "Modifier"
  tags: string[];
  // ... additional fields
}
```

**IMPORTANT:** The `/nomenclature` endpoint does **NOT** return current stock levels directly. Stock levels must be retrieved separately or calculated from inventory operations.

---

### 5.3 Get Stock Balances (Alternative Method)

**Note:** Syrve/iiko Transport API does not have a direct "get stock balance" endpoint. Stock levels are managed through:

1. **Inventory Documents** - Historical write-offs, purchases, transfers
2. **Stop Lists** - Out-of-stock items
3. **Internal Balance Calculation** - Based on document history

**Recommended Approach:**

Use the **Stop List** endpoint to identify items currently out of stock, and maintain a local cache of stock levels updated via inventory operations.

**Endpoint:** `POST /api/1/stop_lists`

**Request:**
```http
POST /api/1/stop_lists HTTP/1.1
Host: api-eu.iiko.services
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationIds": ["7bc05553-4b68-44e8-b7bc-37be63c6d9e9"]
}
```

**Request Schema:**
```typescript
interface StopListsRequest {
  organizationIds: string[];  // Array of organization UUIDs
}
```

**Response:**
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "stopLists": [
    {
      "organizationId": "7bc05553-4b68-44e8-b7bc-37be63c6d9e9",
      "items": [
        {
          "productId": "product-uuid-5",
          "balance": 0
        }
      ]
    }
  ]
}
```

**Response Schema:**
```typescript
interface StopListsResponse {
  correlationId: string;
  stopLists: Array<{
    organizationId: string;
    items: Array<{
      productId: string;  // Product UUID
      balance: number;    // Current balance (0 = out of stock)
    }>;
  }>;
}
```

---

<a name="stock-updates"></a>
## 6. Stock Updates to Syrve

### 6.1 Overview of Stock Update Methods

Syrve supports multiple ways to update stock:

| Method | Use Case | Endpoint |
|--------|----------|----------|
| **Write-Off Document** | Inventory shortages, damages, waste | `/api/1/documents/writeoff/create` |
| **Manual Purchase** | Stock additions from suppliers | `/api/1/documents/purchase/create` |
| **Transfer Document** | Stock transfers between locations | `/api/1/documents/transfer/create` |

**For inventory reconciliation, use Write-Off Documents.**

---

### 6.2 Create Write-Off Document (Inventory Variance)

**Purpose:** Adjust stock based on physical inventory count

**Endpoint:** `POST /api/1/documents/writeoff/create`

**When to use:**
- After completing physical inventory count
- Physical quantity < System quantity (shortage)
- Damaged/expired bottles

**Request:**
```http
POST /api/1/documents/writeoff/create HTTP/1.1
Host: api-eu.iiko.services
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationId": "7bc05553-4b68-44e8-b7bc-37be63c6d9e9",
  "documentId": "550e8400-e29b-41d4-a716-446655440001",
  "dateIncoming": "2026-02-09T18:30:00",
  "comment": "Physical inventory count - Session ID: INV-2026-02-09-001",
  "items": [
    {
      "productId": "product-uuid-1",
      "amount": 2.0,
      "sum": 50.00,
      "comment": "Shortage: Expected 10, Counted 8"
    },
    {
      "productId": "product-uuid-2",
      "amount": 1.0,
      "sum": 35.00,
      "comment": "Damaged bottle"
    }
  ],
  "conception": null,
  "counteragentId": null
}
```

**Request Schema:**
```typescript
interface WriteOffCreateRequest {
  organizationId: string;          // Organization UUID
  documentId: string;              // Unique UUID for this document (generate client-side)
  dateIncoming: string;            // ISO 8601 date-time
  comment?: string;                // Description of write-off
  items: WriteOffItem[];
  conception?: string | null;      // Conception UUID (optional)
  counteragentId?: string | null;  // Counteragent UUID (optional)
}

interface WriteOffItem {
  productId: string;    // Product UUID from nomenclature
  amount: number;       // Quantity to write off
  sum: number;          // Total value (amount * unit price)
  comment?: string;     // Item-specific comment
}
```

**Response:**
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440002",
  "documentId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response Schema:**
```typescript
interface WriteOffCreateResponse {
  correlationId: string;  // Request tracking UUID
  documentId: string;     // Document UUID (matches request)
}
```

**Important Notes:**

1. **UUID Generation:** Always generate a new UUID for `documentId` (use uuid library)
2. **Amount:** Positive number = write-off (reduce stock)
3. **Sum:** Calculate as `amount * unitPrice` (get price from nomenclature)
4. **Date:** Use ISO 8601 format with timezone
5. **Async Processing:** Write-off is processed asynchronously - check status with `/commands/status`

---

### 6.3 Handling Inventory Excesses (Physical > System)

When physical count **exceeds** system quantity, you have two options:

#### Option 1: Create Purchase Document

**Endpoint:** `POST /api/1/documents/purchase/create`

```typescript
interface PurchaseCreateRequest {
  organizationId: string;
  documentId: string;
  dateIncoming: string;
  comment?: string;
  items: Array<{
    productId: string;
    amount: number;
    sum: number;
    price: number;
  }>;
  defaultStoreId?: string;  // Storage location UUID
  supplierId?: string;      // Supplier UUID (if tracked)
}
```

#### Option 2: Reverse Write-Off (Not Recommended)

Create a write-off with negative amounts (not officially supported, may fail).

**Recommended Approach:** Use Purchase Document for excesses.

---

### 6.4 Check Document Processing Status

**Purpose:** Verify if write-off/purchase was successfully processed

**Endpoint:** `POST /api/1/commands/status`

**Request:**
```http
POST /api/1/commands/status HTTP/1.1
Host: api-eu.iiko.services
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationId": "7bc05553-4b68-44e8-b7bc-37be63c6d9e9",
  "correlationId": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Request Schema:**
```typescript
interface CommandStatusRequest {
  organizationId: string;
  correlationId: string;  // correlationId from write-off response
}
```

**Response:**
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440003",
  "state": "Success",
  "error": null,
  "errorDescription": null
}
```

**Response Schema:**
```typescript
interface CommandStatusResponse {
  correlationId: string;
  state: "Success" | "InProgress" | "Error";
  error: string | null;
  errorDescription: string | null;
}
```

**Polling Strategy:**
```typescript
async function waitForDocumentProcessing(
  orgId: string, 
  correlationId: string, 
  maxAttempts = 10
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkCommandStatus(orgId, correlationId);
    
    if (status.state === "Success") {
      return true;
    }
    
    if (status.state === "Error") {
      throw new Error(`Document processing failed: ${status.errorDescription}`);
    }
    
    // Wait before next check (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 10000)));
  }
  
  throw new Error("Document processing timeout");
}
```

---

<a name="product-sync"></a>
## 7. Product Synchronization

### 7.1 Product Matching Strategy

**Challenge:** Wine Inventory System wines must be matched to Syrve products.

**Matching Approaches:**

#### Approach 1: By Code/SKU (Recommended)

```typescript
// In Wine Inventory database, store Syrve product ID
interface Wine {
  id: string;
  name: string;
  producer: string;
  vintage: number;
  syrveProductId: string | null;  // Store this!
  syrveProductCode: string | null; // Store SKU for reference
}

// Matching logic
function matchWineToSyrveProduct(wine: Wine, syrveProducts: Product[]): Product | null {
  // 1. Try exact match by stored ID
  if (wine.syrveProductId) {
    const match = syrveProducts.find(p => p.id === wine.syrveProductId);
    if (match) return match;
  }
  
  // 2. Try match by code/SKU
  if (wine.syrveProductCode) {
    const match = syrveProducts.find(p => p.code === wine.syrveProductCode);
    if (match) {
      // Update stored ID for future
      wine.syrveProductId = match.id;
      return match;
    }
  }
  
  // 3. Try fuzzy match by name
  const match = syrveProducts.find(p => 
    normalizeString(p.name) === normalizeString(`${wine.producer} ${wine.name} ${wine.vintage}`)
  );
  
  if (match) {
    wine.syrveProductId = match.id;
    wine.syrveProductCode = match.code;
    return match;
  }
  
  return null;
}

function normalizeString(str: string): string {
  return str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]/g, "");
}
```

#### Approach 2: Manual Mapping Interface (Admin)

```typescript
// Admin screen: Map unmapped wines
interface WineMapping {
  wineInventoryId: string;
  syrveProductId: string;
  mappedAt: Date;
  mappedBy: string;
}

// Store mappings in database
CREATE TABLE wine_syrve_mappings (
  wine_id UUID REFERENCES wines(id),
  syrve_product_id VARCHAR(255) NOT NULL,
  syrve_organization_id VARCHAR(255) NOT NULL,
  mapped_at TIMESTAMP DEFAULT NOW(),
  mapped_by UUID REFERENCES users(id),
  PRIMARY KEY (wine_id, syrve_organization_id)
);
```

### 7.2 Handling Wine Variants

**Challenge:** Same wine with different vintages, volumes, or bottle states (opened/unopened).

**Syrve Approach:** Each variant is a separate product.

**Wine Inventory Approach:** Single wine with variant attributes.

**Solution:**

```typescript
interface WineVariantMapping {
  baseWineId: string;          // Wine Inventory base wine ID
  variant: {
    vintage?: number;
    volume?: string;            // "750ml", "1.5L"
    bottleState?: "unopened" | "opened";
  };
  syrveProductId: string;      // Corresponding Syrve product
}

// Example: Same wine, different vintages
const mappings: WineVariantMapping[] = [
  {
    baseWineId: "wine-001",
    variant: { vintage: 2019, volume: "750ml", bottleState: "unopened" },
    syrveProductId: "syrve-product-uuid-1"
  },
  {
    baseWineId: "wine-001",
    variant: { vintage: 2020, volume: "750ml", bottleState: "unopened" },
    syrveProductId: "syrve-product-uuid-2"
  },
  {
    baseWineId: "wine-001",
    variant: { vintage: 2019, volume: "750ml", bottleState: "opened" },
    syrveProductId: "syrve-product-uuid-3"  // BTG variant
  }
];
```

### 7.3 Synchronization Schedule

**Recommended Sync Strategy:**

| Sync Type | Frequency | Method | Purpose |
|-----------|-----------|--------|---------|
| **Full Nomenclature Sync** | Daily at 3 AM | `/nomenclature` with `startRevision: 0` | Ensure all products are up-to-date |
| **Delta Sync** | Every 4 hours | `/nomenclature` with last known revision | Get only changes since last sync |
| **Stock Retrieval** | On-demand | Before each inventory session | Get current stock baseline |
| **Stock Update** | Immediate | After inventory completion | Push counted stock to Syrve |

**Implementation:**

```typescript
// Cron job for daily full sync
cron.schedule('0 3 * * *', async () => {
  await fullNomenclatureSync();
});

// Cron job for delta sync every 4 hours
cron.schedule('0 */4 * * *', async () => {
  await deltaNomenclatureSync();
});

async function fullNomenclatureSync() {
  const orgId = process.env.SYRVE_ORGANIZATION_ID;
  const nomenclature = await syrveApi.getNomenclature(orgId, 0);
  
  // Update local database
  await updateLocalProductCatalog(nomenclature.products);
  
  // Store new revision
  await saveRevision(nomenclature.revision);
}

async function deltaNomenclatureSync() {
  const orgId = process.env.SYRVE_ORGANIZATION_ID;
  const lastRevision = await getLastRevision();
  
  const nomenclature = await syrveApi.getNomenclature(orgId, lastRevision);
  
  if (nomenclature.products.length > 0) {
    await updateLocalProductCatalog(nomenclature.products);
    await saveRevision(nomenclature.revision);
  }
}
```

---

<a name="data-models"></a>
## 8. Data Models & Schemas

### 8.1 Database Schema for Integration

```sql
-- Store Syrve configuration
CREATE TABLE syrve_config (
  id SERIAL PRIMARY KEY,
  organization_id VARCHAR(255) NOT NULL UNIQUE,
  organization_name VARCHAR(255),
  api_login_encrypted TEXT NOT NULL,
  base_url VARCHAR(255) DEFAULT 'https://api-eu.iiko.services',
  last_nomenclature_revision BIGINT DEFAULT 0,
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Store product mappings
CREATE TABLE wine_syrve_product_mappings (
  id SERIAL PRIMARY KEY,
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  syrve_product_id VARCHAR(255) NOT NULL,
  syrve_product_code VARCHAR(100),
  syrve_organization_id VARCHAR(255) NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00 (for fuzzy matches)
  match_method VARCHAR(50), -- 'exact_id', 'code', 'fuzzy_name', 'manual'
  mapped_at TIMESTAMP DEFAULT NOW(),
  mapped_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE(wine_id, syrve_organization_id)
);

CREATE INDEX idx_wine_syrve_mappings_wine ON wine_syrve_product_mappings(wine_id);
CREATE INDEX idx_wine_syrve_mappings_syrve ON wine_syrve_product_mappings(syrve_product_id);

-- Store sync history
CREATE TABLE syrve_sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL, -- 'nomenclature', 'stock_retrieval', 'stock_update'
  organization_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'success', 'partial', 'failed'
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  correlation_id VARCHAR(255),
  metadata JSONB, -- Store additional sync details
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_syrve_sync_logs_org ON syrve_sync_logs(organization_id);
CREATE INDEX idx_syrve_sync_logs_type ON syrve_sync_logs(sync_type, status);

-- Store write-off documents
CREATE TABLE syrve_writeoff_documents (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL UNIQUE, -- UUID sent to Syrve
  organization_id VARCHAR(255) NOT NULL,
  inventory_session_id UUID REFERENCES inventory_sessions(id),
  correlation_id VARCHAR(255), -- From Syrve response
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'success', 'failed'
  items_count INTEGER NOT NULL,
  total_amount DECIMAL(10,2),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  processed_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX idx_syrve_writeoff_docs_session ON syrve_writeoff_documents(inventory_session_id);
CREATE INDEX idx_syrve_writeoff_docs_status ON syrve_writeoff_documents(status);

-- Store write-off document items
CREATE TABLE syrve_writeoff_items (
  id SERIAL PRIMARY KEY,
  writeoff_document_id INTEGER NOT NULL REFERENCES syrve_writeoff_documents(id) ON DELETE CASCADE,
  wine_id UUID NOT NULL REFERENCES wines(id),
  syrve_product_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  sum_value DECIMAL(10,2) NOT NULL,
  item_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_syrve_writeoff_items_doc ON syrve_writeoff_items(writeoff_document_id);
```

### 8.2 TypeScript Data Models

```typescript
// Syrve Configuration
interface SyrveConfig {
  id: number;
  organizationId: string;
  organizationName: string;
  apiLoginEncrypted: string;
  baseUrl: string;
  lastNomenclatureRevision: number;
  lastSyncAt: Date | null;
  isActive: boolean;
}

// Product Mapping
interface WineSyrveMapping {
  id: number;
  wineId: string;
  syrveProductId: string;
  syrveProductCode: string | null;
  syrveOrganizationId: string;
  confidenceScore: number;
  matchMethod: 'exact_id' | 'code' | 'fuzzy_name' | 'manual';
  mappedAt: Date;
  mappedBy: string | null;
  isActive: boolean;
  notes: string | null;
}

// Sync Log
interface SyrveSyncLog {
  id: number;
  syncType: 'nomenclature' | 'stock_retrieval' | 'stock_update';
  organizationId: string;
  status: 'success' | 'partial' | 'failed';
  startedAt: Date;
  completedAt: Date | null;
  itemsProcessed: number;
  itemsFailed: number;
  errorMessage: string | null;
  correlationId: string | null;
  metadata: any;
}

// Write-off Document
interface SyrveWriteOffDocument {
  id: number;
  documentId: string;
  organizationId: string;
  inventorySessionId: string;
  correlationId: string | null;
  status: 'pending' | 'processing' | 'success' | 'failed';
  itemsCount: number;
  totalAmount: number;
  comment: string | null;
  createdAt: Date;
  submittedAt: Date | null;
  processedAt: Date | null;
  errorMessage: string | null;
}

// Write-off Item
interface SyrveWriteOffItem {
  id: number;
  writeoffDocumentId: number;
  wineId: string;
  syrveProductId: string;
  amount: number;
  sumValue: number;
  itemComment: string | null;
}
```

---

<a name="error-handling"></a>
## 9. Error Handling

### 9.1 Common Error Scenarios

| Error Code | HTTP Status | Description | Action |
|------------|-------------|-------------|--------|
| `InvalidApiLogin` | 401 | API login credentials invalid | Verify credentials, contact Syrve support |
| `TokenExpired` | 401 | Authentication token expired | Refresh token automatically |
| `LicenseInactive` | 403 | API license not active | Contact Syrve to activate license |
| `OrganizationNotFound` | 404 | Organization ID doesn't exist | Verify organization ID |
| `ProductNotFound` | 404 | Product ID doesn't exist in catalog | Re-sync nomenclature |
| `DuplicateDocument` | 409 | Document with same UUID already exists | Generate new UUID |
| `RateLimitExceeded` | 429 | Too many requests | Implement exponential backoff |
| `InternalServerError` | 500 | Syrve server error | Retry with exponential backoff |

### 9.2 Error Response Format

```typescript
interface SyrveErrorResponse {
  correlationId: string;
  error: string;
  errorDescription: string;
  additionalInfo?: any;
}
```

**Example Error Response:**
```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "error": "ProductNotFound",
  "errorDescription": "Product with ID 'invalid-uuid' not found in organization",
  "additionalInfo": {
    "productId": "invalid-uuid"
  }
}
```

### 9.3 Retry Logic Implementation

```typescript
class SyrveApiClient {
  private maxRetries = 3;
  private baseDelayMs = 1000;

  async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>,
    isRetryable: (error: any) => boolean = () => true
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;

        // Don't retry non-retryable errors
        if (!isRetryable(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries - 1) {
          break;
        }

        // Calculate exponential backoff delay
        const delayMs = this.baseDelayMs * Math.pow(2, attempt);
        
        // Add jitter (random 0-500ms)
        const jitter = Math.random() * 500;
        
        console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} after ${delayMs + jitter}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delayMs + jitter));
      }
    }

    throw lastError;
  }

  isRetryableError(error: any): boolean {
    if (!error.response) return true; // Network errors are retryable

    const status = error.response.status;
    
    // Retry on server errors and rate limits
    if (status >= 500 || status === 429) {
      return true;
    }

    // Don't retry client errors (400-499 except 429)
    return false;
  }
}
```

### 9.4 Error Logging

```typescript
interface ErrorLog {
  timestamp: Date;
  operation: string;
  errorType: string;
  errorMessage: string;
  correlationId: string | null;
  requestPayload: any;
  responsePayload: any;
  stackTrace: string;
}

async function logSyrveError(error: any, context: any) {
  const errorLog: ErrorLog = {
    timestamp: new Date(),
    operation: context.operation,
    errorType: error.name || 'UnknownError',
    errorMessage: error.message,
    correlationId: error.response?.data?.correlationId || null,
    requestPayload: sanitizePayload(context.request),
    responsePayload: error.response?.data || null,
    stackTrace: error.stack
  };

  // Log to database
  await db.query(
    `INSERT INTO error_logs (timestamp, operation, error_type, error_message, correlation_id, request_payload, response_payload, stack_trace)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      errorLog.timestamp,
      errorLog.operation,
      errorLog.errorType,
      errorLog.errorMessage,
      errorLog.correlationId,
      JSON.stringify(errorLog.requestPayload),
      JSON.stringify(errorLog.responsePayload),
      errorLog.stackTrace
    ]
  );

  // Also log to monitoring service (Sentry, etc.)
  Sentry.captureException(error, {
    contexts: {
      syrve: errorLog
    }
  });
}

function sanitizePayload(payload: any): any {
  // Remove sensitive data before logging
  const sanitized = { ...payload };
  if (sanitized.apiLogin) sanitized.apiLogin = '***REDACTED***';
  if (sanitized.token) sanitized.token = '***REDACTED***';
  return sanitized;
}
```

---

<a name="webhooks"></a>
## 10. Webhooks & Real-time Updates

### 10.1 Webhook Overview

Syrve can send webhook notifications for various events. This enables real-time updates without polling.

**Supported Events:**
- `StopListUpdate` - Product goes out of stock or back in stock
- `OrderCreated` - New order created (affects stock)
- `OrderClosed` - Order completed (stock consumed)

**Setup:**
1. Configure webhook URL in Syrve admin panel
2. Implement webhook receiver endpoint
3. Validate webhook signatures
4. Process events asynchronously

### 10.2 Webhook Endpoint Implementation

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();

// Webhook receiver endpoint
app.post('/api/webhooks/syrve', express.json(), async (req, res) => {
  try {
    // Validate webhook signature
    const signature = req.headers['x-syrve-signature'] as string;
    const isValid = validateWebhookSignature(req.body, signature);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook payload
    const webhook: SyrveWebhook = req.body;

    // Acknowledge receipt immediately (Syrve expects 200 within 5 seconds)
    res.status(200).json({ received: true });

    // Process webhook asynchronously
    processWebhookAsync(webhook).catch(error => {
      console.error('Webhook processing error:', error);
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface SyrveWebhook {
  eventType: 'StopListUpdate' | 'OrderCreated' | 'OrderClosed';
  eventTime: string;
  organizationId: string;
  correlationId: string;
  eventInfo: any;
}

function validateWebhookSignature(payload: any, signature: string): boolean {
  const webhookSecret = process.env.SYRVE_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const hmac = crypto.createHmac('sha256', webhookSecret);
  const expectedSignature = hmac.update(JSON.stringify(payload)).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function processWebhookAsync(webhook: SyrveWebhook) {
  switch (webhook.eventType) {
    case 'StopListUpdate':
      await handleStopListUpdate(webhook);
      break;
    case 'OrderCreated':
      await handleOrderCreated(webhook);
      break;
    case 'OrderClosed':
      await handleOrderClosed(webhook);
      break;
  }
}

async function handleStopListUpdate(webhook: SyrveWebhook) {
  const { productId, balance } = webhook.eventInfo;

  // Update local cache
  await db.query(
    'UPDATE wine_stock_cache SET balance = $1, updated_at = NOW() WHERE syrve_product_id = $2',
    [balance, productId]
  );

  // Notify active inventory sessions via WebSocket
  broadcastStockUpdate(productId, balance);
}
```

### 10.3 WebSocket Notifications to Clients

```typescript
import { Server as SocketIOServer } from 'socket.io';

const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.CLIENT_URL }
});

function broadcastStockUpdate(productId: string, newBalance: number) {
  // Emit to all connected clients in active inventory sessions
  io.to('inventory-session').emit('stock-update', {
    productId,
    balance: newBalance,
    timestamp: new Date()
  });
}

// Client-side (React)
useEffect(() => {
  const socket = io(API_URL);

  socket.on('stock-update', (data) => {
    // Update UI with new stock level
    updateStockInUI(data.productId, data.balance);
  });

  return () => socket.disconnect();
}, []);
```

---

<a name="implementation"></a>
## 11. Implementation Guide

### 11.1 Implementation Phases

#### Phase 1: Setup & Authentication (Week 1)
- [ ] Obtain Syrve API credentials
- [ ] Set up development/staging environment
- [ ] Implement authentication service
- [ ] Test token generation and refresh
- [ ] Store encrypted credentials securely

#### Phase 2: Product Synchronization (Week 2)
- [ ] Implement nomenclature sync
- [ ] Create product matching logic
- [ ] Build admin mapping interface
- [ ] Set up automated sync cron jobs
- [ ] Test with production wine catalog

#### Phase 3: Stock Retrieval (Week 3)
- [ ] Implement stock retrieval on inventory start
- [ ] Create stock cache in local database
- [ ] Display Syrve stock in inventory UI
- [ ] Handle unmapped products gracefully

#### Phase 4: Stock Updates (Week 4)
- [ ] Implement write-off document creation
- [ ] Add variance calculation logic
- [ ] Build status polling mechanism
- [ ] Create retry and error handling
- [ ] Test end-to-end inventory flow

#### Phase 5: Webhooks & Real-time (Week 5)
- [ ] Set up webhook endpoint
- [ ] Implement signature validation
- [ ] Add WebSocket notifications
- [ ] Test real-time updates

#### Phase 6: Testing & Optimization (Week 6)
- [ ] Integration testing with Syrve sandbox
- [ ] Load testing for sync operations
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation

### 11.2 Quick Start Code

```typescript
// File: src/services/SyrveService.ts

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class SyrveService {
  private baseUrl: string;
  private apiLogin: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private client: AxiosInstance;

  constructor(apiLogin: string, region: 'eu' | 'ru' = 'eu') {
    this.apiLogin = apiLogin;
    this.baseUrl = region === 'eu' 
      ? 'https://api-eu.iiko.services'
      : 'https://api-ru.iiko.services';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Authentication
  async authenticate(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    const response = await this.client.post('/api/1/access_token', {
      apiLogin: this.apiLogin
    });

    this.token = response.data.token;
    this.tokenExpiry = new Date(Date.now() + response.data.tokenLifeTime * 1000);

    return this.token;
  }

  private async getAuthHeaders() {
    const token = await this.authenticate();
    return { Authorization: `Bearer ${token}` };
  }

  // Get Organizations
  async getOrganizations() {
    const headers = await this.getAuthHeaders();
    const response = await this.client.post('/api/1/organizations', {
      returnAdditionalInfo: true,
      includeDisabled: false
    }, { headers });

    return response.data;
  }

  // Get Nomenclature (Products)
  async getNomenclature(organizationId: string, startRevision: number = 0) {
    const headers = await this.getAuthHeaders();
    const response = await this.client.post('/api/1/nomenclature', {
      organizationId,
      startRevision
    }, { headers });

    return response.data;
  }

  // Create Write-Off Document
  async createWriteOff(
    organizationId: string,
    items: Array<{ productId: string; amount: number; sum: number; comment?: string }>,
    comment: string
  ) {
    const headers = await this.getAuthHeaders();
    const documentId = uuidv4();

    const response = await this.client.post('/api/1/documents/writeoff/create', {
      organizationId,
      documentId,
      dateIncoming: new Date().toISOString(),
      comment,
      items
    }, { headers });

    return {
      documentId,
      correlationId: response.data.correlationId
    };
  }

  // Check Command Status
  async checkCommandStatus(organizationId: string, correlationId: string) {
    const headers = await this.getAuthHeaders();
    const response = await this.client.post('/api/1/commands/status', {
      organizationId,
      correlationId
    }, { headers });

    return response.data;
  }
}

// Usage Example
async function main() {
  const syrve = new SyrveService(process.env.SYRVE_API_LOGIN!, 'eu');

  // Get organizations
  const orgs = await syrve.getOrganizations();
  const orgId = orgs.organizations[0].id;

  // Get products
  const nomenclature = await syrve.getNomenclature(orgId);
  console.log(`Found ${nomenclature.products.length} products`);

  // Create write-off (example: 2 bottles of wine damaged)
  const result = await syrve.createWriteOff(
    orgId,
    [
      {
        productId: nomenclature.products[0].id,
        amount: 2,
        sum: 50.00,
        comment: 'Damaged during inventory'
      }
    ],
    'Physical inventory - Session #123'
  );

  console.log('Write-off created:', result);

  // Check status
  const status = await syrve.checkCommandStatus(orgId, result.correlationId);
  console.log('Status:', status);
}
```

### 11.3 Environment Variables

```bash
# .env file

# Syrve API Configuration
SYRVE_API_LOGIN=your_api_login_here
SYRVE_ORGANIZATION_ID=7bc05553-4b68-44e8-b7bc-37be63c6d9e9
SYRVE_REGION=eu  # or 'ru'
SYRVE_BASE_URL=https://api-eu.iiko.services

# Webhook Configuration
SYRVE_WEBHOOK_SECRET=your_webhook_secret_here
SYRVE_WEBHOOK_URL=https://your-domain.com/api/webhooks/syrve

# Sync Configuration
SYRVE_FULL_SYNC_CRON=0 3 * * *  # Daily at 3 AM
SYRVE_DELTA_SYNC_CRON=0 */4 * * *  # Every 4 hours
SYRVE_MAX_RETRIES=3
SYRVE_RETRY_DELAY_MS=1000

# Security
SYRVE_CREDENTIALS_ENCRYPTION_KEY=your_encryption_key_here
```

---

<a name="security"></a>
## 12. Security Best Practices

### 12.1 Credential Management

**DO:**
- ✅ Store API login in environment variables or secret manager (AWS Secrets Manager, Azure Key Vault)
- ✅ Encrypt API credentials in database using AES-256
- ✅ Use separate credentials for development/staging/production
- ✅ Rotate API credentials periodically
- ✅ Log all API calls with sanitized payloads

**DON'T:**
- ❌ Store API credentials in code
- ❌ Commit credentials to version control
- ❌ Share production credentials with developers
- ❌ Log full request/response payloads with tokens

### 12.2 Network Security

```typescript
// Use HTTPS only
const https = require('https');
const agent = new https.Agent({
  rejectUnauthorized: true,  // Reject invalid SSL certificates
  minVersion: 'TLSv1.2'       // Minimum TLS version
});

axios.create({
  httpsAgent: agent
});
```

### 12.3 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Rate limit Syrve webhook endpoint
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,              // Max 100 requests per minute
  message: 'Too many webhook requests'
});

app.post('/api/webhooks/syrve', webhookLimiter, webhookHandler);

// Internal rate limiter for Syrve API calls
class RateLimiter {
  private requestCounts: Map<string, number[]> = new Map();

  async checkLimit(endpoint: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const requests = this.requestCounts.get(endpoint) || [];

    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);

    if (recentRequests.length >= limit) {
      return false; // Rate limit exceeded
    }

    recentRequests.push(now);
    this.requestCounts.set(endpoint, recentRequests);

    return true;
  }
}
```

---

<a name="testing"></a>
## 13. Testing Strategy

### 13.1 Unit Tests

```typescript
// tests/SyrveService.test.ts

import { SyrveService } from '../src/services/SyrveService';
import nock from 'nock';

describe('SyrveService', () => {
  let syrve: SyrveService;

  beforeEach(() => {
    syrve = new SyrveService('test-api-login', 'eu');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should authenticate and get token', async () => {
    nock('https://api-eu.iiko.services')
      .post('/api/1/access_token', { apiLogin: 'test-api-login' })
      .reply(200, {
        correlationId: 'test-correlation-id',
        token: 'test-token',
        tokenLifeTime: 3600
      });

    const token = await syrve.authenticate();
    expect(token).toBe('test-token');
  });

  it('should get organizations', async () => {
    // Mock authentication
    nock('https://api-eu.iiko.services')
      .post('/api/1/access_token')
      .reply(200, { token: 'test-token', tokenLifeTime: 3600 });

    // Mock organizations request
    nock('https://api-eu.iiko.services')
      .post('/api/1/organizations')
      .reply(200, {
        correlationId: 'test-correlation-id',
        organizations: [
          { id: 'org-uuid', name: 'Test Restaurant' }
        ]
      });

    const orgs = await syrve.getOrganizations();
    expect(orgs.organizations).toHaveLength(1);
  });

  it('should create write-off document', async () => {
    nock('https://api-eu.iiko.services')
      .post('/api/1/access_token')
      .reply(200, { token: 'test-token', tokenLifeTime: 3600 });

    nock('https://api-eu.iiko.services')
      .post('/api/1/documents/writeoff/create')
      .reply(200, {
        correlationId: 'write-off-correlation-id',
        documentId: 'document-uuid'
      });

    const result = await syrve.createWriteOff(
      'org-uuid',
      [{ productId: 'product-uuid', amount: 2, sum: 50 }],
      'Test write-off'
    );

    expect(result.documentId).toBeDefined();
    expect(result.correlationId).toBe('write-off-correlation-id');
  });
});
```

### 13.2 Integration Tests

```typescript
// tests/integration/SyrveIntegration.test.ts

describe('Syrve Integration', () => {
  let orgId: string;

  beforeAll(async () => {
    // Use Syrve sandbox/test environment
    const orgs = await syrve.getOrganizations();
    orgId = orgs.organizations[0].id;
  });

  it('should complete full inventory sync workflow', async () => {
    // 1. Get nomenclature
    const nomenclature = await syrve.getNomenclature(orgId);
    expect(nomenclature.products.length).toBeGreaterThan(0);

    // 2. Simulate inventory count
    const testProduct = nomenclature.products[0];
    const variance = -2; // 2 bottles short

    // 3. Create write-off
    const writeOff = await syrve.createWriteOff(
      orgId,
      [{
        productId: testProduct.id,
        amount: Math.abs(variance),
        sum: Math.abs(variance) * 25.00,
        comment: 'Test variance'
      }],
      'Integration test - inventory variance'
    );

    expect(writeOff.documentId).toBeDefined();

    // 4. Poll status until success
    let attempts = 0;
    let status;
    while (attempts < 10) {
      status = await syrve.checkCommandStatus(orgId, writeOff.correlationId);
      
      if (status.state === 'Success' || status.state === 'Error') {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    expect(status.state).toBe('Success');
  });
});
```

---

<a name="monitoring"></a>
## 14. Monitoring & Logging

### 14.1 Logging Strategy

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/syrve-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/syrve-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Log all Syrve API calls
function logApiCall(method: string, endpoint: string, duration: number, status: number) {
  logger.info('Syrve API Call', {
    method,
    endpoint,
    duration_ms: duration,
    status,
    timestamp: new Date()
  });
}

// Log sync operations
function logSyncOperation(type: string, itemsProcessed: number, duration: number, errors: any[]) {
  logger.info('Syrve Sync', {
    type,
    items_processed: itemsProcessed,
    duration_ms: duration,
    errors_count: errors.length,
    errors: errors.slice(0, 10) // Log first 10 errors
  });
}
```

### 14.2 Metrics & Alerting

```typescript
// Prometheus metrics
import promClient from 'prom-client';

const syrveApiCallsTotal = new promClient.Counter({
  name: 'syrve_api_calls_total',
  help: 'Total number of Syrve API calls',
  labelNames: ['endpoint', 'status']
});

const syrveApiDuration = new promClient.Histogram({
  name: 'syrve_api_duration_seconds',
  help: 'Duration of Syrve API calls',
  labelNames: ['endpoint']
});

const syrveSyncErrors = new promClient.Counter({
  name: 'syrve_sync_errors_total',
  help: 'Total number of sync errors',
  labelNames: ['type']
});

// Increment metrics
syrveApiCallsTotal.inc({ endpoint: '/nomenclature', status: '200' });
syrveApiDuration.observe({ endpoint: '/nomenclature' }, 1.5);
syrveSyncErrors.inc({ type: 'product_mapping' });
```

### 14.3 Health Checks

```typescript
app.get('/health/syrve', async (req, res) => {
  try {
    // Check if we can authenticate
    await syrve.authenticate();

    // Check last sync time
    const lastSync = await getLastSyncTime();
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    const health = {
      status: hoursSinceSync < 24 ? 'healthy' : 'degraded',
      last_sync: lastSync,
      hours_since_sync: hoursSinceSync,
      authentication: 'ok'
    };

    res.status(hoursSinceSync < 24 ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

## 15. Complete Integration Workflow Example

### 15.1 End-to-End Scenario

**Scenario:** Restaurant staff performs weekly wine inventory count and syncs with Syrve.

```typescript
async function performInventoryWithSyrveSync(sessionId: string) {
  const logger = getLogger('inventory-sync');
  
  try {
    // ========================================
    // STEP 1: Start Inventory Session
    // ========================================
    logger.info('Starting inventory session', { sessionId });
    
    const session = await db.query(
      'INSERT INTO inventory_sessions (id, status, started_at, started_by) VALUES ($1, $2, NOW(), $3) RETURNING *',
      [sessionId, 'in_progress', 'user-uuid']
    );

    // ========================================
    // STEP 2: Get Current Stock from Syrve
    // ========================================
    logger.info('Fetching stock from Syrve');
    
    const syrve = new SyrveService(process.env.SYRVE_API_LOGIN!, 'eu');
    const orgId = process.env.SYRVE_ORGANIZATION_ID!;
    
    // Get nomenclature with products
    const nomenclature = await syrve.getNomenclature(orgId);
    logger.info(`Retrieved ${nomenclature.products.length} products from Syrve`);

    // Store baseline stock
    const baselineStock = new Map<string, number>();
    
    for (const product of nomenclature.products) {
      // In Syrve, stock balance would come from inventory documents
      // For simplicity, we'll assume balance from local cache or manual entry
      const mapping = await findWineMapping(product.id);
      if (mapping) {
        const currentBalance = await getSyrveProductBalance(product.id);
        baselineStock.set(mapping.wineId, currentBalance);
        
        await db.query(
          'INSERT INTO inventory_items (session_id, wine_id, expected_quantity, counted_quantity) VALUES ($1, $2, $3, 0)',
          [sessionId, mapping.wineId, currentBalance]
        );
      }
    }

    // ========================================
    // STEP 3: Staff Performs Physical Count
    // ========================================
    // (This happens in the mobile app - not shown here)
    // Staff scans/counts bottles and updates inventory_items.counted_quantity

    // ========================================
    // STEP 4: Calculate Variances
    // ========================================
    logger.info('Calculating inventory variances');
    
    const items = await db.query(
      'SELECT * FROM inventory_items WHERE session_id = $1',
      [sessionId]
    );

    const variances: Array<{
      wineId: string;
      syrveProductId: string;
      expected: number;
      counted: number;
      variance: number;
    }> = [];

    for (const item of items.rows) {
      const variance = item.counted_quantity - item.expected_quantity;
      
      if (variance !== 0) {
        const mapping = await getWineMapping(item.wine_id);
        variances.push({
          wineId: item.wine_id,
          syrveProductId: mapping.syrveProductId,
          expected: item.expected_quantity,
          counted: item.counted_quantity,
          variance
        });
      }
    }

    logger.info(`Found ${variances.length} variances`);

    // ========================================
    // STEP 5: Create Write-Off Documents in Syrve
    // ========================================
    const writeOffItems: any[] = [];
    const purchaseItems: any[] = [];

    for (const v of variances) {
      if (v.variance < 0) {
        // Shortage - create write-off
        writeOffItems.push({
          productId: v.syrveProductId,
          amount: Math.abs(v.variance),
          sum: Math.abs(v.variance) * 25.00, // Assuming $25/bottle
          comment: `Inventory variance: Expected ${v.expected}, Counted ${v.counted}`
        });
      } else {
        // Excess - create purchase document
        purchaseItems.push({
          productId: v.syrveProductId,
          amount: v.variance,
          sum: v.variance * 25.00,
          price: 25.00,
          comment: `Inventory excess: Expected ${v.expected}, Counted ${v.counted}`
        });
      }
    }

    // Create write-off if there are shortages
    let writeOffResult;
    if (writeOffItems.length > 0) {
      logger.info(`Creating write-off for ${writeOffItems.length} items`);
      
      writeOffResult = await syrve.createWriteOff(
        orgId,
        writeOffItems,
        `Physical inventory count - Session ${sessionId}`
      );

      // Store write-off document
      await db.query(
        'INSERT INTO syrve_writeoff_documents (document_id, organization_id, inventory_session_id, correlation_id, status, items_count, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [
          writeOffResult.documentId,
          orgId,
          sessionId,
          writeOffResult.correlationId,
          'pending',
          writeOffItems.length
        ]
      );

      // Poll status
      logger.info('Polling write-off status');
      const writeOffSuccess = await pollDocumentStatus(
        syrve,
        orgId,
        writeOffResult.correlationId
      );

      if (writeOffSuccess) {
        logger.info('Write-off processed successfully');
        await db.query(
          'UPDATE syrve_writeoff_documents SET status = $1, processed_at = NOW() WHERE document_id = $2',
          ['success', writeOffResult.documentId]
        );
      } else {
        throw new Error('Write-off processing failed');
      }
    }

    // ========================================
    // STEP 6: Complete Inventory Session
    // ========================================
    await db.query(
      'UPDATE inventory_sessions SET status = $1, completed_at = NOW(), synced_with_syrve = $2 WHERE id = $3',
      ['completed', true, sessionId]
    );

    logger.info('Inventory session completed and synced with Syrve', {
      sessionId,
      variances: variances.length,
      writeOffItems: writeOffItems.length,
      purchaseItems: purchaseItems.length
    });

    return {
      success: true,
      sessionId,
      variances: variances.length,
      syncedToSyrve: true
    };

  } catch (error) {
    logger.error('Inventory sync failed', { sessionId, error });
    
    await db.query(
      'UPDATE inventory_sessions SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error.message, sessionId]
    );

    throw error;
  }
}

async function pollDocumentStatus(
  syrve: SyrveService,
  orgId: string,
  correlationId: string,
  maxAttempts: number = 10
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await syrve.checkCommandStatus(orgId, correlationId);
    
    if (status.state === 'Success') {
      return true;
    }
    
    if (status.state === 'Error') {
      throw new Error(`Document processing failed: ${status.errorDescription}`);
    }
    
    // Wait before next check (exponential backoff)
    await new Promise(resolve => 
      setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 10000))
    );
  }
  
  throw new Error('Document processing timeout');
}
```

---

## 16. Troubleshooting Guide

### Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **401 Unauthorized** | All API calls return 401 | Verify API login credentials, check license activation |
| **Token expired** | Intermittent 401 errors | Implement automatic token refresh with buffer time |
| **Product not found** | 404 when creating write-off | Re-sync nomenclature, verify product ID mapping |
| **Duplicate document** | 409 error on write-off | Generate new UUID for each document |
| **Rate limit** | 429 errors | Implement exponential backoff, reduce request frequency |
| **Webhook not received** | No real-time updates | Check webhook URL configuration in Syrve admin |
| **Signature validation fails** | Webhooks rejected | Verify webhook secret, check HMAC implementation |
| **Mapping failures** | Many wines unmapped | Review matching logic, add manual mapping interface |
| **Sync delays** | Stock out of sync | Increase sync frequency, enable webhooks |

---

## 17. Appendices

### Appendix A: API Endpoint Quick Reference

```
Authentication:
POST /api/1/access_token

Organization:
POST /api/1/organizations

Products:
POST /api/1/nomenclature

Stock:
POST /api/1/stop_lists

Inventory Operations:
POST /api/1/documents/writeoff/create
POST /api/1/documents/purchase/create
POST /api/1/commands/status
```

### Appendix B: Rate Limits Summary

| Endpoint | Rate Limit |
|----------|------------|
| `/access_token` | 10 req/min |
| `/organizations` | 60 req/min |
| `/nomenclature` | 30 req/min |
| `/stop_lists` | 60 req/min |
| `/documents/*/create` | 30 req/min |
| `/commands/status` | 120 req/min |

### Appendix C: Support Resources

- **Syrve API Support:** api@iiko.ru
- **Documentation:** https://api-ru.iiko.services/docs (requires authentication)
- **GitHub Examples:** https://github.com/kebrick/pyiikocloudapi
- **Community:** Syrve developer forums

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 9, 2026 | Integration Team | Initial comprehensive specification |

---

**END OF DOCUMENT**
