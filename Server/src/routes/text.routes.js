import express from 'express';
import { correctTextController } from '../controllers/text.controller.js';

const router = express.Router();

// POST /api/text/correct - body: { text: string }
router.post('/text/correct', correctTextController);

export default router;
