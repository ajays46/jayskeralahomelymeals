import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * Fetches ALL delivery executives from DB (not active-only).
 * Uses /admin/delivery-executives which returns users with DELIVERY_EXECUTIVE role
 * and names from Contact (firstName + lastName) when available.
 */
export const useAllDeliveryExecutivesFromDb = (options = {}) => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000,
    retry = 2,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ['allDeliveryExecutivesFromDb'],
    queryFn: async () => {
      const response = await axiosInstance.get('/admin/delivery-executives');
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to fetch delivery executives');
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
