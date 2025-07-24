import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// API functions
const orderApi = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create order');
    }

    return response.data.data.order;
  },

  // Get user orders
  getUserOrders: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.orderTime) queryParams.append('orderTime', filters.orderTime);

    const response = await api.get(`/orders?${queryParams.toString()}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch orders');
    }

    return response.data.data.orders;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch order');
    }

    return response.data.data.order;
  },

  // Update order status
  updateOrderStatus: async ({ orderId, status }) => {
    const response = await api.put(`/orders/${orderId}/status`, { status }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update order status');
    }

    return response.data.data.order;
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to cancel order');
    }

    return response.data.data.order;
  }
};

// Query keys
export const orderKeys = {
  all: ['orders'],
  lists: () => [...orderKeys.all, 'list'],
  list: (filters) => [...orderKeys.lists(), { filters }],
  details: () => [...orderKeys.all, 'detail'],
  detail: (id) => [...orderKeys.details(), id]
};

// Custom hook for user orders
export const useUserOrders = (filters = {}) => {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => orderApi.getUserOrders(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Custom hook for a specific order
export const useOrderById = (orderId) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderApi.getOrderById(orderId),
    enabled: !!orderId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Custom hook for creating order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: orderApi.createOrder,
    onSuccess: (newOrder) => {
      // Update the orders list cache
      queryClient.setQueryData(orderKeys.lists(), (oldData) => {
        if (!oldData) return [newOrder];
        return [newOrder, ...oldData];
      });

      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Error creating order:', error);
    }
  });
};

// Custom hook for updating order status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: orderApi.updateOrderStatus,
    onSuccess: (updatedOrder) => {
      // Update the orders list cache
      queryClient.setQueryData(orderKeys.lists(), (oldData) => {
        if (!oldData) return [updatedOrder];
        return oldData.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
      });

      // Update the specific order cache
      queryClient.setQueryData(
        orderKeys.detail(updatedOrder.id), 
        updatedOrder
      );

      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
    }
  });
};

// Custom hook for cancelling order
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: orderApi.cancelOrder,
    onSuccess: (cancelledOrder) => {
      // Update the orders list cache
      queryClient.setQueryData(orderKeys.lists(), (oldData) => {
        if (!oldData) return [cancelledOrder];
        return oldData.map(order => 
          order.id === cancelledOrder.id ? cancelledOrder : order
        );
      });

      // Update the specific order cache
      queryClient.setQueryData(
        orderKeys.detail(cancelledOrder.id), 
        cancelledOrder
      );

      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Error cancelling order:', error);
    }
  });
};

// Main hook that combines all functionality
export const useOrder = () => {
  const queryClient = useQueryClient();

  // Mutations
  const createOrderMutation = useCreateOrder();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();

  // Helper functions
  const createOrder = async (orderData) => {
    try {
      const newOrder = await createOrderMutation.mutateAsync(orderData);
      return newOrder;
    } catch (error) {
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const updatedOrder = await updateOrderStatusMutation.mutateAsync({ orderId, status });
      return updatedOrder;
    } catch (error) {
      throw error;
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const cancelledOrder = await cancelOrderMutation.mutateAsync(orderId);
      return cancelledOrder;
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
    queryClient.clear();
  };

  return {
    // Loading states for mutations
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderStatusMutation.isPending,
    isCancelling: cancelOrderMutation.isPending,
    
    // Error states for mutations
    createError: createOrderMutation.error,
    updateError: updateOrderStatusMutation.error,
    cancelError: cancelOrderMutation.error,
    
    // Functions
    createOrder,
    updateOrderStatus,
    cancelOrder,
    clearError
  };
}; 