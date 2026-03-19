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
 * useLiveVehiclePosition - GET /api/vehicle-tracking/live via Node proxy.
 * With vehicleNumber: adds ?vehicle_number=...
 * Without (null/''): backend resolves vehicle from JWT (logged-in driver).
 */
export const useLiveVehiclePosition = (vehicleNumber, options = {}) => {
  const vn = vehicleNumber != null ? String(vehicleNumber).trim() : '';
  const { enabled: enabledOverride, ...rest } = options;
  const defaultEnabled = vn.length > 0;
  return useQuery({
    queryKey: [...LIVE_VEHICLE_KEY, vn || '__auto__'],
    queryFn: async () => {
      const { data } = await api.get('/vehicle-tracking/live', vn ? { params: { vehicle_number: vn } } : undefined);
      return data;
    },
    enabled: enabledOverride !== undefined ? enabledOverride : defaultEnabled,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

