import { validateCustomerToken, getCustomerOrders, getCustomerAddresses, getCustomerOrderSummary, setupCustomerPassword } from '../services/customerAccess.service.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Customer Access Controller - Handles customer portal API endpoints
 * Provides read-only access to customer order information and status
 * Features: Token validation, order status viewing, delivery tracking
 */

// Validate customer token and get basic info
export const validateCustomerTokenController = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const customerInfo = await validateCustomerToken(token);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Customer token validated successfully', {
      userId: customerInfo.userId,
      customerName: customerInfo.customerName
    });

    res.status(200).json({
      success: true,
      message: 'Token validated successfully',
      data: customerInfo
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Customer token validation failed', {
      error: error.message,
      token: req.query.token ? 'provided' : 'missing'
    });
    next(error);
  }
};

// Get customer orders
export const getCustomerOrdersController = async (req, res, next) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const customerInfo = await validateCustomerToken(token);
    const orders = await getCustomerOrders(customerInfo.userId);

    res.status(200).json({
      success: true,
      message: 'Customer orders retrieved successfully',
      data: {
        customer: customerInfo,
        orders: orders
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get customer order summary
export const getCustomerOrderSummaryController = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const customerInfo = await validateCustomerToken(token);
    const summary = await getCustomerOrderSummary(customerInfo.userId);

    res.status(200).json({
      success: true,
      message: 'Customer order summary retrieved successfully',
      data: {
        customer: customerInfo,
        summary: summary
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get customer addresses
export const getCustomerAddressesController = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const customerInfo = await validateCustomerToken(token);
    const addresses = await getCustomerAddresses(customerInfo.userId);

    res.status(200).json({
      success: true,
      message: 'Customer addresses retrieved successfully',
      data: {
        customer: customerInfo,
        addresses: addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Setup customer password
export const setupCustomerPasswordController = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    await setupCustomerPassword(token, password);

    logInfo(LOG_CATEGORIES.SYSTEM, 'Customer password setup successfully', {
      token: 'provided'
    });

    res.status(200).json({
      success: true,
      message: 'Password set successfully'
    });
  } catch (error) {
    logError(LOG_CATEGORIES.SYSTEM, 'Customer password setup failed', {
      error: error.message,
      token: req.query.token ? 'provided' : 'missing'
    });
    next(error);
  }
};
