import { createOrderService, getOrderByIdService, getOrdersByUserIdService, cancelOrderService } from '../services/order.service.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Order Controller - Handles order-related API endpoints and business logic
 * Features: Order creation, retrieval, status updates, cancellation, order management
 */

// Create a new order
export const createOrderController = async (req, res, next) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    if (!orderData.selectedDates || orderData.selectedDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one delivery date is required'
      });
    }

    if (!orderData.orderItems || orderData.orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one menu item is required'
      });
    }

    // Create the order
    const result = await createOrderService(orderData);

    logInfo(LOG_CATEGORIES.TRANSACTION, 'Order created successfully', {
      orderId: result.order?.id,
      userId: orderData.userId,
      deliveryItemsCount: result.deliveryItems?.length || 0,
      selectedDatesCount: orderData.selectedDates?.length || 0
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: result.order,
        deliveryItems: result.deliveryItems
      }
    });
  } catch (error) {
    logError(LOG_CATEGORIES.TRANSACTION, 'Order creation failed', {
      userId: req.body?.userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// Get order by ID
export const getOrderByIdController = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await getOrderByIdService(orderId);

    logInfo(LOG_CATEGORIES.TRANSACTION, 'Order retrieved successfully', {
      orderId: orderId
    });

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        order
      }
    });
  } catch (error) {
    logError(LOG_CATEGORIES.TRANSACTION, 'Order retrieval failed', {
      orderId: orderId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get order'
    });
  }
};

// Get orders by user ID
export const getOrdersByUserIdController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const orders = await getOrdersByUserIdService(userId);

    logInfo(LOG_CATEGORIES.TRANSACTION, 'User orders retrieved successfully', {
      userId: userId,
      ordersCount: orders?.length || 0
    });

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders
      }
    });
  } catch (error) {
    logError(LOG_CATEGORIES.TRANSACTION, 'User orders retrieval failed', {
      userId: userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user orders'
    });
  }
};

// Cancel order by ID
export const cancelOrderController = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role || '';
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await cancelOrderService(orderId, userId, [userRole]);

    logInfo(LOG_CATEGORIES.TRANSACTION, 'Order cancelled successfully', {
      orderId: orderId,
      userId: userId,
      userRole: userRole
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order: result
      }
    });
  } catch (error) {
    logError(LOG_CATEGORIES.TRANSACTION, 'Order cancellation failed', {
      orderId: orderId,
      userId: userId,
      userRole: userRole,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};
