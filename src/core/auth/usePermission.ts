
import { usePermission as useStorePermission } from '@/core/auth/authStore';

/**
 * Re-export the hook from the store for convenience, 
 * or add extra logic here if needed (e.g. feature flags)
 */
export function usePermission(module: string, action: string): boolean {
    return useStorePermission(module, action);
}
