import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { 
  getDeliverySummary,
  getExecutivesPerformance,
  getTimeAnalytics,
  getFailureAnalysis,
  getRealTimeStatus
} from '../controllers/deliveryDashboard.controller.js';

const router = express.Router();

/**
 * Delivery Dashboard Routes - API endpoints for delivery analytics and management
 * Provides comprehensive delivery insights for CEO role only
 * Access: CEO only
 */

// Get delivery dashboard summary
router.get('/summary',
  authenticateToken,
  checkRole('CEO'),
  getDeliverySummary
);

// Get delivery executives performance
router.get('/executives-performance',
  authenticateToken,
  checkRole('CEO'),
  getExecutivesPerformance
);

// Get delivery time analytics
router.get('/time-analytics',
  authenticateToken,
  checkRole('CEO'),
  getTimeAnalytics
);

// Get delivery failure analysis
router.get('/failure-analysis',
  authenticateToken,
  checkRole('CEO'),
  getFailureAnalysis
);

// Get real-time delivery status
router.get('/real-time-status',
  authenticateToken,
  checkRole('CEO'),
  getRealTimeStatus
);

export default router;
