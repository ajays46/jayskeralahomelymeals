import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * Fetches manager–executive hierarchy for CXO (CEO, CFO, ADMIN).
 * GET /api/cxo/manager-executive-hierarchy
 * Query params: days (default 30), or start_date, end_date (per FRONTEND_DELIVERY_MANAGER_ISOLATION_GUIDE §3b).
 */
export const useManagerExecutiveHierarchy = (options = {}) => {
  const {
    days,
    start_date,
    end_date,
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 2 * 60 * 1000,
    ...queryOptions
  } = options;

  const params = {};
  if (days != null && days !== '') params.days = days;
  if (start_date) params.start_date = start_date;
  if (end_date) params.end_date = end_date;

  return useQuery({
    queryKey: ['cxo', 'manager-executive-hierarchy', params],
    queryFn: async () => {
      const response = await axiosInstance.get('/cxo/manager-executive-hierarchy', {
        params: Object.keys(params).length ? params : undefined
      });
      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || 'Failed to fetch hierarchy');
      }
      return response.data;
    },
    enabled,
    refetchOnWindowFocus,
    staleTime,
    ...queryOptions
  });
};
