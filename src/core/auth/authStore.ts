import { create } from 'zustand';
import { supabase } from '@/core/lib/supabase/client';
import { ALL_MODULES, permKey, type ModuleKey, type PermissionLevel } from '@/core/lib/referenceData';
import { useShallow } from 'zustand/react/shallow';

export interface User {
    id: string;
    name: string;
    email: string;
    roleId: string;
    roleName?: string;
    avatar?: string;
    permissions?: string[]; // Simplified list of "module.action" strings
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ error: Error | null }>;
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
                .maybeSingle();

            // Fetch User Role (handle multiple roles if needed, for now grab first)
            const { data: userRoles } = await supabase
                .from('user_roles')
                .select('role_id, roles(name, display_name, id)')
                .eq('user_id', authUser.id)
                .limit(1)
                .maybeSingle();

            const roleId = userRoles?.role_id || 'unknown';
            let roleName = userRoles?.roles?.display_name || userRoles?.roles?.name;

            // Hardcoded fallback for known system roles if names are missing in DB
            if (!roleName && roleId === 'role_admin') roleName = 'Admin';
            if (!roleName && roleId === 'role_staff') roleName = 'Staff';
            if (roleId === 'role_super_admin' || roleName?.toLowerCase().includes('super')) {
                if (!roleName) roleName = 'Super Admin';
            }

            // Fetch Permissions for this Role
            let permissionsList: string[] = [];
            const isFullAccessRole =
                roleId === 'role_super_admin' ||
                roleId === 'role_admin' ||
                roleName === 'Super Admin' ||
                roleName === 'Admin' ||
                roleName === 'super_admin' ||
                roleName === 'admin';

            if (isFullAccessRole) {
                // Super Admin and Admin get wildcards
                permissionsList = ['*'];
            } else if (roleId !== 'unknown') {
                const { data: rolePerms } = await supabase
                    .from('role_permissions')
                    .select('permissions(module, action)')
                    .eq('role_id', roleId);

                permissionsList = rolePerms?.map((rp: { permissions: { module: string; action: string } }) => `${rp.permissions.module}.${rp.permissions.action}`) || [];
            }

            const user: User = {
                id: authUser.id,
                name: profile?.full_name || authUser.email || 'User',
                email: authUser.email || '',
                roleId: roleId,
                roleName: roleName,
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
    const hasView = usePermission(module, 'view');
    const hasEdit = usePermission(module, 'edit');

    if (requiredLevel === 'view') return hasView;
    if (requiredLevel === 'edit') return hasEdit;
    return false;
}

export function useUserRole() {
    return useAuthStore(useShallow((s) => ({
        id: s.user?.roleId,
        name: s.user?.roleName
    })));
}

