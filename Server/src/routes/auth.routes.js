import express from 'express';
import { register, login, refreshToken,usersList, forgotPassword,resetPassword } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/home', authenticateToken, usersList);


export default router; 