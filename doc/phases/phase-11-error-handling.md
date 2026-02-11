# Phase 11: Error Handling

## Overview

Implement comprehensive error handling across the application.

---

## Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to error_logs table
    supabase.from("error_logs").insert({
      error_type: "react_render",
      error_message: error.message,
      error_stack: error.stack,
      context: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## API Error Codes

```typescript
// src/lib/errors.ts
export const ERROR_MESSAGES: Record<string, string> = {
  PGRST116: "Record not found",
  PGRST301: "Permission denied",
  "23503": "Referenced record not found",
  "23505": "This value already exists",
  "42501": "Insufficient privileges",
  AUTH_EXPIRED: "Session expired. Please log in again.",
  NETWORK_ERROR: "Network error. Check your connection.",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as any).code;
    return ERROR_MESSAGES[code] || error.message;
  }
  return "An unknown error occurred";
}
```

---

## Retry Logic

```typescript
// src/lib/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1 || !isRetryable(error)) {
        throw error;
      }
      await delay(baseDelay * Math.pow(2, attempt));
    }
  }
  throw new Error("Max retries exceeded");
}

function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const code = (error as any).code;
    return ["NETWORK_ERROR", "TIMEOUT", "429"].includes(code);
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

---

## Toast Notifications

```typescript
// Success: auto-dismiss
toast({ title: "Wine saved", duration: 3000 });

// Warning: longer duration
toast({ title: "Low stock", variant: "warning", duration: 5000 });

// Error: manual dismiss with details
toast({
  title: "Failed to save",
  description: error.message,
  variant: "destructive",
  action: <ToastAction onClick={() => showDetails(error)}>Details</ToastAction>,
});
```

---

## Offline Detection

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

## Next Phase

→ [Phase 12: Offline Support](./phase-12-offline-support.md)
