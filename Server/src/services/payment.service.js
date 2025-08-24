import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { savePaymentReceipt, deletePaymentReceipt } from './paymentReceiptUpload.service.js';
import { createDeliveryItemsAfterPaymentService } from './deliveryItem.service.js';
import { reduceProductQuantitiesService } from './inventory.service.js';

// Helper function to create delivery items (can work with transaction or main client)
const createDeliveryItemsInTransaction = async (prismaClient, orderId, orderData, userId) => {
  const { selectedDates, orderItems, deliveryLocations, skipMeals } = orderData;
  const deliveryItems = [];
  let skippedMealsCount = 0;
  
  for (const date of selectedDates) {
    // Handle both Date objects and date strings
    let dateStr;
    if (date instanceof Date) {
      dateStr = date.toISOString().split('T')[0];
    } else if (typeof date === 'string') {
      dateStr = date;
    } else {
      continue;
    }
    
    for (const item of orderItems) {
      // Check if this meal type is skipped for this date
      if (skipMeals && skipMeals[dateStr] && skipMeals[dateStr][item.mealType]) {
        // Skip this meal for this date - don't create delivery item
        skippedMealsCount++;
        continue;
      }
      
      // Map meal type to delivery time slot
      let deliveryTimeSlot = 'Breakfast'; // Default
      if (item.mealType === 'breakfast') deliveryTimeSlot = 'Breakfast';
      else if (item.mealType === 'lunch') deliveryTimeSlot = 'Lunch';
      else if (item.mealType === 'dinner') deliveryTimeSlot = 'Dinner';
      else deliveryTimeSlot = 'Breakfast'; // Fallback default
      
      // Use meal-specific address if available, otherwise use primary address
      let itemAddressId = orderData.deliveryAddressId;
      if (deliveryLocations && deliveryLocations[item.mealType]) {
        itemAddressId = deliveryLocations[item.mealType];
      }
      
      const deliveryItem = await prismaClient.deliveryItem.create({
        data: {
          orderId: orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          deliveryDate: new Date(dateStr),
          deliveryTimeSlot: deliveryTimeSlot,
          addressId: itemAddressId,
          userId: userId,
          status: 'Pending'
        }
      });
      
      deliveryItems.push(deliveryItem);
    }
  }
  
  return deliveryItems;
};

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
        if (!paymentMethod || !paymentAmount || !receipt) {
            throw new AppError('Payment method, amount, and receipt are required', 400);
        }
        
        // Either orderId or orderData must be provided
        if (!orderId && !orderData) {
            throw new AppError('Either orderId or orderData is required', 400);
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

        // If orderId is provided, check if order exists
        // If no orderId but orderData is provided, we'll create the order after payment
        let order = null;
        if (orderId) {
            order = await prisma.order.findFirst({
                where: {
                    id: orderId
                }
            });

            if (!order) {
                throw new AppError('Order not found', 404);
            }
        } else if (!orderData) {
            throw new AppError('Either orderId or orderData is required', 400);
        }

        // For now, allow any authenticated user to create payment for an existing order
        // This handles the case where sellers create orders for users
        // TODO: Add proper authorization checks if needed

        // Check if payment already exists for this order (only if orderId is provided)
        if (orderId) {
            const existingPayment = await prisma.payment.findFirst({
                where: {
                    orderId: orderId
                }
            });

            if (existingPayment) {
                throw new AppError('Payment already exists for this order', 400);
            }
        }

        // Use the receipt file saved by multer
        let receiptUrl = null;
        if (receipt) {
            // Multer has already saved the file to payment-receipts folder
            receiptUrl = `/payment-receipts/${receipt.filename}`;
        }

        // Parse orderData if it's a string
        let parsedOrderData = orderData;
        if (orderData && typeof orderData === 'string') {
            try {
                parsedOrderData = JSON.parse(orderData);
            } catch (parseError) {
                throw new AppError('Invalid order data format', 400);
            }
        }

        // Validate orderData structure if provided
        if (parsedOrderData) {
            if (!parsedOrderData.userId) {
                throw new AppError('User ID is required in orderData', 400);
            }
            if (!parsedOrderData.orderItems || !Array.isArray(parsedOrderData.orderItems) || parsedOrderData.orderItems.length === 0) {
                throw new AppError('Order items are required and must be an array', 400);
            }
            if (!parsedOrderData.selectedDates || !Array.isArray(parsedOrderData.selectedDates) || parsedOrderData.selectedDates.length === 0) {
                throw new AppError('Selected dates are required and must be an array', 400);
            }
            if (!parsedOrderData.orderTimes || !Array.isArray(parsedOrderData.orderTimes) || parsedOrderData.orderTimes.length === 0) {
                throw new AppError('Order times are required and must be an array', 400);
            }
            
            // Validate each order item has required fields
            for (const item of parsedOrderData.orderItems) {
                if (!item.menuItemId) {
                    throw new AppError('Each order item must have a menuItemId', 400);
                }
                if (!item.mealType) {
                    throw new AppError('Each order item must have a mealType', 400);
                }
                if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                    throw new AppError('Each order item must have a valid quantity', 400);
                }
            }
        }

        // Extract the selected user's ID before the transaction
        const orderUserId = parsedOrderData?.userId;
        
        // Create payment with transaction
        const payment = await prisma.$transaction(async (tx) => {
            let finalOrderId = orderId;
            
            // If no order exists, create it first
            if (!order && parsedOrderData) {
                // Validate required fields before creating order
                if (!parsedOrderData.orderDate) {
                    throw new AppError('Order date is required', 400);
                }
                if (!parsedOrderData.orderTimes) {
                    throw new AppError('Order times are required', 400);
                }
                if (!parsedOrderData.deliveryAddressId) {
                    throw new AppError('Delivery address is required', 400);
                }
                
                // Ensure orderDate is a valid date
                let orderDate;
                try {
                    orderDate = new Date(parsedOrderData.orderDate);
                    if (isNaN(orderDate.getTime())) {
                        throw new Error('Invalid date');
                    }
                } catch (error) {
                    throw new AppError('Invalid order date format', 400);
                }
                
                // Validate that the selected user ID exists
                if (!orderUserId) {
                    throw new AppError('Selected user ID is required in orderData. Please select a customer before creating the order.', 400);
                }
                
                const newOrder = await tx.order.create({
                    data: {
                        userId: orderUserId, // Always use the selected user's ID
                        orderDate: orderDate,
                        orderTimes: JSON.stringify(parsedOrderData.orderTimes),
                        totalPrice: paymentAmount,
                        deliveryAddressId: parsedOrderData.deliveryAddressId,
                        status: 'Payment_Confirmed' // Order is confirmed immediately after payment
                    }
                });
                
                finalOrderId = newOrder.id;
                order = newOrder;
            } else if (orderId) {
                // Update existing order status to Payment_Confirmed
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'Payment_Confirmed' }
                });
            }
            
            // Create the payment
            const newPayment = await tx.payment.create({
                data: {
                    userId: orderUserId || userId, // Use selected user's ID if available, otherwise use seller's ID
                    orderId: finalOrderId,
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
                        userId: orderUserId || userId, // Use selected user's ID if available, otherwise use seller's ID
                        paymentId: newPayment.id,
                        receiptImageUrl: receiptUrl,
                        receipt: receiptUrl
                    }
                });
            }

            return newPayment;
        });

        // Create delivery items after the transaction is complete
        if (parsedOrderData && !orderId && orderUserId) {
            try {
                // Get the order ID from the created order - use the selected user's ID
                const createdOrder = await prisma.order.findFirst({
                    where: { userId: orderUserId },
                    orderBy: { createdAt: 'desc' }
                });
                
                if (createdOrder) {
                    const deliveryItems = await createDeliveryItemsInTransaction(prisma, createdOrder.id, parsedOrderData, orderUserId);
                    
                    // Reduce product quantities after delivery items are created successfully
                    try {
                        const quantityReduction = await reduceProductQuantitiesService(
                            parsedOrderData.orderItems,
                            parsedOrderData.selectedDates,
                            parsedOrderData.skipMeals || {},
                            createdOrder.id // Pass the order ID to prevent duplicate reductions
                        );
                    } catch (inventoryError) {
                        console.error(`❌ Failed to reduce product quantities for order ${createdOrder.id}:`, inventoryError);
                        // Don't fail the payment if inventory reduction fails
                        // The quantities can be reduced manually later
                    }
                }
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
                        id: true
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
                        id: true
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
                        id: true
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