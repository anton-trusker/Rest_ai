import { create } from 'zustand';

interface ColumnStoreState {
  stockColumns: string[];
  catalogColumns: string[];
  historyColumns: string[];
  setStockColumns: (cols: string[]) => void;
  setCatalogColumns: (cols: string[]) => void;
  setHistoryColumns: (cols: string[]) => void;
}

export const useColumnStore = create<ColumnStoreState>((set) => ({
  stockColumns: ['wine', 'vintage', 'size', 'type', 'region', 'closed', 'open', 'total', 'par', 'status', 'value', 'location'],
  catalogColumns: ['wine', 'producer', 'vintage', 'type', 'volume', 'country', 'stock', 'status', 'price'],
  historyColumns: ['timestamp', 'user', 'wine', 'method', 'session', 'closed', 'open', 'total', 'confidence'],
  setStockColumns: (cols) => set({ stockColumns: cols }),
  setCatalogColumns: (cols) => set({ catalogColumns: cols }),
  setHistoryColumns: (cols) => set({ historyColumns: cols }),
}));
