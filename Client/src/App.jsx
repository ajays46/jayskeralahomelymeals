import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Terms from './components/Terms';
// import RegisterPage from './pages/RegisterPage';
// import LoginPage from './pages/LoginPage';
// import GustPage from './pages/GustPage';
import HomePage from './pages/HomePage';
import ProtectedRoute from './protectRoute/Protect';
import AdminPage from './pages/admin/AdminPage';
import SellerPage from './pages/SellerPage';
import ProfilePage from './pages/ProfilePage';
import ResetPassword from './components/ResetPassword';
import CompanyCreatePage from './pages/admin/CompanyCreatePage';
import MenuPage from './pages/MenuPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import AddProductPage from './pages/admin/AddProductPage';
import ProductsPage from './pages/admin/ProductsPage';
import AddMenuPage from './pages/admin/AddMenuPage';
import MenuItemPage from './pages/admin/MenuItemPage';
import MenuItemsTablePage from './pages/admin/MenuItemsTablePage';
import UsersPage from './pages/admin/UsersPage';

import CreateUserPage from './pages/CreateUserPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* <Route path="/register" element={<RegisterPage />} /> */}
          <Route path="/terms" element={<Terms />} />
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/" element={<GustPage />} /> */}
          <Route path='/' element={<Navigate to='/jkhm' replace />} ></Route>
          <Route path="/jkhm" element={<HomePage />} />
          <Route path="/reset-password/:token/:id" element={<ResetPassword />} />
          <Route path="/jkhm/menu" element={<MenuPage />} />
          <Route path="/jkhm/bookings" element={<BookingPage />} />
          <Route path="/jkhm/payment" element={<PaymentPage />} />
          <Route path="/jkhm/payment/:orderId" element={<PaymentPage />} />

          {/* ✅ Protected Route */}
          <Route element={<ProtectedRoute />}>
     
            <Route path='/admin' element={<AdminPage/>} ></Route>
            <Route path='/admin/company-create' element={<CompanyCreatePage/>} ></Route>
            <Route path='/admin/add-product' element={<AddProductPage/>} ></Route>
            <Route path='/admin/add-product/:productId' element={<AddProductPage/>} ></Route>
            <Route path='/admin/products' element={<ProductsPage/>} ></Route>
            <Route path='/admin/add-menu' element={<AddMenuPage/>} ></Route>
            <Route path='/admin/menu-items' element={<MenuItemPage/>} ></Route>
            <Route path='/admin/menu-items/:menuItemId' element={<MenuItemPage/>} ></Route>
            <Route path='/admin/menu-items-table' element={<MenuItemsTablePage/>} ></Route>
            <Route path='/admin/users' element={<UsersPage/>} ></Route>
    
    
            <Route path='/jkhm/seller' element={<SellerPage />}></Route>
            <Route path='/jkhm/profile' element={<ProfilePage />}></Route>
            <Route path='/jkhm/create-user' element={<CreateUserPage />}></Route>
          </Route>

          {/* Add more protected routes here */}
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
