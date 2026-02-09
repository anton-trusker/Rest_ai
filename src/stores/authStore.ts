import { create } from 'zustand';

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
    user: { id: '1', name: 'Marco Rossi', email: 'admin@wine.com', role: 'admin' },
  },
  'staff@wine.com': {
    password: 'staff123',
    user: { id: '2', name: 'Sarah Miller', email: 'staff@wine.com', role: 'staff' },
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
