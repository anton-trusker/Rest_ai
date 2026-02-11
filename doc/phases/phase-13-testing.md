# Phase 13: Testing Strategy

## Overview

Implement comprehensive testing across unit, integration, and E2E levels.

---

## Test Stack

| Type | Tool | Focus |
|------|------|-------|
| Unit | Vitest | Store logic, utilities |
| Component | Testing Library | React components |
| Integration | Vitest + MSW | API calls |
| E2E | Playwright | User flows |

---

## Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test msw
```

**vitest.config.ts:**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

---

## Unit Tests

```typescript
// src/stores/__tests__/countStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useCountStore } from "../countStore";

describe("countStore", () => {
  beforeEach(() => {
    useCountStore.getState().reset();
  });

  it("increments unopened count", () => {
    const { incrementUnopened, unopenedCount } = useCountStore.getState();
    
    incrementUnopened();
    
    expect(useCountStore.getState().unopenedCount).toBe(1);
  });

  it("prevents negative counts", () => {
    const { decrementUnopened } = useCountStore.getState();
    
    decrementUnopened();
    
    expect(useCountStore.getState().unopenedCount).toBe(0);
  });
});
```

---

## Component Tests

```typescript
// src/components/__tests__/WineCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { WineCard } from "../WineCard";

const mockWine = {
  id: "1",
  name: "Test Wine",
  producer: "Test Producer",
  vintage: 2020,
  current_stock_unopened: 5,
};

describe("WineCard", () => {
  it("displays wine name", () => {
    render(<WineCard wine={mockWine} />);
    
    expect(screen.getByText("Test Wine")).toBeInTheDocument();
  });

  it("shows stock count", () => {
    render(<WineCard wine={mockWine} />);
    
    expect(screen.getByText(/Stock: 5/)).toBeInTheDocument();
  });
});
```

---

## API Mocking (MSW)

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/rest/v1/wines*", () => {
    return HttpResponse.json([
      { id: "1", name: "Mock Wine", producer: "Mock Producer" },
    ]);
  }),
];

// src/test/setup.ts
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## E2E Tests (Playwright)

```typescript
// e2e/inventory-count.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Inventory Count", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("can start counting session", async ({ page }) => {
    await page.goto("/count");
    await page.click("text=Start New Count Session");
    
    await expect(page.locator("h1")).toContainText("Count");
  });

  test("can record wine count", async ({ page }) => {
    await page.goto("/count");
    await page.click("text=Start New Count Session");
    
    // Search for wine
    await page.fill('input[placeholder="Search wines..."]', "Chateau");
    await page.click("text=Chateau Margaux");
    
    // Enter count
    await page.click('[data-testid="increment-unopened"]');
    await page.click("text=Save Count");
    
    await expect(page.locator("text=Count saved")).toBeVisible();
  });
});
```

---

## Coverage Targets

| Area | Target |
|------|--------|
| Stores | 80% |
| Utilities | 90% |
| Components | 70% |
| E2E flows | 100% |

---

## Next Phase

→ [Phase 14: Performance](./phase-14-performance.md)
