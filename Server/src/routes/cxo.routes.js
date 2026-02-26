import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId } from '../middleware/resolveCompanyId.js';
import { getManagerExecutiveHierarchy } from '../controllers/aiRoute.controller.js';

const router = express.Router();

router.use(authenticateToken);
router.use(resolveCompanyId);

// CXO only: manager → executives → performance (FRONTEND_DELIVERY_MANAGER_ISOLATION_GUIDE §3b)
router.get('/manager-executive-hierarchy', checkRole('CEO', 'CFO', 'ADMIN'), getManagerExecutiveHierarchy);

export default router;
