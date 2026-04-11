/**
 * @product  max_route
 * @version  v1
 * @prefix   /api/max_route/v1
 *
 * MaX Route (MaXHub Logistics) — last-mile delivery & fleet management product.
 * Covers AI route optimization, driver shift lifecycle, trip management,
 * journey tracking, and partner/vehicle administration.
 *
 * Feature modules:
 *
 *  ai-routes    (/ai-routes)            AI route optimization, weather, zones, journey
 *                                       control, vehicle tracking, coordinator settings,
 *                                       CXO map data, executive performance
 *  trips        (/ml-trips)             Trip CRUD, dashboard, shift start, route start,
 *                                       route-overview maps, vehicle list
 *  journey      (/journey)              Mark delivery stop as reached/delivered
 *  shift        (/shift)                Driver shift status, end-shift
 *  partner-mgr  (/ml-partner-manager)   Partner manager — executives, partners, vehicles,
 *                                       assign/unassign
 *  tracking     (/)                     Live vehicle GPS position
 */
import express from 'express';
import { extractApiVersion } from '../../../middleware/apiVersion.js';

import aiRouteRoutes from '../../aiRoute.routes.js';
import mlJourneyRoutes from '../../mlJourney.routes.js';
import mlPartnerManagerRoutes from '../../mlPartnerManager.routes.js';
import mlShiftRoutes from '../../mlShift.routes.js';
import mlTripRoutes from '../../mlTrip.routes.js';
import mlVehicleTrackingRoutes from '../../mlVehicleTracking.routes.js';

const router = express.Router();

router.use(extractApiVersion);

// @feature ai-routes — AI route optimization, weather, zones, journey, vehicle tracking, CXO data
router.use('/ai-routes', aiRouteRoutes);

// @feature trips — trip CRUD, dashboard, shift/route start, route-overview maps
router.use('/ml-trips', mlTripRoutes);

// @feature journey — mark delivery stop reached/delivered
router.use('/journey', mlJourneyRoutes);

// @feature shift — driver shift status, end-shift
router.use('/shift', mlShiftRoutes);

// @feature partner-manager — executives, partners, vehicles, assign/unassign
router.use('/ml-partner-manager', mlPartnerManagerRoutes);

// @feature tracking — live vehicle GPS position
router.use('/', mlVehicleTrackingRoutes);

export default router;
