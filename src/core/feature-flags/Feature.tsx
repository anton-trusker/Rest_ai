
import { useFeatureFlag } from './useFeatureFlag';

interface FeatureProps {
    flag: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function Feature({ flag, children, fallback = null }: FeatureProps) {
    const isEnabled = useFeatureFlag(flag);
    return isEnabled ? <>{children}</> : <>{fallback}</>;
}
