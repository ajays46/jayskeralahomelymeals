const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js')
// const verifyToken = require('../middleware/auth.middleware.js');

// Public routes
router.post('/register', authController.register);

router.post('/login', authController.login);

// Protected routes
// router.post('/logout', verifyToken, authController.logout);



module.exports = router; 