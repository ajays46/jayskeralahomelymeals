import { createContactOnly, getUsersBySeller, getUserAddresses, createAddressForUser, getUserOrders, cancelDeliveryItem, deleteUser } from '../services/seller.service.js';

// Create contact only (for sellers)
export const createContactController = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, companyId } = req.body;
    const sellerId = req.user.userId; // Get seller ID from JWT token
    
    // Validate required fields
    if (!firstName || !lastName || !phoneNumber || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: firstName, lastName, phoneNumber, companyId'
      });
    }

    const result = await createContactOnly({ 
      firstName, 
      lastName, 
      phoneNumber, 
      sellerId, // Pass the seller ID to track who created this user
      companyId // Pass the company ID to assign the user to a company
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
    
    if (!addressData.street || !addressData.city || !addressData.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Street, city, and pincode are required'
      });
    }
    
    const newAddress = await createAddressForUser(userId, sellerId, addressData);
    
    res.status(201).json({
      success: true,
      message: 'Address created successfully for user',
      data: newAddress
    });
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
