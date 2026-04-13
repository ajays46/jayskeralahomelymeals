/**
 * @product  jaice
 * @version  v1
 * @prefix   /api/jaice/v1
 *
 * Jaice — AI assistant product.
 * Conversational AI assistants for delivery managers, CEOs, and admins.
 *
 * Feature modules:
 *
 *  assistant    (/assistant)            Delivery manager AI chat (OpenAI-powered)
 *  ml-assistant (/ml-assistant)         Jaice AI chat — greeting, ping, chat, debug config
 *                                       (MaXHub Logistics context)
 */
import express from 'express';
import { extractApiVersion } from '../../../../middleware/apiVersion.js';

import assistantRoutes from './assistant.routes.js';
import mlAssistantRoutes from './mlAssistant.routes.js';

const router = express.Router();

router.use(extractApiVersion);

// @feature assistant — delivery manager AI chat (OpenAI-powered)
router.use('/assistant', assistantRoutes);

// @feature ml-assistant — Jaice AI chat (greeting, ping, chat, debug)
router.use('/ml-assistant', mlAssistantRoutes);

export default router;
