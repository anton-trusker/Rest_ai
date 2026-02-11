import { create } from 'zustand';
import { InventorySession, InventoryItem, mockSessions, mockInventoryItems } from '@/core/lib/mockData';

interface SessionStoreState {
    sessions: InventorySession[];
    inventoryItems: InventoryItem[];
    // Actions
    approveSession: (sessionId: string, approverId: string) => void;
    getFormattedItems: (sessionId: string) => InventoryItem[];
    getSessionStatusColor: (status: InventorySession['status']) => string;
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
    sessions: mockSessions,
    inventoryItems: mockInventoryItems,

    approveSession: (sessionId, approverId) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? { ...s, status: 'approved', approvedBy: approverId, approvedAt: new Date().toISOString() }
                    : s
            )
        }));
    },

    getFormattedItems: (sessionId) => {
        return get().inventoryItems.filter(item => item.sessionId === sessionId);
    },

    getSessionStatusColor: (status) => {
        switch (status) {
            case 'approved': return 'bg-wine-success/10 text-wine-success border-wine-success/20';
            case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'in_progress': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'flagged': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return 'bg-secondary text-muted-foreground border-border';
        }
    }
}));
