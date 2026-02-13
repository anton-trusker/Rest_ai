import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductCatalog from "./pages/ProductCatalog";
import WineDetail from "./pages/WineDetail";
import WineForm from "./pages/WineForm";
import ImportInventory from "./pages/ImportInventory";
import InventoryCount from "./pages/InventoryCount";
import CurrentStock from "./pages/CurrentStock";
import InventoryHistory from "./pages/InventoryHistory";
import SessionReview from "./pages/SessionReview";
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";
import AppSettings from "./pages/AppSettings";
import GeneralSettings from "./pages/GeneralSettings";
import SyrveConnection from "./pages/SyrveConnection";
import RolesPermissions from "./pages/RolesPermissions";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { useThemeStore } from "./stores/themeStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useAuthStore } from "./stores/authStore";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}

const App = () => {
  const { initialize } = useAuthStore();
  const { fetchRoles } = useSettingsStore();

  useEffect(() => {
    initialize();
    fetchRoles();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplicator>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Protected Routes */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Catalog Routes */}
                <Route path="/catalog" element={<ProductCatalog />} />
                <Route path="/catalog/new" element={<ProtectedRoute allowedRoles={['admin']}><WineForm /></ProtectedRoute>} />
                <Route path="/catalog/:id" element={<WineDetail />} />
                <Route path="/catalog/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><WineForm /></ProtectedRoute>} />
                <Route path="/catalog/import" element={<ProtectedRoute allowedRoles={['admin']}><ImportInventory /></ProtectedRoute>} />

                {/* Inventory Routes */}
                <Route path="/count" element={<InventoryCount />} />
                <Route path="/stock" element={<ProtectedRoute allowedRoles={['admin']}><CurrentStock /></ProtectedRoute>} />
                <Route path="/history" element={<InventoryHistory />} />
                <Route path="/sessions" element={<SessionReview />} />

                {/* Admin Routes */}
                <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />

                {/* Settings Routes */}
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><AppSettings /></ProtectedRoute>} />
                <Route path="/settings/syrve" element={<ProtectedRoute allowedRoles={['admin']}><SyrveConnection /></ProtectedRoute>} />
                <Route path="/settings/general" element={<ProtectedRoute allowedRoles={['admin']}><GeneralSettings /></ProtectedRoute>} />
                <Route path="/settings/roles" element={<ProtectedRoute allowedRoles={['admin']}><RolesPermissions /></ProtectedRoute>} />

                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeApplicator>
    </QueryClientProvider>
  );
};

export default App;
