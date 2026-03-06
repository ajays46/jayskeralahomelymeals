/**
 * useMarkStop - Mark a stop reached (planned_stop_id preferred) (Flow C).
 * Calls backend POST /api/journey/mark-stop which proxies to 5004 API.
 * Backend injects driver_id from JWT.
 */
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';

export const useMarkStop = (options = {}) => {
  return useMutation({
    mutationFn: async ({ route_id, planned_stop_id, delivery_id, stop_order, status, comments, latitude, longitude } = {}) => {
      const payload = { route_id };
      if (planned_stop_id) payload.planned_stop_id = planned_stop_id;
      if (delivery_id) payload.delivery_id = delivery_id;
      if (stop_order != null) payload.stop_order = stop_order;
      if (status) payload.status = status;
      if (comments) payload.comments = comments;
      if (latitude != null) payload.latitude = Number(latitude);
      if (longitude != null) payload.longitude = Number(longitude);
      const response = await api.post('/journey/mark-stop', payload);
      return response.data;
    },
    ...options,
  });
};

