
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/core/lib/supabase/client';
import { useAuthStore } from '@/core/auth/authStore';

const FeatureFlagContext = createContext<Map<string, boolean>>(new Map());

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
    const [flags, setFlags] = useState<Map<string, boolean>>(new Map());
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        // Initial fetch
        const fetchFlags = async () => {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('flag_key, is_enabled');

            if (error) {
                console.error('Error fetching feature flags:', error);
                return;
            }

            if (data) {
                const flagMap = new Map<string, boolean>();
                data.forEach(f => flagMap.set(f.flag_key, f.is_enabled));
                setFlags(flagMap);
            }
        };

        fetchFlags();

        // Realtime subscription
        const channel = supabase.channel('feature_flags_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'feature_flags'
                },
                (payload) => {
                    setFlags(current => {
                        const next = new Map(current);
                        if (payload.eventType === 'DELETE') {
                            if (payload.old && 'flag_key' in payload.old) {
                                next.delete(payload.old.flag_key as string);
                            }
                        } else {
                            const newRecord = payload.new as { flag_key: string; is_enabled: boolean };
                            if (newRecord.flag_key) {
                                next.set(newRecord.flag_key, newRecord.is_enabled);
                            }
                        }
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated]);

    return (
        <FeatureFlagContext.Provider value={flags}>
            {children}
        </FeatureFlagContext.Provider>
    );
}

export function useFeatureFlags() {
    return useContext(FeatureFlagContext);
}
