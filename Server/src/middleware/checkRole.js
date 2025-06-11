import AppError from '../utils/AppError.js';

export const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError('User not authenticated', 401);
            }

            if (!req.user.role) {
                throw new AppError('User role not found', 403);
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new AppError('You do not have permission to perform this action', 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}; 