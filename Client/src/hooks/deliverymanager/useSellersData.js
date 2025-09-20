import { useState, useCallback } from 'react';
import { message } from 'antd';
import axiosInstance from '../../api/axios';

export const useSellersData = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSellers: 0
  });

  const fetchSellersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get('/admin/sellers-with-orders');
      
      if (response.data.status === 'success') {
        const sellersData = response.data.data || [];
        
        setSellers(sellersData);
        
        // Calculate stats based on the original structure
        const totalOrders = sellersData.reduce((sum, seller) => sum + (seller.orderCount || 0), 0);
        const totalRevenue = sellersData.reduce((sum, seller) => sum + (seller.totalRevenue || 0), 0);
        const activeSellers = sellersData.filter(seller => seller.status === 'ACTIVE').length;
        
        setStats({
          totalSellers: sellersData.length,
          totalOrders,
          totalRevenue,
          activeSellers
        });
      } else {
        setError('Failed to fetch sellers data: Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching sellers data:', error);
      setError('Failed to load sellers data');
      message.error('Failed to load sellers data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancelAllOrdersForSeller = useCallback(async (sellerId) => {
    try {
      await axiosInstance.put(`/api/sellers/${sellerId}/cancel-all-orders`);
      message.success('All orders for this seller have been cancelled');
      // Refresh data
      await fetchSellersData();
    } catch (error) {
      console.error('Error cancelling all orders for seller:', error);
      message.error('Failed to cancel all orders for this seller');
    }
  }, [fetchSellersData]);

  return {
    sellers,
    loading,
    error,
    stats,
    fetchSellersData,
    handleCancelAllOrdersForSeller
  };
};
