import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { 
  createContactController, 
  getSellerUsers, 
  getSellerProfile,
  getUserAddressesController,
  createUserAddressController,
  getUserOrdersController,
  cancelDeliveryItemController,
  cancelOrderController,
  deleteUserController,
  updateCustomerController
} from '../controllers/seller.controller.js';

const router = express.Router();

// All seller routes require authentication and SELLER role
router.use(authenticateToken);
router.use(checkRole('SELLER'));

// Seller profile
router.get('/profile', getSellerProfile);

// Contact management routes (for sellers)
router.post('/create-contact', createContactController);
router.get('/users', getSellerUsers);
router.get('/users/:userId/addresses', getUserAddressesController);
router.post('/users/:userId/addresses', createUserAddressController);
router.get('/users/:userId/orders', getUserOrdersController);
router.put('/users/:userId', updateCustomerController);
router.put('/orders/:orderId/cancel', cancelOrderController);
router.put('/delivery-items/:deliveryItemId/cancel', cancelDeliveryItemController);
router.delete('/users/:userId', deleteUserController);

export default router;
