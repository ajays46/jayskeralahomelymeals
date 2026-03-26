import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId } from '../middleware/resolveCompanyId.js';

import {
  healthCheck,
  createItem,
  listItems,
  getItem,
  listItemImages,
  uploadItemImage,
  listItemMovements,
  createItemMovement,
  getLowStockAlerts,
  getShoppingList,
  upsertRecipeLine,
  listRecipeLines,
  generatePlan,
  getPlan,
  approvePlan,
  issuePlan,
  createPurchaseReceipt,
  addPurchaseReceiptLine,
  listPurchaseReceipts,
  listPurchaseReceiptLines,
  createPurchaseRequest,
  addPurchaseRequestLine,
  submitPurchaseRequest,
  listPurchaseRequests,
  getPurchaseRequest,
  resolvePurchaseRequestLineItem,
  updatePurchaseRequestLineManager,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  listApprovedPurchaseRequestLines,
  downloadApprovedPurchaseRequestLinesTxt,
  getPurchaseRequestComparison,
  listOffListPurchaseReview,
  reviewPurchaseReceiptLine,
  listPurchaseRecommendations,
  listInventoryForecasts,
  listFinancialForecasts,
  getMealReport
} from '../controllers/kitchenStore.controller.js';

const router = express.Router();

const itemImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Auth + tenant scope for all kitchen store calls
router.use(authenticateToken);
router.use(resolveCompanyId);

// Health check (proxy)
router.get('/v1/health', healthCheck);

// v1: Items
router.post('/v1/items', checkRole('STORE_MANAGER'), createItem);
router.get('/v1/items', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listItems);
router.get('/v1/items/:item_id/images', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listItemImages);
router.post(
  '/v1/items/:item_id/images',
  checkRole('STORE_MANAGER'),
  itemImageUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),
  uploadItemImage
);
router.get('/v1/items/:item_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getItem);

// v1: Stock movements
router.get('/v1/items/:item_id/movements', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listItemMovements);
router.post('/v1/items/:item_id/movements', checkRole('STORE_OPERATOR'), createItemMovement);

// v1: Low-stock + shopping list
router.get('/v1/alerts/low-stock', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getLowStockAlerts);
router.get('/v1/shopping-list', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getShoppingList);

// v2: Recipes
router.post('/v2/recipes/lines', checkRole('STORE_MANAGER'), upsertRecipeLine);
router.get('/v2/recipes/lines', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listRecipeLines);

// v2: Plans
router.post('/v2/plans/generate', checkRole('STORE_MANAGER'), generatePlan);
router.get('/v2/plans/:plan_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getPlan);
router.post('/v2/plans/:plan_id/approve', checkRole('STORE_MANAGER'), approvePlan);
router.post('/v2/plans/:plan_id/issue', checkRole('STORE_OPERATOR'), issuePlan);

// v2: Purchase receipts
router.post('/v2/purchases/receipts', checkRole('STORE_OPERATOR'), createPurchaseReceipt);
router.post('/v2/purchases/receipts/:receipt_id/lines', checkRole('STORE_OPERATOR'), addPurchaseReceiptLine);
router.get('/v2/purchases/receipts', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listPurchaseReceipts);
router.get('/v2/purchases/receipts/:receipt_id/lines', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listPurchaseReceiptLines);

// v2: Purchase requests
router.post('/v2/purchase-requests', checkRole('STORE_OPERATOR'), createPurchaseRequest);
router.post('/v2/purchase-requests/:request_id/lines', checkRole('STORE_OPERATOR'), addPurchaseRequestLine);
router.post('/v2/purchase-requests/:request_id/submit', checkRole('STORE_OPERATOR'), submitPurchaseRequest);
router.get('/v2/purchase-requests', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listPurchaseRequests);
router.get('/v2/purchase-requests/:request_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getPurchaseRequest);
router.post(
  '/v2/purchase-requests/:request_id/lines/:line_id/resolve-item',
  checkRole('STORE_MANAGER'),
  resolvePurchaseRequestLineItem
);
router.post(
  '/v2/purchase-requests/:request_id/lines/:line_id/manager-update',
  checkRole('STORE_MANAGER'),
  updatePurchaseRequestLineManager
);
router.post('/v2/purchase-requests/:request_id/approve', checkRole('STORE_MANAGER'), approvePurchaseRequest);
router.post('/v2/purchase-requests/:request_id/reject', checkRole('STORE_MANAGER'), rejectPurchaseRequest);
router.get(
  '/v2/purchase-requests/:request_id/approved-lines',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  listApprovedPurchaseRequestLines
);
router.get(
  '/v2/purchase-requests/:request_id/approved-lines.txt',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  downloadApprovedPurchaseRequestLinesTxt
);
router.get(
  '/v2/purchase-requests/:request_id/purchase-comparison',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  getPurchaseRequestComparison
);
router.get('/v2/purchases/off-list-review', checkRole('STORE_MANAGER'), listOffListPurchaseReview);
router.post(
  '/v2/purchases/receipts/:receipt_id/lines/:line_id/manager-review',
  checkRole('STORE_MANAGER'),
  reviewPurchaseReceiptLine
);

// v2: Forecasts + recommendations
router.get('/v2/purchases/recommendations', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listPurchaseRecommendations);
router.get('/v2/forecasts/inventory', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listInventoryForecasts);
router.get('/v2/forecasts/financial', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listFinancialForecasts);

// Meal report
router.get('/meal-report', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getMealReport);

export default router;

