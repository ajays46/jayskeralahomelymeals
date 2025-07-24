import express from 'express';
import {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getOrdersByDateRange,
    getDeliveryOrders,
    getDeliverySchedulesForRouting
} from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User order routes
router.post('/', createOrder); // Create new order
router.get('/', getUserOrders); // Get user's orders with filters
router.get('/:id', getOrderById); // Get specific order
router.put('/:id/status', updateOrderStatus); // Update order status
router.delete('/:id', cancelOrder); // Cancel order

// Delivery management routes (can be used by admin/delivery staff)
router.get('/date-range/:startDate/:endDate', getOrdersByDateRange); // Get orders by date range
router.get('/delivery/:date/:orderTime', getDeliveryOrders); // Get delivery orders for specific date/time
router.get('/routing/:date', getDeliverySchedulesForRouting); // Get delivery schedules for AI routing

export default router; 