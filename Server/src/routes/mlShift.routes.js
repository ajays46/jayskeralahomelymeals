import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import { getShiftStatus, endShift } from '../controllers/mlPartner.controller.js';

const router = express.Router();

// GET /api/shift/status - read from driver_availability (read-only)
router.get(
  '/status',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  getShiftStatus
);

// POST /api/shift/end
router.post(
  '/end',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  endShift
);

export default router;

