import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';

/** @feature kitchen-store — Legacy `/purchase-rhythm` → purchase request inbox. */
const StoreManagerPurchaseRhythmRedirect = () => {
  const basePath = useCompanyBasePath();
  return <Navigate to={`${basePath}/store-manager/purchase-requests`} replace />;
};

export default StoreManagerPurchaseRhythmRedirect;
