import { 
  createOrUpdateDeliveryExecutive, 
  getDeliveryExecutiveProfile, 
  uploadDeliveryExecutiveImage, 
  updateDeliveryExecutiveLocation,
  getAllDeliveryExecutives,
  deleteDeliveryExecutiveProfile,
  uploadDeliveryPhotoService,
  uploadPreDeliveryPhotoService,
  checkDeliveryImagesForStop,
  checkPreDeliveryImagesForStop,
  getAddressIdForStop
} from '../services/deliveryExecutive.service.js';
import { captureDeliveryProof } from '../services/captureProof.service.js';
import { logInfo, logError, LOG_CATEGORIES } from '../../../utils/criticalLogger.js';

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
    const { location, latitude, longitude, address_id } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // If address_id is provided, update the address geo_location
    if (address_id) {
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required when updating address'
        });
      }

      const result = await updateDeliveryExecutiveLocation(userId, {
        location,
        latitude,
        longitude,
        address_id
      });

      logInfo(LOG_CATEGORIES.SYSTEM, 'Address geo_location updated successfully', {
        userId: userId,
        address_id: address_id,
        latitude: latitude,
        longitude: longitude
      });

      return res.status(200).json(result);
    }

    // Original behavior: Update delivery executive profile location
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
      userId: req.params?.userId,
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

    // Make request to external API (include company_id for multi-tenant)
    const externalApiUrl = `${process.env.AI_ROUTE_API}/get-routes/${phoneNumber}`;
    const headers = {
      'Authorization': 'Bearer mysecretkey123',
      'Content-Type': 'application/json'
    };
    if (req.companyId) {
      headers['X-Company-ID'] = req.companyId;
    }
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers
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

// Get delivery routes by driver_id (query parameter)
export const getRoutesByDriverId = async (req, res) => {
  const { driver_id } = req.query;
  
  try {
    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: 'driver_id is required as query parameter'
      });
    }

    // Validate that AI_ROUTE_API_THIRD is configured
    if (!process.env.AI_ROUTE_API_THIRD) {
      logError(LOG_CATEGORIES.SYSTEM, 'AI_ROUTE_API_THIRD environment variable not configured');
      return res.status(500).json({
        success: false,
        message: 'External API configuration missing'
      });
    }

    // Make request to external API (include company_id for multi-tenant)
    const externalApiUrl = `${process.env.AI_ROUTE_API_THIRD}/api/executive/routes?driver_id=${driver_id}`;
    const headers = {
      'Authorization': 'Bearer mysecretkey123',
      'Content-Type': 'application/json'
    };
    if (req.companyId) {
      headers['X-Company-ID'] = req.companyId;
    }
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, get text to see what we received
      const textResponse = await response.text();
      
      logError(LOG_CATEGORIES.SYSTEM, 'External API returned non-JSON response', {
        driver_id: driver_id,
        status: response.status,
        contentType: contentType,
        responsePreview: textResponse.substring(0, 200)
      });
      
      return res.status(500).json({
        success: false,
        message: 'External API returned invalid response format',
        error: `Expected JSON but received ${contentType || 'unknown format'}`
      });
    }

    if (response.status === 404 && data.error && data.error.includes('No routes found')) {
      // Handle case where no routes are found - this is not an error
      logInfo(LOG_CATEGORIES.SYSTEM, 'No routes found for delivery executive', {
        driver_id: driver_id
      });
      return res.json({
        success: true,
        message: 'No routes found for this delivery executive',
        data: []
      });
    } else if (!response.ok) {
      // Handle other errors
      logError(LOG_CATEGORIES.SYSTEM, 'External API error when fetching routes by driver_id', {
        driver_id: driver_id,
        status: response.status,
        error: JSON.stringify(data)
      });
      return res.status(response.status || 500).json({
        success: false,
        message: data.message || data.error || 'Failed to fetch routes from external API',
        error: data
      });
    } else {
      // Success case - process data to add address_id to stops
      const routesData = data.data || data;
      
      // Process routes to add address_id to stops
      const processRoutesWithAddressId = async (routesData) => {
        if (!routesData || !routesData.routes || !Array.isArray(routesData.routes)) {
          return routesData;
        }
        
        const processedRoutes = await Promise.all(
          routesData.routes.map(async (route) => {
            if (!route.stops || !Array.isArray(route.stops)) {
              return route;
            }
            
            const processedStops = await Promise.all(
              route.stops.map(async (stop) => {
                const addressId = await getAddressIdForStop(
                  stop,
                  routesData.date || route.date,
                  route.session || stop.session
                );
                
                return {
                  ...stop,
                  address_id: addressId || stop.address_id || stop.Address_ID || stop.addressId || null
                };
              })
            );
            
            return {
              ...route,
              stops: processedStops
            };
          })
        );
        
        return {
          ...routesData,
          routes: processedRoutes
        };
      };
      
      // Process the routes data
      const processedData = await processRoutesWithAddressId(routesData);
      
      // Ensure proper response structure
      const responseData = {
        success: true,
        message: 'Routes fetched successfully',
        data: processedData
      };
      
      logInfo(LOG_CATEGORIES.SYSTEM, 'Routes fetched successfully from external API by driver_id', {
        driver_id: driver_id,
        routeCount: Array.isArray(processedData.routes) ? processedData.routes.length : (processedData?.routes?.length || 0)
      });
      
      return res.json(responseData);
    }

  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to fetch routes from external API by driver_id', {
      driver_id: driver_id,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
};

// Upload delivery photos/videos to external API
export const uploadDeliveryPhoto = async (req, res) => {
  try {
    const { address_id, session, date } = req.body;
    const files = req.files; // Array of files

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image or video file is required'
      });
    }

    if (!address_id) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required'
      });
    }

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Session is required (BREAKFAST, LUNCH, or DINNER)'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (YYYY-MM-DD format)'
      });
    }

    const result = await uploadDeliveryPhotoService(files, address_id, session, date, req.companyId);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery photos/videos uploaded successfully to external API', {
      address_id: address_id,
      session: session,
      date: date,
      fileCount: files.length,
      fileNames: files.map(f => f.originalname),
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Delivery photo/video upload failed', {
      address_id: req.body?.address_id,
      session: req.body?.session,
      date: req.body?.date,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to upload delivery photos/videos',
      error: error.message
    });
  }
};

// Upload pre-delivery photos/videos to external API (before delivery at stop) - same params as delivery photo: address_id, session, date
export const uploadPreDeliveryPhoto = async (req, res) => {
  try {
    const { address_id, session, date, comments } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image or video file is required'
      });
    }

    if (!address_id) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required'
      });
    }

    if (!session) {
      return res.status(400).json({
        success: false,
        message: 'Session is required (BREAKFAST, LUNCH, or DINNER)'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (YYYY-MM-DD format)'
      });
    }

    const result = await uploadPreDeliveryPhotoService(files, address_id, session, date, comments || '', req.companyId);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Pre-delivery photos/videos uploaded successfully to external API', {
      address_id: address_id,
      session: session,
      date: date,
      fileCount: files.length,
      fileNames: files.map(f => f.originalname)
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Pre-delivery photo/video upload failed', {
      address_id: req.body?.address_id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to upload pre-delivery photos/videos',
      error: error.message
    });
  }
};

// Check if delivery images exist for a specific stop
export const checkDeliveryImages = async (req, res) => {
  try {
    const { address_id, delivery_date, delivery_session } = req.query;

    if (!address_id) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required as query parameter'
      });
    }

    if (!delivery_date) {
      return res.status(400).json({
        success: false,
        message: 'Delivery date is required as query parameter (YYYY-MM-DD format)'
      });
    }

    if (!delivery_session) {
      return res.status(400).json({
        success: false,
        message: 'Delivery session is required as query parameter (BREAKFAST, LUNCH, or DINNER)'
      });
    }

    const result = await checkDeliveryImagesForStop(address_id, delivery_date, delivery_session);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Delivery images check completed', {
      address_id: address_id,
      delivery_date: delivery_date,
      delivery_session: delivery_session,
      hasImages: result.hasImages,
      imageCount: result.imageCount
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to check delivery images', {
      address_id: req.query?.address_id,
      delivery_date: req.query?.delivery_date,
      delivery_session: req.query?.delivery_session,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to check delivery images',
      error: error.message
    });
  }
};

// Check pre-delivery images for a stop (calls external API by address_id, delivery_session, delivery_date; returns same shape with presignedUrl)
export const checkPreDeliveryImages = async (req, res) => {
  try {
    const { address_id, delivery_date, delivery_session } = req.query;

    if (!address_id) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required as query parameter'
      });
    }

    if (!delivery_date) {
      return res.status(400).json({
        success: false,
        message: 'Delivery date is required as query parameter (YYYY-MM-DD format)'
      });
    }

    if (!delivery_session) {
      return res.status(400).json({
        success: false,
        message: 'Delivery session is required as query parameter (BREAKFAST, LUNCH, or DINNER)'
      });
    }

    const result = await checkPreDeliveryImagesForStop(address_id, delivery_date, delivery_session);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Pre-delivery images check completed', {
      address_id: address_id,
      delivery_date: delivery_date,
      delivery_session: delivery_session,
      hasImages: result.hasImages,
      imageCount: result.imageCount
    });

    res.status(200).json(result);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Failed to check pre-delivery images', {
      address_id: req.query?.address_id,
      delivery_date: req.query?.delivery_date,
      delivery_session: req.query?.delivery_session,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to check pre-delivery images',
      error: error.message
    });
  }
};

/**
 * Capture delivery proof card as PNG (Puppeteer backend).
 * Body: { session?, stop: { Stop_No, Delivery_Name, Location, Packages, delivery_note? }, options: { preDeliveryUploaded?, marked?, photoUploaded?, locationUpdated? } }
 * Returns: image/png
 */
export const captureProof = async (req, res) => {
  try {
    const payload = req.body || {};
    const buffer = await captureDeliveryProof(payload);
    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    });
    res.send(buffer);
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Capture proof failed', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Screenshot failed',
    });
  }
};

