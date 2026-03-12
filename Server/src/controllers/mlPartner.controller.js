/**
 * ML Delivery Partner Controller - proxies to external 5004 API (AI_ROUTE_API_FOURTH)
 * for tracking + mark-stop + shift end. Shift status read from DB (driver_availability).
 */
import AppError from '../utils/AppError.js';
import { endShift5004, vehicleTracking5004, markStop5004, getShiftStatusFromDb } from '../services/mlTrip.service.js';

/**
 * GET /api/shift/status - Read shift status from DB (driver_availability). 5004 is the writer.
 */
export const getShiftStatus = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const result = await getShiftStatusFromDb(userId, companyId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/shift/end
 * Body: { platform? }
 */
export const endShift = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const { platform } = req.body || {};
    const result = await endShift5004(userId, companyId, platform);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/vehicle-tracking
 * Body: { route_id, tracking_points: [{ latitude, longitude, timestamp }], user_id? }
 * Note: we allow frontend to omit user_id; backend can add it if needed.
 */
export const vehicleTracking = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const body = { ...(req.body || {}) };
    if (!body.user_id) body.user_id = userId;
    const result = await vehicleTracking5004(companyId, body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/journey/mark-stop
 * Body: { route_id, planned_stop_id?, delivery_id?, stop_order?, status?, comments?, latitude?, longitude? }
 * Backend injects driver_id from JWT.
 */
export const markStop = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required.', 400);
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated.', 401);
    const body = { ...(req.body || {}), driver_id: userId };
    const result = await markStop5004(companyId, body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

