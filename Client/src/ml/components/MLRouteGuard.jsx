/**
 * MLRouteGuard - Renders children only when tenant is MaXHub Logistics (companyPath === 'ml').
 * Otherwise redirects to company home. Use for /:companyPath/dashboard and /:companyPath/cxo-dashboard
 * so only /ml/dashboard and /ml/cxo-dashboard are valid.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';

const MLRouteGuard = ({ children }) => {
  const tenant = useTenant();
  const base = tenant?.companyPath ? `/${tenant.companyPath}` : '/jkhm';
  if (tenant?.companyPath?.toLowerCase() !== 'ml') {
    return <Navigate to={base} replace />;
  }
  return children;
};

export default MLRouteGuard;
