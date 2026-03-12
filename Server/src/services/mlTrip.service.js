/**
 * ML Trip Service - MaXHub Logistics: create trips, trip addresses (MlTripAddress), and linked MenuItem + MenuItemPrice.
 * Each trip: MlTripAddress for pickup/delivery, one MenuItem (platform) + MenuItemPrice (order amount), MlTrip linked to all.
 */
import axios from 'axios';
import AppError from '../utils/AppError.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';
import prisma from '../config/prisma.js';
import { createMlTripAddress } from './mlTripAddress.service.js';

const AI_ROUTE_API_FOURTH = process.env.AI_ROUTE_API_FOURTH || 'http://localhost:5004';

const deliveryPartnerApiClient = axios.create({
  baseURL: AI_ROUTE_API_FOURTH.replace(/\/$/, ''),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Check if location object has enough data to create an address (map link or street+city+pincode).
 * @param {object} loc - { googleMapsUrl?, street?, city?, pincode? }
 * @returns {boolean}
 */
function hasAddressData(loc) {
  if (!loc || typeof loc !== 'object') return false;
  const url = (loc.googleMapsUrl || '').trim();
  if (url) return true;
  const street = (loc.street || '').trim();
  const city = (loc.city || '').trim();
  const pincode = (loc.pincode ?? '').toString().trim();
  return !!(street && city && pincode);
}

/**
 * Create a MenuItem for this trip (one per trip; name = platform label, platformType).
 */
function createMenuItemForTrip(companyId, name, platformType) {
  const normalizedType = (platformType || '').toString().trim().toLowerCase();
  const trimmedName = (name || 'Swiggy').toString().trim();
  return prisma.menuItem.create({
    data: {
      companyId,
      menuId: null,
      name: trimmedName,
      platformType: normalizedType || null,
    },
  });
}

/**
 * Create MenuItemPrice for the trip's order amount.
 */
function createMenuItemPriceForTrip(companyId, menuItemId, totalPrice) {
  return prisma.menuItemPrice.create({
    data: {
      companyId,
      menuItemId,
      totalPrice: Number(totalPrice),
    },
  });
}

/**
 * Process a batch of trips: for each trip create MlTripAddress (pickup/delivery), MenuItem + MenuItemPrice, then MlTrip linked to them.
 * @param {string} companyId
 * @param {string} userId - Delivery partner user id
 * @param {Array<{ platform: string, platformLabel?: string, price: number, partnerPayment?: number, pickup?: object, delivery?: object }>} trips
 * @returns {Promise<{ created: number, mlTrips: object[] }>}
 */
export const addTrips = async (companyId, userId, trips) => {
  if (!companyId || !userId) {
    throw new Error('companyId and userId are required');
  }
  if (!Array.isArray(trips) || trips.length === 0) {
    throw new Error('trips must be a non-empty array');
  }

  const mlTrips = [];
  let created = 0;

  for (const trip of trips) {
    const platform = (trip.platform || 'swiggy').toString().trim().toLowerCase();
    const platformLabel = (trip.platformLabel || trip.platform || 'Swiggy').toString().trim();
    const orderAmount = Number(trip.price);
    if (isNaN(orderAmount) || orderAmount < 0) continue;

    const partnerPayment = Number(trip.partnerPayment);
    const partnerPaymentVal = isNaN(partnerPayment) || partnerPayment < 0 ? 0 : partnerPayment;

    let pickupAddressId = null;
    let deliveryAddressId = null;

    if (hasAddressData(trip.pickup)) {
      const pickupAddr = await createMlTripAddress(userId, trip.pickup, 'PICKUP');
      pickupAddressId = pickupAddr.id;
    }
    if (hasAddressData(trip.delivery)) {
      const deliveryAddr = await createMlTripAddress(userId, trip.delivery, 'DELIVERY');
      deliveryAddressId = deliveryAddr.id;
    }

    const menuItem = await createMenuItemForTrip(companyId, platformLabel, platform);
    await createMenuItemPriceForTrip(companyId, menuItem.id, orderAmount);

    const orderIdVal = (trip.orderId != null && String(trip.orderId).trim() !== '') ? String(trip.orderId).trim() : null;
    const mlTrip = await prisma.mlTrip.create({
      data: {
        companyId,
        userId,
        menuItemId: menuItem.id,
        platform,
        orderId: orderIdVal,
        orderAmount,
        partnerPayment: partnerPaymentVal,
        status: 'PENDING',
        pickupAddressId,
        deliveryAddressId,
      },
      include: {
        menuItem: true,
        pickupAddress: true,
        deliveryAddress: true,
      },
    });
    mlTrips.push(mlTrip);
    created += 1;
  }

  return { created, mlTrips };
};

/**
 * Get start of today UTC (00:00:00.000).
 */
function startOfTodayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of current week (Monday) UTC.
 */
function startOfWeekUTC() {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = start of week
  d.setDate(d.getDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const VALID_PLATFORMS = ['swiggy', 'flipkart', 'amazon'];
const VALID_STATUSES = ['pending', 'picked_up', 'delivered'];

/** Map Prisma status to guide's trip_status (lowercase). */
function toTripStatus(status) {
  if (!status) return 'pending';
  const s = String(status).toUpperCase();
  if (s === 'PICKED_UP') return 'picked_up';
  if (s === 'DELIVERED') return 'delivered';
  return 'pending';
}

/** Map MlTripAddress to guide shape: { street, city, pincode, geo_location, google_maps_url }. */
function formatAddressForResponse(addr) {
  if (!addr) return null;
  return {
    street: addr.street ?? '',
    housename: addr.housename ?? '',
    city: addr.city ?? '',
    pincode: addr.pincode ?? 0,
    geo_location: addr.geoLocation ?? null,
    google_maps_url: addr.googleMapsUrl ?? null,
  };
}

/** Map MlTrip (with include) to guide response shape. */
function formatTripForResponse(trip) {
  if (!trip) return null;
  return {
    id: trip.id,
    trip_status: toTripStatus(trip.status),
    status: trip.status,
    platform: trip.platform,
    orderId: trip.orderId ?? null,
    orderAmount: trip.orderAmount,
    partnerPayment: trip.partnerPayment,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    pickup_address: formatAddressForResponse(trip.pickupAddress),
    delivery_address: formatAddressForResponse(trip.deliveryAddress),
  };
}

/**
 * List trips for delivery partner. Optional filters: platform, status (pending | picked_up | delivered).
 * @param {string} companyId
 * @param {string} userId
 * @param {{ platform?: string, status?: string }} filters
 * @returns {Promise<object[]>} trips in guide shape
 */
export const listTripsForPartner = async (companyId, userId, filters = {}) => {
  if (!companyId || !userId) throw new Error('companyId and userId are required');
  const where = { companyId, userId };
  if (filters.platform && VALID_PLATFORMS.includes(String(filters.platform).trim().toLowerCase())) {
    where.platform = String(filters.platform).trim().toLowerCase();
  }
  if (filters.status && VALID_STATUSES.includes(String(filters.status).trim().toLowerCase())) {
    const s = String(filters.status).trim().toLowerCase();
    where.status = s === 'pending' ? 'PENDING' : s === 'picked_up' ? 'PICKED_UP' : 'DELIVERED';
  }
  const trips = await prisma.mlTrip.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { pickupAddress: true, deliveryAddress: true },
  });
  return trips.map(formatTripForResponse);
};

/**
 * Get single trip by id for the partner. Returns null if not found or not owner.
 */
export const getTripById = async (tripId, userId, companyId) => {
  if (!tripId || !userId || !companyId) return null;
  const trip = await prisma.mlTrip.findFirst({
    where: { id: tripId, userId, companyId },
    include: { pickupAddress: true, deliveryAddress: true, menuItem: true },
  });
  return trip ? formatTripForResponse(trip) : null;
};

/**
 * Update trip status. Valid transitions: PENDING -> PICKED_UP -> DELIVERED.
 * @param {string} tripId
 * @param {string} userId
 * @param {string} companyId
 * @param {string} trip_status - "picked_up" | "delivered"
 */
export const updateTripStatus = async (tripId, userId, companyId, trip_status) => {
  if (!tripId || !userId || !companyId) throw new Error('tripId, userId, companyId are required');
  const ts = String(trip_status).trim().toLowerCase();
  if (ts !== 'picked_up' && ts !== 'delivered') throw new Error('trip_status must be picked_up or delivered');
  const newStatus = ts === 'picked_up' ? 'PICKED_UP' : 'DELIVERED';
  const trip = await prisma.mlTrip.findFirst({ where: { id: tripId, userId, companyId } });
  if (!trip) throw new Error('Trip not found');
  const current = String(trip.status).toUpperCase();
  if (newStatus === 'PICKED_UP' && current !== 'PENDING') throw new Error('Only PENDING trips can be marked picked_up');
  if (newStatus === 'DELIVERED' && current !== 'PICKED_UP' && current !== 'PENDING') throw new Error('Trip must be PICKED_UP or PENDING before delivered');
  await prisma.mlTrip.update({
    where: { id: tripId },
    data: { status: newStatus },
  });
  const updated = await prisma.mlTrip.findFirst({
    where: { id: tripId },
    include: { pickupAddress: true, deliveryAddress: true },
  });
  return formatTripForResponse(updated);
};

/**
 * Get dashboard stats for a delivery partner: trips count and revenue (partner payment) for today, this week, and all time.
 * @param {string} companyId
 * @param {string} userId
 * @param {string} [platform] - Optional: 'swiggy' | 'flipkart' | 'amazon' to filter by platform
 * @returns {Promise<{ tripsToday, revenueToday, tripsThisWeek, revenueThisWeek, tripsTotal, revenueTotal, recentTrips, revenueByDay }>}
 */
export const getPartnerDashboardStats = async (companyId, userId, platform) => {
  if (!companyId || !userId) {
    throw new Error('companyId and userId are required');
  }

  const where = { companyId, userId };
  const platformFilter = platform && typeof platform === 'string' && VALID_PLATFORMS.includes(platform.trim().toLowerCase())
    ? platform.trim().toLowerCase()
    : null;
  if (platformFilter) {
    where.platform = platformFilter;
  }
  const todayStart = startOfTodayUTC();
  const weekStart = startOfWeekUTC();

  const [tripsToday, tripsThisWeek, tripsTotal, revenueToday, revenueThisWeek, revenueTotal, recentTrips, allTripsLast7Days] = await Promise.all([
    prisma.mlTrip.count({ where: { ...where, createdAt: { gte: todayStart } } }),
    prisma.mlTrip.count({ where: { ...where, createdAt: { gte: weekStart } } }),
    prisma.mlTrip.count({ where }),
    prisma.mlTrip.aggregate({ where: { ...where, createdAt: { gte: todayStart } }, _sum: { partnerPayment: true } }),
    prisma.mlTrip.aggregate({ where: { ...where, createdAt: { gte: weekStart } }, _sum: { partnerPayment: true } }),
    prisma.mlTrip.aggregate({ where, _sum: { partnerPayment: true } }),
    prisma.mlTrip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { pickupAddress: true, deliveryAddress: true, menuItem: true },
    }),
    prisma.mlTrip.findMany({
      where: { ...where, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true, partnerPayment: true },
    }),
  ]);

  const revenueByDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 1);
    const dayTrips = allTripsLast7Days.filter((t) => t.createdAt >= d && t.createdAt < next);
    const sum = dayTrips.reduce((s, t) => s + Number(t.partnerPayment || 0), 0);
    revenueByDay.push({
      date: d.toISOString().slice(0, 10),
      revenue: sum,
      trips: dayTrips.length,
    });
  }

  return {
    tripsToday,
    revenueToday: Number(revenueToday._sum.partnerPayment || 0),
    tripsThisWeek,
    revenueThisWeek: Number(revenueThisWeek._sum.partnerPayment || 0),
    tripsTotal,
    revenueTotal: Number(revenueTotal._sum.partnerPayment || 0),
    recentTrips,
    revenueByDay,
  };
};

/**
 * List vehicles with unique registration numbers for delivery partner vehicle selection.
 * Only one entry per distinct registration_number (no duplicates).
 * @returns {Promise<Array<{ id, registration_number, model }>>}
 */
export const listAllVehicles = async () => {
  const vehicles = await prisma.vehicles.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      registration_number: true,
      model: true,
    },
  });
  const seen = new Set();
  return vehicles.filter((v) => {
    const num = (v.registration_number || '').trim();
    if (!num) return false;
    if (seen.has(num)) return false;
    seen.add(num);
    return true;
  });
};

/**
 * Start shift (driver goes online) - forwards to external delivery partner API (AI_ROUTE_API_FOURTH).
 * POST /api/shift/start with user_id, company_id, platform, current_location, optional vehicle_id.
 * @param {string} userId
 * @param {string} companyId
 * @param {string} [platform] - e.g. 'SWIGGY' (default), 'AMAZON', 'FLIPKART'
 * @param {{ lat: number, lng: number }|null} [currentLocation]
 * @param {string} [vehicleNumber] - optional vehicle registration number for the shift
 * @returns {Promise<object>} External API response
 */
export const startShift = async (userId, companyId, platform, currentLocation, vehicleNumber) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id required (header X-Company-ID or user context)', 400);
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new AppError('user_id required (authenticated user)', 400);
  }
  try {
    const platformValue = (platform || 'SWIGGY').toString().trim().toUpperCase();
    const body = {
      user_id: userId.trim(),
      company_id: companyId.trim(),
      platform: platformValue,
    };
    if (currentLocation && typeof currentLocation === 'object' && currentLocation.lat != null && currentLocation.lng != null) {
      body.current_location = {
        lat: Number(currentLocation.lat),
        lng: Number(currentLocation.lng),
      };
    }
    if (vehicleNumber && typeof vehicleNumber === 'string' && vehicleNumber.trim()) {
      body.vehicle_number = vehicleNumber.trim();
      body.registration_number = vehicleNumber.trim();
    }
    const response = await deliveryPartnerApiClient.post('/api/shift/start', body, {
      headers: { 'X-Company-ID': companyId.trim() },
    });
    const data = response.data;

    if (data && data.success === false) {
      throw new Error(data.error || 'Failed to start shift');
    }

    logInfo(LOG_CATEGORIES.SYSTEM, 'Shift started', {
      company_id: companyId,
      user_id: userId,
      platform: platformValue,
    });

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to start shift', {
      error: error.message,
      company_id: companyId,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to start shift',
      error.response?.status === 404 ? 502 : 500
    );
  }
};

/**
 * List trips from external 5004 API (Delivery Partner). GET /api/ml-trips?user_id=&platform=&status=
 * @param {string} userId
 * @param {string} companyId
 * @param {{ platform?: string, status?: string }} filters
 */
export const listTripsFrom5004 = async (userId, companyId, filters = {}) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id required', 400);
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new AppError('user_id required', 400);
  }
  try {
    const params = { user_id: userId.trim() };
    if (filters.platform) params.platform = String(filters.platform).trim().toUpperCase();
    if (filters.status) params.status = String(filters.status).trim().toLowerCase();
    const response = await deliveryPartnerApiClient.get('/api/ml-trips', {
      params,
      headers: { 'X-Company-ID': companyId.trim() },
    });
    const data = response.data;
    if (data && data.success === false) {
      throw new Error(data.error || 'Failed to list trips');
    }
    logInfo(LOG_CATEGORIES.SYSTEM, 'ML trips list fetched from 5004', { company_id: companyId, count: (data?.trips || []).length });
    return { success: true, trips: data?.trips ?? [] };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to list trips from 5004', {
      error: error.message,
      company_id: companyId,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to list trips',
      error.response?.status === 404 ? 502 : 500
    );
  }
};

/**
 * Get trips by order ID from external 5004 API. GET /api/ml-trips/by-order-id?order_id=<full_or_last_4_or_5>
 * @param {string} userId
 * @param {string} companyId
 * @param {string} orderId - full order ID or last 4/5 digits
 */
export const getTripsByOrderId5004 = async (userId, companyId, orderId) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id required', 400);
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new AppError('user_id required', 400);
  }
  const orderIdStr = (orderId ?? '').toString().trim();
  if (!orderIdStr) {
    throw new AppError('order_id is required', 400);
  }
  try {
    const response = await deliveryPartnerApiClient.get('/api/ml-trips/by-order-id', {
      params: { order_id: orderIdStr },
      headers: { 'X-Company-ID': companyId.trim() },
    });
    const data = response.data;
    if (data && data.success === false) {
      throw new Error(data.error || data.message || 'Failed to get trips by order ID');
    }
    const trips = Array.isArray(data?.trips) ? data.trips : [];
    logInfo(LOG_CATEGORIES.SYSTEM, 'ML trips by order ID fetched from 5004', { company_id: companyId, order_id: orderIdStr, count: trips.length });
    return {
      success: true,
      trips,
      trip: data?.trip ?? (trips.length === 1 ? trips[0] : null),
      message: data?.message,
    };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to get trips by order ID from 5004', {
      error: error.message,
      company_id: companyId,
      order_id: orderIdStr,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to get trips by order ID',
      error.response?.status === 400 ? 400 : error.response?.status === 404 ? 404 : 500
    );
  }
};

/**
 * Get single trip from external 5004 API. GET /api/ml-trips/:tripId
 */
export const getTripFrom5004 = async (tripId, userId, companyId) => {
  if (!tripId || !companyId || !userId) {
    throw new AppError('tripId, company_id and user context required', 400);
  }
  try {
    const response = await deliveryPartnerApiClient.get(`/api/ml-trips/${tripId}`, {
      params: { user_id: userId.trim() },
      headers: { 'X-Company-ID': companyId.trim() },
    });
    const data = response.data;
    if (data && data.success === false) {
      throw new Error(data.error || 'Trip not found');
    }
    if (!data?.trip) {
      throw new AppError('Trip not found', 404);
    }
    logInfo(LOG_CATEGORIES.SYSTEM, 'ML trip detail fetched from 5004', { tripId, company_id: companyId });
    return { success: true, trip: data.trip };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to get trip from 5004', {
      error: error.message,
      tripId,
      company_id: companyId,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to get trip',
      error.response?.status === 404 ? 404 : 500
    );
  }
};

/**
 * Update trip status on external 5004 API. PATCH /api/ml-trips/:tripId { trip_status }
 */
export const updateTripStatus5004 = async (tripId, userId, companyId, trip_status) => {
  if (!tripId || !companyId || !userId) {
    throw new AppError('tripId, company_id and user context required', 400);
  }
  const ts = String(trip_status || '').trim().toLowerCase();
  if (ts !== 'picked_up' && ts !== 'delivered') {
    throw new AppError('trip_status must be picked_up or delivered', 400);
  }
  try {
    const response = await deliveryPartnerApiClient.patch(`/api/ml-trips/${tripId}`, { trip_status: ts }, {
      headers: { 'X-Company-ID': companyId.trim(), 'Content-Type': 'application/json' },
    });
    const data = response.data;
    if (data && data.success === false) {
      throw new Error(data.error || 'Failed to update trip status');
    }
    logInfo(LOG_CATEGORIES.SYSTEM, 'ML trip status updated on 5004', { tripId, trip_status: ts, company_id: companyId });
    return { success: true, trip: data?.trip ?? data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to update trip status on 5004', {
      error: error.message,
      tripId,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update trip status',
      error.response?.status === 404 ? 502 : 500
    );
  }
};

/**
 * Start route (tracking) on external 5004 API.
 * POST /api/ml-trips/start-route
 * @returns {Promise<{ success: boolean, route_id: string, driver_id: string, stops: any[] }>}
 */
export const startRoute5004 = async (userId, companyId, platform, currentLocation) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id required', 400);
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new AppError('user_id required', 400);
  }
  try {
    const platformValue = (platform || 'SWIGGY').toString().trim().toUpperCase();
    const body = {
      user_id: userId.trim(),
      company_id: companyId.trim(),
      platform: platformValue,
    };
    if (currentLocation && typeof currentLocation === 'object' && currentLocation.lat != null && currentLocation.lng != null) {
      body.current_location = { lat: Number(currentLocation.lat), lng: Number(currentLocation.lng) };
    }
    const response = await deliveryPartnerApiClient.post('/api/ml-trips/start-route', body, {
      headers: { 'X-Company-ID': companyId.trim() },
    });
    const data = response.data;
    console.log('data', data);
    if (data && data.success === false) throw new Error(data.error || 'Failed to start route');
    logInfo(LOG_CATEGORIES.SYSTEM, 'ML start-route created on 5004', { company_id: companyId, user_id: userId });
    return { success: true, ...data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to start-route on 5004', {
      error: error.message,
      company_id: companyId,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to start route',
      error.response?.status === 404 ? 502 : 500
    );
  }
};

/**
 * Vehicle tracking on external 5004 API.
 * POST /api/vehicle-tracking
 */
export const vehicleTracking5004 = async (companyId, body) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id required', 400);
  }
  if (!body || typeof body !== 'object') throw new AppError('tracking body required', 400);
  if (!body.route_id) throw new AppError('route_id required', 400);
  if (!Array.isArray(body.tracking_points) || body.tracking_points.length === 0) {
    throw new AppError('tracking_points must be a non-empty array', 400);
  }
  try {
    const response = await deliveryPartnerApiClient.post('/api/vehicle-tracking', body, {
      headers: { 'X-Company-ID': companyId.trim() },
    });
    const data = response.data;
    if (data && data.success === false) throw new Error(data.error || 'Failed to send vehicle tracking');
    return { success: true, ...data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed vehicle-tracking on 5004', {
      error: error.message,
      company_id: companyId,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to send vehicle tracking',
      error.response?.status === 404 ? 502 : 500
    );
  }
};

/**
 * Mark stop reached on external 5004 API.
 * POST /api/journey/mark-stop
 */
export const markStop5004 = async (companyId, body) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id required', 400);
  }
  if (!body || typeof body !== 'object') throw new AppError('mark-stop body required', 400);
  if (!body.route_id) throw new AppError('route_id required', 400);
  if (!body.driver_id) throw new AppError('driver_id required', 400);
  if (!body.planned_stop_id && !body.delivery_id && !body.stop_order) {
    throw new AppError('planned_stop_id (recommended) or delivery_id or stop_order is required', 400);
  }
  try {
    const response = await deliveryPartnerApiClient.post('/api/journey/mark-stop', body, {
      headers: { 'X-Company-ID': companyId.trim() },
    });
    const data = response.data;
    if (data && data.success === false) throw new Error(data.error || 'Failed to mark stop');
    return { success: true, ...data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed mark-stop on 5004', {
      error: error.message,
      company_id: companyId,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to mark stop',
      error.response?.status === 404 ? 502 : 500
    );
  }
};

/**
 * Get shift status from DB (driver_availability). Read-only; 5004 is the writer.
 * @returns { Promise<{ success: true, inShift: boolean }> }
 */
export const getShiftStatusFromDb = async (userId, companyId) => {
  if (!userId || !companyId) return { success: true, inShift: false };
  try {
    const row = await prisma.driverAvailability.findUnique({
      where: {
        userId_companyId: { userId: String(userId).trim(), companyId: String(companyId).trim() },
      },
    });
    return { success: true, inShift: !!row };
  } catch (err) {
    logError(LOG_CATEGORIES.SYSTEM, 'getShiftStatusFromDb error', { error: err?.message });
    return { success: true, inShift: false };
  }
};

/**
 * End shift on external 5004 API.
 * POST /api/shift/end
 */
export const endShift5004 = async (userId, companyId, platform) => {
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    throw new AppError('company_id required', 400);
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new AppError('user_id required', 400);
  }
  try {
    const platformValue = (platform || 'SWIGGY').toString().trim().toUpperCase();
    const body = { user_id: userId.trim(), platform: platformValue };
    const response = await deliveryPartnerApiClient.post('/api/shift/end', body, {
      headers: { 'X-Company-ID': companyId.trim() },
    });
    const data = response.data;
    if (data && data.success === false) throw new Error(data.error || 'Failed to end shift');
    logInfo(LOG_CATEGORIES.SYSTEM, 'Shift ended', { company_id: companyId, user_id: userId, platform: platformValue });
    return { success: true, ...data };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to end shift', {
      error: error.message,
      company_id: companyId,
      response: error.response?.data,
    });
    throw new AppError(
      error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to end shift',
      error.response?.status === 404 ? 502 : 500
    );
  }
};
