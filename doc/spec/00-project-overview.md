# Wine Inventory Management System

## Project Overview

An AI-powered wine inventory management system designed for restaurants and wine bars. The system combines modern web technologies with AI image recognition and POS integration to streamline wine inventory counting and tracking.

---

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase and OpenAI credentials

# Start development server
npm run dev
```

Access the application at `http://localhost:8080`

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI Framework** | shadcn/ui + Tailwind CSS |
| **State Management** | Zustand (5 stores) |
| **Data Fetching** | TanStack React Query |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **AI/ML** | OpenAI Vision API |
| **POS Integration** | Syrve (iiko) API |

---

## Key Features

- **Wine Catalog Management** - Complete wine database with variants, vintages, and pricing
- **AI Image Recognition** - Scan wine labels using camera for automatic identification
- **Barcode Scanning** - Quick bottle identification via UPC/EAN codes
- **Inventory Counting** - Session-based counting with closed/open bottle tracking
- **Stock Monitoring** - Real-time stock levels with par level alerts
- **User Management** - Role-based access (Admin/Staff) with permission controls
- **Audit Trail** - Complete history of all inventory actions
- **Syrve Integration** - Bi-directional sync with Syrve POS system

---

## Directory Structure

```
inventory_ai/
├── doc/                    # Documentation
│   ├── spec/              # Technical specifications (this folder)
│   └── *.md               # Legacy documentation
├── src/
│   ├── components/        # React components (66 files)
│   │   ├── count/        # Inventory counting components
│   │   └── ui/           # shadcn/ui primitives
│   ├── data/             # Mock data and reference data
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service integrations
│   │   └── supabase/    # Supabase client and types
│   ├── pages/            # Route components (18 pages)
│   ├── stores/           # Zustand state stores
│   └── utils/            # Utility functions
├── supabase/             # Supabase configuration
└── public/               # Static assets
```

---

## Application Routes

| Route | Page | Access |
|-------|------|--------|
| `/login` | Login | Public |
| `/dashboard` | Dashboard | All users |
| `/catalog` | Wine Catalog | All users |
| `/catalog/new` | Add Wine | Admin |
| `/catalog/:id` | Wine Detail | All users |
| `/catalog/:id/edit` | Edit Wine | Admin |
| `/catalog/import` | Import Inventory | Admin |
| `/count` | Inventory Count | All users |
| `/stock` | Current Stock | Admin only |
| `/history` | Inventory History | All users |
| `/sessions` | Session Review | Admin |
| `/users` | User Management | Admin |
| `/reports` | Reports | Admin |
| `/settings` | App Settings | Admin |
| `/profile` | User Profile | All users |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [01-architecture.md](./01-architecture.md) | System architecture & tech stack |
| [02-database-schema.md](./02-database-schema.md) | Database tables & relationships |
| [03-api-reference.md](./03-api-reference.md) | Supabase API documentation |
| [04-features.md](./04-features.md) | Feature specifications |
| [05-ai-integration.md](./05-ai-integration.md) | AI/ML capabilities |
| [06-ui-components.md](./06-ui-components.md) | Component library |
| [07-user-flows.md](./07-user-flows.md) | User journey documentation |
| [08-syrve-integration.md](./08-syrve-integration.md) | POS integration |
| [09-security.md](./09-security.md) | Security & authentication |

---

## User Roles

| Role | Capabilities |
|------|--------------|
| **Admin** | Full access: wine catalog, stock levels, user management, reports, audit logs |
| **Staff** | Limited access: inventory counting, personal history, profile (Cannot view current stock to prevent counting bias) |

---

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_SYRVE_API_LOGIN=your_syrve_api_login
```

---

## Related Documents

- [Wine-Inventory-Complete-Solution.md](../Wine-Inventory-Complete-Solution.md) - Original solution document
- [Wine_Inventory_Database_Complete.docx.md](../Wine_Inventory_Database_Complete.docx.md) - Full database documentation
- [Wine_Inventory_Management_Solution.docx.md](../Wine_Inventory_Management_Solution.docx.md) - Technical solution
- [Wine_Inventory_User_Flows_Complete.docx.md](../Wine_Inventory_User_Flows_Complete.docx.md) - User flow specifications
- [Wine_Inventory_Syrve_Integration_Complete.md](../Wine_Inventory_Syrve_Integration_Complete.md) - Syrve API integration
