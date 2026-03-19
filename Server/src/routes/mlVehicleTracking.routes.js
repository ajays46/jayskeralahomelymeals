import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import { getLiveVehicleTracking } from '../controllers/mlPartner.controller.js';

const router = express.Router();

// GET /api/vehicle-tracking/live — live vehicle position (omit vehicle_number to use JWT driver)
router.get(
  '/vehicle-tracking/live',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  getLiveVehicleTracking
);

export default router;

