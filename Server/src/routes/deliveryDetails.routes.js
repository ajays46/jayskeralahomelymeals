import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/delivery-details';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'delivery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'), false);
    }
  }
});

// Upload delivery photo and location - Simple daily update system
router.post('/:userId/delivery-details', upload.single('image'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { location, latitude, longitude } = req.body;
    
    // Validate inputs
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    if (!location || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location, latitude, and longitude are required'
      });
    }

    // Simple upsert: create if not exists, update if exists
    const deliveryExecutive = await prisma.deliveryExecutive.upsert({
      where: { userId: userId },
      update: {
        // Update with new data (overwrites previous)
        imageUrl: req.file.filename,
        location: location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updatedAt: new Date()
      },
      create: {
        // Create new record if doesn't exist
        userId: userId,
        imageUrl: req.file.filename,
        location: location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });



    res.json({
      success: true,
      message: 'Delivery details saved successfully',
      data: {
        imageUrl: req.file.filename,
        location: location,
        latitude: deliveryExecutive.latitude,
        longitude: deliveryExecutive.longitude,
        timestamp: deliveryExecutive.updatedAt
      }
    });

  } catch (error) {
    console.error('Error saving delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save delivery details',
      error: error.message
    });
  }
});

// Get delivery executive current status
router.get('/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const deliveryExecutive = await prisma.deliveryExecutive.findUnique({
      where: { userId: userId },
      select: {
        imageUrl: true,
        location: true,
        latitude: true,
        longitude: true,
        updatedAt: true
      }
    });

    if (!deliveryExecutive) {
      return res.json({
        success: true,
        data: {
          imageUrl: null,
          location: null,
          latitude: null,
          longitude: null,
          updatedAt: null,
          message: 'No delivery details yet. Upload your first delivery details to get started!'
        }
      });
    }

    res.json({
      success: true,
      data: deliveryExecutive
    });

  } catch (error) {
    console.error('Error fetching delivery executive status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status',
      error: error.message
    });
  }
});

export default router;
