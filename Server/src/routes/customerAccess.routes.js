import express from 'express';
import { 
  validateCustomerTokenController,
  getCustomerOrdersController,
  getCustomerOrderSummaryController,
  getCustomerAddressesController,
  setupCustomerPasswordController
} from '../controllers/customerAccess.controller.js';

const router = express.Router();

// Customer portal routes (no authentication required - uses token in query)
router.get('/validate-token', validateCustomerTokenController);
router.get('/orders', getCustomerOrdersController);
router.get('/order-summary', getCustomerOrderSummaryController);
router.get('/addresses', getCustomerAddressesController);
router.post('/setup-password', setupCustomerPasswordController);

export default router;
