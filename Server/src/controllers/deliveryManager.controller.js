import { 
  getDeliveryManagerDashboardService,
  cancelDeliveryItemService,
  cancelOrderService,
  updateDeliveryItemStatusService,
  getDeliveryExecutivesService
} from '../services/deliveryManager.service.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Delivery Manager Controller - Handles delivery management API endpoints and operations
 * Manages delivery routes, executive coordination, and delivery analytics
 * Features: Route management, executive coordination, delivery analytics, order tracking
 */

// Get delivery manager dashboard data
export const getDeliveryManagerDashboard = async (req, res, next) => {
  try {
    const deliveryManagerId = req.user.userId;
    
    const dashboardData = await getDeliveryManagerDashboardService(deliveryManagerId);
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery manager dashboard data retrieved successfully', {
      deliveryManagerId: deliveryManagerId
    });
    
    res.status(200).json({
      success: true,
      message: 'Delivery manager dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery manager dashboard data retrieval failed', {
      deliveryManagerId: deliveryManagerId,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

// Cancel a delivery item
export const cancelDeliveryItemController = async (req, res, next) => {
  try {
    const deliveryManagerId = req.user.userId;
    const { deliveryItemId } = req.params;
    
    if (!deliveryItemId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery Item ID is required'
      });
    }
    
    const result = await cancelDeliveryItemService(deliveryItemId, deliveryManagerId);
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery item cancelled successfully', {
      deliveryItemId: deliveryItemId,
      deliveryManagerId: deliveryManagerId
    });
    
    res.status(200).json({
      success: true,
      message: 'Delivery item cancelled successfully',
      data: result
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery item cancellation failed', {
      deliveryItemId: deliveryItemId,
      deliveryManagerId: deliveryManagerId,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

// Cancel an order
export const cancelOrderController = async (req, res, next) => {
  try {
    const deliveryManagerId = req.user.userId;
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    const result = await cancelOrderService(orderId, deliveryManagerId);
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Order cancelled successfully', {
      orderId: orderId,
      deliveryManagerId: deliveryManagerId
    });
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: result
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Order cancellation failed', {
      orderId: orderId,
      deliveryManagerId: deliveryManagerId,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

// Update delivery item status
export const updateDeliveryItemStatusController = async (req, res, next) => {
  try {
    const deliveryManagerId = req.user.userId;
    const { deliveryItemId } = req.params;
    const { status } = req.body;
    
    if (!deliveryItemId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery Item ID is required'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const result = await updateDeliveryItemStatusService(deliveryItemId, deliveryManagerId, status);
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery item status updated successfully', {
      deliveryItemId: deliveryItemId,
      deliveryManagerId: deliveryManagerId,
      newStatus: status
    });
    
    res.status(200).json({
      success: true,
      message: 'Delivery item status updated successfully',
      data: result
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery item status update failed', {
      deliveryItemId: deliveryItemId,
      deliveryManagerId: deliveryManagerId,
      status: status,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

// Get delivery executives
export const getDeliveryExecutivesController = async (req, res, next) => {
  try {
    const deliveryManagerId = req.user.userId;
    
    const executives = await getDeliveryExecutivesService(deliveryManagerId);
    
    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery executives retrieved successfully', {
      deliveryManagerId: deliveryManagerId,
      executiveCount: executives?.length || 0
    });
    
    res.status(200).json({
      success: true,
      message: 'Delivery executives retrieved successfully',
      data: executives
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery executives retrieval failed', {
      deliveryManagerId: deliveryManagerId,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};
