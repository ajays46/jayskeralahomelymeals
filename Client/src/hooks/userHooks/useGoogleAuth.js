import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import useAuthStore, { applyAuthPersistMode } from '../../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute } from '../../utils/roleBasedRouting';
import { useCompanyBasePath } from '../../context/TenantContext';
import { syncRememberMeStorage } from './useLogin';

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
    mutationFn: async ({ credential, accessToken, mode, companyPath, remember = true }) => {
      const response = await api.post('/auth/google', {
        credential,
        accessToken,
        mode,
        companyPath,
        remember,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (!data.success) return;

      const resolvedCompanyPathRaw = variables?.companyPath || data.data?.companyPath || '';
      const resolvedCompanyPath = String(resolvedCompanyPathRaw).trim().toLowerCase();
      const roles = data.data.roles || [data.data.role];

      applyAuthPersistMode(true);
      syncRememberMeStorage({
        remember: true,
        identifier: data.data.email,
        companyPath: resolvedCompanyPath,
      });

      setAccessToken(data.accessToken);
      setRoles(roles);
      setActiveRole(roles[0]);
      setUser({
        ...data.data,
        companyPath: resolvedCompanyPath || data.data?.companyPath,
      });
      setIsAuthenticated(true);

      if (data.data?.companyId) {
        localStorage.setItem('company_id', data.data.companyId);
      }

      const targetBasePath = resolvedCompanyPath ? `/${resolvedCompanyPath}` : basePath;
      const isMl = resolvedCompanyPath === 'ml';

      setTimeout(() => {
        if (isMl) {
          navigate(getDashboardRoute(roles, targetBasePath), { replace: true });
        } else if (roles.length > 1) {
          if (resolvedCompanyPath) navigate(targetBasePath, { replace: true });
          setShowRoleSelector(true);
        } else {
          navigate(getDashboardRoute(roles, targetBasePath), { replace: true });
        }
      }, 100);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Google sign-in failed. Please try again.';
      toast.error(message);
    },
  });
};
