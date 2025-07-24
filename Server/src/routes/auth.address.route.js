import express from 'express';
import { 
    getUserAddresses, 
    createAddress, 
    updateAddress, 
    deleteAddress, 
    getAddressById 
} from '../controllers/address.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all addresses for the authenticated user
router.get('/', getUserAddresses);

// Get a specific address by ID
router.get('/:id', getAddressById);

// Create a new address
router.post('/', createAddress);

// Update an address
router.put('/:id', updateAddress);

// Delete an address
router.delete('/:id', deleteAddress);

export default router;
