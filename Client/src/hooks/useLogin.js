import { useMutation,useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { showLoginSuccess, showLoginError } from '../utils/toastConfig';
import useAuthStore from '../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRole = useAuthStore((state) => state.setRole);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);  
      console.log(response.data,"response.data");
      
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const role = data.data.role;
        setAccessToken(data.accessToken);
        setRole(role);
        setUser(data.data);
        showLoginSuccess();
        navigate('/home');
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