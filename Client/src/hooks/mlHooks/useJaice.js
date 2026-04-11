/**
 * Jaice (ML Assistant) hooks - proxy via /api/ml-assistant to 5004.
 * Ref: JAICE_FRONTEND_GUIDE_5004.md
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';

const JAICE_KEYS = {
  greeting: ['ml-jaice', 'greeting'],
  ping: ['ml-jaice', 'ping'],
  debugConfig: ['ml-jaice', 'debug-config'],
};

export function useJaiceGreeting(options = {}) {
  return useQuery({
    queryKey: JAICE_KEYS.greeting,
    queryFn: async () => {
      const { data } = await api.get(`${API.JAICE}/ml-assistant/greeting`);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useJaicePing(options = {}) {
  return useQuery({
    queryKey: JAICE_KEYS.ping,
    queryFn: async () => {
      const { data } = await api.get(`${API.JAICE}/ml-assistant/chat/ping`);
      return data;
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useJaiceDebugConfig(options = {}) {
  return useQuery({
    queryKey: JAICE_KEYS.debugConfig,
    queryFn: async () => {
      const { data } = await api.get(`${API.JAICE}/ml-assistant/debug/config`);
      return data;
    },
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useJaiceChat(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messages, max_tokens = 512, temperature = 0.3 }) => {
      const { data } = await api.post(`${API.JAICE}/ml-assistant/chat`, {
        messages,
        max_tokens,
        temperature,
      });
      return data;
    },
    ...options,
  });
}

export { JAICE_KEYS };
