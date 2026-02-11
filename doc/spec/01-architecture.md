# System Architecture

## Overview

The Wine Inventory Management System follows a modern JAMstack architecture with a React frontend and Supabase backend-as-a-service.

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Web["Web Application<br/>React + Vite"]
        Mobile["Mobile Browser<br/>Responsive PWA"]
    end

    subgraph Frontend["Frontend Architecture"]
        Router["React Router v6"]
        Query["React Query<br/>Server State"]
        Zustand["Zustand<br/>Client State"]
        UI["shadcn/ui + Tailwind"]
    end

    subgraph Backend["Supabase Backend"]
        Auth["Supabase Auth"]
        DB["PostgreSQL"]
        Storage["Supabase Storage"]
        RLS["Row Level Security"]
    end

    subgraph External["External Services"]
        OpenAI["OpenAI Vision API"]
        Syrve["Syrve/iiko API"]
    end

    Client --> Frontend
    Frontend --> Backend
    Frontend --> External
```

---

## Frontend Architecture

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| React Router | 6.x | Client-side routing |
| TanStack Query | 5.x | Server state management |
| Zustand | 4.x | Client state management |
| shadcn/ui | Latest | UI component library |
| Tailwind CSS | 3.x | Utility-first styling |

### State Management

```mermaid
flowchart LR
    subgraph Zustand["Zustand Stores"]
        Auth["authStore<br/>User session"]
        Session["sessionStore<br/>Inventory sessions"]
        Settings["settingsStore<br/>App configuration"]
        Theme["themeStore<br/>Dark/Light mode"]
        Column["columnStore<br/>Table columns"]
    end

    subgraph ReactQuery["React Query"]
        Wines["Wine catalog"]
        Stock["Stock levels"]
        History["Count history"]
        Users["User data"]
    end

    Components --> Zustand
    Components --> ReactQuery
    ReactQuery --> Supabase
```

### Store Details

| Store | File | Purpose |
|-------|------|---------|
| `authStore` | `stores/authStore.ts` | User authentication state, role, permissions |
| `sessionStore` | `stores/sessionStore.ts` | Current inventory counting session |
| `settingsStore` | `stores/settingsStore.ts` | Application settings, preferences |
| `themeStore` | `stores/themeStore.ts` | Dark/light theme toggle |
| `columnStore` | `stores/columnStore.ts` | DataTable column visibility |

---

## Component Architecture

```mermaid
flowchart TB
    App["App.tsx"]
    
    subgraph Layout["Layout Components"]
        AppLayout["AppLayout"]
        AppSidebar["AppSidebar"]
        MobileNav["MobileBottomNav"]
    end

    subgraph Pages["Page Components"]
        Dashboard
        WineCatalog
        InventoryCount
        CurrentStock
        UserManagement
    end

    subgraph Count["Count Components"]
        CameraScanner
        ManualSearchSheet
        QuantityPopup
        SessionSummary
    end

    subgraph Shared["Shared Components"]
        DataTable
        FilterManager
        ColumnManager
        UserFormDialog
    end

    App --> Layout
    Layout --> Pages
    Pages --> Count
    Pages --> Shared
```

### Component Categories

| Category | Location | Count | Description |
|----------|----------|-------|-------------|
| Pages | `src/pages/` | 18 | Route-level components |
| UI Primitives | `src/components/ui/` | 49 | shadcn/ui base components |
| Count | `src/components/count/` | 6 | Inventory counting flow |
| Layout | `src/components/` | 11 | App structure components |

---

## Backend Architecture (Supabase)

### Services Used

| Service | Purpose |
|---------|---------|
| **Auth** | User authentication, session management |
| **Database** | PostgreSQL with RLS policies |
| **Storage** | Wine images, uploaded photos |
| **Edge Functions** | AI processing (future) |

### Database Connection

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## Data Flow Patterns

### Read Flow (React Query)

```mermaid
sequenceDiagram
    participant C as Component
    participant Q as React Query
    participant S as Supabase
    participant DB as PostgreSQL

    C->>Q: useQuery('wines')
    Q->>S: supabase.from('wines').select()
    S->>DB: SELECT with RLS
    DB-->>S: Filtered rows
    S-->>Q: Wine data
    Q-->>C: { data, isLoading, error }
```

### Write Flow (Mutations)

```mermaid
sequenceDiagram
    participant C as Component
    participant Q as React Query
    participant S as Supabase
    participant DB as PostgreSQL

    C->>Q: useMutation()
    Q->>S: supabase.from('wines').insert()
    S->>DB: INSERT with RLS check
    DB-->>S: Inserted row
    S-->>Q: Success
    Q->>Q: Invalidate queries
    Q-->>C: Update UI
```

---

## External Integrations

### OpenAI Vision API

Used for wine label recognition during inventory counting.

```mermaid
flowchart LR
    Camera["Camera Capture"] --> Image["Base64 Image"]
    Image --> OpenAI["OpenAI Vision API"]
    OpenAI --> Parse["Parse Response"]
    Parse --> Match["Match to Catalog"]
    Match --> Result["Wine ID + Confidence"]
```

### Syrve (iiko) POS Integration

Bi-directional stock synchronization with restaurant POS.

```mermaid
flowchart TB
    subgraph WineInventory["Wine Inventory"]
        Session["Inventory Session"]
        Update["Stock Update"]
    end

    subgraph Syrve["Syrve API"]
        Stock["Get Stock"]
        WriteOff["Write-off Document"]
    end

    Session --> Stock
    Stock --> Session
    Update --> WriteOff
```

---

## Security Architecture

```mermaid
flowchart TB
    User["User Request"]
    
    subgraph Auth["Authentication"]
        Login["Supabase Auth"]
        JWT["JWT Token"]
        Session["Session"]
    end

    subgraph Authorization["Authorization"]
        Role["User Role<br/>Admin/Staff"]
        RLS["Row Level Security"]
        UI["UI Permission Checks"]
    end

    User --> Auth
    Auth --> Authorization
    Authorization --> Database
```

See [09-security.md](./09-security.md) for detailed security documentation.

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph Build["Build Process"]
        Vite["Vite Build"]
        Assets["Static Assets"]
    end

    subgraph Hosting["Hosting Options"]
        Vercel["Vercel"]
        Netlify["Netlify"]
        S3["AWS S3 + CloudFront"]
    end

    subgraph Backend["Backend Services"]
        Supabase["Supabase Cloud"]
    end

    Build --> Hosting
    Hosting --> Backend
```

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```
