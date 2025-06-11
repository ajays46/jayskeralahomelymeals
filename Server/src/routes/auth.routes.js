import express from 'express';
import { register, login, refreshToken,usersList } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

router.get('/home', authenticateToken, usersList);

export default router; 