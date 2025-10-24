import express from 'express';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { 
  createContactController, 
  getSellerUsers, 
  getSellerProfile,
  getUserAddressesController,
  createUserAddressController,
  deleteUserAddressController,
  getUserOrdersController,
  cancelDeliveryItemController,
  cancelOrderController,
  deleteUserController,
  updateCustomerController,
  generateCustomerLinkController
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
router.delete('/users/:userId/addresses/:addressId', deleteUserAddressController);
router.get('/users/:userId/orders', getUserOrdersController);
router.put('/users/:userId', updateCustomerController);
router.put('/orders/:orderId/cancel', cancelOrderController);
router.put('/delivery-items/:deliveryItemId/cancel', cancelDeliveryItemController);
router.delete('/users/:userId', deleteUserController);

// Customer access link generation
router.post('/users/:userId/generate-link', generateCustomerLinkController);

export default router;
