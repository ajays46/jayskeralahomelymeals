import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import useAuthStore from '../../stores/Zustand.store';

/**
 * Fetches ALL delivery executives from DB (not active-only), company-scoped when companyId is set.
 * Uses /admin/delivery-executives which returns users with DELIVERY_EXECUTIVE role
 * and names from Contact (firstName + lastName) when available.
 * Query key includes companyId so cache is per-company and we don't show another company's list.
 */
export const useAllDeliveryExecutivesFromDb = (options = {}) => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000,
    retry = 2,
    ...queryOptions
  } = options;

  const companyId = useAuthStore((state) => state.user?.companyId) ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') : null);
  const queryKey = ['allDeliveryExecutivesFromDb', companyId || 'all'];

  return useQuery({
    queryKey,
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
