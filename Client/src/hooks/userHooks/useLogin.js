import { useMutation,useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { showLoginError } from '../../utils/toastConfig.jsx';
import useAuthStore from '../../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute } from '../../utils/roleBasedRouting';

/**
 * useLogin - Custom hook for user authentication and login management
 * Handles login API calls, token management, and role-based navigation
 * Features: Credential validation, token storage, role-based routing, error handling
 */
export const useLogin = () => {

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRoles = useAuthStore((state) => state.setRoles);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setShowRoleSelector = useAuthStore((state) => state.setShowRoleSelector);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);       
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const roles = data.data.roles || [data.data.role]; // Handle both new and old format
        const primaryRole = roles[0]; // Use first role as default
        
        setAccessToken(data.accessToken);
        setRoles(roles);
        setActiveRole(primaryRole);
        setUser(data.data);
        setIsAuthenticated(true);
        
        // Small delay to ensure AuthSlider closes first
        setTimeout(() => {
          console.log('Login successful, roles:', roles);
          // Check if user has multiple roles
          if (roles.length > 1) {
            console.log('User has multiple roles, showing role selector');
            // Show role selection sidebar
            setShowRoleSelector(true);
          } else {
            console.log('User has single role, navigating to dashboard');
            // Navigate directly to role-specific dashboard
            const dashboardRoute = getDashboardRoute(roles);
            navigate(dashboardRoute);
          }
        }, 100);
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.toLowerCase().includes('invalid')) {
        // Do not show Toastify for invalid credentials, let Login.jsx handle it inline
        return;
      }
      showLoginError({ response: { data: { message: errorMessage } } });
    }
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      logout();
      // Navigate to home page after logout
      navigate('/jkhm');
    },
    onError: (error) => {
      // Even if the API call fails, we should still logout locally
      logout();
      // Navigate to home page after logout
      navigate('/jkhm');
    }
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    },
    onError: (error) => {
      if (!error.config?._retry) {
        const errorMessage = error.response?.data?.message || 'Session expired. Please login again.';
        showLoginError({ response: { data: { message: errorMessage } } });
      }
    }
  });
}; 

export const useUsersList = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/auth/home');
      return response.data;
    }
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (identifier) => {
      const response = await api.post('/auth/forgot-password', { identifier });
      return response.data;
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link.';
      showLoginError({ response: { data: { message: errorMessage } } });
    }
  });
};