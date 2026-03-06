/**
 * ML Trip Controller - MaXHub Logistics: add trips with pickup/delivery addresses; dashboard stats for delivery partner.
 */
import AppError from '../utils/AppError.js';
import {
  addTrips as addTripsService,
  getPartnerDashboardStats,
  listTripsForPartner,
  getTripById,
  updateTripStatus,
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
 */
export const listTrips = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const platform = req.query?.platform;
    const status = req.query?.status;
    const trips = await listTripsForPartner(companyId, userId, { platform, status });
    res.status(200).json({ success: true, trips });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ml-trips/:tripId
 */
export const getTrip = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const { tripId } = req.params;
    const trip = await getTripById(tripId, userId, companyId);
    if (!trip) throw new AppError('Trip not found.', 404);
    res.status(200).json({ success: true, trip });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/ml-trips/:tripId
 * Body: { trip_status: "picked_up" | "delivered" }
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
    const trip = await updateTripStatus(tripId, userId, companyId, trip_status);
    res.status(200).json({ success: true, trip });
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
