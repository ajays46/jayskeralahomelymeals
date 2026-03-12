/**
 * ML Trip Controller - MaXHub Logistics: add trips with pickup/delivery addresses; dashboard stats for delivery partner.
 */
import AppError from '../utils/AppError.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';
import {
  addTrips as addTripsService,
  getPartnerDashboardStats,
  listTripsFrom5004,
  getTripsByOrderId5004,
  getTripFrom5004,
  updateTripStatus5004,
  startShift as startShiftService,
  startRoute5004,
  listAllVehicles,
} from '../services/mlTrip.service.js';

/**
 * POST /api/ml-trips
 * Body: { trips: [ { platform, platformLabel?, price, partnerPayment?, pickup?, delivery? }, ... ] }
 * Requires: auth, DELIVERY_PARTNER role, companyId, and userId from JWT.
 */
export const addTrips = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError('Company context is required. Ensure you are logged in with an ML company.', 400);
    }

    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const { trips } = req.body;
    if (!Array.isArray(trips) || trips.length === 0) {
      throw new AppError('Request body must include a non-empty "trips" array.', 400);
    }

    const result = await addTripsService(companyId, userId, trips);

    logInfo(LOG_CATEGORIES.TRANSACTION, 'ML trips added successfully', {
      companyId,
      userId,
      created: result.created,
      requestedTrips: trips.length,
    });

    res.status(201).json({
      status: 'success',
      message: `${result.created} trip(s) added.`,
      data: {
        created: result.created,
        mlTrips: result.mlTrips,
      },
    });
  } catch (error) {
    logError(LOG_CATEGORIES.TRANSACTION, 'Failed to add ML trips', {
      error: error.message,
      companyId: req.companyId,
      userId: req.user?.userId,
      tripsCount: Array.isArray(req.body?.trips) ? req.body.trips.length : 0,
    });
    next(error);
  }
};

/**
 * GET /api/ml-trips
 * Query: platform?, status? (pending | picked_up | delivered)
 * Proxies to external 5004 Delivery Partner API (AI_ROUTE_API_FOURTH).
 */
export const listTrips = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const platform = req.query?.platform;
    const status = req.query?.status;
    const result = await listTripsFrom5004(userId, companyId, { platform, status });

    logInfo(LOG_CATEGORIES.SYSTEM, 'Fetched ML trips from external provider', {
      companyId,
      userId,
      platform,
      status,
      totalTrips: Array.isArray(result?.trips) ? result.trips.length : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch ML trips', {
      error: error.message,
      companyId: req.companyId,
      userId: req.user?.userId,
      platform: req.query?.platform,
      status: req.query?.status,
    });
    next(error);
  }
};

/**
 * GET /api/ml-trips/by-order-id?order_id=<full_or_last_4_or_5>
 * Proxies to external 5004 Delivery Partner API. Returns trips matching order ID.
 */
export const getTripsByOrderId = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const orderId = req.query?.order_id ?? req.query?.orderId ?? '';
    const result = await getTripsByOrderId5004(userId, companyId, orderId);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Fetched ML trips by order ID', {
      companyId,
      userId,
      orderId,
      totalTrips: Array.isArray(result?.trips) ? result.trips.length : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch ML trips by order ID', {
      error: error.message,
      companyId: req.companyId,
      userId: req.user?.userId,
      orderId: req.query?.order_id ?? req.query?.orderId ?? '',
    });
    next(error);
  }
};

/**
 * GET /api/ml-trips/:tripId
 * Proxies to external 5004 Delivery Partner API (AI_ROUTE_API_FOURTH).
 */
export const getTrip = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const { tripId } = req.params;
    const result = await getTripFrom5004(tripId, userId, companyId);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Fetched ML trip details', {
      companyId,
      userId,
      tripId,
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch ML trip details', {
      error: error.message,
      companyId: req.companyId,
      userId: req.user?.userId,
      tripId: req.params?.tripId,
    });
    next(error);
  }
};

/**
 * PATCH /api/ml-trips/:tripId
 * Body: { trip_status: "picked_up" | "delivered" }
 * Proxies to external 5004 Delivery Partner API (AI_ROUTE_API_FOURTH).
 */
export const updateTrip = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const { tripId } = req.params;
    const { trip_status } = req.body;
    if (!trip_status) throw new AppError('trip_status is required (picked_up or delivered).', 400);
    const result = await updateTripStatus5004(tripId, userId, companyId, trip_status);

    logInfo(LOG_CATEGORIES.TRANSACTION, 'ML trip status updated', {
      companyId,
      userId,
      tripId,
      trip_status,
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.TRANSACTION, 'Failed to update ML trip status', {
      error: error.message,
      companyId: req.companyId,
      userId: req.user?.userId,
      tripId: req.params?.tripId,
      body: req.body,
    });
    next(error);
  }
};

/**
 * GET /api/ml-trips/vehicles
 * Returns all vehicles (no user filter) for delivery partner vehicle selection.
 */
export const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await listAllVehicles();

    logInfo(LOG_CATEGORIES.SYSTEM, 'Fetched ML delivery vehicles', {
      totalVehicles: Array.isArray(vehicles) ? vehicles.length : undefined,
      companyId: req.companyId,
    });

    res.status(200).json({
      status: 'success',
      data: vehicles,
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch ML delivery vehicles', {
      error: error.message,
      companyId: req.companyId,
    });
    next(error);
  }
};

/**
 * POST /api/ml-trips/shift/start
 * Body: { platform?, current_location?: { lat, lng }, vehicle_number? } — vehicle_number = registration number of chosen vehicle
 * Proxies to external delivery partner API (AI_ROUTE_API_FOURTH) to start shift. Uses auth user_id and companyId.
 */
export const startShift = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError('Company context is required.', 400);
    }
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }
    const { platform, current_location: currentLocation, vehicle_number: vehicleNumber } = req.body || {};
    const result = await startShiftService(userId, companyId, platform, currentLocation, vehicleNumber);

    logInfo(LOG_CATEGORIES.TRANSACTION, 'ML delivery partner shift started', {
      companyId,
      userId,
      platform,
      vehicleNumber,
      hasCurrentLocation: !!currentLocation,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logError(LOG_CATEGORIES.TRANSACTION, 'Failed to start ML delivery partner shift', {
      error: error.message,
      companyId: req.companyId,
      userId: req.user?.userId,
      body: req.body,
    });
    next(error);
  }
};

/**
 * POST /api/ml-trips/start-route
 * Body: { platform?, current_location?: { lat, lng } }
 * Proxies to external 5004 API (AI_ROUTE_API_FOURTH) to create a route for tracking + mark-stop.
 */
export const startRoute = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const { platform, current_location: currentLocation } = req.body || {};
    const result = await startRoute5004(userId, companyId, platform, currentLocation);

    logInfo(LOG_CATEGORIES.TRANSACTION, 'ML delivery route started', {
      companyId,
      userId,
      platform,
      hasCurrentLocation: !!currentLocation,
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.TRANSACTION, 'Failed to start ML delivery route', {
      error: error.message,
      companyId: req.companyId,
      userId: req.user?.userId,
      body: req.body,
    });
    next(error);
  }
};

/**
 * GET /api/ml-trips/dashboard
 * Returns dashboard stats for the logged-in delivery partner: trips count and revenue (today, this week, all time), recent trips, revenue by day.
 */
export const getDashboard = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) {
      throw new AppError('Company context is required.', 400);
    }
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }
    const platform = req.query?.platform;
    const stats = await getPartnerDashboardStats(companyId, userId, platform);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Fetched ML delivery dashboard stats', {
      companyId,
      userId,
      platform,
      hasStats: !!stats,
    });

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch ML delivery dashboard stats', {
      error: error.message,
      companyId: req.companyId,
      userId: req.user?.userId,
      platform: req.query?.platform,
    });
    next(error);
  }
};
