import { useState, useCallback } from 'react';
import { message } from 'antd';
import axiosInstance from '../../api/axios';

export const useDeliveryExecutives = () => {
  const [deliveryExecutives, setDeliveryExecutives] = useState([]);
  const [loadingExecutives, setLoadingExecutives] = useState(false);
  const [executivesError, setExecutivesError] = useState(false);
  const [showActiveExecutivesTable, setShowActiveExecutivesTable] = useState(false);

  const fetchDeliveryExecutives = useCallback(async () => {
    setLoadingExecutives(true);
    setExecutivesError(false);
    
    try {
      const response = await axiosInstance.get('/admin/delivery-executives');
      
      if (response.data.status === 'success') {
        setDeliveryExecutives(response.data.data || []);
      } else {
        message.warning('Failed to fetch delivery executives. Some data may be unavailable.');
        setExecutivesError(true);
      }
    } catch (error) {
      console.error('Error fetching delivery executives:', error);
      setExecutivesError(true);
      message.error('Failed to fetch delivery executives');
    } finally {
      setLoadingExecutives(false);
    }
  }, []);

  const handleToggleExecutiveStatus = useCallback((executiveId, currentStatus) => {
    setDeliveryExecutives(prev => 
      prev.map(exec => 
        exec.id === executiveId 
          ? { ...exec, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
          : exec
      )
    );
  }, []);

  const handleSaveStatusChanges = useCallback(async (executives) => {
    try {
      const statusUpdates = executives.map(exec => ({
        id: exec.id,
        status: exec.status
      }));
      
      await axiosInstance.put('/api/delivery-executives/status', { executives: statusUpdates });
      message.success('Executive statuses updated successfully');
    } catch (error) {
      console.error('Error updating executive statuses:', error);
      message.error('Failed to update executive statuses');
    }
  }, []);

  const handleWhatsAppMessage = useCallback((phoneNumber, executiveName) => {
    const message = `Hello ${executiveName}, this is a message from the delivery management system.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }, []);

  const handleAddExecutive = useCallback(() => {
    // This would typically open a modal or navigate to an add executive page
    message.info('Add executive functionality would be implemented here');
  }, []);

  const handleEditExecutive = useCallback((executive) => {
    // This would typically open a modal or navigate to an edit executive page
    message.info(`Edit executive ${executive.name} functionality would be implemented here`);
  }, []);

  return {
    deliveryExecutives,
    loadingExecutives,
    executivesError,
    showActiveExecutivesTable,
    setShowActiveExecutivesTable,
    fetchDeliveryExecutives,
    handleToggleExecutiveStatus,
    handleSaveStatusChanges,
    handleWhatsAppMessage,
    handleAddExecutive,
    handleEditExecutive
  };
};
