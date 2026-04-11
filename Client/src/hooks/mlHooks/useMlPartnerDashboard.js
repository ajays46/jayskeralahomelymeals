/**
 * useMlPartnerDashboard - Fetch ML delivery partner dashboard stats (trips, revenue today/week/total, recent trips).
 * @param {string} [platform] - Optional: 'swiggy' | 'uber' | 'flipkart' | 'amazon' to filter by platform
 */
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

const DASHBOARD_QUERY_KEY = ['ml-partner-dashboard'];

export function useMlPartnerDashboard(platform, options = {}) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, platform ?? 'all'],
    queryFn: async () => {
      const params = platform ? { platform } : {};
      const { data } = await api.get(`${API.MAX_ROUTE}/ml-trips/dashboard`, { params });
      return data?.data ?? {};
    },
    ...options,
  });
}
