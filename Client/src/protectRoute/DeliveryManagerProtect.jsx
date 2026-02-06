import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/Zustand.store';
import { isDeliveryManager } from '../utils/roleUtils';
import { getCompanyBasePathFallback } from '../utils/companyPaths';

const DeliveryManagerProtect = () => {
  const { user, roles } = useAuthStore();
  const location = useLocation();
  const pathSegment = location.pathname.split('/')[1];
  const basePath = pathSegment ? `/${pathSegment}` : getCompanyBasePathFallback();

  if (!user) {
    return <Navigate to={basePath} replace />;
  }

  const userIsDeliveryManager = isDeliveryManager(roles);

  if (!userIsDeliveryManager) {
    return <Navigate to={basePath} replace />;
  }

  return <Outlet />;
};

export default DeliveryManagerProtect;
