/**
 * useMlTripsByOrderId - Fetch ML trips by order ID (full or last 4/5 digits).
 * GET /api/ml-trips/by-order-id?order_id=<value>
 * Company sent via X-Company-ID by axios interceptor.
 */
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';

export function useMlTripsByOrderId(options = {}) {
  return useMutation({
    mutationFn: async ({ orderId } = {}) => {
      const order_id = (orderId ?? '').toString().trim();
      if (!order_id) {
        throw new Error('Order ID is required');
      }
      const { data } = await api.get('/ml-trips/by-order-id', {
        params: { order_id },
      });
      if (data && data.success === false) {
        throw new Error(data.error || data.message || 'No trips found');
      }
      return {
        trips: data?.trips ?? [],
        trip: data?.trip ?? (data?.trips?.length === 1 ? data.trips[0] : null),
        message: data?.message,
      };
    },
    ...options,
  });
}
