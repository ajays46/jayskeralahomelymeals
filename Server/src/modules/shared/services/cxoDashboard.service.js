/**
 * CXO Dashboard Service – proxies to delivery partner app (AI_ROUTE_API_FOURTH / 5004) for dashboard APIs.
 * See CXO_FRONTEND_API_GUIDE: summary, menu-demand, order-areas, driver-earnings, driver-distance, live-drivers, route-history.
 */
import axios from 'axios';
import AppError from '../../../utils/AppError.js';
import { logInfo, logError, LOG_CATEGORIES } from '../../../utils/criticalLogger.js';

const AI_APP_BASE = (process.env.AI_ROUTE_API_FOURTH || 'http://localhost:5004').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: AI_APP_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const withHeaders = (companyId, userId, config = {}) => {
  const headers = { ...(config.headers || {}) };
  if (companyId && String(companyId).trim()) headers['X-Company-ID'] = String(companyId).trim();
  if (userId && String(userId).trim()) headers['X-User-ID'] = String(userId).trim();
  return { ...config, headers };
};

const buildParams = (query) => {
  const params = {};
  if (query.days != null && query.days !== '') params.days = query.days;
  if (query.period) params.period = query.period;
  if (query.start_date) params.start_date = query.start_date;
  if (query.end_date) params.end_date = query.end_date;
  if (query.limit != null && query.limit !== '') params.limit = query.limit;
  if (query.driver_id) params.driver_id = query.driver_id;
  return params;
};

/** GET /api/cxo/dashboard/summary */
export const getSummary = async (companyId, userId, query = {}) => {
  try {
    const params = buildParams(query);
    const config = withHeaders(companyId, userId, { params: Object.keys(params).length ? params : { days: 30 } });
    const response = await apiClient.get('/api/cxo/dashboard/summary', config);
    return response.data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'CXO dashboard summary failed', { error: error.message, response: error.response?.data });
    throw new AppError(error.response?.data?.message || error.message || 'Failed to fetch summary', error.response?.status || 500);
  }
};

/** GET /api/cxo/dashboard/menu-demand */
export const getMenuDemand = async (companyId, userId, query = {}) => {
  try {
    const params = buildParams(query);
    const config = withHeaders(companyId, userId, { params: Object.keys(params).length ? params : { days: 30 } });
    const response = await apiClient.get('/api/cxo/dashboard/menu-demand', config);
    return response.data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'CXO dashboard menu-demand failed', { error: error.message });
    throw new AppError(error.response?.data?.message || error.message || 'Failed to fetch menu demand', error.response?.status || 500);
  }
};

/** GET /api/cxo/dashboard/order-areas */
export const getOrderAreas = async (companyId, userId, query = {}) => {
  try {
    const params = buildParams(query);
    const config = withHeaders(companyId, userId, { params: Object.keys(params).length ? params : { days: 30 } });
    const response = await apiClient.get('/api/cxo/dashboard/order-areas', config);
    return response.data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'CXO dashboard order-areas failed', { error: error.message });
    throw new AppError(error.response?.data?.message || error.message || 'Failed to fetch order areas', error.response?.status || 500);
  }
};

/** GET /api/cxo/dashboard/driver-earnings */
export const getDriverEarnings = async (companyId, userId, query = {}) => {
  try {
    const params = buildParams(query);
    const config = withHeaders(companyId, userId, { params: Object.keys(params).length ? params : { days: 30 } });
    const response = await apiClient.get('/api/cxo/dashboard/driver-earnings', config);
    return response.data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'CXO dashboard driver-earnings failed', { error: error.message });
    throw new AppError(error.response?.data?.message || error.message || 'Failed to fetch driver earnings', error.response?.status || 500);
  }
};

/** GET /api/cxo/dashboard/driver-distance */
export const getDriverDistance = async (companyId, userId, query = {}) => {
  try {
    const params = buildParams(query);
    const config = withHeaders(companyId, userId, { params: Object.keys(params).length ? params : { days: 30 } });
    const response = await apiClient.get('/api/cxo/dashboard/driver-distance', config);
    return response.data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'CXO dashboard driver-distance failed', { error: error.message });
    throw new AppError(error.response?.data?.message || error.message || 'Failed to fetch driver distance', error.response?.status || 500);
  }
};

/** GET /api/cxo/dashboard/live-drivers */
export const getLiveDrivers = async (companyId, userId) => {
  try {
    const config = withHeaders(companyId, userId, {});
    const response = await apiClient.get('/api/cxo/dashboard/live-drivers', config);
    return response.data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'CXO dashboard live-drivers failed', { error: error.message });
    throw new AppError(error.response?.data?.message || error.message || 'Failed to fetch live drivers', error.response?.status || 500);
  }
};

/** GET /api/cxo/dashboard/route-history */
export const getRouteHistory = async (companyId, userId, query = {}) => {
  try {
    const params = buildParams(query);
    const config = withHeaders(companyId, userId, { params: Object.keys(params).length ? params : { days: 30 } });
    const response = await apiClient.get('/api/cxo/dashboard/route-history', config);
    return response.data;
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'CXO dashboard route-history failed', { error: error.message });
    throw new AppError(error.response?.data?.message || error.message || 'Failed to fetch route history', error.response?.status || 500);
  }
};
