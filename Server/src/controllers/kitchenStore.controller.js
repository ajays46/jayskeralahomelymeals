import {
  healthCheckService,
  createItemService,
  listItemsService,
  getItemService,
  listItemMovementsService,
  createItemMovementService,
  getLowStockAlertsService,
  getShoppingListService,
  upsertRecipeLineService,
  listRecipeLinesService,
  generatePlanService,
  getPlanService,
  approvePlanService,
  issuePlanService,
  createPurchaseReceiptService,
  addPurchaseReceiptLineService,
  listPurchaseReceiptsService,
  listPurchaseReceiptLinesService,
  createPurchaseRequestService,
  addPurchaseRequestLineService,
  submitPurchaseRequestService,
  listPurchaseRequestsService,
  getPurchaseRequestService,
  resolvePurchaseRequestLineItemService,
  updatePurchaseRequestLineManagerService,
  approvePurchaseRequestService,
  rejectPurchaseRequestService,
  listApprovedPurchaseRequestLinesService,
  downloadApprovedPurchaseRequestLinesTxtService,
  getPurchaseRequestComparisonService,
  listOffListPurchaseReviewService,
  reviewPurchaseReceiptLineService,
  listPurchaseRecommendationsService,
  listInventoryForecastsService,
  listFinancialForecastsService,
  getMealReportService
} from '../services/kitchenStore.service.js';
import {
  listInventoryItemImagesService,
  createInventoryItemImageService
} from '../services/inventoryItemImage.service.js';
import AppError from '../utils/AppError.js';
import {
  enrichPurchaseRequestListPayload,
  enrichSinglePurchaseRequestPayload
} from '../utils/purchaseRequestEnrichment.js';

const requireIdParam = (value, name) => {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${name} is required`, 400);
  }
  return value.trim();
};

const requirePositiveNumber = (value, name) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new AppError(`${name} must be a positive number`, 400);
  }
  return numeric;
};

/** users.id forwarded to kitchen inventory upstream (ACCESS_TOKEN mode). */
const kitchenActorUserId = (req) =>
  req.user?.userId ??
  req.user?.id ??
  req.user?.user_id ??
  req.user?.sub ??
  req.headers?.['x-user-id'] ??
  null;

export const healthCheck = async (req, res, next) => {
  try {
    const result = await healthCheckService(req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req, res, next) => {
  try {
    const result = await createItemService(req.body, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listItems = async (req, res, next) => {
  try {
    const result = await listItemsService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getItem = async (req, res, next) => {
  try {
    const result = await getItemService(req.params.item_id, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listItemImages = async (req, res, next) => {
  try {
    const data = await listInventoryItemImagesService(req.params.item_id, req.companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const uploadItemImage = async (req, res, next) => {
  try {
    const files = req.files;
    const file =
      (Array.isArray(files?.image) && files.image[0]) ||
      (Array.isArray(files?.file) && files.file[0]) ||
      req.file;
    if (!file) {
      throw new AppError('Image file is required (multipart field: image or file)', 400);
    }
    const rawPrimary = req.body?.is_primary ?? req.body?.isPrimary;
    const isPrimary =
      rawPrimary === true ||
      rawPrimary === 'true' ||
      rawPrimary === '1' ||
      rawPrimary === 1;
    let sortOrderParsed = null;
    if (req.body?.sort_order != null && req.body.sort_order !== '') {
      const n = Number(req.body.sort_order);
      if (!Number.isFinite(n)) {
        throw new AppError('sort_order must be a number', 400);
      }
      sortOrderParsed = Math.trunc(n);
    }
    const uploadedBy = kitchenActorUserId(req);
    const data = await createInventoryItemImageService({
      inventoryItemId: req.params.item_id,
      companyId: req.companyId,
      file,
      uploadedBy,
      isPrimary,
      sortOrder: sortOrderParsed
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listItemMovements = async (req, res, next) => {
  try {
    const result = await listItemMovementsService(req.params.item_id, req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createItemMovement = async (req, res, next) => {
  try {
    const result = await createItemMovementService(req.params.item_id, req.body, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getLowStockAlerts = async (req, res, next) => {
  try {
    const result = await getLowStockAlertsService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getShoppingList = async (req, res, next) => {
  try {
    const result = await getShoppingListService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const upsertRecipeLine = async (req, res, next) => {
  try {
    const result = await upsertRecipeLineService(req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listRecipeLines = async (req, res, next) => {
  try {
    const result = await listRecipeLinesService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const generatePlan = async (req, res, next) => {
  try {
    const result = await generatePlanService(req.body, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPlan = async (req, res, next) => {
  try {
    const result = await getPlanService(req.params.plan_id, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const approvePlan = async (req, res, next) => {
  try {
    const result = await approvePlanService(req.params.plan_id, req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const issuePlan = async (req, res, next) => {
  try {
    const result = await issuePlanService(req.params.plan_id, req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseReceipt = async (req, res, next) => {
  try {
    const result = await createPurchaseReceiptService(req.body, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const addPurchaseReceiptLine = async (req, res, next) => {
  try {
    const result = await addPurchaseReceiptLineService(req.params.receipt_id, req.body, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseReceipts = async (req, res, next) => {
  try {
    const result = await listPurchaseReceiptsService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseReceiptLines = async (req, res, next) => {
  try {
    const result = await listPurchaseReceiptLinesService(req.params.receipt_id, req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseRequest = async (req, res, next) => {
  try {
    console.log('createPurchaseRequest', req.body);
    const requestedNote = req.body?.requested_note;
    if (requestedNote != null && typeof requestedNote !== 'string') {
      throw new AppError('requested_note must be a string', 400);
    }
    const result = await createPurchaseRequestService(req.body, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const addPurchaseRequestLine = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    const body = req.body || {};
    if (!body.requested_item_name || typeof body.requested_item_name !== 'string') {
      throw new AppError('requested_item_name is required', 400);
    }
    if (!body.requested_unit || typeof body.requested_unit !== 'string') {
      throw new AppError('requested_unit is required', 400);
    }
    requirePositiveNumber(body.requested_quantity, 'requested_quantity');
    if (typeof body.is_new_item !== 'boolean') {
      throw new AppError('is_new_item must be a boolean', 400);
    }
    if (!body.is_new_item && (!body.inventory_item_id || typeof body.inventory_item_id !== 'string')) {
      throw new AppError('inventory_item_id is required for existing inventory lines', 400);
    }
    const result = await addPurchaseRequestLineService(requestId, body, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const submitPurchaseRequest = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    const result = await submitPurchaseRequestService(requestId, req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseRequests = async (req, res, next) => {
  try {
    const result = await listPurchaseRequestsService(req.query, req.companyId, kitchenActorUserId(req));
    const enriched = await enrichPurchaseRequestListPayload(result, req.companyId);
    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseRequest = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    const result = await getPurchaseRequestService(requestId, req.companyId, kitchenActorUserId(req));
    const enriched = await enrichSinglePurchaseRequestPayload(result, req.companyId);
    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

export const resolvePurchaseRequestLineItem = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    const lineId = requireIdParam(req.params.line_id, 'line_id');
    if (!req.body?.inventory_item_id || typeof req.body.inventory_item_id !== 'string') {
      throw new AppError('inventory_item_id is required', 400);
    }
    if (req.body?.manager_note != null && typeof req.body.manager_note !== 'string') {
      throw new AppError('manager_note must be a string', 400);
    }
    const result = await resolvePurchaseRequestLineItemService(requestId, lineId, req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseRequestLineManager = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    const lineId = requireIdParam(req.params.line_id, 'line_id');
    if (req.body?.approved_quantity != null) {
      requirePositiveNumber(req.body.approved_quantity, 'approved_quantity');
    }
    if (req.body?.manager_note != null && typeof req.body.manager_note !== 'string') {
      throw new AppError('manager_note must be a string', 400);
    }
    const result = await updatePurchaseRequestLineManagerService(requestId, lineId, req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const approvePurchaseRequest = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    if (req.body?.approval_note != null && typeof req.body.approval_note !== 'string') {
      throw new AppError('approval_note must be a string', 400);
    }
    if (req.body?.reject_line_ids != null && !Array.isArray(req.body.reject_line_ids)) {
      throw new AppError('reject_line_ids must be an array', 400);
    }
    if (
      req.body?.line_manager_notes != null &&
      (typeof req.body.line_manager_notes !== 'object' ||
        Array.isArray(req.body.line_manager_notes))
    ) {
      throw new AppError('line_manager_notes must be an object', 400);
    }
    const result = await approvePurchaseRequestService(requestId, req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const rejectPurchaseRequest = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    if (req.body?.approval_note != null && typeof req.body.approval_note !== 'string') {
      throw new AppError('approval_note must be a string', 400);
    }
    const result = await rejectPurchaseRequestService(requestId, req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listApprovedPurchaseRequestLines = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    const result = await listApprovedPurchaseRequestLinesService(requestId, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const downloadApprovedPurchaseRequestLinesTxt = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    const result = await downloadApprovedPurchaseRequestLinesTxtService(requestId, req.companyId, kitchenActorUserId(req));
    console.log('result', result);
    if (result?.headers?.contentType) {
      res.setHeader('Content-Type', result.headers.contentType);
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    if (result?.headers?.contentDisposition) {
      res.setHeader('Content-Disposition', result.headers.contentDisposition);
    }
    res.status(200).send(result.data);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseRequestComparison = async (req, res, next) => {
  try {
    const requestId = requireIdParam(req.params.request_id, 'request_id');
    const result = await getPurchaseRequestComparisonService(requestId, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listOffListPurchaseReview = async (req, res, next) => {
  try {
    const result = await listOffListPurchaseReviewService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const reviewPurchaseReceiptLine = async (req, res, next) => {
  try {
    const receiptId = requireIdParam(req.params.receipt_id, 'receipt_id');
    const lineId = requireIdParam(req.params.line_id, 'line_id');
    if (!req.body?.manager_action || typeof req.body.manager_action !== 'string') {
      throw new AppError('manager_action is required', 400);
    }
    if (req.body?.manager_action_note != null && typeof req.body.manager_action_note !== 'string') {
      throw new AppError('manager_action_note must be a string', 400);
    }
    const result = await reviewPurchaseReceiptLineService(receiptId, lineId, req.body, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseRecommendations = async (req, res, next) => {
  try {
    const result = await listPurchaseRecommendationsService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listInventoryForecasts = async (req, res, next) => {
  try {
    const result = await listInventoryForecastsService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listFinancialForecasts = async (req, res, next) => {
  try {
    const result = await listFinancialForecastsService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getMealReport = async (req, res, next) => {
  try {
    const query = req.query || {};
    const { date } = query;
    const isValidDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
    if (!isValidDate) {
      throw new AppError('Invalid or missing date query. Expected format: YYYY-MM-DD', 400);
    }

    const result = await getMealReportService(query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};




