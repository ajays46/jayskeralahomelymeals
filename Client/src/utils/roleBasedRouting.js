import { useNavigate } from 'react-router-dom';

// Function to determine the appropriate dashboard route based on user roles
export const getDashboardRoute = (roles) => {
  if (!roles || !Array.isArray(roles)) {
    return '/jkhm'; // Default fallback
  }

  // Check for admin role first (highest priority)
  if (roles.some(role => role.toUpperCase() === 'ADMIN')) {
    return '/jkhm/admin';
  }

  // Check for seller role
  if (roles.some(role => role.toUpperCase() === 'SELLER')) {
    return '/jkhm/seller';
  }

  // Check for delivery manager role
  if (roles.some(role => role.toUpperCase() === 'DELIVERY_MANAGER')) {
    return '/jkhm/delivery-manager';
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
