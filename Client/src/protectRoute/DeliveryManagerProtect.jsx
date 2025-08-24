import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../stores/Zustand.store';
import { isDeliveryManager } from '../utils/roleUtils';

const DeliveryManagerProtect = () => {
  const { user, roles } = useAuthStore();
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/jkhm" replace />;
  }

  // Check if user has DELIVERY_MANAGER role
  const userIsDeliveryManager = isDeliveryManager(roles);

  if (!userIsDeliveryManager) {
    // User doesn't have delivery manager role, redirect to home
    return <Navigate to="/jkhm" replace />;
  }

  return <Outlet />;
};

export default DeliveryManagerProtect;
