/**
 * useUpdateMlTripStatus - PATCH trip status (picked_up | delivered).
 * Invalidates trip detail and trips list on success.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

const TRIPS_LIST_KEY = ['ml-trips-list'];
const TRIP_DETAIL_KEY = ['ml-trip-detail'];

export function useUpdateMlTripStatus(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, trip_status }) => {
      const { data } = await api.patch(`/ml-trips/${tripId}`, { trip_status });
      return data;
    },
    onSuccess: (data, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: TRIP_DETAIL_KEY });
      queryClient.invalidateQueries({ queryKey: [...TRIP_DETAIL_KEY, tripId] });
      queryClient.invalidateQueries({ queryKey: TRIPS_LIST_KEY });
    },
    ...options,
  });
}
