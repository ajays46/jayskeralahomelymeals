/**
 * ML Trip Controller - MaXHub Logistics: add trips with pickup/delivery addresses; dashboard stats for delivery partner.
 */
import AppError from '../utils/AppError.js';
import {
  addTrips as addTripsService,
  getPartnerDashboardStats,
  listTripsFrom5004,
  getTripFrom5004,
  updateTripStatus5004,
  startShift as startShiftService,
  startRoute5004,
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

    res.status(201).json({
      status: 'success',
      message: `${result.created} trip(s) added.`,
      data: {
        created: result.created,
        mlTrips: result.mlTrips,
      },
    });
  } catch (error) {
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
    res.status(200).json(result);
  } catch (error) {
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
    res.status(200).json(result);
  } catch (error) {
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
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ml-trips/shift/start
 * Body: { platform?, current_location?: { lat, lng } }
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
    const { platform, current_location: currentLocation } = req.body || {};
    const result = await startShiftService(userId, companyId, platform, currentLocation);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
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
    res.status(200).json(result);
  } catch (error) {
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
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
