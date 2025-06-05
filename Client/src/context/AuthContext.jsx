import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin, useRefreshToken } from '../hooks/useLogin';
import { showLoginSuccess, showLoginError } from '../utils/toastConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    isAuthenticated: false
  });
  const navigate = useNavigate();
  const { mutate: loginMutation } = useLogin();
  const { mutate: refreshTokenMutation } = useRefreshToken();

  // Function to handle login
  const handleLogin = async (credentials) => {
    try {
      await loginMutation(credentials, {
        onSuccess: (data) => {
          showLoginSuccess();
          setAuth({
            user: data.data.user,
            isAuthenticated: true
          });
          navigate('/dashboard');
        },
        onError: (error) => {
          showLoginError(error);
        }
      });
    } catch (error) {
      throw error;
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear HTTP-only cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setAuth({
        user: null,
        isAuthenticated: false
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the state even if the server request fails
      setAuth({
        user: null,
        isAuthenticated: false
      });
      navigate('/login');
    }
  };

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuth({
          user: data.user,
          isAuthenticated: true
        });
      } else {
        setAuth({
          user: null,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuth({
        user: null,
        isAuthenticated: false
      });
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    auth,
    login: handleLogin,
    logout: handleLogout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 