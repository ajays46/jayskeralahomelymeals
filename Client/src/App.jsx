import React, { useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';

import { initializeDraftCleanup } from './utils/draftOrderUtils';
import { trackPageView } from './utils/analytics';
import RoleSelectionSidebar from './components/RoleSelectionSidebar';
import Footer from './components/Footer';
import useAuthStore from './stores/Zustand.store';
import api from './api/axios';
import { TenantProvider, useTenant } from './context/TenantContext';
import { getCompanyBasePathFallback } from './utils/companyPaths';
import { shouldForceProtectedPage } from './utils/roleBasedRouting';

const Terms = lazy(() => import('./components/Terms'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const TenantHome = lazy(() => import('./pages/TenantHome'));
const PublicPage = lazy(() => import('./pages/Public'));
const AccountSetupPage = lazy(() => import('./pages/AccountSetupPage'));
const JLGHomePage = lazy(() => import('./pages/JLGHomePage'));
const MLHomePage = lazy(() => import('./ml/pages/MLHomePage'));
const MLDeliveryPartnerDashboard = lazy(() => import('./ml/pages/MLDeliveryPartnerDashboard'));
const MLCXODashboard = lazy(() => import('./ml/pages/MLCXODashboard'));
const MLPartnerManagerDashboard = lazy(() => import('./ml/pages/MLPartnerManagerDashboard'));
const MLAddTripPage = lazy(() => import('./ml/pages/MLAddTripPage'));
const MLMyTripsPage = lazy(() => import('./ml/pages/MLMyTripsPage'));
const MLTripDetailPage = lazy(() => import('./ml/pages/MLTripDetailPage'));
const MLRouteGuard = lazy(() => import('./ml/components/MLRouteGuard'));
const ProtectedRoute = lazy(() => import('./protectRoute/Protect'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const SellerPage = lazy(() => import('./pages/SellerPage'));
const DeliveryManagerRoute = lazy(() => import('./pages/DeliveryManagerRoute'));
const RouteComparisonPage = lazy(() => import('./pages/RouteComparisonPage'));
const RouteViewPage = lazy(() => import('./pages/RouteViewPage'));
const DeliveryExecutivePage = lazy(() => import('./pages/DeliveryExecutivePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CompanyCreatePage = lazy(() => import('./pages/admin/CompanyCreatePage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const AddProductPage = lazy(() => import('./pages/admin/AddProductPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const AddMenuPage = lazy(() => import('./pages/admin/AddMenuPage'));
const MenuItemPage = lazy(() => import('./pages/admin/MenuItemPage'));
const MenuItemsTablePage = lazy(() => import('./pages/admin/MenuItemsTablePage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const ManagementDashboardPage = lazy(() => import('./pages/ManagementDashboardPage'));
const FinancialDashboardPage = lazy(() => import('./pages/FinancialDashboardPage'));
const DeliveryDashboardPage = lazy(() => import('./pages/DeliveryDashboardPage'));
const SellerPerformanceDashboardPage = lazy(() => import('./pages/SellerPerformanceDashboardPage'));
const CreateUserPage = lazy(() => import('./pages/CreateUserPage'));
const DeliveryItemsPage = lazy(() => import('./pages/DeliveryItemsPage'));
const CustomersListPage = lazy(() => import('./pages/CustomersListPage'));
const EditCustomerPage = lazy(() => import('./pages/EditCustomerPage'));
const CustomerOrdersPage = lazy(() => import('./pages/CustomerOrdersPage'));
const BookingWizardPage = lazy(() => import('./pages/BookingWizardPage'));
const PaymentWizardPage = lazy(() => import('./pages/PaymentWizardPage'));
const UploadReceiptPage = lazy(() => import('./pages/UploadReceiptPage'));
const RoleTestPage = lazy(() => import('./pages/RoleTestPage'));
const CustomerPortalPage = lazy(() => import('./pages/CustomerPortalPage'));
const CustomerPasswordSetupPage = lazy(() => import('./pages/CustomerPasswordSetupPage'));
const CustomerLoginPage = lazy(() => import('./pages/CustomerLoginPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RoutePageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Loading...</p>
    </div>
  );
}

/** Renders tenant-specific home: ML → logistics landing; JLG → classic greens marketing home; others → minimal auth landing. */
function TenantAwareHome() {
  const tenant = useTenant();
  const path = tenant?.companyPath?.toLowerCase() ?? '';
  if (path === 'ml') return <MLHomePage />;
  if (path === 'jlg') return <JLGHomePage />;
  return <TenantHome />;
}

/**
 * ConditionalFooter - Renders Footer on tenant home and menu (any company path)
 */
const ConditionalFooter = () => {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const isHome = /^\/[^/]+$/.test(pathname);
  const isMenu = /^\/[^/]+\/menu$/.test(pathname);
  const isPublic = /^\/[^/]+\/public$/.test(pathname);
  const isAccountSetup = /^\/[^/]+\/account-setup$/.test(pathname);
  if (isHome || isMenu || isPublic || isAccountSetup) return <Footer />;
  return null;
};

function AnalyticsRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}${location.hash}`);
  }, [location.pathname, location.search, location.hash]);

  return null;
}

/** Wraps tenant routes: resolves company from URL, provides TenantContext, injects theme CSS vars for different UI per company.
 * Redirects authenticated users away from another company's URL (e.g. browser Back after login left /jkfds in history).
 */
function TenantLayout() {
  const tenant = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = tenant?.theme ?? {};
  const primary = theme.primaryColor || theme.buttonPrimary || '#FE8C00';
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';

  useLayoutEffect(() => {
    if (!isAuthenticated || !user?.companyPath) return;
    const urlSeg = String(tenant?.companyPath || '').toLowerCase().trim();
    const userSeg = String(user.companyPath).toLowerCase().trim();
    if (!urlSeg || userSeg === urlSeg) return;
    const suffix = location.pathname.replace(/^\/[^/]+/, '') || '';
    navigate(`/${userSeg}${suffix}${location.search}${location.hash}`, { replace: true });
  }, [
    isAuthenticated,
    user?.companyPath,
    tenant?.companyPath,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

  // Global setup gate: after login (email or Google), keep user on account-setup until phone + terms are completed.
  useLayoutEffect(() => {
    if (!isAuthenticated || !user) return;
    const urlSeg = String(tenant?.companyPath || user?.companyPath || '').toLowerCase().trim();
    if (!urlSeg) return;
    if (urlSeg === 'ml') return;

    const normalizedPath = String(location.pathname || '').replace(/\/+$/, '') || '/';
    const isAccountSetupPage = normalizedPath === `/${urlSeg}/account-setup`;
    const shouldStayOnProtectedPage = shouldForceProtectedPage(roles, user);

    if (!shouldStayOnProtectedPage || isAccountSetupPage) return;
    navigate(`/${urlSeg}/account-setup`, { replace: true });
  }, [
    isAuthenticated,
    user,
    user?.phone,
    user?.termsAccepted,
    user?.companyPath,
    roles,
    tenant?.companyPath,
    location.pathname,
    navigate,
  ]);

  // Set browser tab title and favicon from company theme – e.g. JLG: "Jay's Leafy Greens" + logo2.png
  useEffect(() => {
    const title = theme?.brandName || "Jay's Kerala Kitchen";
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
      document.title = "Jay's Kerala Kitchen";
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
    <ConfigProvider getPopupContainer={() => document.body}>
      <Router>
          <AnalyticsRouteTracker />
          {/* Role Selection Sidebar */}
        <RoleSelectionSidebar 
          isOpen={showRoleSelector}
          onClose={handleCloseRoleSelector}
          userRoles={roles}
        />
        
        <Suspense fallback={<RoutePageFallback />}>
        <Routes>
          <Route path="/terms" element={<Navigate to={`${getCompanyBasePathFallback()}/terms`} replace />} />
          <Route path="/reset-password/:token/:id" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to={getCompanyBasePathFallback()} replace />} />

          {/* Customer-facing routes at root (not under company path) */}
          <Route path="/customer-portal" element={<CustomerPortalPage />} />
          <Route path="/customer-password-setup" element={<CustomerPasswordSetupPage />} />
          <Route path="/customer-login" element={<CustomerLoginPage />} />
          <Route path="/customer-orders" element={<CustomerOrdersPage />} />

          {/* Multi-tenant: /:companyPath (e.g. /jkfds, /jlg) - TenantProvider resolves company by name */}
          <Route path="/:companyPath" element={<TenantProviderWrapper />}>
            <Route index element={<TenantAwareHome />} />
            <Route path="public" element={<PublicPage />} />
            <Route path="terms" element={<Terms />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="place-order" element={<BookingWizardPage />} />
            <Route path="process-payment" element={<PaymentWizardPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="account-setup" element={<AccountSetupPage />} />
              <Route path="dashboard" element={<MLRouteGuard><MLDeliveryPartnerDashboard /></MLRouteGuard>} />
              <Route path="trips" element={<MLRouteGuard><MLMyTripsPage /></MLRouteGuard>} />
              <Route path="trips/add" element={<MLRouteGuard><MLAddTripPage /></MLRouteGuard>} />
              <Route path="trips/:tripId" element={<MLRouteGuard><MLTripDetailPage /></MLRouteGuard>} />
              <Route path="cxo-dashboard" element={<MLRouteGuard><MLCXODashboard /></MLRouteGuard>} />
              <Route path="partner-manager" element={<MLRouteGuard><MLPartnerManagerDashboard /></MLRouteGuard>} />
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
              <Route path="delivery-manager" element={<DeliveryManagerRoute />} />
              <Route path="route-comparison" element={<RouteComparisonPage />} />
              <Route path="route-view" element={<RouteViewPage />} />
              <Route path="delivery-executive" element={<DeliveryExecutivePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="create-user" element={<CreateUserPage />} />
              <Route path="upload-receipt/:paymentId" element={<UploadReceiptPage />} />
              <Route path="role-test" element={<RoleTestPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </Suspense>
        
        {/* Footer - Conditionally rendered (hidden on NotFound page) */}
        <ConditionalFooter />
      </Router>
    </ConfigProvider>
  );
};

export default App;
