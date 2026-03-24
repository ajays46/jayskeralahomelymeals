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
  listPurchaseRecommendationsService,
  listInventoryForecastsService,
  listFinancialForecastsService,
  getMealReportService
} from '../services/kitchenStore.service.js';
import AppError from '../utils/AppError.js';

export const healthCheck = async (req, res, next) => {
  try {
    const result = await healthCheckService(req.companyId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req, res, next) => {
  try {
    const result = await createItemService(req.body, req.companyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listItems = async (req, res, next) => {
  try {
    const result = await listItemsService(req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getItem = async (req, res, next) => {
  try {
    const result = await getItemService(req.params.item_id, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listItemMovements = async (req, res, next) => {
  try {
    const result = await listItemMovementsService(req.params.item_id, req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createItemMovement = async (req, res, next) => {
  try {
    const result = await createItemMovementService(req.params.item_id, req.body, req.companyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getLowStockAlerts = async (req, res, next) => {
  try {
    const result = await getLowStockAlertsService(req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getShoppingList = async (req, res, next) => {
  try {
    const result = await getShoppingListService(req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const upsertRecipeLine = async (req, res, next) => {
  try {
    const result = await upsertRecipeLineService(req.body, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listRecipeLines = async (req, res, next) => {
  try {
    const result = await listRecipeLinesService(req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const generatePlan = async (req, res, next) => {
  try {
    const result = await generatePlanService(req.body, req.companyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPlan = async (req, res, next) => {
  try {
    const result = await getPlanService(req.params.plan_id, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const approvePlan = async (req, res, next) => {
  try {
    const result = await approvePlanService(req.params.plan_id, req.body, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const issuePlan = async (req, res, next) => {
  try {
    const result = await issuePlanService(req.params.plan_id, req.body, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseReceipt = async (req, res, next) => {
  try {
    const result = await createPurchaseReceiptService(req.body, req.companyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const addPurchaseReceiptLine = async (req, res, next) => {
  try {
    const result = await addPurchaseReceiptLineService(req.params.receipt_id, req.body, req.companyId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseReceipts = async (req, res, next) => {
  try {
    const result = await listPurchaseReceiptsService(req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseReceiptLines = async (req, res, next) => {
  try {
    const result = await listPurchaseReceiptLinesService(req.params.receipt_id, req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseRecommendations = async (req, res, next) => {
  try {
    const result = await listPurchaseRecommendationsService(req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listInventoryForecasts = async (req, res, next) => {
  try {
    const result = await listInventoryForecastsService(req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const listFinancialForecasts = async (req, res, next) => {
  try {
    const result = await listFinancialForecastsService(req.query, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getMealReport = async (req, res, next) => {
  try {
    const { date } = req.query || {};
    const isValidDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
    if (!isValidDate) {
      throw new AppError('Invalid or missing date query. Expected format: YYYY-MM-DD', 400);
    }

    const result = await getMealReportService({ date }, req.companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

