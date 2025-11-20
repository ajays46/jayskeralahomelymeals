import AppError from '../utils/AppError.js';
import {
    createPaymentService,
    getPaymentByIdService,
    getUserPaymentsService,
    updatePaymentStatusService,
    deletePaymentService,
    uploadReceiptService
} from '../services/payment.service.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Payment Controller - Handles payment processing API endpoints and operations
 * Manages payment creation, validation, receipt handling, and payment status updates
 * Features: Payment processing, receipt management, payment validation, order integration
 */

// Create a new payment
export const createPayment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { orderId, paymentMethod, paymentAmount, receiptType, orderData, externalReceiptUrl } = req.body;
        const receipt = req.file;

        // Receipt is now optional - no validation required

        const paymentData = {
            orderId,
            paymentMethod,
            paymentAmount: parseInt(paymentAmount),
            receipt, // Can be null/undefined
            receiptType,
            orderData, // Include orderData for delivery items creation
            externalReceiptUrl // Include external receipt URL
        };
        

        const payment = await createPaymentService(userId, paymentData);

        logInfo(LOG_CATEGORIES.PAYMENT, 'Payment created successfully', {
            paymentId: payment.id,
            orderId: orderId,
            paymentMethod: paymentMethod,
            paymentAmount: paymentAmount,
            userId: userId,
            hasReceipt: !!receipt,
            hasExternalReceipt: !!externalReceiptUrl
        });

        res.status(201).json({
            success: true,
            message: receipt ? 'Payment created successfully' : 'Order created successfully. Payment receipt can be uploaded later.',
            data: { payment: payment }
        });
    } catch (error) {
        logError(LOG_CATEGORIES.PAYMENT, 'Payment creation failed', {
            userId: req.user?.userId,
            orderId: req.body?.orderId,
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
};

// Get payment by ID
export const getPaymentById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { paymentId } = req.params;

        const payment = await getPaymentByIdService(userId, paymentId);

        logInfo(LOG_CATEGORIES.PAYMENT, 'Payment retrieved successfully', {
            paymentId: paymentId,
            userId: userId
        });

        res.status(200).json({
            success: true,
            message: 'Payment retrieved successfully',
            data: {
                payment: payment
            }
        });
    } catch (error) {
        logError(LOG_CATEGORIES.PAYMENT, 'Payment retrieval failed', {
            paymentId: paymentId,
            userId: userId,
            error: error.message
        });
        next(error);
    }
};

// Get user payments
export const getUserPayments = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { status, startDate, endDate, paymentMethod } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (paymentMethod) filters.paymentMethod = paymentMethod;

        const payments = await getUserPaymentsService(userId, filters);

        logInfo(LOG_CATEGORIES.PAYMENT, 'User payments retrieved successfully', {
            userId: userId,
            filters: filters,
            paymentCount: payments?.length || 0
        });

        res.status(200).json({
            success: true,
            message: 'User payments retrieved successfully',
            data: {
                payments: payments
            }
        });
    } catch (error) {
        logError(LOG_CATEGORIES.PAYMENT, 'User payments retrieval failed', {
            userId: userId,
            filters: filters,
            error: error.message
        });
        next(error);
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { paymentId } = req.params;
        const { status } = req.body;

        if (!status) {
            throw new AppError('Payment status is required', 400);
        }

        const payment = await updatePaymentStatusService(userId, paymentId, status);

        logInfo(LOG_CATEGORIES.PAYMENT, 'Payment status updated successfully', {
            paymentId: paymentId,
            userId: userId,
            newStatus: status,
            previousStatus: payment?.status
        });

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: {
                payment: payment
            }
        });
    } catch (error) {
        logError(LOG_CATEGORIES.PAYMENT, 'Payment status update failed', {
            paymentId: paymentId,
            userId: userId,
            status: status,
            error: error.message
        });
        next(error);
    }
};

// Delete payment
export const deletePayment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { paymentId } = req.params;

        const result = await deletePaymentService(userId, paymentId);

        logInfo(LOG_CATEGORIES.PAYMENT, 'Payment deleted successfully', {
            paymentId: paymentId,
            userId: userId
        });

        res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        logError(LOG_CATEGORIES.PAYMENT, 'Payment deletion failed', {
            paymentId: paymentId,
            userId: userId,
            error: error.message
        });
        next(error);
    }
};

// Upload payment receipt later
export const uploadPaymentReceipt = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { paymentId } = req.params;
        const { externalReceiptUrl, orderAmount } = req.body;
        const receipt = req.file;

        // Log the received order amount for debugging

        if (!receipt && !externalReceiptUrl) {
            throw new AppError('Payment receipt is required', 400);
        }


        // Use mimetype if type is not available
        const fileType = receipt?.type || receipt?.mimetype || 'application/octet-stream';

        const paymentData = {
            receipt,
            receiptType: fileType.startsWith('image/') ? 'Image' : 'PDF',
            externalReceiptUrl,
            orderAmount: orderAmount ? parseInt(orderAmount) : null
        };

        const payment = await uploadReceiptService(userId, paymentId, paymentData);

        logInfo(LOG_CATEGORIES.PAYMENT, 'Payment receipt uploaded successfully', {
            paymentId: paymentId,
            userId: userId,
            receiptType: paymentData.receiptType,
            hasFile: !!receipt,
            hasExternalUrl: !!externalReceiptUrl
        });

        res.status(200).json({
            success: true,
            message: 'Payment receipt uploaded successfully',
            data: { payment: payment }
        });
    } catch (error) {
        logError(LOG_CATEGORIES.PAYMENT, 'Payment receipt upload failed', {
            paymentId: paymentId,
            userId: userId,
            error: error.message
        });
        next(error);
    }
}; 