import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore, { applyAuthPersistMode } from '../../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute, getProtectedPageRoute, shouldForceProtectedPage } from '../../utils/roleBasedRouting';
import { useCompanyBasePath } from '../../context/TenantContext';
import { syncRememberMeStorage } from './useLogin';
import { trackGaEvent } from '../../utils/analytics';
import { showLoginError, showLoginSuccess } from '../../utils/toastConfig';

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
      const resolvedCompanyPathRaw = variables?.companyPath || data.data?.companyPath || '';
      const resolvedCompanyPath = String(resolvedCompanyPathRaw).trim().toLowerCase();

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
          companyPath: resolvedCompanyPath,
        });
      }

      const roles = data.data.roles || [data.data.role];
      const primaryRole = roles[0];

      setAccessToken(data.accessToken);
      setRoles(roles);
      setActiveRole(primaryRole);
      setUser({
        ...data.data,
        companyPath: resolvedCompanyPath || data.data?.companyPath,
        // Fallback for stale backend responses that might omit this field.
        // If this mutation succeeded, user authenticated through Google for this session.
        isGoogleAuth: data.data?.isGoogleAuth ?? true,
      });
      setIsAuthenticated(true);
      showLoginSuccess();
      trackGaEvent('login', {
        method: 'google',
        company_path: resolvedCompanyPath || 'unknown',
        role_count: Array.isArray(roles) ? roles.length : 1,
      });

      if (data.data?.companyId) {
        localStorage.setItem('company_id', data.data.companyId);
      }
      const targetBasePath = resolvedCompanyPath ? `/${resolvedCompanyPath}` : basePath;
      const isMl = resolvedCompanyPath === 'ml';
      const shouldLandOnProtectedPage = shouldForceProtectedPage(roles, {
        ...data.data,
        companyPath: resolvedCompanyPath || data.data?.companyPath,
      });
      if (!isMl && shouldLandOnProtectedPage) {
        navigate(getProtectedPageRoute(targetBasePath, resolvedCompanyPath), { replace: true });
        return;
      }

      if (!isMl && roles.length > 1) {
        setShowRoleSelector(true);
      }
      setTimeout(() => {
        if (isMl) {
          const dashboardRoute = getDashboardRoute(roles, targetBasePath);
          navigate(dashboardRoute, { replace: true });
        } else if (roles.length > 1) {
          if (resolvedCompanyPath) navigate(targetBasePath, { replace: true });
        } else {
          const dashboardRoute = getDashboardRoute(roles, targetBasePath);
          navigate(dashboardRoute, { replace: true });
        }
      }, 100);
    },
    onError: (error) => {
      showLoginError(error);
    }
  });
};

