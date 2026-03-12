/**
 * useVehicles - Fetch all vehicles for delivery partner vehicle selection (no user filter).
 * GET /api/ml-trips/vehicles
 */
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

export const VEHICLES_QUERY_KEY = ['ml-vehicles'];

export function useVehicles(options = {}) {
  return useQuery({
    queryKey: VEHICLES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/ml-trips/vehicles');
      return data?.data ?? [];
    },
    ...options,
  });
}
