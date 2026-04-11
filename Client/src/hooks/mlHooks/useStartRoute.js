/**
 * useStartRoute - Create route_id + stops for tracking (Flow C).
 * Calls backend POST /api/ml-trips/start-route which proxies to 5004 API.
 */
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

export const useStartRoute = (options = {}) => {
  return useMutation({
    mutationFn: async ({ platform, current_location } = {}) => {
      const payload = {};
      if (platform != null) payload.platform = platform;
      if (current_location && typeof current_location === 'object' && current_location.lat != null && current_location.lng != null) {
        payload.current_location = {
          lat: Number(current_location.lat),
          lng: Number(current_location.lng),
        };
      }
      const response = await api.post(`${API.MAX_ROUTE}/ml-trips/start-route`, payload);
      return response.data;
    },
    ...options,
  });
};

