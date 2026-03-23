import axios from 'axios';
import AppError from '../utils/AppError.js';
import { logError, LOG_CATEGORIES, logInfo } from '../utils/criticalLogger.js';

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

export const healthCheckService = async (companyId = null) => {
  try {
    const response = await apiClient.get('/v1/health', withCompanyId(companyId));
    return response.data || { ok: true };
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Kitchen Store health check failed', { error: error.message });
    throw mapAxiosError(error);
  }
};

// v1 Items
export const createItemService = async (body, companyId) => {
  try {
    const response = await apiClient.post('/v1/items', body, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const listItemsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v1/items', withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const getItemService = async (itemId, companyId) => {
  try {
    const response = await apiClient.get(`/v1/items/${itemId}`, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

// v1 Stock movements
export const listItemMovementsService = async (itemId, query = {}, companyId) => {
  try {
    const response = await apiClient.get(`/v1/items/${itemId}/movements`, withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const createItemMovementService = async (itemId, body, companyId) => {
  try {
    const response = await apiClient.post(`/v1/items/${itemId}/movements`, body, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

// v1 alerts + shopping list
export const getLowStockAlertsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v1/alerts/low-stock', withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const getShoppingListService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v1/shopping-list', withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

// v2 recipe lines
export const upsertRecipeLineService = async (body, companyId) => {
  try {
    const response = await apiClient.post('/v2/recipes/lines', body, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const listRecipeLinesService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/recipes/lines', withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

// v2 plans
export const generatePlanService = async (body, companyId) => {
  try {
    const response = await apiClient.post('/v2/plans/generate', body, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const getPlanService = async (planId, companyId) => {
  try {
    const response = await apiClient.get(`/v2/plans/${planId}`, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const approvePlanService = async (planId, body, companyId) => {
  try {
    const response = await apiClient.post(`/v2/plans/${planId}/approve`, body || {}, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    // Approval endpoint may not exist in some versions; bubble a clear error
    throw mapAxiosError(error);
  }
};

export const issuePlanService = async (planId, body, companyId) => {
  try {
    const response = await apiClient.post(`/v2/plans/${planId}/issue`, body || {}, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

// v2 purchases / receipts
export const createPurchaseReceiptService = async (body, companyId) => {
  try {
    const response = await apiClient.post('/v2/purchases/receipts', body || {}, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const addPurchaseReceiptLineService = async (receiptId, body, companyId) => {
  try {
    const response = await apiClient.post(`/v2/purchases/receipts/${receiptId}/lines`, body || {}, withCompanyId(companyId));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const listPurchaseReceiptsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/purchases/receipts', withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const listPurchaseReceiptLinesService = async (receiptId, query = {}, companyId) => {
  try {
    const response = await apiClient.get(`/v2/purchases/receipts/${receiptId}/lines`, withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

// v2 forecasts + recommendations
export const listPurchaseRecommendationsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/purchases/recommendations', withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const listInventoryForecastsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/forecasts/inventory', withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

export const listFinancialForecastsService = async (query = {}, companyId) => {
  try {
    const response = await apiClient.get('/v2/forecasts/financial', withCompanyId(companyId, { params: query }));
    return response.data;
  } catch (error) {
    throw mapAxiosError(error);
  }
};

