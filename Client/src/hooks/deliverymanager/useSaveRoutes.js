import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

// Hook for saving routes
export const useSaveRoutes = () => {
  return useMutation({
    mutationFn: async ({ requestId }) => {
      const response = await axiosInstance.post('/admin/save-all-routes', {
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
