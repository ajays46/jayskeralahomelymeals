import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig.jsx';

// Query keys
export const vehicleKeys = {
  all: ['vehicles'],
  lists: () => [...vehicleKeys.all, 'list'],
  list: (filters) => [...vehicleKeys.lists(), filters],
  details: () => [...vehicleKeys.all, 'detail'],
  detail: (id) => [...vehicleKeys.details(), id],
};

// Fetch vehicles hook
export const useVehicles = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.user_id) {
        params.append('user_id', filters.user_id);
      }
      
      const response = await axiosInstance.get(`/admin/vehicles?${params.toString()}`);
      return response.data;
    },
    ...options
  });
};

// Assign vehicle to executive hook
export const useAssignVehicle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ vehicleId, userId }) => {
      const response = await axiosInstance.post('/admin/vehicles/assign', {
        vehicleId,
        userId
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      // Also invalidate active executives to refresh the vehicle display
      queryClient.invalidateQueries({ queryKey: ['activeExecutives'] });
      showSuccessToast(data.message || 'Vehicle assigned successfully');
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.message || 'Failed to assign vehicle');
    }
  });
};

// Unassign vehicle from executive hook
export const useUnassignVehicle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ vehicleId, userId }) => {
      const response = await axiosInstance.post('/admin/vehicles/unassign', {
        vehicleId,
        userId // Optional - service will use vehicle.user_id if not provided
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      // Also invalidate active executives to refresh the vehicle display
      queryClient.invalidateQueries({ queryKey: ['activeExecutives'] });
      showSuccessToast(data.message || 'Vehicle unassigned successfully');
    },
    onError: (error) => {
      showErrorToast(error.response?.data?.message || 'Failed to unassign vehicle');
    }
  });
};

