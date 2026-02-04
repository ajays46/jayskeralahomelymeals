import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * ConditionalFooter - Conditionally renders Footer based on current route
 * Only shows Footer on HomePage and MenuPage, hides on all other pagesc
 */
const ConditionalFooter = () => {
  const location = useLocation();
  
  // Only show footer on these specific routes
  const allowedRoutes = [
    '/jkhm',           // HomePage (exact match)
    '/jkhm/menu',      // MenuPage (exact match)
  ];
  
  // Check if current pathname is in the allowed routes
  if (allowedRoutes.includes(location.pathname)) {
    return <Footer />;
  }
  
  // Hide footer on all other pages
  return null;
};

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
          {/* <Route path="/register" element={<RegisterPage />} /> */}
          <Route path="/terms" element={<Terms />} />
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/" element={<GustPage />} /> */}
          <Route path='/' element={<Navigate to='/jkhm' replace />} ></Route>
          <Route path="/jkhm" element={<HomePage />} />
          <Route path="/reset-password/:token/:id" element={<ResetPassword />} />
          <Route path="/jkhm/menu" element={<MenuPage />} />
          <Route path="/jkhm/place-order" element={<BookingWizardPage />} />
          <Route path="/jkhm/process-payment" element={<PaymentWizardPage />} />

          {/* ✅ Protected Route */}
          <Route element={<ProtectedRoute />}>
     
            <Route path='/jkhm/management-dashboard' element={<ManagementDashboardPage/>} ></Route>
            <Route path='/jkhm/financial-dashboard' element={<FinancialDashboardPage/>} ></Route>
            <Route path='/jkhm/delivery-dashboard' element={<DeliveryDashboardPage/>} ></Route>
            <Route path='/jkhm/seller-performance-dashboard' element={<SellerPerformanceDashboardPage/>} ></Route>
            <Route path='/jkhm/admin' element={<AdminPage/>} ></Route>
            <Route path='/jkhm/admin/company-create' element={<CompanyCreatePage/>} ></Route>
            <Route path='/jkhm/admin/add-product' element={<AddProductPage/>} ></Route>
            <Route path='/jkhm/admin/add-product/:productId' element={<AddProductPage/>} ></Route>
            <Route path='/jkhm/admin/products' element={<ProductsPage/>} ></Route>
            <Route path='/jkhm/admin/add-menu' element={<AddMenuPage/>} ></Route>
            <Route path='/jkhm/admin/menu-items' element={<MenuItemPage/>} ></Route>
            <Route path='/jkhm/admin/menu-items/:menuItemId' element={<MenuItemPage/>} ></Route>
            <Route path='/jkhm/admin/menu-items-table' element={<MenuItemsTablePage/>} ></Route>
            <Route path='/jkhm/admin/users' element={<UsersPage/>} ></Route>
    
    
            <Route path='/jkhm/seller' element={<SellerPage />}></Route>
            <Route path='/jkhm/seller/customers' element={<CustomersListPage />}></Route>
            <Route path='/jkhm/customer-orders' element={<CustomerOrdersPage />}></Route>
            <Route path='/jkhm/edit-customer' element={<EditCustomerPage />}></Route>
            <Route path='/jkhm/delivery-items/:orderId' element={<DeliveryItemsPage />}></Route>
            <Route path='/jkhm/delivery-manager' element={<DeliveryManagerPage />}></Route>
            <Route path='/jkhm/route-comparison' element={<RouteComparisonPage />}></Route>
            <Route path='/jkhm/route-view' element={<RouteViewPage />}></Route>
            <Route path='/jkhm/delivery-executive' element={<DeliveryExecutivePage />}></Route>
            <Route path='/jkhm/profile' element={<ProfilePage />}></Route>
            <Route path='/jkhm/create-user' element={<CreateUserPage />}></Route>
            <Route path='/jkhm/upload-receipt/:paymentId' element={<UploadReceiptPage />}></Route>
            <Route path='/jkhm/role-test' element={<RoleTestPage />}></Route>
          </Route>

          {/* Customer Portal Routes (No authentication required - uses token) */}
          <Route path='/customer-portal' element={<CustomerPortalPage />}></Route>
          <Route path='/customer-password-setup' element={<CustomerPasswordSetupPage />}></Route>
          <Route path='/customer-login' element={<CustomerLoginPage />}></Route>
          <Route path='/customer-orders' element={<CustomerOrdersPage />}></Route>

          {/* Catch-all route for undefined routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Footer - Conditionally rendered (hidden on NotFound page) */}
        <ConditionalFooter />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
