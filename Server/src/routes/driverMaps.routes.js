/** @product max_kitchen · @feature drivers — next-stop & route-overview Google Maps links */
import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import {
  getDriverNextStopMaps,
  getDriverRouteOverviewMaps
} from '../controllers/aiRoute.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
// Resolve company_id from X-Company-ID header, query company_id, or user's companyId (required for external AI maps API)
router.use(resolveCompanyId);
router.use(requireCompanyId);

// Driver Maps APIs - Allow both DELIVERY_MANAGER and DELIVERY_EXECUTIVE
router.get('/next-stop-maps', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), getDriverNextStopMaps);
router.get('/route-overview-maps', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), getDriverRouteOverviewMaps);

export default router;

