import express from 'express';
import { register, login, refreshToken, usersList, forgotPassword, resetPassword, logout, addRoleToUser, removeRoleFromUser, getUserRolesController, checkUserRole, changePassword } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);
router.get('/home', authenticateToken, usersList);

// Role management routes (protected)
router.post('/roles/add', authenticateToken, addRoleToUser);
router.post('/roles/remove', authenticateToken, removeRoleFromUser);
router.get('/roles/:userId', authenticateToken, getUserRolesController);
router.get('/roles/:userId/:roleName', authenticateToken, checkUserRole);

// Password management routes (protected)
router.post('/change-password', authenticateToken, changePassword);

export default router; 