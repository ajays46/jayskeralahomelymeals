import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/authHandler.js';
import { 
    createDeliveryItemsAfterPayment,
    getDeliveryItemsByOrder, 
    updateDeliveryItemStatus,
    updateDeliveryItemAddress,
    uploadDeliveryImage,
    getDeliveryItemStatus
} from '../controllers/deliveryItem.controller.js';

const router = express.Router();

// Configure multer for memory storage (no local file saving)
const upload = multer({
    storage: multer.memoryStorage(), // Store in memory instead of disk
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

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create delivery items after payment confirmation
router.post('/orders/:orderId/delivery-items-after-payment', createDeliveryItemsAfterPayment);

// Get delivery items for an order
router.get('/orders/:orderId/delivery-items', getDeliveryItemsByOrder);

// Update delivery item status
router.patch('/delivery-items/:deliveryItemId/status', updateDeliveryItemStatus);

// Update delivery item address
router.put('/delivery-items/:deliveryItemId/address', updateDeliveryItemAddress);

// Upload delivery image
router.post('/delivery-items/upload-image', upload.single('image'), uploadDeliveryImage);
router.get('/delivery-items/status/:deliveryItemId', getDeliveryItemStatus);

export default router;
