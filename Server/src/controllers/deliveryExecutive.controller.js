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

    // Make request to external API
    const externalApiUrl = `${process.env.AI_ROUTE_API_THIRD}/api/executive/routes?driver_id=${driver_id}`;
    
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mysecretkey123',
        'Content-Type': 'application/json'
      }
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
      
      // Import Prisma to fetch address_id from delivery items
      const prisma = (await import('../config/prisma.js')).default;
      
      // Helper function to get address_id for a stop
      const getAddressIdForStop = async (stop, date, session) => {
        try {
          // Parse the date from stop (handle GMT format)
          const stopDate = stop.date ? new Date(stop.date) : (date ? new Date(date) : null);
          if (!stopDate || isNaN(stopDate.getTime())) {
            return null;
          }
          
          // Set to start of day for comparison
          const startOfDay = new Date(stopDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(stopDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          // Map session to deliveryTimeSlot format
          const sessionMap = {
            'BREAKFAST': 'BREAKFAST',
            'LUNCH': 'LUNCH',
            'DINNER': 'DINNER',
            'breakfast': 'BREAKFAST',
            'lunch': 'LUNCH',
            'dinner': 'DINNER'
          };
          const deliveryTimeSlot = sessionMap[session] || session?.toUpperCase() || stop.session?.toUpperCase();
          
          // Try to find delivery item by matching delivery_name with user name
          // First, try to find user by name (delivery_name is usually the customer name)
          const deliveryName = stop.delivery_name || stop.deliveryName || stop.Delivery_Name;
          if (!deliveryName) {
            return null;
          }
          
          // Find user by name (check firstName, lastName, or name field)
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { firstName: { contains: deliveryName, mode: 'insensitive' } },
                { lastName: { contains: deliveryName, mode: 'insensitive' } },
                { name: { contains: deliveryName, mode: 'insensitive' } }
              ]
            },
            select: { id: true }
          });
          
          if (user) {
            // Find delivery item for this user, date, and session
            const deliveryItem = await prisma.deliveryItem.findFirst({
              where: {
                userId: user.id,
                deliveryDate: {
                  gte: startOfDay,
                  lte: endOfDay
                },
                deliveryTimeSlot: deliveryTimeSlot
              },
              select: { addressId: true },
              orderBy: { createdAt: 'desc' }
            });
            
            if (deliveryItem && deliveryItem.addressId) {
              return deliveryItem.addressId;
            }
          }
          
          return null;
        } catch (error) {
          // Silently fail - return null if can't fetch
          console.warn(`Could not fetch address_id for stop:`, error.message);
          return null;
        }
      };
      
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

