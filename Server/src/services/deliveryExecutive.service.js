import prisma from '../models/index.js';
import { saveBase64Image } from './imageUpload.service.js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import sharp from 'sharp';

/**
 * Delivery Executive Service - Handles delivery executive profile and operations
 * Manages delivery executive profiles, location tracking, and delivery operations
 * Features: Profile management, location tracking, image upload, delivery status updates
 */

// Create or update delivery executive profile
export const createOrUpdateDeliveryExecutive = async (userId, data) => {
  try {
    const { imageUrl, location, latitude, longitude } = data;

    // Check if delivery executive profile already exists
    const existingProfile = await prisma.deliveryExecutive.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await prisma.deliveryExecutive.update({
        where: { userId },
        data: {
          imageUrl,
          location,
          latitude,
          longitude,
          updatedAt: new Date()
        }
      });
      return { success: true, data: updatedProfile, message: 'Profile updated successfully' };
    } else {
      // Create new profile
      const newProfile = await prisma.deliveryExecutive.create({
        data: {
          userId,
          imageUrl,
          location,
          latitude,
          longitude
        }
      });
      return { success: true, data: newProfile, message: 'Profile created successfully' };
    }
  } catch (error) {
    console.error('Error in createOrUpdateDeliveryExecutive:', error);
    throw new Error('Failed to create/update delivery executive profile: ' + error.message);
  }
};

// Get delivery executive profile by userId
export const getDeliveryExecutiveProfile = async (userId) => {
  try {
    const profile = await prisma.deliveryExecutive.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            auth: {
              select: {
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      }
    });

    if (!profile) {
      return { success: false, message: 'Profile not found' };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error in getDeliveryExecutiveProfile:', error);
    throw new Error('Failed to get delivery executive profile: ' + error.message);
  }
};

// Upload delivery executive image
export const uploadDeliveryExecutiveImage = async (userId, imageData) => {
  try {
    let imageUrl = null;

    if (imageData) {
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const filename = `delivery-exec-${userId}-${timestamp}-${randomSuffix}.jpg`;

      // Save image to uploads folder
      imageUrl = saveBase64Image(imageData, filename);
    }

    // Update profile with new image
    const updatedProfile = await createOrUpdateDeliveryExecutive(userId, {
      imageUrl,
      location: null,
      latitude: null,
      longitude: null
    });

    return { success: true, data: updatedProfile.data, message: 'Image uploaded successfully' };
  } catch (error) {
    console.error('Error in uploadDeliveryExecutiveImage:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
};

// Update delivery executive location
export const updateDeliveryExecutiveLocation = async (userId, locationData) => {
  try {
    const { location, latitude, longitude, address_id } = locationData;

    // If address_id is provided, update the Address table's geo_location
    if (address_id) {
      if (latitude === undefined || longitude === undefined) {
        throw new Error('Latitude and longitude are required when updating address');
      }

      // Import Prisma to update address
      const prisma = (await import('../config/prisma.js')).default;

      // Update the address geo_location
      const updatedAddress = await prisma.address.update({
        where: { id: address_id },
        data: {
          geoLocation: `${latitude},${longitude}`,
          googleMapsUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
          updatedAt: new Date()
        }
      });

      return { 
        success: true, 
        data: { address: updatedAddress }, 
        message: 'Address geo_location updated successfully' 
      };
    }

    // Original behavior: Update delivery executive profile location
    if (!location || latitude === undefined || longitude === undefined) {
      throw new Error('Location, latitude, and longitude are required');
    }

    // Update profile with new location
    const updatedProfile = await createOrUpdateDeliveryExecutive(userId, {
      imageUrl: null, // Don't change image
      location: JSON.stringify(location),
      latitude,
      longitude
    });

    return { success: true, data: updatedProfile.data, message: 'Location updated successfully' };
  } catch (error) {
    console.error('Error in updateDeliveryExecutiveLocation:', error);
    throw new Error('Failed to update location: ' + error.message);
  }
};

// Get all delivery executives
export const getAllDeliveryExecutives = async () => {
  try {
    const deliveryExecutives = await prisma.deliveryExecutive.findMany({
      include: {
        user: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            auth: {
              select: {
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, data: deliveryExecutives };
  } catch (error) {
    console.error('Error in getAllDeliveryExecutives:', error);
    throw new Error('Failed to get delivery executives: ' + error.message);
  }
};

// Delete delivery executive profile
export const deleteDeliveryExecutiveProfile = async (userId) => {
  try {
    const deletedProfile = await prisma.deliveryExecutive.delete({
      where: { userId }
    });

    return { success: true, data: deletedProfile, message: 'Profile deleted successfully' };
  } catch (error) {
    console.error('Error in deleteDeliveryExecutiveProfile:', error);
    throw new Error('Failed to delete profile: ' + error.message);
  }
};

// Upload delivery photo to external API
export const uploadDeliveryPhotoService = async (imageFile, addressId, session) => {
  try {
    if (!imageFile) {
      throw new Error('Image file is required');
    }

    if (!addressId) {
      throw new Error('Address ID is required');
    }

    if (!session) {
      throw new Error('Session is required');
    }

    // Convert session to uppercase (BREAKFAST, LUNCH, DINNER)
    const sessionUpper = session.toUpperCase();

    // Compress image if it's larger than 1.5MB to avoid external API 413 errors
    // External API nginx limit is around 2MB, so we compress to be safe
    const MAX_SIZE_FOR_EXTERNAL_API = 1.5 * 1024 * 1024; // 1.5MB
    let processedBuffer = imageFile.buffer;
    let processedMimeType = imageFile.mimetype;
    let processedFilename = imageFile.originalname;

    if (imageFile.size > MAX_SIZE_FOR_EXTERNAL_API) {
      try {
        console.log(`Compressing image from ${(imageFile.size / 1024 / 1024).toFixed(2)}MB...`);
        
        // Use sharp to compress the image
        // Resize if needed (max width 1920px, maintain aspect ratio)
        // Compress JPEG quality to 85% or PNG to reduce size
        let sharpInstance = sharp(imageFile.buffer);
        
        // Get image metadata
        const metadata = await sharpInstance.metadata();
        
        // Resize if image is very large (max 1920px width)
        if (metadata.width && metadata.width > 1920) {
          sharpInstance = sharpInstance.resize(1920, null, {
            withoutEnlargement: true,
            fit: 'inside'
          });
        }
        
        // Compress based on image type
        if (imageFile.mimetype === 'image/jpeg' || imageFile.mimetype === 'image/jpg') {
          processedBuffer = await sharpInstance
            .jpeg({ quality: 85, mozjpeg: true })
            .toBuffer();
          processedMimeType = 'image/jpeg';
          processedFilename = imageFile.originalname.replace(/\.(png|gif|webp)$/i, '.jpg');
        } else if (imageFile.mimetype === 'image/png') {
          processedBuffer = await sharpInstance
            .png({ quality: 85, compressionLevel: 9 })
            .toBuffer();
          processedMimeType = 'image/png';
        } else {
          // For other formats, convert to JPEG
          processedBuffer = await sharpInstance
            .jpeg({ quality: 85, mozjpeg: true })
            .toBuffer();
          processedMimeType = 'image/jpeg';
          processedFilename = imageFile.originalname.replace(/\.[^.]+$/, '.jpg');
        }
        
        // If still too large, reduce quality further
        if (processedBuffer.length > MAX_SIZE_FOR_EXTERNAL_API) {
          console.log(`Image still too large (${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB), reducing quality further...`);
          sharpInstance = sharp(imageFile.buffer);
          
          if (metadata.width && metadata.width > 1280) {
            sharpInstance = sharpInstance.resize(1280, null, {
              withoutEnlargement: true,
              fit: 'inside'
            });
          }
          
          processedBuffer = await sharpInstance
            .jpeg({ quality: 75, mozjpeg: true })
            .toBuffer();
          processedMimeType = 'image/jpeg';
          processedFilename = imageFile.originalname.replace(/\.[^.]+$/, '.jpg');
        }
        
        console.log(`Image compressed to ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      } catch (compressError) {
        console.error('Error compressing image, using original:', compressError);
        // If compression fails, use original (might still fail at external API)
        processedBuffer = imageFile.buffer;
      }
    }

    // Create FormData for external API using processed buffer
    const formData = new FormData();
    formData.append('image', processedBuffer, {
      filename: processedFilename,
      contentType: processedMimeType
    });
    formData.append('address_id', addressId);
    formData.append('session', sessionUpper);

    // Send to external API using fetch (port 5003)
    const externalApiUrl = `${process.env.AI_ROUTE_API_THIRD}/upload_delivery_pic`;
    const response = await fetch(externalApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mysecretkey123',
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      // Try to get error details from response body
      let errorDetails = '';
      try {
        const errorText = await response.text();
        errorDetails = errorText;
      } catch (e) {
        // Could not read error response body
      }
      
      throw new Error(`External API returned ${response.status}: ${response.statusText}. Details: ${errorDetails}`);
    }

    const responseData = await response.json();
    
    if (responseData && responseData.success) {
      return {
        success: true,
        message: 'Photo uploaded successfully to external API',
        externalResponse: responseData,
        fileInfo: {
          originalName: imageFile.originalname,
          size: imageFile.size,
          mimeType: imageFile.mimetype
        }
      };
    } else {
      throw new Error('External API returned unsuccessful response');
    }
  } catch (error) {
    console.error('Error in uploadDeliveryPhotoService:', error);
    if (error.message) {
      throw new Error('Failed to upload photo: ' + error.message);
    }
    throw new Error('Failed to upload photo to external API');
  }
};
