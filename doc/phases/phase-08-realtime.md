# Phase 8: Real-time Subscriptions

## Overview

Enable real-time updates using Supabase Realtime for live data synchronization.

---

## Use Cases

| Feature | Table | Events |
|---------|-------|--------|
| Session status updates | `inventory_sessions` | UPDATE |
| Live counting | `inventory_items` | INSERT |
| Notifications | `system_notifications` | INSERT |
| Stock alerts | `wines` | UPDATE (stock) |

---

## Implementation

### Session Status Hook

```typescript
// src/hooks/useRealtimeSessions.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeSessions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory_sessions',
        },
        (payload) => {
          console.log('Session updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          queryClient.invalidateQueries({ queryKey: ['session', payload.new.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

### Notifications Hook

```typescript
// src/hooks/useRealtimeNotifications.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeNotifications() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Initial count
    supabase
      .from('system_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count || 0));

    // Real-time subscription
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new;
          
          // Show toast
          toast({
            title: notification.title,
            description: notification.message,
          });

          // Update count
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return { unreadCount };
}
```

### Live Counting Hook

```typescript
// src/hooks/useRealtimeCount.ts
export function useRealtimeSessionItems(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session-${sessionId}-items`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_items',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);
}
```

---

## Usage in Components

```typescript
function SessionReview() {
  // Enable real-time updates
  useRealtimeSessions();
  
  const { data: sessions } = useInventorySessions();
  
  return <SessionList sessions={sessions} />;
}

function AppLayout() {
  const { unreadCount } = useRealtimeNotifications();
  
  return (
    <nav>
      <NotificationBell count={unreadCount} />
    </nav>
  );
}
```

---

## Database Setup

Enable realtime for tables:

```sql
-- In Supabase Dashboard > Database > Replication
-- Or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE system_notifications;
```

---

## Next Phase

→ [Phase 9: AI Integration](./phase-09-ai-integration.md)
