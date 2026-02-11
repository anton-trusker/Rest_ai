
import { useEffect } from 'react';
import { useAuthStore } from '@/core/auth/authStore';
import { supabase } from '@/core/lib/supabase/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { loadUser, logout } = useAuthStore();

    useEffect(() => {
        // Initial load
        loadUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                loadUser();
            } else if (event === 'SIGNED_OUT') {
                useAuthStore.setState({ user: null, isAuthenticated: false });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUser]);

    return <>{children}</>;
}
