import AppError from '../utils/AppError.js';

/**
 * Middleware to check if user has permission to order menu items
 * Allows: 'seller', 'user' roles
 * Blocks: 'admin' role
 */
export const checkOrderPermission = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!req.user.role) {
      throw new AppError('User role not found', 403);
    }

    // Support multiple roles (comma-separated string in token)
    const userRoles = req.user.role.split(',').map(role => role.trim());

    // Check if user has admin role
    const isAdmin = userRoles.includes('admin');
    
    if (isAdmin) {
      throw new AppError('Admins are not allowed to place orders. Please use a seller or user account.', 403);
    }

    // Check if user has at least one allowed role (seller or user)
    const allowedRoles = ['seller', 'user'];
    const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));

    if (!hasAllowedRole) {
      throw new AppError('You do not have permission to place orders. Only sellers and users can place orders.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can view/manage orders (for admin and seller)
 * Allows: 'admin', 'seller' roles
 * Blocks: 'user' role (users can only view their own orders)
 */
export const checkOrderManagementPermission = (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!req.user.role) {
      throw new AppError('User role not found', 403);
    }

    // Support multiple roles (comma-separated string in token)
    const userRoles = req.user.role.split(',').map(role => role.trim());

    // Check if user has admin or seller role
    const allowedRoles = ['admin', 'seller'];
    const hasPermission = userRoles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      throw new AppError('You do not have permission to manage orders. Only admins and sellers can manage orders.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
