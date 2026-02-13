import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isLoading, isAuthenticated } = useAuthStore();
    const { roles } = useSettingsStore();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles) {
        const userRole = roles.find(r => r.id === user.roleId);
        const isSuperAdmin = user.isSuperAdmin;

        if (isSuperAdmin) {
             return <>{children}</>;
        }

        if (userRole) {
            const hasRole = allowedRoles.some(role => role.toLowerCase() === userRole.name.toLowerCase());
            if (!hasRole) {
                return <Navigate to="/dashboard" replace />;
            }
        } else {
             // Role not found (maybe role ID mismatch or roles not loaded)
             // If roles are default (mock), they have string IDs. user.roleId is UUID.
             // If we are here, user is logged in via Supabase, so user.roleId is UUID.
             // If roles are still default, we won't find the role.
             // We should probably allow access if no role check is strictly enforced or fail safe.
             // Fail safe: deny.
             return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};
