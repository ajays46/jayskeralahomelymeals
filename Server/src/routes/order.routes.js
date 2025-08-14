import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { 
  createOrderController,
  getOrderByIdController,
  getOrdersByUserIdController
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

export default router;
