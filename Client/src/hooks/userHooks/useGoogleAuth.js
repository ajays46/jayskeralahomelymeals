import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore from '../../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute } from '../../utils/roleBasedRouting';
import { useCompanyBasePath } from '../../context/TenantContext';

export const useGoogleAuth = () => {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRoles = useAuthStore((state) => state.setRoles);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setShowRoleSelector = useAuthStore((state) => state.setShowRoleSelector);
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/auth/google', payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (!data.success) return;

      const rememberFor7Days = Boolean(variables?.remember);
      if (rememberFor7Days) {
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('auth_expires_at', String(Date.now() + sevenDaysMs));
      } else {
        localStorage.removeItem('auth_expires_at');
      }

      const roles = data.data.roles || [data.data.role];
      const primaryRole = roles[0];

      setAccessToken(data.accessToken);
      setRoles(roles);
      setActiveRole(primaryRole);
      setUser(data.data);
      setIsAuthenticated(true);

      if (data.data?.companyId) {
        localStorage.setItem('company_id', data.data.companyId);
      }
      const targetBasePath = data.data?.companyPath ? `/${String(data.data.companyPath).trim()}` : basePath;
      const isMl = (data.data?.companyPath || '').toLowerCase() === 'ml';

      setTimeout(() => {
        if (isMl) {
          const dashboardRoute = getDashboardRoute(roles, targetBasePath);
          navigate(dashboardRoute, { replace: true });
        } else if (roles.length > 1) {
          if (data.data?.companyPath) navigate(targetBasePath, { replace: true });
          setShowRoleSelector(true);
        } else {
          const dashboardRoute = getDashboardRoute(roles, targetBasePath);
          navigate(dashboardRoute, { replace: true });
        }
      }, 100);
    }
  });
};

