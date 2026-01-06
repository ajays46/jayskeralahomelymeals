import express from 'express';
import {
  createOrUpdateProfile,
  getProfile,
  uploadImage,
  updateLocation,
  getAllProfiles,
  deleteProfile,
  getRoutes,
  getRoutesByDriverId
} from '../controllers/deliveryExecutive.controller.js';

const router = express.Router();

// Create or update delivery executive profile
router.put('/:userId/profile', createOrUpdateProfile);

// Get delivery executive profile
router.get('/:userId/profile', getProfile);

// Upload delivery executive image
router.post('/:userId/image', uploadImage);

// Update delivery executive location
router.put('/:userId/location', updateLocation);

// Get all delivery executives
router.get('/', getAllProfiles);

// Delete delivery executive profile
router.delete('/:userId/profile', deleteProfile);

// Get delivery routes for a phone number
router.get('/get-routes/:phoneNumber', getRoutes);

// Get delivery routes by driver_id (query parameter)
router.get('/routes', getRoutesByDriverId);

export default router;
