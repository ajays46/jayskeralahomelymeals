/**
 * ML Partner Manager Service - Proxy to 5004 API (FRONTEND_EXECUTIVES_VEHICLE_ASSIGNMENT_GUIDE).
 * GET /api/executives → executives + vehicle_choices; POST .../vehicle → assign by registration_number; 409 + force_assign.
 */
import prisma from '../../../config/prisma.js';
import { logInfo, logError, LOG_CATEGORIES } from '../../../utils/criticalLogger.js';
import AppError from '../../../utils/AppError.js';
import bcrypt from 'bcryptjs';
import { generateApiKey } from '../../../utils/helpers.js';
import { createDeliveryExecutiveProfile } from '../../shared/services/deliveryExecutiveProfile.service.js';

const EXECUTIVES_API_BASE = (process.env.AI_ROUTE_API_FOURTH || process.env.AI_ROUTE_API || 'http://localhost:5004').replace(/\/$/, '');
const EXECUTIVES_API_KEY = process.env.AI_ROUTE_API_KEY || 'mysecretkey123';

async function fetch5004(method, path, companyId, body = null) {
  const url = `${EXECUTIVES_API_BASE}${path}`;
  const headers = {
    Authorization: `Bearer ${EXECUTIVES_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Company-ID': companyId || '',
  };
  const opts = { method, headers };
  if (body && (method === 'POST' || method === 'PATCH')) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

/**
 * List users with DELIVERY_PARTNER role in the given company.
 * @param {string} companyId
 * @returns {Promise<Array<{ id, email?, status }>>}
 */
export async function listDeliveryPartners(companyId) {
  if (!companyId || typeof companyId !== 'string' || !companyId.trim()) {
    throw new AppError('Company ID is required', 400);
  }
  const users = await prisma.user.findMany({
    where: {
      companyId: companyId.trim(),
      userRoles: {
        some: { name: 'DELIVERY_PARTNER' },
      },
    },
    select: {
      id: true,
      status: true,
      auth: {
        select: { email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return users.map((u) => ({
    id: u.id,
    email: u.auth?.email ?? null,
    status: u.status,
  }));
}

/**
 * Create a new DELIVERY_PARTNER user for the given company.
 * Used by ML Partner Manager UI to onboard delivery partners.
 */
export async function createDeliveryPartner(companyId, payload) {
  if (!companyId || typeof companyId !== 'string' || !companyId.trim()) {
    throw new AppError('Company ID is required', 400);
  }

  const { email, phone, password, firstName, lastName } = payload || {};

  if (!email || !String(email).trim()) {
    throw new AppError('Email is required', 400);
  }
  if (!phone || !String(phone).trim()) {
    throw new AppError('Phone number is required', 400);
  }
  if (!password || String(password).length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }
  if (!firstName || !String(firstName).trim() || !lastName || !String(lastName).trim()) {
    throw new AppError('First name and last name are required', 400);
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const trimmedPhone = String(phone).trim();

  const existingAuthByEmail = await prisma.auth.findUnique({
    where: { email: trimmedEmail },
  });
  if (existingAuthByEmail) {
    throw new AppError('Email already registered', 409);
  }

  const existingAuthByPhone = await prisma.auth.findFirst({
    where: {
      phoneNumber: trimmedPhone,
      user: { companyId: companyId.trim() },
    },
  });
  if (existingAuthByPhone) {
    throw new AppError('This phone number is already registered for this company', 400);
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);
  const apiKey = generateApiKey();

  const result = await prisma.$transaction(async (tx) => {
    const auth = await tx.auth.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
        phoneNumber: trimmedPhone,
        apiKey,
        status: 'ACTIVE',
      },
    });

    const user = await tx.user.create({
      data: {
        authId: auth.id,
        status: 'ACTIVE',
        companyId: companyId.trim(),
      },
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        name: 'DELIVERY_PARTNER',
      },
    });

    await createDeliveryExecutiveProfile(tx, user.id);

    const contact = await tx.contact.create({
      data: {
        userId: user.id,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
      },
    });

    return { auth, user, contact };
  });

  logInfo(LOG_CATEGORIES.SYSTEM, 'ML Partner Manager: delivery partner created', {
    companyId,
    userId: result.user.id,
    email: result.auth.email,
  });

  return {
    id: result.user.id,
    email: result.auth.email,
    phone: result.auth.phoneNumber,
    status: result.user.status,
    contact: {
      firstName: result.contact.firstName,
      lastName: result.contact.lastName,
    },
    roles: ['DELIVERY_PARTNER'],
  };
}

/**
 * List all vehicles from the vehicles table, one per distinct registration_number (no duplicates).
 * Used when 5004 is unavailable (fallback).
 */
export async function listVehiclesForPartnerManager(_opts = {}) {
  const vehicles = await prisma.vehicles.findMany({
    orderBy: { created_at: 'desc' },
  });
  const seen = new Set();
  return vehicles.filter((v) => {
    const reg = (v.registration_number || '').trim();
    if (!reg) return false;
    if (seen.has(reg)) return false;
    seen.add(reg);
    return true;
  });
}

/**
 * Get executives + vehicle_choices from 5004 (GET /api/executives). Per guide.
 * On 5004 failure, fallback: build from our DB (partners + vehicles by registration_number).
 */
export async function getExecutivesFrom5004(companyId) {
  if (!companyId || !companyId.trim()) {
    throw new AppError('Company ID is required', 400);
  }
  const { status, data } = await fetch5004('GET', '/api/executives', companyId);
  if (status === 200) {
    const executives = data?.executives ?? (Array.isArray(data) ? data : []);
    const vehicle_choices = data?.vehicle_choices ?? [];
    return { executives, vehicle_choices };
  }
  logError(LOG_CATEGORIES.SYSTEM, 'ML Partner Manager: 5004 executives failed, using DB fallback', { status, companyId });
  const partners = await listDeliveryPartners(companyId);
  const vehicles = await listVehiclesForPartnerManager({});
  const vehicle_choices = vehicles.map((v) => v.registration_number || v.id).filter(Boolean);
  const byUserId = new Map(vehicles.filter((v) => v.user_id).map((v) => [v.user_id, v.registration_number]));
  const executives = partners.map((p) => ({
    user_id: p.id,
    exec_name: p.email || p.id,
    status: p.status || 'ACTIVE',
    vehicle: byUserId.get(p.id) || null,
    whatsapp_number: null,
  }));
  return { executives, vehicle_choices };
}

/**
 * Assign vehicle to partner via 5004 (POST /api/executives/:userId/vehicle). Per guide.
 * @param {string} userId
 * @param {string} companyId
 * @param {string} registrationNumber
 * @param {boolean} [forceAssign]
 * @returns {Promise<object>} 200 body or throws AppError with status 409 and body for force_assign flow
 */
export async function assignVehicle5004(userId, companyId, registrationNumber, forceAssign = false) {
  if (!userId || !companyId || !registrationNumber || !String(registrationNumber).trim()) {
    throw new AppError('userId, companyId and registration_number are required', 400);
  }
  const body = {
    registration_number: String(registrationNumber).trim(),
    ...(forceAssign && { force_assign: true }),
  };
  const { status, data } = await fetch5004('POST', `/api/executives/${userId}/vehicle`, companyId, body);
  if (status === 409) {
    const err = new AppError(data?.error || 'Vehicle already assigned to another partner', 409);
    err.apiBody = data;
    throw err;
  }
  if (status !== 200) {
    logError(LOG_CATEGORIES.SYSTEM, 'ML Partner Manager: 5004 assign vehicle failed', { status, userId });
    throw new AppError(data?.error || `5004 API returned ${status}`, status >= 500 ? 502 : status);
  }
  logInfo(LOG_CATEGORIES.SYSTEM, 'ML Partner Manager: vehicle assigned via 5004', { userId, registration_number: registrationNumber });
  return data;
}

/**
 * Unassign vehicle from partner via 5004 (POST .../vehicle with registration_number: null). Per guide.
 */
export async function unassignVehicle5004(userId, companyId) {
  if (!userId || !companyId) {
    throw new AppError('userId and companyId are required', 400);
  }
  const { status, data } = await fetch5004('POST', `/api/executives/${userId}/vehicle`, companyId, { registration_number: null });
  if (status !== 200) {
    logError(LOG_CATEGORIES.SYSTEM, 'ML Partner Manager: 5004 unassign vehicle failed', { status, userId });
    throw new AppError(data?.error || `5004 API returned ${status}`, status >= 500 ? 502 : status);
  }
  logInfo(LOG_CATEGORIES.SYSTEM, 'ML Partner Manager: vehicle unassigned via 5004', { userId });
  return data;
}
