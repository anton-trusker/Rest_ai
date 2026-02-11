
import { useEffect } from 'react';
import { Toaster } from "@/core/ui/toaster";
import { Toaster as Sonner } from "@/core/ui/sonner";
import { TooltipProvider } from "@/core/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import Login from "@/core/auth/pages/Login";
import { AuthProvider } from "@/core/auth/AuthProvider";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";

import Dashboard from "@/modules/dashboard/pages/Dashboard";
import ProductCatalog from "@/modules/catalog/pages/ProductCatalog";
import ProductDetail from "@/modules/catalog/pages/ProductDetail";
import ProductForm from "@/modules/catalog/pages/ProductForm";
import ImportInventory from "@/modules/catalog/pages/ImportInventory";
import InventoryCount from "@/modules/inventory/pages/InventoryCount";
import CurrentStock from "@/modules/inventory/pages/CurrentStock";
import InventoryHistory from "@/modules/inventory/pages/InventoryHistory";
import SessionReview from "@/modules/inventory/pages/SessionReview";
import UserManagement from "@/modules/users/pages/UserManagement";
import Reports from "@/modules/reports/pages/Reports";
import AppSettings from "@/core/settings/pages/AppSettings";
import GeneralSettings from "@/core/settings/pages/GeneralSettings";
import RolesPermissions from "@/modules/users/pages/RolesPermissions";
import Profile from "@/modules/users/pages/Profile";
import NotFound from "@/core/ui/pages/NotFound";
import { useThemeStore } from "@/core/settings/themeStore";

const queryClient = new QueryClient();

function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeApplicator>
      <TooltipProvider>
        <AuthProvider>
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

                {/* Catalog */}
                <Route path="/catalog" element={<ProductCatalog />} />
                <Route path="/catalog/new" element={
                  <ProtectedRoute module="catalog" action="create">
                    <ProductForm />
                  </ProtectedRoute>
                } />
                <Route path="/catalog/:id" element={<ProductDetail />} />
                <Route path="/catalog/:id/edit" element={
                  <ProtectedRoute module="catalog" action="edit">
                    <ProductForm />
                  </ProtectedRoute>
                } />
                <Route path="/catalog/import" element={<ImportInventory />} />

                {/* Inventory */}
                <Route path="/count" element={<InventoryCount />} />
                <Route path="/stock" element={
                  <ProtectedRoute module="stock" action="view">
                    <CurrentStock />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={<InventoryHistory />} />
                <Route path="/sessions" element={<SessionReview />} />

                {/* Admin / Settings */}
                <Route path="/users" element={
                  <ProtectedRoute module="users" action="view">
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<AppSettings />} />
                <Route path="/settings/general" element={<GeneralSettings />} />
                <Route path="/settings/roles" element={
                  <ProtectedRoute module="settings" action="view">
                    <RolesPermissions />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeApplicator>
  </QueryClientProvider>
);

export default App;
