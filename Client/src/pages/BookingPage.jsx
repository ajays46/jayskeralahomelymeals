import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdArrowBack, 
  MdCalendarToday, 
  MdAdd, 
  MdRemove, 
  MdLocationOn,
  MdEdit,
  MdExpandMore,
  MdExpandLess,
  MdClose,
  MdRestaurant,
  MdSchedule,
  MdShoppingCart
} from 'react-icons/md';
import { FaRegCalendarAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import { useMenusForBooking } from '../hooks/adminHook/adminHook';
import LocationPicker from '../components/LocationPicker';
import AddressPicker from '../components/AddressPicker';
import { useOrder } from '../hooks/userHooks/useOrder';
import { useAddress } from '../hooks/userHooks/userAddress';
import { toast } from 'react-toastify';

const BookingPage = () => {
  const navigate = useNavigate();
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [dietaryPreference, setDietaryPreference] = useState('veg'); // 'all', 'veg', 'non-veg'
  const [expandedSections, setExpandedSections] = useState({
    menus: true,
    orderedItems: true
  });
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

  // Store address names for display
  const [deliveryLocationNames, setDeliveryLocationNames] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    full: ''
  });

  // Order hook
  const { createOrder, isCreating } = useOrder();

  // Fetch user addresses
  const { addresses: userAddresses } = useAddress();

  // Fetch menus for booking
  const { data: menusData, isLoading: menusLoading, error: menusError } = useMenusForBooking();
  console.log(menusData,'menusData');
  

  // Extract menus from the response
  const menus = menusData?.data || [];

  // Get address display name from address ID
  const getAddressDisplayName = (addressId) => {
    if (!addressId || !userAddresses) return '';
    const address = userAddresses.find(addr => addr.id === addressId);
    if (!address) return '';
    return `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
  };

  // Get day of week from selected date
  const getDayOfWeek = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const selectedDayOfWeek = getDayOfWeek(selectedDate);
  


  const handleOpenAuthSlider = () => setAuthSliderOpen(true);
  const handleCloseAuthSlider = () => setAuthSliderOpen(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Generate dates starting from current date
  const generateDates = () => {
    const dates = [];
    const startDate = new Date(currentDate);
    
    // Generate 7 days starting from current date
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  // Navigation functions
  const goToNextDays = () => {
    const newDate = new Date(currentDate);
    // On mobile, move by 5 days, on desktop move by 7 days
    const daysToMove = isMobile ? 5 : 7;
    newDate.setDate(currentDate.getDate() + daysToMove);
    setCurrentDate(newDate);
  };

  const goToPreviousDays = () => {
    const newDate = new Date(currentDate);
    // On mobile, move by 5 days, on desktop move by 7 days
    const daysToMove = isMobile ? 5 : 7;
    newDate.setDate(currentDate.getDate() - daysToMove);
    // Don't allow going before today
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
    
    // Show toast notification
    toast.success(`${item.name} added to ${mealType} order!`, {
      position: "top-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
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

  // Filter menus based on dietary preference
  const getFilteredMenus = () => {
    if (!menus || dietaryPreference === 'all') {
      return menus;
    }

    return menus.filter(menu => {
      // Check if menu has categories that match the preference
      if (menu.categories && menu.categories.length > 0) {
        const categoryNames = menu.categories.map(cat => cat.name.toLowerCase());
        
        if (dietaryPreference === 'veg') {
          return categoryNames.some(name => name.includes('veg') && !name.includes('non'));
        } else if (dietaryPreference === 'non-veg') {
          return categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
        }
      }
      
      // If no categories, check menu items
      const allItems = [
        ...(menu.mealTypes.breakfast || []),
        ...(menu.mealTypes.lunch || []),
        ...(menu.mealTypes.dinner || [])
      ];
      
      if (dietaryPreference === 'veg') {
        return allItems.every(item => item.foodType === 'VEG');
      } else if (dietaryPreference === 'non-veg') {
        return allItems.some(item => item.foodType === 'NON_VEG');
      }
      
      return true;
    });
  };

  const handleSaveOrder = async () => {
    try {
      // Validate that items are selected
      if (getTotalItems() === 0) {
        toast.error('Please select at least one item to order');
        return;
      }



      // Determine which meal types have orders
      const orderTimes = [];
      if (orderedItems.breakfast.length > 0) orderTimes.push('Morning');
      if (orderedItems.lunch.length > 0) orderTimes.push('Noon');
      if (orderedItems.dinner.length > 0) orderTimes.push('Night');

      if (orderTimes.length === 0) {
        toast.error('Please select at least one meal time');
        return;
      }

      // Prepare order items
      const orderItems = [];
      
      // Add breakfast items
      orderedItems.breakfast.forEach(item => {
        orderItems.push({
          menuItemId: item.id,
          quantity: 1
        });
      });

      // Add lunch items
      orderedItems.lunch.forEach(item => {
        orderItems.push({
          menuItemId: item.id,
          quantity: 1
        });
      });

      // Add dinner items
      orderedItems.dinner.forEach(item => {
        orderItems.push({
          menuItemId: item.id,
          quantity: 1
        });
      });

      // Prepare order data with detailed delivery information for AI routing
      const orderData = {
        orderDate: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
        orderTimes: orderTimes,
        orderItems: orderItems,
        deliveryAddressId: deliveryLocations.full || null, // Use full delivery address as primary
        // Detailed delivery information for AI routing engine
        deliverySchedule: {
          breakfast: {
            mealTime: 'Morning',
            deliveryAddressId: deliveryLocations.breakfast || null,
            items: orderedItems.breakfast.map(item => ({
              menuItemId: item.id,
              name: item.productName || item.name,
              quantity: 1
            }))
          },
          lunch: {
            mealTime: 'Noon',
            deliveryAddressId: deliveryLocations.lunch || null,
            items: orderedItems.lunch.map(item => ({
              menuItemId: item.id,
              name: item.productName || item.name,
              quantity: 1
            }))
          },
          dinner: {
            mealTime: 'Night',
            deliveryAddressId: deliveryLocations.dinner || null,
            items: orderedItems.dinner.map(item => ({
              menuItemId: item.id,
              name: item.productName || item.name,
              quantity: 1
            }))
          }
        },
        // Include delivery locations for each meal time in the request (for backward compatibility)
        deliveryLocations: {
          breakfast: deliveryLocations.breakfast || null,
          lunch: deliveryLocations.lunch || null,
          dinner: deliveryLocations.dinner || null
        }
      };

      // Create the order
      const newOrder = await createOrder(orderData);

      // Show success message
      toast.success('Order created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset the form
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

      // Navigate to orders page or show order confirmation
      navigate('/orders'); // You can create an orders page to show user's orders

    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleCancel = () => {
    navigate('/jkhm');
  };

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



  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSignInClick={handleOpenAuthSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={handleCloseAuthSlider} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b pt-20 sm:pt-22 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <MdRestaurant className="text-orange-600 text-xl sm:text-2xl" />
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Meal Booking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    {/* Month Display */}
          <div className="text-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
              {formatMonth(dates[0])} {dates[0].getFullYear()}
            </h2>
            {menusData && (
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Select a date and choose from available menu plans
              </p>
            )}

          </div>
          
          <div className="flex items-center justify-between">
            <button 
              onClick={goToPreviousDays}
              className="text-gray-600 hover:text-gray-800 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MdArrowBack className="text-lg sm:text-xl" />
            </button>
            <div className="flex gap-1 sm:gap-2 lg:gap-4 overflow-x-auto scrollbar-hide">
              {dates.map((date, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center p-1.5 sm:p-2 lg:p-3 rounded-full min-w-[40px] sm:min-w-[50px] lg:min-w-[60px] transition-all duration-300 flex-shrink-0 ${
                    isSelected(date) 
                      ? 'bg-green-500 text-white' 
                      : isToday(date)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${index >= 5 ? 'hidden sm:flex' : ''}`}
                >
                  <span className="text-xs sm:text-sm lg:text-base font-medium">{formatDayNumber(date)}</span>
                  <span className="text-xs lg:text-sm">{formatDay(date)}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={goToNextDays}
              className="text-gray-600 hover:text-gray-800 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MdArrowBack className="text-lg sm:text-xl rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Menu Sections */}
          <div className="lg:col-span-2">
            <div className="max-w-2xl lg:max-w-none mx-auto lg:mx-0">
              {/* Menu Selection */}
              <div className="mb-6">
                <div 
                  className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg"
                  onClick={() => toggleSection('menus')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white">
                      <MdRestaurant className="text-2xl" />
                    </div>
                    <div>
                      <span className="text-white font-bold text-xl">Available Menu Plans</span>
                      <p className="text-blue-100 text-sm mt-1">Select from our curated menu options</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/80 text-sm font-medium">
                      {menus.length} {menus.length === 1 ? 'Menu' : 'Menus'} Available
                    </span>
                    {expandedSections.menus ? (
                      <MdExpandLess className="text-white text-2xl" />
                    ) : (
                      <MdExpandMore className="text-white text-2xl" />
                    )}
                  </div>
                </div>

                {expandedSections.menus && (
                  <div className="bg-white rounded-xl p-6 mt-4 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-gray-800">Select a Menu Plan</h3>
                        {menusLoading && (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Click on a menu to view details
                      </div>
                    </div>

                    {/* Loading State */}
                    {menusLoading && (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-500 text-lg">Loading available menus...</p>
                        <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the latest menu options</p>
                      </div>
                    )}

                    {/* Error State */}
                    {menusError && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <p className="text-red-500 text-lg font-semibold">Error loading menus</p>
                        <p className="text-gray-500 text-sm mt-2">Please try again later or contact support</p>
                      </div>
                    )}

                    {/* Menu Cards */}
                    {!menusLoading && !menusError && (
                      <div>
                        {/* Dietary Preference Filter */}
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">Choose Your Preference</h4>
                          <div className="flex flex-wrap gap-3">
                            <button 
                              onClick={() => setDietaryPreference('veg')}
                              className={`px-6 py-3 rounded-lg border-2 font-medium transition-colors shadow-sm ${
                                dietaryPreference === 'veg'
                                  ? 'border-green-600 bg-green-100 text-green-800'
                                  : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              🥬 Vegetarian
                            </button>
                            <button 
                              onClick={() => setDietaryPreference('non-veg')}
                              className={`px-6 py-3 rounded-lg border-2 font-medium transition-colors shadow-sm ${
                                dietaryPreference === 'non-veg'
                                  ? 'border-red-600 bg-red-100 text-red-800'
                                  : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              🍖 Non-Vegetarian
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {getFilteredMenus().map((menu) => (
                          <div 
                            key={menu.id}
                            className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${
                              selectedMenu?.id === menu.id 
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                                : 'border-gray-200 hover:border-blue-300 bg-white'
                            }`}
                            onClick={() => setSelectedMenu(menu)}
                          >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative p-6">
                              {/* 1. Menu Name (First) */}
                              <div className="mb-4">
                                <h4 className="font-bold text-xl text-gray-800">{menu.name}</h4>
                              </div>
                              
                              {/* 2. Menu Item Names (Second) */}
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">Menu Items:</h5>
                                <div className="space-y-1">
                                  {menu.mealTypes.breakfast.map((item, index) => (
                                    <div key={`breakfast-${index}`} className="text-xs text-gray-600 bg-green-50 px-2 py-1 rounded">
                                      🍳 {item.name}
                                    </div>
                                  ))}
                                  {menu.mealTypes.lunch.map((item, index) => (
                                    <div key={`lunch-${index}`} className="text-xs text-gray-600 bg-yellow-50 px-2 py-1 rounded">
                                      🍽️ {item.name}
                                    </div>
                                  ))}
                                  {menu.mealTypes.dinner.map((item, index) => (
                                    <div key={`dinner-${index}`} className="text-xs text-gray-600 bg-pink-50 px-2 py-1 rounded">
                                      🌙 {item.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* 3. Menu Category Names (Third) */}
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">Categories:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {menu.categories && menu.categories.length > 0 ? (
                                    menu.categories.map((category) => (
                                      <span key={category.id} className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-200">
                                        {category.name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                      No categories
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* 4. Menu Items Details (Last) */}
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">Meal Types Included:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {menu.hasBreakfast && (
                                    <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
                                      🍳 Breakfast
                                    </span>
                                  )}
                                  {menu.hasLunch && (
                                    <span className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-full border border-yellow-200">
                                      🍽️ Lunch
                                    </span>
                                  )}
                                  {menu.hasDinner && (
                                    <span className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs font-medium px-3 py-1.5 rounded-full border border-pink-200">
                                      🌙 Dinner
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Selection indicator */}
                              <div className={`absolute bottom-4 right-4 transition-all duration-300 ${
                                selectedMenu?.id === menu.id 
                                  ? 'opacity-100 scale-100' 
                                  : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
                              }`}>
                                <div className="bg-blue-500 text-white rounded-full p-2 shadow-lg">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>

                        {!menusLoading && !menusError && getFilteredMenus().length === 0 && (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-gray-500 text-lg font-semibold">
                              {dietaryPreference === 'veg' 
                                ? 'No vegetarian menus available' 
                                : dietaryPreference === 'non-veg'
                                ? 'No non-vegetarian menus available'
                                : 'No menus available'
                              }
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                              {dietaryPreference !== 'all' 
                                ? 'Try selecting a different preference or check back later'
                                : 'Please check back later for new menu options'
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Menu Details */}
              {selectedMenu && (
                <div className="mb-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
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
                          <MdClose className="text-xl" />
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
                            
                            {/* Breakfast Menu Items */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              {selectedMenu.mealTypes.breakfast.map((item, index) => (
                                <div 
                                  key={item.id || index} 
                                  className="group bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border border-green-200 hover:border-green-300 relative overflow-hidden"
                                  onClick={() => addToOrder('breakfast', item)}
                                >
                                  {/* Add to cart indicator */}
                                  <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                    +
                                  </div>
                                  
                                  <div className="mb-3">
                                    <h5 className="font-semibold text-gray-800 mb-2 group-hover:text-green-700 transition-colors">{item.name}</h5>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`inline-block w-3 h-3 rounded-full ${item.foodType === 'NON_VEG' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                      <span className="text-xs font-medium text-gray-600 capitalize">{item.foodType}</span>
                                    </div>
                                  </div>
                                  
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
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <label className="block text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <MdLocationOn className="text-green-500" />
                                🍳 Breakfast Delivery Address
                              </label>
                              <AddressPicker
                                value={deliveryLocationNames.breakfast || deliveryLocations.breakfast}
                                onChange={(e) => {
                                  const addressId = e.target.value;
                                  const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                  setDeliveryLocations(prev => ({ ...prev, breakfast: addressId }));
                                  setDeliveryLocationNames(prev => ({ ...prev, breakfast: displayName }));
                                }}
                                placeholder="Select breakfast delivery address..."
                                className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                                mealType="breakfast"
                              />
                              {!deliveryLocations.breakfast && (
                                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  Please select a delivery address for breakfast
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
                            
                            {/* Lunch Menu Items */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              {selectedMenu.mealTypes.lunch.map((item, index) => (
                                <div 
                                  key={item.id || index} 
                                  className="group bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border border-yellow-200 hover:border-yellow-300 relative overflow-hidden"
                                  onClick={() => addToOrder('lunch', item)}
                                >
                                  {/* Add to cart indicator */}
                                  <div className="absolute top-3 right-3 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                    +
                                  </div>
                                  
                                  <div className="mb-3">
                                    <h5 className="font-semibold text-gray-800 mb-2 group-hover:text-yellow-700 transition-colors">{item.name}</h5>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`inline-block w-3 h-3 rounded-full ${item.foodType === 'NON_VEG' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                      <span className="text-xs font-medium text-gray-600 capitalize">{item.foodType}</span>
                                    </div>
                                  </div>
                                  
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
                            <div className="bg-white rounded-lg p-4 border border-yellow-200">
                              <label className="block text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                <MdLocationOn className="text-yellow-500" />
                                🍽️ Lunch Delivery Address
                              </label>
                              <AddressPicker
                                value={deliveryLocationNames.lunch || deliveryLocations.lunch}
                                onChange={(e) => {
                                  const addressId = e.target.value;
                                  const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                  setDeliveryLocations(prev => ({ ...prev, lunch: addressId }));
                                  setDeliveryLocationNames(prev => ({ ...prev, lunch: displayName }));
                                }}
                                placeholder="Select lunch delivery address..."
                                className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm"
                                mealType="lunch"
                              />
                              {!deliveryLocations.lunch && (
                                <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                  Please select a delivery address for lunch
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
                            
                            {/* Dinner Menu Items */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              {selectedMenu.mealTypes.dinner.map((item, index) => (
                                <div 
                                  key={item.id || index} 
                                  className="group bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border border-pink-200 hover:border-pink-300 relative overflow-hidden"
                                  onClick={() => addToOrder('dinner', item)}
                                >
                                  {/* Add to cart indicator */}
                                  <div className="absolute top-3 right-3 bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                    +
                                  </div>
                                  
                                  <div className="mb-3">
                                    <h5 className="font-semibold text-gray-800 mb-2 group-hover:text-pink-700 transition-colors">{item.name}</h5>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className={`inline-block w-3 h-3 rounded-full ${item.foodType === 'NON_VEG' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                      <span className="text-xs font-medium text-gray-600 capitalize">{item.foodType}</span>
                                    </div>
                                  </div>
                                  
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
                            <div className="bg-white rounded-lg p-4 border border-pink-200">
                              <label className="block text-sm font-semibold text-pink-800 mb-3 flex items-center gap-2">
                                <MdLocationOn className="text-pink-500" />
                                🌙 Dinner Delivery Address
                              </label>
                              <AddressPicker
                                value={deliveryLocationNames.dinner || deliveryLocations.dinner}
                                onChange={(e) => {
                                  const addressId = e.target.value;
                                  const displayName = e.target.displayName || getAddressDisplayName(addressId);
                                  setDeliveryLocations(prev => ({ ...prev, dinner: addressId }));
                                  setDeliveryLocationNames(prev => ({ ...prev, dinner: displayName }));
                                }}
                                placeholder="Select dinner delivery address..."
                                className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-sm"
                                mealType="dinner"
                              />
                              {!deliveryLocations.dinner && (
                                <div className="mt-2 text-xs text-pink-600 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                  Please select a delivery address for dinner
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
            <div className="lg:sticky lg:top-6 space-y-4 sm:space-y-6">
              {/* Ordered Items Section */}
              <div className="bg-white rounded-lg shadow-md">
                <div 
                  className="flex items-center justify-between p-3 sm:p-4 lg:p-6 bg-gray-500 rounded-t-lg cursor-pointer"
                  onClick={() => toggleSection('orderedItems')}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <MdShoppingCart className="text-white text-lg sm:text-xl" />
                    <span className="text-white font-semibold text-base sm:text-lg">Ordered Items</span>
                  </div>
                  {expandedSections.orderedItems ? (
                    <MdExpandLess className="text-white text-lg sm:text-xl" />
                  ) : (
                    <MdExpandMore className="text-white text-lg sm:text-xl" />
                  )}
                </div>

                {expandedSections.orderedItems && (
                  <div className="p-3 sm:p-4 lg:p-6">
                    {Object.entries(orderedItems).map(([mealType, items]) => (
                      items.length > 0 && (
                        <div key={mealType} className="mb-3 sm:mb-4">
                          <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 capitalize text-sm sm:text-lg">{mealType}</h4>
                          <div className="space-y-2 sm:space-y-3">
                            {items.map((item) => (
                              <div key={item.orderItemId} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg meal-item">
                                <img 
                                  src={item.productImage ? `http://localhost:5000${item.productImage}` : '/placeholder-food.jpg'} 
                                  alt={item.name}
                                  className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.src = '/placeholder-food.jpg';
                                  }}
                                  loading="lazy"
                                  key={`${item.id}-${item.productImage}`}
                                  style={{ imageRendering: 'auto' }}
                                  onLoad={(e) => {
                                    e.target.style.opacity = '1';
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-1">
                                    <span className={`inline-block w-2 h-2 rounded-full ${item.foodType === 'NON_VEG' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    <h5 className="font-medium text-xs sm:text-sm lg:text-base text-gray-800">{item.name}</h5>
                                  </div>
                                  {item.price > 0 && (
                                    <p className="text-xs text-gray-600">₹{item.price}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <button 
                                    onClick={() => removeFromOrder(mealType, item.orderItemId)}
                                    className="text-orange-500 hover:text-orange-700"
                                  >
                                    <MdClose className="text-lg sm:text-xl" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                    
                    {getTotalItems() === 0 && (
                      <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No items ordered yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Full Delivery Location */}
              <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-md">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="font-medium text-gray-700 text-sm sm:text-lg">Primary Delivery Address</h4>
                  <MdLocationOn className="text-gray-500 text-sm sm:text-base" />
                </div>
                <AddressPicker
                  value={deliveryLocationNames.full || deliveryLocations.full}
                  onChange={(e) => {
                    // The AddressPicker now sends the address ID
                    const addressId = e.target.value;
                    const displayName = e.target.displayName || getAddressDisplayName(addressId);
                    setDeliveryLocations(prev => ({
                      ...prev,
                      full: addressId
                    }));
                    // We'll update the display name when we get the address data
                    // For now, we'll use the ID as placeholder
                    setDeliveryLocationNames(prev => ({
                      ...prev,
                      full: displayName
                    }));
                  }}
                  placeholder="Select full delivery address..."
                  className="text-xs sm:text-sm lg:text-base"
                  mealType="full"
                  showMap={true}
                />
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 shadow-md">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-gray-700 text-sm sm:text-lg">Selected Items {getTotalItems()}</span>
                  {getTotalPrice() > 0 && (
                    <span className="text-orange-600 font-semibold text-sm sm:text-lg">Total: ₹{getTotalPrice()}</span>
                  )}
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-500 text-white py-2.5 sm:py-3 lg:py-4 rounded-lg font-semibold hover:bg-gray-600 transition-colors text-xs sm:text-sm lg:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOrder}
                    disabled={getTotalItems() === 0 || isCreating}
                    className="flex-1 bg-green-500 text-white py-2.5 sm:py-3 lg:py-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm lg:text-base flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating Order...
                      </>
                    ) : (
                      'Save Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 