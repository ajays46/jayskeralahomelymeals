import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * Fetches ALL delivery managers from DB.
 * Uses /admin/delivery-managers which returns users with DELIVERY_MANAGER role
 * and names from Contact (firstName + lastName) when available.
 * Used by CXO view (CEO/CFO) on Delivery Manager dashboard.
 */
export const useAllDeliveryManagersFromDb = (options = {}) => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000,
    retry = 2,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ['allDeliveryManagersFromDb'],
    queryFn: async () => {
      const response = await axiosInstance.get('/admin/delivery-managers');
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to fetch delivery managers');
      }
      return response.data;
    },
    enabled,
    refetchOnWindowFocus,
    staleTime,
    retry,
    ...queryOptions
  });
};
