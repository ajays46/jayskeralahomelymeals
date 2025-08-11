

/**
 * Middleware to check if user has permission to order menu items
 * Allows: 'seller', 'user' roles
 * Blocks: 'admin' role
 */
export const checkOrderPermission = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to place orders',
        errorType: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role not found. Please contact support.',
        errorType: 'ROLE_NOT_FOUND'
      });
    }

    // Support multiple roles (comma-separated string in token)
    const userRoles = req.user.role.split(',').map(role => role.trim());

    // Check if user has admin role
    const isAdmin = userRoles.includes('admin') || userRoles.includes('ADMIN');
    
    if (isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admins are not allowed to place orders. Please use a seller or user account.',
        errorType: 'ADMIN_ORDER_BLOCKED'
      });
    }

    // Check if user has at least one allowed role (seller or user)
    const allowedRoles = ['SELLER', 'USER', 'seller', 'user'];
    const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));

    if (!hasAllowedRole) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to place orders. Only sellers and users can place orders.',
        errorType: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking permissions',
      errorType: 'PERMISSION_CHECK_ERROR'
    });
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
      return res.status(401).json({
        success: false,
        message: 'Please login to manage orders',
        errorType: 'AUTHENTICATION_REQUIRED'
      });
    }

    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role not found. Please contact support.',
        errorType: 'ROLE_NOT_FOUND'
      });
    }

    // Support multiple roles (comma-separated string in token)
    const userRoles = req.user.role.split(',').map(role => role.trim());

    // Check if user has admin or seller role
    const allowedRoles = ['admin', 'seller', 'ADMIN', 'SELLER'];
    const hasPermission = userRoles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage orders. Only admins and sellers can manage orders.',
        errorType: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking permissions',
      errorType: 'PERMISSION_CHECK_ERROR'
    });
  }
};
