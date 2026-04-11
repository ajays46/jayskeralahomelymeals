/**
 * useUpdateDeliveryAddress - PATCH trip delivery address (from My Trips delivery stop card).
 * PATCH /api/ml-trips/:tripId/delivery-address
 * Body: { googleMapsUrl?, street?, housename?, city?, pincode?, geoLocation? }
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

const TRIPS_LIST_KEY = ['ml-trips-list'];
const TRIP_DETAIL_KEY = ['ml-trip-detail'];

export function useUpdateDeliveryAddress(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, ...addressData }) => {
      const { data } = await api.patch(`${API.MAX_ROUTE}/ml-trips/${tripId}/delivery-address`, addressData);
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
