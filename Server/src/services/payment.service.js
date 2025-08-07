import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { savePaymentReceipt, deletePaymentReceipt } from './paymentReceiptUpload.service.js';
import { createDeliveryItemsAfterPaymentService } from './deliveryItem.service.js';

// Create a new payment
export const createPaymentService = async (userId, paymentData) => {
    try {
        const { 
            orderId, 
            paymentMethod, 
            paymentAmount, 
            receipt, 
            receiptType,
            orderData // Add orderData to paymentData for delivery items creation
        } = paymentData;

        // Validate required fields
        if (!orderId || !paymentMethod || !paymentAmount || !receipt) {
            throw new AppError('Order ID, payment method, amount, and receipt are required', 400);
        }

        // Validate payment method
        const validPaymentMethods = ['UPI', 'CreditCard', 'DebitCard', 'NetBanking'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            throw new AppError('Invalid payment method', 400);
        }

        // Validate receipt type
        const validReceiptTypes = ['Image', 'PDF'];
        if (receiptType && !validReceiptTypes.includes(receiptType)) {
            throw new AppError('Invalid receipt type', 400);
        }

        // Check if order exists and belongs to user
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId
            }
        });

        if (!order) {
            throw new AppError('Order not found or does not belong to user', 404);
        }

        // Check if payment already exists for this order
        const existingPayment = await prisma.payment.findFirst({
            where: {
                orderId: orderId
            }
        });

        if (existingPayment) {
            throw new AppError('Payment already exists for this order', 400);
        }

        // Use the receipt file saved by multer
        let receiptUrl = null;
        if (receipt) {
            // Multer has already saved the file to payment-receipts folder
            receiptUrl = `/payment-receipts/${receipt.filename}`;
        }

        // Create payment with transaction
        const payment = await prisma.$transaction(async (tx) => {
            // Create the payment
            const newPayment = await tx.payment.create({
                data: {
                    userId,
                    orderId,
                    paymentMethod,
                    paymentAmount,
                    paymentDate: new Date(),
                    receiptUrl,
                    uploadedReceiptType: receiptType || 'Image',
                    paymentStatus: 'Pending'
                }
            });

            // Create payment receipt record
            if (receiptUrl) {
                await tx.paymentReceipt.create({
                    data: {
                        userId,
                        paymentId: newPayment.id,
                        receiptImageUrl: receiptUrl,
                        receipt: receiptUrl
                    }
                });
            }

            // Update order status to Payment_Confirmed
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'Payment_Confirmed' }
            });

            return newPayment;
        });

        // After payment is created successfully, create delivery items
        if (orderData) {
            try {
                const deliveryItemsResult = await createDeliveryItemsAfterPaymentService(orderId, orderData);
            } catch (deliveryError) {
                // Don't fail the payment if delivery items creation fails
                // The delivery items can be created manually later
            }
        }

        // Fetch the complete payment with relations
        const completePayment = await prisma.payment.findUnique({
            where: { id: payment.id },
            include: {
                user: {
                    select: {
                        id: true,
                        customerId: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        orderDate: true,
                        totalPrice: true,
                        status: true
                    }
                },
                paymentReceipts: true
            }
        });

        return completePayment;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Payment creation error:', error);
        throw new AppError('Failed to create payment', 500);
    }
};

// Get payment by ID
export const getPaymentByIdService = async (userId, paymentId) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                userId: userId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        customerId: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        orderDate: true,
                        totalPrice: true,
                        status: true
                    }
                },
                paymentReceipts: true
            }
        });

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        return payment;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Get payment error:', error);
        throw new AppError('Failed to get payment', 500);
    }
};

// Get user payments
export const getUserPaymentsService = async (userId, filters = {}) => {
    try {
        const { status, startDate, endDate, paymentMethod } = filters;
        
        const whereClause = {
            userId: userId
        };

        if (status) {
            whereClause.paymentStatus = status;
        }

        if (paymentMethod) {
            whereClause.paymentMethod = paymentMethod;
        }

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                whereClause.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.createdAt.lte = new Date(endDate);
            }
        }

        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                order: {
                    select: {
                        id: true,
                        orderDate: true,
                        totalPrice: true,
                        status: true
                    }
                },
                paymentReceipts: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return payments;
    } catch (error) {
        console.error('Get user payments error:', error);
        throw new AppError('Failed to get user payments', 500);
    }
};

// Update payment status
export const updatePaymentStatusService = async (userId, paymentId, status) => {
    try {
        const validStatuses = ['Pending', 'Confirmed', 'Failed'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid payment status', 400);
        }

        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                userId: userId
            }
        });

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: { 
                paymentStatus: status,
                paymentDate: status === 'Confirmed' ? new Date() : payment.paymentDate
            },
            include: {
                user: {
                    select: {
                        id: true,
                        customerId: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        orderDate: true,
                        totalPrice: true,
                        status: true
                    }
                },
                paymentReceipts: true
            }
        });

        // Update order status based on payment status
        if (status === 'Confirmed') {
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'Payment_Confirmed' }
            });
        } else if (status === 'Failed') {
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'Pending' }
            });
        }

        return updatedPayment;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Update payment status error:', error);
        throw new AppError('Failed to update payment status', 500);
    }
};

// Delete payment
export const deletePaymentService = async (userId, paymentId) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                userId: userId
            }
        });

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        // Delete payment with transaction
        await prisma.$transaction(async (tx) => {
            // Delete payment receipts first
            await tx.paymentReceipt.deleteMany({
                where: { paymentId: paymentId }
            });

            // Delete the payment
            await tx.payment.delete({
                where: { id: paymentId }
            });

            // Update order status back to Pending
            await tx.order.update({
                where: { id: payment.orderId },
                data: { status: 'Pending' }
            });
        });

        // Clean up receipt files from disk
        if (payment.receiptUrl) {
            const filename = payment.receiptUrl.split('/').pop(); // Extract filename from URL
            try {
                const fs = require('fs');
                const filePath = path.join(process.cwd(), 'src/services/payment-receipts', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Payment receipt file deleted: ${filename}`);
                }
            } catch (fileError) {
                console.error(`Failed to delete payment receipt file: ${filename}`, fileError);
                // Don't throw error as database deletion was successful
            }
        }

        return { success: true, message: 'Payment deleted successfully' };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Delete payment error:', error);
        throw new AppError('Failed to delete payment', 500);
    }
}; 