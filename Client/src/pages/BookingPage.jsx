import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import { useMenusForBooking } from '../hooks/adminHook/adminHook';
import { useOrder, useCalculateMenuPricing, useCalculateOrderTotal } from '../hooks/userHooks/useOrder';
import { useAddress } from '../hooks/userHooks/userAddress';
import { useAdminOrderBlock } from '../hooks/userHooks/useAdminOrderBlock';
import { useSeller } from '../hooks/sellerHooks/useSeller';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast,
  showOrderSuccess,
  showOrderError,
  showValidationError,
  showRequiredFieldError
} from '../utils/toastConfig.jsx';
import AddressPicker from '../components/AddressPicker';
import AdminOrderBlockedModal from '../components/AdminOrderBlockedModal';
import { 
  BookingHeader, 
  DateSelector, 
  MenuSelector, 
  OrderSummary,
  MealSkipSelector
} from '../components/booking';
import useAuthStore from '../stores/Zustand.store';
import axiosInstance from '../api/axios.js';

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

  // Seller user selection state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserAddresses, setSelectedUserAddresses] = useState([]);
  const [isLoadingUserAddresses, setIsLoadingUserAddresses] = useState(false);

  // Hooks
  const { createOrder, isCreating } = useOrder();  
  const { addresses: userAddresses } = useAddress();
  const { data: menusData, isLoading: menusLoading, error: menusError } = useMenusForBooking();
  const { sellerUsers, loading: sellerUsersLoading, getSellerUsers, isSeller } = useSeller();
  const calculateMenuPricing = useCalculateMenuPricing();
  const calculateOrderTotal = useCalculateOrderTotal();
  const { showAdminBlockModal, handleOrderError, handleSwitchAccount, closeAdminBlockModal } = useAdminOrderBlock();
  const { user } = useAuthStore();
  const menus = menusData?.data || [];

  // Helper functions
  const getAddressDisplayName = (addressId) => {
    // If seller has selected a user, use that user's addresses
    if (isSeller && selectedUser && selectedUserAddresses) {
      const address = selectedUserAddresses.find(addr => addr.id === addressId);
      if (address) {
        return `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
      }
    }
    
    // Fallback to logged-in user's addresses
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
              showSuccessToast(`Selected 5 weekdays from ${startDateDisplay} to ${endDateDisplay}`);
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
      
              showSuccessToast(message);
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
        showErrorToast('Please select at least one date first for daily flexible plan');
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
        showSuccessToast(`Applied "${menuDisplayName}" to ${selectedDates.length} dates`);
      } else {
        // Apply only to the first selected date
        const firstDate = selectedDates[0];
        const dateStr = firstDate.toISOString().split('T')[0];
        setDateMenuSelections(prev => ({
          ...prev,
          [dateStr]: menu
        }));
        showSuccessToast(`Applied "${menuDisplayName}" to ${formatDateForDisplay(firstDate)}`);
      }
      return;
    }
    
    // Original logic for other modes
    const validation = validateMenuForSelectedDates(menu);
    if (!validation.isValid) {
              showValidationError(validation.message);
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
      // Check if user is authenticated
      if (!user || !user.id) {
        showErrorToast('Please login to continue with your order');
        return;
      }

      if (getTotalItems() === 0) {
        showErrorToast('Please select at least one item to order');
        return;
      }

      if (selectedDates.length === 0) {
        showErrorToast('Please select at least one date for your order');
        return;
      }

      if (!selectedMenu) {
        showErrorToast('Please select a menu for your order');
        return;
      }

      // Check if user has provided either primary address or meal-specific addresses
      const hasPrimaryAddress = deliveryLocations.full;
      const hasMealAddresses = deliveryLocations.breakfast || deliveryLocations.lunch || deliveryLocations.dinner;
      
      if (!hasPrimaryAddress && !hasMealAddresses) {
        showErrorToast('Please select at least one delivery address (primary or meal-specific)');
        return;
      }

                      // For comprehensive menus (like August Menu), create delivery items for each meal type
        if (selectedMenu.isComprehensiveMenu) {
          
          const orderTimes = ['Breakfast', 'Lunch', 'Dinner']; // All meal times for comprehensive menus
          
          // Create order items for the comprehensive menu
          const orderItems = [];
          if (selectedMenu.mealTypes.breakfast && selectedMenu.mealTypes.breakfast.length > 0) {
            selectedMenu.mealTypes.breakfast.forEach(item => {
              orderItems.push({
                menuItemId: item.id,
                quantity: 1,
                mealType: 'breakfast'
              });
            });
          }
          if (selectedMenu.mealTypes.lunch && selectedMenu.mealTypes.lunch.length > 0) {
            selectedMenu.mealTypes.lunch.forEach(item => {
              orderItems.push({
                menuItemId: item.id,
                quantity: 1,
                mealType: 'lunch'
              });
            });
          }
          if (selectedMenu.mealTypes.dinner && selectedMenu.mealTypes.dinner.length > 0) {
            selectedMenu.mealTypes.dinner.forEach(item => {
              orderItems.push({
                menuItemId: item.id,
                quantity: 1,
                mealType: 'dinner'
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
            skipMeals: skipMeals,
            // Include userId for seller-created users, otherwise use logged-in user
            userId: selectedUser?.id || user?.id
          };



          // Ensure userId is always set
          if (!orderData.userId) {
            console.error('BookingPage - userId is missing from orderData');
            showErrorToast('User ID is missing. Please try logging in again.');
            return;
          }

          // Don't create order yet - save order data for payment
        const orderDataForPayment = {
          ...orderData,
          orderDate: selectedDates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0], // Use first selected date
          menu: selectedMenu,
          items: [],
          deliveryLocationNames: deliveryLocationNames,
          totalPrice: getTotalPrice()
        };



        setSavedOrder(orderDataForPayment);
        showOrderSuccess('Order data prepared! Proceed to payment to confirm your order.');



        // Save order data to localStorage for payment page
        localStorage.setItem('savedOrder', JSON.stringify(orderDataForPayment));
        

        
        // Redirect to payment page with order data (no orderId yet)
        navigate('/jkhm/payment', { 
          state: { orderData: orderDataForPayment } 
        });
              } else if (hasMenuItemType(selectedMenu, 'daily rates') || hasMenuItemType(selectedMenu, 'daily rate')) {
          // For daily rates, create delivery items for each selected date and meal type
          
          const orderTimes = [];
          if (selectedMenu.hasBreakfast) orderTimes.push('Breakfast');
          if (selectedMenu.hasLunch) orderTimes.push('Lunch');
          if (selectedMenu.hasDinner) orderTimes.push('Dinner');

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
            skipMeals: skipMeals,
            // Include userId for seller-created users, otherwise use logged-in user
            userId: selectedUser?.id || user?.id
          };



          // Ensure userId is always set for daily rates
          if (!orderData.userId) {
            console.error('BookingPage - userId is missing from daily rates orderData');
            showErrorToast('User ID is missing. Please try logging in again.');
            return;
          }

          // Don't create order yet - save order data for payment
          const orderDataForPayment = {
            ...orderData,
            orderDate: selectedDates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0], // Use first selected date
            menu: selectedMenu,
            items: [],
            deliveryLocationNames: deliveryLocationNames,
            totalPrice: getTotalPrice()
          };

          // Ensure userId is always set for daily rates
          if (!orderData.userId) {
            // userId is missing from daily rates orderData
          }

          setSavedOrder(orderDataForPayment);
          

          
          showOrderSuccess('Order data prepared! Proceed to payment to confirm your order.');

                    // Save order data to localStorage for payment page
          localStorage.setItem('savedOrder', JSON.stringify(orderDataForPayment));
          
          // Redirect to payment page with order data (no orderId yet)
          navigate('/jkhm/payment', { 
            state: { orderData: orderDataForPayment } 
          });
      } else {
        // For regular menus (not comprehensive, not daily rates)
        
        const orderTimes = [];
        if (selectedMenu.hasBreakfast) orderTimes.push('Breakfast');
        if (selectedMenu.hasLunch) orderTimes.push('Lunch');
        if (selectedMenu.hasDinner) orderTimes.push('Dinner');

        // Create order items for the selected menu
        const orderItems = [];
        if (selectedMenu.menuItem) {
          // For regular menus, create items for each meal type that the menu supports
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
          skipMeals: skipMeals,
          // Include userId for seller-created users, otherwise use logged-in user
          userId: selectedUser?.id || user?.id
        };
        
        // Don't create order yet - save order data for payment
        const orderDataForPayment = {
          ...orderData,
          orderDate: selectedDates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0], // Use first selected date
          menu: selectedMenu,
          items: [],
          deliveryLocationNames: deliveryLocationNames,
          totalPrice: getTotalPrice()
        };



        // Ensure userId is always set for regular menu
        if (!orderData.userId) {
          console.error('BookingPage - userId is missing from regular menu orderData');
          showErrorToast('User ID is missing. Please try logging in again.');
          return;
        }

        setSavedOrder(orderDataForPayment);
        

        
        showOrderSuccess('Order data prepared! Proceed to payment to confirm your order.');

        // Save order data to localStorage for payment page
        localStorage.setItem('savedOrder', JSON.stringify(orderDataForPayment));
        
        // Redirect to payment page with order data (no orderId yet)
        navigate('/jkhm/payment', { 
          state: { orderData: orderDataForPayment } 
        });
      }

    } catch (error) {
      console.error('Error creating order:', error);
      

      
      // Check if it's an admin order blocking error
      if (handleOrderError(error)) {
        // Error was handled by the admin block modal
        return;
      }
      
      // Check if it's a database connection error
      if (error.message && error.message.includes('database')) {
        showErrorToast('Database connection failed. Please check your connection and try again.', 'Database Error');
      } else {
        showOrderError(error.message || 'Failed to create order. Please try again.');
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
    showSuccessToast(`Selected "${getPrimaryMenuItemName(menu)}" for ${formatDateForDisplay(date)}`, 'Menu Selected');
  };

  const removeDateMenuSelection = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    setDateMenuSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[dateStr];
      return newSelections;
    });
            showSuccessToast(`Removed menu selection for ${formatDateForDisplay(date)}`);
  };

  // Add useEffect to fetch seller users when component mounts
  useEffect(() => {
    if (isSeller) {
      getSellerUsers();
    }
  }, [isSeller]); // Remove getSellerUsers from dependencies to prevent infinite loop

  // Add user selection handler
  const handleUserSelection = async (userId) => {
    if (!userId) {
      setSelectedUser(null);
      setSelectedUserAddresses([]);
      return;
    }

    const user = sellerUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      // Fetch addresses for the selected user
      await fetchUserAddresses(user.id);
    }
  };

  // Function to fetch addresses for the selected user
  const fetchUserAddresses = async (userId) => {
    if (!userId) return;
    
    setIsLoadingUserAddresses(true);
    try {
      // Call the API to get addresses for the selected user
      const response = await axiosInstance.get(`/seller/users/${userId}/addresses`);
      
      if (response.data.success) {
        setSelectedUserAddresses(response.data.data || []);
      } else {
        console.error('Failed to fetch addresses:', response.data.message);
        setSelectedUserAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      setSelectedUserAddresses([]);
    } finally {
      setIsLoadingUserAddresses(false);
    }
  };

  // Function to create address for the selected user
  const createAddressForUser = async (userId, addressData) => {
    if (!userId) {
      throw new Error('No user selected');
    }
    
    try {
      const response = await axiosInstance.post(`/seller/users/${userId}/addresses`, addressData);
      
      if (response.data.success) {
        // Refresh the addresses list
        await fetchUserAddresses(userId);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create address');
      }
    } catch (error) {
      console.error('Error creating address for user:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar onSignInClick={handleOpenAuthSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={handleCloseAuthSlider} />
      
      <BookingHeader />

      {/* User Selection Section - Only visible to sellers */}
      
      {isSeller && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Select Customer</h3>
                    <p className="text-gray-600 text-sm">
                      Choose a customer to manage their addresses and complete the booking
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => handleUserSelection(e.target.value || null)}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/90 backdrop-blur-sm text-sm min-w-[250px] font-medium transition-all duration-200 hover:border-gray-300"
                  disabled={sellerUsersLoading}
                >
                  <option value="">👤 Select a customer...</option>
                                     {sellerUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.contacts?.[0]?.firstName} {user.contacts?.[0]?.lastName} - {user.contacts?.[0]?.phoneNumbers?.[0]?.number || 'No phone'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected User Info */}
            {selectedUser && (
              <div className="mt-6 p-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-emerald-800">
                        {selectedUser.contacts?.[0]?.firstName} {selectedUser.contacts?.[0]?.lastName}
                      </h4>
                      <p className="text-sm text-emerald-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {selectedUser.contacts?.[0]?.phoneNumbers?.[0]?.number || 'No phone'}
                      </p>
                      <p className="text-xs text-emerald-500 font-mono bg-emerald-100 px-2 py-1 rounded-full">
                        ID: {selectedUser.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-4 py-2 rounded-xl ${selectedUserAddresses.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      <p className="text-sm font-semibold">
                        {selectedUserAddresses.length} address{selectedUserAddresses.length !== 1 ? 'es' : ''} available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            


            {/* Help text when no users available */}
            {sellerUsers.length === 0 && !sellerUsersLoading && (
              <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-amber-800 mb-2">No customers yet</h4>
                    <p className="text-amber-700">
                      Create your first customer to get started with bookings and manage their orders.
                    </p>
                  </div>
                </div>
              </div>
            )}
            

          </div>
        </div>
      )}



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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-16">
          {/* Left Column - Menu Sections */}
          <div className="lg:col-span-2">
            <div className="max-w-2xl lg:max-w-none mx-auto lg:mx-0 space-y-8">
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
                <div className="mb-8">
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-visible">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-6 sm:p-8 text-white rounded-t-3xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-2 truncate">{selectedMenu.name}</h3>
                                {selectedMenu.price > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-white">₹{selectedMenu.price}</span>
                                    <span className="text-emerald-100 text-sm bg-white/20 px-3 py-1 rounded-full">Price</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <span className="text-emerald-100 text-sm bg-white/20 px-3 py-1 rounded-full">From: {selectedMenu.menuName}</span>
                              <span className="text-emerald-100 text-sm bg-white/20 px-3 py-1 rounded-full capitalize">{selectedMenu.dayOfWeek} Menu</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedMenu(null)}
                            className="text-white/80 hover:text-white transition-all duration-200 p-3 rounded-2xl hover:bg-white/20 ml-4 flex-shrink-0 backdrop-blur-sm"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8">
                      {/* Categories Section */}
                      {selectedMenu.categories && selectedMenu.categories.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                            <span>Menu Categories</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedMenu.categories.map((category) => (
                              <div key={category.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                  </div>
                                  <h5 className="font-bold text-gray-800 text-lg">{category.name}</h5>
                                </div>
                                <p className="text-gray-600 leading-relaxed">{category.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Menu Items by Meal Type */}
                      <div className="space-y-4 sm:space-y-6 overflow-visible">
                        {/* Breakfast Items */}
                        {selectedMenu.hasBreakfast && (
                          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-6 sm:p-8 border border-emerald-200/50 overflow-visible shadow-lg">
                            <h4 className="text-xl font-bold text-emerald-800 mb-6 flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              </div>
                              <span>Breakfast Items</span>
                            </h4>
                           
                            {/* Breakfast Delivery Location */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-emerald-200/50 relative overflow-visible w-full shadow-sm">
                              <label className="block text-lg font-bold text-emerald-800 mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <span>🍳 Breakfast Delivery Address</span>
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
                                  className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm font-medium transition-all duration-200 hover:border-emerald-300"
                                  mealType="breakfast"
                                  addresses={selectedUserAddresses}
                                  onAddressCreate={createAddressForUser}
                                  selectedUserId={selectedUser?.id}
                                />
                              </div>
                              {!deliveryLocations.breakfast && (
                                <div className="mt-3 text-sm text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                  Will use primary address for breakfast delivery
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Lunch Items */}
                        {selectedMenu.hasLunch && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-amber-200/50 overflow-visible shadow-lg">
                            <h4 className="text-xl font-bold text-amber-800 mb-6 flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span>Lunch Items</span>
                            </h4>
                            
                            {/* Lunch Delivery Location */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-amber-200/50 relative overflow-visible w-full shadow-sm">
                              <label className="block text-lg font-bold text-amber-800 mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <span>🍽️ Lunch Delivery Address</span>
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
                                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 bg-white text-sm font-medium transition-all duration-200 hover:border-amber-300"
                                  mealType="lunch"
                                  addresses={selectedUserAddresses}
                                  onAddressCreate={createAddressForUser}
                                  selectedUserId={selectedUser?.id}
                                />
                              </div>
                              {!deliveryLocations.lunch && (
                                <div className="mt-3 text-sm text-amber-600 flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl">
                                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                  Will use primary address for lunch delivery
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dinner Items */}
                        {selectedMenu.hasDinner && (
                          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-6 sm:p-8 border border-rose-200/50 overflow-visible relative shadow-lg">
                            <h4 className="text-xl font-bold text-rose-800 mb-6 flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                              </div>
                              <span>Dinner Items</span>
                            </h4>
                            
                            {/* Dinner Delivery Location */}
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-rose-200/50 relative overflow-visible w-full shadow-sm" style={{ zIndex: 50 }}>
                              <label className="block text-lg font-bold text-rose-800 mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <span>🌙 Dinner Delivery Address</span>
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
                                  className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 bg-white text-sm font-medium transition-all duration-200 hover:border-rose-300"
                                  mealType="dinner"
                                  addresses={selectedUserAddresses}
                                  onAddressCreate={createAddressForUser}
                                  selectedUserId={selectedUser?.id}
                                />
                              </div>
                              {!deliveryLocations.dinner && (
                                <div className="mt-3 text-sm text-rose-600 flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-xl">
                                  <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
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
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <OrderSummary
               selectedMenu={selectedMenu}
               selectedDates={selectedDates}
               orderedItems={[]} // Empty array for now
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
               formatPrice={(price) => price} // Simple price formatter
               skipMeals={skipMeals}
               orderMode={orderMode}
               dateMenuSelections={dateMenuSelections}
               onDateMenuSelection={handleDateMenuSelection}
               onRemoveDateMenuSelection={removeDateMenuSelection}
               // Pass addresses for seller-selected users
               addresses={selectedUserAddresses}
               onAddressCreate={createAddressForUser}
               selectedUserId={selectedUser?.id}
             />
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu Selection Popup */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Menu Selected</span>
          </div>
        }
        open={showMenuPopup}
        onCancel={() => setShowMenuPopup(false)}
        footer={[
          <button
            key="ok"
            onClick={() => setShowMenuPopup(false)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Got it! 👍
          </button>
        ]}
        width="90%"
        style={{ 
          maxWidth: '400px',
          top: '10%'
        }}
        styles={{
          body: { textAlign: 'center', padding: '24px' }
        }}
        maskClosable={true}
        closable={true}
        destroyOnHidden={true}
        wrapClassName="menu-selection-modal"
      >
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 text-base leading-relaxed">{menuPopupMessage}</p>
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