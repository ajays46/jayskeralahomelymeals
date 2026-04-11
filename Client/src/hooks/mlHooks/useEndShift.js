/**
 * useEndShift - End delivery partner shift (go offline) (Flow C step 8).
 * Calls backend POST /api/shift/end which proxies to 5004 API.
 */
import { useMutation } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

export const useEndShift = (options = {}) => {
  return useMutation({
    mutationFn: async ({ platform } = {}) => {
      const payload = {};
      if (platform != null) payload.platform = platform;
      const response = await api.post(`${API.MAX_ROUTE}/shift/end`, payload);
      return response.data;
    },
    ...options,
  });
};

