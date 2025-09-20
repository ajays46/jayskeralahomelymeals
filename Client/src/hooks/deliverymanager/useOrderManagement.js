import { useState, useCallback } from 'react';
import { message } from 'antd';
import axiosInstance from '../../api/axios';

export const useOrderManagement = () => {
  const [deliveryItems, setDeliveryItems] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    itemId: null,
    title: '',
    content: ''
  });

  const fetchDeliveryItems = useCallback(async (orderId) => {
    if (deliveryItems[orderId]) return; // Already fetched
    
    setLoadingItems(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await axiosInstance.get(`/api/orders/${orderId}/delivery-items`);
      setDeliveryItems(prev => ({
        ...prev,
        [orderId]: response.data.data || []
      }));
    } catch (error) {
      console.error('Error fetching delivery items:', error);
      message.error('Failed to fetch delivery items');
    } finally {
      setLoadingItems(prev => ({ ...prev, [orderId]: false }));
    }
  }, [deliveryItems]);

  const handleCancelOrder = useCallback(async (orderId) => {
    try {
      await axiosInstance.put(`/api/orders/${orderId}/cancel`);
      message.success('Order cancelled successfully');
      // Refresh data or update state as needed
    } catch (error) {
      console.error('Error cancelling order:', error);
      message.error('Failed to cancel order');
    }
  }, []);

  const handleCancelDeliveryItem = useCallback(async (itemId) => {
    try {
      await axiosInstance.put(`/api/delivery-items/${itemId}/cancel`);
      message.success('Delivery item cancelled successfully');
      // Update local state or refresh data
    } catch (error) {
      console.error('Error cancelling delivery item:', error);
      message.error('Failed to cancel delivery item');
    }
  }, []);

  const showCancelConfirmation = useCallback((orderId) => {
    setConfirmationModal({
      visible: true,
      itemId: orderId,
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order? This action cannot be undone.'
    });
  }, []);

  const handleCancelClick = useCallback((item) => {
    setConfirmationModal({
      visible: true,
      itemId: item.id,
      title: 'Cancel Delivery Item',
      content: `Are you sure you want to cancel delivery item "${item.itemName}"?`
    });
  }, []);

  const closeCancelItemModal = useCallback(() => {
    setConfirmationModal({
      visible: false,
      itemId: null,
      title: '',
      content: ''
    });
  }, []);

  const handleConfirmationOK = useCallback(async () => {
    if (confirmationModal.itemId) {
      if (confirmationModal.title === 'Cancel Order') {
        await handleCancelOrder(confirmationModal.itemId);
      } else if (confirmationModal.title === 'Cancel Delivery Item') {
        await handleCancelDeliveryItem(confirmationModal.itemId);
      }
    }
    closeCancelItemModal();
  }, [confirmationModal, handleCancelOrder, handleCancelDeliveryItem, closeCancelItemModal]);

  const handleConfirmationCancel = useCallback(() => {
    closeCancelItemModal();
  }, [closeCancelItemModal]);

  const handleOrderExpand = useCallback((orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
    if (expandedOrder !== orderId && !deliveryItems[orderId]) {
      fetchDeliveryItems(orderId);
    }
  }, [expandedOrder, deliveryItems, fetchDeliveryItems]);

  return {
    deliveryItems,
    loadingItems,
    expandedOrder,
    confirmationModal,
    fetchDeliveryItems,
    handleCancelOrder,
    handleCancelDeliveryItem,
    showCancelConfirmation,
    handleCancelClick,
    closeCancelItemModal,
    handleConfirmationOK,
    handleConfirmationCancel,
    handleOrderExpand
  };
};
