import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import { endShift } from '../controllers/mlPartner.controller.js';

const router = express.Router();

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

