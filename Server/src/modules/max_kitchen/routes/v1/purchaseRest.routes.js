/** @product max_kitchen — REST purchase surface (Tasks 4–6); proxies upstream `/purchase/*`. */
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../../middleware/authHandler.js';
import { checkRole } from '../../../../middleware/checkRole.js';
import { resolveCompanyId } from '../../../../middleware/resolveCompanyId.js';
import {
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
  createPurchaseInvoiceUploadUrl,
  uploadPurchaseReceiptInvoice,
  createPurchaseReceipt,
  addPurchaseReceiptLine,
  uploadPurchaseReceiptLineImage,
  listPurchaseReceipts,
  listPurchaseReceiptLines,
  getPurchaseReceiptInvoiceUrl,
  streamPurchaseReceiptInvoice,
  listOffListPurchaseReview,
  reviewPurchaseReceiptLine,
  reviewPurchaseReceiptLinesBulk,
  listWeeklyPurchaseRequests,
  getWeeklyPurchaseApprovalQueue,
  getWeeklyPurchaseDashboard,
  listDailyPurchaseRequests,
  getDailyPurchaseApprovalQueue,
  getDailyShortageDetection,
  getDailyStockReceiptToday,
  quickApproveDailySubmitted,
  autoPurchaseFromCountVariance,
  postDailyMarkKitchenUsable,
  getDailyFreshnessAlerts,
  getDailyPrepReadiness,
  getDailyPurchaseDashboard,
  getReceiptInvoiceTraceability,
  listPurchaseRecommendations,
  getPurchaseTypeSummaryReport,
  getWeeklyGovernanceReport,
  downloadWeeklyGovernancePdf,
  downloadWeeklyGovernanceCsv
} from '../../controllers/kitchenStore.controller.js';

const router = express.Router();
const itemImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authenticateToken);
router.use(resolveCompanyId);

const smSo = checkRole('STORE_MANAGER', 'STORE_OPERATOR');
const smOnly = checkRole('STORE_MANAGER');

router.get('/reports/weekly-governance.pdf', smSo, downloadWeeklyGovernancePdf);
router.get('/reports/weekly-governance.csv', smSo, downloadWeeklyGovernanceCsv);
router.get('/reports/weekly-governance', smSo, getWeeklyGovernanceReport);
router.get('/reports/purchase-type-summary', smSo, getPurchaseTypeSummaryReport);

router.get('/weekly/purchase-requests', smSo, listWeeklyPurchaseRequests);
router.get('/weekly/approval-queue', smOnly, getWeeklyPurchaseApprovalQueue);
router.get('/weekly/dashboard', smSo, getWeeklyPurchaseDashboard);

router.get('/daily/purchase-requests', smSo, listDailyPurchaseRequests);
router.get('/daily/approval-queue', smOnly, getDailyPurchaseApprovalQueue);
router.get('/daily/shortage-detection', smSo, getDailyShortageDetection);
router.get('/daily/stock-receipt-today', smSo, getDailyStockReceiptToday);
router.post('/daily/quick-approve-submitted', smOnly, quickApproveDailySubmitted);
router.post('/daily/mark-kitchen-usable/:item_id', smSo, postDailyMarkKitchenUsable);
router.get('/daily/freshness-alerts', smSo, getDailyFreshnessAlerts);
router.get('/daily/prep-readiness', smSo, getDailyPrepReadiness);
router.get('/daily/dashboard', smSo, getDailyPurchaseDashboard);

router.get('/purchases/recommendations', smSo, listPurchaseRecommendations);

router.post('/purchase-requests', smSo, createPurchaseRequest);
router.post('/purchase-requests/auto-from-count-variance', smSo, autoPurchaseFromCountVariance);
router.post('/purchase-requests/:request_id/lines', smSo, addPurchaseRequestLine);
router.post('/purchase-requests/:request_id/submit', smSo, submitPurchaseRequest);
router.get('/purchase-requests', smSo, listPurchaseRequests);
router.get('/purchase-requests/:request_id', smSo, getPurchaseRequest);
router.post(
  '/purchase-requests/:request_id/lines/:line_id/resolve-item',
  smOnly,
  resolvePurchaseRequestLineItem
);
router.post(
  '/purchase-requests/:request_id/lines/:line_id/manager-update',
  smOnly,
  updatePurchaseRequestLineManager
);
router.post('/purchase-requests/:request_id/approve', smOnly, approvePurchaseRequest);
router.post('/purchase-requests/:request_id/reject', smOnly, rejectPurchaseRequest);
router.get('/purchase-requests/:request_id/approved-lines', smSo, listApprovedPurchaseRequestLines);
router.get('/purchase-requests/:request_id/approved-lines.txt', smSo, downloadApprovedPurchaseRequestLinesTxt);
router.get('/purchase-requests/:request_id/approved-lines.pdf', smSo, downloadApprovedPurchaseRequestLinesPdf);
router.get('/purchase-requests/:request_id/purchase-comparison', smSo, getPurchaseRequestComparison);

router.post('/purchases/invoice-upload-url', checkRole('STORE_OPERATOR'), createPurchaseInvoiceUploadUrl);
router.post(
  '/purchases/receipts/:receipt_id/invoice/upload',
  checkRole('STORE_OPERATOR'),
  itemImageUpload.single('file'),
  uploadPurchaseReceiptInvoice
);
router.post('/purchases/receipts', checkRole('STORE_OPERATOR'), createPurchaseReceipt);
router.post('/purchases/receipts/:receipt_id/lines', checkRole('STORE_OPERATOR'), addPurchaseReceiptLine);
router.post(
  '/purchases/receipts/:receipt_id/lines/:line_id/image/upload',
  checkRole('STORE_OPERATOR'),
  itemImageUpload.single('file'),
  uploadPurchaseReceiptLineImage
);
router.get('/purchases/receipts', smSo, listPurchaseReceipts);
router.get('/purchases/receipts/:receipt_id/invoice/url', smSo, getPurchaseReceiptInvoiceUrl);
router.get('/purchases/receipts/:receipt_id/invoice/view', smSo, streamPurchaseReceiptInvoice);
router.get('/purchases/receipts/:receipt_id/lines', smSo, listPurchaseReceiptLines);
router.get('/purchases/receipts/:receipt_id/invoice-traceability', smSo, getReceiptInvoiceTraceability);
router.get('/purchases/off-list-review', smOnly, listOffListPurchaseReview);
router.post('/purchases/receipts/:receipt_id/lines/manager-review-bulk', smOnly, reviewPurchaseReceiptLinesBulk);
router.post('/purchases/receipts/:receipt_id/lines/:line_id/manager-review', smOnly, reviewPurchaseReceiptLine);

export default router;
