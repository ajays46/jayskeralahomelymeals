import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axios';

/**
 * Custom hook for fetching seller performance data
 * Provides seller analytics, performance metrics, and top performers
 */

export const useSellerPerformanceSummary = (period = 'all') => {
  const [summaryData, setSummaryData] = useState({
    totalSellers: 0,
    activeSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/seller-performance/summary?period=${period}`);
      if (response.data.success) {
        setSummaryData(response.data.data);
      } else {
        setError('Failed to fetch seller summary');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch seller summary');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summaryData, isLoading, error, refetch: fetchSummary };
};

export const useSellerPerformanceDetails = (period = 'all') => {
  const [sellersData, setSellersData] = useState({
    sellers: [],
    totalSellers: 0,
    activeSellers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/seller-performance/details?period=${period}`);
      if (response.data.success) {
        setSellersData(response.data.data);
      } else {
        setError('Failed to fetch seller details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch seller details');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { sellersData, isLoading, error, refetch: fetchDetails };
};

export const useTopPerformingSellers = (period = 'all', limit = 5) => {
  const [topPerformers, setTopPerformers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTopPerformers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/seller-performance/top-performers?period=${period}&limit=${limit}`);
      if (response.data.success) {
        setTopPerformers(response.data.data.topPerformers);
      } else {
        setError('Failed to fetch top performers');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch top performers');
    } finally {
      setIsLoading(false);
    }
  }, [period, limit]);

  useEffect(() => {
    fetchTopPerformers();
  }, [fetchTopPerformers]);

  return { topPerformers, isLoading, error, refetch: fetchTopPerformers };
};

// Combined hook for all seller performance data
export const useSellerPerformanceData = (period = 'all') => {
  const summary = useSellerPerformanceSummary(period);
  const details = useSellerPerformanceDetails(period);
  const topPerformers = useTopPerformingSellers(period);

  const isLoading = summary.isLoading || details.isLoading || topPerformers.isLoading;
  const error = summary.error || details.error || topPerformers.error;

  const refetchAll = useCallback(() => {
    summary.refetch();
    details.refetch();
    topPerformers.refetch();
  }, [summary.refetch, details.refetch, topPerformers.refetch]);

  return {
    summary: summary.summaryData,
    sellers: details.sellersData,
    topPerformers: topPerformers.topPerformers,
    isLoading,
    error,
    refetchAll
  };
};
