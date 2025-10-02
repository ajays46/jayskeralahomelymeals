import AppError from '../utils/AppError.js';
import { uploadImageToExternalAPI } from '../services/externalUpload.service.js';

/**
 * External Upload Controller - Handles external API integration for image processing
 * Manages image uploads to external services and API communication
 * Features: External API integration, image processing, file validation, error handling
 */

// Upload image to external API
export const uploadImageToExternal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const file = req.file;
    const expectedAmount = req.body.expected_amount;
    // Expected amount for validation
    if (!file) {
      throw new AppError('Image file is required', 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Only JPG and PNG images are allowed', 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new AppError('File size must be less than 5MB', 400);
    }

    // Validate expected amount
    if (!expectedAmount || isNaN(parseFloat(expectedAmount))) {
      throw new AppError('Expected amount is required and must be a valid number', 400);
    }

    const result = await uploadImageToExternalAPI(file, userId, expectedAmount);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Image uploaded to external service successfully',
        data: {
          url: result.url,
          s3_url: result.data?.s3_url || result.data?.url,
          externalData: result.data
        },
        s3_url: result.data?.s3_url || result.data?.url // Also include at root level for compatibility
      });
    } else {
      // External validation failed - return error to prevent payment completion
      res.status(400).json({
        success: false,
        message: 'Payment receipt verification failed',
        error: result.error,
        details: result.details || [],
        status: result.status
      });
    }
  } catch (error) {
    // External upload controller error
    next(error);
  }
};
