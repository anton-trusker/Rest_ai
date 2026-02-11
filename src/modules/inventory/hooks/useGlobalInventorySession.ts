/**
 * Hook: useGlobalInventorySession
 * 
 * Purpose: Manage global inventorisation session state
 * - Fetch active session
 * - Start new session
 * - Complete session
 * - Approve session
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/core/lib/supabase/client'

export interface GlobalInventorySession {
    id: string
    status: 'preparing' | 'active' | 'review' | 'approved' | 'cancelled'
    started_by: string
    started_at: string
    location_id?: string
    notes?: string
    syrve_store_id?: string
    expected_stock_loaded_at?: string
    expected_stock_count: number
    completed_by?: string
    completed_at?: string
    approved_by?: string
    approved_at?: string
    syrve_document_number?: string
    syrve_document_id?: string
}

export interface StartInventorisationParams {
    location_id?: string
    syrve_store_id: string
    notes?: string
}

export function useGlobalInventorySession() {
    const queryClient = useQueryClient()

    // Fetch active global session
    const { data: activeSession, isLoading, error } = useQuery({
        queryKey: ['global-inventory-session', 'active'],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('get_active_global_session')

            if (error) throw error

            // RPC returns array, get first item
            return data && data.length > 0 ? data[0] : null
        },
        refetchInterval: 10000, // Poll every 10 seconds for session updates
    })

    // Check if user can start inventorisation
    const { data: canStart } = useQuery({
        queryKey: ['permissions', 'inventory.start'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return false

            const { data, error } = await supabase
                .rpc('can_start_inventorisation', { user_id: user.id })

            if (error) {
                console.error('Permission check error:', error)
                return false
            }

            return data || false
        },
    })

    // Start new inventorisation session
    const startSession = useMutation({
        mutationFn: async (params: StartInventorisationParams) => {
            const { data: functions } = await supabase.functions.invoke('start-inventorisation', {
                body: params,
            })

            if (functions.error) {
                throw new Error(functions.error)
            }

            return functions
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['global-inventory-session'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-expected-stock'] })
        },
    })

    // Complete session (move to review)
    const completeSession = useMutation({
        mutationFn: async (sessionId: string) => {
            const { data: functions } = await supabase.functions.invoke('complete-inventorisation', {
                body: { session_id: sessionId },
            })

            if (functions.error) {
                throw new Error(functions.error)
            }

            return functions
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['global-inventory-session'] })
        },
    })

    // Approve and submit to Syrve
    const approveSession = useMutation({
        mutationFn: async (sessionId: string) => {
            const { data: functions } = await supabase.functions.invoke('approve-inventorisation', {
                body: { session_id: sessionId },
            })

            if (functions.error) {
                throw new Error(functions.error)
            }

            return functions
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['global-inventory-session'] })
            queryClient.invalidateQueries({ queryKey: ['current-stock'] })
        },
    })

    // Cancel session
    const cancelSession = useMutation({
        mutationFn: async (sessionId: string) => {
            const { data, error } = await supabase
                .from('global_inventory_session')
                .update({ status: 'cancelled' })
                .eq('id', sessionId)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['global-inventory-session'] })
        },
    })

    return {
        activeSession,
        isLoading,
        error,
        canStart,
        startSession,
        completeSession,
        approveSession,
        cancelSession,
    }
}

/**
 * Hook: useInventoryCount
 * 
 * Purpose: Update inventory counts during active session
 */

export interface UpdateCountParams {
    session_id: string
    product_id: string
    full_bottles?: number
    partial_amount?: number
    notes?: string
}

export function useInventoryCount(sessionId?: string) {
    const queryClient = useQueryClient()

    const updateCount = useMutation({
        mutationFn: async (params: UpdateCountParams) => {
            const { data: functions } = await supabase.functions.invoke('update-inventory-count', {
                body: params,
            })

            if (functions.error) {
                throw new Error(functions.error)
            }

            return functions
        },
        onSuccess: (data, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: ['inventory-items', sessionId]
            })
            queryClient.invalidateQueries({
                queryKey: ['inventory-item', variables.product_id]
            })
            queryClient.invalidateQueries({
                queryKey: ['inventory-change-log', sessionId]
            })
        },
    })

    return {
        updateCount,
    }
}

/**
 * Hook: useExpectedStock
 * 
 * Purpose: Fetch expected stock for session
 */

export interface ExpectedStock {
    id: string
    session_id: string
    product_id: string
    syrve_product_id?: string
    expected_amount: number
    expected_sum: number
    expected_unit?: string
    product?: {
        id: string
        name: string
        sku?: string
    }
}

export function useExpectedStock(sessionId?: string) {
    const { data: expectedStock, isLoading } = useQuery({
        queryKey: ['inventory-expected-stock', sessionId],
        queryFn: async () => {
            if (!sessionId) return []

            const { data, error } = await supabase
                .from('inventory_expected_stock')
                .select(`
          *,
          product:products (
            id,
            name,
            sku
          )
        `)
                .eq('session_id', sessionId)
                .order('product(name)')

            if (error) throw error
            return data as ExpectedStock[]
        },
        enabled: !!sessionId,
    })

    return {
        expectedStock: expectedStock || [],
        isLoading,
    }
}

/**
 * Hook: useChangeLog
 * 
 * Purpose: Fetch audit trail for session
 */

export interface ChangeLogEntry {
    id: string
    session_id: string
    product_id: string
    field_name: string
    old_value?: string
    new_value: string
    changed_by: string
    changed_at: string
    ip_address?: string
    user_agent?: string
    user?: {
        email: string
    }
    product?: {
        name: string
    }
}

export function useChangeLog(sessionId?: string) {
    const { data: changeLogs, isLoading } = useQuery({
        queryKey: ['inventory-change-log', sessionId],
        queryFn: async () => {
            if (!sessionId) return []

            const { data, error } = await supabase
                .from('inventory_change_log')
                .select(`
          *,
          user:auth.users!changed_by (
            email
          ),
          product:products (
            name
          )
        `)
                .eq('session_id', sessionId)
                .order('changed_at', { ascending: false })
                .limit(100)

            if (error) throw error
            return data as ChangeLogEntry[]
        },
        enabled: !!sessionId,
    })

    return {
        changeLogs: changeLogs || [],
        isLoading,
    }
}
