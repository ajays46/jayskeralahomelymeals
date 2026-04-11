import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import { API } from '../../api/endpoints';

// Hook for saving routes
export const useSaveRoutes = () => {
  return useMutation({
    mutationFn: async ({ requestId }) => {
      const response = await axiosInstance.post(`${API.ADMIN}/save-all-routes`, {
        requestId: requestId
      });
      return response.data;
    },
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error('Error saving routes:', error);
    }
  });
};

export default useSaveRoutes;
