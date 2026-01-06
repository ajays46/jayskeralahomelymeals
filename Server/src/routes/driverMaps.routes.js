import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import {
  getDriverNextStopMaps,
  getDriverRouteOverviewMaps
} from '../controllers/aiRoute.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Driver Maps APIs - Allow both DELIVERY_MANAGER and DELIVERY_EXECUTIVE
router.get('/next-stop-maps', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), getDriverNextStopMaps);
router.get('/route-overview-maps', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), getDriverRouteOverviewMaps);

export default router;

