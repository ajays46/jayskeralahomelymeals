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
  updateGeoLocation
} from '../controllers/aiRoute.controller.js';

const router = express.Router();

// All AI route routes require authentication and DELIVERY_MANAGER role
router.use(authenticateToken);
router.use(checkRole('DELIVERY_MANAGER'));

// Health check
router.get('/health', checkApiHealth);

// Delivery data
router.get('/delivery-data/available-dates', getAvailableDates);
router.get('/delivery-data', getDeliveryData);

// Route planning
router.post('/route/plan', planRoute);
router.post('/route/predict-start-time', predictStartTime);

// Journey management (NEW APIs matching documentation)
router.post('/journey/start', startJourney);
router.post('/journey/stop-reached', stopReached);
router.post('/journey/end', endJourney);
router.get('/journey/status/:routeId', getJourneyStatus);
router.get('/route/tracking-status/:routeId', getTrackingStatus);

// Vehicle tracking
router.post('/vehicle-tracking', vehicleTracking);
router.get('/vehicle/tracking/all', getAllVehicleTracking);

// Weather
router.get('/weather/current', getCurrentWeather);
router.get('/weather/forecast', getWeatherForecast);
router.get('/weather/zones', getWeatherZones);
router.get('/weather/predictions', getWeatherPredictions);

// Zones
router.get('/zones', getZones);
router.get('/zones/:zoneId', getZoneById);
router.post('/zones', createZone);
router.put('/zones/:zoneId', updateZone);
router.delete('/zones/:zoneId', deleteZone);
router.get('/zones/:zoneId/deliveries', getZoneDeliveries);

// Route re-optimization
router.post('/route/reoptimize', reoptimizeRoute);

// Driver session completion
router.post('/driver-session/:sessionId/complete', completeDriverSession);

// Address geo-location management
router.get('/address/get-missing-geo-locations', getMissingGeoLocations);
router.post('/address/update-geo-location', updateGeoLocation);

export default router;

