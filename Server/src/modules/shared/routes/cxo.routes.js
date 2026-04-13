/** @product shared · @feature cxo — CEO/CFO dashboard, manager hierarchy (isolated from company type) */
import express from 'express';
import { authenticateToken } from '../../../middleware/authHandler.js';
import { checkRole } from '../../../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../../../middleware/resolveCompanyId.js';
import { getManagerExecutiveHierarchy } from '../connectors/routeConnector.js';
import {
  dashboardSummary,
  dashboardMenuDemand,
  dashboardOrderAreas,
  dashboardDriverEarnings,
  dashboardDriverDistance,
  dashboardLiveDrivers,
  dashboardRouteHistory,
} from '../controllers/cxoDashboard.controller.js';

const router = express.Router();
const cxoRole = checkRole('CEO', 'CFO', 'ADMIN');

router.use(authenticateToken);
router.use(resolveCompanyId);

// CXO only: manager → executives → performance (FRONTEND_DELIVERY_MANAGER_ISOLATION_GUIDE §3b)
router.get('/manager-executive-hierarchy', cxoRole, getManagerExecutiveHierarchy);

// CXO Dashboard – proxy to AI app (CXO_FRONTEND_API_GUIDE). Query: days | period | start_date&end_date | limit | driver_id
router.get('/dashboard/summary', requireCompanyId, cxoRole, dashboardSummary);
router.get('/dashboard/menu-demand', requireCompanyId, cxoRole, dashboardMenuDemand);
router.get('/dashboard/order-areas', requireCompanyId, cxoRole, dashboardOrderAreas);
router.get('/dashboard/driver-earnings', requireCompanyId, cxoRole, dashboardDriverEarnings);
router.get('/dashboard/driver-distance', requireCompanyId, cxoRole, dashboardDriverDistance);
router.get('/dashboard/live-drivers', requireCompanyId, cxoRole, dashboardLiveDrivers);
router.get('/dashboard/route-history', requireCompanyId, cxoRole, dashboardRouteHistory);

export default router;
