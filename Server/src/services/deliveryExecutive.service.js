import prisma from '../models/index.js';
import { saveBase64Image } from './imageUpload.service.js';

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
