import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// API functions
const addressApi = {
  // Get all addresses
  getAddresses: async () => {
    const response = await api.get('/addresses');

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch addresses');
    }

    return response.data.data.addresses;
  },

  // Create new address
  createAddress: async (addressData) => {
    const response = await api.post('/addresses', addressData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create address');
    }

    return response.data.data.address;
  },

  // Update address
  updateAddress: async ({ id, addressData }) => {
    const response = await api.put(`/addresses/${id}`, addressData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update address');
    }

    return response.data.data.address;
  },

  // Delete address
  deleteAddress: async (id) => {
    const response = await api.delete(`/addresses/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete address');
    }

    return true;
  },

  // Get address by ID
  getAddressById: async (id) => {
    const response = await api.get(`/addresses/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch address');
    }

    return response.data.data.address;
  }
};

// Query keys
export const addressKeys = {
  all: ['addresses'],
  lists: () => [...addressKeys.all, 'list'],
  list: (filters) => [...addressKeys.lists(), { filters }],
  details: () => [...addressKeys.all, 'detail'],
  detail: (id) => [...addressKeys.details(), id]
};

// Custom hook for addresses
export const useAddresses = () => {
  return useQuery({
    queryKey: addressKeys.lists(),
    queryFn: addressApi.getAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Custom hook for a specific address
export const useAddressById = (id) => {
  return useQuery({
    queryKey: addressKeys.detail(id),
    queryFn: () => addressApi.getAddressById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Custom hook for creating address
export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressApi.createAddress,
    onSuccess: (newAddress) => {
      // Update the addresses list cache
      queryClient.setQueryData(addressKeys.lists(), (oldData) => {
        if (!oldData) return [newAddress];
        return [newAddress, ...oldData];
      });

      // Invalidate and refetch addresses list
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
    onError: (error) => {
      console.error('Error creating address:', error);
    }
  });
};

// Custom hook for updating address
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressApi.updateAddress,
    onSuccess: (updatedAddress) => {
      // Update the addresses list cache
      queryClient.setQueryData(addressKeys.lists(), (oldData) => {
        if (!oldData) return [updatedAddress];
        return oldData.map(addr => 
          addr.id === updatedAddress.id ? updatedAddress : addr
        );
      });

      // Update the specific address cache
      queryClient.setQueryData(
        addressKeys.detail(updatedAddress.id), 
        updatedAddress
      );

      // Invalidate and refetch addresses list
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
    onError: (error) => {
      console.error('Error updating address:', error);
    }
  });
};

// Custom hook for deleting address
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressApi.deleteAddress,
    onSuccess: (_, deletedId) => {
      // Update the addresses list cache
      queryClient.setQueryData(addressKeys.lists(), (oldData) => {
        if (!oldData) return [];
        return oldData.filter(addr => addr.id !== deletedId);
      });

      // Remove the specific address cache
      queryClient.removeQueries({ queryKey: addressKeys.detail(deletedId) });

      // Invalidate and refetch addresses list
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
    onError: (error) => {
      console.error('Error deleting address:', error);
    }
  });
};

// Main hook that combines all functionality
export const useAddress = () => {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
    error: addressesError,
    refetch: refetchAddresses
  } = useAddresses();

  // Mutations
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  // Helper functions
  const createAddress = async (addressData) => {
    try {
      const newAddress = await createAddressMutation.mutateAsync(addressData);
      return newAddress;
    } catch (error) {
      throw error;
    }
  };

  const updateAddress = async (id, addressData) => {
    try {
      const updatedAddress = await updateAddressMutation.mutateAsync({ id, addressData });
      return updatedAddress;
    } catch (error) {
      throw error;
    }
  };

  const deleteAddress = async (id) => {
    try {
      await deleteAddressMutation.mutateAsync(id);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
    queryClient.clear();
  };

  return {
    // Data
    addresses,
    isLoadingAddresses,
    addressesError,
    
    // Loading states for mutations
    isCreating: createAddressMutation.isPending,
    isUpdating: updateAddressMutation.isPending,
    isDeleting: deleteAddressMutation.isPending,
    
    // Error states for mutations
    createError: createAddressMutation.error,
    updateError: updateAddressMutation.error,
    deleteError: deleteAddressMutation.error,
    
    // Functions
    createAddress,
    updateAddress,
    deleteAddress,
    refetchAddresses,
    clearError
  };
};