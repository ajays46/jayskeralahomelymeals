import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';
import useAuthStore from '../../stores/Zustand.store';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig.jsx';

/**
 * Coordinator API functions (multi-tenant: X-Company-ID per FRONTEND_COORDINATOR_GUIDE.md)
 */
const coordinatorApi = {
  getSettings: async () => {
    const companyId = useAuthStore.getState().user?.companyId;
    const headers = {};
    if (companyId) headers['X-Company-ID'] = companyId;
    const response = await axiosInstance.get('/ai-routes/coordinator/settings', {
      headers,
      params: companyId ? { company_id: companyId } : undefined
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch Coordinator settings');
    }
    return response.data;
  },

  updateSettings: async (updates) => {
    const companyId = useAuthStore.getState().user?.companyId;
    const headers = {};
    if (companyId) headers['X-Company-ID'] = companyId;
    const response = await axiosInstance.put('/ai-routes/coordinator/settings', updates, {
      headers
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update Coordinator settings');
    }
    return response.data;
  }
};

/**
 * Hook to fetch Coordinator settings
 */
export const useCoordinatorSettings = (options = {}) => {
  return useQuery({
    queryKey: ['coordinator', 'settings'],
    queryFn: coordinatorApi.getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Hook to update Coordinator settings
 */
export const useUpdateCoordinatorSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coordinatorApi.updateSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coordinator', 'settings'] });
      showSuccessToast(data.message || 'Coordinator settings updated successfully');
    },
    onError: (error) => {
      showErrorToast(error.message || 'Failed to update Coordinator settings');
    }
  });
};

/**
 * Main hook that combines all Coordinator functionality
 */
export const useCoordinator = () => {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings
  } = useCoordinatorSettings();

  // Mutations
  const updateSettingsMutation = useUpdateCoordinatorSettings();

  // Helper functions
  const updateSettings = async (updates) => {
    try {
      const result = await updateSettingsMutation.mutateAsync(updates);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
    queryClient.clear();
  };

  return {
    // Data
    settings: settingsData?.settings || null,
    descriptions: settingsData?.description || null,
    settingsData: settingsData || null,
    companyId: settingsData?.company_id || null,
    isLoadingSettings,
    settingsError,
    
    // Loading states for mutations
    isUpdating: updateSettingsMutation.isPending,
    
    // Error states for mutations
    updateError: updateSettingsMutation.error,
    
    // Functions
    updateSettings,
    refetchSettings,
    clearError
  };
};
