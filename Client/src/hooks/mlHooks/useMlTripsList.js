/**
 * useMlTripsList - Fetch ML delivery partner trips list (proxied to 5004 API).
 * Filters: platform (swiggy|flipkart|amazon), status (pending|picked_up|delivered).
 * Ref: FRONTEND_API_INTEGRATION_GUIDE_5004.md — GET /api/ml-trips?user_id=&platform=SWIGGY
 */
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

const TRIPS_LIST_KEY = ['ml-trips-list'];

export function useMlTripsList(filters = {}, options = {}) {
  const { platform, status } = filters;
  return useQuery({
    queryKey: [...TRIPS_LIST_KEY, platform ?? 'all', status ?? 'all'],
    queryFn: async () => {
      const params = {};
      if (platform) params.platform = platform;
      if (status) params.status = status;
      const { data } = await api.get(`${API.MAX_ROUTE}/ml-trips`, { params });
      if (data && data.success === false) {
        throw new Error(data.error || 'Failed to load trips');
      }
      return data?.trips ?? [];
    },
    ...options,
  });
}
