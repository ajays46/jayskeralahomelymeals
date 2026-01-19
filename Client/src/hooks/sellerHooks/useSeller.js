import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import useAuthStore from '../../stores/Zustand.store';

/**
 * useSeller - Custom hook for seller-specific operations and data management
 * Handles seller profile management, customer operations, and seller-specific API calls
 * Features: Profile management, customer CRUD, order tracking, seller analytics
 */
export const useSeller = () => {
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerUsers, setSellerUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { accessToken, roles } = useAuthStore();

  const isSeller = roles?.includes('SELLER');

  // Get seller profile
  const getSellerProfile = async () => {
    if (!isSeller) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get('/seller/profile');
      if (response.data.success) {
        setSellerProfile(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch seller profile');
    } finally {
      setLoading(false);
    }
  };

  // Get seller's created users
  const getSellerUsers = async () => {
    // Force the function to run even if isSeller check fails
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get('/seller/users');
      if (response.data.success) {
        setSellerUsers(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch seller users');
    } finally {
      setLoading(false);
    }
  };

  // Create contact
  const createContact = async (contactData) => {
    if (!isSeller) {
      throw new Error('Only sellers can create contacts');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post('/seller/create-contact', contactData);
      if (response.data.success) {
        // Refresh the users list
        await getSellerUsers();
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update customer
  const updateCustomer = async (userId, updateData) => {
    if (!isSeller) {
      throw new Error('Only sellers can update customers');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.put(`/seller/users/${userId}`, updateData);
      
      if (response.data.success) {
        // Refresh the users list
        await getSellerUsers();
        return response.data;
      } else {
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get user orders
  const getUserOrders = async (userId) => {
    if (!isSeller) {
      throw new Error('Only sellers can view user orders');
    }
    
    try {
      const response = await axiosInstance.get(`/seller/users/${userId}/orders`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch user orders';
      throw new Error(errorMessage);
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    if (!isSeller) {
      throw new Error('Only sellers can cancel orders');
    }
    
    try {
      const response = await axiosInstance.put(`/seller/orders/${orderId}/cancel`);
      if (response.data.success) {
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel order';
      throw new Error(errorMessage);
    }
  };

  // Cancel delivery item
  const cancelDeliveryItem = async (itemId) => {
    if (!isSeller) {
      throw new Error('Only sellers can cancel delivery items');
    }
    
    try {
      const response = await axiosInstance.put(`/seller/delivery-items/${itemId}/cancel`);
      if (response.data.success) {
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel delivery item';
      throw new Error(errorMessage);
    }
  };

  // Update delivery note
  const updateDeliveryNote = async (orderId, deliveryNote) => {
    if (!isSeller) {
      throw new Error('Only sellers can update delivery notes');
    }
    
    try {
      const response = await axiosInstance.put(`/seller/orders/${orderId}/delivery-note`, {
        deliveryNote: deliveryNote || null
      });
      if (response.data.success) {
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update delivery note';
      throw new Error(errorMessage);
    }
  };

  // Update delivery note for delivery items by date
  const updateDeliveryItemsNoteByDate = async (orderId, deliveryDate, deliveryNote) => {
    if (!isSeller) {
      throw new Error('Only sellers can update delivery notes');
    }
    
    try {
      const response = await axiosInstance.put(`/seller/orders/${orderId}/delivery-items-note`, {
        deliveryDate: deliveryDate,
        deliveryNote: deliveryNote || null
      });
      if (response.data.success) {
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update delivery items note';
      throw new Error(errorMessage);
    }
  };

  // Update delivery note for delivery items by date range and session
  const updateDeliveryItemsNoteByDateRange = async (orderId, fromDate, toDate, deliveryNote, deliveryTimeSlot = null) => {
    if (!isSeller) {
      throw new Error('Only sellers can update delivery notes');
    }
    
    try {
      const response = await axiosInstance.put(`/seller/orders/${orderId}/delivery-items-note-range`, {
        fromDate: fromDate,
        toDate: toDate,
        deliveryNote: deliveryNote || null,
        deliveryTimeSlot: deliveryTimeSlot || null
      });
      if (response.data.success) {
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update delivery items note';
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (isSeller) {
      getSellerProfile();
      getSellerUsers();
    }
  }, [isSeller]);

  return {
    sellerProfile,
    sellerUsers,
    loading,
    error,
    isSeller,
    getSellerProfile,
    getSellerUsers,
    createContact,
    updateCustomer,
    getUserOrders,
    cancelOrder,
    cancelDeliveryItem,
    updateDeliveryNote,
    updateDeliveryItemsNoteByDate,
    updateDeliveryItemsNoteByDateRange,
    refreshData: () => {
      getSellerProfile();
      getSellerUsers();
    }
  };
};
