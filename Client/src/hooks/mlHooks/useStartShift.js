/**
 * useStartShift - Start delivery partner shift (driver goes online).
 * Calls backend POST /api/ml-trips/shift/start which proxies to external API (AI_ROUTE_API_FOURTH).
 * Body: platform (e.g. 'swiggy'), current_location?: { lat, lng }, vehicle_number?: string (registration number).
 * user_id and company_id are taken from auth (X-Company-ID and JWT) on the backend.
 */
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';

/**
 * @param {Object} options
 * @param {function} [options.onSuccess] - (data) => void
 * @param {function} [options.onError] - (error) => void
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useStartShift = (options = {}) => {
  return useMutation({
    mutationFn: async ({ platform, current_location, vehicle_number } = {}) => {
      const payload = {};
      if (platform != null) payload.platform = platform;
      if (current_location && typeof current_location === 'object' && (current_location.lat != null && current_location.lng != null)) {
        payload.current_location = {
          lat: Number(current_location.lat),
          lng: Number(current_location.lng),
        };
      }
      if (vehicle_number != null && String(vehicle_number).trim()) payload.vehicle_number = String(vehicle_number).trim();
      const response = await api.post('/ml-trips/shift/start', payload);
      return response.data;
    },
    ...options,
  });
};
