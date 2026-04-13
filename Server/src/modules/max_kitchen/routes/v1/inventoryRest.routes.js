/** @product max_kitchen — REST inventory surface (Tasks 3 & 6); proxies upstream `/inventory/*`. */
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../../middleware/authHandler.js';
import { checkRole } from '../../../../middleware/checkRole.js';
import { resolveCompanyId } from '../../../../middleware/resolveCompanyId.js';
import {
  listItems,
  createItem,
  getItem,
  listItemImages,
  uploadItemImage,
  listItemMovements,
  createItemMovement,
  getLowStockAlerts,
  getShoppingList,
  getFefoSuggestion,
  postFefoConsume,
  getNearExpiryInventory,
  postBlockExpiredInventory,
  getStockBatchesForItem,
  getExpiryDashboard,
  listInventoryForecasts,
  listFinancialForecasts
} from '../../controllers/kitchenStore.controller.js';

const router = express.Router();
const itemImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(authenticateToken);
router.use(resolveCompanyId);

const smSo = checkRole('STORE_MANAGER', 'STORE_OPERATOR');
const smOnly = checkRole('STORE_MANAGER');

router.get('/items', smSo, listItems);
router.post('/items', smSo, createItem);
router.get('/items/:item_id', smSo, getItem);
router.get('/items/:item_id/images', smSo, listItemImages);
router.post(
  '/items/:item_id/images',
  smSo,
  itemImageUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),
  uploadItemImage
);
router.get('/items/:item_id/movements', smSo, listItemMovements);
router.post('/items/:item_id/movements', checkRole('STORE_OPERATOR'), createItemMovement);

router.get('/alerts/low-stock', smSo, getLowStockAlerts);
router.get('/shopping-list', smSo, getShoppingList);

router.get('/fefo-suggestion/:item_id', smSo, getFefoSuggestion);
router.post('/fefo-consume/:item_id', checkRole('STORE_OPERATOR'), postFefoConsume);

router.get('/expiry/near-expiry', smSo, getNearExpiryInventory);
router.post('/expiry/block-expired', smOnly, postBlockExpiredInventory);
router.get('/expiry/dashboard', smSo, getExpiryDashboard);

router.get('/stock-batches/:item_id', smSo, getStockBatchesForItem);

router.get('/forecasts/inventory', smSo, listInventoryForecasts);
router.get('/forecasts/financial', smSo, listFinancialForecasts);

export default router;
