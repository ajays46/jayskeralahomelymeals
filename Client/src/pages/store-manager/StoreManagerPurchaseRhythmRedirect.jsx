import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';

/** @feature kitchen-store — Legacy `/purchase-rhythm` → combined inbox with rhythm tab. */
const StoreManagerPurchaseRhythmRedirect = () => {
  const basePath = useCompanyBasePath();
  return <Navigate to={`${basePath}/store-manager/purchase-requests?view=rhythm`} replace />;
};

export default StoreManagerPurchaseRhythmRedirect;
