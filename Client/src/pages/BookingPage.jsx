import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import { useMenusForBooking } from '../hooks/adminHook/adminHook';
import { useOrder } from '../hooks/userHooks/useOrder';
import { useAddress } from '../hooks/userHooks/userAddress';
import { toast } from 'react-toastify';
import AddressPicker from '../components/AddressPicker';
import { 
  BookingHeader, 
  DateSelector, 
  MenuSelector, 
  OrderSummary 
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
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [orderMode, setOrderMode] = useState('single');
  const [savedOrder, setSavedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [orderedItems, setOrderedItems] = useState({
    breakfast: [],
    lunch: [],
    dinner: []
  });
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

  // Hooks
  const { createOrder, isCreating } = useOrder();
  const { addresses: userAddresses } = useAddress();
  const { data: menusData, isLoading: menusLoading, error: menusError } = useMenusForBooking();
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
    const menuName = menu.name?.toLowerCase() || '';
    const isWeekdayByDay = dayOfWeek === 'weekday' || dayOfWeek === 'monday' || dayOfWeek === 'tuesday' || dayOfWeek === 'wednesday' || dayOfWeek === 'thursday' || dayOfWeek === 'friday';
    const isWeekdayByName = menuName.includes('week day') || menuName.includes('weekday') || menuName.includes('monday') || menuName.includes('tuesday') || menuName.includes('wednesday') || menuName.includes('thursday') || menuName.includes('friday');
    return isWeekdayByDay || isWeekdayByName;
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateSelection = (date) => {
    if (selectedMenu && isWeekdayMenu(selectedMenu) && orderMode !== 'single') {
      handleWeekdayMenuDateSelection(date);
      return;
    }

    if (orderMode === 'single') {
      setSelectedDate(date);
      setSelectedDates([date]);
    } else {
      setSelectedDates(prev => {
        const dateStr = date.toDateString();
        const exists = prev.find(d => d.toDateString() === dateStr);
        if (exists) {
          return prev.filter(d => d.toDateString() !== dateStr);
        } else {
          return [...prev, date];
        }
      });
    }
  };

  const handleWeekdayMenuDateSelection = (startDate) => {
    const selectedDates = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 5; i++) {
      selectedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setSelectedDates(selectedDates);
  };

  const handleResetOrder = () => {
    setOrderedItems({
      breakfast: [],
      lunch: [],
      dinner: []
    });
    setDeliveryLocations({
      breakfast: '',
      lunch: '',
      dinner: '',
      full: ''
    });
    setDeliveryLocationNames({
      breakfast: '',
      lunch: '',
      dinner: '',
      full: ''
    });
    setSelectedMenu(null);
    setSelectedDates([]);
    setSavedOrder(null);
    setOrderMode('single');
    setShowDateSelection(false);
    
    toast.success('Order reset successfully!');
  };

  const handleUpdateOrder = () => {
    if (!savedOrder) {
      toast.error('No saved order to update');
      return;
    }
    
    setShowDateSelection(true);
    setExpandedSections(prev => ({ ...prev, dateSelection: true }));
    setIsUpdating(true);
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

  // Date initialization
  useEffect(() => {
    if (!selectedMenu || !isWeekdayMenu(selectedMenu)) {
      if (orderMode === 'single') {
        setSelectedDates([selectedDate]);
      } else {
        setSelectedDates([]);
      }
    }
  }, [orderMode, selectedDate, selectedMenu]);

  useEffect(() => {
    if (orderMode === 'single' && selectedDates.length === 0 && (!selectedMenu || !isWeekdayMenu(selectedMenu))) {
      setSelectedDates([selectedDate]);
    }
  }, [orderMode, selectedDates.length, selectedDate, selectedMenu]);

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

  const addToOrder = (mealType, item) => {
    setOrderedItems(prev => {
      const newItems = {
        ...prev,
        [mealType]: [...prev[mealType], { 
          ...item, 
          orderItemId: Date.now() + Math.random(),
          price: item.prices && item.prices[0] ? item.prices[0].totalPrice : 0
        }]
      };
      return newItems;
    });
    
    toast.success(`${item.name} added to ${mealType} order!`);
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

  const handleMenuSelection = (menu) => {
    const validation = validateMenuForSelectedDates(menu);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    setSelectedMenu(menu);
    
    if (isWeekdayMenu(menu) && orderMode !== 'single') {
      toast.info('Weekday Menu Selected! Click any date to auto-select 7 consecutive days.');
    }
    
    if (isWeekdayMenu(menu) && selectedDates.length > 0 && orderMode !== 'single') {
      const firstSelectedDate = selectedDates[0];
      const shouldAutoSelect = window.confirm(
        `You've selected a weekday menu. Would you like to auto-select 7 consecutive days starting from ${formatDateForDisplay(firstSelectedDate)}?`
      );
      
      if (shouldAutoSelect) {
        handleWeekdayMenuDateSelection(firstSelectedDate);
      }
    }
  };

  const removeFromOrder = (mealType, itemId) => {
    setOrderedItems(prev => ({
      ...prev,
      [mealType]: prev[mealType].filter(item => item.orderItemId !== itemId)
    }));
  };

  const getTotalItems = () => {
    const total = orderedItems.breakfast.length + orderedItems.lunch.length + orderedItems.dinner.length;
    return total;
  };

  const getTotalPrice = () => {
    let total = 0;
    Object.values(orderedItems).forEach(items => {
      items.forEach(item => {
        if (item.prices && item.prices[0]) {
          total += item.prices[0].totalPrice;
        }
      });
    });
    return total;
  };

  const getFilteredMenus = () => {
    if (!menus || dietaryPreference === 'all') {
      return menus;
    }

    return menus.filter(menu => {
      if (menu.menuCategories && menu.menuCategories.length > 0) {
        const categoryNames = menu.menuCategories.map(cat => cat.name.toLowerCase());
        
        if (dietaryPreference === 'veg') {
          return categoryNames.some(name => name.includes('veg') && !name.includes('non'));
        } else if (dietaryPreference === 'non-veg') {
          return categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
        }
      }
      
      const allItems = [
        ...(menu.mealTypes.breakfast || []),
        ...(menu.mealTypes.lunch || []),
        ...(menu.mealTypes.dinner || [])
      ];
      
      if (dietaryPreference === 'veg') {
        const categoryNames = menu.categories?.map(cat => cat.name.toLowerCase()) || [];
        return !categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
      } else if (dietaryPreference === 'non-veg') {
        const categoryNames = menu.categories?.map(cat => cat.name.toLowerCase()) || [];
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

      if (!deliveryLocations.full) {
        toast.error('Please select a primary delivery address');
        return;
      }

      const orderTimes = [];
      if (orderedItems.breakfast.length > 0) orderTimes.push('Morning');
      if (orderedItems.lunch.length > 0) orderTimes.push('Noon');
      if (orderedItems.dinner.length > 0) orderTimes.push('Night');

      const orderItems = [];
      orderedItems.breakfast.forEach(item => {
        orderItems.push({
          menuItemId: item.id,
          quantity: 1
        });
      });
      orderedItems.lunch.forEach(item => {
        orderItems.push({
          menuItemId: item.id,
          quantity: 1
        });
      });
      orderedItems.dinner.forEach(item => {
        orderItems.push({
          menuItemId: item.id,
          quantity: 1
        });
      });

      const primaryAddressId = deliveryLocations.full;
      
      const orderData = {
        orderDate: selectedDate.toISOString().split('T')[0],
        orderTimes: orderTimes,
        orderItems: orderItems,
        deliveryAddressId: primaryAddressId,
        deliverySchedule: {
          breakfast: {
            mealTime: 'Morning',
            deliveryAddressId: deliveryLocations.breakfast || primaryAddressId,
            items: orderedItems.breakfast.map(item => ({
              menuItemId: item.id,
              name: item.productName || item.name,
              quantity: 1
            }))
          },
          lunch: {
            mealTime: 'Noon',
            deliveryAddressId: deliveryLocations.lunch || primaryAddressId,
            items: orderedItems.lunch.map(item => ({
              menuItemId: item.id,
              name: item.productName || item.name,
              quantity: 1
            }))
          },
          dinner: {
            mealTime: 'Night',
            deliveryAddressId: deliveryLocations.dinner || primaryAddressId,
            items: orderedItems.dinner.map(item => ({
              menuItemId: item.id,
              name: item.productName || item.name,
              quantity: 1
            }))
          }
        },
        deliveryLocations: {
          breakfast: deliveryLocations.breakfast || primaryAddressId,
          lunch: deliveryLocations.lunch || primaryAddressId,
          dinner: deliveryLocations.dinner || primaryAddressId,
        },
        selectedDates: selectedDates.map(date => date.toISOString().split('T')[0]),
        orderMode: orderMode,
        menuId: selectedMenu.id,
        menuName: selectedMenu.name
      };

      const newOrder = await createOrder(orderData);

      setSavedOrder({
        ...orderData,
        id: newOrder.id,
        menu: selectedMenu,
        items: orderedItems,
        deliveryLocations: deliveryLocations,
        deliveryLocationNames: deliveryLocationNames
      });

      toast.success('Order created successfully!');
      setShowDateSelection(false);
      setIsUpdating(false);

    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order. Please try again.');
    }
  };

  const handleUpdateExistingOrder = async () => {
    try {
      if (!savedOrder) {
        toast.error('No saved order to update');
        return;
      }

      const updatedOrderData = {
        ...savedOrder,
        selectedDates: selectedDates.map(date => date.toISOString().split('T')[0]),
        orderMode: orderMode
      };

      const newOrder = await createOrder(updatedOrderData);

      setSavedOrder({
        ...updatedOrderData,
        id: newOrder.id
      });

      toast.success('Order updated successfully!');
      setShowDateSelection(false);
      setIsUpdating(false);

    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.message || 'Failed to update order. Please try again.');
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
    return date.toDateString() === selectedDate.toDateString();
  };

  const getCleanMenuItemName = (itemName) => {
    if (!itemName) return '';
    return itemName.replace(/weekly menu/gi, '').trim();
  };

  const handleDeliveryLocationChange = (type, addressId, displayName) => {
    setDeliveryLocations(prev => ({ ...prev, [type]: addressId }));
    setDeliveryLocationNames(prev => ({ ...prev, [type]: displayName }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSignInClick={handleOpenAuthSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={handleCloseAuthSlider} />
      
      <BookingHeader />

      <DateSelector
        dates={dates}
        selectedDate={selectedDate}
        selectedDates={selectedDates}
        orderMode={orderMode}
        currentDate={currentDate}
        isMobile={isMobile}
        onDateSelection={handleDateSelection}
        onNextDays={goToNextDays}
        onPreviousDays={goToPreviousDays}
        onOrderModeChange={setOrderMode}
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
              />

              {/* Selected Menu Details */}
              {selectedMenu && (
                <div className="mb-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{selectedMenu.name}</h3>
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
                      <div className="space-y-8">
                        {/* Breakfast Items */}
                        {selectedMenu.hasBreakfast && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                            <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">B</span>
                              </div>
                              Breakfast Items
                            </h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              {selectedMenu.mealTypes.breakfast.map((item, index) => (
                                <div 
                                  key={item.id || index} 
                                  className="group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                                  onClick={() => addToOrder('breakfast', item)}
                                >
                                  {item.prices && item.prices[0] && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-bold text-green-600">₹{item.prices[0].totalPrice}</span>
                                      <span className="text-xs text-gray-500">per item</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Breakfast Delivery Location */}
                            <div className="bg-white rounded-lg p-4 border border-green-200 relative">
                              <label className="block text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <span className="text-green-500">📍</span>
                                🍳 Breakfast Delivery Address
                              </label>
                              <div className="relative z-10">
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
                          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
                            <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-3">
                              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">L</span>
                              </div>
                              Lunch Items
                            </h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              {selectedMenu.mealTypes.lunch.map((item, index) => (
                                <div 
                                  key={item.id || index} 
                                  className="group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                                  onClick={() => addToOrder('lunch', item)}
                                >
                                  {item.prices && item.prices[0] && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-bold text-yellow-600">₹{item.prices[0].totalPrice}</span>
                                      <span className="text-xs text-gray-500">per item</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Lunch Delivery Location */}
                            <div className="bg-white rounded-lg p-4 border border-yellow-200 relative">
                              <label className="block text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                <span className="text-yellow-500">📍</span>
                                🍽️ Lunch Delivery Address
                              </label>
                              <div className="relative z-10">
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
                          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
                            <h4 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-3">
                              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">D</span>
                              </div>
                              Dinner Items
                            </h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              {selectedMenu.mealTypes.dinner.map((item, index) => (
                                <div 
                                  key={item.id || index} 
                                  className="group p-4 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
                                  onClick={() => addToOrder('dinner', item)}
                                >
                                  {item.prices && item.prices[0] && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-bold text-pink-600">₹{item.prices[0].totalPrice}</span>
                                      <span className="text-xs text-gray-500">per item</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Dinner Delivery Location */}
                            <div className="bg-white rounded-lg p-4 border border-pink-200 relative">
                              <label className="block text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                                <span className="text-pink-500">📍</span>
                                🌙 Dinner Delivery Address
                              </label>
                              <div className="relative z-10">
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
            orderedItems={orderedItems}
            deliveryLocations={deliveryLocations}
            deliveryLocationNames={deliveryLocationNames}
            savedOrder={savedOrder}
            isUpdating={isUpdating}
            isCreating={isCreating}
            getTotalItems={getTotalItems}
            getTotalPrice={getTotalPrice}
            getAddressDisplayName={getAddressDisplayName}
            isWeekdayMenu={isWeekdayMenu}
            isWeekday={isWeekday}
            formatDateForDisplay={formatDateForDisplay}
            onDeliveryLocationChange={handleDeliveryLocationChange}
            onUpdateOrder={handleUpdateOrder}
            onResetOrder={handleResetOrder}
            onUpdateExistingOrder={handleUpdateExistingOrder}
            onCancel={handleCancel}
            onSaveOrder={handleSaveOrder}
          />
                  </div>
      </div>
    </div>
  );
};

export default BookingPage; 