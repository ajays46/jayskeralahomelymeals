import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axios';

/**
 * Simplified delivery dashboard hook - Only summary and executives performance
 * Provides essential delivery analytics and executive performance metrics
 * Features: Dashboard summary, executive performance only
 */

export const useDeliveryDashboard = (period = 'all') => {
  const [dashboardData, setDashboardData] = useState({
    // Executive metrics
    totalExecutives: 0,
    activeExecutives: 0,
    inactiveExecutives: 0,
    
    // Delivery metrics
    totalDeliveryItems: 0,
    deliveredItems: 0,
    pendingItems: 0,
    confirmedItems: 0,
    cancelledItems: 0,
    deliverySuccessRate: 0,
    
    // Performance metrics
    averageDeliveryTime: 0,
    
    // Breakdowns
    timeSlotBreakdown: [],
    statusBreakdown: [],
    
    // Location analytics
    topLocations: [],
    
    // Period info
    period,
    startDate: null,
    endDate: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/delivery-dashboard/summary?period=${period}`);
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to fetch dashboard summary');
      }
    } catch (err) {
      console.error('Error fetching delivery dashboard summary:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard summary');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  return {
    dashboardData,
    isLoading,
    error,
    refetch: fetchDashboardSummary
  };
};

export const useDeliveryExecutivesPerformance = (period = 'all') => {
  const [executivesData, setExecutivesData] = useState({
    executives: [],
    totalExecutives: 0,
    activeExecutives: 0,
    period,
    startDate: null,
    endDate: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExecutivesPerformance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/delivery-dashboard/executives-performance?period=${period}`);
      
      if (response.data.success) {
        setExecutivesData(response.data.data);
      } else {
        setError('Failed to fetch executives performance');
      }
    } catch (err) {
      console.error('Error fetching executives performance:', err);
      setError(err.response?.data?.message || 'Failed to fetch executives performance');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchExecutivesPerformance();
  }, [fetchExecutivesPerformance]);

  return {
    executivesData,
    isLoading,
    error,
    refetch: fetchExecutivesPerformance
  };
};

// Combined hook for summary and executives only
export const useDeliveryDashboardData = (period = 'all') => {
  const dashboard = useDeliveryDashboard(period);
  const executives = useDeliveryExecutivesPerformance(period);

  const isLoading = dashboard.isLoading || executives.isLoading;
  const error = dashboard.error || executives.error;

  const refetchAll = useCallback(() => {
    dashboard.refetch();
    executives.refetch();
  }, [dashboard.refetch, executives.refetch]);

  return {
    dashboard: dashboard.dashboardData,
    executives: executives.executivesData,
    timeAnalytics: { timeSlotAnalysis: {}, hourlyPatterns: [], locationSuccessRates: [] },
    failureAnalysis: { totalFailures: 0, failureRate: 0, failureByTimeSlot: [], failureByLocation: [], recentFailures: [] },
    realTimeStatus: { totalDeliveries: 0, completedDeliveries: 0, inProgressDeliveries: 0, failedDeliveries: 0, completionRate: 0, statusGroups: { Pending: [], Confirmed: [], Delivered: [], Cancelled: [] }, lastUpdated: null },
    isLoading,
    error,
    refetchAll
  };
};
