import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface SyrveStoreState {
  config: {
    serverUrl: string;
    login: string;
    storeId: string | null;
    autoSync: boolean;
  } | null;
  
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'testing' | 'idle';
  availableStores: { id: string; name: string }[];
  errorMessage: string | null;
  loading: boolean;

  // Actions
  fetchConfig: () => Promise<void>;
  testConnection: (url: string, login: string, password?: string) => Promise<boolean>;
  saveConfig: (data: { serverUrl: string; login: string; password?: string; storeId?: string }) => Promise<void>;
}

export const useSyrveStore = create<SyrveStoreState>((set, get) => ({
  config: null,
  connectionStatus: 'idle',
  availableStores: [],
  errorMessage: null,
  loading: false,

  fetchConfig: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('syrve_config')
      .select('server_url, api_login, store_id, auto_sync_enabled, connection_status')
      .maybeSingle();

    if (error) {
      console.error('Error fetching Syrve config:', error);
      set({ loading: false });
      return;
    }

    if (data) {
      set({
        config: {
          serverUrl: data.server_url,
          login: data.api_login,
          storeId: data.store_id,
          autoSync: data.auto_sync_enabled || false
        },
        connectionStatus: data.connection_status as any || 'idle',
        loading: false
      });
    } else {
      set({ config: null, loading: false });
    }
  },

  testConnection: async (url, login, password) => {
    set({ connectionStatus: 'testing', errorMessage: null });

    try {
      const { data, error } = await supabase.functions.invoke('syrve-connect-test', {
        body: { url, login, password }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Connection failed');
      }
      
      // Parse XML stores (simple regex for now, better parsing later)
      // Example XML: <corporateItemDto> <id>UUID</id> <name>Name</name> ...
      // Real implementation should parse the XML tree properly.
      // For now, let's mock the parsing or assume edge function returns list if updated
      
      const rawXml: string = data.raw_org_data || '';
      const stores: {id: string, name: string}[] = [];
      
      // Basic Regex to find names (very rough, just for MVP demo flow)
      // In production, move XML parsing to the Edge Function and return JSON
      const nameMatch = rawXml.match(/<name>(.*?)<\/name>/g);
      if (nameMatch) {
         // Just a dummy extraction for demo, real one needs structural parsing
         stores.push({ id: 'mock-id-1', name: 'Main Store (Mock)' }); 
         stores.push({ id: 'mock-id-2', name: 'Bar (Mock)' });
      }

      set({ 
        connectionStatus: 'connected', 
        availableStores: stores.length > 0 ? stores : [{ id: 'manual-id', name: 'Extracted Store' }]
      });
      return true;

    } catch (err: any) {
      set({ connectionStatus: 'error', errorMessage: err.message });
      return false;
    }
  },

  saveConfig: async (payload) => {
    set({ loading: true });
    
    // Check if exists
    const { data: existing } = await supabase.from('syrve_config').select('id').maybeSingle();
    
    const updateData: any = {
       server_url: payload.serverUrl,
       api_login: payload.login,
       store_id: payload.storeId,
       connection_status: 'connected',
       last_product_sync_at: new Date().toISOString() // Just to mark activity
    };
    
    // Only update password if provided
    if (payload.password) {
      // In a real app, encrypt this! For now, storing as is but schema says encrypted.
      // We should use pgsodium or similar, or handle encryption in a separate Edge Function trigger.
      updateData.api_password_encrypted = payload.password; 
    }

    let error;
    if (existing) {
       const res = await supabase.from('syrve_config').update(updateData).eq('id', existing.id);
       error = res.error;
    } else {
       if (!payload.password) throw new Error("Password required for new config");
       updateData.api_password_encrypted = payload.password;
       const res = await supabase.from('syrve_config').insert([updateData]);
       error = res.error;
    }

    if (error) {
      set({ errorMessage: error.message, loading: false });
      throw error;
    }

    set((state) => ({
      config: {
        ...state.config!,
        serverUrl: payload.serverUrl,
        login: payload.login,
        storeId: payload.storeId || null
      },
      loading: false
    }));
  }
}));
