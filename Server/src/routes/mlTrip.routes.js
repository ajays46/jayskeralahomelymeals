/**
 * ML Trip Routes - MaXHub Logistics delivery partner trip submission.
 * Base path: /api/ml-trips
 */
import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import {
  addTrips,
  getDashboard,
  getVehicles,
  listTrips,
  getTripsByOrderId,
  getTrip,
  updateTrip,
  updateTripDeliveryAddress,
  startShift,
  startRoute,
  getRouteOverviewMaps,
} from '../controllers/mlTrip.controller.js';

const router = express.Router();

router.get(
  '/dashboard',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  getDashboard
);

router.get(
  '/vehicles',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  getVehicles
);

router.post(
  '/shift/start',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  startShift
);

router.post(
  '/start-route',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  startRoute
);

router.get(
  '/route-overview-maps',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  getRouteOverviewMaps
);

router.get(
  '/',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  listTrips
);

router.get(
  '/by-order-id',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  getTripsByOrderId
);

router.get(
  '/:tripId',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  getTrip
);

router.patch(
  '/:tripId/delivery-address',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  updateTripDeliveryAddress
);

router.patch(
  '/:tripId',
  authenticateToken,
  checkRole('DELIVERY_PARTNER'),
  resolveCompanyId,
  requireCompanyId,
  updateTrip
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
