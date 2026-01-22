import {
  checkApiHealthService,
  getAvailableDatesService,
  getDeliveryDataService,
  planRouteService,
  predictStartTimeService,
  startJourneyService,
  stopReachedService,
  endJourneyService,
  getJourneyStatusService,
  getTrackingStatusService,
  vehicleTrackingService,
  getAllVehicleTrackingService,
  getCurrentWeatherService,
  getWeatherForecastService,
  getWeatherZonesService,
  getWeatherPredictionsService,
  getZonesService,
  getZoneByIdService,
  createZoneService,
  updateZoneService,
  deleteZoneService,
  getZoneDeliveriesService,
  reoptimizeRouteService,
  completeDriverSessionService,
  getMissingGeoLocationsService,
  updateGeoLocationService,
  getDriverNextStopMapsService,
  getDriverRouteOverviewMapsService,
  checkTrafficService,
  getRouteOrderService,
  getRouteStatusFromActualStopsService
} from '../services/aiRoute.service.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * AI Route Controller
 * Handles AI route optimization API endpoints
 * Features: Route planning, delivery data, journey tracking, analytics
 */

/**
 * Check API Health
 */
export const checkApiHealth = async (req, res, next) => {
  try {
    const result = await checkApiHealthService();
    
    res.status(200).json({
      success: result.success,
      status: result.status,
      service: result.service,
      port: result.port,
      timestamp: result.timestamp,
      error: result.error,
      message: result.message
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'API health check failed', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Get Available Dates
 */
export const getAvailableDates = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    
    const result = await getAvailableDatesService(limit);
    
    res.status(200).json({
      success: true,
      available_dates: result.available_dates
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch available dates', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Get Delivery Data
 */
export const getDeliveryData = async (req, res, next) => {
  try {
    const { date, session } = req.query;
    
    if (!date || !session) {
      return res.status(400).json({
        success: false,
        message: 'Date and session are required'
      });
    }
    
    const result = await getDeliveryDataService({ date, session });
    
    // Structure response according to documentation
    const deliveries = result.data || result.deliveries || [];
    
    res.status(200).json({
      success: true,
      deliveries: deliveries,
      total: deliveries.length
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch delivery data', {
      error: error.message,
      date: req.query.date,
      session: req.query.session
    });
    next(error);
  }
};

/**
 * Plan Route
 */
export const planRoute = async (req, res, next) => {
  try {
    const { delivery_date, delivery_session, num_drivers, depot_location } = req.body;
    
    if (!delivery_date || !delivery_session) {
      return res.status(400).json({
        success: false,
        message: 'Delivery date and session are required'
      });
    }
    
    const result = await planRouteService({
      delivery_date,
      delivery_session,
      num_drivers,
      depot_location
    });
    
    // Extract routes data according to documentation structure
    // Documentation shows: data.routes.routes[0].stops[]
    const routesData = result.routes || {};
    const routesArray = routesData.routes || [];
    
    // Extract route IDs for route_ids array
    const routeIds = routesArray.map(r => r.route_id).filter(Boolean);
    
    // Structure response according to documentation
    // Ensure all required fields are present
    const responseData = {
      success: result.success !== undefined ? result.success : true,
      route_id: result.route_id,
      main_route_id: result.main_route_id || result.route_id,
      route_ids: result.route_ids || routeIds.length > 0 ? routeIds : [result.route_id].filter(Boolean),
      delivery_date: delivery_date,
      delivery_session: delivery_session,
      num_drivers: result.num_drivers,
      total_deliveries: result.total_deliveries,
      routes: {
        routes: routesArray.map((route, index) => {
          // Build executive object from available data
          const executiveData = route.executive || {};
          const executive = {
            user_id: route.driver_id || executiveData.user_id || `driver_${index + 1}`,
            name: route.driver_name || executiveData.name || `Driver ${index + 1}`,
            whatsapp_number: executiveData.whatsapp_number || null,
            status: executiveData.status || 'ACTIVE',
            vehicle_number: executiveData.vehicle_number || null
          };
          
          // Process stops to ensure all fields are preserved, including address_id
          const processedStops = (route.stops || []).map(stop => {
            // Preserve all existing stop fields, ensuring address_id is included
            return {
              ...stop,
              // Explicitly ensure address_id is preserved (handle different case variations)
              address_id: stop.address_id || stop.Address_ID || stop.addressId || null
            };
          });
          
          // Ensure route has all necessary fields
          return {
            route_id: route.route_id || `${result.route_id}-${index + 1}`,
            driver_id: route.driver_id || `driver_${index + 1}`,
            executive: executive,
            stops: processedStops,
            estimated_time_hours: route.estimated_time_hours,
            total_distance_km: route.total_distance_km || route.distance_km || 0,
            // Keep additional fields for backward compatibility
            num_stops: route.num_stops || processedStops.length || 0,
            confidence: route.confidence,
            confidence_interval: route.confidence_interval,
            risk_level: route.risk_level,
            map_link: route.map_link,
            location_link: route.location_link
          };
        })
      },
      route_comparison: result.route_comparison, // Include comparison data if exists
      // Include warnings and messages from external API if present
      warnings: result.warnings || result.warning || null,
      messages: result.messages || result.message || null,
      message: result.message || null
    };
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route planned successfully', {
      delivery_date,
      delivery_session,
      num_drivers: responseData.num_drivers,
      total_deliveries: responseData.total_deliveries,
      routesCount: responseData.routes.routes.length,
      stopsCount: responseData.routes.routes[0]?.stops?.length || 0
    });
    
    res.status(200).json(responseData);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Route planning failed', {
      error: error.message,
      delivery_date: req.body?.delivery_date,
      delivery_session: req.body?.delivery_session
    });
    next(error);
  }
};

/**
 * Predict Start Time
 * Accepts either route_id OR (delivery_date + delivery_session + depot_location)
 */
export const predictStartTime = async (req, res, next) => {
  try {
    const { route_id, delivery_date, delivery_session, depot_location } = req.body;
    
    // If route_id is provided, use it; otherwise require date and session
    if (route_id) {
      const result = await predictStartTimeService({ route_id });
      return res.status(200).json(result);
    }
    
    if (!delivery_date || !delivery_session) {
      return res.status(400).json({
        success: false,
        message: 'Either route_id OR (delivery_date and delivery_session) are required'
      });
    }
    
    const result = await predictStartTimeService({
      delivery_date,
      delivery_session,
      depot_location
    });
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Start time prediction failed', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Start Journey (NEW API: /api/journey/start)
 * Executive starts journey with route_id and driver_id
 */
export const startJourney = async (req, res, next) => {
  try {
    const { driver_id, route_id } = req.body;
    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: 'driver_id is required'
      });
    }
    
    const result = await startJourneyService({
      driver_id,
      route_id // Include route_id if provided
    });
    // Ensure response matches documentation structure
    const responseData = {
      success: result.success !== undefined ? result.success : true,
      route_id: result.route_id || null,
      driver_id: result.driver_id || driver_id,
      executive_name: result.executive_name || result.executive?.name || null,
      whatsapp_number: result.whatsapp_number || result.executive?.whatsapp_number || null,
      vehicle_number: result.vehicle_number || result.executive?.vehicle_number || null,
      start_time: result.start_time || new Date().toISOString(),
      message: result.message || "Journey started successfully. Vehicle tracking is now active."
    };
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Journey started successfully', {
      driver_id,
      journey_id: result.journey_id,
      route_id: result.route_id
    });
    
    res.status(200).json(responseData);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Journey start failed', {
      error: error.message,
      driver_id: req.body?.driver_id
    });
    next(error);
  }
};

/**
 * Stop Reached / Mark Stop (NEW API: /api/journey/mark-stop or /api/journey/stop-reached)
 * Mark delivery stop as reached/delivered
 * Supports both old format (user_id, latitude, longitude) and new format (current_location {lat, lng})
 */
export const stopReached = async (req, res, next) => {
  try {
    const { 
      route_id, 
      planned_stop_id,
      stop_order, // Keep for backward compatibility
      delivery_id, 
      driver_id,
      completed_at,
      current_location,
      // Legacy parameters (for backward compatibility)
      user_id,
      latitude,
      longitude,
      status,
      packages_delivered
    } = req.body;
    
    // Validate required fields - use planned_stop_id if provided, otherwise fallback to stop_order
    const stopIdentifier = planned_stop_id || stop_order;
    if (!route_id || stopIdentifier === undefined) {
      return res.status(400).json({
        success: false,
        message: 'route_id and planned_stop_id (or stop_order for backward compatibility) are required'
      });
    }
    
    // Transform to service format
    // If new format (current_location) is provided, use it
    // Otherwise, use legacy format (latitude, longitude)
    let serviceData = {
      route_id,
      planned_stop_id: planned_stop_id || undefined,
      stop_order: stop_order || undefined, // Keep for backward compatibility
      delivery_id,
      completed_at: completed_at || new Date().toISOString()
    };
    
    // Add driver_id if provided (required by external API)
    if (driver_id) {
      serviceData.driver_id = driver_id;
    } else if (user_id) {
      // Fallback to user_id if driver_id not provided
      serviceData.driver_id = user_id;
    }
    
    // Handle location - prefer new format, fallback to legacy
    if (current_location && current_location.lat && current_location.lng) {
      serviceData.current_location = {
        lat: current_location.lat,
        lng: current_location.lng
      };
    } else if (latitude !== undefined && longitude !== undefined) {
      // Legacy format - convert to new format
      serviceData.current_location = {
        lat: latitude,
        lng: longitude
      };
    }
    
    // Legacy parameters (for backward compatibility with external API)
    if (user_id) serviceData.user_id = user_id;
    if (status) serviceData.status = status;
    if (packages_delivered !== undefined) serviceData.packages_delivered = packages_delivered;
    
    const result = await stopReachedService(serviceData);
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Stop reached marked successfully', {
      route_id,
      planned_stop_id: planned_stop_id || stop_order,
      completed_at: serviceData.completed_at
    });
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Stop reached failed', {
      error: error.message,
      route_id: req.body?.route_id
    });
    next(error);
  }
};

/**
 * End Journey (NEW API: /api/journey/end)
 * End journey with final location
 */
export const endJourney = async (req, res, next) => {
  try {
    const { user_id, route_id, latitude, longitude } = req.body;
    
    if (!user_id || !route_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and route_id are required'
      });
    }
    
    const result = await endJourneyService({
      user_id,
      route_id,
      latitude,
      longitude
    });
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Journey ended successfully', {
      route_id,
      total_duration_minutes: result.total_duration_minutes
    });
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Journey end failed', {
      error: error.message,
      route_id: req.body?.route_id
    });
    next(error);
  }
};

/**
 * Get Journey Status (NEW API: /api/journey/status/:route_id)
 */
export const getJourneyStatus = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'routeId is required'
      });
    }
    
    const result = await getJourneyStatusService(routeId);
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get journey status failed', {
      error: error.message,
      routeId: req.params?.routeId
    });
    next(error);
  }
};

/**
 * Get Tracking Status
 */
export const getTrackingStatus = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'routeId is required'
      });
    }
    
    const result = await getTrackingStatusService(routeId);
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch tracking status', {
      error: error.message,
      routeId: req.params?.routeId
    });
    next(error);
  }
};

/**
 * Vehicle Tracking
 * Save vehicle GPS tracking points (complete journey tracking)
 */
export const vehicleTracking = async (req, res, next) => {
  try {
    const { route_id, driver_id, session_id, tracking_points } = req.body;
    
    if (!route_id || !tracking_points || !Array.isArray(tracking_points) || tracking_points.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'route_id and tracking_points are required'
      });
    }
    
    // Validate tracking points structure
    for (const point of tracking_points) {
      if (!point.timestamp || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Each tracking point must have timestamp, latitude, and longitude'
        });
      }
    }
    
    const result = await vehicleTrackingService({
      route_id,
      driver_id,
      session_id,
      tracking_points
    });
    
    // Ensure response includes all documented fields
    const responseData = {
      success: result.success !== undefined ? result.success : true,
      points_saved: result.points_saved || tracking_points.length,
      route_id: result.route_id || route_id,
      driver_id: result.driver_id || driver_id,
      vehicle_number: result.vehicle_number || null,
      start_time: result.start_time || null,
      total_distance_km: result.total_distance_km || 0,
      total_time_minutes: result.total_time_minutes || null
    };
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Vehicle tracking data saved successfully', {
      route_id,
      points_saved: responseData.points_saved
    });
    
    res.status(200).json(responseData);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Vehicle tracking failed', {
      error: error.message,
      route_id: req.body?.route_id
    });
    next(error);
  }
};

export const getAllVehicleTracking = async (req, res, next) => {
  try {
    const result = await getAllVehicleTrackingService();
    logInfo(LOG_CATEGORIES.SYSTEM, 'All vehicle tracking fetched', {
      data: result
    });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch all vehicle tracking', {
      error: error.message
    });
  }
};

/**
 * Get Current Weather
 * Supports both lat/lng (documentation) and latitude/longitude (backward compatibility)
 */
export const getCurrentWeather = async (req, res, next) => {
  try {
    // Support both formats: lat/lng (doc) and latitude/longitude (current)
    const lat = req.query.lat || req.query.latitude;
    const lng = req.query.lng || req.query.longitude;
    const zone_id = req.query.zone_id;
    
    // If zone_id is provided, try to get zone coordinates
    let finalLat = lat;
    let finalLng = lng;
    
    if (zone_id && (!lat || !lng)) {
      try {
        // Fetch zone details to get coordinates
        const zoneData = await getZoneByIdService(zone_id);
        if (zoneData?.zone?.boundaries) {
          // Calculate center point from boundaries
          const boundaries = zoneData.zone.boundaries;
          finalLat = (boundaries.north + boundaries.south) / 2;
          finalLng = (boundaries.east + boundaries.west) / 2;
        } else if (zoneData?.zone?.center_lat && zoneData?.zone?.center_lng) {
          // Use center coordinates if available
          finalLat = zoneData.zone.center_lat;
          finalLng = zoneData.zone.center_lng;
        }
      } catch (zoneError) {
        // If zone lookup fails, try passing zone_id directly to external API
        logInfo(LOG_CATEGORIES.SYSTEM, 'Zone lookup failed, passing zone_id to external API', {
          zone_id,
          error: zoneError.message
        });
      }
    }
    
    // If still no coordinates and no zone_id, return error
    if (!finalLat || !finalLng) {
      if (zone_id) {
        // If zone_id was provided but we couldn't get coordinates, try passing zone_id directly
        const result = await getCurrentWeatherService({ 
          zone_id
        });
        return res.status(200).json(result);
      } else {
        return res.status(400).json({
          success: false,
          message: 'lat and lng (or latitude and longitude) are required, or provide zone_id'
        });
      }
    }
    
    const result = await getCurrentWeatherService({ 
      zone_id, 
      latitude: finalLat, 
      longitude: finalLng 
    });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch current weather', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Get Weather Forecast
 */
export const getWeatherForecast = async (req, res, next) => {
  try {
    const { zone_id, latitude, longitude, days, session } = req.query;
    
    const result = await getWeatherForecastService({ 
      zone_id, 
      latitude, 
      longitude, 
      days: days ? parseInt(days) : 5,
      session 
    });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch weather forecast', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Get Weather for All Zones
 */
export const getWeatherZones = async (req, res, next) => {
  try {
    const { priority, is_active } = req.query;
    
    const result = await getWeatherZonesService({ 
      priority: priority ? parseInt(priority) : undefined,
      is_active: is_active !== undefined ? parseInt(is_active) : 1
    });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch zones weather', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Get Weather Predictions
 */
export const getWeatherPredictions = async (req, res, next) => {
  try {
    const { latitude, longitude, days, session } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'latitude and longitude are required'
      });
    }
    
    const result = await getWeatherPredictionsService({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      days: days ? parseInt(days) : 7,
      session
    });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch weather predictions', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Get All Zones
 */
export const getZones = async (req, res, next) => {
  try {
    const { is_active, zone_type } = req.query;
    
    const result = await getZonesService({
      is_active: is_active !== undefined ? parseInt(is_active) : undefined,
      zone_type
    });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch zones', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Get Zone by ID
 */
export const getZoneById = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    
    if (!zoneId) {
      return res.status(400).json({
        success: false,
        message: 'zoneId is required'
      });
    }
    
    const result = await getZoneByIdService(zoneId);
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch zone', {
      error: error.message,
      zoneId: req.params?.zoneId
    });
    next(error);
  }
};

/**
 * Create Zone
 */
export const createZone = async (req, res, next) => {
  try {
    const { id, name, center_latitude, center_longitude, radius_km, priority, zone_type, is_active } = req.body;
    
    if (!name || center_latitude === undefined || center_longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, center_latitude, and center_longitude are required'
      });
    }
    
    const result = await createZoneService({
      id,
      name,
      center_latitude,
      center_longitude,
      radius_km: radius_km || 2.0,
      priority: priority || 1,
      zone_type: zone_type || 'delivery',
      is_active: is_active !== undefined ? is_active : 1
    });
    
    res.status(201).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to create zone', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Update Zone
 */
export const updateZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const updateData = req.body;
    
    if (!zoneId) {
      return res.status(400).json({
        success: false,
        message: 'zoneId is required'
      });
    }
    
    const result = await updateZoneService(zoneId, updateData);
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to update zone', {
      error: error.message,
      zoneId: req.params?.zoneId
    });
    next(error);
  }
};

/**
 * Delete Zone
 */
export const deleteZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    
    if (!zoneId) {
      return res.status(400).json({
        success: false,
        message: 'zoneId is required'
      });
    }
    
    const result = await deleteZoneService(zoneId);
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to delete zone', {
      error: error.message,
      zoneId: req.params?.zoneId
    });
    next(error);
  }
};

/**
 * Get Zone Deliveries
 */
export const getZoneDeliveries = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const { date, session } = req.query;
    
    if (!zoneId) {
      return res.status(400).json({
        success: false,
        message: 'zoneId is required'
      });
    }
    
    const result = await getZoneDeliveriesService(zoneId, { date, session });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch zone deliveries', {
      error: error.message,
      zoneId: req.params?.zoneId
    });
    next(error);
  }
};

/**
 * Re-optimize Route
 */
export const reoptimizeRoute = async (req, res, next) => {
  try {
    const { route_id, current_location, delay_minutes, traffic_data, weather_data } = req.body;

    if (!route_id) {
      return res.status(400).json({
        success: false,
        message: 'route_id is required'
      });
    }
    
    const result = await reoptimizeRouteService({
      route_id,
      current_location,
      delay_minutes,
      traffic_data,
      weather_data
    });
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route reoptimization completed', {
      route_id,
      reoptimized: result.reoptimized
    });
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Route reoptimization failed', {
      error: error.message,
      route_id: req.body?.route_id
    });
    next(error);
  }
};

/**
 * Check Traffic and Auto-Reoptimize (NEW API: /api/journey/check-traffic)
 * Checks traffic on remaining route segments and auto-reoptimizes if heavy traffic detected
 */
export const checkTraffic = async (req, res, next) => {
  try {
    const { route_id, current_location, check_all_segments } = req.body;
    
    if (!route_id) {
      return res.status(400).json({
        success: false,
        message: 'route_id is required'
      });
    }
    
    const result = await checkTrafficService({
      route_id,
      current_location,
      check_all_segments: check_all_segments !== false // default to true
    });
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Traffic check completed', {
      route_id,
      heavy_traffic_detected: result.heavy_traffic_detected,
      reoptimized: result.reoptimized
    });
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Traffic check failed', {
      error: error.message,
      route_id: req.body?.route_id
    });
    next(error);
  }
};

/**
 * Get Route Order (NEW API: /api/journey/route-order/:route_id)
 * Get current route order with stop status
 */
export const getRouteOrder = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'routeId is required'
      });
    }
    
    const result = await getRouteOrderService(routeId);
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get route order failed', {
      error: error.message,
      routeId: req.params?.routeId
    });
    next(error);
  }
};

/**
 * Complete Driver Session
 */
export const completeDriverSession = async (req, res, next) => {
  try {
    const { route_id } = req.body;
    
    if (!route_id) {
      return res.status(400).json({
        success: false,
        message: 'route_id is required'
      });
    }
    
    const result = await completeDriverSessionService({
      route_id
    });
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Driver session completed', {
      route_id
    });
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Driver session completion failed', {
      error: error.message,
      route_id: req.body?.route_id
    });
    next(error);
  }
};

/**
 * Get Missing Geo Locations
 */
export const getMissingGeoLocations = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await getMissingGeoLocationsService(limit);
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch missing geo locations', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Update Geo Location
 */
export const updateGeoLocation = async (req, res, next) => {
  try {
    const { address_id, delivery_item_id, geo_location, order_id, menu_item_id, delivery_date, session } = req.body;
    
    if (!geo_location) {
      return res.status(400).json({
        success: false,
        message: 'geo_location is required (format: "lat,lng")'
      });
    }
    
    // Validate geo_location format
    const parts = geo_location.split(',');
    if (parts.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'geo_location must be in format "latitude,longitude"'
      });
    }
    
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values'
      });
    }
    
    let finalAddressId = address_id;
    let finalDeliveryItemId = delivery_item_id;
    
    // If delivery_item_id or address_id not provided, try to find delivery item using order_id and menu_item_id
    if (!finalAddressId && !finalDeliveryItemId) {
      if (order_id && menu_item_id) {
        try {
          const prisma = (await import('../config/prisma.js')).default;
          
          // Build where clause
          const whereClause = {
            orderId: order_id,
            menuItemId: menu_item_id
          };
          
          // Add delivery_date if provided
          if (delivery_date) {
            // Parse the delivery_date (handle GMT format)
            const dateObj = new Date(delivery_date);
            if (!isNaN(dateObj.getTime())) {
              // Set to start of day for comparison
              const startOfDay = new Date(dateObj);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(dateObj);
              endOfDay.setHours(23, 59, 59, 999);
              
              whereClause.deliveryDate = {
                gte: startOfDay,
                lte: endOfDay
              };
            }
          }
          
          // Add session/deliveryTimeSlot if provided
          if (session) {
            // Map session to deliveryTimeSlot format
            const sessionMap = {
              'BREAKFAST': 'BREAKFAST',
              'LUNCH': 'LUNCH',
              'DINNER': 'DINNER',
              'Breakfast': 'BREAKFAST',
              'Lunch': 'LUNCH',
              'Dinner': 'DINNER'
            };
            const deliveryTimeSlot = sessionMap[session] || session.toUpperCase();
            whereClause.deliveryTimeSlot = deliveryTimeSlot;
          }
          
          // Find the delivery item
          const deliveryItem = await prisma.deliveryItem.findFirst({
            where: whereClause,
            select: {
              id: true,
              addressId: true
            }
          });
          
          if (deliveryItem) {
            finalDeliveryItemId = deliveryItem.id;
            finalAddressId = deliveryItem.addressId;
          } else {
            return res.status(404).json({
              success: false,
              message: 'Delivery item not found with the provided order_id, menu_item_id, and optional filters'
            });
          }
        } catch (dbError) {
          logError(LOG_CATEGORIES.SYSTEM, 'Error finding delivery item', {
            error: dbError.message,
            order_id,
            menu_item_id,
            delivery_date,
            session
          });
          return res.status(500).json({
            success: false,
            message: 'Error finding delivery item: ' + dbError.message
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either (address_id or delivery_item_id) or (order_id and menu_item_id) is required'
        });
      }
    }
    
    const result = await updateGeoLocationService({
      address_id: finalAddressId,
      delivery_item_id: finalDeliveryItemId,
      geo_location
    });
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Geo location updated successfully', {
      address_id: result.address_id,
      delivery_item_id: finalDeliveryItemId,
      geo_location
    });
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to update geo location', {
      error: error.message
    });
    next(error);
  }
};

/**
 * Get Driver Next Stop Maps
 * Fetch individual stop map links for drivers
 */
export const getDriverNextStopMaps = async (req, res, next) => {
  try {
    const { date, session } = req.query;
    
    if (!date || !session) {
      return res.status(400).json({
        success: false,
        message: 'date and session query parameters are required'
      });
    }
    
    const result = await getDriverNextStopMapsService({ date, session });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get driver next stop maps failed', {
      error: error.message,
      date: req.query?.date,
      session: req.query?.session
    });
    next(error);
  }
};

/**
 * Get Driver Route Overview Maps
 * Fetch route overview map links for drivers
 */
export const getDriverRouteOverviewMaps = async (req, res, next) => {
  try {
    const { date, session } = req.query;
    
    if (!date || !session) {
      return res.status(400).json({
        success: false,
        message: 'date and session query parameters are required'
      });
    }
    
    const result = await getDriverRouteOverviewMapsService({ date, session });
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get driver route overview maps failed', {
      error: error.message,
      date: req.query?.date,
      session: req.query?.session
    });
    next(error);
  }
};

/**
 * Get Route Status from Actual Route Stops
 * Returns journey status, marked stops, and completed sessions from actual_route_stops table
 */
export const getRouteStatusFromActualStops = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    const { driver_id, date } = req.query;
    
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'routeId is required'
      });
    }
    
    const result = await getRouteStatusFromActualStopsService(routeId, driver_id || null, date || null);
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route status retrieved', {
      route_id: routeId,
      is_journey_started: result.is_journey_started,
      marked_stops_count: result.marked_stops?.length || 0,
      completed_sessions_count: result.completed_sessions?.length || 0
    });
    
    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get route status failed', {
      error: error.message,
      routeId: req.params?.routeId
    });
    next(error);
  }
};

