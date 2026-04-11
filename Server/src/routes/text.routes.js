/** @product max_kitchen · @feature text — AI text correction utility */
import express from 'express';
import { correctTextController } from '../controllers/text.controller.js';

const router = express.Router();

// POST /api/max_kitchen/v1/text/correct - body: { text: string }
router.post('/text/correct', correctTextController);

export default router;
