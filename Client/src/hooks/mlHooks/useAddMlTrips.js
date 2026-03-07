/**
 * useAddMlTrips - Submit ML delivery partner trips to backend.
 * Creates ml_trips and ml_trip_addresses (pickup/delivery) for the ML company.
 */
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';

/**
 * @param {Object} options
 * @param {function} [options.onSuccess] - (data) => void
 * @param {function} [options.onError] - (error) => void
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useAddMlTrips = (options = {}) => {
  return useMutation({
    mutationFn: async (trips) => {
      if (!Array.isArray(trips) || trips.length === 0) {
        throw new Error('trips must be a non-empty array');
      }
      const payload = trips.map((t) => ({
        platform: t.platform,
        platformLabel: t.platformLabel,
        price: t.price,
        partnerPayment: t.partnerPayment,
        orderId: t.orderId ?? undefined,
        pickup: t.pickup,
        delivery: t.delivery,
      }));
      const response = await api.post('/ml-trips', { trips: payload });
      return response.data;
    },
    ...options,
  });
};
