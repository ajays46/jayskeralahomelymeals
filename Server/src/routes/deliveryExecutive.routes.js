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
  uploadDeliveryPhoto,
  uploadPreDeliveryPhoto,
  checkDeliveryImages,
  checkPreDeliveryImages
} from '../controllers/deliveryExecutive.controller.js';

const router = express.Router();

// Configure multer for memory storage (for delivery photo/video uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 50MB limit for videos
  },
  fileFilter: function (req, file, cb) {
    // Allow both images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
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

// Upload delivery photos/videos to external API (accepts multiple files with 'images[]' key)
router.post('/upload-delivery-photo', upload.array('images[]', 10), uploadDeliveryPhoto);

// Upload pre-delivery photos/videos to external API (same pattern as upload_delivery_pic: address_id, session, date, file(s), optional comments)
router.post('/upload-pre-delivery-photo', upload.array('file', 10), uploadPreDeliveryPhoto);

// Check if delivery images exist for a specific stop
// Query params: address_id, delivery_date (YYYY-MM-DD), delivery_session (BREAKFAST/LUNCH/DINNER)
router.get('/check-delivery-images', checkDeliveryImages);

// Check pre-delivery images for a stop (calls external API; same params, returns images with presignedUrl)
router.get('/check-pre-delivery-images', checkPreDeliveryImages);

export default router;
