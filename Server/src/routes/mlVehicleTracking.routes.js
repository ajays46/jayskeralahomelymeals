import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import { vehicleTracking, getLiveVehicleTracking } from '../controllers/mlPartner.controller.js';

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

// GET /api/vehicle-tracking/live?vehicle_number=... — proxy to 5004 live tracking (same format as 5004 response)
router.get(
  '/vehicle-tracking/live',
  authenticateToken,
  checkRole('DELIVERY_PARTNER', 'PARTNER_MANAGER'),
  resolveCompanyId,
  requireCompanyId,
  getLiveVehicleTracking
);

export default router;

