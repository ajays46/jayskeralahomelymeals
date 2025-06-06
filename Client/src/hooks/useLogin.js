import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import { showLoginSuccess, showLoginError } from '../utils/toastConfig';

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);      
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        showLoginSuccess();
      }
    },
    onError: (error) => {
      // Get the error message from the server response
      const errorMessage = error.response?.data?.message 
      showLoginError({ response: { data: { message: errorMessage } } });
    }
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    },
    onError: (error) => {
      // Only show error if it's not a silent refresh
      if (!error.config?._retry) {
        const errorMessage = error.response?.data?.message || 'Session expired. Please login again.';
        showLoginError({ response: { data: { message: errorMessage } } });
      }
    }
  });
}; 