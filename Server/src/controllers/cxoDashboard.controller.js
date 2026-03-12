/**
 * CXO Dashboard Controller – proxy to AI app for summary, menu-demand, order-areas, driver-earnings, driver-distance, live-drivers, route-history.
 * Requires CEO, CFO, or ADMIN. Sends X-Company-ID and X-User-ID to AI app.
 */
import AppError from '../utils/AppError.js';
import {
  getSummary,
  getMenuDemand,
  getOrderAreas,
  getDriverEarnings,
  getDriverDistance,
  getLiveDrivers,
  getRouteHistory,
} from '../services/cxoDashboard.service.js';

const getCompanyAndUser = (req) => {
  const companyId = req.companyId;
  const userId = req.user?.userId || req.user?.id;
  if (!companyId) throw new AppError('Company context is required.', 400);
  if (!userId) throw new AppError('User not authenticated.', 401);
  return { companyId, userId };
};

/** GET /api/cxo/dashboard/summary */
export const dashboardSummary = async (req, res, next) => {
  try {
    const { companyId, userId } = getCompanyAndUser(req);
    const data = await getSummary(companyId, userId, req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/** GET /api/cxo/dashboard/menu-demand */
export const dashboardMenuDemand = async (req, res, next) => {
  try {
    const { companyId, userId } = getCompanyAndUser(req);
    const data = await getMenuDemand(companyId, userId, req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/** GET /api/cxo/dashboard/order-areas */
export const dashboardOrderAreas = async (req, res, next) => {
  try {
    const { companyId, userId } = getCompanyAndUser(req);
    const data = await getOrderAreas(companyId, userId, req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/** GET /api/cxo/dashboard/driver-earnings */
export const dashboardDriverEarnings = async (req, res, next) => {
  try {
    const { companyId, userId } = getCompanyAndUser(req);
    const data = await getDriverEarnings(companyId, userId, req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/** GET /api/cxo/dashboard/driver-distance */
export const dashboardDriverDistance = async (req, res, next) => {
  try {
    const { companyId, userId } = getCompanyAndUser(req);
    const data = await getDriverDistance(companyId, userId, req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/** GET /api/cxo/dashboard/live-drivers */
export const dashboardLiveDrivers = async (req, res, next) => {
  try {
    const { companyId, userId } = getCompanyAndUser(req);
    const data = await getLiveDrivers(companyId, userId);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/** GET /api/cxo/dashboard/route-history */
export const dashboardRouteHistory = async (req, res, next) => {
  try {
    const { companyId, userId } = getCompanyAndUser(req);
    const data = await getRouteHistory(companyId, userId, req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
};
