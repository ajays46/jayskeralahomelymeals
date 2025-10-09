import express from 'express';
import { 
  getDailyRevenue,
  getOrderStatusBreakdown,
  getPaymentConfirmationRate,
  getFinancialSummary
} from '../controllers/financial.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';

const router = express.Router();

/**
 * Financial Routes - API endpoints for financial analytics and reporting
 * Provides daily revenue, order status breakdown, payment metrics, and financial summaries
 * Access: CEO, CFO, ADMIN roles only
 */

// Get daily revenue data
router.get('/daily-revenue', 
  authenticateToken, 
  checkRole('CEO', 'CFO', 'ADMIN'), 
  getDailyRevenue
);

// Get order status breakdown for today
router.get('/order-status-breakdown', 
  authenticateToken, 
  checkRole('CEO', 'CFO', 'ADMIN'), 
  getOrderStatusBreakdown
);

// Get payment confirmation rate
router.get('/payment-confirmation-rate', 
  authenticateToken, 
  checkRole('CEO', 'CFO', 'ADMIN'), 
  getPaymentConfirmationRate
);

// Get comprehensive financial summary
router.get('/summary', 
  authenticateToken, 
  checkRole('CEO', 'CFO', 'ADMIN'), 
  getFinancialSummary
);

export default router;
