import { useMutation,useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { showLoginSuccess, showLoginError } from '../../utils/toastConfig';
import useAuthStore from '../../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRole = useAuthStore((state) => state.setRole);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);       
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const role = data.data.role;
        setAccessToken(data.accessToken);
        setRole(role);
        setUser(data.data);
        // showLoginSuccess();
        navigate('/');
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.toLowerCase().includes('invalid')) {
        // Do not show Toastify for invalid credentials, let Login.jsx handle it inline
        return;
      }
      showLoginError({ response: { data: { message: errorMessage } } });
    }
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/refresh-token');
      console.log(response, "response refresh");
      
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

export const useUsersList = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/auth/home');
      return response.data;
    }
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (identifier) => {
      const response = await api.post('/auth/forgot-password', { identifier });
      return response.data;
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to send reset link.';
      showLoginError({ response: { data: { message: errorMessage } } });
    }
  });
};