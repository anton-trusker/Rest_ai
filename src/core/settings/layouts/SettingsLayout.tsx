
import {
    LayoutDashboard,
    Store,
    MapPin,
    Wine,
    Laptop2,
    Palette,
    BrainCircuit,
    Settings2,
    Users,
    Shield,
    Info,
    ClipboardCheck
} from 'lucide-react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useFeatureFlag } from '@/core/feature-flags/useFeatureFlag';
import { usePermission } from '@/core/auth/usePermission';
import { cn } from '@/core/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/core/ui/card';

interface SettingsTab {
    label: string;
    path: string;
    icon: React.ElementType;
    description: string;
    permission?: { module: string; action: string };
    flag?: string;
}

const settingsTabs: SettingsTab[] = [
    {
        label: 'General',
        path: '/settings/general',
        icon: Settings2,
        description: 'General application preferences',
        permission: { module: 'settings', action: 'view' }
    },
    {
        label: 'Users',
        path: '/settings/users',
        icon: Users,
        description: 'Manage staff access and roles',
        permission: { module: 'users', action: 'view' }
    },
    {
        label: 'Business Profile',
        path: '/settings/business',
        icon: Store,
        description: 'Manage business details and logo',
        permission: { module: 'settings', action: 'edit' }
    },
    {
        label: 'Locations',
        path: '/settings/locations',
        icon: MapPin,
        description: 'Manage storage areas and bars',
        permission: { module: 'settings', action: 'edit' },
        flag: 'feat.multi_location'
    },
    {
        label: 'Glass Sizes',
        path: '/settings/glasses',
        icon: Wine,
        description: 'Configure pour sizes for partial counts',
        permission: { module: 'settings', action: 'edit' },
        flag: 'feat.glass_counting'
    },
    {
        label: 'Inventory Rules',
        path: '/settings/inventory',
        icon: ClipboardCheck, // We need to import this
        description: 'Approval workflows and session rules',
        permission: { module: 'settings', action: 'edit' }
    },
    {
        label: 'Syrve Integration',
        path: '/settings/syrve',
        icon: Laptop2,
        description: 'Connect and sync with Syrve POS',
        permission: { module: 'settings', action: 'edit' },
        flag: 'int.syrve'
    },
    {
        label: 'AI Configuration',
        path: '/settings/ai',
        icon: BrainCircuit,
        description: 'Manage AI API keys and preferences',
        permission: { module: 'settings', action: 'edit' },
        flag: 'feat.custom_ai_key'
    },
    {
        label: 'Branding',
        path: '/settings/branding',
        icon: Palette,
        description: 'Customize look and feel',
        permission: { module: 'settings', action: 'edit' },
        flag: 'ui.dark_mode'
    },
];

interface SettingsNavItemProps {
    item: SettingsTab;
}

function SettingsNavItem({ item }: SettingsNavItemProps) {
    const isFlagEnabled = useFeatureFlag(item.flag || '');
    const hasPermission = usePermission(item.permission?.module || '', item.permission?.action || '');

    const isVisible = (!item.flag || isFlagEnabled) && (!item.permission || hasPermission);
    if (!isVisible) return null;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                cn(
                    "justify-start hover:bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                        ? "bg-muted text-primary hover:bg-muted"
                        : "text-muted-foreground hover:text-foreground"
                )
            }
        >
            <item.icon className="h-4 w-4" />
            {item.label}
        </NavLink>
    );
}

export default function SettingsLayout() {
    const location = useLocation();

    // If we're at /settings root, redirect to first available tab
    // This is tricky because we need to know the first visible tab
    // We can pre-calculate visibility or just use a simpler check for the redirect
    if (location.pathname === '/settings') {
        return <Navigate to="/settings/general" replace />;
    }

    return (
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 h-full">
            <aside className="lg:w-1/4 overflow-y-auto">
                <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                    {settingsTabs.map((item) => (
                        <SettingsNavItem key={item.path} item={item} />
                    ))}
                </nav>
            </aside>
            <div className="flex-1 lg:max-w-4xl">
                <Outlet />
            </div>
        </div>
    );
}
