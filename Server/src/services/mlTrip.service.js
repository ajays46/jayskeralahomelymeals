/**
 * ML Trip Service - MaXHub Logistics: create trips, trip addresses (MlTripAddress), and linked MenuItem + MenuItemPrice.
 * Each trip: MlTripAddress for pickup/delivery, one MenuItem (platform) + MenuItemPrice (order amount), MlTrip linked to all.
 */
import prisma from '../config/prisma.js';
import { createMlTripAddress } from './mlTripAddress.service.js';

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

    const mlTrip = await prisma.mlTrip.create({
      data: {
        companyId,
        userId,
        menuItemId: menuItem.id,
        platform,
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
