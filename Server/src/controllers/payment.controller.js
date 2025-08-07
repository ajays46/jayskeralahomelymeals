import AppError from '../utils/AppError.js';
import {
    createPaymentService,
    getPaymentByIdService,
    getUserPaymentsService,
    updatePaymentStatusService,
    deletePaymentService
} from '../services/payment.service.js';

// Create a new payment
export const createPayment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { orderId, paymentMethod, paymentAmount, receiptType, orderData } = req.body;
        const receipt = req.file;

        if (!receipt) { throw new AppError('Payment receipt is required', 400); }

        const paymentData = {
            orderId,
            paymentMethod,
            paymentAmount: parseInt(paymentAmount),
            receipt,
            receiptType,
            orderData // Include orderData for delivery items creation
        };

        const payment = await createPaymentService(userId, paymentData);

        res.status(201).json({
            success: true,
            message: 'Payment created successfully',
            data: { payment: payment }
        });
    } catch (error) {
        next(error);
    }
};

// Get payment by ID
export const getPaymentById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { paymentId } = req.params;

        const payment = await getPaymentByIdService(userId, paymentId);

        res.status(200).json({
            success: true,
            message: 'Payment retrieved successfully',
            data: {
                payment: payment
            }
        });
    } catch (error) {
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

        res.status(200).json({
            success: true,
            message: 'User payments retrieved successfully',
            data: {
                payments: payments
            }
        });
    } catch (error) {
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

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: {
                payment: payment
            }
        });
    } catch (error) {
        next(error);
    }
};

// Delete payment
export const deletePayment = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { paymentId } = req.params;

        const result = await deletePaymentService(userId, paymentId);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        next(error);
    }
}; 