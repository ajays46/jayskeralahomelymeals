import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Terms from './components/Terms';
// import RegisterPage from './pages/RegisterPage';
// import LoginPage from './pages/LoginPage';
// import GustPage from './pages/GustPage';
import HomePage from './pages/HomePage';
import ProtectedRoute from './protectRoute/Protect';
import AdminPage from './pages/admin/AdminPage';
import SellerPage from './pages/SellerPage';
import DeliveryManagerPage from './pages/DeliveryManagerPage';
import RouteComparisonPage from './pages/RouteComparisonPage';
import RouteViewPage from './pages/RouteViewPage';
import DeliveryExecutivePage from './pages/DeliveryExecutivePage';
import ProfilePage from './pages/ProfilePage';
import ResetPassword from './components/ResetPassword';
import CompanyCreatePage from './pages/admin/CompanyCreatePage';
import MenuPage from './pages/MenuPage';
import AddProductPage from './pages/admin/AddProductPage';
import ProductsPage from './pages/admin/ProductsPage';
import AddMenuPage from './pages/admin/AddMenuPage';
import MenuItemPage from './pages/admin/MenuItemPage';
import MenuItemsTablePage from './pages/admin/MenuItemsTablePage';
import UsersPage from './pages/admin/UsersPage';
import ManagementDashboardPage from './pages/ManagementDashboardPage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import DeliveryDashboardPage from './pages/DeliveryDashboardPage';
import SellerPerformanceDashboardPage from './pages/SellerPerformanceDashboardPage';

import CreateUserPage from './pages/CreateUserPage';
import DeliveryItemsPage from './pages/DeliveryItemsPage';
import CustomersListPage from './pages/CustomersListPage';
import EditCustomerPage from './pages/EditCustomerPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import BookingWizardPage from './pages/BookingWizardPage';
import PaymentWizardPage from './pages/PaymentWizardPage';
import UploadReceiptPage from './pages/UploadReceiptPage';
import RoleTestPage from './pages/RoleTestPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import CustomerPasswordSetupPage from './pages/CustomerPasswordSetupPage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import NotFound from './pages/NotFound';
import { initializeDraftCleanup } from './utils/draftOrderUtils';
import RoleSelectionSidebar from './components/RoleSelectionSidebar';
import Footer from './components/Footer';
import useAuthStore from './stores/Zustand.store';
import api from './api/axios';
import { TenantProvider, useTenant } from './context/TenantContext';
import { getCompanyBasePathFallback } from './utils/companyPaths';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * ConditionalFooter - Renders Footer on tenant home and menu (any company path)
 */
const ConditionalFooter = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const isHome = /^\/[^/]+$/.test(pathname);
  const isMenu = /^\/[^/]+\/menu$/.test(pathname);
  if (isHome || isMenu) return <Footer />;
  return null;
};

/** Wraps tenant routes: resolves company from URL, provides TenantContext, injects theme CSS vars for different UI per company. */
function TenantLayout() {
  const tenant = useTenant();
  const theme = tenant?.theme ?? {};
  const primary = theme.primaryColor || theme.buttonPrimary || '#FE8C00';
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';

  // Set browser tab title and favicon from company theme – e.g. JLG: "Jay's Leafy Greens" + logo2.png
  useEffect(() => {
    const title = theme?.brandName || "Jay's Kerala Homely Meals";
    const faviconHref = theme?.logoUrl || '/logo.png';
    document.title = title;
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.setAttribute('href', faviconHref);
    return () => {
      document.title = "Jay's Kerala Homely Meals";
      link.setAttribute('href', '/logo.png');
    };
  }, [theme?.brandName, theme?.logoUrl]);

  if (tenant?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  if (tenant?.error && !tenant?.companyId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-4">
        <p className="text-red-600">Company not found.</p>
        <button
          type="button"
          onClick={tenant.redirectToDefault}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to home
        </button>
      </div>
    );
  }
  return (
    <div
      className="tenant-root"
      style={{
        ['--tenant-primary']: primary,
        ['--tenant-accent']: accent,
      }}
    >
      <Outlet />
    </div>
  );
}

/** Provider + layout for routes under /:companyPath */
function TenantProviderWrapper() {
  return (
    <TenantProvider>
      <TenantLayout />
    </TenantProvider>
  );
}

/**
 * App - Main application component with routing and authentication
 * Handles all route definitions, protected routes, and global state management
 * Features: React Query setup, role-based routing, authentication guards
 */
const App = () => {
  const { showRoleSelector, setShowRoleSelector, roles } = useAuthStore();

  // After persist rehydration: if we have user/roles but no accessToken (memory-only), get new token via refresh cookie
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const state = useAuthStore.getState();
      if (state.accessToken) return;
      if (!state.user && !state.isAuthenticated) return;
      api.post('/auth/refresh-token')
        .then((res) => {
          if (res.data?.accessToken) state.setAccessToken(res.data.accessToken);
        })
        .catch(() => { state.logout(); });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Initialize draft cleanup on app startup
  React.useEffect(() => {
    initializeDraftCleanup();
  }, []);

  const handleCloseRoleSelector = () => {
    setShowRoleSelector(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Role Selection Sidebar */}
        <RoleSelectionSidebar 
          isOpen={showRoleSelector}
          onClose={handleCloseRoleSelector}
          userRoles={roles}
        />
        
        <Routes>
          <Route path="/terms" element={<Terms />} />
          <Route path="/reset-password/:token/:id" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to={getCompanyBasePathFallback()} replace />} />

          {/* Multi-tenant: /:companyPath (e.g. /jkhm, /jlg) - TenantProvider resolves company by name */}
          <Route path="/:companyPath" element={<TenantProviderWrapper />}>
            <Route index element={<HomePage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="place-order" element={<BookingWizardPage />} />
            <Route path="process-payment" element={<PaymentWizardPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="management-dashboard" element={<ManagementDashboardPage />} />
              <Route path="financial-dashboard" element={<FinancialDashboardPage />} />
              <Route path="delivery-dashboard" element={<DeliveryDashboardPage />} />
              <Route path="seller-performance-dashboard" element={<SellerPerformanceDashboardPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/company-create" element={<CompanyCreatePage />} />
              <Route path="admin/add-product" element={<AddProductPage />} />
              <Route path="admin/add-product/:productId" element={<AddProductPage />} />
              <Route path="admin/products" element={<ProductsPage />} />
              <Route path="admin/add-menu" element={<AddMenuPage />} />
              <Route path="admin/menu-items" element={<MenuItemPage />} />
              <Route path="admin/menu-items/:menuItemId" element={<MenuItemPage />} />
              <Route path="admin/menu-items-table" element={<MenuItemsTablePage />} />
              <Route path="admin/users" element={<UsersPage />} />
              <Route path="seller" element={<SellerPage />} />
              <Route path="seller/customers" element={<CustomersListPage />} />
              <Route path="customer-orders" element={<CustomerOrdersPage />} />
              <Route path="edit-customer" element={<EditCustomerPage />} />
              <Route path="delivery-items/:orderId" element={<DeliveryItemsPage />} />
              <Route path="delivery-manager" element={<DeliveryManagerPage />} />
              <Route path="route-comparison" element={<RouteComparisonPage />} />
              <Route path="route-view" element={<RouteViewPage />} />
              <Route path="delivery-executive" element={<DeliveryExecutivePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="create-user" element={<CreateUserPage />} />
              <Route path="upload-receipt/:paymentId" element={<UploadReceiptPage />} />
              <Route path="role-test" element={<RoleTestPage />} />
            </Route>
          </Route>

          <Route path="/customer-portal" element={<CustomerPortalPage />} />
          <Route path="/customer-password-setup" element={<CustomerPasswordSetupPage />} />
          <Route path="/customer-login" element={<CustomerLoginPage />} />
          <Route path="/customer-orders" element={<CustomerOrdersPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Footer - Conditionally rendered (hidden on NotFound page) */}
        <ConditionalFooter />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
