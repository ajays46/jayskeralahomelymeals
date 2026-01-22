import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import {
  checkApiHealth,
  getAvailableDates,
  getDeliveryData,
  planRoute,
  predictStartTime,
  startJourney,
  stopReached,
  endJourney,
  getJourneyStatus,
  getTrackingStatus,
  vehicleTracking,
  getAllVehicleTracking,
  getCurrentWeather,
  getWeatherForecast,
  getWeatherZones,
  getWeatherPredictions,
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  getZoneDeliveries,
  reoptimizeRoute,
  completeDriverSession,
  getMissingGeoLocations,
  updateGeoLocation,
  checkTraffic,
  getRouteOrder,
  getRouteStatusFromActualStops,
  updateDeliveryComment
} from '../controllers/aiRoute.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Health check
router.get('/health', checkApiHealth);

// Delivery data - DELIVERY_MANAGER only
router.get('/delivery-data/available-dates', checkRole('DELIVERY_MANAGER'), getAvailableDates);
router.get('/delivery-data', checkRole('DELIVERY_MANAGER'), getDeliveryData);

// Route planning - DELIVERY_MANAGER only
router.post('/route/plan', checkRole('DELIVERY_MANAGER'), planRoute);
router.post('/route/predict-start-time', checkRole('DELIVERY_MANAGER'), predictStartTime);

// Journey management (NEW APIs matching documentation)
// Allow both DELIVERY_MANAGER and DELIVERY_EXECUTIVE for journey operations
router.post('/journey/start', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), startJourney);
// router.post('/journey/stop-reached', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), stopReached); // Legacy endpoint
router.post('/journey/mark-stop', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), stopReached); // New endpoint matching documentation
router.post('/journey/end',checkRole('DELIVERY_EXECUTIVE'), endJourney);
router.get('/journey/status/:routeId', checkRole('DELIVERY_EXECUTIVE'), getJourneyStatus);
router.get('/route/tracking-status/:routeId', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), getTrackingStatus);
// Traffic check and auto-reoptimization - Allow both DELIVERY_MANAGER and DELIVERY_EXECUTIVE
router.post('/journey/check-traffic', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), checkTraffic);
// Get route order - Allow both DELIVERY_MANAGER and DELIVERY_EXECUTIVE
router.get('/journey/route-order/:routeId', checkRole('DELIVERY_MANAGER', 'DELIVERY_EXECUTIVE'), getRouteOrder);

// Get route status from actual_route_stops - DELIVERY_EXECUTIVE only
router.get('/route/:routeId/status', checkRole('DELIVERY_EXECUTIVE'), getRouteStatusFromActualStops);

// Vehicle tracking - DELIVERY_MANAGER only
router.post('/vehicle-tracking', checkRole('DELIVERY_MANAGER'), vehicleTracking);
router.get('/vehicle/tracking/all', checkRole('DELIVERY_MANAGER'), getAllVehicleTracking);

// Weather - DELIVERY_MANAGER only
router.get('/weather/current', checkRole('DELIVERY_MANAGER'), getCurrentWeather);
router.get('/weather/forecast', checkRole('DELIVERY_MANAGER'), getWeatherForecast);
router.get('/weather/zones', checkRole('DELIVERY_MANAGER'), getWeatherZones);
router.get('/weather/predictions', checkRole('DELIVERY_MANAGER'), getWeatherPredictions);

// Zones - DELIVERY_MANAGER only
router.get('/zones', checkRole('DELIVERY_MANAGER'), getZones);
router.get('/zones/:zoneId', checkRole('DELIVERY_MANAGER'), getZoneById);
router.post('/zones', checkRole('DELIVERY_MANAGER'), createZone);
router.put('/zones/:zoneId', checkRole('DELIVERY_MANAGER'), updateZone);
router.delete('/zones/:zoneId', checkRole('DELIVERY_MANAGER'), deleteZone);
router.get('/zones/:zoneId/deliveries', checkRole('DELIVERY_MANAGER'), getZoneDeliveries);

// Route re-optimization - DELIVERY_MANAGER only
router.post('/route/reoptimize', checkRole('DELIVERY_EXECUTIVE'), reoptimizeRoute);

// Driver session completion - DELIVERY_EXECUTIVE only
router.post('/driver-session/complete', checkRole('DELIVERY_EXECUTIVE'), completeDriverSession);

// Address geo-location management - DELIVERY_MANAGER only
router.get('/address/get-missing-geo-locations', checkRole('DELIVERY_MANAGER'), getMissingGeoLocations);
router.post('/address/update-geo-location', checkRole('DELIVERY_MANAGER'), updateGeoLocation);

// Delivery data comments - DELIVERY_MANAGER only
router.put('/delivery_data/:deliveryId/comments', checkRole('DELIVERY_MANAGER'), updateDeliveryComment);

export default router;

