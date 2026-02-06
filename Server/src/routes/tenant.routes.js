import express from 'express';
import { companyByPath } from '../controllers/tenant.controller.js';

const router = express.Router();

router.get('/company-by-path/:path', companyByPath);

export default router;
