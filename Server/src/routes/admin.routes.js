import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkRole } from '../middleware/checkRole.js';

const router = express.Router();

// Example of a route that requires admin role
router.get('/dashboard', 
    verifyToken, 
    checkRole('admin'), 
    (req, res) => {
        res.json({ message: 'Welcome to admin dashboard' });
    }
);

// Example of a route that requires either admin or seller role
router.get('/products', 
    verifyToken, 
    checkRole('admin', 'seller'), 
    (req, res) => {
        res.json({ message: 'Product management access granted' });
    }
);

export default router; 