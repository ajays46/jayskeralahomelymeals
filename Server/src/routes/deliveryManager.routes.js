import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { 
  getDeliveryManagerDashboard,
  cancelDeliveryItemController,
  cancelOrderController,
  updateDeliveryItemStatusController,
  getDeliveryExecutivesController
} from '../controllers/deliveryManager.controller.js';

const router = express.Router();

// All delivery manager routes require authentication and DELIVERY_MANAGER role
router.use(authenticateToken);
router.use(checkRole('DELIVERY_MANAGER','SELLER'));

// Dashboard data
router.get('/dashboard', getDeliveryManagerDashboard);

// Delivery item management
router.put('/delivery-items/:deliveryItemId/cancel', cancelDeliveryItemController);
router.patch('/delivery-items/:deliveryItemId/status', updateDeliveryItemStatusController);

// Order management
router.put('/orders/:orderId/cancel', cancelOrderController);

// Delivery executives
router.get('/delivery-executives', getDeliveryExecutivesController);

export default router;
