/**
 * @feature kitchen-store — HTTP handlers for kitchen-store BFF (delegate to kitchenStore.service).
 */
import {
  healthCheckService,
  createItemService,
  listItemsService,
  getItemService,
  listBrandsService,
  createBrandService,
  uploadBrandLogoService,
  getBrandLogoViewUrlService,
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
  createPurchaseInvoiceUploadUrlService,
  uploadPurchaseReceiptInvoiceService,
  createPurchaseReceiptService,
  addPurchaseReceiptLineService,
  listPurchaseReceiptsService,
  listPurchaseReceiptLinesService,
  getPurchaseReceiptInvoiceUrlService,
  streamPurchaseReceiptInvoiceService,
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
  reviewPurchaseReceiptLinesBulkService,
  listPurchaseRecommendationsService,
  listInventoryForecastsService,
  listFinancialForecastsService,
  getMealReportService,
  getWeeklySlotService,
  putWeeklySlotService,
  listMenuCombosService,
  getWeeklyScheduleService,
  getWeeklyScheduleByKindService,
  getWeeklySlotByKindService,
  putWeeklySlotByKindService,
  listMenuCombosByKindService
} from '../services/kitchenStore.service.js';
import {
  listInventoryItemImagesService,
  createInventoryItemImageService
} from '../services/inventoryItemImage.service.js';
import AppError from '../utils/AppError.js';
import { logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';
import {
  enrichPurchaseRequestListPayload,
  enrichSinglePurchaseRequestPayload
} from '../utils/purchaseRequestEnrichment.js';
import { listKitchenCatalogMenus } from '../services/kitchenCatalog.service.js';

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

const requireNonEmptyString = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${name} is required`, 400);
  }
  return value.trim();
};

const optionalTrimmedString = (value, name) => {
  if (value == null) return undefined;
  if (typeof value !== 'string') {
    throw new AppError(`${name} must be a string`, 400);
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
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
    const body = req.body || {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      throw new AppError('Request body must be an object', 400);
    }

    const payload = {
      ...body,
      name: requireNonEmptyString(body.name, 'name'),
      unit: requireNonEmptyString(body.unit, 'unit')
    };

    const brandId = optionalTrimmedString(body.brand_id, 'brand_id');
    const brandName = optionalTrimmedString(body.brand_name, 'brand_name');

    if (brandId !== undefined) payload.brand_id = brandId;
    else delete payload.brand_id;

    if (brandName !== undefined) payload.brand_name = brandName;
    else delete payload.brand_name;

    const result = await createItemService(payload, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listBrands = async (req, res, next) => {
  try {
    const result = await listBrandsService(req.query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      throw new AppError('Request body must be an object', 400);
    }
    const payload = { ...body, name: requireNonEmptyString(body.name, 'name') };
    const logoS3Key = optionalTrimmedString(body.logo_s3_key, 'logo_s3_key');
    const logoS3Url = optionalTrimmedString(body.logo_s3_url, 'logo_s3_url');
    if (logoS3Key !== undefined) payload.logo_s3_key = logoS3Key;
    if (logoS3Url !== undefined) payload.logo_s3_url = logoS3Url;
    const result = await createBrandService(payload, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const uploadBrandLogo = async (req, res, next) => {
  try {
    const brandId = requireIdParam(req.params.brand_id, 'brand_id');
    const file = req.file;
    if (!file) {
      throw new AppError('Logo file is required (multipart field: file)', 400);
    }
    const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedMime.has(file.mimetype)) {
      throw new AppError('Logo file must be JPG, PNG, or WEBP', 400);
    }
    const result = await uploadBrandLogoService(
      brandId,
      file,
      req.companyId,
      kitchenActorUserId(req)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getBrandLogoViewUrl = async (req, res, next) => {
  try {
    const brandId = requireIdParam(req.params.brand_id, 'brand_id');
    const result = await getBrandLogoViewUrlService(brandId, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
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

/** @feature kitchen-store — Company menus from DB (`menus` table) for recipe/schedule UI. */
export const listCatalogMenus = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId || typeof companyId !== 'string' || !companyId.trim()) {
      throw new AppError('Company context is required (X-Company-ID header or user company)', 400);
    }
    const rows = await listKitchenCatalogMenus(companyId);
    const items = rows.map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
      created_at: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
    }));
    res.status(200).json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
};

const MEAL_SLOTS = new Set(['BREAKFAST', 'LUNCH', 'DINNER']);

/** Path segment for upstream `/v2/menus/by-kind/{seg}/...` (veg | non_veg). */
const normalizeMenuKindSegment = (raw) => {
  const k = String(raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/-/g, '_');
  if (k === 'veg') return 'veg';
  if (k === 'non_veg' || k === 'nonveg') return 'non_veg';
  throw new AppError('menu_kind must be veg, non_veg, or non-veg', 400);
};

const buildOptionalWeeklyScheduleQuery = (req) => {
  const query = {};
  if (req.query.day_of_week != null && String(req.query.day_of_week).trim() !== '') {
    const dow = Number(req.query.day_of_week);
    if (!Number.isInteger(dow) || dow < 1 || dow > 7) {
      throw new AppError('day_of_week must be an integer from 1 (Monday) through 7 (Sunday)', 400);
    }
    query.day_of_week = dow;
  }
  if (req.query.meal_slot != null && String(req.query.meal_slot).trim() !== '') {
    const meal_slot = requireNonEmptyString(req.query.meal_slot, 'meal_slot').toUpperCase();
    if (!MEAL_SLOTS.has(meal_slot)) {
      throw new AppError('meal_slot must be BREAKFAST, LUNCH, or DINNER', 400);
    }
    query.meal_slot = meal_slot;
  }
  return query;
};

/** @feature kitchen-store — GET /v2/menus/by-kind/:menu_kind/weekly-schedule */
export const getWeeklyScheduleByKind = async (req, res, next) => {
  try {
    const segment = normalizeMenuKindSegment(req.params.menu_kind);
    const query = buildOptionalWeeklyScheduleQuery(req);
    const result = await getWeeklyScheduleByKindService(segment, query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** @feature kitchen-store — GET /v2/menus/:menu_id/weekly-schedule (optional; same optional filters as by-kind). */
export const getWeeklySchedule = async (req, res, next) => {
  try {
    const menuId = requireIdParam(req.params.menu_id, 'menu_id');
    const query = buildOptionalWeeklyScheduleQuery(req);
    const result = await getWeeklyScheduleService(menuId, query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** @feature kitchen-store — GET /v2/menus/by-kind/:menu_kind/weekly-slot */
export const getWeeklySlotByKind = async (req, res, next) => {
  try {
    const segment = normalizeMenuKindSegment(req.params.menu_kind);
    const meal_slot = requireNonEmptyString(req.query.meal_slot, 'meal_slot').toUpperCase();
    if (!MEAL_SLOTS.has(meal_slot)) {
      throw new AppError('meal_slot must be BREAKFAST, LUNCH, or DINNER', 400);
    }

    const dateRaw = req.query.date;
    const dowRaw = req.query.day_of_week;
    const hasDate = dateRaw != null && String(dateRaw).trim() !== '';
    const hasDow = dowRaw != null && String(dowRaw).trim() !== '';

    if (hasDate && hasDow) {
      throw new AppError('Provide either date or day_of_week, not both', 400);
    }
    if (!hasDate && !hasDow) {
      throw new AppError('Provide date or day_of_week', 400);
    }

    const query = { meal_slot };
    if (hasDate) {
      const date = String(dateRaw).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new AppError('date must be YYYY-MM-DD', 400);
      }
      query.date = date;
    } else {
      const dow = Number(dowRaw);
      if (!Number.isInteger(dow) || dow < 1 || dow > 7) {
        throw new AppError('day_of_week must be an integer from 1 (Monday) through 7 (Sunday)', 400);
      }
      query.day_of_week = dow;
    }

    const result = await getWeeklySlotByKindService(segment, query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** @feature kitchen-store — PUT /v2/menus/by-kind/:menu_kind/weekly-slot */
export const putWeeklySlotByKind = async (req, res, next) => {
  try {
    const segment = normalizeMenuKindSegment(req.params.menu_kind);
    const body = req.body || {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      throw new AppError('Request body must be an object', 400);
    }

    const meal_slot = requireNonEmptyString(body.meal_slot, 'meal_slot').toUpperCase();
    if (!MEAL_SLOTS.has(meal_slot)) {
      throw new AppError('meal_slot must be BREAKFAST, LUNCH, or DINNER', 400);
    }

    const dow = Number(body.day_of_week);
    if (!Number.isInteger(dow) || dow < 1 || dow > 7) {
      throw new AppError('day_of_week must be an integer from 1 (Monday) through 7 (Sunday)', 400);
    }

    const menu_item_id = requireIdParam(body.menu_item_id, 'menu_item_id');

    const result = await putWeeklySlotByKindService(
      segment,
      { day_of_week: dow, meal_slot, menu_item_id },
      req.companyId,
      kitchenActorUserId(req)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** @feature kitchen-store — GET /v2/menus/by-kind/:menu_kind/menu-items */
export const listMenuCombosByKind = async (req, res, next) => {
  try {
    const segment = normalizeMenuKindSegment(req.params.menu_kind);
    const query = {};
    const q = optionalTrimmedString(req.query.q, 'q');
    if (q !== undefined) query.q = q;
    if (req.query.limit != null && String(req.query.limit).trim() !== '') {
      const lim = Number(req.query.limit);
      if (!Number.isFinite(lim) || lim < 1 || lim > 500) {
        throw new AppError('limit must be between 1 and 500', 400);
      }
      query.limit = Math.floor(lim);
    }
    const result = await listMenuCombosByKindService(segment, query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** @feature kitchen-store — GET /v2/menus/:menu_id/weekly-slot (date XOR day_of_week + meal_slot). */
export const getWeeklySlot = async (req, res, next) => {
  try {
    const menuId = requireIdParam(req.params.menu_id, 'menu_id');
    const meal_slot = requireNonEmptyString(req.query.meal_slot, 'meal_slot').toUpperCase();
    if (!MEAL_SLOTS.has(meal_slot)) {
      throw new AppError('meal_slot must be BREAKFAST, LUNCH, or DINNER', 400);
    }

    const dateRaw = req.query.date;
    const dowRaw = req.query.day_of_week;
    const hasDate = dateRaw != null && String(dateRaw).trim() !== '';
    const hasDow = dowRaw != null && String(dowRaw).trim() !== '';

    if (hasDate && hasDow) {
      throw new AppError('Provide either date or day_of_week, not both', 400);
    }
    if (!hasDate && !hasDow) {
      throw new AppError('Provide date or day_of_week', 400);
    }

    const query = { meal_slot };
    if (hasDate) {
      const date = String(dateRaw).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new AppError('date must be YYYY-MM-DD', 400);
      }
      query.date = date;
    } else {
      const dow = Number(dowRaw);
      if (!Number.isInteger(dow) || dow < 1 || dow > 7) {
        throw new AppError('day_of_week must be an integer from 1 (Monday) through 7 (Sunday)', 400);
      }
      query.day_of_week = dow;
    }

    const result = await getWeeklySlotService(menuId, query, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** @feature kitchen-store — PUT /v2/menus/:menu_id/weekly-slot */
export const putWeeklySlot = async (req, res, next) => {
  try {
    const menuId = requireIdParam(req.params.menu_id, 'menu_id');
    const body = req.body || {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      throw new AppError('Request body must be an object', 400);
    }

    const meal_slot = requireNonEmptyString(body.meal_slot, 'meal_slot').toUpperCase();
    if (!MEAL_SLOTS.has(meal_slot)) {
      throw new AppError('meal_slot must be BREAKFAST, LUNCH, or DINNER', 400);
    }

    const dow = Number(body.day_of_week);
    if (!Number.isInteger(dow) || dow < 1 || dow > 7) {
      throw new AppError('day_of_week must be an integer from 1 (Monday) through 7 (Sunday)', 400);
    }

    const menu_item_id = requireIdParam(body.menu_item_id, 'menu_item_id');

    const result = await putWeeklySlotService(
      menuId,
      { day_of_week: dow, meal_slot, menu_item_id },
      req.companyId,
      kitchenActorUserId(req)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** @feature kitchen-store — GET /v2/menus/:menu_id/menu-items */
export const listMenuCombos = async (req, res, next) => {
  try {
    const menuId = requireIdParam(req.params.menu_id, 'menu_id');
    const query = {};
    const q = optionalTrimmedString(req.query.q, 'q');
    if (q !== undefined) query.q = q;
    if (req.query.limit != null && String(req.query.limit).trim() !== '') {
      const lim = Number(req.query.limit);
      if (!Number.isFinite(lim) || lim < 1 || lim > 500) {
        throw new AppError('limit must be between 1 and 500', 400);
      }
      query.limit = Math.floor(lim);
    }
    const result = await listMenuCombosService(menuId, query, req.companyId, kitchenActorUserId(req));
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
    const body = req.body || {};
    const purchaseRequestId = requireNonEmptyString(body.purchase_request_id, 'purchase_request_id');
    const payload = {
      ...body,
      purchase_request_id: purchaseRequestId
    };
    const referenceInvoice = optionalTrimmedString(body.reference_invoice, 'reference_invoice');
    const invoiceS3Key = optionalTrimmedString(body.invoice_s3_key, 'invoice_s3_key');
    const invoiceS3Url = optionalTrimmedString(body.invoice_s3_url, 'invoice_s3_url');
    if (referenceInvoice !== undefined) payload.reference_invoice = referenceInvoice;
    if (invoiceS3Key !== undefined) payload.invoice_s3_key = invoiceS3Key;
    if (invoiceS3Url !== undefined) payload.invoice_s3_url = invoiceS3Url;
    if (body.received_at != null && typeof body.received_at !== 'string') {
      throw new AppError('received_at must be a datetime string', 400);
    }
    const result = await createPurchaseReceiptService(payload, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseInvoiceUploadUrl = async (req, res, next) => {
  try {
    const body = req.body || {};
    const filename = requireNonEmptyString(body.filename, 'filename');
    const contentType = requireNonEmptyString(body.content_type, 'content_type');
    const purchaseRequestId = requireNonEmptyString(body.purchase_request_id, 'purchase_request_id');
    const allowedContentTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedContentTypes.includes(contentType)) {
      throw new AppError('content_type must be one of application/pdf, image/jpeg, image/png', 400);
    }
    const result = await createPurchaseInvoiceUploadUrlService(
      {
        filename,
        content_type: contentType,
        purchase_request_id: purchaseRequestId
      },
      req.companyId,
      kitchenActorUserId(req)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const uploadPurchaseReceiptInvoice = async (req, res, next) => {
  try {
    const receiptId = requireIdParam(req.params.receipt_id, 'receipt_id');
    const file = req.file;
    if (!file) {
      throw new AppError('Invoice file is required (multipart field: file)', 400);
    }
    const allowedMime = new Set(['application/pdf', 'image/jpeg', 'image/png']);
    if (!allowedMime.has(file.mimetype)) {
      throw new AppError('Invoice file must be PDF, JPG, or PNG', 400);
    }
    const result = await uploadPurchaseReceiptInvoiceService(
      receiptId,
      file,
      req.companyId,
      kitchenActorUserId(req)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const addPurchaseReceiptLine = async (req, res, next) => {
  try {
    const receiptId = requireIdParam(req.params.receipt_id, 'receipt_id');
    const body = req.body || {};

    if (body.purchase_request_line_id != null && typeof body.purchase_request_line_id !== 'string') {
      throw new AppError('purchase_request_line_id must be a string', 400);
    }
    if (body.inventory_item_id != null && typeof body.inventory_item_id !== 'string') {
      throw new AppError('inventory_item_id must be a string', 400);
    }
    requirePositiveNumber(body.purchased_qty, 'purchased_qty');
    requireNonEmptyString(body.purchase_unit, 'purchase_unit');
    requirePositiveNumber(body.conversion_to_base, 'conversion_to_base');
    requirePositiveNumber(body.line_total, 'line_total');
    requireNonEmptyString(body.purchase_date, 'purchase_date');
    if (body.note != null && typeof body.note !== 'string') {
      throw new AppError('note must be a string', 400);
    }
    if (body.off_list_purchase_reason != null && typeof body.off_list_purchase_reason !== 'string') {
      throw new AppError('off_list_purchase_reason must be a string', 400);
    }
    const isOffListByReason = typeof body.off_list_purchase_reason === 'string' && body.off_list_purchase_reason.trim() !== '';
    const hasRequestLine = typeof body.purchase_request_line_id === 'string' && body.purchase_request_line_id.trim() !== '';
    if (!hasRequestLine && !isOffListByReason) {
      throw new AppError('off_list_purchase_reason is required when purchase_request_line_id is not provided', 400);
    }

    const result = await addPurchaseReceiptLineService(receiptId, body, req.companyId, kitchenActorUserId(req));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseReceipts = async (req, res, next) => {
  try {
    const query = req.query || {};
    if (query.from_date != null && typeof query.from_date !== 'string') {
      throw new AppError('from_date must be a string', 400);
    }
    if (query.to_date != null && typeof query.to_date !== 'string') {
      throw new AppError('to_date must be a string', 400);
    }
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

export const getPurchaseReceiptInvoiceUrl = async (req, res, next) => {
  try {
    const receiptId = requireIdParam(req.params.receipt_id, 'receipt_id');
    const result = await getPurchaseReceiptInvoiceUrlService(receiptId, req.companyId, kitchenActorUserId(req));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const streamPurchaseReceiptInvoice = async (req, res, next) => {
  try {
    const receiptId = requireIdParam(req.params.receipt_id, 'receipt_id');
    const { stream, contentType } = await streamPurchaseReceiptInvoiceService(
      receiptId,
      req.companyId,
      kitchenActorUserId(req)
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline; filename="invoice"');
    res.setHeader('Cache-Control', 'private, max-age=0');
    stream.on('error', (err) => {
      logError(LOG_CATEGORIES.INVENTORY, 'Kitchen Store invoice stream error', { err: err?.message, receiptId });
      if (!res.headersSent) next(err);
      else res.destroy(err);
    });
    stream.pipe(res);
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
    const managerAction = req.body.manager_action.trim().toUpperCase();
    if (!['KEEP', 'REJECT', 'RETURN', 'INVESTIGATE'].includes(managerAction)) {
      throw new AppError('manager_action must be one of KEEP, REJECT, RETURN, INVESTIGATE', 400);
    }
    if (req.body?.manager_action_note != null && typeof req.body.manager_action_note !== 'string') {
      throw new AppError('manager_action_note must be a string', 400);
    }
    const result = await reviewPurchaseReceiptLineService(
      receiptId,
      lineId,
      { ...req.body, manager_action: managerAction },
      req.companyId,
      kitchenActorUserId(req)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const reviewPurchaseReceiptLinesBulk = async (req, res, next) => {
  try {
    const receiptId = requireIdParam(req.params.receipt_id, 'receipt_id');
    if (!req.body?.manager_action || typeof req.body.manager_action !== 'string') {
      throw new AppError('manager_action is required', 400);
    }
    const managerAction = req.body.manager_action.trim().toUpperCase();
    if (!['KEEP', 'REJECT', 'RETURN', 'INVESTIGATE'].includes(managerAction)) {
      throw new AppError('manager_action must be one of KEEP, REJECT, RETURN, INVESTIGATE', 400);
    }
    if (req.body?.manager_action_note != null && typeof req.body.manager_action_note !== 'string') {
      throw new AppError('manager_action_note must be a string', 400);
    }
    const rawLineIds = req.body?.line_ids;
    if (rawLineIds != null && !Array.isArray(rawLineIds)) {
      throw new AppError('line_ids must be an array when provided', 400);
    }
    if (Array.isArray(rawLineIds)) {
      for (const id of rawLineIds) {
        if (typeof id !== 'string' || !id.trim()) {
          throw new AppError('line_ids must contain non-empty strings', 400);
        }
      }
    }
    const payload = { manager_action: managerAction };
    if (typeof req.body.manager_action_note === 'string' && req.body.manager_action_note.trim() !== '') {
      payload.manager_action_note = req.body.manager_action_note.trim();
    }
    if (Array.isArray(rawLineIds) && rawLineIds.length > 0) {
      payload.line_ids = rawLineIds.map((id) => String(id).trim()).filter(Boolean);
    }
    const result = await reviewPurchaseReceiptLinesBulkService(
      receiptId,
      payload,
      req.companyId,
      kitchenActorUserId(req)
    );
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




