import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import axiosInstance from '../../api/axios';
import useAuthStore from '../../stores/Zustand.store';

// Custom hook for fetching active executives using React Query (company-scoped when companyId is set)
export const useActiveExecutives = (options = {}) => {
  const {
    enabled = true, // Whether the query should run automatically
    refetchOnWindowFocus = false, // Don't refetch when window regains focus
    staleTime = 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime = 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry = 3, // Retry failed requests 3 times
    retryDelay = 1000, // Wait 1 second between retries
    onSuccess,
    onError,
    ...queryOptions
  } = options;

  const companyId = useAuthStore((state) => state.user?.companyId) ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') : null);
  const queryKey = ['activeExecutives', companyId || 'all'];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await axiosInstance.get('/admin/active-executives');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch active executives');
      }
      
      return response.data;
    },
    enabled,
    refetchOnWindowFocus,
    staleTime,
    cacheTime,
    retry,
    retryDelay,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error fetching active executives:', error);
      onError?.(error);
    },
    ...queryOptions
  });
};

// Hook for manually triggering a refetch
export const useActiveExecutivesRefetch = () => {
  const { refetch, isFetching } = useActiveExecutives({ enabled: false });
  
  return {
    refetchActiveExecutives: refetch,
    isRefetching: isFetching
  };
};

// Hook with optimistic updates (if needed in the future)
export const useActiveExecutivesWithOptimisticUpdate = () => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useActiveExecutives();

  const updateExecutives = useCallback((newExecutives) => {
    const cid = useAuthStore.getState().user?.companyId ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') : null);
    const key = ['activeExecutives', cid || 'all'];
    queryClient.setQueryData(key, (oldData) => ({
      ...oldData,
      data: {
        ...oldData?.data,
        executives: newExecutives
      }
    }));
  }, [queryClient]);
  
  return {
    data,
    isLoading,
    error,
    refetch,
    updateExecutives
  };
};
