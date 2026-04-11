/** @product max_route · @feature journey — mark delivery stop as reached/delivered */
import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import { markStop } from '../controllers/mlPartner.controller.js';

const router = express.Router();

// POST /api/journey/mark-stop
router.post(
  '/mark-stop',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  markStop
);

export default router;

