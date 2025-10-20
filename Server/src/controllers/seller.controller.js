import { createContactOnly, getUsersBySeller, getUserAddresses, createAddressForUser, deleteAddressForUser, getUserOrders, cancelDeliveryItem, deleteUser, updateCustomer } from '../services/seller.service.js';
import { cancelOrderService } from '../services/order.service.js';
import { saveAddressToExternalApi } from '../utils/externalApi.js';
import prisma from '../config/prisma.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Seller Controller - Handles seller-specific API endpoints and operations
 * Manages seller operations including customer management, order tracking, and analytics
 * Features: Customer management, order tracking, address management, seller analytics
 */

// Create contact only (for sellers)
export const createContactController = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;
    const sellerId = req.user.userId; // Get seller ID from JWT token
    
    // Validate required fields
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: firstName, lastName, phoneNumber'
      });
    }

    const result = await createContactOnly({ 
      firstName, 
      lastName, 
      phoneNumber, 
      address, // Pass the address data
      sellerId // Pass the seller ID to track who created this user
    });

    // Log that contact was created successfully
    logInfo(LOG_CATEGORIES.SYSTEM, 'Contact created successfully', {
      phoneNumber,
      firstName,
      contactId: result.contact.id,
      userId: result.user.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get seller's created users list
export const getSellerUsers = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    
    const users = await getUsersBySeller(sellerId);
    
    res.status(200).json({
      success: true,
      message: 'Seller users retrieved successfully',
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// Get addresses for a specific user created by the seller
export const getUserAddressesController = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    const { userId } = req.params; // Get user ID from URL params
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const addresses = await getUserAddresses(userId, sellerId);
    
    res.status(200).json({
      success: true,
      message: 'User addresses retrieved successfully',
      data: addresses
    });
  } catch (error) {
    next(error);
  }
};

// Create address for a specific user created by the seller
export const createUserAddressController = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    const { userId } = req.params; // Get user ID from URL params
    const addressData = req.body; // Get address data from request body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!addressData.googleMapsUrl && (!addressData.street || !addressData.city || !addressData.pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Either Google Maps URL or street, city, and pincode are required'
      });
    }
    
    const newAddress = await createAddressForUser(userId, sellerId, addressData);
    
    // Call external API to save address
    try {
      await saveAddressToExternalApi({
        id: newAddress.id,
        userId: userId,
        street: newAddress.street,
        housename: newAddress.housename,
        city: newAddress.city,
        pincode: newAddress.pincode,
        geoLocation: newAddress.geoLocation,
        googleMapsUrl: newAddress.googleMapsUrl,
        addressType: newAddress.addressType,
        createdAt: newAddress.createdAt,
        updatedAt: newAddress.updatedAt
      });
    } catch (externalError) {
      // Don't throw error - address was saved successfully in our database
    }
    
    res.status(201).json({
      success: true,
      message: 'Address created successfully for user',
      data: newAddress
    });
  } catch (error) {
    next(error);
  }
};

// Delete address for a specific user created by the seller
export const deleteUserAddressController = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    const { userId, addressId } = req.params; // Get user ID and address ID from URL params
    
    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Address ID are required'
      });
    }
    
    const success = await deleteAddressForUser(userId, addressId, sellerId);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Address deleted successfully for user'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Address not found or could not be deleted'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get user orders for a specific user created by the seller
export const getUserOrdersController = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    const { userId } = req.params; // Get user ID from URL params
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const orders = await getUserOrders(userId, sellerId);
    
    res.status(200).json({
      success: true,
      message: 'User orders retrieved successfully',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// Cancel delivery item for a specific user created by the seller
export const cancelDeliveryItemController = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    const { deliveryItemId } = req.params; // Get delivery item ID from URL params

    if (!deliveryItemId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery Item ID is required'
      });
    }

    const result = await cancelDeliveryItem(deliveryItemId, sellerId);

    res.status(200).json({
      success: true,
      message: 'Delivery item cancelled successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order for a specific user created by the seller
export const cancelOrderController = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    const { orderId } = req.params; // Get order ID from URL params

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const result = await cancelOrderService(orderId, sellerId, ['SELLER']);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Delete user for a specific user created by the seller
export const deleteUserController = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    const { userId } = req.params; // Get user ID from URL params

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await deleteUser(userId, sellerId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Update customer information (for sellers)
export const updateCustomerController = async (req, res, next) => {
  try {
    const sellerId = req.user.userId; // Get seller ID from JWT token
    const { userId } = req.params; // Get user ID from URL params
    const updateData = req.body; // Get update data from request body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const result = await updateCustomer(userId, sellerId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get seller profile
export const getSellerProfile = async (req, res, next) => {
  try {
    const sellerId = req.user.userId;
    
    res.status(200).json({
      success: true,
      message: 'Seller profile retrieved successfully',
      data: {
        id: sellerId,
        role: 'SELLER'
      }
    });
  } catch (error) {
    next(error);
    }
};


