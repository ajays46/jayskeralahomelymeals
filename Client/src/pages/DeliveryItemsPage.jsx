import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  showSuccessToast, 
  showErrorToast 
} from '../utils/toastConfig.jsx';
import { 
  MdShoppingCart, 
  MdCalendarToday,
  MdLocationOn,
  MdFilterAlt,
  MdCancel,
  MdCheckCircle,
  MdPending,
  MdDeliveryDining,
  MdWarning,
  MdAccessTime,
  MdArrowBack,
  MdRefresh
} from 'react-icons/md';
import axiosInstance from '../api/axios';
import Navbar from '../components/Navbar';

const DeliveryItemsPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  const orderData = location.state?.orderData;

  // State management
  const [order, setOrder] = useState(orderData || null);
  const [loading, setLoading] = useState(!orderData);
  const [deliveryItemsFilter, setDeliveryItemsFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [cancellingItems, setCancellingItems] = useState(new Set());
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);

  // Fetch order data if not passed via navigation
  useEffect(() => {
    if (!orderData && orderId) {
      fetchOrderData();
    }
  }, [orderId, orderData]);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      // You'll need to implement this endpoint or use existing one
      const response = await axiosInstance.get(`/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      showErrorToast('Failed to fetch order data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (item) => {
    setItemToCancel(item);
    setShowCancelModal(true);
  };

  const cancelDeliveryItem = async (deliveryItemId) => {
    setCancellingItems(prev => new Set(prev).add(deliveryItemId));
    try {
      const response = await axiosInstance.put(`/seller/delivery-items/${deliveryItemId}/cancel`);
      if (response.data.success) {
        showSuccessToast('Delivery item cancelled successfully');
        
        // Update the local state immediately instead of refetching
        setOrder(prevOrder => {
          if (!prevOrder) return prevOrder;
          
          return {
            ...prevOrder,
            deliveryItems: prevOrder.deliveryItems?.map(item => 
              item.id === deliveryItemId 
                ? { ...item, status: 'Cancelled' }
                : item
            ) || []
          };
        });
        
        // Close the modal
        setShowCancelModal(false);
        setItemToCancel(null);
      } else {
        showErrorToast(response.data.message || 'Failed to cancel delivery item');
      }
    } catch (error) {
      console.error('Error cancelling delivery item:', error);
      showErrorToast('Failed to cancel delivery item');
    } finally {
      setCancellingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(deliveryItemId);
        return newSet;
      });
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setItemToCancel(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In_Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <MdPending className="w-4 h-4" />;
      case 'In_Progress':
        return <MdDeliveryDining className="w-4 h-4" />;
      case 'Completed':
        return <MdCheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <MdCancel className="w-4 h-4" />;
      default:
        return <MdWarning className="w-4 h-4" />;
    }
  };

  const canCancelDeliveryItem = (status) => {
    return status === 'Pending' || status === 'In_Progress';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDeliveryDateRange = (deliveryItems) => {
    if (!deliveryItems || deliveryItems.length === 0) return 'No dates';
    
    if (deliveryItems.length === 1) {
      return formatDate(deliveryItems[0].deliveryDate);
    }
    
    // Sort dates to get min and max
    const dates = deliveryItems.map(item => new Date(item.deliveryDate)).sort((a, b) => a - b);
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    // If same month, show "1 to 30 Jan 2024"
    if (firstDate.getMonth() === lastDate.getMonth() && firstDate.getFullYear() === lastDate.getFullYear()) {
      return `${firstDate.getDate()} to ${lastDate.getDate()} ${firstDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
    }
    
    // If different months, show "1 Jan to 30 Feb 2024"
    return `${firstDate.getDate()} ${firstDate.toLocaleDateString('en-IN', { month: 'short' })} to ${lastDate.getDate()} ${lastDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
  };

  // Helper function to determine meal type based on delivery time slot
  const getMealType = (timeSlot) => {
    if (!timeSlot) return 'Unknown';
    
    const time = timeSlot.toLowerCase();
    
    // Breakfast time slots (typically 6 AM to 11 AM)
    if (time.includes('6') || time.includes('7') || time.includes('8') || time.includes('9') || time.includes('10') || time.includes('11')) {
      if (time.includes('am') || time.includes('morning') || time.includes('breakfast')) {
        return 'Breakfast';
      }
    }
    
    // Lunch time slots (typically 11 AM to 3 PM)
    if (time.includes('11') || time.includes('12') || time.includes('1') || time.includes('2') || time.includes('3')) {
      if (time.includes('am') || time.includes('pm') || time.includes('noon') || time.includes('lunch')) {
        return 'Lunch';
      }
    }
    
    // Dinner time slots (typically 6 PM to 10 PM)
    if (time.includes('6') || time.includes('7') || time.includes('8') || time.includes('9') || time.includes('10')) {
      if (time.includes('pm') || time.includes('evening') || time.includes('dinner')) {
        return 'Dinner';
      }
    }
    
    // Fallback based on common patterns
    if (time.includes('breakfast')) return 'Breakfast';
    if (time.includes('lunch')) return 'Lunch';
    if (time.includes('dinner')) return 'Dinner';
    if (time.includes('morning')) return 'Breakfast';
    if (time.includes('afternoon')) return 'Lunch';
    if (time.includes('evening')) return 'Dinner';
    
    // If time is in 24-hour format, convert and determine
    if (time.includes(':')) {
      const hour = parseInt(time.split(':')[0]);
      if (hour >= 6 && hour < 11) return 'Breakfast';
      if (hour >= 11 && hour < 16) return 'Lunch';
      if (hour >= 16 && hour < 22) return 'Dinner';
    }
    
    return 'Meal';
  };

  // Filter delivery items
  const getFilteredDeliveryItems = () => {
    if (!order?.deliveryItems) return [];
    
    let filtered = order.deliveryItems;
    
    // Apply status filter
    if (deliveryItemsFilter !== 'all') {
      filtered = filtered.filter(item => item.status === deliveryItemsFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() + 6);
      
      filtered = filtered.filter(item => {
        const deliveryDate = new Date(item.deliveryDate);
        
        switch (dateFilter) {
          case 'today':
            return deliveryDate.toDateString() === today.toDateString();
          case 'tomorrow':
            return deliveryDate.toDateString() === tomorrow.toDateString();
          case 'thisWeek':
            return deliveryDate >= today && deliveryDate <= thisWeek;
          case 'nextWeek':
            return deliveryDate > thisWeek && deliveryDate <= nextWeek;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };

  // Get active delivery items (non-cancelled)
  const getActiveDeliveryItems = () => {
    if (!order?.deliveryItems) return [];
    return order.deliveryItems.filter(item => item.status !== 'Cancelled');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <MdWarning className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100 mt-16 sm:mt-20 lg:mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <MdArrowBack className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Details & Delivery Items</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Order #{order.id?.slice(-6) || 'N/A'} - {order.orderDate ? formatDate(order.orderDate) : 'No date'}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Order Summary Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MdShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Order ID</p>
                <p className="text-lg font-bold text-gray-900">#{order.id?.slice(-6) || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MdCalendarToday className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Order Date</p>
                <p className="text-lg font-bold text-gray-900">{order.orderDate ? formatDate(order.orderDate) : 'No date'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MdAccessTime className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-lg font-bold text-gray-900">{order.deliveryItems?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Date Range and Menu Info */}
        {order.deliveryItems && order.deliveryItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MdCalendarToday className="w-5 h-5 text-gray-400" />
                  <span className="text-lg font-medium text-gray-700">
                    Delivery Period: {formatDeliveryDateRange(order.deliveryItems)}
                  </span>
                </div>
                {order.deliveryItems[0]?.menuItem?.menu?.name && (
                  <div className="text-lg font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                    📋 {order.deliveryItems[0].menuItem.menu.name}
                  </div>
                )}
              </div>
              
              {/* Delivery Addresses Summary - Compact */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MdLocationOn className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Delivery Addresses by Meal:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(() => {
                    const mealAddresses = {};
                    order.deliveryItems.forEach(item => {
                      if (item.deliveryAddress) {
                        const mealType = getMealType(item.deliveryTimeSlot);
                        const addressKey = `${item.deliveryAddress.street || ''}-${item.deliveryAddress.housename || ''}-${item.deliveryAddress.city || ''}`;
                        
                        if (!mealAddresses[mealType]) {
                          mealAddresses[mealType] = new Set();
                        }
                        mealAddresses[mealType].add(addressKey);
                      }
                    });
                    
                    return Object.entries(mealAddresses).map(([mealType, addresses]) => (
                      <div key={mealType} className="bg-gray-50 rounded-lg border p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            mealType === 'Breakfast' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            mealType === 'Lunch' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {mealType}
                          </span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                            {addresses.size} address{addresses.size > 1 ? 'es' : ''}
                          </span>
                        </div>
                        
                        {/* Show actual addresses for this meal type */}
                        <div className="space-y-1">
                          {(() => {
                            const uniqueAddresses = [];
                            order.deliveryItems.forEach(item => {
                              if (item.deliveryAddress && getMealType(item.deliveryTimeSlot) === mealType) {
                                const address = item.deliveryAddress;
                                const addressText = [
                                  address.street,
                                  address.housename,
                                  address.city,
                                  address.pincode
                                ].filter(Boolean).join(', ');
                                
                                if (!uniqueAddresses.includes(addressText)) {
                                  uniqueAddresses.push(addressText);
                                }
                              }
                            });
                            
                            return uniqueAddresses.map((addressText, index) => (
                              <div key={index} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border-l-2 border-blue-300">
                                📍 {addressText}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section - Always Visible */}
        <div className="bg-blue-50 rounded-xl shadow-lg border-2 border-blue-200 p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <MdFilterAlt className="w-5 h-5" />
              Filter Delivery Items
            </h3>
            <p className="text-sm text-blue-700">Filter items by status and delivery date</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">Status Filter</label>
              <div className="relative">
                <MdFilterAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <select
                  value={deliveryItemsFilter}
                  onChange={(e) => setDeliveryItemsFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In_Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">Date Filter</label>
              <div className="relative">
                <MdCalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="thisWeek">This Week</option>
                  <option value="nextWeek">Next Week</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => {
                setDeliveryItemsFilter('all');
                setDateFilter('all');
              }}
              className="px-4 py-3 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 border border-blue-300 font-medium"
            >
              <MdFilterAlt className="w-4 h-4" />
              Clear All Filters
            </button>
          </div>
          
          {/* Active Filters Display */}
          {(deliveryItemsFilter !== 'all' || dateFilter !== 'all') && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-blue-700 font-medium">Active filters:</span>
              {deliveryItemsFilter !== 'all' && (
                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full border border-blue-300 font-medium">
                  Status: {deliveryItemsFilter}
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full border border-green-300 font-medium">
                  Date: {dateFilter === 'today' ? 'Today' : 
                         dateFilter === 'tomorrow' ? 'Tomorrow' : 
                         dateFilter === 'thisWeek' ? 'This Week' : 
                         dateFilter === 'nextWeek' ? 'Next Week' : dateFilter}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Delivery Items List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delivery Items</h2>
                <p className="text-gray-600 mt-1">
                  Showing {getFilteredDeliveryItems().length} of {order.deliveryItems?.length || 0} items
                  {order.deliveryItems && order.deliveryItems.length > 0 && (
                    <span className="ml-2 text-sm">
                      ({getActiveDeliveryItems().length} active, {order.deliveryItems.filter(item => item.status === 'Cancelled').length} cancelled)
                    </span>
                  )}
                </p>
              </div>
              {order.deliveryItems && getActiveDeliveryItems().length === 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium border border-orange-200">
                    ⚠️ All Items Cancelled
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {getFilteredDeliveryItems().length === 0 ? (
              <div className="text-center py-12">
                <MdFilterAlt className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg">No delivery items found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {deliveryItemsFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : order.deliveryItems && order.deliveryItems.length > 0
                      ? getActiveDeliveryItems().length === 0
                        ? 'All delivery items have been cancelled'
                        : 'No items match your current filters'
                      : 'This order has no delivery items'
                  }
                </p>
                {order.deliveryItems && order.deliveryItems.length > 0 && getActiveDeliveryItems().length === 0 && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => setDeliveryItemsFilter('all')}
                      className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Show All Items (Including Cancelled)
                    </button>
                    <button
                      onClick={() => navigate(-1)}
                      className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Go Back to Orders
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredDeliveryItems().map((item, index) => (
                  <div key={index} className={`rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow ${
                    item.status === 'Cancelled' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="space-y-4">
                      {/* Item Header with Status and Name */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            {item.status}
                          </span>
                          <div className="flex flex-col">
                            <span className={`text-lg font-semibold ${
                              item.status === 'Cancelled' ? 'text-red-700 line-through' : 'text-gray-900'
                            }`}>
                              {item.quantity > 1 ? `${item.quantity}x ` : ''}
                              {item.menuItem?.name || `Item ${index + 1}`}
                            </span>
                            {item.menuItem?.menu?.name && (
                              <span className={`text-sm font-medium ${
                                item.status === 'Cancelled' ? 'text-red-500' : 'text-blue-600'
                              }`}>
                                📋 {item.menuItem.menu.name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Cancel Button */}
                        <div className="flex-shrink-0">
                          {item.status === 'Cancelled' ? (
                            <div className="text-sm text-red-600 px-6 py-3 bg-red-50 rounded-lg border border-red-200 font-medium">
                              ❌ Cancelled
                            </div>
                          ) : canCancelDeliveryItem(item.status) ? (
                            <button
                              onClick={() => handleCancelClick(item)}
                              disabled={cancellingItems.has(item.id)}
                              className={`px-6 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                                cancellingItems.has(item.id)
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                              }`}
                            >
                              {cancellingItems.has(item.id) ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b border-red-600"></div>
                                  Cancelling...
                                </div>
                              ) : (
                                <>
                                  <MdCancel className="w-4 h-4 inline mr-2" />
                                  Cancel Item
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="text-sm text-gray-500 px-6 py-3 bg-gray-100 rounded-lg border">
                              {item.status === 'Completed' ? '✅ Already completed' : '❌ Cannot cancel'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Delivery Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <MdCalendarToday className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span>
                            <span className="ml-2 font-semibold text-gray-900">{formatDate(item.deliveryDate)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MdAccessTime className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">Time:</span>
                            <span className="ml-2 font-semibold text-gray-900">{item.deliveryTimeSlot || 'Not specified'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Item Confirmation Modal */}
      {showCancelModal && itemToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <MdWarning className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Delivery Item</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to cancel{' '}
                <span className="font-semibold">
                  {itemToCancel.quantity > 1 ? `${itemToCancel.quantity}x ` : ''}
                  {itemToCancel.menuItem?.name || 'this item'}
                </span>
                ?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Delivery Date:</span> {formatDate(itemToCancel.deliveryDate)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Time Slot:</span> {itemToCancel.deliveryTimeSlot || 'Not specified'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Status:</span> {itemToCancel.status}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={closeCancelModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Item
              </button>
              <button
                onClick={() => cancelDeliveryItem(itemToCancel.id)}
                disabled={cancellingItems.has(itemToCancel.id)}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  cancellingItems.has(itemToCancel.id)
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {cancellingItems.has(itemToCancel.id) ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cancelling...
                  </div>
                ) : (
                  'Cancel Item'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryItemsPage;
