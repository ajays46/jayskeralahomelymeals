import { useNavigate } from 'react-router-dom';
import { getCompanyBasePathFallback } from './companyPaths';
import { isCXO } from './roleUtils';

const CXO_HAT_ROLES_FOR_ROUTING = ['DELIVERY_MANAGER', 'SELLER', 'DELIVERY_EXECUTIVE'];

/**
 * Account-setup gate is only for customer-only users.
 * Staff/admin roles continue to role dashboards immediately after login.
 */
export function shouldEnforceAccountSetup(roles) {
  const roleArray = roles && Array.isArray(roles) ? roles : roles ? [roles] : [];
  if (!roleArray.length) return true;
  return roleArray.every((role) => String(role || '').toUpperCase() === 'USER');
}

/**
 * Customer users authenticated via email/Google should always land on protected page.
 * Staff roles continue to their role-specific dashboards.
 */
export function shouldForceProtectedPage(roles, user) {
  if (!shouldEnforceAccountSetup(roles)) return false;
  const hasEmail = Boolean(String(user?.email || '').trim());
  const isGoogleAuth = Boolean(user?.isGoogleAuth);
  return hasEmail || isGoogleAuth;
}

/**
 * Tenant-aware protected page destination.
 * JLG uses a dedicated protected page, while other tenants use account setup.
 */
export function getProtectedPageRoute(basePath, companyPath) {
  const normalizedBase = basePath && typeof basePath === 'string' && basePath.trim()
    ? (basePath.trim().startsWith('/') ? basePath.trim() : `/${basePath.trim()}`)
    : getCompanyBasePathFallback();
  const cp = String(companyPath || normalizedBase.replace(/^\//, '')).toLowerCase().trim();
  if (cp === 'jlg') return `${normalizedBase}/protected`;
  return `${normalizedBase}/account-setup`;
}

/**
 * Whether persisted `activeRole` should drive `getDashboardRoute` (third arg).
 * CXO may use DM/Seller/DE dashboards without those roles in the JWT list.
 */
export function resolveSelectedRoleForDashboard(roles, activeRole, basePath) {
  if (!activeRole || typeof activeRole !== 'string') return null;
  const ar = activeRole.toUpperCase();
  const roleArray = roles && Array.isArray(roles) ? roles : roles ? [roles] : [];
  const path = basePath && typeof basePath === 'string' && basePath.trim()
    ? (basePath.trim().startsWith('/') ? basePath.trim() : `/${basePath.trim()}`)
    : getCompanyBasePathFallback();
  const isMl = path === '/ml' || path.toLowerCase().endsWith('/ml');

  if (isMl) {
    if (roleArray.some((r) => (r || '').toUpperCase() === ar)) return activeRole;
    return null;
  }
  if (roleArray.some((r) => (r || '').toUpperCase() === ar)) return activeRole;
  if (isCXO(roles) && CXO_HAT_ROLES_FOR_ROUTING.includes(ar)) return activeRole;
  return null;
}

/**
 * Role-Based Routing - Dashboard route by role. Pass basePath (e.g. from useCompanyBasePath) when inside tenant routes.
 * Multicompany: pass basePath so CEO/CFO/Admin etc. go to current tenant.
 * When selectedRole is provided (e.g. from role selector), route is for that role only; roles is still used for SELLER (CXO → /seller, else /seller/customers).
 */
export const getDashboardRoute = (roles, basePath, selectedRole = null) => {
  const path = basePath && typeof basePath === 'string' && basePath.trim()
    ? basePath.trim().startsWith('/') ? basePath.trim() : `/${basePath.trim()}`
    : getCompanyBasePathFallback();

  const roleArray = roles && Array.isArray(roles) ? roles : roles ? [roles] : [];
  const isMl = path === '/ml' || path.toLowerCase().endsWith('/ml');

  // MaXHub Logistics (ML): ADMIN → /ml/admin, DELIVERY_PARTNER → dashboard, PARTNER_MANAGER → partner-manager, CEO/CFO → cxo-dashboard
  if (isMl) {
    if (selectedRole && typeof selectedRole === 'string') {
      const su = selectedRole.toUpperCase();
      if (su === 'ADMIN') return `${path}/admin`;
      if (su === 'DELIVERY_PARTNER') return `${path}/dashboard`;
      if (su === 'PARTNER_MANAGER') return `${path}/partner-manager`;
      if (su === 'CEO' || su === 'CFO') return `${path}/cxo-dashboard`;
      return path;
    }
    if (roleArray.some(r => (r || '').toUpperCase() === 'ADMIN')) return `${path}/admin`;
    if (roleArray.some(r => (r || '').toUpperCase() === 'DELIVERY_PARTNER')) return `${path}/dashboard`;
    if (roleArray.some(r => (r || '').toUpperCase() === 'PARTNER_MANAGER')) return `${path}/partner-manager`;
    if (roleArray.some(r => (r || '').toUpperCase() === 'CEO') || roleArray.some(r => (r || '').toUpperCase() === 'CFO')) return `${path}/cxo-dashboard`;
    return path;
  }

  // When a specific role is selected (e.g. role sidebar), resolve route for that role only
  if (selectedRole && typeof selectedRole === 'string') {
    const su = selectedRole.toUpperCase();
    if (su === 'CEO') return `${path}/management-dashboard`;
    if (su === 'CFO') return `${path}/financial-dashboard`;
    if (su === 'ADMIN') return `${path}/admin`;
    if (su === 'DELIVERY_MANAGER') return `${path}/delivery-manager`;
    if (su === 'SELLER') {
      const isCXO = roleArray.some(r => ['CEO', 'CFO'].includes((r || '').toUpperCase()));
      return isCXO ? `${path}/seller` : `${path}/seller/customers`;
    }
    if (su === 'DELIVERY_EXECUTIVE') return `${path}/delivery-executive`;
    if (su === 'USER') return path;
    return path;
  }

  if (!roleArray.length) return path;

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
