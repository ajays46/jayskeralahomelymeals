import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import { useMenusForBooking } from '../hooks/adminHook/adminHook';
import { useOrder, useCalculateMenuPricing, useCalculateOrderTotal } from '../hooks/userHooks/useOrder';
import { useAddress } from '../hooks/userHooks/userAddress';
import { toast } from 'react-toastify';
import AddressPicker from '../components/AddressPicker';
import { 
  BookingHeader, 
  DateSelector, 
  MenuSelector, 
  OrderSummary,
  MealSkipSelector
} from '../components/booking';

const BookingPage = () => {
  const navigate = useNavigate();
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [dietaryPreference, setDietaryPreference] = useState('veg');
  const [expandedSections, setExpandedSections] = useState({
    menus: true,
    dateSelection: false
  });
  
  const [selectedDates, setSelectedDates] = useState([]);
  const [orderMode, setOrderMode] = useState('multiple');
  const [savedOrder, setSavedOrder] = useState(null);
  

  const [deliveryLocations, setDeliveryLocations] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    full: ''
  });

  const [deliveryLocationNames, setDeliveryLocationNames] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    full: ''
  });

  // Meal skipping state
  const [skipMeals, setSkipMeals] = useState({});

  // Daily Flexible Plan - Store menu selection for each date
  const [dateMenuSelections, setDateMenuSelections] = useState({});

  // Hooks
  const { createOrder, isCreating } = useOrder();  
  const { addresses: userAddresses } = useAddress();
  const { data: menusData, isLoading: menusLoading, error: menusError } = useMenusForBooking();
  const calculateMenuPricing = useCalculateMenuPricing();
  const calculateOrderTotal = useCalculateOrderTotal();
  const menus = menusData?.data || [];

  // Helper functions
  const getAddressDisplayName = (addressId) => {
    if (!addressId || !userAddresses) return '';
    const address = userAddresses.find(addr => addr.id === addressId);
    if (!address) return '';
    return `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
  };

  const isWeekday = (date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  };

  const isWeekdayMenu = (menu) => {
    if (!menu) return false;
    const dayOfWeek = menu.dayOfWeek?.toLowerCase() || '';
    
    // Now menu is actually a menu item object
    const itemName = menu.name?.toLowerCase() || '';
    
    // Check if it's a full week menu (should not be restricted to weekdays)
    if (itemName.includes('full week')) {
      return false; // Full week menu is not a weekday-only menu
    }
    
    const isWeekdayByDay = dayOfWeek === 'weekday' || dayOfWeek === 'monday' || dayOfWeek === 'tuesday' || dayOfWeek === 'wednesday' || dayOfWeek === 'thursday' || dayOfWeek === 'friday';
    const isWeekdayByName = itemName.includes('week day') || itemName.includes('weekday') || itemName.includes('monday') || itemName.includes('tuesday') || itemName.includes('wednesday') || itemName.includes('thursday') || itemName.includes('friday');
    return isWeekdayByDay || isWeekdayByName;
  };

  const getAutoSelectionDays = (menu) => {
    if (!menu) return 0;
    
    // Now menu is actually a menu item object
    const itemName = menu.name?.toLowerCase() || '';
    
    // Monthly menu - 30 days
    if (itemName.includes('monthly') || itemName.includes('month')) {
      return 30;
    }
    
    // Weekly menu - 7 days
    if (itemName.includes('weekly') || itemName.includes('week')) {
      return 7;
    }
    
    // Full week menu - 7 days
    if (itemName.includes('full week')) {
      return 7;
    }
    
    // Week-day plan - 5 days (Monday to Friday)
    if (itemName.includes('week-day') || itemName.includes('weekday')) {
      return 5;
    }
    
    // Daily Rates - no auto-selection (user selects individual days)
    if (itemName.includes('daily rates') || itemName.includes('daily rate')) {
      return 0;
    }
    
    // Weekday menu - 7 days (fallback for other weekday menus)
    if (isWeekdayMenu(menu)) {
      return 7;
    }
    
    return 0; // No auto-selection
  };
  

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateSelection = (date) => {
    const autoSelectionDays = getAutoSelectionDays(selectedMenu);
    if (selectedMenu && autoSelectionDays > 0) {
      handleAutoDateSelection(date, autoSelectionDays);
      return;
    }

    setSelectedDates(prev => {
      const dateStr = date.toDateString();
      const exists = prev.find(d => d.toDateString() === dateStr);
      if (exists) {
        return prev.filter(d => d.toDateString() !== dateStr);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleAutoDateSelection = (startDate, days) => {
    const selectedDates = [];
    const currentDate = new Date(startDate);
    
    // Check if this is a week-day plan (5 days, weekdays only)
    const menuName = selectedMenu?.name?.toLowerCase() || '';
    const isWeekDayPlan = menuName.includes('week-day') || menuName.includes('weekday');
    
    if (isWeekDayPlan) {
      // For week-day plans, select 5 consecutive weekdays
      let daysSelected = 0;
      let currentDay = new Date(currentDate);
      
      while (daysSelected < 5) {
        // Check if current day is a weekday (Monday = 1, Tuesday = 2, ..., Friday = 5)
        if (currentDay.getDay() >= 1 && currentDay.getDay() <= 5) {
          selectedDates.push(new Date(currentDay));
          daysSelected++;
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }
    } else {
      // For other plans, select consecutive days starting from the selected date
      for (let i = 0; i < days; i++) {
        selectedDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    setSelectedDates(selectedDates);
    
    let message = '';
    
    if (menuName.includes('monthly') || menuName.includes('month')) {
      message = `Selected 30 consecutive days starting from ${formatDateForDisplay(startDate)}`;
    } else if (menuName.includes('weekly') || menuName.includes('week')) {
      message = `Selected 7 consecutive days starting from ${formatDateForDisplay(startDate)}`;
    } else if (menuName.includes('full week')) {
      message = `Selected 7 consecutive days starting from ${formatDateForDisplay(startDate)}`;
    } else if (isWeekDayPlan) {
      message = `Selected 5 weekdays starting from ${formatDateForDisplay(startDate)}`;
    } else {
      message = `Selected ${days} consecutive days starting from ${formatDateForDisplay(startDate)}`;
    }
    
    toast.success(message);
  };



  const handleOpenAuthSlider = () => setAuthSliderOpen(true);
  const handleCloseAuthSlider = () => setAuthSliderOpen(false);

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Listen for auth slider open event from AddressPicker
  useEffect(() => {
    const handleOpenAuthSlider = () => {
      setAuthSliderOpen(true);
    };

    window.addEventListener('openAuthSlider', handleOpenAuthSlider);
    
    return () => {
      window.removeEventListener('openAuthSlider', handleOpenAuthSlider);
    };
  }, []);

  // Date initialization
  useEffect(() => {
    if (!selectedMenu || !isWeekdayMenu(selectedMenu)) {
      setSelectedDates([]);
    }
  }, [selectedMenu]);

  // Date generation and navigation
  const generateDates = () => {
    const dates = [];
    const startDate = new Date(currentDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  const goToNextDays = () => {
    const newDate = new Date(currentDate);
    const daysToMove = isMobile ? 5 : 7;
    newDate.setDate(currentDate.getDate() + daysToMove);
    setCurrentDate(newDate);
  };

  const goToPreviousDays = () => {
    const newDate = new Date(currentDate);
    const daysToMove = isMobile ? 5 : 7;
    newDate.setDate(currentDate.getDate() - daysToMove);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate >= today) {
      setCurrentDate(newDate);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  const validateMenuForSelectedDates = (menu) => {
    if (!menu || selectedDates.length === 0) return { isValid: true, message: '' };
    
    if (isWeekdayMenu(menu)) {
      const weekendDates = selectedDates.filter(date => !isWeekday(date));
      if (weekendDates.length > 0) {
        return {
          isValid: false,
          message: `This weekday menu cannot be selected for weekend dates: ${weekendDates.map(d => formatDateForDisplay(d)).join(', ')}`
        };
      }
    }
    
    const menuDay = menu.dayOfWeek?.toLowerCase();
    if (menuDay === 'weekend' || menuDay === 'saturday' || menuDay === 'sunday') {
      const weekdayDates = selectedDates.filter(date => isWeekday(date));
      if (weekdayDates.length > 0) {
        return {
          isValid: false,
          message: `This weekend menu cannot be selected for weekday dates: ${weekdayDates.map(d => formatDateForDisplay(d)).join(', ')}`
        };
      }
    }
    
    return { isValid: true, message: '' };
  };

  // Helper function to get the primary menu item name
  const getPrimaryMenuItemName = (menu) => {
    // Now menu is actually a menu item object
    return menu.name;
  };

  // Helper function to check if menu has specific type based on menu items
  const hasMenuItemType = (menu, type) => {
    // Now menu is actually a menu item object
    const itemName = menu.name?.toLowerCase() || '';
    
    // Special handling for daily rates
    if (type === 'daily' || type === 'daily rates' || type === 'daily rate') {
      return itemName.includes('daily rates') || itemName.includes('daily rate');
    }
    
    return itemName.includes(type);
  };

  const handleMenuSelection = (menu) => {
    // For daily flexible mode, handle differently
    if (orderMode === 'daily-flexible') {
      if (selectedDates.length === 0) {
        toast.error('Please select at least one date first for daily flexible plan');
        return;
      }
      
      const menuDisplayName = getPrimaryMenuItemName(menu);
      
      // Ask user if they want to apply this menu to all selected dates
      const shouldApplyToAll = window.confirm(
        `Apply "${menuDisplayName}" to all ${selectedDates.length} selected dates?`
      );
      
      if (shouldApplyToAll) {
        const newDateMenuSelections = { ...dateMenuSelections };
        selectedDates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          newDateMenuSelections[dateStr] = menu;
        });
        setDateMenuSelections(newDateMenuSelections);
        toast.success(`Applied "${menuDisplayName}" to ${selectedDates.length} dates`);
      } else {
        // Apply only to the first selected date
        const firstDate = selectedDates[0];
        const dateStr = firstDate.toISOString().split('T')[0];
        setDateMenuSelections(prev => ({
          ...prev,
          [dateStr]: menu
        }));
        toast.success(`Applied "${menuDisplayName}" to ${formatDateForDisplay(firstDate)}`);
      }
      return;
    }
    
    // Original logic for other modes
    const validation = validateMenuForSelectedDates(menu);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    setSelectedMenu(menu);
    
    // Check for monthly menu auto-selection
    if (hasMenuItemType(menu, 'monthly') || hasMenuItemType(menu, 'month')) {
      toast.info('Monthly Menu Selected! Click any date to auto-select 30 consecutive days.');
    }
    
    // Check for weekly menu auto-selection
    if (hasMenuItemType(menu, 'weekly') || hasMenuItemType(menu, 'week')) {
      toast.info('Weekly Menu Selected! Click any date to auto-select 7 consecutive days.');
    }
    
    // Check for week-day plan auto-selection
    if (hasMenuItemType(menu, 'week-day') || hasMenuItemType(menu, 'weekday')) {
      toast.info('Week-Day Plan Selected! Click any date to auto-select 5 weekdays.');
    }
    
    // Check for daily rates
    if (hasMenuItemType(menu, 'daily rates') || hasMenuItemType(menu, 'daily rate')) {
      toast.info('Daily Rates Selected! Select individual dates for your meals.');
    }
    
    if (isWeekdayMenu(menu)) {
      toast.info('Weekday Menu Selected! Click any date to auto-select 7 consecutive days.');
    }
    
    // Auto-selection for monthly menus
    if ((hasMenuItemType(menu, 'monthly') || hasMenuItemType(menu, 'month')) && selectedDates.length > 0) {
      const firstSelectedDate = selectedDates[0];
      const shouldAutoSelect = window.confirm(
        `You've selected a monthly menu. Would you like to auto-select 30 consecutive days starting from ${formatDateForDisplay(firstSelectedDate)}?`
      );
      
      if (shouldAutoSelect) {
        handleAutoDateSelection(firstSelectedDate, 30);
      }
    }
    
    // Auto-selection for weekly menus
    if ((hasMenuItemType(menu, 'weekly') || hasMenuItemType(menu, 'week')) && selectedDates.length > 0) {
      const firstSelectedDate = selectedDates[0];
      const shouldAutoSelect = window.confirm(
        `You've selected a weekly menu. Would you like to auto-select 7 consecutive days starting from ${formatDateForDisplay(firstSelectedDate)}?`
      );
      
      if (shouldAutoSelect) {
        handleAutoDateSelection(firstSelectedDate, 7);
      }
    }
    
    // Auto-selection for week-day plans
    if ((hasMenuItemType(menu, 'week-day') || hasMenuItemType(menu, 'weekday')) && selectedDates.length > 0) {
      const firstSelectedDate = selectedDates[0];
      const shouldAutoSelect = window.confirm(
        `You've selected a week-day plan. Would you like to auto-select 5 weekdays starting from ${formatDateForDisplay(firstSelectedDate)}?`
      );
      
      if (shouldAutoSelect) {
        handleAutoDateSelection(firstSelectedDate, 5);
      }
    }
    
    if (isWeekdayMenu(menu) && selectedDates.length > 0) {
      const firstSelectedDate = selectedDates[0];
      const shouldAutoSelect = window.confirm(
        `You've selected a weekday menu. Would you like to auto-select 7 consecutive days starting from ${formatDateForDisplay(firstSelectedDate)}?`
      );
      
      if (shouldAutoSelect) {
        handleAutoDateSelection(firstSelectedDate, 7);
      }
    }
  };



  const getTotalItems = () => {
    // For comprehensive menus, count the menu items automatically
    if (selectedMenu && selectedMenu.isComprehensiveMenu) {
      let total = 0;
      if (selectedMenu.mealTypes.breakfast) total += selectedMenu.mealTypes.breakfast.length;
      if (selectedMenu.mealTypes.lunch) total += selectedMenu.mealTypes.lunch.length;
      if (selectedMenu.mealTypes.dinner) total += selectedMenu.mealTypes.dinner.length;
      return total;
    }
    
    // For daily rates, count based on selected dates and meal types
    if (selectedMenu && (hasMenuItemType(selectedMenu, 'daily rates') || hasMenuItemType(selectedMenu, 'daily rate'))) {
      let total = 0;
      if (selectedMenu.hasBreakfast) total += selectedDates.length;
      if (selectedMenu.hasLunch) total += selectedDates.length;
      if (selectedMenu.hasDinner) total += selectedDates.length;
      return total;
    }
    
    // For other regular menus, return 1 (the selected menu item)
    return 1;
  };

  const getTotalPrice = () => {
    // Return 0 if no menu selected
    if (!selectedMenu) {
      return 0;
    }
    
    // For daily flexible mode, calculate based on individual date-menu selections
    if (orderMode === 'daily-flexible') {
      let total = 0;
      
      selectedDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const menuForDate = dateMenuSelections[dateStr];
        
        if (menuForDate) {
          // For daily flexible, use the menu item price
          total += (menuForDate.price || 0);
        }
      });
      
      return total;
    }
    
    // For all menu types, simply return the selected menu item price
    return selectedMenu.price || 0;
  };

  const getFilteredMenus = () => {
    if (!menus || dietaryPreference === 'all') {
      return menus;
    }

    return menus.filter(menuItem => {
      if (menuItem.categories && menuItem.categories.length > 0) {
        const categoryNames = menuItem.categories.map(cat => cat.name.toLowerCase());
        
        if (dietaryPreference === 'veg') {
          return categoryNames.some(name => name.includes('veg') && !name.includes('non'));
        } else if (dietaryPreference === 'non-veg') {
          return categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
        }
      }
      
      if (dietaryPreference === 'veg') {
        const categoryNames = menuItem.categories?.map(cat => cat.name.toLowerCase()) || [];
        return !categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
      } else if (dietaryPreference === 'non-veg') {
        const categoryNames = menuItem.categories?.map(cat => cat.name.toLowerCase()) || [];
        return categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
      }
      
      return true;
    });
  };

  const handleSaveOrder = async () => {
    try {
      if (getTotalItems() === 0) {
        toast.error('Please select at least one item to order');
        return;
      }

      if (selectedDates.length === 0) {
        toast.error('Please select at least one date for your order');
        return;
      }

      if (!selectedMenu) {
        toast.error('Please select a menu for your order');
        return;
      }

      // Check if user has provided either primary address or meal-specific addresses
      const hasPrimaryAddress = deliveryLocations.full;
      const hasMealAddresses = deliveryLocations.breakfast || deliveryLocations.lunch || deliveryLocations.dinner;
      
      if (!hasPrimaryAddress && !hasMealAddresses) {
        toast.error('Please select at least one delivery address (primary or meal-specific)');
        return;
      }

              // For comprehensive menus (like August Menu), create delivery items for each meal type
        if (selectedMenu.isComprehensiveMenu) {
        const orderTimes = ['Morning', 'Noon', 'Night']; // All meal times for comprehensive menus
        
        // Create order items for the comprehensive menu
        const orderItems = [];
        if (selectedMenu.mealTypes.breakfast && selectedMenu.mealTypes.breakfast.length > 0) {
          selectedMenu.mealTypes.breakfast.forEach(item => {
            orderItems.push({
              menuItemId: item.id,
              quantity: 1
            });
          });
        }
        if (selectedMenu.mealTypes.lunch && selectedMenu.mealTypes.lunch.length > 0) {
          selectedMenu.mealTypes.lunch.forEach(item => {
            orderItems.push({
              menuItemId: item.id,
              quantity: 1
            });
          });
        }
        if (selectedMenu.mealTypes.dinner && selectedMenu.mealTypes.dinner.length > 0) {
          selectedMenu.mealTypes.dinner.forEach(item => {
            orderItems.push({
              menuItemId: item.id,
              quantity: 1
            });
          });
        }

        // Use primary address if available, otherwise use the first meal-specific address
        const primaryAddressId = deliveryLocations.full || 
          deliveryLocations.breakfast || 
          deliveryLocations.lunch || 
          deliveryLocations.dinner;
        
        const orderData = {
          orderDate: selectedDate.toISOString().split('T')[0],
          orderTimes: orderTimes,
          orderItems: orderItems,
          deliveryAddressId: primaryAddressId,
          deliveryLocations: {
            breakfast: deliveryLocations.breakfast || null,
            lunch: deliveryLocations.lunch || null,
            dinner: deliveryLocations.dinner || null,
          },
          selectedDates: selectedDates.map(date => date.toISOString().split('T')[0]),
          orderMode: orderMode,
          menuId: selectedMenu.menuId,
          menuName: selectedMenu.name,
          skipMeals: skipMeals
        };

        const newOrder = await createOrder(orderData);

        setSavedOrder({
          ...orderData,
          id: newOrder.id,
          menu: selectedMenu,
          items: [],
          deliveryLocations: deliveryLocations,
          deliveryLocationNames: deliveryLocationNames
        });

        toast.success('Order created successfully!');
        
        console.log('Order created successfully, redirecting to payment page...');
        console.log('Order ID:', newOrder.id);
        
        // Save order to localStorage for payment page
        localStorage.setItem('savedOrder', JSON.stringify({
          ...orderData,
          id: newOrder.id,
          menu: selectedMenu,
          items: [],
          deliveryLocations: deliveryLocations,
          deliveryLocationNames: deliveryLocationNames,
          totalPrice: getTotalPrice()
        }));
        
        // Redirect to payment page
        navigate(`/jkhm/payment/${newOrder.id}`);
      } else if (hasMenuItemType(selectedMenu, 'daily rates') || hasMenuItemType(selectedMenu, 'daily rate')) {
        // For daily rates, create delivery items for each selected date and meal type
        const orderTimes = [];
        if (selectedMenu.hasBreakfast) orderTimes.push('Morning');
        if (selectedMenu.hasLunch) orderTimes.push('Noon');
        if (selectedMenu.hasDinner) orderTimes.push('Night');

        // Create order items for daily rates - one for each meal type
        const orderItems = [];
        if (selectedMenu.menuItem) {
          // Create separate order items for each meal type
          if (selectedMenu.hasBreakfast) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'breakfast'
            });
          }
          if (selectedMenu.hasLunch) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'lunch'
            });
          }
          if (selectedMenu.hasDinner) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'dinner'
            });
          }
        }

        // Use primary address if available, otherwise use the first meal-specific address
        const primaryAddressId = deliveryLocations.full || 
          deliveryLocations.breakfast || 
          deliveryLocations.lunch || 
          deliveryLocations.dinner;
        
        const orderData = {
          orderDate: selectedDate.toISOString().split('T')[0],
          orderTimes: orderTimes,
          orderItems: orderItems,
          deliveryAddressId: primaryAddressId,
          deliveryLocations: {
            breakfast: deliveryLocations.breakfast || null,
            lunch: deliveryLocations.lunch || null,
            dinner: deliveryLocations.dinner || null,
          },
          selectedDates: selectedDates.map(date => date.toISOString().split('T')[0]),
          orderMode: orderMode,
          menuId: selectedMenu.menuId,
          menuName: selectedMenu.name,
          skipMeals: skipMeals
        };

        const newOrder = await createOrder(orderData);

        setSavedOrder({
          ...orderData,
          id: newOrder.id,
          menu: selectedMenu,
          items: [],
          deliveryLocations: deliveryLocations,
          deliveryLocationNames: deliveryLocationNames
        });

        toast.success('Order created successfully!');
        
        // Save order to localStorage for payment page
        localStorage.setItem('savedOrder', JSON.stringify({
          ...orderData,
          id: newOrder.id,
          menu: selectedMenu,
          items: [],
          deliveryLocations: deliveryLocations,
          deliveryLocationNames: deliveryLocationNames,
          totalPrice: getTotalPrice()
        }));
        
        // Redirect to payment page
        navigate(`/jkhm/payment/${newOrder.id}`);
      } else {
        // For regular menus (not comprehensive, not daily rates)
        const orderTimes = [];
        if (selectedMenu.hasBreakfast) orderTimes.push('Morning');
        if (selectedMenu.hasLunch) orderTimes.push('Noon');
        if (selectedMenu.hasDinner) orderTimes.push('Night');

        // Create order items for the selected menu
        const orderItems = [];
        if (selectedMenu.menuItem) {
          orderItems.push({
            menuItemId: selectedMenu.menuItem.id,
            quantity: selectedDates.length
          });
        }

        // Use primary address if available, otherwise use the first meal-specific address
        const primaryAddressId = deliveryLocations.full || 
          deliveryLocations.breakfast || 
          deliveryLocations.lunch || 
          deliveryLocations.dinner;
        
        const orderData = {
          orderDate: selectedDate.toISOString().split('T')[0],
          orderTimes: orderTimes,
          orderItems: orderItems,
          deliveryAddressId: primaryAddressId,
          deliveryLocations: {
            breakfast: deliveryLocations.breakfast || null,
            lunch: deliveryLocations.lunch || null,
            dinner: deliveryLocations.dinner || null,
          },
          selectedDates: selectedDates.map(date => date.toISOString().split('T')[0]),
          orderMode: orderMode,
          menuId: selectedMenu.menuId,
          menuName: selectedMenu.name,
          skipMeals: skipMeals
        };

        const newOrder = await createOrder(orderData);

        setSavedOrder({
          ...orderData,
          id: newOrder.id,
          menu: selectedMenu,
          items: [],
          deliveryLocations: deliveryLocations,
          deliveryLocationNames: deliveryLocationNames
        });

        toast.success('Order created successfully!');
        
        // Save order to localStorage for payment page
        localStorage.setItem('savedOrder', JSON.stringify({
          ...orderData,
          id: newOrder.id,
          menu: selectedMenu,
          items: [],
          deliveryLocations: deliveryLocations,
          deliveryLocationNames: deliveryLocationNames,
          totalPrice: getTotalPrice()
        }));
        
        // Redirect to payment page
        navigate(`/jkhm/payment/${newOrder.id}`);
      }

    } catch (error) {
      console.error('Error creating order:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      
      // Check if it's a database connection error
      if (error.message && error.message.includes('database')) {
        toast.error('Database connection failed. Please check your connection and try again.');
      } else {
        toast.error(error.message || 'Failed to create order. Please try again.');
      }
      
      // Log that we're not redirecting due to error
      console.log('Order creation failed - not redirecting to payment page');
    }
  };



  const handleCancel = () => {
    navigate('/jkhm');
  };

  // Format functions
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long'
    });
  };

  const formatDay = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short' 
    });
  };

  const formatDayNumber = (date) => {
    return date.getDate();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    // Check if the date is in the selectedDates array
    return selectedDates.some(selectedDate => selectedDate.toDateString() === date.toDateString());
  };

  const getCleanMenuItemName = (itemName) => {
    if (!itemName) return '';
    return itemName.replace(/weekly menu/gi, '').trim();
  };



  const handleDeliveryLocationChange = (type, addressId, displayName) => {
    setDeliveryLocations(prev => ({ ...prev, [type]: addressId }));
    setDeliveryLocationNames(prev => ({ ...prev, [type]: displayName }));
  };

  const handleSkipMealsChange = (newSkipMeals) => {
    setSkipMeals(newSkipMeals);
  };

  const handleDateMenuSelection = (date, menu) => {
    const dateStr = date.toISOString().split('T')[0];
    setDateMenuSelections(prev => ({
      ...prev,
      [dateStr]: menu
    }));
    toast.success(`Selected "${getPrimaryMenuItemName(menu)}" for ${formatDateForDisplay(date)}`);
  };

  const removeDateMenuSelection = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setDateMenuSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[dateStr];
      return newSelections;
    });
    toast.success(`Removed menu selection for ${formatDateForDisplay(date)}`);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSignInClick={handleOpenAuthSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={handleCloseAuthSlider} />
      
      <BookingHeader />

      <DateSelector
        dates={dates}
        selectedDates={selectedDates}
        currentDate={currentDate}
        isMobile={isMobile}
        onDateSelection={handleDateSelection}
        onNextDays={goToNextDays}
        onPreviousDays={goToPreviousDays}
        formatMonth={formatMonth}
        formatDayNumber={formatDayNumber}
        formatDay={formatDay}
        isToday={isToday}
        isSelected={isSelected}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Left Column - Menu Sections */}
          <div className="lg:col-span-2">
            <div className="max-w-2xl lg:max-w-none mx-auto lg:mx-0">
              <MenuSelector
                menus={menus}
                selectedMenu={selectedMenu}
                dietaryPreference={dietaryPreference}
                expandedSections={expandedSections}
                menusLoading={menusLoading}
                menusError={menusError}
                onMenuSelection={handleMenuSelection}
                onDietaryPreferenceChange={setDietaryPreference}
                onToggleSection={toggleSection}
                getFilteredMenus={getFilteredMenus}
                getCleanMenuItemName={getCleanMenuItemName}
                isWeekdayMenu={isWeekdayMenu}
                orderMode={orderMode}
              />

              {/* Meal Skip Selector */}
              {selectedMenu && selectedDates.length > 0 && (
                <MealSkipSelector
                  selectedDates={selectedDates}
                  selectedMenu={selectedMenu}
                  onSkipMealsChange={handleSkipMealsChange}
                  skipMeals={skipMeals}
                  formatDateForDisplay={formatDateForDisplay}
                  isWeekdayMenu={isWeekdayMenu}
                  isWeekday={isWeekday}
                />
              )}

              {/* Selected Menu Details */}
              {selectedMenu && (
                <div className="mb-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-visible">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{selectedMenu.name}</h3>
                          {selectedMenu.price > 0 && (
                            <p className="text-blue-100 text-sm">₹{selectedMenu.price}</p>
                          )}
                          <p className="text-blue-100 text-xs">From: {selectedMenu.menuName}</p>
                          <p className="text-blue-100 text-sm capitalize">{selectedMenu.dayOfWeek} Menu</p>
                        </div>
                        <button
                          onClick={() => setSelectedMenu(null)}
                          className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        >
                          <span className="text-xl">✕</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Categories Section */}
                      {selectedMenu.categories && selectedMenu.categories.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Menu Categories
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {selectedMenu.categories.map((category) => (
                              <div key={category.id} className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <h5 className="font-semibold text-gray-800 mb-2">{category.name}</h5>
                                <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Menu Items by Meal Type */}
                      <div className="space-y-8 overflow-visible">
                       

                        {/* Breakfast Items */}
                        {selectedMenu.hasBreakfast && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 overflow-visible">
                            <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">B</span>
                              </div>
                              Breakfast Items
                            </h4>
                          
                            {/* Breakfast Delivery Location */}
                            <div className="bg-white rounded-lg p-4 border border-green-200 relative overflow-visible mb-4 w-full">
                              <label className="block text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <span className="text-green-500">📍</span>
                                🍳 Breakfast Delivery Address
                              </label>
                              <div className="relative z-20 w-full">
                              <AddressPicker
                                value={deliveryLocationNames.breakfast || deliveryLocations.breakfast}
                                onChange={(e) => {
                                  const addressId = e.target.value;
                                  const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                    handleDeliveryLocationChange('breakfast', addressId, displayName);
                                }}
                                placeholder="Select breakfast delivery address (optional - will use primary address if not selected)..."
                                className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                                mealType="breakfast"
                              />
                              </div>
                              {!deliveryLocations.breakfast && (
                                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  Will use primary address for breakfast delivery
                                </div>
                              )}
                            </div>


                          </div>
                        )}

                        {/* Lunch Items */}
                        {selectedMenu.hasLunch && (
                          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100 overflow-visible">
                            <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-3">
                              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">L</span>
                              </div>
                              Lunch Items
                            </h4>
                            

                            {/* Lunch Delivery Location */}
                            <div className="bg-white rounded-lg p-4 border border-yellow-200 relative overflow-visible mb-4 w-full">
                              <label className="block text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                <span className="text-yellow-500">📍</span>
                                🍽️ Lunch Delivery Address
                              </label>
                              <div className="relative z-20 w-full">
                              <AddressPicker
                                value={deliveryLocationNames.lunch || deliveryLocations.lunch}
                                onChange={(e) => {
                                  const addressId = e.target.value;
                                  const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                    handleDeliveryLocationChange('lunch', addressId, displayName);
                                }}
                                placeholder="Select lunch delivery address (optional - will use primary address if not selected)..."
                                className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm"
                                mealType="lunch"
                              />
                              </div>
                              {!deliveryLocations.lunch && (
                                <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                  Will use primary address for lunch delivery
                                </div>
                              )}
                            </div>


                          </div>
                        )}

                        {/* Dinner Items */}
                        {selectedMenu.hasDinner && (
                          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100 overflow-visible relative">
                            <h4 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-3">
                              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">D</span>
                              </div>
                              Dinner Items
                            </h4>
                            
                            

                            {/* Dinner Delivery Location */}
                            <div className="bg-white rounded-lg p-4 border border-pink-200 relative overflow-visible mb-4 w-full" style={{ zIndex: 50 }}>
                              <label className="block text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                                <span className="text-pink-500">📍</span>
                                🌙 Dinner Delivery Address
                              </label>
                              <div className="relative z-40 w-full">
                              <AddressPicker
                                value={deliveryLocationNames.dinner || deliveryLocations.dinner}
                                onChange={(e) => {
                                  const addressId = e.target.value;
                                  const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                    handleDeliveryLocationChange('dinner', addressId, displayName);
                                }}
                                placeholder="Select dinner delivery address (optional - will use primary address if not selected)..."
                                className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-sm"
                                mealType="dinner"
                              />
                              </div>
                              {!deliveryLocations.dinner && (
                                <div className="mt-2 text-xs text-pink-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                  Will use primary address for dinner delivery
                                </div>
                              )}
                            </div>


                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary & Actions */}
                                            <OrderSummary
              selectedMenu={selectedMenu}
              selectedDates={selectedDates}
              deliveryLocations={deliveryLocations}
              deliveryLocationNames={deliveryLocationNames}
              savedOrder={savedOrder}
              isCreating={isCreating}
              getTotalItems={getTotalItems}
              getTotalPrice={getTotalPrice}
              getAddressDisplayName={getAddressDisplayName}
              isWeekdayMenu={isWeekdayMenu}
              isWeekday={isWeekday}
              formatDateForDisplay={formatDateForDisplay}
              onDeliveryLocationChange={handleDeliveryLocationChange}
              onCancel={handleCancel}
              onSaveOrder={handleSaveOrder}
              skipMeals={skipMeals}
              orderMode={orderMode}
              dateMenuSelections={dateMenuSelections}
              onDateMenuSelection={handleDateMenuSelection}
              onRemoveDateMenuSelection={removeDateMenuSelection}
            />
                  </div>
      </div>
    </div>
  );
};

export default BookingPage; 