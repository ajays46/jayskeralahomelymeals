import AppError from '../../../utils/AppError.js';
import { logInfo, logError, LOG_CATEGORIES } from '../../../utils/criticalLogger.js';
import axios from 'axios';
import prisma from '../../../config/prisma.js';
import { application } from 'express';

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

/** Build request config with company_id (X-Company-ID header) for multi-tenant external APIs */
const withCompanyId = (companyId, config = {}) => {
  const headers = { ...(config.headers || {}) };
  if (companyId && typeof companyId === 'string' && companyId.trim()) {
    headers['X-Company-ID'] = companyId.trim();
  }
  return { ...config, headers };
};

/** Add X-User-ID header when provided (for delivery manager isolation / created_by) */
const withUserId = (createdBy, config = {}) => {
  if (!createdBy || typeof createdBy !== 'string' || !createdBy.trim()) return config;
  const headers = { ...(config.headers || {}) };
  headers['X-User-ID'] = createdBy.trim();
  return { ...config, headers };
};

/**
 * Check API Health
 */
export const checkApiHealthService = async (companyId = null) => {
  try {
    const response = await apiClient.get('/api/health', withCompanyId(companyId));
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
export const getAvailableDatesService = async (limit = 30, companyId = null) => {
  try {
    const response = await apiClient.get('/api/delivery_data/available-dates', withCompanyId(companyId, {
      params: { limit }
    }));
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
export const getDeliveryDataService = async (filters = {}, companyId = null) => {
  try {
    const { date, session } = filters;
    const params = {};
    if (date) params.date = date;
    if (session) params.session = session;
    
    const response = await apiClient.get('/api/delivery_data', withCompanyId(companyId, { params }));
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
 * createdBy: optional user UUID from X-User-ID header (for delivery manager isolation / created_by)
 */
export const planRouteService = async (routeData, companyId = null, createdBy = null) => {
  try {
    const { delivery_date, delivery_session, num_drivers, depot_location } = routeData;

    const config = withUserId(createdBy, withCompanyId(companyId));
    const body = {
      delivery_date,
      delivery_session,
      num_drivers,
      depot_location
    };
    if (createdBy && typeof createdBy === 'string' && createdBy.trim()) {
      body.user_id = createdBy.trim();
    }
    const response = await apiClient.post('/api/route/plan', body, config);
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
 * Save planned routes to S3 (Excel + TXT)
 * POST /api/route/plan/save-to-s3 on external API (port 5003)
 * Body: { company_id?, route_ids }
 */
export const savePlanToS3Service = async (companyId, routeIds) => {
  if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
    throw new AppError('route_ids is required and must be a non-empty array', 400);
  }
  try {
    const payload = { route_ids: routeIds };
    if (companyId && typeof companyId === 'string' && companyId.trim()) {
      payload.company_id = companyId.trim();
    }
    const response = await apiClient.post('/api/route/plan/save-to-s3', payload, withCompanyId(companyId));
    const data = response.data;
    if (!data.success) {
      throw new AppError(data.message || 'Save to S3 failed', 500);
    }
    return {
      success: true,
      s3_url: data.s3_url,
      filename: data.filename,
      s3_url_txt: data.s3_url_txt,
      filename_txt: data.filename_txt,
      message: data.message || 'Planned routes saved to S3 (Excel and TXT).'
    };
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data;
    logError(LOG_CATEGORIES.SYSTEM, 'Save plan to S3 failed', {
      error: error.message,
      routeIds,
      status,
      response: body
    });
    if (error instanceof AppError) throw error;
    const message = body?.message || body?.error || error.message || 'Failed to save plan to S3';
    const code = status && status >= 400 && status < 600 ? status : 500;
    throw new AppError(message, code);
  }
};

/**
 * Reassign Driver - single reassign or exchange two drivers
 * Body: { route_id, new_driver_name } OR { exchange: true, route_id_1, route_id_2 }
 */
export const reassignDriverService = async (body, companyId = null) => {
  try {
    const response = await apiClient.post('/api/route/reassign-driver', body, withCompanyId(companyId));
    const data = response.data;
    if (!data.success) {
      throw new Error(data.error || data.message || 'Reassign driver failed');
    }
    logInfo(LOG_CATEGORIES.SYSTEM, 'Driver reassigned successfully', {
      route_id: body.route_id || body.route_id_1,
      exchange: !!body.exchange
    });
    return { success: true, ...data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Reassign driver failed', {
      error: error.message,
      body,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Reassign driver failed',
      error.response?.status || 500
    );
  }
};

/**
 * Move Stop - move one delivery stop from one route to another
 * Body: { from_route_id, to_route_id, stop_identifier: { delivery_id } or { stop_order }, insert_at_order? }
 * External API (Flask) requires company_id for SQL bind - send in body, header, and query so Flask can read it.
 */
export const moveStopService = async (body, companyId = null) => {
  try {
    const payload = { ...body };
    if (companyId) payload.company_id = companyId;
    const config = withCompanyId(companyId);
    if (companyId) config.params = { ...(config.params || {}), company_id: companyId };
    logInfo(LOG_CATEGORIES.SYSTEM, 'Move stop: sending to external API', {
      company_id: companyId || '(none)',
      has_header: !!companyId,
      has_body: !!payload.company_id,
      has_query: !!config.params?.company_id
    });
    const response = await apiClient.post('/api/route/move-stop', payload, config);
    const data = response.data;
    if (!data.success) {
      throw new Error(data.error || data.message || 'Move stop failed');
    }
    logInfo(LOG_CATEGORIES.SYSTEM, 'Stop moved successfully', {
      from_route_id: body.from_route_id,
      to_route_id: body.to_route_id
    });
    return { success: true, ...data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Move stop failed', {
      error: error.message,
      body,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Move stop failed',
      error.response?.status || 500
    );
  }
};

/**
 * Predict Start Time
 * Accepts either route_id OR (delivery_date + delivery_session + depot_location)
 */
export const predictStartTimeService = async (predictionData, companyId = null) => {
  try {
    const { route_id, delivery_date, delivery_session, depot_location } = predictionData;
    
    // Build request body based on available parameters
    const requestBody = route_id 
      ? { route_id }
      : { delivery_date, delivery_session, depot_location };
    
    const response = await apiClient.post('/api/route/predict-start-time', requestBody, withCompanyId(companyId));
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
 * Sends: POST /api/journey/start with body { route_id, driver_id } and headers Authorization, X-Company-ID, Content-Type
 */
export const startJourneyService = async (journeyData, companyId = null) => {
  try {
    const { driver_id, route_id } = journeyData;
    
    // Request body format expected by external API: { route_id, driver_id }
    const requestBody = {
      route_id: route_id || null,
      driver_id
    };
    
    const config = withCompanyId(companyId);
    config.headers = config.headers || {};
    config.headers['Authorization'] = 'Bearer mysecretkey123';
    const response = await apiClient.post('/api/journey/start', requestBody, config);
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
export const stopReachedService = async (stopData, companyId = null) => {
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
      packages_delivered,
      comments // Comments field for delivery notes
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
    
    // Add comments if provided (optional field, max 500 characters)
    if (comments && typeof comments === 'string' && comments.trim()) {
      requestBody.comments = comments.trim();
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
    const response = await apiClient.post('/api/journey/mark-stop', requestBody, withCompanyId(companyId));
    
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
 * Sends only route_id to the external API as per API spec.
 */
export const endJourneyService = async (journeyData, companyId = null) => {
  try {
    const { route_id } = journeyData;

    if (!route_id) {
      throw new AppError('route_id is required', 400);
    }

    const body = { route_id };

    const response = await apiClient.post('/api/journey/end', body, withCompanyId(companyId));
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
export const getJourneyStatusService = async (routeId, companyId = null) => {
  try {
    const response = await apiClient.get(`/api/journey/status/${routeId}`, withCompanyId(companyId));
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
export const getTrackingStatusService = async (routeId, companyId = null) => {
  try {
    const response = await apiClient.get(`/api/route/tracking-status/${routeId}`, withCompanyId(companyId));
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
export const vehicleTrackingService = async (trackingData, companyId = null) => {
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
    }, withCompanyId(companyId));
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

export const getAllVehicleTrackingService = async (companyId = null) => {
  try {
    const response = await apiClient.get('/api/vehicles/tracking/all', withCompanyId(companyId));
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
 * Get Live Vehicle Tracking
 * Fetches live vehicle tracking data with optional filters
 * @param {Object} params - Query parameters: active_only, status, driver_id
 */
export const getLiveVehicleTrackingService = async (params = {}) => {
  try {
    const { active_only, status, driver_id } = params;
    
    // Build query parameters
    const queryParams = {};
    if (active_only !== undefined) {
      queryParams.active_only = active_only === true || active_only === 'true';
    }
    if (status) {
      queryParams.status = status;
    }
    if (driver_id) {
      queryParams.driver_id = driver_id;
    }
    
    const response = await apiClient.get('/api/vehicle-tracking/live-all', {
      params: queryParams
    });
    
    const data = response.data;
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Live vehicle tracking fetched', {
      active_only: queryParams.active_only,
      status: queryParams.status,
      driver_id: queryParams.driver_id,
      vehiclesCount: data?.vehicles?.length || data?.data?.length || 0
    });
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch live vehicle tracking');
    }
    
    return data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch live vehicle tracking', {
      error: error.message,
      params,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch live vehicle tracking',
      error.response?.status || 500
    );
  }
};

/**
 * Get Current Weather
 */
export const getCurrentWeatherService = async (params, companyId = null) => {
  try {
    const response = await apiClient.get('/api/weather/current', withCompanyId(companyId, { params }));
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
export const getWeatherForecastService = async (params, companyId = null) => {
  try {
    const response = await apiClient.get('/api/weather/forecast', withCompanyId(companyId, { params }));
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
export const getWeatherZonesService = async (params = {}, companyId = null) => {
  try {
    const response = await apiClient.get('/api/weather/zones', withCompanyId(companyId, { params }));
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
export const getWeatherPredictionsService = async (params, companyId = null) => {
  try {
    const response = await apiClient.get('/api/weather/predictions', withCompanyId(companyId, { params }));
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
export const getZonesService = async (params = {}, companyId = null) => {
  try {
    const response = await apiClient.get('/api/zones', withCompanyId(companyId, { params }));
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
export const getZoneByIdService = async (zoneId, companyId = null) => {
  try {
    const response = await apiClient.get(`/api/zones/${zoneId}`, withCompanyId(companyId));
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
export const createZoneService = async (zoneData, companyId = null) => {
  try {
    const response = await apiClient.post('/api/zones', zoneData, withCompanyId(companyId));
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
export const updateZoneService = async (zoneId, zoneData, companyId = null) => {
  try {
    const response = await apiClient.put(`/api/zones/${zoneId}`, zoneData, withCompanyId(companyId));
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
export const deleteZoneService = async (zoneId, companyId = null) => {
  try {
    const response = await apiClient.delete(`/api/zones/${zoneId}`, withCompanyId(companyId));
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
export const getZoneDeliveriesService = async (zoneId, params = {}, companyId = null) => {
  try {
    const response = await apiClient.get(`/api/zones/${zoneId}/deliveries`, withCompanyId(companyId, { params }));
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
export const reoptimizeRouteService = async (reoptimizeData, companyId = null) => {
  try {
    const response = await apiClient.post('/api/route/reoptimize', reoptimizeData, withCompanyId(companyId));
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
export const checkTrafficService = async (trafficData, companyId = null) => {
  try {
    const { route_id, current_location, check_all_segments } = trafficData;
    
    if (!route_id) {
      throw new Error('route_id is required');
    }
    
    const response = await apiClient.post('/api/journey/check-traffic', {
      route_id,
      current_location,
      check_all_segments: check_all_segments !== false
    }, withCompanyId(companyId));
    
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
export const getRouteOrderService = async (routeId, companyId = null) => {
  try {
    if (!routeId) {
      throw new Error('routeId is required');
    }
    
    const response = await apiClient.get(`/api/journey/route-order/${routeId}`, withCompanyId(companyId));
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
export const getMissingGeoLocationsService = async (limit = 100, companyId = null) => {
  try {
    const response = await apiClient.get('/api/address/get-missing-geo-locations', withCompanyId(companyId, {
      params: { limit }
    }));
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
export const updateGeoLocationService = async (updateData, companyId = null) => {
  try {
    const response = await apiClient.post('/api/address/update-geo-location', updateData, withCompanyId(companyId));
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
 * Get Driver Next Stop Maps
 * Fetch individual stop map links for drivers
 */
export const getDriverNextStopMapsService = async (params, companyId = null) => {
  try {
    const { date, session } = params;
    
    if (!date || !session) {
      throw new Error('date and session are required');
    }
    
    const response = await apiClient.get('/api/drivers/next-stop-maps', withCompanyId(companyId, {
      params: { date, session }
    }));
    
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
export const getDriverRouteOverviewMapsService = async (params, companyId = null) => {
  try {
    const { date, session } = params;
    
    if (!date || !session) {
      throw new Error('date and session are required');
    }
    
    const response = await apiClient.get('/api/drivers/route-overview-maps', withCompanyId(companyId, {
      params: { date, session }
    }));
    
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
export const updateDeliveryCommentService = async (deliveryId, comments, companyId = null) => {
  try {
    if (!AI_ROUTE_API) {
      throw new Error('AI_ROUTE_API environment variable is not set');
    }
    
    const response = await apiClientRouteAPI.put(`/delivery_data/${deliveryId}/comments`, {
      comments
    }, withCompanyId(companyId));
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
          SELECT stop_order, planned_stop_id, delivery_status, actual_completion_time, session
          FROM actual_route_stops 
          WHERE route_id = ${routeId} 
            AND DATE(date) = DATE(${todayStr})
            AND (actual_completion_time IS NOT NULL 
                 OR delivery_status IN ('delivered', 'arrived'))
            AND user_id = ${driverId}
          ORDER BY stop_order ASC
        `
      : prisma.$queryRaw`
          SELECT stop_order, planned_stop_id, delivery_status, actual_completion_time, session
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

    // Normalize session key: empty string, null, or 'ANY' -> 'ANY' (flexible delivery)
    const normalizeSession = (s) => {
      const v = (s && String(s).trim()) || '';
      return v.toUpperCase() === 'ANY' || v === '' ? 'ANY' : v.toUpperCase();
    };

    // Group by session for stats only (total + completed count for UI). Do NOT use this for completed_sessions.
    const sessionStats = {};
    allStops.forEach(stop => {
      const session = normalizeSession(stop.session);
      if (!sessionStats[session]) {
        sessionStats[session] = { total: 0, completed: 0 };
      }
      sessionStats[session].total++;
    });
    markedStops.forEach(stop => {
      const session = normalizeSession(stop.session);
      if (sessionStats[session]) {
        sessionStats[session].completed++;
      }
    });
    if (sessionStats['ANY'] && sessionStats['ANY'].total > 0 && markedStops.length > 0) {
      sessionStats['ANY'].completed = Math.min(sessionStats['ANY'].total, markedStops.length);
    }

    // Completed sessions: only when explicitly ended, NOT when all stops are delivered.
    // Source 1: route_journey_summary.actual_end_time (driver clicked "End Session")
    // Source 2: actual_route_stops: last stop of session has total_journey_duration_minutes set (journey/end recorded)
    const completedSessions = [];

    // Source 1: route_journey_summary for actual_end_time
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

    // Add sessions from route_journey_summary (actual_end_time = driver clicked "End Session")
    journeySummaries.forEach(summary => {
      const raw = summary.session != null ? String(summary.session).trim() : '';
      const normalizedSession = (raw.toUpperCase() === 'ANY' || raw === '') ? 'any' : raw.toLowerCase();
      if (normalizedSession) completedSessions.push(normalizedSession);
    });

    // Source 2: sessions where the last stop (max stop_order) has total_journey_duration_minutes set
    // (journey/end was called and completion time was recorded on the final stop)
    const lastStopCompletedQuery = driverId
      ? prisma.$queryRaw`
          SELECT DISTINCT a.session
          FROM actual_route_stops a
          WHERE a.route_id = ${routeId}
            AND DATE(a.date) = DATE(${todayStr})
            AND a.user_id = ${driverId}
            AND a.total_journey_duration_minutes IS NOT NULL
            AND a.stop_order = (
              SELECT MAX(b.stop_order) FROM actual_route_stops b
              WHERE b.route_id = a.route_id AND DATE(b.date) = DATE(a.date) AND (b.user_id = a.user_id)
              AND (COALESCE(b.session,'') = COALESCE(a.session,''))
            )
        `
      : prisma.$queryRaw`
          SELECT DISTINCT a.session
          FROM actual_route_stops a
          WHERE a.route_id = ${routeId}
            AND DATE(a.date) = DATE(${todayStr})
            AND a.total_journey_duration_minutes IS NOT NULL
            AND a.stop_order = (
              SELECT MAX(b.stop_order) FROM actual_route_stops b
              WHERE b.route_id = a.route_id AND DATE(b.date) = DATE(a.date)
              AND (COALESCE(b.session,'') = COALESCE(a.session,''))
            )
        `;
    const lastStopCompleted = await lastStopCompletedQuery;
    lastStopCompleted.forEach(row => {
      const raw = row.session != null ? String(row.session).trim() : '';
      const normalizedSession = (raw.toUpperCase() === 'ANY' || raw === '') ? 'any' : raw.toLowerCase();
      if (normalizedSession) completedSessions.push(normalizedSession);
    });

    // Remove duplicates and ensure lowercase
    const uniqueCompletedSessions = [...new Set(completedSessions.map(s => s?.toLowerCase()).filter(Boolean))];
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route status retrieved from actual_route_stops', {
      route_id: routeId,
      is_journey_started: journeyStarted,
      marked_stops_count: markedStops.length,
      completed_sessions: uniqueCompletedSessions
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

/**
 * Build request config with optional X-Company-ID for multi-tenant external API calls.
 */
const requestConfigWithCompany = (companyId, options = {}) => {
  const config = { ...options };
  if (companyId && typeof companyId === 'string' && companyId.trim()) {
    config.headers = { ...config.headers, 'X-Company-ID': companyId.trim() };
  }
  return config;
};

/**
 * Get Coordinator Settings
 * Fetches current Coordinator parameter values from external API (per-company).
 * Requires company_id for multi-tenant support (X-Company-ID).
 */
export const getCoordinatorSettingsService = async (companyId) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new Error('company_id required (header X-Company-ID or query company_id)');
  }
  try {
    const response = await apiClient.get('/api/coordinator/settings', {
      headers: { 'X-Company-ID': companyId.trim() },
      params: { company_id: companyId.trim() }
    });
    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch Coordinator settings');
    }

    logInfo(LOG_CATEGORIES.SYSTEM, 'Coordinator settings fetched', {
      company_id: companyId,
      settings: data.settings
    });

    return {
      success: true,
      company_id: data.company_id || companyId,
      settings: data.settings || {},
      description: data.description || {}
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch Coordinator settings', {
      error: error.message,
      company_id: companyId,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch Coordinator settings',
      500
    );
  }
};

/**
 * Get Route Map Data for CXO
 * Fetches route data. Per guide §3c: supports date, start_date/end_date, session, route_id, driver_name, manager_id.
 * Uses AI_ROUTE_API (apiClientRouteAPI) endpoint /api/route/map-data.
 * - With driver_name only: returns drivers[].available_dates, drivers[].available_sessions.
 * - With driver_name + date (+ session): returns route for that driver/date/session.
 * - With manager_id (+ start_date/end_date, session, driver_name): CXO filter routes by delivery manager.
 * companyId: when set, sent as X-Company-ID to scope data by tenant.
 * callerUserId: when set (e.g. for manager_id requests), sent as X-User-ID so external API can verify CXO role.
 */
export const getRouteMapDataService = async (params = {}, companyId = null, callerUserId = null) => {
  try {
    const { date, session, route_id, driver_name, start_date, end_date, manager_id } = params;

    const hasDateRange = start_date && end_date;
    const hasAnyRequired = date || (driver_name && driver_name.trim()) || hasDateRange || manager_id;
    if (!hasAnyRequired) {
      throw new Error('Either date, driver_name, start_date+end_date, or manager_id is required');
    }

    const queryParams = {};
    if (date) queryParams.date = date;
    if (session) queryParams.session = session;
    if (route_id) queryParams.route_id = route_id;
    if (driver_name && driver_name.trim()) queryParams.driver_name = driver_name.trim();
    if (start_date) queryParams.start_date = start_date;
    if (end_date) queryParams.end_date = end_date;
    if (manager_id) queryParams.manager_id = manager_id;

    // When manager_id is used, external API requires X-User-ID to verify caller is CXO (guide §3c)
    const baseConfig = requestConfigWithCompany(companyId);
    const configWithUser = callerUserId ? withUserId(callerUserId, baseConfig) : baseConfig;
    const response = await apiClient.get('/api/route/map-data', {
      params: queryParams,
      ...configWithUser
    });
    
    const data = response.data;
    
    // When response has drivers only (no routes) - e.g. driver_name-only call for available_dates/sessions
    const routes = data?.routes || [];
    if (!routes.length && data?.drivers?.length) {
      logInfo(LOG_CATEGORIES.SYSTEM, 'Route map data (driver availability) fetched for CXO', {
        date,
        session,
        driver_name,
        driversCount: data.drivers.length
      });
      return {
        success: true,
        data: { ...data }
      };
    }
    
    // Extract unique driver IDs from routes
    const driverIds = [...new Set(routes.map(route => route.driver_id).filter(Boolean))];
    
    // Fetch delivery executive names from User table
    let driverNameMap = {};
    if (driverIds.length > 0) {
      try {
        const users = await prisma.user.findMany({
          where: {
            id: { in: driverIds }
          },
          include: {
            contacts: {
              select: {
                firstName: true,
                lastName: true
              },
              take: 1 // Get first contact
            },
            auth: {
              select: {
                email: true
              }
            }
          }
        });
        
        // Create a map of driver_id -> name
        driverNameMap = users.reduce((acc, user) => {
          let name = 'Unknown';
          
          // Try to get name from contacts (firstName + lastName)
          if (user.contacts && user.contacts.length > 0) {
            const contact = user.contacts[0];
            if (contact.firstName || contact.lastName) {
              name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
            }
          }
          
          // Fallback to email prefix if no contact name
          if (name === 'Unknown' && user.auth?.email) {
            name = user.auth.email.split('@')[0];
          }
          
          acc[user.id] = name;
          return acc;
        }, {});
      } catch (dbError) {
        logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch delivery executive names', {
          error: dbError.message,
          driverIds
        });
        // Continue without names if DB fetch fails
      }
    }
    
    // Enrich routes with driver names
    const enrichedRoutes = routes.map(route => ({
      ...route,
      driver_name: route.driver_id ? (driverNameMap[route.driver_id] || 'Unknown') : 'Unknown'
    }));
    
    // Filter by driver_name if provided (case-insensitive partial match)
    let filteredRoutes = enrichedRoutes;
    if (driver_name && driver_name.trim()) {
      const searchTerm = driver_name.trim().toLowerCase();
      filteredRoutes = enrichedRoutes.filter(route => {
        const routeDriverName = route.driver_name?.toLowerCase() || '';
        return routeDriverName.includes(searchTerm);
      });
    }
    
    // Create enriched response
    const enrichedData = {
      ...data,
      routes: filteredRoutes,
      total_routes: filteredRoutes.length
    };
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Route map data fetched for CXO', {
      date,
      session,
      route_id,
      driver_name,
      hasData: !!data,
      routesCount: routes.length,
      filteredRoutesCount: filteredRoutes.length,
      driversEnriched: Object.keys(driverNameMap).length
    });
    
    return {
      success: true,
      data: enrichedData
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch route map data', {
      error: error.message,
      params,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch route map data',
      error.response?.status || 500
    );
  }
};

/**
 * Get Route Map Data by Manager for CXO – Delivery Manager side
 * Used on CXO Delivery Managers page. Delegates to getRouteMapDataService with manager_id + date range.
 * callerUserId: forwarded as X-User-ID to external API for CXO role check (guide §3c).
 */
export const getRouteMapDataByManagerService = async (params = {}, companyId = null, callerUserId = null) => {
  const { manager_id, start_date, end_date, session, driver_name } = params;
  if (!manager_id) {
    throw new Error('manager_id is required');
  }
  return getRouteMapDataService({ manager_id, start_date, end_date, session, driver_name }, companyId, callerUserId);
};

/**
 * Update Coordinator Settings
 * Updates Coordinator parameter values for the given company (multi-tenant).
 * Requires company_id (X-Company-ID). All body fields are optional; only provided fields are updated.
 */
export const updateCoordinatorSettingsService = async (companyId, updates) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new Error('company_id required (header X-Company-ID or body company_id)');
  }
  try {
    // Allow empty updates object (doc: "only provided fields are updated"); external API may require at least one field
    if (!updates || typeof updates !== 'object') {
      throw new Error('No JSON data provided');
    }

    // Validation rules per FRONTEND_COORDINATOR_GUIDE.md
    if (updates.max_time_hours !== undefined) {
      if (typeof updates.max_time_hours !== 'number' || updates.max_time_hours <= 0) {
        throw new Error('Invalid parameter value: max_time_hours must be a positive number (e.g. 1–8)');
      }
    }
    if (updates.max_packages_per_driver !== undefined) {
      const v = updates.max_packages_per_driver;
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 50) {
        throw new Error('Invalid parameter value: max_packages_per_driver must be an integer between 1 and 50');
      }
    }
    if (updates.max_distance_km !== undefined) {
      if (typeof updates.max_distance_km !== 'number' || updates.max_distance_km <= 0) {
        throw new Error('Invalid parameter value: max_distance_km must be a positive number (e.g. 50–200 km)');
      }
    }
    if (updates.min_confidence !== undefined) {
      if (typeof updates.min_confidence !== 'number' || updates.min_confidence < 0 || updates.min_confidence > 1) {
        throw new Error('Invalid parameter value: min_confidence must be a number between 0.0 and 1.0');
      }
    }

    const body = { ...updates, company_id: companyId.trim() };
    const response = await apiClient.put('/api/coordinator/settings', body, {
      headers: { 'X-Company-ID': companyId.trim() }
    });
    const data = response.data;

    if (!data.success) {
      throw new Error(data.error || 'Failed to update Coordinator settings');
    }

    logInfo(LOG_CATEGORIES.SYSTEM, 'Coordinator settings updated', {
      company_id: companyId,
      changed: data.changed,
      previous: data.previous_settings,
      current: data.current_settings
    });

    return {
      success: true,
      message: data.message || 'Coordinator settings updated successfully',
      company_id: data.company_id || companyId,
      previous_settings: data.previous_settings || {},
      current_settings: data.current_settings || {},
      changed: data.changed || {}
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to update Coordinator settings', {
      error: error.message,
      company_id: companyId,
      updates,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to update Coordinator settings',
      error.response?.status || 500
    );
  }
};

/**
 * Get Drivers from Route Map Data
 * Fetches unique driver IDs from route data and returns driver information with names
 */
export const getDriversFromRouteMapDataService = async (params = {}) => {
  try {
    const { date, session } = params;
    
    if (!date) {
      throw new Error('date is required');
    }
    
    // First, get the route data to extract driver IDs
    const routeData = await getRouteMapDataService({ date, session });
    const routes = routeData.data?.routes || [];
    
    // Extract unique driver IDs
    const driverIds = [...new Set(routes.map(route => route.driver_id).filter(Boolean))];
    
    if (driverIds.length === 0) {
      return {
        success: true,
        drivers: []
      };
    }
    
    // Fetch driver information from database
    const drivers = await prisma.user.findMany({
      where: {
        id: { in: driverIds }
      },
      include: {
        contacts: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumbers: {
              select: {
                number: true,
                type: true
              }
            }
          }
        },
        auth: {
          select: {
            email: true,
            phoneNumber: true
          }
        },
        deliveryExecutive: {
          select: {
            vehicleNumber: true,
            status: true
          }
        }
      }
    });
    
    // Format driver data
    const formattedDrivers = drivers.map(driver => {
      const contact = driver.contacts?.[0];
      const name = contact 
        ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() 
        : 'Unknown Driver';
      
      return {
        driver_id: driver.id,
        name: name || 'Unknown Driver',
        email: driver.auth?.email || null,
        phone: contact?.phoneNumbers?.[0]?.number || driver.auth?.phoneNumber || null,
        vehicleNumber: driver.deliveryExecutive?.vehicleNumber || null,
        status: driver.deliveryExecutive?.status || null
      };
    });
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Drivers fetched from route map data', {
      date,
      session,
      driverCount: formattedDrivers.length
    });
    
    return {
      success: true,
      drivers: formattedDrivers
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch drivers from route map data', {
      error: error.message,
      params
    });
    throw new AppError(
      error.message || 'Failed to fetch drivers from route map data',
      500
    );
  }
};

/**
 * Get Executive Performance for CXO
 * Fetches performance metrics for all executives from AI_ROUTE_API /api/executive/performance
 * Optional query params: start_date, end_date, days, session, min_routes, driver_name, driver_id
 * companyId: when set, sent as X-Company-ID to scope data by tenant.
 */
export const getExecutivePerformanceService = async (filters = {}, companyId = null) => {
  try {
    const params = {};
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.days != null && filters.days !== '') params.days = filters.days;
    if (filters.session) params.session = filters.session;
    if (filters.min_routes != null && filters.min_routes !== '') params.min_routes = filters.min_routes;
    if (filters.driver_name) params.driver_name = filters.driver_name;
    if (filters.driver_id) params.driver_id = filters.driver_id;
    const response = await apiClient.get('/api/executive/performance', {
      params: Object.keys(params).length ? params : undefined,
      ...requestConfigWithCompany(companyId)
    });
    const data = response.data;
    logInfo(LOG_CATEGORIES.SYSTEM, 'Executive performance fetched for CXO', {
      total_executives: data?.total_executives ?? data?.executives?.length ?? 0
    });
    return { success: true, ...data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch executive performance', {
      error: error.message,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch executive performance',
      error.response?.status || 500
    );
  }
};

/**
 * Get Executive Performance by driver name for CXO (single executive)
 * Fetches performance for one executive via /api/executive/performance?driver_name=...
 * Separate from getExecutivePerformanceService - do not change the all-executives endpoint.
 * companyId: when set, sent as X-Company-ID to scope data by tenant.
 */
export const getExecutivePerformanceByDriverService = async (driver_name, companyId = null) => {
  if (!driver_name || !String(driver_name).trim()) {
    throw new Error('driver_name is required');
  }
  try {
    const response = await apiClient.get('/api/executive/performance', {
      params: { driver_name: String(driver_name).trim() },
      ...requestConfigWithCompany(companyId)
    });
    const data = response.data;
    logInfo(LOG_CATEGORIES.SYSTEM, 'Executive performance by driver fetched for CXO', {
      driver_name: driver_name,
      executives_count: data?.executives?.length ?? 0
    });
    return { success: true, ...data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch executive performance by driver', {
      error: error.message,
      driver_name: driver_name,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch executive performance',
      error.response?.status || 500
    );
  }
};

/**
 * Get Manager–Executive Hierarchy for CXO
 * GET /api/cxo/manager-executive-hierarchy (external API)
 * Returns managers with their executives and performance. CEO, CFO, ADMIN only.
 * Query params: days (default 30), or start_date, end_date.
 * companyId and userId (X-User-ID) forwarded for role check and scoping.
 */
export const getManagerExecutiveHierarchyService = async (query = {}, companyId = null, userId = null) => {
  try {
    const params = {};
    if (query.days != null && query.days !== '') params.days = query.days;
    if (query.start_date) params.start_date = query.start_date;
    if (query.end_date) params.end_date = query.end_date;
    const config = withUserId(userId, withCompanyId(companyId, { params: Object.keys(params).length ? params : undefined }));
    const response = await apiClient.get('/api/cxo/manager-executive-hierarchy', config);
    const data = response.data;
    logInfo(LOG_CATEGORIES.SYSTEM, 'Manager-executive hierarchy fetched for CXO', {
      managers_count: data?.managers?.length ?? 0
    });
    return { success: true, ...data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: true, period: {}, managers: [], message: 'Hierarchy endpoint not available' };
    }
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch manager-executive hierarchy', {
      error: error.message,
      response: error.response?.data
    });
    throw new AppError(
      error.response?.data?.error || error.message || 'Failed to fetch manager-executive hierarchy',
      error.response?.status || 500
    );
  }
};

export const findDeliveryItemByOrderService = async ({ order_id, menu_item_id, delivery_date, session }) => {
  const whereClause = { orderId: order_id, menuItemId: menu_item_id };

  if (delivery_date) {
    const dateObj = new Date(delivery_date);
    if (!isNaN(dateObj.getTime())) {
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.deliveryDate = { gte: startOfDay, lte: endOfDay };
    }
  }

  if (session) {
    const sessionMap = {
      'BREAKFAST': 'BREAKFAST', 'LUNCH': 'LUNCH', 'DINNER': 'DINNER',
      'Breakfast': 'BREAKFAST', 'Lunch': 'LUNCH', 'Dinner': 'DINNER'
    };
    whereClause.deliveryTimeSlot = sessionMap[session] || session.toUpperCase();
  }

  return prisma.deliveryItem.findFirst({
    where: whereClause,
    select: { id: true, addressId: true }
  });
};

export const getUserCompanyIdService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true }
  });
  return user?.companyId || null;
};