/**
 * useMlTripDetail - Fetch a single ML trip by id (proxied to 5004 API).
 * Ref: FRONTEND_API_INTEGRATION_GUIDE_5004.md — GET /api/ml-trips/<trip_id>
 */
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

const TRIP_DETAIL_KEY = ['ml-trip-detail'];

export function useMlTripDetail(tripId, options = {}) {
  return useQuery({
    queryKey: [...TRIP_DETAIL_KEY, tripId],
    queryFn: async () => {
      const { data } = await api.get(`${API.MAX_ROUTE}/ml-trips/${tripId}`);
      if (data && data.success === false) {
        throw new Error(data.error || 'Trip not found');
      }
      return data?.trip ?? null;
    },
    enabled: !!tripId,
    ...options,
  });
}
