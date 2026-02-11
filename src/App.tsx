
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
import { FeatureFlagProvider } from "@/core/feature-flags/FeatureFlagProvider";
import { FeatureGate } from "@/core/feature-flags/FeatureGate";
import { useFeatureFlags } from "@/core/feature-flags/hooks/useFeatureFlags";

// Core Pages
import Dashboard from "@/modules/dashboard/pages/Dashboard";
import ProductList from "@/modules/catalog/pages/ProductCatalog";
import ProductDetail from "@/modules/catalog/pages/ProductDetail";
import ProductForm from "@/modules/catalog/pages/ProductForm";
import ImportInventory from "@/modules/catalog/pages/ImportInventory";
import Settings from "@/modules/settings/pages/Settings";
import FeatureFlagsSettings from "@/modules/settings/pages/FeatureFlagsSettings";
import AISettings from "@/modules/settings/pages/AISettings";

// Inventory Pages (Global Session Model)
import InventoryCount from "@/modules/inventory/pages/InventoryCount";
import StartInventorisation from "@/modules/inventory/pages/StartInventorisation";
import CountingInterface from "@/modules/inventory/pages/CountingInterface";
import ReviewInventorisation from "@/modules/inventory/pages/ReviewInventorisation";
import CurrentStock from "@/modules/inventory/pages/CurrentStock";
import InventoryHistory from "@/modules/inventory/pages/InventoryHistory";
import UserManagement from "@/modules/users/pages/UserManagement";
import Reports from "@/modules/reports/pages/Reports";
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
                <Route path="/catalog" element={<ProductList />} />
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

                {/* Inventory Routes - Global Session Model */}
                <Route path="/inventory" element={
                  <FeatureGate flag="module.inventory">
                    <InventoryCount />
                  </FeatureGate>
                } />
                <Route path="/inventory/start" element={
                  <FeatureGate flag="module.inventory">
                    <StartInventorisation />
                  </FeatureGate>
                } />
                <Route path="/inventory/count" element={
                  <FeatureGate flag="module.inventory">
                    <CountingInterface />
                  </FeatureGate>
                } />
                <Route path="/inventory/review" element={
                  <FeatureGate flag="module.inventory">
                    <ReviewInventorisation />
                  </FeatureGate>
                } />
                <Route path="/inventory/stock" element={
                  <FeatureGate flag="module.inventory">
                    <CurrentStock />
                  </FeatureGate>
                } />
                <Route path="/inventory/history" element={
                  <FeatureGate flag="module.inventory">
                    <InventoryHistory />
                  </FeatureGate>
                } />

                {/* Admin / Settings */}
                <Route path="/users" element={
                  <ProtectedRoute module="users" action="view">
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={
                  <FeatureGate flag="module.settings">
                    <AppSettings />
                  </FeatureGate>
                }>
                  <Route index element={<Navigate to="general" replace />} />
                  <Route path="general" element={<GeneralSettings />} />
                  <Route path="business" element={<BusinessSettings />} />
                  <Route path="locations" element={<LocationSettings />} />
                  <Route path="glasses" element={<GlassSettings />} />
                  <Route path="inventory" element={<InventorySettings />} />
                  <Route path="syrve" element={<SyrveSettings />} />
                  <Route path="ai" element={<AISettings />} />
                  <Route path="branding" element={<BrandingSettings />} />
                  <Route path="roles" element={
                    <ProtectedRoute module="settings" action="view">
                      <RolesPermissions />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Super Admin Routes */}
                <Route path="/super-admin/feature-flags" element={
                  <ProtectedRoute module="super_admin" action="view">
                    <FeatureFlagsAdmin />
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
