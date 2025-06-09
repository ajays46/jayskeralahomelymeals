import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import { showLoginSuccess, showLoginError } from '../utils/toastConfig';
import useAuthStore from '../stores/Zustand.store';

export const useLogin = () => {

  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);  
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setAccessToken(data.accessToken);
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
      if (!error.config?._retry) {
        const errorMessage = error.response?.data?.message || 'Session expired. Please login again.';
        showLoginError({ response: { data: { message: errorMessage } } });
      }
    }
  });
}; 