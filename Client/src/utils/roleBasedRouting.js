import { useNavigate } from 'react-router-dom';
import { getCompanyBasePathFallback } from './companyPaths';

/**
 * Role-Based Routing - Dashboard route by role. Pass basePath (e.g. from useCompanyBasePath) when inside tenant routes.
 * Multicompany: pass basePath so CEO/CFO/Admin etc. go to current tenant.
 */
export const getDashboardRoute = (roles, basePath) => {
  const path = basePath && typeof basePath === 'string' && basePath.trim()
    ? basePath.trim().startsWith('/') ? basePath.trim() : `/${basePath.trim()}`
    : getCompanyBasePathFallback();

  if (!roles || !Array.isArray(roles)) {
    return path;
  }
  const roleArray = Array.isArray(roles) ? roles : [roles];

  if (roleArray.some(role => role.toUpperCase() === 'CEO')) return `${path}/management-dashboard`;
  if (roleArray.some(role => role.toUpperCase() === 'CFO')) return `${path}/financial-dashboard`;
  if (roleArray.some(role => role.toUpperCase() === 'ADMIN')) return `${path}/admin`;
  if (roleArray.some(role => role.toUpperCase() === 'DELIVERY_MANAGER')) return `${path}/delivery-manager`;
  if (roleArray.some(role => role.toUpperCase() === 'SELLER')) {
    const isCXO = roleArray.some(r => ['CEO', 'CFO'].includes((r || '').toUpperCase()));
    return isCXO ? `${path}/seller` : `${path}/seller/customers`;
  }
  if (roleArray.some(role => role.toUpperCase() === 'DELIVERY_EXECUTIVE')) return `${path}/delivery-executive`;
  return path;
};

// Hook for role-based navigation (use inside tenant routes so basePath is current company)
export const useRoleBasedNavigation = (basePath) => {
  const navigate = useNavigate();
  const path = basePath ?? getCompanyBasePathFallback();

  const navigateToDashboard = (roles) => {
    const dashboardRoute = getDashboardRoute(roles, path);
    navigate(dashboardRoute);
  };

  return { navigateToDashboard };
};
