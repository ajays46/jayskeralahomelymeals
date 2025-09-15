import express from 'express';
import multer from 'multer';
import { uploadImageToExternal } from '../controllers/externalUpload.controller.js';
import { authenticateToken } from '../middleware/authHandler.js';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload image to external API
router.post('/upload-image', authenticateToken, upload.single('image'), uploadImageToExternal);

export default router;
