import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore, { applyAuthPersistMode } from '../../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute } from '../../utils/roleBasedRouting';
import { useCompanyBasePath } from '../../context/TenantContext';
import { syncRememberMeStorage } from './useLogin';
import { trackGaEvent } from '../../utils/analytics';

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

      const rememberRaw = variables?.remember;
      const rememberOn =
        rememberRaw === true || rememberRaw === 'true' || rememberRaw === 1 || rememberRaw === '1';
      const rememberOff =
        rememberRaw === false || rememberRaw === 'false' || rememberRaw === 0 || rememberRaw === '0';
      applyAuthPersistMode(rememberOn);

      const id =
        [data.data?.email, data.data?.phone].find((v) => v != null && String(v).trim()) || '';
      if (rememberOn || rememberOff) {
        syncRememberMeStorage({
          remember: rememberOn,
          identifier: id,
          companyPath: variables?.companyPath || data.data?.companyPath,
        });
      }

      const roles = data.data.roles || [data.data.role];
      const primaryRole = roles[0];

      setAccessToken(data.accessToken);
      setRoles(roles);
      setActiveRole(primaryRole);
      setUser(data.data);
      setIsAuthenticated(true);
      trackGaEvent('login', {
        method: 'google',
        company_path: data.data?.companyPath || variables?.companyPath || 'unknown',
        role_count: Array.isArray(roles) ? roles.length : 1,
      });

      if (data.data?.companyId) {
        localStorage.setItem('company_id', data.data.companyId);
      }
      const targetBasePath = data.data?.companyPath ? `/${String(data.data.companyPath).trim()}` : basePath;
      const isMl = (data.data?.companyPath || '').toLowerCase() === 'ml';

      if (!isMl && roles.length > 1) {
        setShowRoleSelector(true);
      }
      setTimeout(() => {
        if (isMl) {
          const dashboardRoute = getDashboardRoute(roles, targetBasePath);
          navigate(dashboardRoute, { replace: true });
        } else if (roles.length > 1) {
          if (data.data?.companyPath) navigate(targetBasePath, { replace: true });
        } else {
          const dashboardRoute = getDashboardRoute(roles, targetBasePath);
          navigate(dashboardRoute, { replace: true });
        }
      }, 100);
    }
  });
};

