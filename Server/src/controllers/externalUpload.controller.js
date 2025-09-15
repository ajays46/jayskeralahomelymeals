import AppError from '../utils/AppError.js';
import { uploadImageToExternalAPI } from '../services/externalUpload.service.js';

// Upload image to external API
export const uploadImageToExternal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const file = req.file;

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


    const result = await uploadImageToExternalAPI(file, userId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Image uploaded to external service successfully',
        data: {
          url: result.url,
          externalData: result.data
        }
      });
    } else {
      // Don't treat external upload failure as an error
      // Just return the failure info so frontend can handle it
      res.status(200).json({
        success: false,
        message: 'External upload failed',
        error: result.error,
        status: result.status
      });
    }
  } catch (error) {
    console.error('External upload controller error:', error);
    next(error);
  }
};
