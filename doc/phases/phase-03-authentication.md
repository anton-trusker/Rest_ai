# Phase 3: Authentication Rewrite

## Overview

Replace mock authentication with Supabase Auth, implementing real login, session management, and role-based access control.

---

## Prerequisites

- [ ] Phase 2 completed (Supabase client configured)
- [ ] `profiles` and `user_roles` tables created
- [ ] `has_role()` function available

---

## Implementation

### 1. Auth Store Rewrite

**File:** `src/stores/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, AppRole } from '@/integrations/supabase/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          // Set up auth state listener FIRST
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
              await get().fetchUserData(session.user);
            } else if (event === 'SIGNED_OUT') {
              set({ ...initialState, isLoading: false });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              set({ session });
            }
          });

          // Then get initial session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session) {
            await get().fetchUserData(session.user);
            set({ session });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      fetchUserData: async (user: User) => {
        try {
          // Fetch profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          // Fetch role
          const { data: roles, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          if (roleError) throw roleError;

          const role = roles?.[0]?.role as AppRole || 'staff';

          // Update last login
          await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);

          set({
            user,
            profile,
            role,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.session) {
            set({ session: data.session });
          }

          return { success: true };
        } catch (error) {
          const message = (error as Error).message;
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await supabase.auth.signOut();
          set({ ...initialState, isLoading: false });
        } catch (error) {
          console.error('Logout error:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) return;

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) throw error;

        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        }));
      },

      hasPermission: (permission: string) => {
        const { role } = get();
        if (!role) return false;
        
        // Admin has all permissions
        if (role === 'admin') return true;
        
        // Define staff permissions
        const staffPermissions = [
          'wines:view',
          'inventory:count',
          'history:view_own',
          'profile:edit',
        ];
        
        return staffPermissions.includes(permission);
      },

      isAdmin: () => get().role === 'admin',

      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist minimal data
        role: state.role,
      }),
    }
  )
);
```

---

### 2. Login Page Update

**File:** `src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Login failed',
        description: result.error || 'Invalid credentials',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Wine className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Wine Inventory</CardTitle>
          <p className="text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 3. Auth Guard Component

**File:** `src/components/AuthGuard.tsx`

```typescript
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isAdmin, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

---

### 4. App Layout Update

**File:** `src/components/AppLayout.tsx`

```typescript
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Loader2 } from 'lucide-react';

export default function AppLayout() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <AppSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0">
        <MobileBottomNav />
      </div>
    </div>
  );
}
```

---

### 5. App.tsx with Auth Initialization

**File:** `src/App.tsx`

```typescript
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/authStore';
import { AuthGuard } from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import WineCatalog from '@/pages/WineCatalog';
import WineDetail from '@/pages/WineDetail';
import WineForm from '@/pages/WineForm';
import InventoryCount from '@/pages/InventoryCount';
import CurrentStock from '@/pages/CurrentStock';
import InventoryHistory from '@/pages/InventoryHistory';
import SessionReview from '@/pages/SessionReview';
import UserManagement from '@/pages/UserManagement';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<WineCatalog />} />
            <Route path="/catalog/:id" element={<WineDetail />} />
            <Route path="/catalog/new" element={<WineForm />} />
            <Route path="/catalog/:id/edit" element={<WineForm />} />
            <Route path="/count" element={<InventoryCount />} />
            <Route path="/history" element={<InventoryHistory />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin-only routes */}
            <Route
              path="/stock"
              element={
                <AuthGuard requireAdmin>
                  <CurrentStock />
                </AuthGuard>
              }
            />
            <Route
              path="/sessions"
              element={
                <AuthGuard requireAdmin>
                  <SessionReview />
                </AuthGuard>
              }
            />
            <Route
              path="/users"
              element={
                <AuthGuard requireAdmin>
                  <UserManagement />
                </AuthGuard>
              }
            />
            <Route
              path="/settings/*"
              element={
                <AuthGuard requireAdmin>
                  <Settings />
                </AuthGuard>
              }
            />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## Test Users

Create test users in Supabase Dashboard → Authentication → Users:

| Email | Role | Purpose |
|-------|------|---------|
| admin@example.com | admin | Full access testing |
| staff@example.com | staff | Limited access testing |

After creating users, insert roles:

```sql
-- Get user IDs first
SELECT id, email FROM auth.users;

-- Insert roles
INSERT INTO user_roles (user_id, role) VALUES
  ('admin-user-id', 'admin'),
  ('staff-user-id', 'staff');
```

---

## Verification Checklist

- [ ] Login works with valid credentials
- [ ] Invalid credentials show error
- [ ] Session persists on page refresh
- [ ] Logout clears session completely
- [ ] Protected routes redirect to login
- [ ] Admin routes block staff users
- [ ] Profile data loads correctly
- [ ] Role is correctly assigned

---

## Next Phase

→ [Phase 4: Store Rewrites](./phase-04-store-rewrites.md)
