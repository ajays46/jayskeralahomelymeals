import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

// Custom hook for updating executive status using React Query
export const useUpdateExecutiveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusUpdates) => {
      const response = await axiosInstance.post('/admin/update-executive-status', {
        updates: statusUpdates
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update executive status');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      
      // Invalidate and refetch active executives to get updated data
      queryClient.invalidateQueries({ queryKey: ['activeExecutives'] });
    },
    onError: (error) => {
      console.error('Error updating executive status:', error);
    }
  });
};

// Hook for updating multiple executive statuses
export const useUpdateMultipleExecutiveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statusUpdates) => {
      const response = await axiosInstance.post('/admin/update-executive-status', {
        updates: statusUpdates
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update executive statuses');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      
      // Invalidate and refetch active executives to get updated data
      queryClient.invalidateQueries({ queryKey: ['activeExecutives'] });
    },
    onError: (error) => {
      console.error('Error updating multiple executive statuses:', error);
    }
  });
};
