import { 
  getSellerPerformanceSummary, 
  getSellerPerformanceDetails, 
  getTopPerformingSellers 
} from '../services/sellerPerformance.service.js';

/**
 * Seller Performance Dashboard Controller
 * Handles API requests for seller performance analytics
 */

// Get seller performance summary
export const getSellerSummary = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    const result = await getSellerPerformanceSummary(period);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get detailed seller performance
export const getSellerDetails = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    const result = await getSellerPerformanceDetails(period);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get top performing sellers
export const getTopSellers = async (req, res, next) => {
  try {
    const { period = 'all', limit = 5 } = req.query;
    const result = await getTopPerformingSellers(period, parseInt(limit));
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
