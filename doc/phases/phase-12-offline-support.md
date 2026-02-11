# Phase 12: Offline Support

## Overview

Enable basic offline functionality for inventory counting during network outages.

---

## Strategy

```
Online: Normal Supabase operations
       ↓
Network loss detected
       ↓
Switch to localStorage queue
       ↓
Network restored
       ↓
Sync queued operations
       ↓
Resume normal operations
```

---

## Offline Queue

```typescript
// src/lib/offlineQueue.ts
interface QueuedOperation {
  id: string;
  timestamp: number;
  table: string;
  type: "insert" | "update";
  data: Record<string, any>;
}

const QUEUE_KEY = "offline_operations_queue";

export function addToQueue(operation: Omit<QueuedOperation, "id" | "timestamp">) {
  const queue = getQueue();
  queue.push({
    ...operation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedOperation[] {
  const data = localStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function syncQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;

  for (const op of queue) {
    try {
      if (op.type === "insert") {
        await supabase.from(op.table).insert(op.data);
      } else {
        const { id, ...data } = op.data;
        await supabase.from(op.table).update(data).eq("id", id);
      }
    } catch (error) {
      console.error("Failed to sync:", op, error);
      return; // Stop on error, retry later
    }
  }

  clearQueue();
}
```

---

## Network Sync Hook

```typescript
// src/hooks/useNetworkSync.ts
import { useEffect } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { syncQueue, getQueue } from "@/lib/offlineQueue";
import { useToast } from "@/hooks/use-toast";

export function useNetworkSync() {
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  useEffect(() => {
    if (isOnline) {
      const pendingCount = getQueue().length;
      
      if (pendingCount > 0) {
        toast({
          title: "Connection restored",
          description: `Syncing ${pendingCount} pending items...`,
        });
        
        syncQueue().then(() => {
          toast({
            title: "Sync complete",
            description: "All offline changes have been saved.",
          });
        });
      }
    } else {
      toast({
        title: "Offline mode",
        description: "Changes will be saved when connection is restored.",
        variant: "warning",
      });
    }
  }, [isOnline, toast]);

  return isOnline;
}
```

---

## Offline-Enabled Count

```typescript
// In count operation
async function saveCount(data: CountData) {
  if (navigator.onLine) {
    await supabase.from("inventory_items").insert(data);
  } else {
    addToQueue({ table: "inventory_items", type: "insert", data });
    toast({ title: "Saved offline", description: "Will sync when back online" });
  }
}
```

---

## Limitations

- Offline mode supports INSERT only (new counts)
- 24-hour expiry on queued items
- Conflicts resolved by server timestamp
- Maximum 100 queued items

---

## Next Phase

→ [Phase 13: Testing Strategy](./phase-13-testing.md)
