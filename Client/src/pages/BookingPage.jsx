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
import { useMealsByDay } from '../hooks/adminHook/adminHook';
import LocationPicker from '../components/LocationPicker';
import AddressPicker from '../components/AddressPicker';
import { useOrder } from '../hooks/userHooks/useOrder';
import { toast } from 'react-toastify';

const BookingPage = () => {
  const navigate = useNavigate();
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    breakfast: true,
    lunch: false,
    dinner: true,
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

  // Get day of week from selected date
  const getDayOfWeek = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const selectedDayOfWeek = getDayOfWeek(selectedDate);
  
  // Fetch meals for the selected day of week
  const { data: mealsData, isLoading: productsLoading, error: productsError } = useMealsByDay(selectedDayOfWeek);

  
  
  // Extract meals from the response
  const adminProducts = mealsData?.data?.meals || {
    breakfast: [],
    lunch: [],
    dinner: []
  };

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
        [mealType]: [...prev[mealType], { ...item, orderItemId: Date.now() + Math.random() }]
      };
      return newItems;
    });
    
    // Show toast notification
    toast.success(`${item.productName || item.name} added to ${mealType} order!`, {
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
    // Calculate total price from ordered items
    let total = 0;
    Object.values(orderedItems).forEach(mealItems => {
      mealItems.forEach(item => {
        total += item.price || 0;
      });
    });
    return total;
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

  const MealSection = ({ mealType, title, icon, color }) => {
    const hasOrders = orderedItems[mealType].length > 0;
    const mealProducts = adminProducts?.[mealType] || [];
    
    return (
      <div className="mb-4 sm:mb-6">
        {/* Meal Header */}
        <div 
          className={`flex items-center justify-between p-3 sm:p-4 lg:p-6 rounded-lg cursor-pointer transition-all duration-300 ${color}`}
          onClick={() => toggleSection(mealType)}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg lg:text-xl">
              {icon}
            </div>
            <span className="text-white font-semibold text-base sm:text-lg lg:text-xl">{title}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {hasOrders && (
              <span className="bg-green-500 text-white text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                Ordered
              </span>
            )}
            {expandedSections[mealType] ? (
              <MdExpandLess className="text-white text-lg sm:text-xl lg:text-2xl" />
            ) : (
              <MdExpandMore className="text-white text-lg sm:text-xl lg:text-2xl" />
            )}
          </div>
        </div>

        {/* Meal Content */}
        {expandedSections[mealType] && (
          <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 mt-2 shadow-md">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg lg:text-2xl font-semibold text-gray-800">{title}</h3>
                {productsLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                )}
              </div>
              {hasOrders && (
                <span className="bg-green-100 text-green-800 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  Ordered
                </span>
              )}
            </div>

            {/* Loading State - Only show if no previous data */}
            {productsLoading && (!adminProducts[mealType] || adminProducts[mealType].length === 0) && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading {title.toLowerCase()} items...</p>
              </div>
            )}

            {/* Error State */}
            {productsError && (
              <div className="text-center py-8">
                <p className="text-red-500">Error loading {title.toLowerCase()} items</p>
                <p className="text-gray-500 text-sm mt-1">Please try again later</p>
              </div>
            )}

            {/* Food Items Grid - Separated by Veg/Non-Veg */}
            {!productsLoading && !productsError && (
              <>
                {mealProducts.length > 0 ? (
                  <div className="space-y-4 mb-3 sm:mb-4 lg:mb-6">
                    {/* Vegetarian Items */}
                    {mealProducts.filter(item => item.foodType === 'VEG').length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                          <h5 className="font-semibold text-green-700 text-sm sm:text-base">Vegetarian</h5>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                          {mealProducts.filter(item => item.foodType === 'VEG').slice(0, 8).map((item, index) => (
                            <div 
                              key={item.id || index} 
                              className="bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 text-center hover:shadow-md transition-shadow group cursor-pointer meal-item border border-green-200 relative"
                              onClick={() => addToOrder(mealType, item)}
                            >
                              {/* Add to cart indicator */}
                              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                +
                              </div>
                              <img 
                                src={item.productImage ? `http://localhost:5000${item.productImage}` : '/placeholder-food.jpg'} 
                                alt={item.name}
                                className="w-full h-16 sm:h-20 lg:h-32 object-cover rounded-lg mb-1.5 sm:mb-2 lg:mb-3 group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.target.src = '/placeholder-food.jpg'; // Fallback image
                                }}
                                loading="lazy"
                                key={`${item.id}-${item.productImage}`}
                                style={{ imageRendering: 'auto' }}
                                onLoad={(e) => {
                                  e.target.style.opacity = '1';
                                }}
                              />
                              <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                <h4 className="font-medium text-xs sm:text-xs lg:text-sm text-gray-800 leading-tight min-h-[2rem] sm:min-h-[2.5rem] lg:min-h-[3rem] flex items-center justify-center text-center">
                                  {item.productName || item.name.split(',')[0]}
                                </h4>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-Vegetarian Items */}
                    {mealProducts.filter(item => item.foodType === 'NON_VEG').length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                          <h5 className="font-semibold text-red-700 text-sm sm:text-base">Non-Vegetarian</h5>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                          {mealProducts.filter(item => item.foodType === 'NON_VEG').slice(0, 8).map((item, index) => (
                            <div 
                              key={item.id || index} 
                              className="bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 text-center hover:shadow-md transition-shadow group cursor-pointer meal-item border border-red-200 relative"
                              onClick={() => addToOrder(mealType, item)}
                            >
                              {/* Add to cart indicator */}
                              <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                +
                              </div>
                              <img 
                                src={item.productImage ? `http://localhost:5000${item.productImage}` : '/placeholder-food.jpg'} 
                                alt={item.name}
                                className="w-full h-16 sm:h-20 lg:h-32 object-cover rounded-lg mb-1.5 sm:mb-2 lg:mb-3 group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.target.src = '/placeholder-food.jpg'; // Fallback image
                                }}
                                loading="lazy"
                                key={`${item.id}-${item.productImage}`}
                                style={{ imageRendering: 'auto' }}
                                onLoad={(e) => {
                                  e.target.style.opacity = '1';
                                }}
                              />
                              <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                                <h4 className="font-medium text-xs sm:text-xs lg:text-sm text-gray-800 leading-tight min-h-[2rem] sm:min-h-[2.5rem] lg:min-h-[3rem] flex items-center justify-center text-center">
                                  {item.productName || item.name.split(',')[0]}
                                </h4>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Items without food type (fallback) */}
                    {mealProducts.filter(item => !item.foodType || (item.foodType !== 'VEG' && item.foodType !== 'NON_VEG')).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-block w-3 h-3 rounded-full bg-gray-500"></span>
                          <h5 className="font-semibold text-gray-700 text-sm sm:text-base">Other Items</h5>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                          {mealProducts.filter(item => !item.foodType || (item.foodType !== 'VEG' && item.foodType !== 'NON_VEG')).slice(0, 8).map((item, index) => (
                            <div 
                              key={item.id || index} 
                              className="bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 text-center hover:shadow-md transition-shadow group cursor-pointer meal-item border border-gray-200"
                              onClick={() => addToOrder(mealType, item)}
                            >
                              <img 
                                src={item.productImage ? `http://localhost:5000${item.productImage}` : '/placeholder-food.jpg'} 
                                alt={item.name}
                                className="w-full h-16 sm:h-20 lg:h-32 object-cover rounded-lg mb-1.5 sm:mb-2 lg:mb-3 group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.target.src = '/placeholder-food.jpg'; // Fallback image
                                }}
                                loading="lazy"
                                key={`${item.id}-${item.productImage}`}
                                style={{ imageRendering: 'auto' }}
                                onLoad={(e) => {
                                  e.target.style.opacity = '1';
                                }}
                              />
                              <div className="flex items-center justify-center gap-1 mb-0.5 sm:mb-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-gray-500"></span>
                                <h4 className="font-medium text-xs sm:text-xs lg:text-sm text-gray-800 leading-tight min-h-[2rem] sm:min-h-[2.5rem] lg:min-h-[3rem] flex items-center justify-center text-center">
                                  {item.productName || item.name.split(',')[0]}
                                </h4>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No {title.toLowerCase()} items available for {selectedDayOfWeek.charAt(0).toUpperCase() + selectedDayOfWeek.slice(1)}</p>
                    <p className="text-gray-400 text-sm mt-1">Check back later for updates or try a different date</p>
                  </div>
                )}
              </>
            )}

            {/* Delivery Location */}
            <div className="border-t pt-3 sm:pt-4 lg:pt-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700 text-xs sm:text-sm lg:text-base">{title} Delivery Address</h4>
                <MdEdit className="text-gray-500 text-sm sm:text-base" />
              </div>
              <div className="mt-1.5 sm:mt-2">
                <AddressPicker
                  value={deliveryLocationNames[mealType] || deliveryLocations[mealType]}
                  onChange={(e) => {
                    // The AddressPicker now sends the address ID
                    const addressId = e.target.value;
                    setDeliveryLocations(prev => ({
                      ...prev,
                      [mealType]: addressId
                    }));
                    // We'll update the display name when we get the address data
                    // For now, we'll use the ID as placeholder
                    setDeliveryLocationNames(prev => ({
                      ...prev,
                      [mealType]: addressId ? `Address ID: ${addressId}` : ''
                    }));
                  }}
                  placeholder={`Select ${title.toLowerCase()} delivery address...`}
                  className="text-xs sm:text-sm lg:text-base"
                  mealType={mealType}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
            {mealsData && (
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Showing menu for <span className="font-semibold text-blue-600">{selectedDayOfWeek.charAt(0).toUpperCase() + selectedDayOfWeek.slice(1)}</span>
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
          {/* Left Column - Meal Sections */}
          <div className="lg:col-span-2">
            <div className="max-w-2xl lg:max-w-none mx-auto lg:mx-0">
              {/* Meal Sections */}
              <MealSection 
                mealType="breakfast"
                title="Breakfast"
                icon="B"
                color="bg-green-500"
              />

              <MealSection 
                mealType="lunch"
                title="Lunch"
                icon="L"
                color="bg-yellow-500"
              />

              <MealSection 
                mealType="dinner"
                title="Dinner"
                icon="D"
                color="bg-pink-500"
              />
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
                                    <h5 className="font-medium text-xs sm:text-sm lg:text-base text-gray-800">{item.productName || item.name.split(',')[0]}</h5>
                                  </div>
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
                    setDeliveryLocations(prev => ({
                      ...prev,
                      full: addressId
                    }));
                    // We'll update the display name when we get the address data
                    // For now, we'll use the ID as placeholder
                    setDeliveryLocationNames(prev => ({
                      ...prev,
                      full: addressId ? `Address ID: ${addressId}` : ''
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