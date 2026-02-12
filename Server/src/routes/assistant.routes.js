import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { chatController } from '../controllers/assistant.controller.js';

const router = express.Router();

router.use(authenticateToken);
router.use(checkRole('DELIVERY_MANAGER', 'CEO', 'CFO', 'ADMIN'));

router.post('/chat', chatController);

export default router;
