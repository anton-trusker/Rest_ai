import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppSidebar from './AppSidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
