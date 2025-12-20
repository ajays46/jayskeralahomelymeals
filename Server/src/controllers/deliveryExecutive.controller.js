import { 
  createOrUpdateDeliveryExecutive, 
  getDeliveryExecutiveProfile, 
  uploadDeliveryExecutiveImage, 
  updateDeliveryExecutiveLocation,
  getAllDeliveryExecutives,
  deleteDeliveryExecutiveProfile
} from '../services/deliveryExecutive.service.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Delivery Executive Controller - Handles delivery executive API endpoints and operations
 * Manages delivery executive profiles, location tracking, and delivery operations
 * Features: Profile management, location updates, image uploads, delivery tracking
 */

// Create or update delivery executive profile
export const createOrUpdateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageUrl, location, latitude, longitude } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await createOrUpdateDeliveryExecutive(userId, {
      imageUrl,
      location,
      latitude,
      longitude
    });

    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery executive profile created/updated successfully', {
      userId: userId,
      hasImage: !!imageUrl,
      hasLocation: !!(location && latitude && longitude)
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery executive profile creation/update failed', {
      userId: userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get delivery executive profile
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await getDeliveryExecutiveProfile(userId);

    if (!result.success) {
      logError(LOG_CATEGORIES.SYSTEM, 'Delivery executive profile not found', {
        userId: userId
      });
      return res.status(404).json(result);
    }

    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery executive profile retrieved successfully', {
      userId: userId
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery executive profile retrieval failed', {
      userId: userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Upload delivery executive image
export const uploadImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageData } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    // First check if delivery executive profile exists
    const existingProfile = await getDeliveryExecutiveProfile(userId);
    if (!existingProfile.success) {
      return res.status(404).json({
        success: false,
        message: 'Delivery executive profile not found. Please contact admin to create your profile first.'
      });
    }

    const result = await uploadDeliveryExecutiveImage(userId, imageData);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery executive image uploaded successfully', {
      userId: userId,
      hasImageData: !!imageData
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery executive image upload failed', {
      userId: userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update delivery executive location
export const updateLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { location, latitude, longitude } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!location || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Location, latitude, and longitude are required'
      });
    }

    // First check if delivery executive profile exists
    const existingProfile = await getDeliveryExecutiveProfile(userId);
    if (!existingProfile.success) {
      return res.status(404).json({
        success: false,
        message: 'Delivery executive profile not found. Please contact admin to create your profile first.'
      });
    }

    const result = await updateDeliveryExecutiveLocation(userId, {
      location,
      latitude,
      longitude
    });

    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery executive location updated successfully', {
      userId: userId,
      location: location,
      latitude: latitude,
      longitude: longitude
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery executive location update failed', {
      userId: userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all delivery executives
export const getAllProfiles = async (req, res) => {
  try {
    const result = await getAllDeliveryExecutives();

    logInfo(LOG_CATEGORIES.SYSTEM, 'All delivery executive profiles retrieved successfully', {
      count: result?.data?.length || 0
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to retrieve all delivery executive profiles', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete delivery executive profile
export const deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await deleteDeliveryExecutiveProfile(userId);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery executive profile deleted successfully', {
      userId: userId
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery executive profile deletion failed', {
      userId: userId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Get delivery routes for a phone number
export const getRoutes = async (req, res) => {
  const { phoneNumber } = req.params;
  try {
      
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Make request to external API
    const externalApiUrl = `${process.env.AI_ROUTE_API}/get-routes/${phoneNumber}`;
    
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mysecretkey123',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.status === 404 && data.error && data.error.includes('No routes found')) {
      // Handle case where no routes are found - this is not an error
      logInfo(LOG_CATEGORIES.SYSTEM, 'No routes found for delivery executive', {
        phoneNumber: phoneNumber
      });
      res.json({
        success: true,
        message: 'No routes found for this delivery executive',
        data: []
      });
    } else if (!response.ok) {
      // Handle other errors
      logError(LOG_CATEGORIES.SYSTEM, 'External API error when fetching routes', {
        phoneNumber: phoneNumber,
        status: response.status,
        error: JSON.stringify(data)
      });
      throw new Error(`External API responded with status: ${response.status} - ${JSON.stringify(data)}`);
    } else {
      // Success case
      logInfo(LOG_CATEGORIES.SYSTEM, 'Routes fetched successfully from external API', {
        phoneNumber: phoneNumber,
        routeCount: data?.length || 0
      });
      res.json({
        success: true,
        message: 'Routes fetched successfully',
        data: data
      });
    }

  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch routes from external API', {
      phoneNumber: phoneNumber,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
};

