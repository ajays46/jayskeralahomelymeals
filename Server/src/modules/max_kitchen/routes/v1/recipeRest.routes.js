/** @product max_kitchen — Guide §9.4 `/recipe/recipes/lines`; same handlers as kitchen-store v2 recipes. */
import express from 'express';
import { authenticateToken } from '../../../../middleware/authHandler.js';
import { checkRole } from '../../../../middleware/checkRole.js';
import { resolveCompanyId } from '../../../../middleware/resolveCompanyId.js';
import {
  upsertRecipeLine,
  listRecipeLines,
  updateRecipeLine,
  deleteRecipeLine
} from '../../controllers/kitchenStore.controller.js';

const router = express.Router();
const smSo = checkRole('STORE_MANAGER', 'STORE_OPERATOR');

router.use(authenticateToken);
router.use(resolveCompanyId);

router.post('/recipes/lines', smSo, upsertRecipeLine);
router.get('/recipes/lines', smSo, listRecipeLines);
router.put('/recipes/lines/:line_id', smSo, updateRecipeLine);
router.delete('/recipes/lines/:line_id', smSo, deleteRecipeLine);

export default router;
