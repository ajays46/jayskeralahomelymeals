/** @product max_kitchen · @feature store — inventory, brands, recipes, purchase requests, meal reports, forecasting */
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../../middleware/authHandler.js';
import { checkRole } from '../../../../middleware/checkRole.js';
import { resolveCompanyId } from '../../../../middleware/resolveCompanyId.js';

import {
  healthCheck,
  createItem,
  updateItem,
  listBrands,
  createBrand,
  uploadBrandLogo,
  getBrandLogoViewUrl,
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
  updateRecipeLine,
  deleteRecipeLine,
  generatePlan,
  listPlans,
  getPlan,
  getPlanDemandVsStoreStock,
  patchKitchenPlanLine,
  approvePlan,
  issuePlan,
  submitPlan,
  rejectPlan,
  getNextDayReadiness,
  postPhysicalVsSystem,
  createReconciliationSession,
  listReconciliationSessions,
  getReconciliationSession,
  patchReconciliationSession,
  putReconciliationSessionLines,
  finalizeReconciliationSession,
  patchReconciliationSessionLineManagerReview,
  createPurchaseInvoiceUploadUrl,
  uploadPurchaseReceiptInvoice,
  createPurchaseReceipt,
  addPurchaseReceiptLine,
  uploadPurchaseReceiptLineImage,
  listPurchaseReceipts,
  listPurchaseReceiptLines,
  getPurchaseReceiptInvoiceUrl,
  uploadPurchaseReceiptItemsPhoto,
  getPurchaseReceiptItemsPhotoUrl,
  uploadPurchaseReceiptMaterialPhotos,
  listReceiptMaterialPhotos,
  getMaterialPhotoViewUrl,
  deleteReceiptMaterialPhoto,
  streamPurchaseReceiptInvoice,
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
  downloadApprovedPurchaseRequestLinesPdf,
  getPurchaseRequestComparison,
  listOffListPurchaseReview,
  reviewPurchaseReceiptLine,
  reviewPurchaseReceiptLinesBulk,
  listPurchaseRecommendations,
  listInventoryForecasts,
  listFinancialForecasts,
  getMealReport,
  listCatalogMenus,
  getWeeklyScheduleByKind,
  getWeeklySlotByKind,
  putWeeklySlotByKind,
  listMenuCombosByKind,
  getWeeklySchedule,
  getWeeklySlot,
  putWeeklySlot,
  listMenuCombos
} from '../../controllers/kitchenStore.controller.js';

const router = express.Router();

const itemImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const materialPhotosUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 25 }
});

// Auth + tenant scope for all kitchen store calls
router.use(authenticateToken);
router.use(resolveCompanyId);

// Health check (proxy)
router.get('/v1/health', healthCheck);

// v1: Items
router.post('/v1/items', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), createItem);
router.put('/v1/items/:item_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), updateItem);
router.get('/v1/items', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listItems);
router.get('/v1/brands', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listBrands);
router.post('/v1/brands', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), createBrand);
router.post(
  '/v1/brands/:brand_id/logo/upload',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  itemImageUpload.single('file'),
  uploadBrandLogo
);
router.get('/v1/brands/:brand_id/logo/view-url', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getBrandLogoViewUrl);
router.get('/v1/items/:item_id/images', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listItemImages);
router.post(
  '/v1/items/:item_id/images',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
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
router.get('/v1/catalog/menus', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listCatalogMenus);

// v2: Recipes
router.post('/v2/recipes/lines', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), upsertRecipeLine);
router.get('/v2/recipes/lines', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listRecipeLines);
router.put('/v2/recipes/lines/:line_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), updateRecipeLine);
router.delete('/v2/recipes/lines/:line_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), deleteRecipeLine);

// v2: Menus — by-kind (no menu UUID; register before :menu_id)
router.get(
  '/v2/menus/by-kind/:menu_kind/weekly-schedule',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  getWeeklyScheduleByKind
);
router.get(
  '/v2/menus/by-kind/:menu_kind/weekly-slot',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  getWeeklySlotByKind
);
router.put(
  '/v2/menus/by-kind/:menu_kind/weekly-slot',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  putWeeklySlotByKind
);
router.get(
  '/v2/menus/by-kind/:menu_kind/menu-items',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  listMenuCombosByKind
);

// v2: Menus — raw menu_id (optional; same roles)
router.get('/v2/menus/:menu_id/weekly-schedule', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getWeeklySchedule);
router.get('/v2/menus/:menu_id/weekly-slot', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getWeeklySlot);
router.put('/v2/menus/:menu_id/weekly-slot', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), putWeeklySlot);
router.get('/v2/menus/:menu_id/menu-items', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listMenuCombos);

// v2: Plans (generate, detail, approve, issue)
router.post('/v2/plans/generate', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), generatePlan);
router.get('/v2/plans', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listPlans);
router.get(
  '/v2/plans/:plan_id/demand-vs-store-stock',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  getPlanDemandVsStoreStock
);
router.patch('/v2/plans/:plan_id/lines/:line_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), patchKitchenPlanLine);
router.post('/v2/plans/:plan_id/submit', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), submitPlan);
router.post('/v2/plans/:plan_id/reject', checkRole('STORE_MANAGER'), rejectPlan);
router.get('/v2/plans/:plan_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getPlan);
router.post('/v2/plans/:plan_id/approve', checkRole('STORE_MANAGER'), approvePlan);
router.post('/v2/plans/:plan_id/issue', checkRole('STORE_OPERATOR'), issuePlan);

// v2: Reconciliation (proxy to upstream kitchen inventory service)
router.get('/v2/reconciliation/next-day-readiness', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getNextDayReadiness);
router.post('/v2/reconciliation/physical-vs-system', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), postPhysicalVsSystem);
router.get('/v2/reconciliation/sessions', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listReconciliationSessions);
router.post('/v2/reconciliation/sessions', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), createReconciliationSession);
router.get('/v2/reconciliation/sessions/:session_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), getReconciliationSession);
router.patch('/v2/reconciliation/sessions/:session_id', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), patchReconciliationSession);
router.put('/v2/reconciliation/sessions/:session_id/lines', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), putReconciliationSessionLines);
router.post('/v2/reconciliation/sessions/:session_id/finalize', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), finalizeReconciliationSession);
router.patch(
  '/v2/reconciliation/sessions/:session_id/lines/:line_id/manager-review',
  checkRole('STORE_MANAGER'),
  patchReconciliationSessionLineManagerReview
);

// v2: Purchase receipts
router.post('/v2/purchases/invoice-upload-url', checkRole('STORE_OPERATOR'), createPurchaseInvoiceUploadUrl);
router.post(
  '/v2/purchases/receipts/:receipt_id/invoice/upload',
  checkRole('STORE_OPERATOR'),
  itemImageUpload.single('file'),
  uploadPurchaseReceiptInvoice
);
router.post(
  '/v2/purchases/receipts/:receipt_id/items-photo/upload',
  checkRole('STORE_OPERATOR'),
  itemImageUpload.single('file'),
  uploadPurchaseReceiptItemsPhoto
);
router.post(
  '/v2/purchases/receipts/:receipt_id/material-photos/upload',
  checkRole('STORE_OPERATOR'),
  materialPhotosUpload.array('files', 25),
  uploadPurchaseReceiptMaterialPhotos
);
router.post('/v2/purchases/receipts', checkRole('STORE_OPERATOR'), createPurchaseReceipt);
router.post('/v2/purchases/receipts/:receipt_id/lines', checkRole('STORE_OPERATOR'), addPurchaseReceiptLine);
router.post(
  '/v2/purchases/receipts/:receipt_id/lines/:line_id/image/upload',
  checkRole('STORE_OPERATOR'),
  itemImageUpload.single('file'),
  uploadPurchaseReceiptLineImage
);
router.get('/v2/purchases/receipts', checkRole('STORE_MANAGER', 'STORE_OPERATOR'), listPurchaseReceipts);
router.get(
  '/v2/purchases/receipts/:receipt_id/invoice/url',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  getPurchaseReceiptInvoiceUrl
);
router.get(
  '/v2/purchases/receipts/:receipt_id/invoice/view',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  streamPurchaseReceiptInvoice
);
router.get(
  '/v2/purchases/receipts/:receipt_id/items-photo/url',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  getPurchaseReceiptItemsPhotoUrl
);
router.get(
  '/v2/purchases/receipts/:receipt_id/material-photos',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  listReceiptMaterialPhotos
);
router.get(
  '/v2/purchases/receipts/:receipt_id/material-photos/:photo_id/url',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  getMaterialPhotoViewUrl
);
router.delete(
  '/v2/purchases/receipts/:receipt_id/material-photos/:photo_id',
  checkRole('STORE_OPERATOR'),
  deleteReceiptMaterialPhoto
);
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
  '/v2/purchase-requests/:request_id/approved-lines.pdf',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  downloadApprovedPurchaseRequestLinesPdf
);
router.get(
  '/v2/purchase-requests/:request_id/purchase-comparison',
  checkRole('STORE_MANAGER', 'STORE_OPERATOR'),
  getPurchaseRequestComparison
);
router.get('/v2/purchases/off-list-review', checkRole('STORE_MANAGER'), listOffListPurchaseReview);
router.post(
  '/v2/purchases/receipts/:receipt_id/lines/manager-review-bulk',
  checkRole('STORE_MANAGER'),
  reviewPurchaseReceiptLinesBulk
);
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

