import express from 'express';
import {
    createPayment,
    getPaymentById,
    getUserPayments,
    updatePaymentStatus,
    deletePayment,
    uploadPaymentReceipt
} from '../controllers/payment.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';
import { upload } from '../utils/multer.js';

const router = express.Router();

// Apply authentication middleware to all payment routes
router.use(authenticateToken);

// Create payment (with file upload)
router.post('/', upload.single('receipt'), createPayment);

// Get payment by ID
router.get('/:paymentId', getPaymentById);

// Get user payments (with optional filters)
router.get('/', getUserPayments);

// Update payment status
router.put('/:paymentId/status', updatePaymentStatus);

// Delete payment
router.delete('/:paymentId', deletePayment);

// Upload payment receipt later
router.post('/:paymentId/receipt', upload.single('receipt'), uploadPaymentReceipt);

export default router; 