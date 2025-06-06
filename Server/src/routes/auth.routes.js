const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/refresh-token', protect, authController.refreshToken);
router.post('/logout', protect, authController.logout);

module.exports = router; 