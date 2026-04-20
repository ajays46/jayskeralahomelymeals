/**
 * @feature kitchen-store — Upstream kitchen inventory API client (axios proxy, tenant headers, logging).
 */
import axios from 'axios';
import FormData from 'form-data';
import prisma from '../../../config/prisma.js';
import AppError from '../../../utils/AppError.js';
import { logError, LOG_CATEGORIES, logInfo } from '../../../utils/criticalLogger.js';

const AI_ROUTE_API = process.env.AI_ROUTE_API
const KITCHEN_STORE_BASE_URL = process.env.AI_ROUTE_API_FIFTH;

console.log('KITCHEN_STORE_BASE_URL', KITCHEN_STORE_BASE_URL);
const EXTERNAL_API_AUTH_TOKEN = process.env.EXTERNAL_API_AUTH_TOKEN || 'mysecretkey123';
const K = '/api/max_kitchen/v1';

const apiClient = axios.create({
  baseURL: KITCHEN_STORE_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${EXTERNAL_API_AUTH_TOKEN}`
  }
});

const apiClientAI = axios.create({
  baseURL: AI_ROUTE_API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${EXTERNAL_API_AUTH_TOKEN}`
  }
});
/** Tenant + acting user for kitchen inventory upstream (see FRONTEND_KITCHEN_STORE_GUIDE §2.1). */
const withKitchenContext = (companyId, userId, config = {}) => {
  const headers = { ...(config.headers || {}) };
  if (companyId) headers['X-Company-ID'] = companyId;
  const uid = userId != null && String(userId).trim() !== '' ? String(userId).trim() : null;
  if (uid) headers['X-User-ID'] = uid;
  return { ...config, headers };
};

const mapKitchenErrorCodeToHttpStatus = (code) => {
  const map = {
    bad_request: 400,
    unauthorized: 401,
    forbidden: 403,
    not_found: 404,
    conflict: 409,
    validation_error: 422,
    rate_limited: 429,
    internal_error: 500
  };
  return map[code] ?? 500;
};

/** Upstream Max Kitchen JSON envelope: `{ ok, data?, error?, meta? }` (see FRONTEND_MAX_KITCHEN_API_BASE_MIGRATION). */
const unwrapKitchenJsonBody = (body) => {
  if (body == null || typeof body !== 'object') return body;
  if (!Object.prototype.hasOwnProperty.call(body, 'ok')) return body;
  if (body.ok === true) return body.data;
  const err = body.error && typeof body.error === 'object' ? body.error : {};
  const message =
    typeof err.message === 'string' && err.message.trim() !== ''
      ? err.message
      : 'Kitchen Store request failed';
  const code = typeof err.code === 'string' ? err.code : 'internal_error';
  const status = mapKitchenErrorCodeToHttpStatus(code);
  throw new AppError(message, status, err.details ?? null);
};

const parseKitchenJsonResponse = (response) => {
  const rt = response.config?.responseType;
  if (rt === 'arraybuffer' || rt === 'blob' || rt === 'stream') return response.data;
  return unwrapKitchenJsonBody(response.data);
};

const mapAxiosError = (error) => {
  const data = error.response?.data;
  const status = error.response?.status || 500;
  const message =
    (data?.error && typeof data.error === 'object' && data.error.message) ||
    data?.detail ||
    data?.message ||
    error.message ||
    'Kitchen Store proxy request failed';
  return new AppError(message, status);
};

const logKitchenSuccess = (operation, context = {}) => {
  logInfo(LOG_CATEGORIES.INVENTORY, `Kitchen Store ${operation} succeeded`, context);
};

const logKitchenError = (operation, error, context = {}) => {
  logError(LOG_CATEGORIES.INVENTORY, `Kitchen Store ${operation} failed`, {
    ...context,
    status: error.response?.status || null,
    error: error.message
  });
};

export const healthCheckService = async (companyId = null, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/health`, withKitchenContext(companyId, userId));
    logKitchenSuccess('healthCheck', { endpoint: `${K}/health`, companyId: companyId || null });
    return parseKitchenJsonResponse(response) ?? { ok: true };
  } catch (error) {
    logKitchenError('healthCheck', error, { endpoint: `${K}/health`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

// Inventory: Items
export const createItemService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/inventory/items`, body, withKitchenContext(companyId, userId));
    logKitchenSuccess('createItem', { endpoint: `/inventory/items`, companyId: companyId || null, itemName: body?.name || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('createItem', error, { endpoint: `/inventory/items`, companyId: companyId || null, itemName: body?.name || null });
    throw mapAxiosError(error);
  }
};

export const pendingImageUploadUrlService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/inventory/items/pending-image-upload-url`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('pendingImageUploadUrl', { endpoint: '/inventory/items/pending-image-upload-url', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('pendingImageUploadUrl', error, { endpoint: '/inventory/items/pending-image-upload-url', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listItemsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/items`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listItems', { endpoint: `/inventory/items`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listItems', error, { endpoint: `/inventory/items`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getItemService = async (itemId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/items/${itemId}`, withKitchenContext(companyId, userId));
    logKitchenSuccess('getItem', { endpoint: '/inventory/items/:item_id', companyId: companyId || null, itemId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getItem', error, { endpoint: '/inventory/items/:item_id', companyId: companyId || null, itemId });
    throw mapAxiosError(error);
  }
};

// Store: Brands
export const listBrandsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/store/brands`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listBrands', { endpoint: `/store/brands`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listBrands', error, { endpoint: `/store/brands`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const createBrandService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/store/brands`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('createBrand', { endpoint: `/store/brands`, companyId: companyId || null, brandName: body?.name || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('createBrand', error, { endpoint: `/store/brands`, companyId: companyId || null, brandName: body?.name || null });
    throw mapAxiosError(error);
  }
};

export const uploadBrandLogoService = async (brandId, file, companyId, userId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname || 'brand-logo',
      contentType: file.mimetype || 'application/octet-stream',
      knownLength: file.size
    });
    const contextConfig = withKitchenContext(companyId, userId, {
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });
    const response = await apiClient.post(
      `${K}/store/brands/${brandId}/logo/upload`,
      formData,
      contextConfig
    );
    logKitchenSuccess('uploadBrandLogo', {
      endpoint: '/store/brands/:brand_id/logo/upload',
      companyId: companyId || null,
      brandId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('uploadBrandLogo', error, {
      endpoint: '/store/brands/:brand_id/logo/upload',
      companyId: companyId || null,
      brandId
    });
    throw mapAxiosError(error);
  }
};

export const getBrandLogoViewUrlService = async (brandId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/store/brands/${brandId}/logo/view-url`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getBrandLogoViewUrl', {
      endpoint: '/store/brands/:brand_id/logo/view-url',
      companyId: companyId || null,
      brandId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getBrandLogoViewUrl', error, {
      endpoint: '/store/brands/:brand_id/logo/view-url',
      companyId: companyId || null,
      brandId
    });
    throw mapAxiosError(error);
  }
};

// Inventory: Stock movements
export const listItemMovementsService = async (itemId, query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/items/${itemId}/movements`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listItemMovements', { endpoint: '/inventory/items/:item_id/movements', companyId: companyId || null, itemId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listItemMovements', error, { endpoint: '/inventory/items/:item_id/movements', companyId: companyId || null, itemId });
    throw mapAxiosError(error);
  }
};

export const createItemMovementService = async (itemId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/inventory/items/${itemId}/movements`, body, withKitchenContext(companyId, userId));
    logKitchenSuccess('createItemMovement', {
      endpoint: '/inventory/items/:item_id/movements',
      companyId: companyId || null,
      itemId,
      movementType: body?.movement_type || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('createItemMovement', error, {
      endpoint: '/inventory/items/:item_id/movements',
      companyId: companyId || null,
      itemId,
      movementType: body?.movement_type || null
    });
    throw mapAxiosError(error);
  }
};

// Inventory: alerts + shopping list
export const getLowStockAlertsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/alerts/low-stock`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getLowStockAlerts', { endpoint: `/inventory/alerts/low-stock`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getLowStockAlerts', error, { endpoint: `/inventory/alerts/low-stock`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getShoppingListService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/shopping-list`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getShoppingList', { endpoint: `/inventory/shopping-list`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getShoppingList', error, { endpoint: `/inventory/shopping-list`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

// Recipe: lines
export const upsertRecipeLineService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/recipe/recipes/lines`, body, withKitchenContext(companyId, userId));
    logKitchenSuccess('upsertRecipeLine', {
      endpoint: `/recipe/recipes/lines`,
      companyId: companyId || null,
      menuItemId: body?.menu_item_id || null,
      inventoryItemId: body?.inventory_item_id || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('upsertRecipeLine', error, {
      endpoint: `/recipe/recipes/lines`,
      companyId: companyId || null,
      menuItemId: body?.menu_item_id || null,
      inventoryItemId: body?.inventory_item_id || null
    });
    throw mapAxiosError(error);
  }
};

export const listRecipeLinesService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/recipe/recipes/lines`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listRecipeLines', { endpoint: `/recipe/recipes/lines`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listRecipeLines', error, { endpoint: `/recipe/recipes/lines`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const updateRecipeLineService = async (lineId, body, companyId, userId = null) => {
  const id = String(lineId || '').trim();
  try {
    const response = await apiClient.put(`${K}/recipe/recipes/lines/${encodeURIComponent(id)}`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('updateRecipeLine', { endpoint: '/recipe/recipes/lines/:line_id', companyId: companyId || null, lineId: id });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('updateRecipeLine', error, { endpoint: '/recipe/recipes/lines/:line_id', companyId: companyId || null, lineId: id });
    throw mapAxiosError(error);
  }
};

export const deleteRecipeLineService = async (lineId, companyId, userId = null) => {
  const id = String(lineId || '').trim();
  try {
    const response = await apiClient.delete(`${K}/recipe/recipes/lines/${encodeURIComponent(id)}`, withKitchenContext(companyId, userId));
    logKitchenSuccess('deleteRecipeLine', { endpoint: '/recipe/recipes/lines/:line_id', companyId: companyId || null, lineId: id });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('deleteRecipeLine', error, { endpoint: '/recipe/recipes/lines/:line_id', companyId: companyId || null, lineId: id });
    throw mapAxiosError(error);
  }
};

/** @feature kitchen-store — Weekly menu slot + menu-item picker (upstream /kitchen/menus/...). */
export const getWeeklySlotService = async (menuId, query = {}, companyId, userId = null) => {
  const mid = String(menuId || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/kitchen/menus/${encodeURIComponent(mid)}/weekly-slot`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('getWeeklySlot', { endpoint: '/kitchen/menus/:menu_id/weekly-slot', companyId: companyId || null, menuId: mid });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getWeeklySlot', error, { endpoint: '/kitchen/menus/:menu_id/weekly-slot', companyId: companyId || null, menuId: mid });
    throw mapAxiosError(error);
  }
};

export const putWeeklySlotService = async (menuId, body, companyId, userId = null) => {
  const mid = String(menuId || '').trim();
  try {
    const response = await apiClient.put(
      `${K}/kitchen/menus/${encodeURIComponent(mid)}/weekly-slot`,
      body,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('putWeeklySlot', { endpoint: '/kitchen/menus/:menu_id/weekly-slot', companyId: companyId || null, menuId: mid });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('putWeeklySlot', error, { endpoint: '/kitchen/menus/:menu_id/weekly-slot', companyId: companyId || null, menuId: mid });
    throw mapAxiosError(error);
  }
};

export const listMenuCombosService = async (menuId, query = {}, companyId, userId = null) => {
  const mid = String(menuId || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/kitchen/menus/${encodeURIComponent(mid)}/menu-items`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('listMenuCombos', { endpoint: '/kitchen/menus/:menu_id/menu-items', companyId: companyId || null, menuId: mid });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listMenuCombos', error, { endpoint: '/kitchen/menus/:menu_id/menu-items', companyId: companyId || null, menuId: mid });
    throw mapAxiosError(error);
  }
};

/** @feature kitchen-store — GET /kitchen/menus/:menu_id/weekly-schedule (optional raw UUID; same shape as by-kind). */
export const getWeeklyScheduleService = async (menuId, query = {}, companyId, userId = null) => {
  const mid = String(menuId || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/kitchen/menus/${encodeURIComponent(mid)}/weekly-schedule`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('getWeeklySchedule', {
      endpoint: '/kitchen/menus/:menu_id/weekly-schedule',
      companyId: companyId || null,
      menuId: mid
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getWeeklySchedule', error, {
      endpoint: '/kitchen/menus/:menu_id/weekly-schedule',
      companyId: companyId || null,
      menuId: mid
    });
    throw mapAxiosError(error);
  }
};

/** @feature kitchen-store — `/kitchen/menus/by-kind/{veg|non_veg}/...` (no menu UUID in URL). */
export const getWeeklyScheduleByKindService = async (menuKindSegment, query = {}, companyId, userId = null) => {
  const seg = String(menuKindSegment || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/kitchen/menus/by-kind/${encodeURIComponent(seg)}/weekly-schedule`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('getWeeklyScheduleByKind', {
      endpoint: '/kitchen/menus/by-kind/:menu_kind/weekly-schedule',
      companyId: companyId || null,
      menuKind: seg
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getWeeklyScheduleByKind', error, {
      endpoint: '/kitchen/menus/by-kind/:menu_kind/weekly-schedule',
      companyId: companyId || null,
      menuKind: seg
    });
    throw mapAxiosError(error);
  }
};

export const getWeeklySlotByKindService = async (menuKindSegment, query = {}, companyId, userId = null) => {
  const seg = String(menuKindSegment || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/kitchen/menus/by-kind/${encodeURIComponent(seg)}/weekly-slot`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('getWeeklySlotByKind', {
      endpoint: '/kitchen/menus/by-kind/:menu_kind/weekly-slot',
      companyId: companyId || null,
      menuKind: seg
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getWeeklySlotByKind', error, {
      endpoint: '/kitchen/menus/by-kind/:menu_kind/weekly-slot',
      companyId: companyId || null,
      menuKind: seg
    });
    throw mapAxiosError(error);
  }
};

export const putWeeklySlotByKindService = async (menuKindSegment, body, companyId, userId = null) => {
  const seg = String(menuKindSegment || '').trim();
  try {
    const response = await apiClient.put(
      `${K}/kitchen/menus/by-kind/${encodeURIComponent(seg)}/weekly-slot`,
      body,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('putWeeklySlotByKind', {
      endpoint: '/kitchen/menus/by-kind/:menu_kind/weekly-slot',
      companyId: companyId || null,
      menuKind: seg
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('putWeeklySlotByKind', error, {
      endpoint: '/kitchen/menus/by-kind/:menu_kind/weekly-slot',
      companyId: companyId || null,
      menuKind: seg
    });
    throw mapAxiosError(error);
  }
};

export const listMenuCombosByKindService = async (menuKindSegment, query = {}, companyId, userId = null) => {
  const seg = String(menuKindSegment || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/kitchen/menus/by-kind/${encodeURIComponent(seg)}/menu-items`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('listMenuCombosByKind', {
      endpoint: '/kitchen/menus/by-kind/:menu_kind/menu-items',
      companyId: companyId || null,
      menuKind: seg
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listMenuCombosByKind', error, {
      endpoint: '/kitchen/menus/by-kind/:menu_kind/menu-items',
      companyId: companyId || null,
      menuKind: seg
    });
    throw mapAxiosError(error);
  }
};

// Kitchen: plans
export const generatePlanService = async (body, companyId, userId = null) => {
  try {
    const uid = userId != null && String(userId).trim() !== '' ? String(userId).trim() : null;
    const payload = uid ? { ...body, user_id: uid } : body;
    const response = await apiClient.post(
      `${K}/kitchen/plans/generate`,
      payload,
      withKitchenContext(companyId, uid)
    );
    logKitchenSuccess('generatePlan', { endpoint: `/kitchen/plans/generate`, companyId: companyId || null, planDate: body?.plan_date || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('generatePlan', error, { endpoint: `/kitchen/plans/generate`, companyId: companyId || null, planDate: body?.plan_date || null });
    throw mapAxiosError(error);
  }
};

export const getPlanService = async (planId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/kitchen/plans/${planId}`, withKitchenContext(companyId, userId));
    logKitchenSuccess('getPlan', { endpoint: '/kitchen/plans/:plan_id', companyId: companyId || null, planId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getPlan', error, { endpoint: '/kitchen/plans/:plan_id', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

/** Guide — `GET /kitchen/plans` with optional `status`, `plan_date`, `limit`. */
export const listPlansService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/kitchen/plans`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPlans', { endpoint: '/kitchen/plans', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listPlans', error, { endpoint: '/kitchen/plans', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

/** Not in the published migration path table; upstream may still expose POST /kitchen/plans/:id/approve. */
export const approvePlanService = async (planId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/kitchen/plans/${planId}/approve`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('approvePlan', { endpoint: '/kitchen/plans/:plan_id/approve', companyId: companyId || null, planId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('approvePlan', error, { endpoint: '/kitchen/plans/:plan_id/approve', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

export const issuePlanService = async (planId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/kitchen/plans/${planId}/issue`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('issuePlan', { endpoint: '/kitchen/plans/:plan_id/issue', companyId: companyId || null, planId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('issuePlan', error, { endpoint: '/kitchen/plans/:plan_id/issue', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

export const submitPlanService = async (planId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/kitchen/plans/${planId}/submit`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('submitPlan', { endpoint: '/kitchen/plans/:plan_id/submit', companyId: companyId || null, planId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('submitPlan', error, { endpoint: '/kitchen/plans/:plan_id/submit', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

export const rejectPlanService = async (planId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/kitchen/plans/${planId}/reject`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('rejectPlan', { endpoint: '/kitchen/plans/:plan_id/reject', companyId: companyId || null, planId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('rejectPlan', error, { endpoint: '/kitchen/plans/:plan_id/reject', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

export const patchKitchenPlanLineService = async (planId, lineId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.patch(
      `${K}/kitchen/plans/${encodeURIComponent(planId)}/lines/${encodeURIComponent(lineId)}`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('patchKitchenPlanLine', {
      endpoint: '/kitchen/plans/:plan_id/lines/:line_id',
      companyId: companyId || null,
      planId,
      lineId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('patchKitchenPlanLine', error, {
      endpoint: '/kitchen/plans/:plan_id/lines/:line_id',
      companyId: companyId || null,
      planId,
      lineId
    });
    throw mapAxiosError(error);
  }
};

export const getPlanDemandVsStoreStockService = async (planId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/kitchen/plans/${encodeURIComponent(planId)}/demand-vs-store-stock`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getPlanDemandVsStoreStock', {
      endpoint: '/kitchen/plans/:plan_id/demand-vs-store-stock',
      companyId: companyId || null,
      planId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getPlanDemandVsStoreStock', error, {
      endpoint: '/kitchen/plans/:plan_id/demand-vs-store-stock',
      companyId: companyId || null,
      planId
    });
    throw mapAxiosError(error);
  }
};

/** Attach `menu_item_name` from local `menu_items` when upstream leaves it null. */
const enrichDeliveryMealCountsMenuNames = async (payload, companyId) => {
  if (!payload || typeof payload !== 'object' || !companyId) return payload;
  const lines = payload.lines;
  if (!Array.isArray(lines) || lines.length === 0) return payload;
  const ids = [
    ...new Set(
      lines
        .map((row) => (row && typeof row === 'object' ? row.menu_item_id ?? row.menuItemId : null))
        .filter((id) => id != null && String(id).trim() !== '')
        .map((id) => String(id).trim())
    )
  ];
  if (ids.length === 0) return payload;
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: ids },
      OR: [{ companyId }, { menu: { companyId } }]
    },
    select: { id: true, name: true }
  });
  const nameById = Object.fromEntries(menuItems.map((m) => [m.id, m.name]));
  return {
    ...payload,
    lines: lines.map((row) => {
      if (!row || typeof row !== 'object') return row;
      const mid = row.menu_item_id ?? row.menuItemId;
      const resolved = mid != null ? nameById[String(mid)] : undefined;
      const raw =
        typeof row.menu_item_name === 'string' && row.menu_item_name.trim() !== ''
          ? row.menu_item_name.trim()
          : typeof row.menuItemName === 'string' && row.menuItemName.trim() !== ''
            ? row.menuItemName.trim()
            : null;
      const nextName = raw ?? resolved ?? null;
      return { ...row, menu_item_name: nextName };
    })
  };
};

/** Guide: GET /kitchen/orders/delivery-meal-counts — tomorrow’s delivery lines by menu_item_id. */
export const getDeliveryMealCountsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/kitchen/orders/delivery-meal-counts`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getDeliveryMealCounts', {
      endpoint: '/kitchen/orders/delivery-meal-counts',
      companyId: companyId || null
    });
    const parsed = parseKitchenJsonResponse(response);
    return enrichDeliveryMealCountsMenuNames(parsed, companyId);
  } catch (error) {
    logKitchenError('getDeliveryMealCounts', error, {
      endpoint: '/kitchen/orders/delivery-meal-counts',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

/** Guide: GET /kitchen/kitchen-holding — quantities in kitchen holding after issue. */
export const getKitchenHoldingService = async (companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/kitchen/kitchen-holding`, withKitchenContext(companyId, userId));
    logKitchenSuccess('getKitchenHolding', { endpoint: '/kitchen/kitchen-holding', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getKitchenHolding', error, { endpoint: '/kitchen/kitchen-holding', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

/** POST /kitchen/meal-programs — create program (upstream normalizes code). */
export const createMealProgramService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/kitchen/meal-programs`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('createMealProgram', { endpoint: '/kitchen/meal-programs', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('createMealProgram', error, { endpoint: '/kitchen/meal-programs', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listMealProgramsService = async (companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/kitchen/meal-programs`, withKitchenContext(companyId, userId));
    logKitchenSuccess('listMealPrograms', { endpoint: '/kitchen/meal-programs', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listMealPrograms', error, { endpoint: '/kitchen/meal-programs', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listMealProgramMenuItemMappingsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/kitchen/meal-programs/menu-item-mappings`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('listMealProgramMenuItemMappings', {
      endpoint: '/kitchen/meal-programs/menu-item-mappings',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listMealProgramMenuItemMappings', error, {
      endpoint: '/kitchen/meal-programs/menu-item-mappings',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const postMealProgramMenuItemMappingService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/kitchen/meal-programs/menu-item-mappings`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('postMealProgramMenuItemMapping', {
      endpoint: '/kitchen/meal-programs/menu-item-mappings',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('postMealProgramMenuItemMapping', error, {
      endpoint: '/kitchen/meal-programs/menu-item-mappings',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const deleteMealProgramMenuItemMappingService = async (mappingId, companyId, userId = null) => {
  const mid = encodeURIComponent(String(mappingId));
  try {
    const response = await apiClient.delete(
      `${K}/kitchen/meal-programs/menu-item-mappings/${mid}`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('deleteMealProgramMenuItemMapping', {
      endpoint: '/kitchen/meal-programs/menu-item-mappings/:id',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('deleteMealProgramMenuItemMapping', error, {
      endpoint: '/kitchen/meal-programs/menu-item-mappings/:id',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const getMealProgramRecipeLinesService = async (programId, companyId, userId = null) => {
  const pid = encodeURIComponent(String(programId));
  try {
    const response = await apiClient.get(
      `${K}/kitchen/meal-programs/${pid}/recipe-lines`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getMealProgramRecipeLines', {
      endpoint: '/kitchen/meal-programs/:program_id/recipe-lines',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getMealProgramRecipeLines', error, {
      endpoint: '/kitchen/meal-programs/:program_id/recipe-lines',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const upsertMealProgramRecipeLineService = async (programId, body, companyId, userId = null) => {
  const pid = encodeURIComponent(String(programId));
  try {
    const response = await apiClient.post(
      `${K}/kitchen/meal-programs/${pid}/recipe-lines`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('upsertMealProgramRecipeLine', {
      endpoint: '/kitchen/meal-programs/:program_id/recipe-lines',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('upsertMealProgramRecipeLine', error, {
      endpoint: '/kitchen/meal-programs/:program_id/recipe-lines',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const deleteMealProgramRecipeLineService = async (programId, lineId, companyId, userId = null) => {
  const pid = encodeURIComponent(String(programId));
  const lid = encodeURIComponent(String(lineId));
  try {
    const response = await apiClient.delete(
      `${K}/kitchen/meal-programs/${pid}/recipe-lines/${lid}`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('deleteMealProgramRecipeLine', {
      endpoint: '/kitchen/meal-programs/:program_id/recipe-lines/:line_id',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('deleteMealProgramRecipeLine', error, {
      endpoint: '/kitchen/meal-programs/:program_id/recipe-lines/:line_id',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const getNextDayReadinessService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/kitchen/reconciliation/next-day-readiness`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getNextDayReadiness', { endpoint: '/kitchen/reconciliation/next-day-readiness', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getNextDayReadiness', error, { endpoint: '/kitchen/reconciliation/next-day-readiness', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const postPhysicalVsSystemService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/kitchen/reconciliation/physical-vs-system`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('postPhysicalVsSystem', { endpoint: '/kitchen/reconciliation/physical-vs-system', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('postPhysicalVsSystem', error, { endpoint: '/kitchen/reconciliation/physical-vs-system', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

/** POST /kitchen/reconciliation/sessions — open guided count session (upstream). */
export const createReconciliationSessionService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/kitchen/reconciliation/sessions`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('createReconciliationSession', { endpoint: '/kitchen/reconciliation/sessions', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('createReconciliationSession', error, { endpoint: '/kitchen/reconciliation/sessions', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const patchReconciliationSessionService = async (sessionId, body, companyId, userId = null) => {
  const sid = encodeURIComponent(String(sessionId));
  try {
    const response = await apiClient.patch(
      `${K}/kitchen/reconciliation/sessions/${sid}`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('patchReconciliationSession', { endpoint: '/kitchen/reconciliation/sessions/:id', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('patchReconciliationSession', error, { endpoint: '/kitchen/reconciliation/sessions/:id', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const putReconciliationSessionLinesService = async (sessionId, body, companyId, userId = null) => {
  const sid = encodeURIComponent(String(sessionId));
  try {
    const response = await apiClient.put(
      `${K}/kitchen/reconciliation/sessions/${sid}/lines`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('putReconciliationSessionLines', { endpoint: '/kitchen/reconciliation/sessions/:id/lines', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('putReconciliationSessionLines', error, { endpoint: '/kitchen/reconciliation/sessions/:id/lines', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const finalizeReconciliationSessionService = async (sessionId, body, companyId, userId = null) => {
  const sid = encodeURIComponent(String(sessionId));
  try {
    const response = await apiClient.post(
      `${K}/kitchen/reconciliation/sessions/${sid}/finalize`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('finalizeReconciliationSession', { endpoint: '/kitchen/reconciliation/sessions/:id/finalize', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('finalizeReconciliationSession', error, { endpoint: '/kitchen/reconciliation/sessions/:id/finalize', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listReconciliationSessionsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/kitchen/reconciliation/sessions`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listReconciliationSessions', { endpoint: '/kitchen/reconciliation/sessions', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listReconciliationSessions', error, { endpoint: '/kitchen/reconciliation/sessions', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getReconciliationSessionService = async (sessionId, companyId, userId = null) => {
  const sid = encodeURIComponent(String(sessionId));
  try {
    const response = await apiClient.get(`${K}/kitchen/reconciliation/sessions/${sid}`, withKitchenContext(companyId, userId));
    logKitchenSuccess('getReconciliationSession', { endpoint: '/kitchen/reconciliation/sessions/:id', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getReconciliationSession', error, { endpoint: '/kitchen/reconciliation/sessions/:id', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const patchReconciliationSessionLineManagerReviewService = async (sessionId, lineId, body, companyId, userId = null) => {
  const sid = encodeURIComponent(String(sessionId));
  const lid = encodeURIComponent(String(lineId));
  try {
    const response = await apiClient.patch(
      `${K}/kitchen/reconciliation/sessions/${sid}/lines/${lid}/manager-review`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('patchReconciliationSessionLineManagerReview', {
      endpoint: '/kitchen/reconciliation/sessions/:id/lines/:lineId/manager-review',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('patchReconciliationSessionLineManagerReview', error, {
      endpoint: '/kitchen/reconciliation/sessions/:id/lines/:lineId/manager-review',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

// Purchase: receipts
export const createPurchaseInvoiceUploadUrlService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchases/invoice-upload-url`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('createPurchaseInvoiceUploadUrl', {
      endpoint: `${K}/purchase/purchases/invoice-upload-url`,
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('createPurchaseInvoiceUploadUrl', error, {
      endpoint: `${K}/purchase/purchases/invoice-upload-url`,
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const uploadPurchaseReceiptInvoiceService = async (receiptId, file, companyId, userId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname || 'invoice',
      contentType: file.mimetype || 'application/octet-stream',
      knownLength: file.size
    });
    const contextConfig = withKitchenContext(companyId, userId, {
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });
    const response = await apiClient.post(
      `${K}/purchase/purchases/receipts/${receiptId}/invoice/upload`,
      formData,
      contextConfig
    );
    logKitchenSuccess('uploadPurchaseReceiptInvoice', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/invoice/upload',
      companyId: companyId || null,
      receiptId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('uploadPurchaseReceiptInvoice', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/invoice/upload',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

export const createPurchaseReceiptService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/purchase/purchases/receipts`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('createPurchaseReceipt', { endpoint: `/purchase/purchases/receipts`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('createPurchaseReceipt', error, { endpoint: `/purchase/purchases/receipts`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const addPurchaseReceiptLineService = async (receiptId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/purchase/purchases/receipts/${receiptId}/lines`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('addPurchaseReceiptLine', { endpoint: '/purchase/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('addPurchaseReceiptLine', error, { endpoint: '/purchase/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    throw mapAxiosError(error);
  }
};

export const uploadPurchaseReceiptLineImageService = async (receiptId, lineId, file, companyId, userId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname || 'line-image',
      contentType: file.mimetype || 'application/octet-stream',
      knownLength: file.size
    });
    const contextConfig = withKitchenContext(companyId, userId, {
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });
    const response = await apiClient.post(
      `${K}/purchase/purchases/receipts/${encodeURIComponent(receiptId)}/lines/${encodeURIComponent(lineId)}/image/upload`,
      formData,
      contextConfig
    );
    logKitchenSuccess('uploadPurchaseReceiptLineImage', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/lines/:line_id/image/upload',
      companyId: companyId || null,
      receiptId,
      lineId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('uploadPurchaseReceiptLineImage', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/lines/:line_id/image/upload',
      companyId: companyId || null,
      receiptId,
      lineId
    });
    throw mapAxiosError(error);
  }
};

export const listPurchaseReceiptsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/purchases/receipts`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPurchaseReceipts', { endpoint: `/purchase/purchases/receipts`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listPurchaseReceipts', error, { endpoint: `/purchase/purchases/receipts`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listPurchaseReceiptLinesService = async (receiptId, query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/purchases/receipts/${receiptId}/lines`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPurchaseReceiptLines', { endpoint: '/purchase/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listPurchaseReceiptLines', error, { endpoint: '/purchase/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    throw mapAxiosError(error);
  }
};

export const getPurchaseReceiptInvoiceUrlService = async (receiptId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchases/receipts/${receiptId}/invoice/url`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getPurchaseReceiptInvoiceUrl', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/invoice/url',
      companyId: companyId || null,
      receiptId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getPurchaseReceiptInvoiceUrl', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/invoice/url',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

export const uploadPurchaseReceiptItemsPhotoService = async (receiptId, file, companyId, userId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname || 'items-photo',
      contentType: file.mimetype || 'application/octet-stream',
      knownLength: file.size
    });
    const contextConfig = withKitchenContext(companyId, userId, {
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });
    const response = await apiClient.post(
      `${K}/purchase/purchases/receipts/${encodeURIComponent(receiptId)}/items-photo/upload`,
      formData,
      contextConfig
    );
    logKitchenSuccess('uploadPurchaseReceiptItemsPhoto', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/items-photo/upload',
      companyId: companyId || null,
      receiptId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('uploadPurchaseReceiptItemsPhoto', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/items-photo/upload',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

export const getPurchaseReceiptItemsPhotoUrlService = async (receiptId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchases/receipts/${encodeURIComponent(receiptId)}/items-photo/url`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getPurchaseReceiptItemsPhotoUrl', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/items-photo/url',
      companyId: companyId || null,
      receiptId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getPurchaseReceiptItemsPhotoUrl', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/items-photo/url',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

export const uploadPurchaseReceiptMaterialPhotosService = async (receiptId, files, companyId, userId = null) => {
  try {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file.buffer, {
        filename: file.originalname || 'photo',
        contentType: file.mimetype || 'application/octet-stream',
        knownLength: file.size
      });
    }
    const contextConfig = withKitchenContext(companyId, userId, {
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });
    const response = await apiClient.post(
      `${K}/purchase/purchases/receipts/${encodeURIComponent(receiptId)}/material-photos/upload`,
      formData,
      contextConfig
    );
    logKitchenSuccess('uploadPurchaseReceiptMaterialPhotos', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/material-photos/upload',
      companyId: companyId || null,
      receiptId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('uploadPurchaseReceiptMaterialPhotos', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/material-photos/upload',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

export const listReceiptMaterialPhotosService = async (receiptId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchases/receipts/${encodeURIComponent(receiptId)}/material-photos`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('listReceiptMaterialPhotos', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/material-photos',
      companyId: companyId || null,
      receiptId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listReceiptMaterialPhotos', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/material-photos',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

export const getMaterialPhotoViewUrlService = async (receiptId, photoId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchases/receipts/${encodeURIComponent(receiptId)}/material-photos/${encodeURIComponent(photoId)}/url`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getMaterialPhotoViewUrl', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/material-photos/:photo_id/url',
      companyId: companyId || null,
      receiptId,
      photoId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getMaterialPhotoViewUrl', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/material-photos/:photo_id/url',
      companyId: companyId || null,
      receiptId,
      photoId
    });
    throw mapAxiosError(error);
  }
};

export const deleteReceiptMaterialPhotoService = async (receiptId, photoId, companyId, userId = null) => {
  try {
    const response = await apiClient.delete(
      `${K}/purchase/purchases/receipts/${encodeURIComponent(receiptId)}/material-photos/${encodeURIComponent(photoId)}`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('deleteReceiptMaterialPhoto', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/material-photos/:photo_id',
      companyId: companyId || null,
      receiptId,
      photoId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('deleteReceiptMaterialPhoto', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/material-photos/:photo_id',
      companyId: companyId || null,
      receiptId,
      photoId
    });
    throw mapAxiosError(error);
  }
};

const inferInvoiceContentTypeFromUrl = (urlString) => {
  try {
    const path = new URL(urlString).pathname.toLowerCase();
    if (path.endsWith('.pdf')) return 'application/pdf';
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  } catch (_) {
    /* ignore */
  }
  return null;
};

/** Fetch invoice from S3 with Content-Type header required by presigned URL signature. */
export const streamPurchaseReceiptInvoiceService = async (receiptId, companyId, userId = null) => {
  const payload = await getPurchaseReceiptInvoiceUrlService(receiptId, companyId, userId);
  const nested = payload?.data && typeof payload.data === 'object' ? payload.data : null;
  const url =
    (typeof payload?.url === 'string' && payload.url) ||
    (nested && typeof nested.url === 'string' && nested.url) ||
    null;
  if (!url) {
    throw new AppError('No invoice view URL available for this receipt.', 404);
  }
  const signedContentType =
    payload?.content_type ||
    payload?.contentType ||
    nested?.content_type ||
    nested?.contentType ||
    inferInvoiceContentTypeFromUrl(url);
  if (!signedContentType) {
    throw new AppError('Could not determine invoice content type for storage request.', 422);
  }

  const s3Res = await axios.get(url, {
    headers: { 'Content-Type': signedContentType },
    responseType: 'stream',
    timeout: 120000,
    validateStatus: () => true
  });

  if (s3Res.status !== 200) {
    logKitchenError(
      'streamPurchaseReceiptInvoiceS3',
      new Error(`S3 invoice fetch status ${s3Res.status}`),
      { receiptId, companyId: companyId || null, signedContentType }
    );
    throw new AppError('Could not load invoice file from storage.', 502);
  }

  const contentType = s3Res.headers['content-type'] || signedContentType;
  return { stream: s3Res.data, contentType };
};

// Purchase: requests
export const createPurchaseRequestService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/purchase/purchase-requests`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('createPurchaseRequest', { endpoint: `/purchase/purchase-requests`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('createPurchaseRequest', error, { endpoint: `/purchase/purchase-requests`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const addPurchaseRequestLineService = async (requestId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchase-requests/${requestId}/lines`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('addPurchaseRequestLine', {
      endpoint: '/purchase/purchase-requests/:request_id/lines',
      companyId: companyId || null,
      requestId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('addPurchaseRequestLine', error, {
      endpoint: '/purchase/purchase-requests/:request_id/lines',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const submitPurchaseRequestService = async (requestId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchase-requests/${requestId}/submit`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('submitPurchaseRequest', {
      endpoint: '/purchase/purchase-requests/:request_id/submit',
      companyId: companyId || null,
      requestId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('submitPurchaseRequest', error, {
      endpoint: '/purchase/purchase-requests/:request_id/submit',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const listPurchaseRequestsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/purchase-requests`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPurchaseRequests', { endpoint: `/purchase/purchase-requests`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listPurchaseRequests', error, { endpoint: `/purchase/purchase-requests`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getPurchaseRequestService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/purchase-requests/${requestId}`, withKitchenContext(companyId, userId));
    logKitchenSuccess('getPurchaseRequest', {
      endpoint: '/purchase/purchase-requests/:request_id',
      companyId: companyId || null,
      requestId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getPurchaseRequest', error, {
      endpoint: '/purchase/purchase-requests/:request_id',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const resolvePurchaseRequestLineItemService = async (requestId, lineId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchase-requests/${requestId}/lines/${lineId}/resolve-item`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('resolvePurchaseRequestLineItem', {
      endpoint: '/purchase/purchase-requests/:request_id/lines/:line_id/resolve-item',
      companyId: companyId || null,
      requestId,
      lineId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('resolvePurchaseRequestLineItem', error, {
      endpoint: '/purchase/purchase-requests/:request_id/lines/:line_id/resolve-item',
      companyId: companyId || null,
      requestId,
      lineId
    });
    throw mapAxiosError(error);
  }
};

export const updatePurchaseRequestLineManagerService = async (requestId, lineId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchase-requests/${requestId}/lines/${lineId}/manager-update`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('updatePurchaseRequestLineManager', {
      endpoint: '/purchase/purchase-requests/:request_id/lines/:line_id/manager-update',
      companyId: companyId || null,
      requestId,
      lineId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('updatePurchaseRequestLineManager', error, {
      endpoint: '/purchase/purchase-requests/:request_id/lines/:line_id/manager-update',
      companyId: companyId || null,
      requestId,
      lineId
    });
    throw mapAxiosError(error);
  }
};

export const approvePurchaseRequestService = async (requestId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchase-requests/${requestId}/approve`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('approvePurchaseRequest', {
      endpoint: '/purchase/purchase-requests/:request_id/approve',
      companyId: companyId || null,
      requestId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('approvePurchaseRequest', error, {
      endpoint: '/purchase/purchase-requests/:request_id/approve',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const rejectPurchaseRequestService = async (requestId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchase-requests/${requestId}/reject`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('rejectPurchaseRequest', {
      endpoint: '/purchase/purchase-requests/:request_id/reject',
      companyId: companyId || null,
      requestId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('rejectPurchaseRequest', error, {
      endpoint: '/purchase/purchase-requests/:request_id/reject',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const listApprovedPurchaseRequestLinesService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchase-requests/${requestId}/approved-lines`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('listApprovedPurchaseRequestLines', {
      endpoint: '/purchase/purchase-requests/:request_id/approved-lines',
      companyId: companyId || null,
      requestId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listApprovedPurchaseRequestLines', error, {
      endpoint: '/purchase/purchase-requests/:request_id/approved-lines',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const downloadApprovedPurchaseRequestLinesTxtService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchase-requests/${requestId}/approved-lines.txt`,
      withKitchenContext(companyId, userId, { responseType: 'arraybuffer' })
    );
    logKitchenSuccess('downloadApprovedPurchaseRequestLinesTxt', {
      endpoint: '/purchase/purchase-requests/:request_id/approved-lines.txt',
      companyId: companyId || null,
      requestId
    });
    return {
      data: response.data,
      headers: {
        contentType: response.headers['content-type'],
        contentDisposition: response.headers['content-disposition']
      }
    };
  } catch (error) {
    logKitchenError('downloadApprovedPurchaseRequestLinesTxt', error, {
      endpoint: '/purchase/purchase-requests/:request_id/approved-lines.txt',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const downloadApprovedPurchaseRequestLinesPdfService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchase-requests/${requestId}/approved-lines.pdf`,
      withKitchenContext(companyId, userId, { responseType: 'arraybuffer' })
    );
    logKitchenSuccess('downloadApprovedPurchaseRequestLinesPdf', {
      endpoint: '/purchase/purchase-requests/:request_id/approved-lines.pdf',
      companyId: companyId || null,
      requestId
    });
    return {
      data: response.data,
      headers: {
        contentType: response.headers['content-type'],
        contentDisposition: response.headers['content-disposition']
      }
    };
  } catch (error) {
    logKitchenError('downloadApprovedPurchaseRequestLinesPdf', error, {
      endpoint: '/purchase/purchase-requests/:request_id/approved-lines.pdf',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const getPurchaseRequestComparisonService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchase-requests/${requestId}/purchase-comparison`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getPurchaseRequestComparison', {
      endpoint: '/purchase/purchase-requests/:request_id/purchase-comparison',
      companyId: companyId || null,
      requestId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getPurchaseRequestComparison', error, {
      endpoint: '/purchase/purchase-requests/:request_id/purchase-comparison',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const listOffListPurchaseReviewService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchases/off-list-review`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('listOffListPurchaseReview', {
      endpoint: `${K}/purchase/purchases/off-list-review`,
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listOffListPurchaseReview', error, {
      endpoint: `${K}/purchase/purchases/off-list-review`,
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const reviewPurchaseReceiptLineService = async (receiptId, lineId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchases/receipts/${receiptId}/lines/${lineId}/manager-review`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('reviewPurchaseReceiptLine', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/lines/:line_id/manager-review',
      companyId: companyId || null,
      receiptId,
      lineId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('reviewPurchaseReceiptLine', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/lines/:line_id/manager-review',
      companyId: companyId || null,
      receiptId,
      lineId
    });
    throw mapAxiosError(error);
  }
};

export const reviewPurchaseReceiptLinesBulkService = async (receiptId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `${K}/purchase/purchases/receipts/${receiptId}/lines/manager-review-bulk`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('reviewPurchaseReceiptLinesBulk', {
      endpoint: '/purchase/purchases/receipts/:receipt_id/lines/manager-review-bulk',
      companyId: companyId || null,
      receiptId
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('reviewPurchaseReceiptLinesBulk', error, {
      endpoint: '/purchase/purchases/receipts/:receipt_id/lines/manager-review-bulk',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

// Inventory: forecasts + Purchase: recommendations
export const listPurchaseRecommendationsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/purchases/recommendations`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPurchaseRecommendations', { endpoint: `/purchase/purchases/recommendations`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listPurchaseRecommendations', error, { endpoint: `/purchase/purchases/recommendations`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listInventoryForecastsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/forecasts/inventory`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listInventoryForecasts', { endpoint: `/inventory/forecasts/inventory`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listInventoryForecasts', error, { endpoint: `/inventory/forecasts/inventory`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listFinancialForecastsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/forecasts/financial`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listFinancialForecasts', { endpoint: `/inventory/forecasts/financial`, companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listFinancialForecasts', error, { endpoint: `/inventory/forecasts/financial`, companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getMealReportService = async (query = {}, companyId, userId = null) => {
  try {
    const upstreamParams = {
      ...query,
      company_id: query?.company_id || companyId || undefined,
      include_zero_locations:
        query?.include_zero_locations != null ? query.include_zero_locations : 'false',
      include_customer_names:
        query?.include_customer_names != null ? query.include_customer_names : 'true'
    };

    // Some deployments expose this endpoint as /api/meal-report, others as /meal-report.
    // Try the API-prefixed path first to match current API documentation.
    let response;
    try {
      response = await apiClientAI.get('/api/meal-report', withKitchenContext(companyId, userId, { params: upstreamParams }));
    } catch (firstError) {
      if (firstError?.response?.status === 404) {
        response = await apiClientAI.get('/meal-report', withKitchenContext(companyId, userId, { params: upstreamParams }));
      } else {
        throw firstError;
      }
    }

    const payload = response.data?.data || response.data || {};
    logKitchenSuccess('getMealReport', {
      endpoint: '/api/meal-report',
      companyId: companyId || null,
      date: upstreamParams?.date || null,
      requestCompanyId: upstreamParams?.company_id || null,
      includeZeroLocations: upstreamParams?.include_zero_locations ?? null,
      includeCustomerNames: upstreamParams?.include_customer_names ?? null
    });
    return payload;
  } catch (error) {
    logKitchenError('getMealReport', error, {
      endpoint: '/api/meal-report',
      companyId: companyId || null,
      date: query?.date || null,
      requestCompanyId: query?.company_id || companyId || null,
      includeZeroLocations: query?.include_zero_locations ?? 'false',
      includeCustomerNames: query?.include_customer_names ?? 'true'
    });
    throw mapAxiosError(error);
  }
};

// ── Tasks 3–6: inventory + purchase (upstream /api/max_kitchen/v1/...) ─────────────────

export const listWeeklyPurchaseRequestsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/weekly/purchase-requests`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listWeeklyPurchaseRequests', { endpoint: '/purchase/weekly/purchase-requests', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listWeeklyPurchaseRequests', error, { endpoint: '/purchase/weekly/purchase-requests', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getWeeklyPurchaseApprovalQueueService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/weekly/approval-queue`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getWeeklyPurchaseApprovalQueue', { endpoint: '/purchase/weekly/approval-queue', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getWeeklyPurchaseApprovalQueue', error, { endpoint: '/purchase/weekly/approval-queue', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getWeeklyPurchaseDashboardService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/weekly/dashboard`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getWeeklyPurchaseDashboard', { endpoint: '/purchase/weekly/dashboard', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getWeeklyPurchaseDashboard', error, { endpoint: '/purchase/weekly/dashboard', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listDailyPurchaseRequestsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/daily/purchase-requests`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listDailyPurchaseRequests', { endpoint: '/purchase/daily/purchase-requests', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('listDailyPurchaseRequests', error, { endpoint: '/purchase/daily/purchase-requests', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getDailyPurchaseApprovalQueueService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/daily/approval-queue`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getDailyPurchaseApprovalQueue', { endpoint: '/purchase/daily/approval-queue', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getDailyPurchaseApprovalQueue', error, { endpoint: '/purchase/daily/approval-queue', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getDailyShortageDetectionService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/daily/shortage-detection`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getDailyShortageDetection', { endpoint: '/purchase/daily/shortage-detection', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getDailyShortageDetection', error, { endpoint: '/purchase/daily/shortage-detection', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getDailyStockReceiptTodayService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/daily/stock-receipt-today`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getDailyStockReceiptToday', { endpoint: '/purchase/daily/stock-receipt-today', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getDailyStockReceiptToday', error, { endpoint: '/purchase/daily/stock-receipt-today', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const quickApproveDailySubmittedService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/purchase/daily/quick-approve-submitted`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('quickApproveDailySubmitted', { endpoint: '/purchase/daily/quick-approve-submitted', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('quickApproveDailySubmitted', error, { endpoint: '/purchase/daily/quick-approve-submitted', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const autoPurchaseFromCountVarianceService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/purchase/purchase-requests/auto-from-count-variance`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('autoPurchaseFromCountVariance', {
      endpoint: '/purchase/purchase-requests/auto-from-count-variance',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('autoPurchaseFromCountVariance', error, {
      endpoint: '/purchase/purchase-requests/auto-from-count-variance',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const postDailyMarkKitchenUsableService = async (itemId, body, companyId, userId = null) => {
  const id = String(itemId || '').trim();
  try {
    const response = await apiClient.post(
      `${K}/purchase/daily/mark-kitchen-usable/${encodeURIComponent(id)}`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('postDailyMarkKitchenUsable', {
      endpoint: '/purchase/daily/mark-kitchen-usable/:item_id',
      companyId: companyId || null,
      itemId: id
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('postDailyMarkKitchenUsable', error, {
      endpoint: '/purchase/daily/mark-kitchen-usable/:item_id',
      companyId: companyId || null,
      itemId: id
    });
    throw mapAxiosError(error);
  }
};

export const getDailyFreshnessAlertsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/daily/freshness-alerts`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getDailyFreshnessAlerts', { endpoint: '/purchase/daily/freshness-alerts', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getDailyFreshnessAlerts', error, { endpoint: '/purchase/daily/freshness-alerts', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getDailyPrepReadinessService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/daily/prep-readiness`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getDailyPrepReadiness', { endpoint: '/purchase/daily/prep-readiness', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getDailyPrepReadiness', error, { endpoint: '/purchase/daily/prep-readiness', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getDailyPurchaseDashboardService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/purchase/daily/dashboard`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getDailyPurchaseDashboard', { endpoint: '/purchase/daily/dashboard', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getDailyPurchaseDashboard', error, { endpoint: '/purchase/daily/dashboard', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getFefoSuggestionService = async (itemId, query = {}, companyId, userId = null) => {
  const id = String(itemId || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/inventory/fefo-suggestion/${encodeURIComponent(id)}`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('getFefoSuggestion', { endpoint: '/inventory/fefo-suggestion/:item_id', companyId: companyId || null, itemId: id });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getFefoSuggestion', error, { endpoint: '/inventory/fefo-suggestion/:item_id', companyId: companyId || null, itemId: id });
    throw mapAxiosError(error);
  }
};

export const postFefoConsumeService = async (itemId, query = {}, companyId, userId = null) => {
  const id = String(itemId || '').trim();
  try {
    const response = await apiClient.post(
      `${K}/inventory/fefo-consume/${encodeURIComponent(id)}`,
      {},
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('postFefoConsume', { endpoint: '/inventory/fefo-consume/:item_id', companyId: companyId || null, itemId: id });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('postFefoConsume', error, { endpoint: '/inventory/fefo-consume/:item_id', companyId: companyId || null, itemId: id });
    throw mapAxiosError(error);
  }
};

export const getNearExpiryInventoryService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/expiry/near-expiry`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getNearExpiryInventory', { endpoint: '/inventory/expiry/near-expiry', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getNearExpiryInventory', error, { endpoint: '/inventory/expiry/near-expiry', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const postBlockExpiredInventoryService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`${K}/inventory/expiry/block-expired`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('postBlockExpiredInventory', { endpoint: '/inventory/expiry/block-expired', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('postBlockExpiredInventory', error, { endpoint: '/inventory/expiry/block-expired', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getStockBatchesForItemService = async (itemId, query = {}, companyId, userId = null) => {
  const id = String(itemId || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/inventory/stock-batches/${encodeURIComponent(id)}`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('getStockBatchesForItem', { endpoint: '/inventory/stock-batches/:item_id', companyId: companyId || null, itemId: id });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getStockBatchesForItem', error, { endpoint: '/inventory/stock-batches/:item_id', companyId: companyId || null, itemId: id });
    throw mapAxiosError(error);
  }
};

export const getExpiryDashboardService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`${K}/inventory/expiry/dashboard`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getExpiryDashboard', { endpoint: '/inventory/expiry/dashboard', companyId: companyId || null });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getExpiryDashboard', error, { endpoint: '/inventory/expiry/dashboard', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getReceiptInvoiceTraceabilityService = async (receiptId, companyId, userId = null) => {
  const id = String(receiptId || '').trim();
  try {
    const response = await apiClient.get(
      `${K}/purchase/purchases/receipts/${encodeURIComponent(id)}/invoice-traceability`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getReceiptInvoiceTraceability', {
      endpoint: '/purchase/purchases/receipts/:id/invoice-traceability',
      companyId: companyId || null,
      receiptId: id
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getReceiptInvoiceTraceability', error, {
      endpoint: '/purchase/purchases/receipts/:id/invoice-traceability',
      companyId: companyId || null,
      receiptId: id
    });
    throw mapAxiosError(error);
  }
};

/** @product max_kitchen — Purchase reports & governance (guide §6.6); proxies upstream `/purchase/reports/*`. */
export const getPurchaseTypeSummaryReportService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/reports/purchase-type-summary`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('getPurchaseTypeSummaryReport', {
      endpoint: '/purchase/reports/purchase-type-summary',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getPurchaseTypeSummaryReport', error, {
      endpoint: '/purchase/reports/purchase-type-summary',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const getWeeklyGovernanceReportService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/reports/weekly-governance`,
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('getWeeklyGovernanceReport', {
      endpoint: '/purchase/reports/weekly-governance',
      companyId: companyId || null
    });
    return parseKitchenJsonResponse(response);
  } catch (error) {
    logKitchenError('getWeeklyGovernanceReport', error, {
      endpoint: '/purchase/reports/weekly-governance',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const getWeeklyGovernancePdfReportService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/reports/weekly-governance.pdf`,
      withKitchenContext(companyId, userId, { params: query, responseType: 'arraybuffer' })
    );
    logKitchenSuccess('getWeeklyGovernancePdfReport', {
      endpoint: '/purchase/reports/weekly-governance.pdf',
      companyId: companyId || null
    });
    return {
      data: response.data,
      headers: {
        contentType: response.headers['content-type'],
        contentDisposition: response.headers['content-disposition']
      }
    };
  } catch (error) {
    logKitchenError('getWeeklyGovernancePdfReport', error, {
      endpoint: '/purchase/reports/weekly-governance.pdf',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const getWeeklyGovernanceCsvReportService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `${K}/purchase/reports/weekly-governance.csv`,
      withKitchenContext(companyId, userId, { params: query, responseType: 'arraybuffer' })
    );
    logKitchenSuccess('getWeeklyGovernanceCsvReport', {
      endpoint: '/purchase/reports/weekly-governance.csv',
      companyId: companyId || null
    });
    return {
      data: response.data,
      headers: {
        contentType: response.headers['content-type'],
        contentDisposition: response.headers['content-disposition']
      }
    };
  } catch (error) {
    logKitchenError('getWeeklyGovernanceCsvReport', error, {
      endpoint: '/purchase/reports/weekly-governance.csv',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

