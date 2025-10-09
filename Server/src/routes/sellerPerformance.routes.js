import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { 
  getSellerSummary, 
  getSellerDetails, 
  getTopSellers 
} from '../controllers/sellerPerformance.controller.js';

const router = express.Router();

/**
 * Seller Performance Dashboard Routes
 * All routes require authentication and CEO role
 */

// Get seller performance summary
router.get('/summary',
  authenticateToken,
  checkRole('CEO'),
  getSellerSummary
);

// Get detailed seller performance
router.get('/details',
  authenticateToken,
  checkRole('CEO'),
  getSellerDetails
);

// Get top performing sellers
router.get('/top-performers',
  authenticateToken,
  checkRole('CEO'),
  getTopSellers
);

export default router;
