/**
 * ML Trip Routes - MaXHub Logistics delivery partner trip submission.
 * Base path: /api/ml-trips
 */
import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import { addTrips, getDashboard } from '../controllers/mlTrip.controller.js';

const router = express.Router();

router.get(
  '/dashboard',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  getDashboard
);

router.post(
  '/',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  addTrips
);

export default router;
