import { create } from 'zustand';
import { supabase } from '@/core/lib/supabase/client';
import { ALL_MODULES, permKey, type ModuleKey, type PermissionLevel } from '@/core/lib/referenceData';

export interface User {
    id: string;
    name: string;
    email: string;
    roleId: string;
    avatar?: string;
    permissions?: string[]; // Simplified list of "module.action" strings
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
            await get().loadUser();
        }
        set({ isLoading: false });
        return { error };
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
    },

    loadUser: async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                set({ user: null, isAuthenticated: false, isLoading: false });
                return;
            }

            // Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            // Fetch User Role (handle multiple roles if needed, for now grab first)
            const { data: userRoles } = await supabase
                .from('user_roles')
                .select('role_id, roles(name, id)')
                .eq('user_id', authUser.id)
                .limit(1)
                .single();

            const roleId = userRoles?.role_id || 'unknown';
            const roleName = userRoles?.roles?.name;

            // Fetch Permissions for this Role
            let permissionsList: string[] = [];
            if (roleName === 'super_admin') {
                // Super Admin gets wildcards or handled in check logic
                permissionsList = ['*'];
            } else if (roleId !== 'unknown') {
                const { data: rolePerms } = await supabase
                    .from('role_permissions')
                    .select('permissions(module, action)')
                    .eq('role_id', roleId);

                permissionsList = rolePerms?.map((rp: any) => `${rp.permissions.module}.${rp.permissions.action}`) || [];
            }

            const user: User = {
                id: authUser.id,
                name: profile?.full_name || authUser.email || 'User',
                email: authUser.email || '',
                roleId: roleId,
                avatar: profile?.avatar_url,
                permissions: permissionsList
            };

            set({ user, isAuthenticated: true, isLoading: false });

        } catch (error) {
            console.error('Load user failed:', error);
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    }
}));

// --- Permission Helpers ---

/**
 * Check if the current user has a specific permission.
 * Format: "module.action" (e.g., "inventory.count")
 */
export function hasPermission(permissionKey: string): boolean {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    // Super Admin Bypass
    if (user.permissions?.includes('*')) return true;

    return !!user.permissions?.includes(permissionKey);
}

/**
 * Hook version of hasPermission
 */
export function usePermission(module: string, action: string): boolean {
    const user = useAuthStore((s) => s.user);
    if (!user) return false;
    if (user.permissions?.includes('*')) return true;
    return !!user.permissions?.includes(`${module}.${action}`);
}

// Re-export specific hook if needed by legacy components
export function useHasPermission(module: string, requiredLevel: PermissionLevel): boolean {
    // Adapter for legacy "level" check -> maps to view/edit/etc actions if needed
    // For now, simple mapping:
    if (requiredLevel === 'view') return usePermission(module, 'view');
    if (requiredLevel === 'edit') return usePermission(module, 'edit');
    return false;
}

export function useUserRole() {
    return useAuthStore.getState().user?.roleId;
}

