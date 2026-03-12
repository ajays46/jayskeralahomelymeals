/**
 * useUpdateMlTripStatus - PATCH trip status (picked_up | delivered), proxied to 5004 API.
 * Ref: FRONTEND_API_INTEGRATION_GUIDE_5004.md — PATCH /api/ml-trips/<trip_id>
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
      if (data && data.success === false) {
        throw new Error(data.error || 'Failed to update trip status');
      }
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
