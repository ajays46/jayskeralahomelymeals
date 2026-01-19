import { getManagementDashboardSummary } from '../services/managementDashboard.service.js';

/**
 * Management Dashboard Controller - Handles management dashboard API endpoints
 * Provides high-level business metrics for CEO and CFO roles
 * Features: Revenue, users, orders, delivery executives, growth metrics
 */

// Get management dashboard summary
export const getDashboardSummary = async (req, res, next) => {
  try {
    const dashboardData = await getManagementDashboardSummary();
    
    res.status(200).json({
      success: true,
      message: 'Management dashboard summary retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Error in getDashboardSummary controller:', error);
    next(error);
  }
};
