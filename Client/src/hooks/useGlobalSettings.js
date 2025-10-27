import { useState, useEffect } from 'react';
import axiosInstance from '../api/axios.js';

export const useGlobalSettings = () => {
  const [menuTypeConfig, setMenuTypeConfig] = useState({});
  const [deliveryTimeSlots, setDeliveryTimeSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load menu type detection settings
        const menuResponse = await axiosInstance.get('/global-settings/menu_type_detection');
        setMenuTypeConfig(menuResponse.data.data || {});

        // Load delivery time slots
        const deliveryResponse = await axiosInstance.get('/global-settings/delivery_time_slots');
        setDeliveryTimeSlots(deliveryResponse.data.data || {});

      } catch (error) {
        console.error('Failed to load settings:', error);
        setError(error.message);
        
        // Fallback to default values
        setMenuTypeConfig({
          monthly: { keywords: ['monthly', 'month'], autoDays: 30 },
          weekly: { keywords: ['weekly', 'week'], autoDays: 7 },
          weekday: { keywords: ['weekday', 'week day'], autoDays: 5 }
        });
        
        setDeliveryTimeSlots({
          breakfast: 'Breakfast',
          lunch: 'Lunch',
          dinner: 'Dinner'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const getAutoSelectionDays = (menu) => {
    const itemName = menu.name?.toLowerCase() || '';
    
    for (const [menuType, config] of Object.entries(menuTypeConfig)) {
      const keywords = config.keywords || [];
      const isMatch = keywords.some(keyword => itemName.includes(keyword));
      
      if (isMatch) {
        return config.autoDays;
      }
    }
    
    return 0;
  };

  const getMenuTypeMessage = (menu) => {
    const itemName = menu.name?.toLowerCase() || '';
    
    for (const [menuType, config] of Object.entries(menuTypeConfig)) {
      const keywords = config.keywords || [];
      const isMatch = keywords.some(keyword => itemName.includes(keyword));
      
      if (isMatch) {
        return `${menuType.charAt(0).toUpperCase() + menuType.slice(1)} Menu Selected! Click any date to auto-select ${config.autoDays} consecutive days.`;
      }
    }
    
    return '';
  };

  const getDeliveryTimeSlot = (mealType) => {
    return deliveryTimeSlots[mealType] || 'Breakfast';
  };

  return { 
    getAutoSelectionDays, 
    getMenuTypeMessage, 
    getDeliveryTimeSlot,
    menuTypeConfig, 
    deliveryTimeSlots,
    loading,
    error
  };
};
