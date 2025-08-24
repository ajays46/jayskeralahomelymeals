import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { 
  createOrderController,
  getOrderByIdController,
  getOrdersByUserIdController,
  cancelOrderController
} from '../controllers/order.controller.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new order
router.post('/', createOrderController);

// Get order by ID
router.get('/:orderId', getOrderByIdController);

// Get orders by user ID
router.get('/user/:userId', getOrdersByUserIdController);

// Cancel order by ID
router.put('/:orderId/cancel', cancelOrderController);

export default router;
