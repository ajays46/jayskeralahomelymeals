import express from 'express';
import { getDashboardSummary } from '../controllers/managementDashboard.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';

const router = express.Router();

/**
 * Management Dashboard Routes - API endpoints for executive dashboard
 * Provides high-level business metrics and analytics
 * Access: CEO, CFO roles only
 */

// Get management dashboard summary
router.get('/summary', 
  authenticateToken, 
  checkRole('CEO', 'CFO'), 
  getDashboardSummary
);

export default router;
