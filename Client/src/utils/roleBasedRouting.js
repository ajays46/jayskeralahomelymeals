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

  // If roles is a single role (string), convert to array
  const roleArray = Array.isArray(roles) ? roles : [roles];

  // Check for CEO role first (highest priority)
  if (roleArray.some(role => role.toUpperCase() === 'CEO')) {
    return '/jkhm/management-dashboard';
  }

  // Check for CFO role (second highest priority)
  if (roleArray.some(role => role.toUpperCase() === 'CFO')) {
    return '/jkhm/financial-dashboard';
  }

  // Check for admin role
  if (roleArray.some(role => role.toUpperCase() === 'ADMIN')) {
    return '/jkhm/admin';
  }

  // Check for delivery manager role (higher priority than seller)
  if (roleArray.some(role => role.toUpperCase() === 'DELIVERY_MANAGER')) {
    return '/jkhm/delivery-manager';
  }

  // Check for seller role
  if (roleArray.some(role => role.toUpperCase() === 'SELLER')) {
    return '/jkhm/seller/customers';
  }

  // Check for delivery executive role
  if (roleArray.some(role => role.toUpperCase() === 'DELIVERY_EXECUTIVE')) {
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
