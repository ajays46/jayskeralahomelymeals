import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axios';

/**
 * Custom hook for delivery dashboard data management
 * Provides comprehensive delivery analytics and performance metrics
 * Features: Dashboard summary, executive performance, time analytics, failure analysis, real-time status
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

export const useDeliveryTimeAnalytics = (period = 'all') => {
  const [timeAnalyticsData, setTimeAnalyticsData] = useState({
    timeSlotAnalysis: {
      Breakfast: { total: 0, delivered: 0, pending: 0, cancelled: 0, avgTime: 0 },
      Lunch: { total: 0, delivered: 0, pending: 0, cancelled: 0, avgTime: 0 },
      Dinner: { total: 0, delivered: 0, pending: 0, cancelled: 0, avgTime: 0 }
    },
    hourlyPatterns: [],
    locationSuccessRates: [],
    totalDeliveries: 0,
    period,
    startDate: null,
    endDate: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/delivery-dashboard/time-analytics?period=${period}`);
      
      if (response.data.success) {
        setTimeAnalyticsData(response.data.data);
      } else {
        setError('Failed to fetch time analytics');
      }
    } catch (err) {
      console.error('Error fetching time analytics:', err);
      setError(err.response?.data?.message || 'Failed to fetch time analytics');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchTimeAnalytics();
  }, [fetchTimeAnalytics]);

  return {
    timeAnalyticsData,
    isLoading,
    error,
    refetch: fetchTimeAnalytics
  };
};

export const useDeliveryFailureAnalysis = (period = 'all') => {
  const [failureData, setFailureData] = useState({
    totalFailures: 0,
    failureRate: 0,
    failureByTimeSlot: [],
    failureByLocation: [],
    recentFailures: [],
    period,
    startDate: null,
    endDate: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFailureAnalysis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/delivery-dashboard/failure-analysis?period=${period}`);
      
      if (response.data.success) {
        setFailureData(response.data.data);
      } else {
        setError('Failed to fetch failure analysis');
      }
    } catch (err) {
      console.error('Error fetching failure analysis:', err);
      setError(err.response?.data?.message || 'Failed to fetch failure analysis');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchFailureAnalysis();
  }, [fetchFailureAnalysis]);

  return {
    failureData,
    isLoading,
    error,
    refetch: fetchFailureAnalysis
  };
};

export const useRealTimeDeliveryStatus = () => {
  const [realTimeData, setRealTimeData] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    inProgressDeliveries: 0,
    failedDeliveries: 0,
    completionRate: 0,
    statusGroups: {
      Pending: [],
      Confirmed: [],
      Delivered: [],
      Cancelled: []
    },
    lastUpdated: null,
    currentTime: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRealTimeStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axiosInstance.get('/delivery-dashboard/real-time-status');
      
      if (response.data.success) {
        setRealTimeData(response.data.data);
      } else {
        setError('Failed to fetch real-time status');
      }
    } catch (err) {
      console.error('Error fetching real-time status:', err);
      setError(err.response?.data?.message || 'Failed to fetch real-time status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealTimeStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchRealTimeStatus, 30000);
    
    return () => clearInterval(interval);
  }, [fetchRealTimeStatus]);

  return {
    realTimeData,
    isLoading,
    error,
    refetch: fetchRealTimeStatus
  };
};

// Combined hook for all delivery dashboard data
export const useDeliveryDashboardData = (period = 'all') => {
  const dashboard = useDeliveryDashboard(period);
  const executives = useDeliveryExecutivesPerformance(period);
  const timeAnalytics = useDeliveryTimeAnalytics(period);
  const failureAnalysis = useDeliveryFailureAnalysis(period);
  const realTimeStatus = useRealTimeDeliveryStatus();

  const isLoading = dashboard.isLoading || executives.isLoading || 
                   timeAnalytics.isLoading || failureAnalysis.isLoading || 
                   realTimeStatus.isLoading;

  const error = dashboard.error || executives.error || 
               timeAnalytics.error || failureAnalysis.error || 
               realTimeStatus.error;

  const refetchAll = useCallback(() => {
    dashboard.refetch();
    executives.refetch();
    timeAnalytics.refetch();
    failureAnalysis.refetch();
    realTimeStatus.refetch();
  }, [dashboard.refetch, executives.refetch, timeAnalytics.refetch, 
      failureAnalysis.refetch, realTimeStatus.refetch]);

  return {
    dashboard: dashboard.dashboardData,
    executives: executives.executivesData,
    timeAnalytics: timeAnalytics.timeAnalyticsData,
    failureAnalysis: failureAnalysis.failureData,
    realTimeStatus: realTimeStatus.realTimeData,
    isLoading,
    error,
    refetchAll
  };
};
