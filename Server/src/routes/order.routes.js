import express from 'express';
import {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getOrdersByDateRange,
    getDeliveryOrders,
    calculateMenuPricing,
    calculateOrderTotal
} from '../controllers/order.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkOrderPermission, checkOrderManagementPermission } from '../middleware/orderPermission.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User order routes - Only sellers and users can create orders (admins blocked)
router.post('/', checkOrderPermission, createOrder); // Create new order
router.get('/', getUserOrders); // Get user's orders with filters
router.get('/:id', getOrderById); // Get specific order
router.put('/:id/status', updateOrderStatus); // Update order status
router.delete('/:id', cancelOrder); // Cancel order

// Delivery management routes (can be used by admin/delivery staff)
router.get('/date-range/:startDate/:endDate', getOrdersByDateRange); // Get orders by date range
router.get('/delivery/:date/:orderTime', getDeliveryOrders); // Get delivery orders for specific date/time

// Pricing calculation routes - Only sellers and users can calculate pricing (admins blocked)
router.post('/calculate-menu-pricing', checkOrderPermission, calculateMenuPricing); // Calculate menu pricing for different plans
router.post('/calculate-order-total', checkOrderPermission, calculateOrderTotal); // Calculate total order price with dates and skip meals

export default router; 