import { create } from 'zustand';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ModuleKey, PermissionLevel } from '@/data/referenceData';

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string; // references AppRole.id
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Mock users for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@wine.com': {
    password: 'admin123',
    user: { id: '1', name: 'Marco Rossi', email: 'admin@wine.com', roleId: 'role_admin' },
  },
  'staff@wine.com': {
    password: 'staff123',
    user: { id: '2', name: 'Sarah Miller', email: 'staff@wine.com', roleId: 'role_staff' },
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (email: string, password: string) => {
    const record = MOCK_USERS[email];
    if (record && record.password === password) {
      set({ user: record.user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// Permission helper — call outside of components or inside them
export function hasPermission(module: ModuleKey, requiredLevel: PermissionLevel): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  const roles = useSettingsStore.getState().roles;
  const role = roles.find((r) => r.id === user.roleId);
  if (!role) return false;
  const userLevel = role.permissions[module];
  const hierarchy: PermissionLevel[] = ['none', 'view', 'edit', 'full'];
  return hierarchy.indexOf(userLevel) >= hierarchy.indexOf(requiredLevel);
}

// Hook for reactive permission checking
export function useHasPermission(module: ModuleKey, requiredLevel: PermissionLevel): boolean {
  const user = useAuthStore((s) => s.user);
  const roles = useSettingsStore((s) => s.roles);
  if (!user) return false;
  const role = roles.find((r) => r.id === user.roleId);
  if (!role) return false;
  const userLevel = role.permissions[module];
  const hierarchy: PermissionLevel[] = ['none', 'view', 'edit', 'full'];
  return hierarchy.indexOf(userLevel) >= hierarchy.indexOf(requiredLevel);
}

// Get user's role object
export function useUserRole() {
  const user = useAuthStore((s) => s.user);
  const roles = useSettingsStore((s) => s.roles);
  if (!user) return null;
  return roles.find((r) => r.id === user.roleId) ?? null;
}
