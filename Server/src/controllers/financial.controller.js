import { 
  getDailyRevenueService,
  getOrderStatusBreakdownService,
  getPaymentConfirmationRateService,
  getFinancialSummaryService
} from '../services/financial.service.js';

/**
 * Financial Controller - Handles financial analytics API endpoints
 * Manages daily revenue, order status breakdown, payment analytics, and financial summaries
 * Features: Revenue tracking, order analytics, payment confirmation rates, financial reporting
 */

// Get daily revenue data
export const getDailyRevenue = async (req, res, next) => {
  try {
    const dailyRevenueData = await getDailyRevenueService();
    
    res.status(200).json({
      success: true,
      message: 'Daily revenue data retrieved successfully',
      data: dailyRevenueData
    });
  } catch (error) {
    next(error);
  }
};

// Get order status breakdown for today
export const getOrderStatusBreakdown = async (req, res, next) => {
  try {
    const orderStatusData = await getOrderStatusBreakdownService();
    
    res.status(200).json({
      success: true,
      message: 'Order status breakdown retrieved successfully',
      data: orderStatusData
    });
  } catch (error) {
    next(error);
  }
};

// Get payment confirmation rate
export const getPaymentConfirmationRate = async (req, res, next) => {
  try {
    const paymentRateData = await getPaymentConfirmationRateService();
    
    res.status(200).json({
      success: true,
      message: 'Payment confirmation rate retrieved successfully',
      data: paymentRateData
    });
  } catch (error) {
    next(error);
  }
};

// Get comprehensive financial summary
export const getFinancialSummary = async (req, res, next) => {
  try {
    const period = req.query.period || 'week'; // Default to week if no period specified
    const financialData = await getFinancialSummaryService(period);
    
    res.status(200).json({
      success: true,
      message: 'Financial summary retrieved successfully',
      data: financialData
    });
  } catch (error) {
    next(error);
  }
};
