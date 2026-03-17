/**
 * useVehicleTracking - Send GPS tracking points (Flow C).
 * Calls backend POST /api/vehicle-tracking which proxies to 5004 API.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
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

const LIVE_VEHICLE_KEY = ['ml', 'vehicle-tracking', 'live'];

/**
 * useLiveVehiclePosition - Fetch live vehicle position from 5004 via Node proxy.
 * GET /api/vehicle-tracking/live?vehicle_number=...
 * Returns 5004 response: { active, location: { latitude, longitude, address }, device_details, status, ... }.
 * Use refetchInterval to poll (e.g. 10000 for every 10s). Only runs when vehicle_number is truthy.
 */
export const useLiveVehiclePosition = (vehicleNumber, options = {}) => {
  return useQuery({
    queryKey: [...LIVE_VEHICLE_KEY, vehicleNumber || ''],
    queryFn: async () => {
      const { data } = await api.get('/vehicle-tracking/live', {
        params: { vehicle_number: vehicleNumber },
      });
      return data;
    },
    enabled: !!vehicleNumber && typeof vehicleNumber === 'string' && vehicleNumber.trim().length > 0,
    refetchOnWindowFocus: false,
    ...options,
  });
};

