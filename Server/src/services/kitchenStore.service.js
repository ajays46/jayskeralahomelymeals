import axios from 'axios';
import FormData from 'form-data';
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
/** Tenant + acting user for kitchen inventory upstream (see FRONTEND_KITCHEN_STORE_GUIDE §2.1). */
const withKitchenContext = (companyId, userId, config = {}) => {
  const headers = { ...(config.headers || {}) };
  if (companyId) headers['X-Company-ID'] = companyId;
  const uid = userId != null && String(userId).trim() !== '' ? String(userId).trim() : null;
  if (uid) headers['X-User-ID'] = uid;
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

export const healthCheckService = async (companyId = null, userId = null) => {
  try {
    const response = await apiClient.get('/v1/health', withKitchenContext(companyId, userId));
    logKitchenSuccess('healthCheck', { endpoint: '/v1/health', companyId: companyId || null });
    return response.data || { ok: true };
  } catch (error) {
    logKitchenError('healthCheck', error, { endpoint: '/v1/health', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

// v1 Items
export const createItemService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post('/v1/items', body, withKitchenContext(companyId, userId));
    logKitchenSuccess('createItem', { endpoint: '/v1/items', companyId: companyId || null, itemName: body?.name || null });
    return response.data;
  } catch (error) {
    logKitchenError('createItem', error, { endpoint: '/v1/items', companyId: companyId || null, itemName: body?.name || null });
    throw mapAxiosError(error);
  }
};

export const listItemsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v1/items', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listItems', { endpoint: '/v1/items', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listItems', error, { endpoint: '/v1/items', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getItemService = async (itemId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`/v1/items/${itemId}`, withKitchenContext(companyId, userId));
    logKitchenSuccess('getItem', { endpoint: '/v1/items/:item_id', companyId: companyId || null, itemId });
    return response.data;
  } catch (error) {
    logKitchenError('getItem', error, { endpoint: '/v1/items/:item_id', companyId: companyId || null, itemId });
    throw mapAxiosError(error);
  }
};

// v1 Stock movements
export const listItemMovementsService = async (itemId, query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`/v1/items/${itemId}/movements`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listItemMovements', { endpoint: '/v1/items/:item_id/movements', companyId: companyId || null, itemId });
    return response.data;
  } catch (error) {
    logKitchenError('listItemMovements', error, { endpoint: '/v1/items/:item_id/movements', companyId: companyId || null, itemId });
    throw mapAxiosError(error);
  }
};

export const createItemMovementService = async (itemId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`/v1/items/${itemId}/movements`, body, withKitchenContext(companyId, userId));
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
export const getLowStockAlertsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v1/alerts/low-stock', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getLowStockAlerts', { endpoint: '/v1/alerts/low-stock', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('getLowStockAlerts', error, { endpoint: '/v1/alerts/low-stock', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getShoppingListService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v1/shopping-list', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('getShoppingList', { endpoint: '/v1/shopping-list', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('getShoppingList', error, { endpoint: '/v1/shopping-list', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

// v2 recipe lines
export const upsertRecipeLineService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post('/v2/recipes/lines', body, withKitchenContext(companyId, userId));
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

export const listRecipeLinesService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v2/recipes/lines', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listRecipeLines', { endpoint: '/v2/recipes/lines', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listRecipeLines', error, { endpoint: '/v2/recipes/lines', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

// v2 plans
export const generatePlanService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post('/v2/plans/generate', body, withKitchenContext(companyId, userId));
    logKitchenSuccess('generatePlan', { endpoint: '/v2/plans/generate', companyId: companyId || null, planDate: body?.plan_date || null });
    return response.data;
  } catch (error) {
    logKitchenError('generatePlan', error, { endpoint: '/v2/plans/generate', companyId: companyId || null, planDate: body?.plan_date || null });
    throw mapAxiosError(error);
  }
};

export const getPlanService = async (planId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`/v2/plans/${planId}`, withKitchenContext(companyId, userId));
    logKitchenSuccess('getPlan', { endpoint: '/v2/plans/:plan_id', companyId: companyId || null, planId });
    return response.data;
  } catch (error) {
    logKitchenError('getPlan', error, { endpoint: '/v2/plans/:plan_id', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

export const approvePlanService = async (planId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`/v2/plans/${planId}/approve`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('approvePlan', { endpoint: '/v2/plans/:plan_id/approve', companyId: companyId || null, planId });
    return response.data;
  } catch (error) {
    logKitchenError('approvePlan', error, { endpoint: '/v2/plans/:plan_id/approve', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

export const issuePlanService = async (planId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`/v2/plans/${planId}/issue`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('issuePlan', { endpoint: '/v2/plans/:plan_id/issue', companyId: companyId || null, planId });
    return response.data;
  } catch (error) {
    logKitchenError('issuePlan', error, { endpoint: '/v2/plans/:plan_id/issue', companyId: companyId || null, planId });
    throw mapAxiosError(error);
  }
};

// v2 purchases / receipts
export const createPurchaseInvoiceUploadUrlService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      '/v2/purchases/invoice-upload-url',
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('createPurchaseInvoiceUploadUrl', {
      endpoint: '/v2/purchases/invoice-upload-url',
      companyId: companyId || null
    });
    return response.data;
  } catch (error) {
    logKitchenError('createPurchaseInvoiceUploadUrl', error, {
      endpoint: '/v2/purchases/invoice-upload-url',
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
      `/v2/purchases/receipts/${receiptId}/invoice/upload`,
      formData,
      contextConfig
    );
    logKitchenSuccess('uploadPurchaseReceiptInvoice', {
      endpoint: '/v2/purchases/receipts/:receipt_id/invoice/upload',
      companyId: companyId || null,
      receiptId
    });
    return response.data;
  } catch (error) {
    logKitchenError('uploadPurchaseReceiptInvoice', error, {
      endpoint: '/v2/purchases/receipts/:receipt_id/invoice/upload',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

export const createPurchaseReceiptService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post('/v2/purchases/receipts', body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('createPurchaseReceipt', { endpoint: '/v2/purchases/receipts', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('createPurchaseReceipt', error, { endpoint: '/v2/purchases/receipts', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const addPurchaseReceiptLineService = async (receiptId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(`/v2/purchases/receipts/${receiptId}/lines`, body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('addPurchaseReceiptLine', { endpoint: '/v2/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    return response.data;
  } catch (error) {
    logKitchenError('addPurchaseReceiptLine', error, { endpoint: '/v2/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    throw mapAxiosError(error);
  }
};

export const listPurchaseReceiptsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v2/purchases/receipts', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPurchaseReceipts', { endpoint: '/v2/purchases/receipts', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listPurchaseReceipts', error, { endpoint: '/v2/purchases/receipts', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listPurchaseReceiptLinesService = async (receiptId, query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`/v2/purchases/receipts/${receiptId}/lines`, withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPurchaseReceiptLines', { endpoint: '/v2/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    return response.data;
  } catch (error) {
    logKitchenError('listPurchaseReceiptLines', error, { endpoint: '/v2/purchases/receipts/:receipt_id/lines', companyId: companyId || null, receiptId });
    throw mapAxiosError(error);
  }
};

export const getPurchaseReceiptInvoiceUrlService = async (receiptId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `/v2/purchases/receipts/${receiptId}/invoice/url`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getPurchaseReceiptInvoiceUrl', {
      endpoint: '/v2/purchases/receipts/:receipt_id/invoice/url',
      companyId: companyId || null,
      receiptId
    });
    return response.data;
  } catch (error) {
    logKitchenError('getPurchaseReceiptInvoiceUrl', error, {
      endpoint: '/v2/purchases/receipts/:receipt_id/invoice/url',
      companyId: companyId || null,
      receiptId
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

// v2 purchase requests
export const createPurchaseRequestService = async (body, companyId, userId = null) => {
  try {
    const response = await apiClient.post('/v2/purchase-requests', body || {}, withKitchenContext(companyId, userId));
    logKitchenSuccess('createPurchaseRequest', { endpoint: '/v2/purchase-requests', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('createPurchaseRequest', error, { endpoint: '/v2/purchase-requests', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const addPurchaseRequestLineService = async (requestId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `/v2/purchase-requests/${requestId}/lines`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('addPurchaseRequestLine', {
      endpoint: '/v2/purchase-requests/:request_id/lines',
      companyId: companyId || null,
      requestId
    });
    return response.data;
  } catch (error) {
    logKitchenError('addPurchaseRequestLine', error, {
      endpoint: '/v2/purchase-requests/:request_id/lines',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const submitPurchaseRequestService = async (requestId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `/v2/purchase-requests/${requestId}/submit`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('submitPurchaseRequest', {
      endpoint: '/v2/purchase-requests/:request_id/submit',
      companyId: companyId || null,
      requestId
    });
    return response.data;
  } catch (error) {
    logKitchenError('submitPurchaseRequest', error, {
      endpoint: '/v2/purchase-requests/:request_id/submit',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const listPurchaseRequestsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v2/purchase-requests', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPurchaseRequests', { endpoint: '/v2/purchase-requests', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listPurchaseRequests', error, { endpoint: '/v2/purchase-requests', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const getPurchaseRequestService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(`/v2/purchase-requests/${requestId}`, withKitchenContext(companyId, userId));
    logKitchenSuccess('getPurchaseRequest', {
      endpoint: '/v2/purchase-requests/:request_id',
      companyId: companyId || null,
      requestId
    });
    return response.data;
  } catch (error) {
    logKitchenError('getPurchaseRequest', error, {
      endpoint: '/v2/purchase-requests/:request_id',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const resolvePurchaseRequestLineItemService = async (requestId, lineId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `/v2/purchase-requests/${requestId}/lines/${lineId}/resolve-item`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('resolvePurchaseRequestLineItem', {
      endpoint: '/v2/purchase-requests/:request_id/lines/:line_id/resolve-item',
      companyId: companyId || null,
      requestId,
      lineId
    });
    return response.data;
  } catch (error) {
    logKitchenError('resolvePurchaseRequestLineItem', error, {
      endpoint: '/v2/purchase-requests/:request_id/lines/:line_id/resolve-item',
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
      `/v2/purchase-requests/${requestId}/lines/${lineId}/manager-update`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('updatePurchaseRequestLineManager', {
      endpoint: '/v2/purchase-requests/:request_id/lines/:line_id/manager-update',
      companyId: companyId || null,
      requestId,
      lineId
    });
    return response.data;
  } catch (error) {
    logKitchenError('updatePurchaseRequestLineManager', error, {
      endpoint: '/v2/purchase-requests/:request_id/lines/:line_id/manager-update',
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
      `/v2/purchase-requests/${requestId}/approve`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('approvePurchaseRequest', {
      endpoint: '/v2/purchase-requests/:request_id/approve',
      companyId: companyId || null,
      requestId
    });
    return response.data;
  } catch (error) {
    logKitchenError('approvePurchaseRequest', error, {
      endpoint: '/v2/purchase-requests/:request_id/approve',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const rejectPurchaseRequestService = async (requestId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `/v2/purchase-requests/${requestId}/reject`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('rejectPurchaseRequest', {
      endpoint: '/v2/purchase-requests/:request_id/reject',
      companyId: companyId || null,
      requestId
    });
    return response.data;
  } catch (error) {
    logKitchenError('rejectPurchaseRequest', error, {
      endpoint: '/v2/purchase-requests/:request_id/reject',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const listApprovedPurchaseRequestLinesService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `/v2/purchase-requests/${requestId}/approved-lines`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('listApprovedPurchaseRequestLines', {
      endpoint: '/v2/purchase-requests/:request_id/approved-lines',
      companyId: companyId || null,
      requestId
    });
    return response.data;
  } catch (error) {
    logKitchenError('listApprovedPurchaseRequestLines', error, {
      endpoint: '/v2/purchase-requests/:request_id/approved-lines',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const downloadApprovedPurchaseRequestLinesTxtService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `/v2/purchase-requests/${requestId}/approved-lines.pdf`,
      withKitchenContext(companyId, userId, { responseType: 'arraybuffer' })
    );
    logKitchenSuccess('downloadApprovedPurchaseRequestLinesTxt', {
      endpoint: '/v2/purchase-requests/:request_id/approved-lines.txt',
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
      endpoint: '/v2/purchase-requests/:request_id/approved-lines.txt',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const getPurchaseRequestComparisonService = async (requestId, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      `/v2/purchase-requests/${requestId}/purchase-comparison`,
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('getPurchaseRequestComparison', {
      endpoint: '/v2/purchase-requests/:request_id/purchase-comparison',
      companyId: companyId || null,
      requestId
    });
    return response.data;
  } catch (error) {
    logKitchenError('getPurchaseRequestComparison', error, {
      endpoint: '/v2/purchase-requests/:request_id/purchase-comparison',
      companyId: companyId || null,
      requestId
    });
    throw mapAxiosError(error);
  }
};

export const listOffListPurchaseReviewService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get(
      '/v2/purchases/off-list-review',
      withKitchenContext(companyId, userId, { params: query })
    );
    logKitchenSuccess('listOffListPurchaseReview', {
      endpoint: '/v2/purchases/off-list-review',
      companyId: companyId || null
    });
    return response.data;
  } catch (error) {
    logKitchenError('listOffListPurchaseReview', error, {
      endpoint: '/v2/purchases/off-list-review',
      companyId: companyId || null
    });
    throw mapAxiosError(error);
  }
};

export const reviewPurchaseReceiptLineService = async (receiptId, lineId, body, companyId, userId = null) => {
  try {
    const response = await apiClient.post(
      `/v2/purchases/receipts/${receiptId}/lines/${lineId}/manager-review`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('reviewPurchaseReceiptLine', {
      endpoint: '/v2/purchases/receipts/:receipt_id/lines/:line_id/manager-review',
      companyId: companyId || null,
      receiptId,
      lineId
    });
    return response.data;
  } catch (error) {
    logKitchenError('reviewPurchaseReceiptLine', error, {
      endpoint: '/v2/purchases/receipts/:receipt_id/lines/:line_id/manager-review',
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
      `/v2/purchases/receipts/${receiptId}/lines/manager-review-bulk`,
      body || {},
      withKitchenContext(companyId, userId)
    );
    logKitchenSuccess('reviewPurchaseReceiptLinesBulk', {
      endpoint: '/v2/purchases/receipts/:receipt_id/lines/manager-review-bulk',
      companyId: companyId || null,
      receiptId
    });
    return response.data;
  } catch (error) {
    logKitchenError('reviewPurchaseReceiptLinesBulk', error, {
      endpoint: '/v2/purchases/receipts/:receipt_id/lines/manager-review-bulk',
      companyId: companyId || null,
      receiptId
    });
    throw mapAxiosError(error);
  }
};

// v2 forecasts + recommendations
export const listPurchaseRecommendationsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v2/purchases/recommendations', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listPurchaseRecommendations', { endpoint: '/v2/purchases/recommendations', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listPurchaseRecommendations', error, { endpoint: '/v2/purchases/recommendations', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listInventoryForecastsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v2/forecasts/inventory', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listInventoryForecasts', { endpoint: '/v2/forecasts/inventory', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listInventoryForecasts', error, { endpoint: '/v2/forecasts/inventory', companyId: companyId || null });
    throw mapAxiosError(error);
  }
};

export const listFinancialForecastsService = async (query = {}, companyId, userId = null) => {
  try {
    const response = await apiClient.get('/v2/forecasts/financial', withKitchenContext(companyId, userId, { params: query }));
    logKitchenSuccess('listFinancialForecasts', { endpoint: '/v2/forecasts/financial', companyId: companyId || null });
    return response.data;
  } catch (error) {
    logKitchenError('listFinancialForecasts', error, { endpoint: '/v2/forecasts/financial', companyId: companyId || null });
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

