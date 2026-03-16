/**
 * ML Partner Manager Controller - Proxy to 5004 per FRONTEND_EXECUTIVES_VEHICLE_ASSIGNMENT_GUIDE.
 * GET /executives → executives + vehicle_choices; POST assign by registration_number; 409 + force_assign.
 */
import AppError from '../utils/AppError.js';
import {
  listDeliveryPartners,
  listVehiclesForPartnerManager,
  getExecutivesFrom5004,
  assignVehicle5004,
  unassignVehicle5004,
  createDeliveryPartner,
} from '../services/mlPartnerManager.service.js';

/**
 * GET /api/ml-partner-manager/executives
 * Returns { executives, vehicle_choices } from 5004 (fallback to DB when 5004 fails).
 */
export async function getExecutives(req, res, next) {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required', 400);
    const { executives, vehicle_choices } = await getExecutivesFrom5004(companyId);
    console.log('executives', executives);
    res.status(200).json({ status: 'success', executives, vehicle_choices });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ml-partner-manager/partners
 */
export async function getPartners(req, res, next) {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required', 400);
    const partners = await listDeliveryPartners(companyId);
    res.status(200).json({ status: 'success', data: partners });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ml-partner-manager/partners
 * Body: { email, phone, password, firstName, lastName }
 * Creates a DELIVERY_PARTNER user in the current company.
 */
export async function postCreatePartner(req, res, next) {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required', 400);
    const partner = await createDeliveryPartner(companyId, req.body || {});
    res.status(201).json({ status: 'success', data: partner, message: 'Delivery partner created successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ml-partner-manager/vehicles?user_id=
 */
export async function getVehicles(req, res, next) {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required', 400);
    const user_id = req.query.user_id || null;
    const vehicles = await listVehiclesForPartnerManager({ companyId, user_id });
    res.status(200).json({ status: 'success', data: vehicles });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ml-partner-manager/vehicles/assign
 * Body: { userId, registration_number, force_assign? } per guide. Proxies to 5004.
 * On 409 returns 409 with require_force, current_assignee so frontend can confirm and retry with force_assign: true.
 */
export async function postAssignVehicle(req, res, next) {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required', 400);
    const { userId, registration_number, force_assign } = req.body || {};
    const data = await assignVehicle5004(userId, companyId, registration_number, !!force_assign);
    res.status(200).json({ status: 'success', ...data });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 409 && error.apiBody) {
      return res.status(409).json({ success: false, ...error.apiBody });
    }
    next(error);
  }
}

/**
 * POST /api/ml-partner-manager/vehicles/unassign
 * Body: { userId } per guide. Proxies to 5004 (registration_number: null).
 */
export async function postUnassignVehicle(req, res, next) {
  try {
    const companyId = req.companyId;
    if (!companyId) throw new AppError('Company context is required', 400);
    const { userId } = req.body || {};
    const data = await unassignVehicle5004(userId, companyId);
    res.status(200).json({ status: 'success', data, message: 'Vehicle unassigned' });
  } catch (error) {
    next(error);
  }
}
