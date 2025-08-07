import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { 
    createDeliveryItemsAfterPayment,
    getDeliveryItemsByOrder, 
    updateDeliveryItemStatus 
} from '../controllers/deliveryItem.controller.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create delivery items after payment confirmation
router.post('/orders/:orderId/delivery-items-after-payment', createDeliveryItemsAfterPayment);

// Get delivery items for an order
router.get('/orders/:orderId/delivery-items', getDeliveryItemsByOrder);

// Update delivery item status
router.patch('/delivery-items/:deliveryItemId/status', updateDeliveryItemStatus);

export default router;
