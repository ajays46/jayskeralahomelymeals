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
      throw new Error(response.data.message || 'Failed to delete order');
    }

    return response.data;
  },

  // Calculate menu pricing
  calculateMenuPricing: async ({ menuId, orderMode }) => {
    const response = await api.post('/orders/calculate-menu-pricing', {
      menuId,
      orderMode
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to calculate menu pricing');
    }

    return response.data.data;
  },

  // Calculate order total
  calculateOrderTotal: async ({ menuId, selectedDates, skipMeals, orderMode, dateMenuSelections }) => {
    const response = await api.post('/orders/calculate-order-total', {
      menuId,
      selectedDates,
      skipMeals,
      orderMode,
      dateMenuSelections
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to calculate order total');
    }

    return response.data.data;
  },

  // Create payment
  createPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create payment');
    }

    return response.data;
  },

  // Cancel order (direct API call)
  cancelOrder: async (orderId) => {
    const response = await api.delete(`/orders/${orderId}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete order');
    }

    return response.data;
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
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Custom hook for menu pricing calculation
export const useCalculateMenuPricing = () => {
  return useMutation({
    mutationFn: orderApi.calculateMenuPricing,
    onError: (error) => {
      console.error('Menu pricing calculation error:', error);
      // Note: Admin blocking errors should be handled by the component using this hook
    }
  });
};

// Custom hook for order total calculation
export const useCalculateOrderTotal = () => {
  return useMutation({
    mutationFn: orderApi.calculateOrderTotal,
    onError: (error) => {
      console.error('Order total calculation error:', error);
      // Note: Admin blocking errors should be handled by the component using this hook
    }
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
    onSuccess: (response) => {
      // Remove the order from cache since it's deleted
      queryClient.setQueryData(orderKeys.lists(), (oldData) => {
        if (!oldData) return [];
        return oldData.filter(order => order.id !== response.data.orderId);
      });

      // Remove the specific order from cache
      queryClient.removeQueries({ queryKey: orderKeys.detail(response.data.orderId) });

      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
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

// Export direct API functions for use in components
export const { createPayment, cancelOrder } = orderApi; 