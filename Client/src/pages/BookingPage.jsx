import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import { useMenusForBooking } from '../hooks/adminHook/adminHook';
import { useOrder, useCalculateMenuPricing, useCalculateOrderTotal } from '../hooks/userHooks/useOrder';
import { useAddress } from '../hooks/userHooks/userAddress';
import { useAdminOrderBlock } from '../hooks/userHooks/useAdminOrderBlock';
import { toast } from 'react-toastify';
import AddressPicker from '../components/AddressPicker';
import AdminOrderBlockedModal from '../components/AdminOrderBlockedModal';
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
  
  // State for Ant Design popup
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [menuPopupMessage, setMenuPopupMessage] = useState('');

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
  const { showAdminBlockModal, handleOrderError, handleSwitchAccount, closeAdminBlockModal } = useAdminOrderBlock();
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
    
    // Weekday menu - 5 days (Monday to Friday)
    if (isWeekdayMenu(menu)) {
      return 5;
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
    
    // Check if this is a week-day plan or weekday menu (5 days, weekdays only)
    const menuName = selectedMenu?.name?.toLowerCase() || '';
    const isWeekDayPlan = menuName.includes('week-day') || menuName.includes('weekday') || isWeekdayMenu(selectedMenu);
    
    if (isWeekDayPlan) {
      // For week-day plans and weekday menus, select 5 consecutive weekdays
      let currentDay = new Date(currentDate);
      
      // If the selected date is a weekend, start from the next Monday
      if (currentDay.getDay() === 0) { // Sunday
        currentDay.setDate(currentDay.getDate() + 1); // Move to Monday
      } else if (currentDay.getDay() === 6) { // Saturday
        currentDay.setDate(currentDay.getDate() + 2); // Move to Monday
      }
      
      // Now currentDay is either the selected weekday or the next Monday
      // Select 5 consecutive weekdays starting from currentDay
      let daysSelected = 0;
      while (daysSelected < 5) {
        // Since we've already adjusted for weekends, currentDay should be a weekday
        selectedDates.push(new Date(currentDay));
        daysSelected++;
        
        // Move to the next day
        currentDay.setDate(currentDay.getDate() + 1);
        
        // If we've reached the weekend, skip to Monday
        if (currentDay.getDay() === 6) { // Saturday
          currentDay.setDate(currentDay.getDate() + 2); // Move to Monday
        } else if (currentDay.getDay() === 0) { // Sunday
          currentDay.setDate(currentDay.getDate() + 1); // Move to Monday
        }
      }
    } else {
      // For other plans, select consecutive days starting from the selected date
      for (let i = 0; i < days; i++) {
        selectedDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    setSelectedDates(selectedDates);
    
    // Show toast for weekday menus
    if (isWeekDayPlan) {
      const startDateDisplay = formatDateForDisplay(selectedDates[0]);
      const endDateDisplay = formatDateForDisplay(selectedDates[selectedDates.length - 1]);
      toast.success(`Selected 5 weekdays from ${startDateDisplay} to ${endDateDisplay}`);
    } else {
      // Only show toast for non-weekday menus
      let message = '';
      
      if (menuName.includes('monthly') || menuName.includes('month')) {
        message = `Selected 30 consecutive days starting from ${formatDateForDisplay(startDate)}`;
      } else if (menuName.includes('weekly') || menuName.includes('week')) {
        message = `Selected 7 consecutive days starting from ${formatDateForDisplay(startDate)}`;
      } else if (menuName.includes('full week')) {
        message = `Selected 7 consecutive days starting from ${formatDateForDisplay(startDate)}`;
      } else {
        message = `Selected ${days} consecutive days starting from ${formatDateForDisplay(startDate)}`;
      }
      
      toast.success(message);
    }
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
    
    // Consolidated menu type checking to avoid duplicate toasts
    let menuMessage = '';
    
    // Check for monthly menu auto-selection
    if (hasMenuItemType(menu, 'monthly') || hasMenuItemType(menu, 'month')) {
      menuMessage = 'Monthly Menu Selected! Click any date to auto-select 30 consecutive days.';
    }
    // Check for weekly menu auto-selection
    else if (hasMenuItemType(menu, 'weekly') || hasMenuItemType(menu, 'weekly')) {
      menuMessage = 'Weekly Menu Selected! Click any date to auto-select 7 consecutive days.';
    }
    // Check for week-day plan auto-selection
    else if (hasMenuItemType(menu, 'week-day') || hasMenuItemType(menu, 'week day')) {
      menuMessage = 'Week-Day Plan Selected! Click any date to auto-select 5 weekdays.';
    }
    // Check for daily rates
    else if (hasMenuItemType(menu, 'daily rates') || hasMenuItemType(menu, 'daily rate')) {
      menuMessage = 'Daily Rates Selected! Select individual dates for your meals.';
    }
    // Check for weekday menu (consolidated condition)
    else if (isWeekdayMenu(menu)) {
      menuMessage = 'Weekday Menu Selected! Click any date to auto-select 5 weekdays.';
    }
    
    // Show popup if there's a message
    if (menuMessage) {
      setMenuPopupMessage(menuMessage);
      setShowMenuPopup(true);
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
    
    // Auto-selection for week-day plans and weekday menus
    if ((hasMenuItemType(menu, 'week-day') || hasMenuItemType(menu, 'weekday') || isWeekdayMenu(menu))) {
      // Don't auto-select automatically - only when user chooses a date
      // The auto-selection will happen in handleDateSelection when user clicks a date
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
      
      // Check if it's an admin order blocking error
      if (handleOrderError(error)) {
        // Error was handled by the admin block modal
        return;
      }
      
      // Check if it's a database connection error
      if (error.message && error.message.includes('database')) {
        toast.error('Database connection failed. Please check your connection and try again.');
      } else {
        toast.error(error.message || 'Failed to create order. Please try again.');
      }
      

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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6 text-white rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">{selectedMenu.name}</h3>
                          {selectedMenu.price > 0 && (
                            <p className="text-emerald-100 text-sm">₹{selectedMenu.price}</p>
                          )}
                          <p className="text-emerald-100 text-xs">From: {selectedMenu.menuName}</p>
                          <p className="text-emerald-100 text-sm capitalize">{selectedMenu.dayOfWeek} Menu</p>
                        </div>
                        <button
                          onClick={() => setSelectedMenu(null)}
                          className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 ml-2 flex-shrink-0"
                        >
                          <span className="text-lg">✕</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      {/* Categories Section */}
                      {selectedMenu.categories && selectedMenu.categories.length > 0 && (
                        <div className="mb-6 sm:mb-8">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Menu Categories
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {selectedMenu.categories.map((category) => (
                              <div key={category.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                                <h5 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{category.name}</h5>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{category.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Menu Items by Meal Type */}
                      <div className="space-y-4 sm:space-y-6 overflow-visible">
                        {/* Breakfast Items */}
                        {selectedMenu.hasBreakfast && (
                          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-emerald-200 overflow-visible">
                            <h4 className="text-base sm:text-lg font-semibold text-emerald-800 mb-3 sm:mb-4 flex items-center gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs sm:text-sm">B</span>
                              </div>
                              <span>Breakfast Items</span>
                            </h4>
                          
                            {/* Breakfast Delivery Location */}
                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-emerald-200 relative overflow-visible w-full">
                              <label className="block text-sm font-semibold text-emerald-800 mb-2 sm:mb-3 flex items-center gap-2">
                                <span className="text-emerald-500">📍</span>
                                <span className="text-sm sm:text-base">🍳 Breakfast Delivery Address</span>
                              </label>
                              <div className="relative z-20 w-full">
                                <AddressPicker
                                  value={deliveryLocationNames.breakfast || deliveryLocations.breakfast}
                                  onChange={(e) => {
                                    const addressId = e.target.value;
                                    const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                    handleDeliveryLocationChange('breakfast', addressId, displayName);
                                  }}
                                  placeholder="Select breakfast delivery address..."
                                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                                  mealType="breakfast"
                                />
                              </div>
                              {!deliveryLocations.breakfast && (
                                <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                  Will use primary address for breakfast delivery
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Lunch Items */}
                        {selectedMenu.hasLunch && (
                          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-amber-200 overflow-visible">
                            <h4 className="text-base sm:text-lg font-semibold text-amber-800 mb-3 sm:mb-4 flex items-center gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs sm:text-sm">L</span>
                              </div>
                              <span>Lunch Items</span>
                            </h4>
                            
                            {/* Lunch Delivery Location */}
                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-amber-200 relative overflow-visible w-full">
                              <label className="block text-sm font-semibold text-amber-800 mb-2 sm:mb-3 flex items-center gap-2">
                                <span className="text-amber-500">📍</span>
                                <span className="text-sm sm:text-base">🍽️ Lunch Delivery Address</span>
                              </label>
                              <div className="relative z-20 w-full">
                                <AddressPicker
                                  value={deliveryLocationNames.lunch || deliveryLocations.lunch}
                                  onChange={(e) => {
                                    const addressId = e.target.value;
                                    const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                    handleDeliveryLocationChange('lunch', addressId, displayName);
                                  }}
                                  placeholder="Select lunch delivery address..."
                                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-sm"
                                  mealType="lunch"
                                />
                              </div>
                              {!deliveryLocations.lunch && (
                                <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                  Will use primary address for lunch delivery
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dinner Items */}
                        {selectedMenu.hasDinner && (
                          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-rose-200 overflow-visible relative">
                            <h4 className="text-base sm:text-lg font-semibold text-rose-800 mb-3 sm:mb-4 flex items-center gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs sm:text-sm">D</span>
                              </div>
                              <span>Dinner Items</span>
                            </h4>
                            
                            {/* Dinner Delivery Location */}
                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-rose-200 relative overflow-visible w-full" style={{ zIndex: 50 }}>
                              <label className="block text-sm font-semibold text-rose-800 mb-2 sm:mb-3 flex items-center gap-2">
                                <span className="text-rose-500">📍</span>
                                <span className="text-sm sm:text-base">🌙 Dinner Delivery Address</span>
                              </label>
                              <div className="relative z-40 w-full">
                                <AddressPicker
                                  value={deliveryLocationNames.dinner || deliveryLocations.dinner}
                                  onChange={(e) => {
                                    const addressId = e.target.value;
                                    const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                    handleDeliveryLocationChange('dinner', addressId, displayName);
                                  }}
                                  placeholder="Select dinner delivery address..."
                                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-sm"
                                  mealType="dinner"
                                />
                              </div>
                              {!deliveryLocations.dinner && (
                                <div className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
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
      
      {/* Menu Selection Popup */}
      <Modal
        title="Menu Selected"
        open={showMenuPopup}
        onCancel={() => setShowMenuPopup(false)}
        footer={[
          <button
            key="ok"
            onClick={() => setShowMenuPopup(false)}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
          >
            OK
          </button>
        ]}
        width="90%"
        style={{ 
          maxWidth: '300px',
          top: '5%'
        }}
        bodyStyle={{ textAlign: 'center', padding: '12px' }}
        maskClosable={true}
        closable={true}
        destroyOnClose={true}
        wrapClassName="menu-selection-modal"
      >
        <div className="text-center">
          <div className="mb-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
              <span className="text-sm text-green-600">✓</span>
            </div>
            <p className="text-gray-700 text-xs">{menuPopupMessage}</p>
          </div>
        </div>
      </Modal>
      
      {/* Admin Order Blocked Modal */}
      <AdminOrderBlockedModal
        visible={showAdminBlockModal}
        onClose={closeAdminBlockModal}
        onSwitchAccount={handleSwitchAccount}
      />
    </div>
  );
};

export default BookingPage; 