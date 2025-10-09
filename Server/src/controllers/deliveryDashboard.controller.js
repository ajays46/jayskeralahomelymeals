import { 
  getDeliveryDashboardSummary,
  getDeliveryExecutivesPerformance,
  getDeliveryTimeAnalytics,
  getDeliveryFailureAnalysis,
  getRealTimeDeliveryStatus
} from '../services/deliveryDashboard.service.js';

/**
 * Delivery Dashboard Controller - Handles delivery analytics API endpoints
 * Provides comprehensive delivery insights, executive performance, and operational metrics
 * Features: Dashboard summary, executive performance, time analytics, failure analysis, real-time status
 */

// Get delivery dashboard summary
export const getDeliverySummary = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    
    const result = await getDeliveryDashboardSummary(period);
    
    res.status(200).json({
      success: true,
      message: 'Delivery dashboard summary retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getDeliverySummary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve delivery dashboard summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get delivery executives performance
export const getExecutivesPerformance = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    
    const result = await getDeliveryExecutivesPerformance(period);
    
    res.status(200).json({
      success: true,
      message: 'Delivery executives performance retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getExecutivesPerformance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve delivery executives performance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get delivery time analytics
export const getTimeAnalytics = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    
    const result = await getDeliveryTimeAnalytics(period);
    
    res.status(200).json({
      success: true,
      message: 'Delivery time analytics retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getTimeAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve delivery time analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get delivery failure analysis
export const getFailureAnalysis = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    
    const result = await getDeliveryFailureAnalysis(period);
    
    res.status(200).json({
      success: true,
      message: 'Delivery failure analysis retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getFailureAnalysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve delivery failure analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get real-time delivery status
export const getRealTimeStatus = async (req, res, next) => {
  try {
    const result = await getRealTimeDeliveryStatus();
    
    res.status(200).json({
      success: true,
      message: 'Real-time delivery status retrieved successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error in getRealTimeStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve real-time delivery status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
