import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    }
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    }
  });
}; 