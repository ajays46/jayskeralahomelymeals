/**
 * useMlTripsList - Fetch ML delivery partner trips list with optional platform and status filters.
 * @param {{ platform?: string, status?: string }} filters - platform: swiggy|flipkart|amazon; status: pending|picked_up|delivered
 */
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const TRIPS_LIST_KEY = ['ml-trips-list'];

export function useMlTripsList(filters = {}, options = {}) {
  const { platform, status } = filters;
  return useQuery({
    queryKey: [...TRIPS_LIST_KEY, platform ?? 'all', status ?? 'all'],
    queryFn: async () => {
      const params = {};
      if (platform) params.platform = platform;
      if (status) params.status = status;
      const { data } = await api.get('/ml-trips', { params });
      return data?.trips ?? [];
    },
    ...options,
  });
}
