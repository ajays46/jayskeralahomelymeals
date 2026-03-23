import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId } from '../middleware/resolveCompanyId.js';

import {
  healthCheck,
  createItem,
  listItems,
  getItem,
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
  listPurchaseRecommendations,
  listInventoryForecasts,
  listFinancialForecasts
} from '../controllers/kitchenStore.controller.js';

const router = express.Router();

// Auth + tenant scope for all kitchen store calls
router.use(authenticateToken);
router.use(resolveCompanyId);

// Health check (proxy)
router.get('/v1/health', healthCheck);

// v1: Items
router.post('/v1/items', checkRole('STORE_MANAGER'), createItem);
router.get('/v1/items', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listItems);
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

// v2: Forecasts + recommendations
router.get('/v2/purchases/recommendations', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listPurchaseRecommendations);
router.get('/v2/forecasts/inventory', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listInventoryForecasts);
router.get('/v2/forecasts/financial', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listFinancialForecasts);

export default router;

