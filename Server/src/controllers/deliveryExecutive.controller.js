import { 
  createOrUpdateDeliveryExecutive, 
  getDeliveryExecutiveProfile, 
  uploadDeliveryExecutiveImage, 
  updateDeliveryExecutiveLocation,
  getAllDeliveryExecutives,
  deleteDeliveryExecutiveProfile
} from '../services/deliveryExecutive.service.js';

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

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in createOrUpdateProfile:', error);
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
      return res.status(404).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getProfile:', error);
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

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in uploadImage:', error);
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

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in updateLocation:', error);
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

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAllProfiles:', error);
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

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Combined endpoint for updating both image and location
export const updateDeliveryDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { imageData, location, latitude, longitude } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
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

    let result;

    // If image data is provided, upload image first
    if (imageData) {
      result = await uploadDeliveryExecutiveImage(userId, imageData);
    }

    // If location data is provided, update location
    if (location && latitude !== undefined && longitude !== undefined) {
      result = await updateDeliveryExecutiveLocation(userId, {
        location,
        latitude,
        longitude
      });
    }

    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Either image data or location data must be provided'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery details updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in updateDeliveryDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get delivery routes for a phone number
export const getRoutes = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
      
    
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
      res.json({
        success: true,
        message: 'No routes found for this delivery executive',
        data: []
      });
    } else if (!response.ok) {
      // Handle other errors
      throw new Error(`External API responded with status: ${response.status} - ${JSON.stringify(data)}`);
    } else {
      // Success case
      res.json({
        success: true,
        message: 'Routes fetched successfully',
        data: data
      });
    }

  } catch (error) {
    console.error('❌ Error in getRoutes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
};

