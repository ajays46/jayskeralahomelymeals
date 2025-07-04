import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Terms from './components/Terms';
// import RegisterPage from './pages/RegisterPage';
// import LoginPage from './pages/LoginPage';
// import GustPage from './pages/GustPage';
import HomePage from './pages/HomePage';
import ProtectedRoute from './protectRoute/Protect';
import AdminPage from './pages/AdminPage';
import SellerPage from './pages/SellerPage';
import ProfilePage from './pages/ProfilePage';
import ResetPassword from './components/ResetPassword';
import CompanyCreatePage from './pages/CompanyCreatePage';


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
          <Route path="/jayskeralahomelymeals" element={<HomePage />} />
          <Route path="/reset-password/:token/:id" element={<ResetPassword />} />

          {/* ✅ Protected Route */}
          <Route element={<ProtectedRoute />}>
     
            <Route path='/admin' element={<AdminPage/>} ></Route>
            <Route path='/admin/company-create' element={<CompanyCreatePage/>} ></Route>
            <Route path='/seller' element={<SellerPage />}></Route>
            <Route path='/profile' element={<ProfilePage />}></Route>
          </Route>

          {/* Add more protected routes here */}
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
