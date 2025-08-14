import { createOrderService, getOrderByIdService, getOrdersByUserIdService } from '../services/order.service.js';

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

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: result.order,
        deliveryItems: result.deliveryItems
      }
    });
  } catch (error) {
    console.error('Error in createOrderController:', error);
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

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Error in getOrderByIdController:', error);
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

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders
      }
    });
  } catch (error) {
    console.error('Error in getOrdersByUserIdController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user orders'
    });
  }
};
