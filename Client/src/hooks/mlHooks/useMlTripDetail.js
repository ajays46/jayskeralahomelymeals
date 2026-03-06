/**
 * useMlTripDetail - Fetch a single ML trip by id (for the logged-in delivery partner).
 */
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const TRIP_DETAIL_KEY = ['ml-trip-detail'];

export function useMlTripDetail(tripId, options = {}) {
  return useQuery({
    queryKey: [...TRIP_DETAIL_KEY, tripId],
    queryFn: async () => {
      const { data } = await api.get(`/ml-trips/${tripId}`);
      return data?.trip ?? null;
    },
    enabled: !!tripId,
    ...options,
  });
}
