import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUserRole, usePermission } from '@/core/auth/authStore';
import { useFeatureFlags } from '@/core/feature-flags/FeatureFlagProvider';
import {
    LayoutDashboard, Wine, Package, History, BarChart3, ClipboardCheck,
    LogOut, Settings, User, Plus, ScanLine, Truck
} from 'lucide-react';
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import type { ModuleKey } from '@/core/lib/referenceData';
import ThemeToggle from './ThemeToggle';

interface NavItemDef {
    label: string;
    icon: React.ElementType;
    path: string;
    module: ModuleKey;
    flag?: string; // Optional feature flag key
}

interface NavGroup {
    title?: string;
    items: NavItemDef[];
    comingSoon?: boolean;
}

const navGroups: NavGroup[] = [
    {
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', module: 'dashboard' },
        ],
    },
    {
        title: 'Inventory',
        items: [
            { label: 'Current Stock', icon: Package, path: '/stock', module: 'stock', flag: 'module.stock' },
            { label: 'Start Count', icon: ScanLine, path: '/count', module: 'stock', flag: 'module.inventory' },
            { label: 'Session Review', icon: ClipboardCheck, path: '/sessions', module: 'sessions', flag: 'module.sessions' },
        ],
    },
    {
        title: 'Catalog',
        items: [
            { label: 'Wine Catalog', icon: Wine, path: '/catalog', module: 'catalog', flag: 'module.catalog' },
        ],
    },
    {
        items: [
            { label: 'History & Logs', icon: History, path: '/history', module: 'history', flag: 'module.history' },
        ],
    },
    {
        title: 'Reports',
        comingSoon: true, // Remove this if reports are ready
        items: [
            { label: 'Reports', icon: BarChart3, path: '/reports', module: 'reports', flag: 'module.reports' },
        ],
    },
    {
        title: 'Suppliers / Orders',
        comingSoon: true,
        items: [],
    },
    {
        items: [
            { label: 'User Management', icon: User, path: '/users', module: 'users', flag: 'module.users' },
            { label: 'Settings', icon: Settings, path: '/settings', module: 'settings', flag: 'module.settings' },
        ],
    },
];

export default function AppSidebar() {
    const { user, logout } = useAuthStore();
    const role = useUserRole();
    const flags = useFeatureFlags();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) =>
        location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    const filterItems = (items: NavItemDef[]) =>
        items.filter(item => {
            // Permission check
            // Use static check from store or hook logic? 
            // Better to use the hook's logic but safely.
            const user = useAuthStore.getState().user;
            if (!user) return false;

            // Bypass for Super Admin
            if (user.permissions?.includes('*')) return true;

            // Check specific view permission
            const hasView = user.permissions?.includes(`${item.module}.view`);
            if (!hasView && item.module !== 'dashboard') {
                return false;
            }
            // Feature flag check
            if (item.flag && !flags.get(item.flag)) {
                return false;
            }
            return true;
        });

    return (
        <>
            {/* Mobile top header bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg wine-gradient flex items-center justify-center">
                        <Wine className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h1 className="font-heading text-base font-semibold text-foreground">Simply Rest</h1>
                </div>
                <div className="flex items-center gap-1">
                    <ThemeToggle className="p-1.5" />
                    <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-wine-burgundy flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {user?.name?.charAt(0)}
                    </button>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-sidebar z-50 border-r border-sidebar-border flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-sidebar-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl wine-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                            <Wine className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-heading text-lg font-semibold text-foreground">Simply Rest</h1>
                            <p className="text-xs text-muted-foreground">by Trusker Solutions</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 overflow-y-auto space-y-1">
                    {navGroups.map((group, gi) => {
                        const visibleItems = filterItems(group.items);
                        // Hide group if it has items but none are visible (except coming soon placeholders)
                        if (group.items.length > 0 && visibleItems.length === 0) return null;

                        return (
                            <div key={gi}>
                                {/* Group separator line (not before first group) */}
                                {gi > 0 && <div className="my-2 mx-2 border-t border-sidebar-border/60" />}

                                {/* Group title */}
                                {group.title && (
                                    <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                            {group.title}
                                        </span>
                                        {group.comingSoon && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                                Soon
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Coming soon placeholder with no items */}
                                {group.comingSoon && group.items.length === 0 && (
                                    <div className="px-3 py-2 flex items-center gap-3 text-muted-foreground/50">
                                        <Truck className="w-5 h-5" />
                                        <span className="text-sm">Coming soon</span>
                                    </div>
                                )}

                                {/* Nav items */}
                                {visibleItems.map(item => (
                                    <button
                                        key={item.path}
                                        onClick={() => !group.comingSoon && navigate(item.path)}
                                        className={`nav-item w-full ${isActive(item.path) ? 'active' : ''} ${group.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        disabled={group.comingSoon}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {/* Install Prompt */}
                <div className="px-4 pb-2">
                    <InstallPrompt />
                </div>

                {/* User section */}
                <div className="p-4 border-t border-sidebar-border">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => navigate('/profile')} className="flex items-center gap-3 flex-1 min-w-0 rounded-lg p-2 -mx-2 hover:bg-sidebar-accent transition-colors">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-wine-burgundy flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md shadow-primary/20">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{role?.name}</p>
                            </div>
                        </button>
                        <ThemeToggle />
                    </div>
                    <button onClick={() => { logout(); navigate('/login'); }} className="nav-item w-full text-destructive hover:bg-destructive/10">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
