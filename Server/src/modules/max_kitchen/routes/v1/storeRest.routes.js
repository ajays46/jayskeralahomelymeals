/** @product max_kitchen — Guide §9.2 `GET|POST /store/brands` (+ logo); same handlers as kitchen-store v1 brands. */
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../../../../middleware/authHandler.js';
import { checkRole } from '../../../../middleware/checkRole.js';
import { resolveCompanyId } from '../../../../middleware/resolveCompanyId.js';
import {
  listBrands,
  createBrand,
  uploadBrandLogo,
  getBrandLogoViewUrl
} from '../../controllers/kitchenStore.controller.js';

const router = express.Router();
const itemImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const smSo = checkRole('STORE_MANAGER', 'STORE_OPERATOR');

router.use(authenticateToken);
router.use(resolveCompanyId);

router.get('/brands', smSo, listBrands);
router.post('/brands', smSo, createBrand);
router.post('/brands/:brand_id/logo/upload', smSo, itemImageUpload.single('file'), uploadBrandLogo);
router.get('/brands/:brand_id/logo/view-url', smSo, getBrandLogoViewUrl);

export default router;
