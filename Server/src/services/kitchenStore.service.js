import axios from 'axios';
import AppError from '../utils/AppError.js';
import { logError, LOG_CATEGORIES, logInfo } from '../utils/criticalLogger.js';

const AI_ROUTE_API = process.env.AI_ROUTE_API
const KITCHEN_STORE_BASE_URL = process.env.AI_ROUTE_API_FIFTH;
const EXTERNAL_API_AUTH_TOKEN = process.env.EXTERNAL_API_AUTH_TOKEN || 'mysecretkey123';

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
const withCompanyId = (companyId, config = {}) => {
  const headers = { ...(config.headers || {}) };
  if (companyId) headers['X-Company-ID'] = companyId;
  return { ...config, headers };
};

const mapAxiosError = (error) => {
  const status = error.response?.status || 500;
  const message =
    error.response?.data?.detail ||
    error.response?.data?.message ||
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

export const healthCheckService = async (companyId = null) => {
  try {
    const response = await apiClient.get('/v1/health', withCompanyId(companyId));
    logKitchenSuccess('healthCheck', { endpoint: '/v1/health', companyId: companyId || null });
    return response.data || { ok: true };
  } catch (error) {
    logKitchenError('healthCheck', error, { endpoint: '/v1/health', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

// v1 Items
export const createItemService = async (body, companyId) => {
  try {
    const response = await apiClient.post('/v1/items', body, withCompanyId(companyId));
    logKitchenSuccess('createItem', { endpoint: '/v1/items', companyId: companyId || null, itemName: body?.name || null });
    return response.data;
  } catch (error) {
    logKitchenError('createItem', error, { endpoint: '/v1/items', companyId: companyId || null, itemName: body?.name || null });
    throw mapAxiosError(error);
  }
};

export const listItemsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v1/items', withCompanyId(companyId, { params: query }));
    logKitchenSuccess('listItems', { endpoint: '/v1/items', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listItems', error, { endpoint: '/v1/items', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getItemService = async (itemId, companyId) => {
  try {
    const response = await apiClient.get(`/v1/items/${itemId}`, withCompanyId(companyId));
    logKitchenSuccess('getItem', { endpoint: '/v1/items/:item_id', companyId: companyId || null, itemId });
    return response.data;
  } catch (error) {
    logKitchenError('getItem', error, { endpoint: '/v1/items/:item_id', companyId: companyId || null, itemId });
    throw mapAxiosError(error);
  }
};

// v1 Stock movements
export const listItemMovementsService = async (itemId, query = {}, companyId) => {
  try {
    const response = await apiClient.get(`/v1/items/${itemId}/movements`, withCompanyId(companyId, { params: query }));
    logKitchenSuccess('listItemMovements', { endpoint: '/v1/items/:item_id/movements', companyId: companyId || null, itemId });
    return response.data;
  } catch (error) {
    logKitchenError('listItemMovements', error, { endpoint: '/v1/items/:item_id/movements', companyId: companyId || null, itemId });
    throw mapAxiosError(error);
  }
};

export const createItemMovementService = async (itemId, body, companyId) => {
  try {
    const response = await apiClient.post(`/v1/items/${itemId}/movements`, body, withCompanyId(companyId));
    logKitchenSuccess('createItemMovement', {
    endpoint: '/v1/items/:item_id/movements',
      companyId: companyId || null,
      itemId,
      movementType: body?.movement_type || null
    });
    return response.data;
  } catch (error) {
    logKitchenError('createItemMovement', error, {
      endpoint: '/v1/items/:item_id/movements',
      companyId: companyId || null,
      itemId,
      movementType: body?.movement_type || null
    });
    throw mapAxiosError(error);
  }
};

// v1 alerts + shopping list
export const getLowStockAlertsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v1/alerts/low-stock', withCompanyId(companyId, { params: query }));
    logKitchenSuccess('getLowStockAlerts', { endpoint: '/v1/alerts/low-stock', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('getLowStockAlerts', error, { endpoint: '/v1/alerts/low-stock', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getShoppingListService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v1/shopping-list', withCompanyId(companyId, { params: query }));
    logKitchenSuccess('getShoppingList', { endpoint: '/v1/shopping-list', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('getShoppingList', error, { endpoint: '/v1/shopping-list', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

// v2 recipe lines
export const upsertRecipeLineService = async (body, companyId) => {
  try {
    const response = await apiClient.post('/v2/recipes/lines', body, withCompanyId(companyId));
    logKitchenSuccess('upsertRecipeLine', {
      endpoint: '/v2/recipes/lines',
      companyId: companyId || null,
      menuItemId: body?.menu_item_id || null,
      inventoryItemId: body?.inventory_item_id || null
    });
    return response.data;
  } catch (error) {
    logKitchenError('upsertRecipeLine', error, {
      endpoint: '/v2/recipes/lines',
      companyId: companyId || null,
      menuItemId: body?.menu_item_id || null,
      inventoryItemId: body?.inventory_item_id || null
    });
    throw mapAxiosError(error);
  }
};

export const listRecipeLinesService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/recipes/lines', withCompanyId(companyId, { params: query }));
    logKitchenSuccess('listRecipeLines', { endpoint: '/v2/recipes/lines', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listRecipeLines', error, { endpoint: '/v2/recipes/lines', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

// v2 plans
export const generatePlanService = async (body, companyId) => {
  try {
    const response = await apiClient.post('/v2/plans/generate', body, withCompanyId(companyId));
    logKitchenSuccess('generatePlan', { endpoint: '/v2/plans/generate', companyId: companyId || null, planDate: body?.plan_date || null });
    return response.data;
  } catch (error) {
    logKitchenError('generatePlan', error, { endpoint: '/v2/plans/generate', companyId: companyId || null, planDate: body?.plan_date || null });
    throw mapAxiosError(error);
  }
};

export const getPlanService = async (planId, companyId) => {
  try {
    const response = await apiClient.get(`/v2/plans/${planId}`, withCompanyId(companyId));
    logKitchenSuccess('getPlan', { endpoint: '/v2/plans/:plan_id', companyId: companyId || null, planId });
    return response.data;
  } catch (error) {
    logKitchenError('getPlan', error, { endpoint: '/v2/plans/:plan_id', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

export const approvePlanService = async (planId, body, companyId) => {
  try {
    const response = await apiClient.post(`/v2/plans/${planId}/approve`, body || {}, withCompanyId(companyId));
    logKitchenSuccess('approvePlan', { endpoint: '/v2/plans/:plan_id/approve', companyId: companyId || null, planId });
    return response.data;
  } catch (error) {
    logKitchenError('approvePlan', error, { endpoint: '/v2/plans/:plan_id/approve', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

export const issuePlanService = async (planId, body, companyId) => {
  try {
    const response = await apiClient.post(`/v2/plans/${planId}/issue`, body || {}, withCompanyId(companyId));
    logKitchenSuccess('issuePlan', { endpoint: '/v2/plans/:plan_id/issue', companyId: companyId || null, planId });
    return response.data;
  } catch (error) {
    logKitchenError('issuePlan', error, { endpoint: '/v2/plans/:plan_id/issue', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

// v2 purchases / receipts
export const createPurchaseReceiptService = async (body, companyId) => {
  try {
    const response = await apiClient.post('/v2/purchases/receipts', body || {}, withCompanyId(companyId));
    logKitchenSuccess('createPurchaseReceipt', { endpoint: '/v2/purchases/receipts', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('createPurchaseReceipt', error, { endpoint: '/v2/purchases/receipts', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const addPurchaseReceiptLineService = async (receiptId, body, companyId) => {
  try {
    const response = await apiClient.post(`/v2/purchases/receipts/${receiptId}/lines`, body || {}, withCompanyId(companyId));
    logKitchenSuccess('addPurchaseReceiptLine', { endpoint: '/v2/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    return response.data;
  } catch (error) {
    logKitchenError('addPurchaseReceiptLine', error, { endpoint: '/v2/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    throw mapAxiosError(error);
  }
};

export const listPurchaseReceiptsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/purchases/receipts', withCompanyId(companyId, { params: query }));
    logKitchenSuccess('listPurchaseReceipts', { endpoint: '/v2/purchases/receipts', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listPurchaseReceipts', error, { endpoint: '/v2/purchases/receipts', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listPurchaseReceiptLinesService = async (receiptId, query = {}, companyId) => {
  try {
    const response = await apiClient.get(`/v2/purchases/receipts/${receiptId}/lines`, withCompanyId(companyId, { params: query }));
    logKitchenSuccess('listPurchaseReceiptLines', { endpoint: '/v2/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    return response.data;
  } catch (error) {
    logKitchenError('listPurchaseReceiptLines', error, { endpoint: '/v2/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    throw mapAxiosError(error);
  }
};

// v2 forecasts + recommendations
export const listPurchaseRecommendationsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/purchases/recommendations', withCompanyId(companyId, { params: query }));
    logKitchenSuccess('listPurchaseRecommendations', { endpoint: '/v2/purchases/recommendations', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listPurchaseRecommendations', error, { endpoint: '/v2/purchases/recommendations', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listInventoryForecastsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/forecasts/inventory', withCompanyId(companyId, { params: query }));
    logKitchenSuccess('listInventoryForecasts', { endpoint: '/v2/forecasts/inventory', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listInventoryForecasts', error, { endpoint: '/v2/forecasts/inventory', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listFinancialForecastsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/forecasts/financial', withCompanyId(companyId, { params: query }));
    logKitchenSuccess('listFinancialForecasts', { endpoint: '/v2/forecasts/financial', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listFinancialForecasts', error, { endpoint: '/v2/forecasts/financial', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getMealReportService = async (query = {}, companyId) => {
  try {
    // Some deployments expose this endpoint as /api/meal-report, others as /meal-report.
    // Try the API-prefixed path first to match current API documentation.
    let response;
    try {
      response = await apiClientAI.get('/api/meal-report', withCompanyId(companyId, { params: query }));
    } catch (firstError) {
      if (firstError?.response?.status === 404) {
        response = await apiClientAI.get('/meal-report', withCompanyId(companyId, { params: query }));
      } else {
        throw firstError;
      }
    }

    const payload = response.data?.data || response.data || {};
    logKitchenSuccess('getMealReport', { endpoint: '/api/meal-report', companyId: companyId || null, date: query?.date || null });
    return payload;
  } catch (error) {
    logKitchenError('getMealReport', error, { endpoint: '/api/meal-report', companyId: companyId || null, date: query?.date || null });
    throw mapAxiosError(error);
  }
};

