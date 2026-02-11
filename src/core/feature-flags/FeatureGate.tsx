
import { Navigate, Outlet } from 'react-router-dom';
import { useFeatureFlag } from './useFeatureFlag';

interface FeatureGateProps {
    flag: string;
    children?: React.ReactNode;
    redirectTo?: string;
}

export function FeatureGate({ flag, children, redirectTo = '/dashboard' }: FeatureGateProps) {
    const isEnabled = useFeatureFlag(flag);

    if (!isEnabled) {
        return <Navigate to={redirectTo} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}
