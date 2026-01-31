import { useNavigate } from 'react-router-dom';
import { getCompanyBasePathFallback } from './companyPaths';

/**
 * Role-Based Routing - Dashboard route by role. Pass basePath (e.g. from useCompanyBasePath) when inside tenant routes.
 */
export const getDashboardRoute = (roles, basePath) => {
  const base = basePath || getCompanyBasePathFallback();
  if (!roles || !Array.isArray(roles)) {
    return base;
  }
  const roleArray = Array.isArray(roles) ? roles : [roles];

  if (roleArray.some(role => role.toUpperCase() === 'CEO')) return `${base}/management-dashboard`;
  if (roleArray.some(role => role.toUpperCase() === 'CFO')) return `${base}/financial-dashboard`;
  if (roleArray.some(role => role.toUpperCase() === 'ADMIN')) return `${base}/admin`;
  if (roleArray.some(role => role.toUpperCase() === 'DELIVERY_MANAGER')) return `${base}/delivery-manager`;
  // Seller: CXO (CEO/CFO) go to seller dashboard; normal sellers go to customers list
  if (roleArray.some(role => role.toUpperCase() === 'SELLER')) {
    const isCXO = roleArray.some(r => ['CEO', 'CFO'].includes((r || '').toUpperCase()));
    return isCXO ? `${base}/seller` : `${base}/seller/customers`;
  }
  if (roleArray.some(role => role.toUpperCase() === 'DELIVERY_EXECUTIVE')) return `${base}/delivery-executive`;
  return base;
};

// Hook for role-based navigation
export const useRoleBasedNavigation = () => {
  const navigate = useNavigate();

  const navigateToDashboard = (roles) => {
    const dashboardRoute = getDashboardRoute(roles);
    navigate(dashboardRoute);
  };

  return { navigateToDashboard };
};
