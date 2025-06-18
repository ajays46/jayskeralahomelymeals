import AppError from '../utils/AppError.js';

export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    console.log(req.user, "req.user");

    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (!req.user.role) {
        throw new AppError('User role not found', 403);
      }

      // Support multiple roles (comma-separated string in token)
      const userRoles = req.user.role.split(',').map(role => role.trim());

      const hasPermission = userRoles.some(role => allowedRoles.includes(role));

      if (!hasPermission) {
        throw new AppError('You do not have permission to perform this action', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
