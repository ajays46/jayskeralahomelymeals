import { useMutation,useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { showLoginError } from '../../utils/toastConfig.jsx';
import useAuthStore from '../../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute } from '../../utils/roleBasedRouting';
import { useCompanyBasePath } from '../../context/TenantContext';
import { getCompanyBasePathFallback } from '../../utils/companyPaths';

export const useLogin = () => {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRoles = useAuthStore((state) => state.setRoles);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setShowRoleSelector = useAuthStore((state) => state.setShowRoleSelector);
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();

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
          // Company admin: redirect to their company URL so URL + data + UI match (production-friendly)
          const userCompanyPath = data.data?.companyPath;
          const targetBasePath = userCompanyPath ? `/${userCompanyPath}` : basePath;

          if (roles.length > 1) {
            // Redirect to user's company first so role selector navigates to correct company
            if (userCompanyPath) navigate(targetBasePath, { replace: true });
            setShowRoleSelector(true);
          } else {
            const dashboardRoute = getDashboardRoute(roles, targetBasePath);
            navigate(dashboardRoute, { replace: true });
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
  const basePath = useCompanyBasePath(); // Stay on current company after logout (e.g. /jlg)

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      logout();
      navigate(basePath);
    },
    onError: (error) => {
      logout();
      navigate(basePath);
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