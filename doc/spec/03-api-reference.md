# API Reference

## Overview

The Wine Inventory Management System uses Supabase as the backend, providing auto-generated REST and real-time APIs from the PostgreSQL schema.

---

## Supabase Client Configuration

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
```

---

## Authentication API

### Login

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Logout

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Session Management

```typescript
// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User signed in
  } else if (event === 'SIGNED_OUT') {
    // User signed out
  }
});
```

---

## Wine Catalog API

### List Wines

```typescript
// Basic list with pagination
const { data, error } = await supabase
  .from('wines')
  .select('*')
  .eq('is_active', true)
  .order('name')
  .range(0, 49);

// With related data
const { data } = await supabase
  .from('wines')
  .select(`
    *,
    wine_images(id, image_url, is_primary),
    wine_barcodes(barcode, is_primary),
    wine_variants(id, vintage, volume_ml, current_stock)
  `)
  .eq('is_active', true);
```

### Get Single Wine

```typescript
const { data, error } = await supabase
  .from('wines')
  .select(`
    *,
    wine_images(*),
    wine_barcodes(*),
    wine_variants(*),
    suppliers(name, email, phone)
  `)
  .eq('id', wineId)
  .single();
```

### Create Wine

```typescript
const { data, error } = await supabase
  .from('wines')
  .insert({
    name: 'Château Margaux',
    producer: 'Château Margaux',
    vintage: 2015,
    wine_type: 'red',
    country: 'France',
    region: 'Bordeaux',
    volume_ml: 750,
    sale_price: 450.00,
    current_stock_unopened: 0,
    current_stock_opened: 0
  })
  .select()
  .single();
```

### Update Wine

```typescript
const { data, error } = await supabase
  .from('wines')
  .update({
    sale_price: 475.00,
    current_stock_unopened: 12
  })
  .eq('id', wineId)
  .select()
  .single();
```

### Delete Wine (Soft Delete)

```typescript
const { error } = await supabase
  .from('wines')
  .update({
    is_active: false,
    deleted_at: new Date().toISOString()
  })
  .eq('id', wineId);
```

### Search Wines

```typescript
// Full-text search
const { data } = await supabase
  .from('wines')
  .select('*')
  .or(`name.ilike.%${query}%,producer.ilike.%${query}%,region.ilike.%${query}%`)
  .eq('is_active', true);

// Search by barcode
const { data } = await supabase
  .from('wine_barcodes')
  .select('wine_id, wines(*)')
  .eq('barcode', scannedBarcode)
  .eq('is_active', true)
  .single();
```

---

## Inventory Session API

### Create Session

```typescript
const { data, error } = await supabase
  .from('inventory_sessions')
  .insert({
    session_name: `Inventory ${new Date().toISOString().split('T')[0]}`,
    status: 'draft',
    started_by: userId
  })
  .select()
  .single();
```

### Start Session

```typescript
const { error } = await supabase
  .from('inventory_sessions')
  .update({
    status: 'in_progress',
    started_at: new Date().toISOString()
  })
  .eq('id', sessionId);
```

### Add Inventory Item

```typescript
const { data, error } = await supabase
  .from('inventory_items')
  .insert({
    session_id: sessionId,
    wine_id: wineId,
    counted_quantity_unopened: 10,
    counted_quantity_opened: 2,
    expected_quantity_unopened: 12,
    expected_quantity_opened: 1,
    counting_method: 'barcode',
    counted_by: userId,
    counted_at: new Date().toISOString()
  })
  .select()
  .single();
```

### Complete Session

```typescript
const { error } = await supabase
  .from('inventory_sessions')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    completed_by: userId
  })
  .eq('id', sessionId);
```

### Get Session with Items

```typescript
const { data } = await supabase
  .from('inventory_sessions')
  .select(`
    *,
    inventory_items(
      *,
      wines(id, name, producer, vintage)
    )
  `)
  .eq('id', sessionId)
  .single();
```

---

## Stock Movement API

### Record Movement

```typescript
const { data, error } = await supabase
  .from('inventory_movements')
  .insert({
    wine_id: wineId,
    session_id: sessionId,
    movement_type: 'count_adjustment',
    quantity_before: 10,
    quantity_change: -2,
    quantity_after: 8,
    bottle_state: 'unopened',
    recording_method: 'barcode',
    performed_by: userId,
    reason: 'Physical count variance'
  })
  .select()
  .single();
```

### Get Movement History

```typescript
const { data } = await supabase
  .from('inventory_movements')
  .select(`
    *,
    wines(name, producer),
    profiles:performed_by(display_name)
  `)
  .order('performed_at', { ascending: false })
  .range(0, 49);
```

---

## Image API

### Upload Wine Image

```typescript
// Upload to Supabase Storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('wine-images')
  .upload(`${wineId}/${filename}`, file, {
    contentType: file.type
  });

// Create image record
const { data } = await supabase
  .from('wine_images')
  .insert({
    wine_id: wineId,
    storage_key: uploadData.path,
    image_url: supabase.storage.from('wine-images').getPublicUrl(uploadData.path).data.publicUrl,
    is_primary: true,
    source: 'manual_upload',
    uploaded_by: userId
  })
  .select()
  .single();
```

### Get Public Image URL

```typescript
const { data } = supabase.storage
  .from('wine-images')
  .getPublicUrl(storagePath);
```

---

## User Management API

### Get Users (Admin)

```typescript
const { data } = await supabase
  .from('profiles')
  .select(`
    *,
    user_roles(role)
  `)
  .eq('is_active', true)
  .order('display_name');
```

### Update User Role

```typescript
const { error } = await supabase
  .from('user_roles')
  .upsert({
    user_id: userId,
    role: 'admin'
  });
```

### Check User Role

```typescript
// Using the has_role function
const { data } = await supabase.rpc('has_role', {
  _user_id: userId,
  _role: 'admin'
});
```

---

## Real-time Subscriptions

### Subscribe to Session Updates

```typescript
const subscription = supabase
  .channel('session-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'inventory_items',
      filter: `session_id=eq.${sessionId}`
    },
    (payload) => {
      console.log('Change received:', payload);
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

### Subscribe to Stock Changes

```typescript
const subscription = supabase
  .channel('stock-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'wines',
      filter: 'is_active=eq.true'
    },
    (payload) => {
      // Update UI with new stock levels
    }
  )
  .subscribe();
```

---

## Error Handling

```typescript
import { PostgrestError } from '@supabase/supabase-js';

async function fetchWines() {
  const { data, error } = await supabase
    .from('wines')
    .select('*');
  
  if (error) {
    console.error('Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to fetch wines: ${error.message}`);
  }
  
  return data;
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `PGRST116` | No rows returned (single() on empty result) |
| `PGRST301` | Row level security violation |
| `23503` | Foreign key constraint violation |
| `23505` | Unique constraint violation |
| `42501` | Insufficient privileges |

---

## React Query Integration

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query
export function useWines() {
  return useQuery({
    queryKey: ['wines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });
}

// Mutation
export function useUpdateWine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('wines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wines'] });
    }
  });
}
```
