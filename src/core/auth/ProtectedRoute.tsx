
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, hasPermission } from '@/core/auth/authStore';
import { RotateCw } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    module?: string;
    action?: string;
}

export function ProtectedRoute({ children, module, action }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <RotateCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (module && action) {
        // Permission check
        const permKey = `${module}.${action}`;
        if (!hasPermission(permKey)) {
            // If trying to access a specific route but missing permission, redirect to dashboard or 403
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
}
