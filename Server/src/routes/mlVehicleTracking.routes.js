import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import { vehicleTracking } from '../controllers/mlPartner.controller.js';

const router = express.Router();

// POST /api/vehicle-tracking
router.post(
  '/vehicle-tracking',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  vehicleTracking
);

export default router;

