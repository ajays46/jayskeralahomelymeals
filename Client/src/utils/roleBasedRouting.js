import { useNavigate } from 'react-router-dom';

/**
 * Role-Based Routing - Utility functions for role-based navigation and routing
 * Handles automatic routing based on user roles and permissions
 * Features: Role-based dashboard routing, permission checking, fallback routing
 */

// Function to determine the appropriate dashboard route based on user roles
export const getDashboardRoute = (roles) => {
  if (!roles || !Array.isArray(roles)) {
    return '/jkhm'; // Default fallback
  }

  // Check for admin role first (highest priority)
  if (roles.some(role => role.toUpperCase() === 'ADMIN')) {
    return '/jkhm/admin';
  }

  // Check for delivery manager role (higher priority than seller)
  if (roles.some(role => role.toUpperCase() === 'DELIVERY_MANAGER')) {
    return '/jkhm/delivery-manager';
  }

  // Check for seller role
  if (roles.some(role => role.toUpperCase() === 'SELLER')) {
    return '/jkhm/seller/customers';
  }

  // Check for delivery executive role
  if (roles.some(role => role.toUpperCase() === 'DELIVERY_EXECUTIVE')) {
    return '/jkhm/delivery-executive';
  }

  // Default fallback for other roles or no specific role
  return '/jkhm';
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
