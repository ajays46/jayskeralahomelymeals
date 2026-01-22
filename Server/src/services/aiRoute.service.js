import AppError from '../utils/AppError.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';
import axios from 'axios';
import prisma from '../config/prisma.js';

/**
 * AI Route Service
 * Handles business logic for AI route optimization
 * Proxies requests to external AI Route Optimization API
 */

const AI_ROUTE_API_BASE_URL = process.env.AI_ROUTE_API_THIRD;
const AI_ROUTE_API = process.env.AI_ROUTE_API;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: AI_ROUTE_API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create separate axios instance for AI_ROUTE_API endpoints
const apiClientRouteAPI = axios.create({
  baseURL: AI_ROUTE_API,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Check API Health
 */
export const checkApiHealthService = async () => {
  try {
    const response = await apiClient.get('/api/health');
    const data = response.data;
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'AI Route API health check', {
      status: data.status,
      service: data.service
    });
    
    return {
      success: true,
      status: data.status || 'OK',
      service: data.service,
      port: data.port,
      timestamp: data.timestamp
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'AI Route API health check failed', {
      error: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      status: 'ERROR',
      error: 'Connection failed',
      message: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get Available Dates
 */
export const getAvailableDatesService = async (limit = 30) => {
  try {
    const response = await apiClient.get('/api/delivery_data/available-dates', {
      params: { limit }
    });
    const data = response.data;
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Available dates fetched', {
      count: data.available_dates?.length || 0
    });
    
    return {
      success: true,
      available_dates: data.available_dates || []
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch available dates', {
      error: error.message,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch available dates', 
      error.response?.status || 500
    );
  }
};

/**
 * Get Delivery Data
 */
export const getDeliveryDataService = async (filters = {}) => {
  try {
    const { date, session } = filters;
    const params = {};
    if (date) params.date = date;
    if (session) params.session = session;
    
    const response = await apiClient.get('/api/delivery_data', { params });
    const data = response.data;
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery data fetched', {
      date,
      session,
      count: data.data?.length || 0
    });
    
    return {
      success: true,
      data: data.data || []
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch delivery data', {
      error: error.message,
      filters,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch delivery data', 
      error.response?.status || 500
    );
  }
};

/**
 * Plan Route
 */
export const planRouteService = async (routeData) => {
  try {
    const { delivery_date, delivery_session, num_drivers, depot_location } = routeData;

    const response = await apiClient.post('/api/route/plan', {
      delivery_date,
      delivery_session,
      num_drivers,
      depot_location
    });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Route planning failed');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route planned successfully', {
      delivery_date,
      delivery_session,
      num_drivers: data.num_drivers,
      total_deliveries: data.total_deliveries
    });
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Route planning failed', {
      error: error.message,
      routeData,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Route planning failed', 
      error.response?.status || 500
    );
  }
};

/**
 * Predict Start Time
 * Accepts either route_id OR (delivery_date + delivery_session + depot_location)
 */
export const predictStartTimeService = async (predictionData) => {
  try {
    const { route_id, delivery_date, delivery_session, depot_location } = predictionData;
    
    // Build request body based on available parameters
    const requestBody = route_id 
      ? { route_id }
      : { delivery_date, delivery_session, depot_location };
    
    const response = await apiClient.post('/api/route/predict-start-time', requestBody);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to predict start time');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Start time predicted', {
      route_id: route_id || 'N/A',
      delivery_date: delivery_date || 'N/A',
      delivery_session: delivery_session || 'N/A',
      predicted_time: data.predicted_start_time || data.predicted_start_datetime
    });
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Start time prediction failed', {
      error: error.message,
      predictionData,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to predict start time', 
      error.response?.status || 500
    );
  }
};

/**
 * Start Journey (NEW API: /api/journey/start)
 * Executive starts journey with route_id and driver_id
 */
export const startJourneyService = async (journeyData) => {
  try {
    const { driver_id, route_id } = journeyData;
    
    // Build request body - include route_id if provided
    const requestBody = {
      driver_id
    };
    
    // Include route_id if provided (required for session-specific routes)
    if (route_id) {
      requestBody.route_id = route_id;
    }
    
    // Send driver_id and route_id to the external API
    const response = await apiClient.post('/api/journey/start', requestBody);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to start journey');
    }
    
    // Use the route_id from request if API doesn't return one, or use API's route_id
    const finalRouteId = data.route_id || route_id;
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Journey started', {
      driver_id,
      route_id: finalRouteId,
      journey_id: data.journey_id,
      api_route_id: data.route_id
    });
    
    // Ensure route_id is in the response
    return {
      ...data,
      route_id: finalRouteId
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Journey start failed', {
      error: error.message,
      journeyData,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to start journey', 
      error.response?.status || 500
    );
  }
};

/**
 * Mark Stop Reached (NEW API: /api/journey/mark-stop)
 * Mark delivery stop as reached/delivered
 * Supports both new format (current_location) and legacy format (latitude, longitude)
 */
export const stopReachedService = async (stopData) => {
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
    } = stopData;
    
    // Build request body according to documentation format
    // Prefer planned_stop_id over stop_order
    const requestBody = {
      route_id,
      delivery_id
    };
    
    // Use planned_stop_id if provided, otherwise fallback to stop_order
    if (planned_stop_id) {
      requestBody.planned_stop_id = planned_stop_id;
    } else if (stop_order !== undefined) {
      requestBody.stop_order = stop_order;
    }
    
    // Add driver_id if provided (required by external API to auto-detect driver)
    if (driver_id) {
      requestBody.driver_id = driver_id;
    } else if (user_id) {
      // Fallback to user_id if driver_id not provided
      requestBody.driver_id = user_id;
    }
    
    // Add completed_at if provided
    if (completed_at) {
      requestBody.completed_at = completed_at;
    }
    
    // Add status if provided (Delivered or CUSTOMER_UNAVAILABLE)
    if (status) {
      requestBody.status = status;
    }
    
    // Add current_location if available (new format)
    if (current_location && current_location.lat && current_location.lng) {
      requestBody.current_location = {
        lat: current_location.lat,
        lng: current_location.lng
      };
    } else if (latitude !== undefined && longitude !== undefined) {
      // Legacy format - convert to new format
      requestBody.current_location = {
        lat: latitude,
        lng: longitude
      };
    }
    
    // Use only the mark-stop endpoint (no fallback)
    const response = await apiClient.post('/api/journey/mark-stop', requestBody);
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to mark stop reached');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Stop reached marked', {
      route_id,
      planned_stop_id: planned_stop_id || stop_order,
      completed_at: completed_at || 'current time'
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Stop reached failed', {
      error: error.message,
      stopData,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to mark stop reached', 
      error.response?.status || 500
    );
  }
};

/**
 * End Journey (NEW API: /api/journey/end)
 * End journey with final location
 */
export const endJourneyService = async (journeyData) => {
  try {
    const { user_id, route_id, latitude, longitude } = journeyData;
    
    const response = await apiClient.post('/api/journey/end', {
      user_id,
      route_id,
      latitude,
      longitude
    });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to end journey');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Journey ended', {
      route_id,
      total_duration_minutes: data.total_duration_minutes
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Journey end failed', {
      error: error.message,
      journeyData,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to end journey', 
      error.response?.status || 500
    );
  }
};

/**
 * Get Journey Status (NEW API: /api/journey/status/:route_id)
 */
export const getJourneyStatusService = async (routeId) => {
  try {
    const response = await apiClient.get(`/api/journey/status/${routeId}`);
    const data = response.data;    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get journey status');
    }
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get journey status failed', {
      error: error.message,
      routeId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to get journey status', 
      error.response?.status || 500
    );
  }
};

/**
 * Get Tracking Status
 */
export const getTrackingStatusService = async (routeId) => {
  try {
    const response = await apiClient.get(`/api/route/tracking-status/${routeId}`);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch tracking status');
    }
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch tracking status', {
      error: error.message,
      routeId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch tracking status', 
      error.response?.status || 500
    );
  }
};

/**
 * Vehicle Tracking
 * Save vehicle GPS tracking points (complete journey tracking)
 */
export const vehicleTrackingService = async (trackingData) => {
  try {
    const { route_id, driver_id, session_id, tracking_points } = trackingData;
    
    if (!route_id || !tracking_points || !Array.isArray(tracking_points) || tracking_points.length === 0) {
      throw new Error('route_id and tracking_points are required');
    }
    
    const response = await apiClient.post('/api/vehicle-tracking', {
      route_id,
      driver_id,
      session_id,
      tracking_points
    });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to save vehicle tracking data');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Vehicle tracking data saved', {
      route_id,
      driver_id,
      points_saved: data.points_saved || tracking_points.length,
      total_distance_km: data.total_distance_km
    });
    
    return {
      success: true,
      ...data
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Vehicle tracking failed', {
      error: error.message,
      route_id: trackingData?.route_id,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to save vehicle tracking data', 
      error.response?.status || 500
    );
  }
};

export const getAllVehicleTrackingService = async () => {
  try {
    const response = await apiClient.get('/api/vehicles/tracking/all');
    const data = response.data;
    logInfo(LOG_CATEGORIES.SYSTEM, 'All vehicle tracking fetched', {
      data: data
    });
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch all vehicle tracking');
    }
    return data;
   
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch all vehicle tracking', {
      error: error.message
    });
  }
};

/**
 * Get Current Weather
 */
export const getCurrentWeatherService = async (params) => {
  try {
    const response = await apiClient.get('/api/weather/current', { params });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch current weather');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Current weather fetched', {
      zone_id: params.zone_id,
      latitude: params.latitude,
      longitude: params.longitude
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch current weather', {
      error: error.message,
      params,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch current weather',
      error.response?.status || 500
    );
  }
};

/**
 * Get Weather Forecast
 */
export const getWeatherForecastService = async (params) => {
  try {
    const response = await apiClient.get('/api/weather/forecast', { params });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch weather forecast');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Weather forecast fetched', {
      zone_id: params.zone_id,
      days: params.days
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch weather forecast', {
      error: error.message,
      params,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch weather forecast',
      error.response?.status || 500
    );
  }
};

/**
 * Get Weather for All Zones
 */
export const getWeatherZonesService = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/weather/zones', { params });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch zones weather');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Zones weather fetched', {
      count: data.count
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch zones weather', {
      error: error.message,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch zones weather',
      error.response?.status || 500
    );
  }
};

/**
 * Get Weather Predictions
 */
export const getWeatherPredictionsService = async (params) => {
  try {
    const response = await apiClient.get('/api/weather/predictions', { params });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch weather predictions');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Weather predictions fetched', {
      days: params.days,
      session: params.session
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch weather predictions', {
      error: error.message,
      params,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch weather predictions',
      error.response?.status || 500
    );
  }
};

/**
 * Get All Zones
 */
export const getZonesService = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/zones', { params });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch zones');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Zones fetched', {
      count: data.count
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch zones', {
      error: error.message,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch zones',
      error.response?.status || 500
    );
  }
};

/**
 * Get Zone by ID
 */
export const getZoneByIdService = async (zoneId) => {
  try {
    const response = await apiClient.get(`/api/zones/${zoneId}`);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch zone');
    }
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch zone', {
      error: error.message,
      zoneId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch zone',
      error.response?.status || 500
    );
  }
};

/**
 * Create Zone
 */
export const createZoneService = async (zoneData) => {
  try {
    const response = await apiClient.post('/api/zones', zoneData);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create zone');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Zone created', {
      zone_id: data.zone_id
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to create zone', {
      error: error.message,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to create zone',
      error.response?.status || 500
    );
  }
};

/**
 * Update Zone
 */
export const updateZoneService = async (zoneId, zoneData) => {
  try {
    const response = await apiClient.put(`/api/zones/${zoneId}`, zoneData);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update zone');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Zone updated', {
      zone_id: zoneId
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to update zone', {
      error: error.message,
      zoneId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to update zone',
      error.response?.status || 500
    );
  }
};

/**
 * Delete Zone
 */
export const deleteZoneService = async (zoneId) => {
  try {
    const response = await apiClient.delete(`/api/zones/${zoneId}`);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete zone');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Zone deleted', {
      zone_id: zoneId
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to delete zone', {
      error: error.message,
      zoneId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to delete zone',
      error.response?.status || 500
    );
  }
};

/**
 * Get Zone Deliveries
 */
export const getZoneDeliveriesService = async (zoneId, params = {}) => {
  try {
    const response = await apiClient.get(`/api/zones/${zoneId}/deliveries`, { params });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch zone deliveries');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Zone deliveries fetched', {
      zone_id: zoneId,
      count: data.count
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch zone deliveries', {
      error: error.message,
      zoneId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch zone deliveries',
      error.response?.status || 500
    );
  }
};

/**
 * Re-optimize Route
 */
export const reoptimizeRouteService = async (reoptimizeData) => {
  try {
    const response = await apiClient.post('/api/route/reoptimize', reoptimizeData);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to reoptimize route');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route reoptimized', {
      route_id: reoptimizeData.route_id,
      reoptimized: data.reoptimized
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Route reoptimization failed', {
      error: error.message,
      route_id: reoptimizeData?.route_id,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to reoptimize route',
      error.response?.status || 500
    );
  }
};

/**
 * Check Traffic and Auto-Reoptimize (NEW API: /api/journey/check-traffic)
 * Checks traffic on remaining route segments and auto-reoptimizes if heavy traffic (≥1.5x) detected
 */
export const checkTrafficService = async (trafficData) => {
  try {
    const { route_id, current_location, check_all_segments } = trafficData;
    
    if (!route_id) {
      throw new Error('route_id is required');
    }
    
    const response = await apiClient.post('/api/journey/check-traffic', {
      route_id,
      current_location,
      check_all_segments: check_all_segments !== false
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to check traffic');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Traffic check completed', {
      route_id,
      heavy_traffic_detected: data.heavy_traffic_detected,
      reoptimized: data.reoptimized,
      max_traffic_multiplier: data.max_traffic_multiplier
    });
    
    return {
      success: true,
      traffic_checked: true,
      heavy_traffic_detected: data.heavy_traffic_detected || false,
      reoptimized: data.reoptimized || false,
      max_traffic_multiplier: data.max_traffic_multiplier || null,
      traffic_segments: data.traffic_segments || [],
      reoptimization_result: data.reoptimization_result || null,
      updated_route_order: data.updated_route_order || null,
      reason: data.reason || null
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Traffic check failed', {
      error: error.message,
      route_id: trafficData?.route_id,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to check traffic',
      error.response?.status || 500
    );
  }
};

/**
 * Get Route Order (NEW API: /api/journey/route-order/:route_id)
 * Get current route order with stop status
 */
export const getRouteOrderService = async (routeId) => {
  try {
    if (!routeId) {
      throw new Error('routeId is required');
    }
    
    const response = await apiClient.get(`/api/journey/route-order/${routeId}`);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get route order');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route order fetched', {
      route_id: routeId,
      stops_count: data.stops?.length || 0
    });
    
    return {
      success: true,
      route_id: routeId,
      stops: data.stops || [],
      ...data
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get route order failed', {
      error: error.message,
      routeId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to get route order',
      error.response?.status || 500
    );
  }
};

/**
 * Get Missing Geo Locations
 */
export const getMissingGeoLocationsService = async (limit = 100) => {
  try {
    const response = await apiClient.get('/api/address/get-missing-geo-locations', {
      params: { limit }
    });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch missing geo locations');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Missing geo locations fetched', {
      count: data.count
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch missing geo locations', {
      error: error.message,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch missing geo locations',
      error.response?.status || 500
    );
  }
};

/**
 * Update Geo Location
 */
export const updateGeoLocationService = async (updateData) => {
  try {
    const response = await apiClient.post('/api/address/update-geo-location', updateData);
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update geo location');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Geo location updated', {
      address_id: data.address_id,
      geo_location: data.geo_location
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to update geo location', {
      error: error.message,
      updateData,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to update geo location',
      error.response?.status || 500
    );
  }
};

/**
 * Complete Driver Session
 */
export const completeDriverSessionService = async (sessionData) => {
  try {
    const { route_id } = sessionData;
    
    // External API requires sessionId in URL path, use 0 as default placeholder
    // The external API will handle the session completion based on route_id
    const sessionId = 0;
    
    const response = await apiClient.post(`/api/driver-session/${sessionId}/complete`, {
      route_id
    });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to complete driver session');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Driver session completed', {
      route_id,
      session_id: sessionId
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Driver session completion failed', {
      error: error.message,
      route_id: sessionData?.route_id,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to complete driver session',
      error.response?.status || 500
    );
  }
};

/**
 * Get Driver Next Stop Maps
 * Fetch individual stop map links for drivers
 */
export const getDriverNextStopMapsService = async (params) => {
  try {
    const { date, session } = params;
    
    if (!date || !session) {
      throw new Error('date and session are required');
    }
    
    const response = await apiClient.get('/api/drivers/next-stop-maps', {
      params: { date, session }
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch driver next stop maps');
    }
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get driver next stop maps failed', {
      error: error.message,
      date: params?.date,
      session: params?.session,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch driver next stop maps',
      error.response?.status || 500
    );
  }
};

/**
 * Get Driver Route Overview Maps
 * Fetch route overview map links for drivers
 */
export const getDriverRouteOverviewMapsService = async (params) => {
  try {
    const { date, session } = params;
    
    if (!date || !session) {
      throw new Error('date and session are required');
    }
    
    const response = await apiClient.get('/api/drivers/route-overview-maps', {
      params: { date, session }
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch driver route overview maps');
    }
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get driver route overview maps failed', {
      error: error.message,
      date: params?.date,
      session: params?.session,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch driver route overview maps',
      error.response?.status || 500
    );
  }
};

/**
 * Update Delivery Comment
 * Updates the comment for a specific delivery using delivery_id
 * Uses AI_ROUTE_API from .env (different from AI_ROUTE_API_THIRD)
 */
export const updateDeliveryCommentService = async (deliveryId, comments) => {
  try {
    if (!AI_ROUTE_API) {
      throw new Error('AI_ROUTE_API environment variable is not set');
    }
    
    const response = await apiClientRouteAPI.put(`/delivery_data/${deliveryId}/comments`, {
      comments
    });
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update delivery comment');
    }
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery comment updated', {
      delivery_id: deliveryId,
      comments_length: comments?.length || 0
    });
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to update delivery comment', {
      error: error.message,
      deliveryId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to update delivery comment',
      error.response?.status || 500
    );
  }
};

/**
 * Get Route Status from Actual Route Stops
 * Checks actual_route_stops table to determine journey status, marked stops, and completed sessions
 * Uses raw SQL queries since these tables are marked with @@ignore in Prisma schema
 */
export const getRouteStatusFromActualStopsService = async (routeId, driverId = null, date = null) => {
  try {
    const today = date ? new Date(date) : new Date();
    const todayStr = today.toISOString().split('T')[0]; // 'YYYY-MM-DD' format
    
    // Check if journey is started (any record with start_time IS NOT NULL)
    const journeyStartedQuery = driverId
      ? prisma.$queryRaw`
          SELECT id FROM actual_route_stops 
          WHERE route_id = ${routeId} 
            AND DATE(date) = DATE(${todayStr})
            AND start_time IS NOT NULL
            AND user_id = ${driverId}
          LIMIT 1
        `
      : prisma.$queryRaw`
          SELECT id FROM actual_route_stops 
          WHERE route_id = ${routeId} 
            AND DATE(date) = DATE(${todayStr})
            AND start_time IS NOT NULL
          LIMIT 1
        `;
    
    const journeyStartedResult = await journeyStartedQuery;
    const journeyStarted = journeyStartedResult && journeyStartedResult.length > 0;
    
    // Get marked/completed stops
    // A stop is considered marked if:
    // 1. It has actual_completion_time set (stop was reached/completed)
    // 2. OR delivery_status is 'delivered' (successfully delivered)
    // 3. OR delivery_status is 'arrived' (arrived at location)
    // Note: CUSTOMER_UNAVAILABLE might be stored in a different field or handled by the external API
    const markedStopsQuery = driverId
      ? prisma.$queryRaw`
          SELECT stop_order, delivery_status, actual_completion_time, session
          FROM actual_route_stops 
          WHERE route_id = ${routeId} 
            AND DATE(date) = DATE(${todayStr})
            AND (actual_completion_time IS NOT NULL 
                 OR delivery_status IN ('delivered', 'arrived'))
            AND user_id = ${driverId}
          ORDER BY stop_order ASC
        `
      : prisma.$queryRaw`
          SELECT stop_order, delivery_status, actual_completion_time, session
          FROM actual_route_stops 
          WHERE route_id = ${routeId} 
            AND DATE(date) = DATE(${todayStr})
            AND (actual_completion_time IS NOT NULL 
                 OR delivery_status IN ('delivered', 'arrived'))
          ORDER BY stop_order ASC
        `;
    
    const markedStops = await markedStopsQuery;
    
    // Get all stops for each session from planned_route_stops to determine completion
    const allStopsQuery = prisma.$queryRaw`
      SELECT stop_order, session
      FROM planned_route_stops 
      WHERE route_id = ${routeId} 
        AND DATE(date) = DATE(${todayStr})
        AND delivery_name != 'Return to Hub'
    `;
    
    const allStops = await allStopsQuery;
    
    // Group by session and check completion
    const sessionStats = {};
    allStops.forEach(stop => {
      const session = stop.session;
      if (!sessionStats[session]) {
        sessionStats[session] = { total: 0, completed: 0 };
      }
      sessionStats[session].total++;
    });
    
    markedStops.forEach(stop => {
      if (stop.session && sessionStats[stop.session]) {
        sessionStats[stop.session].completed++;
      }
    });
    
    // Determine completed sessions (all stops for that session are completed)
    const completedSessions = Object.keys(sessionStats).filter(
      session => sessionStats[session].total > 0 && 
                 sessionStats[session].total === sessionStats[session].completed
    );
    
    // Also check route_journey_summary for actual_end_time to confirm session completion
    // This is the primary source for session completion when "End Session" is clicked
    const journeySummariesQuery = driverId
      ? prisma.$queryRaw`
          SELECT session, actual_end_time
          FROM route_journey_summary 
          WHERE route_id = ${routeId} 
            AND DATE(date) = DATE(${todayStr})
            AND actual_end_time IS NOT NULL
            AND driver_id = ${driverId}
        `
      : prisma.$queryRaw`
          SELECT session, actual_end_time
          FROM route_journey_summary 
          WHERE route_id = ${routeId} 
            AND DATE(date) = DATE(${todayStr})
            AND actual_end_time IS NOT NULL
        `;
    
    const journeySummaries = await journeySummariesQuery;
    
    // Normalize session names to lowercase for comparison
    const normalizedCompletedSessions = completedSessions.map(s => s?.toLowerCase());
    
    // Add sessions from journey_summary that have actual_end_time
    // This ensures sessions marked as completed via "End Session" button persist after refresh
    journeySummaries.forEach(summary => {
      if (summary.session) {
        const normalizedSession = summary.session.toLowerCase();
        // Check if not already in completed sessions (case-insensitive)
        if (!normalizedCompletedSessions.includes(normalizedSession)) {
          completedSessions.push(normalizedSession);
          normalizedCompletedSessions.push(normalizedSession);
        }
      }
    });
    
    // Remove duplicates and ensure all session names are lowercase
    const uniqueCompletedSessions = [...new Set(completedSessions.map(s => s?.toLowerCase()))];
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route status retrieved from actual_route_stops', {
      route_id: routeId,
      is_journey_started: journeyStarted,
      marked_stops_count: markedStops.length,
      completed_sessions: completedSessions
    });
    
    return {
      success: true,
      route_id: routeId,
      is_journey_started: journeyStarted,
      marked_stops: markedStops,
      completed_sessions: uniqueCompletedSessions, // Use normalized unique sessions
      sessions_data: sessionStats
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Get route status from actual_route_stops failed', {
      error: error.message,
      route_id: routeId,
      driver_id: driverId
    });
    throw new AppError(
      error.message || 'Failed to get route status',
      500
    );
  }
};