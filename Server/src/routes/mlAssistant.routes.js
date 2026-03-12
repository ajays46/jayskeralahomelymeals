/**
 * ML Assistant (Jaice) routes - proxy to 5004. Allowed: DELIVERY_MANAGER, CEO, CFO, ADMIN.
 */
import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveCompanyId, requireCompanyId } from '../middleware/resolveCompanyId.js';
import { greeting, ping, chat, debugConfig } from '../controllers/mlAssistant.controller.js';

const router = express.Router();

router.use(authenticateToken);
router.use(checkRole('DELIVERY_MANAGER', 'CEO', 'CFO', 'ADMIN'));
router.use(resolveCompanyId);
router.use(requireCompanyId);

router.get('/greeting', greeting);
router.get('/chat/ping', ping);
router.post('/chat', chat);
router.get('/debug/config', debugConfig);

export default router;
