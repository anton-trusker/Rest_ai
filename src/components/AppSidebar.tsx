import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, Wine, Package, Users, History, BarChart3,
  LogOut, Menu, X, Settings
} from 'lucide-react';
import { useState } from 'react';

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Current Stock', icon: Package, path: '/stock' },
  { label: 'Inventory Count', icon: Wine, path: '/count' },
  { label: 'Wine Catalog', icon: Wine, path: '/catalog' },
  { label: 'User Management', icon: Users, path: '/users' },
  { label: 'History & Audit', icon: History, path: '/history' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const staffNav = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Inventory Count', icon: Wine, path: '/count' },
  { label: 'My History', icon: History, path: '/history' },
];

export default function AppSidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = user?.role === 'admin' ? adminNav : staffNav;

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar z-50 border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl wine-gradient flex items-center justify-center">
                <Wine className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-semibold text-foreground">Cellar</h1>
                <p className="text-xs text-muted-foreground">Wine Inventory</p>
              </div>
            </div>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`nav-item w-full ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-accent">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="nav-item w-full text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
