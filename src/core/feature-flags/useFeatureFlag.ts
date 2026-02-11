
import { useFeatureFlags } from './FeatureFlagProvider';

export function useFeatureFlag(flagKey: string): boolean {
    const flags = useFeatureFlags();
    return flags.get(flagKey) ?? false;
}
