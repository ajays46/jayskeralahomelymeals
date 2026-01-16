import express from 'express';
import multer from 'multer';
import {
  createOrUpdateProfile,
  getProfile,
  uploadImage,
  updateLocation,
  getAllProfiles,
  deleteProfile,
  getRoutes,
  getRoutesByDriverId,
  uploadDeliveryPhoto
} from '../controllers/deliveryExecutive.controller.js';

const router = express.Router();

// Configure multer for memory storage (for delivery photo uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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

// Upload delivery photo to external API
router.post('/upload-delivery-photo', upload.single('image'), uploadDeliveryPhoto);

export default router;
