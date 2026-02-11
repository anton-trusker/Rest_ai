# Phase 14: Performance Optimization

## Overview

Optimize application performance for fast load times and smooth user experience.

---

## Bundle Optimization

### Code Splitting

```typescript
// src/App.tsx - Lazy load routes
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const WineCatalog = lazy(() => import("./pages/WineCatalog"));
const InventoryCount = lazy(() => import("./pages/InventoryCount"));
const Reports = lazy(() => import("./pages/Reports"));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/catalog/*" element={<WineCatalog />} />
        <Route path="/count" element={<InventoryCount />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Suspense>
  );
}
```

### Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          query: ["@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
    target: "esnext",
    minify: "esbuild",
  },
});
```

---

## Query Optimization

### Stale Time Configuration

```typescript
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      cacheTime: 30 * 60 * 1000,   // 30 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});
```

### Select Only Needed Columns

```typescript
// BAD: Select all
const { data } = await supabase.from("wines").select("*");

// GOOD: Select only needed
const { data } = await supabase
  .from("wines")
  .select("id, name, producer, vintage, current_stock_unopened");
```

---

## Image Optimization

```typescript
// Image compression before upload
async function compressImage(file: File, maxWidth = 800): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const img = await createImageBitmap(file);

  const scale = Math.min(maxWidth / img.width, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.8);
  });
}
```

---

## Database Indexes

Key indexes for performance:

```sql
-- Wine searches
CREATE INDEX idx_wines_name ON wines USING gin(to_tsvector('english', name));
CREATE INDEX idx_wines_producer ON wines(producer);
CREATE INDEX idx_wines_stock_status ON wines(stock_status) WHERE is_active = true;

-- Session queries
CREATE INDEX idx_sessions_status ON inventory_sessions(status);
CREATE INDEX idx_items_session ON inventory_items(session_id);

-- Audit queries
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Bundle Size (gzip) | < 200KB |
| Lighthouse Score | > 90 |

---

## Next Phase

→ [Phase 15: Deployment](./phase-15-deployment.md)
