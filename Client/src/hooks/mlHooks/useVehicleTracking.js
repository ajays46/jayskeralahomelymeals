/**
 * useVehicleTracking - Send GPS tracking points (Flow C).
 * Calls backend POST /api/vehicle-tracking which proxies to 5004 API.
 */
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';

export const useVehicleTracking = (options = {}) => {
  return useMutation({
    mutationFn: async ({ route_id, tracking_points } = {}) => {
      const payload = { route_id, tracking_points };
      const response = await api.post('/vehicle-tracking', payload);
      return response.data;
    },
    ...options,
  });
};

