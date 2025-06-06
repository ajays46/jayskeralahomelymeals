import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { AuthProvider } from './context/AuthContext';
import Terms from './components/Terms';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';

// Create a client
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
        {/* <AuthProvider> */}
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<LoginPage />} />
            {/* Add more routes as needed */}
          </Routes>
        {/* </AuthProvider> */}
      </Router>
    </QueryClientProvider>
  );
};

export default App;
