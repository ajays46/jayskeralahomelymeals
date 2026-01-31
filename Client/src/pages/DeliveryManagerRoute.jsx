import React from 'react';
import useAuthStore from '../stores/Zustand.store';
import { isCXO, isCEO, isCFO } from '../utils/roleUtils';
import DeliveryManagerPage from './DeliveryManagerPage';
import CXODeliveryManagersPage from './CXODeliveryManagersPage';

/**
 * DeliveryManagerRoute - Renders CXO view or full Delivery Manager dashboard based on role.
 * When user is CXO (CEO/CFO) and selects Delivery Manager from sidebar, show CXODeliveryManagersPage (managers list only).
 * Otherwise show full DeliveryManagerPage.
 */
const DeliveryManagerRoute = () => {
  const roles = useAuthStore((state) => state.roles);
  const isCXOUser = isCXO(roles) || isCEO(roles) || isCFO(roles);

  if (isCXOUser) {
    return <CXODeliveryManagersPage />;
  }

  return <DeliveryManagerPage />;
};

export default DeliveryManagerRoute;
