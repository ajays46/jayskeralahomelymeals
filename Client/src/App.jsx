import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';

import Terms from './components/Terms';
// import RegisterPage from './pages/RegisterPage';
// import LoginPage from './pages/LoginPage';
// import GustPage from './pages/GustPage';
import HomePage from './pages/HomePage';
import MLHomePage from './ml/pages/MLHomePage';
import MLDeliveryPartnerDashboard from './ml/pages/MLDeliveryPartnerDashboard';
import MLCXODashboard from './ml/pages/MLCXODashboard';
import MLPartnerManagerDashboard from './ml/pages/MLPartnerManagerDashboard';
import MLAddTripPage from './ml/pages/MLAddTripPage';
import MLMyTripsPage from './ml/pages/MLMyTripsPage';
import MLTripDetailPage from './ml/pages/MLTripDetailPage';
import MLRouteGuard from './ml/components/MLRouteGuard';
import ProtectedRoute from './protectRoute/Protect';
import AdminPage from './pages/admin/AdminPage';
import SellerPage from './pages/SellerPage';
import DeliveryManagerRoute from './pages/DeliveryManagerRoute';
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
// @feature kitchen-store — store manager / store operator pages (routes below with StoreModuleLayout)
import StoreManagerKitchenDashboard from './pages/store-manager/StoreManagerKitchenDashboard';
import StoreManagerPlanApprovalPage from './pages/store-manager/StoreManagerPlanApprovalPage';
import StoreManagerReportsPage from './pages/store-manager/StoreManagerReportsPage';
import StoreManagerInventoryViewPage from './pages/store-manager/StoreManagerInventoryViewPage';
import StoreManagerExpiryDashboardPage from './pages/store-manager/StoreManagerExpiryDashboardPage';
import StoreManagerStockLogsPage from './pages/store-manager/StoreManagerStockLogsPage';
import StoreOperatorRecipeBomPage from './pages/store-operator/StoreOperatorRecipeBomPage';
import StoreManagerForecastDashboardPage from './pages/store-manager/StoreManagerForecastDashboardPage';
import StoreManagerPurchaseSuggestionsPage from './pages/store-manager/StoreManagerPurchaseSuggestionsPage';
import StoreManagerMealProgramsPage from './pages/store-manager/StoreManagerMealProgramsPage';
import StoreManagerPurchaseRequestInboxPage from './pages/store-manager/StoreManagerPurchaseRequestInboxPage';
import StoreManagerPurchaseRhythmRedirect from './pages/store-manager/StoreManagerPurchaseRhythmRedirect';
import StoreManagerPurchaseRequestDetailPage from './pages/store-manager/StoreManagerPurchaseRequestDetailPage';
import StoreManagerOffListPurchaseReviewPage from './pages/store-manager/StoreManagerOffListPurchaseReviewPage';
import StoreManagerPurchaseReceiptsPage from './pages/store-manager/StoreManagerPurchaseReceiptsPage';
import StoreManagerPurchaseComparisonPage from './pages/store-manager/StoreManagerPurchaseComparisonPage';
import StoreOperatorInventoryPage from './pages/store-operator/StoreOperatorInventoryPage';
import StoreOperatorIssuePage from './pages/store-operator/StoreOperatorIssuePage';
import StoreOperatorDeliveryMealCountsPage from './pages/store-operator/StoreOperatorDeliveryMealCountsPage';
import StoreOperatorAdjustmentsPage from './pages/store-operator/StoreOperatorAdjustmentsPage';
import StoreOperatorItemDetailPage from './pages/store-operator/StoreOperatorItemDetailPage';
import StoreOperatorPurchaseReceiptsPage from './pages/store-operator/StoreOperatorPurchaseReceiptsPage';
import StoreOperatorMealReportPage from './pages/store-operator/StoreOperatorMealReportPage';
import StoreOperatorItemMasterPage from './pages/store-operator/StoreOperatorItemMasterPage';
import StoreOperatorBrandMasterPage from './pages/store-operator/StoreOperatorBrandMasterPage';
import StoreOperatorPurchaseRequestPage from './pages/store-operator/StoreOperatorPurchaseRequestPage';
import StoreOperatorPurchaseRequestDraftInboxPage from './pages/store-operator/StoreOperatorPurchaseRequestDraftInboxPage';
import StoreOperatorApprovedRequestsPage from './pages/store-operator/StoreOperatorApprovedRequestsPage';
import StoreModuleLayout from './pages/store-common/StoreModuleLayout';
import { KitchenStoreProvider } from './hooks/adminHook/kitchenStoreHook';
import StoreKitchenStockReconciliationPage from './pages/store-common/StoreKitchenStockReconciliationPage';
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
import { API } from './api/endpoints';
import { TenantProvider, useTenant } from './context/TenantContext';
import { getCompanyBasePathFallback } from './utils/companyPaths';

/** Renders MLHomePage for /ml, else HomePage (food companies). */
function TenantAwareHome() {
  const tenant = useTenant();
  const isMl = tenant?.companyPath?.toLowerCase() === 'ml';
  return isMl ? <MLHomePage /> : <HomePage />;
}

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
      api.post(`${API.AUTH}/refresh-token`)
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
      <ConfigProvider getPopupContainer={() => document.body}>
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

          {/* Customer-facing routes at root (not under company path) */}
          <Route path="/customer-portal" element={<CustomerPortalPage />} />
          <Route path="/customer-password-setup" element={<CustomerPasswordSetupPage />} />
          <Route path="/customer-login" element={<CustomerLoginPage />} />
          <Route path="/customer-orders" element={<CustomerOrdersPage />} />

          {/* Multi-tenant: /:companyPath (e.g. /jkhm, /jlg) - TenantProvider resolves company by name */}
          <Route path="/:companyPath" element={<TenantProviderWrapper />}>
            <Route index element={<TenantAwareHome />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="place-order" element={<BookingWizardPage />} />
            <Route path="process-payment" element={<PaymentWizardPage />} />

            <Route element={<ProtectedRoute />}>
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
              {/* @feature kitchen-store — tenant store module (manager + operator) */}
              <Route
                element={
                  <KitchenStoreProvider>
                    <StoreModuleLayout />
                  </KitchenStoreProvider>
                }
              >
                <Route path="store-manager/kitchen-dashboard" element={<StoreManagerKitchenDashboard />} />
                <Route path="store-manager/meal-programs" element={<StoreManagerMealProgramsPage />} />
                <Route path="store-manager/plan-approval" element={<StoreManagerPlanApprovalPage />} />
                <Route path="store-manager/reports" element={<StoreManagerReportsPage />} />
                <Route path="store-manager/inventory" element={<StoreManagerInventoryViewPage />} />
                <Route path="store-manager/expiry-dashboard" element={<StoreManagerExpiryDashboardPage />} />
                <Route path="store-manager/stock-logs" element={<StoreManagerStockLogsPage />} />
                <Route path="store-manager/forecast" element={<StoreManagerForecastDashboardPage />} />
                <Route path="store-manager/purchase-suggestions" element={<StoreManagerPurchaseSuggestionsPage />} />
                <Route path="store-manager/purchase-rhythm" element={<StoreManagerPurchaseRhythmRedirect />} />
                <Route path="store-manager/purchase-requests" element={<StoreManagerPurchaseRequestInboxPage />} />
                <Route path="store-manager/purchase-requests/:requestId" element={<StoreManagerPurchaseRequestDetailPage />} />
                <Route path="store-manager/purchase-receipts" element={<StoreManagerPurchaseReceiptsPage />} />
                <Route path="store-manager/purchase-comparison" element={<StoreManagerPurchaseComparisonPage />} />
                <Route path="store-manager/off-list-review" element={<StoreManagerOffListPurchaseReviewPage />} />
                <Route path="store-operator/inventory" element={<StoreOperatorInventoryPage />} />
                <Route path="store-operator/item-master" element={<StoreOperatorItemMasterPage />} />
                <Route path="store-operator/brand-master" element={<StoreOperatorBrandMasterPage />} />
                <Route path="store-operator/purchase-requests" element={<StoreOperatorPurchaseRequestPage />} />
                <Route path="store-operator/purchase-request-drafts" element={<StoreOperatorPurchaseRequestDraftInboxPage />} />
                <Route path="store-operator/approved-requests" element={<StoreOperatorApprovedRequestsPage />} />
                <Route path="store-operator/delivery-meal-counts" element={<StoreOperatorDeliveryMealCountsPage />} />
                <Route path="store-operator/issue" element={<StoreOperatorIssuePage />} />
                <Route path="store-operator/adjustments" element={<StoreOperatorAdjustmentsPage />} />
                <Route path="store-operator/item/:itemId" element={<StoreOperatorItemDetailPage />} />
                <Route path="store-operator/purchases" element={<StoreOperatorPurchaseReceiptsPage />} />
                <Route path="store-operator/meal-report" element={<StoreOperatorMealReportPage />} />
                <Route path="store-operator/recipe-bom" element={<StoreOperatorRecipeBomPage />} />
                <Route path="store-operator/stock-reconciliation" element={<StoreKitchenStockReconciliationPage />} />
                <Route path="store-manager/stock-reconciliation" element={<StoreKitchenStockReconciliationPage />} />
              </Route>
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
        
        {/* Footer - Conditionally rendered (hidden on NotFound page) */}
        <ConditionalFooter />
      </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
