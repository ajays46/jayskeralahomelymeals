import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast 
} from '../utils/toastConfig.jsx';
import { 
  MdArrowBack,
  MdPerson,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdShoppingCart,
  MdAttachMoney,
  MdCalendarToday,
  MdReceipt,
  MdLocalShipping,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdRefresh,
  MdFilterList,
  MdSearch,
  MdClear,
  MdVisibility
} from 'react-icons/md';
import useAuthStore from '../stores/Zustand.store';
import { useSeller } from '../hooks/sellerHooks/useSeller';
import { SkeletonTable, SkeletonCard, SkeletonOrderList } from '../components/Skeleton';

const CustomerOrdersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles } = useAuthStore();
  const { getUserOrders, cancelOrder, cancelDeliveryItem } = useSeller();
  
  // Get customer data from navigation state
  const customer = location.state?.customer;
  
  // State management
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    datePreset: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    sortBy: 'recent',
    showFilters: false
  });

  // Delivery items filter states for each order
  const [deliveryItemFilters, setDeliveryItemFilters] = useState({});
  
  // Confirmation modal states
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [itemToCancel, setItemToCancel] = useState(null);

  // Fetch customer orders on component mount
  useEffect(() => {
    if (customer?.id && user && roles?.includes('SELLER')) {
      fetchCustomerOrders();
    }
  }, [customer, user, roles]);

  // Apply filters whenever orders or filters change
  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchCustomerOrders = async () => {
    if (!customer?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserOrders(customer.id);
      setOrders(result || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setError(error.message || 'Failed to fetch orders');
      showErrorToast('Failed to fetch customer orders');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to orders
  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Date preset filter
    if (filters.datePreset !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.datePreset) {
        case 'today':
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= today && orderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          });
          break;
        case 'tomorrow':
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= tomorrow && orderDate < dayAfterTomorrow;
          });
          break;
        case 'thisWeek':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= startOfWeek && orderDate < endOfWeek;
          });
          break;
        case 'nextWeek':
          const nextWeekStart = new Date(today);
          nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
          const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= nextWeekStart && orderDate < nextWeekEnd;
          });
          break;
        case 'thisMonth':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= startOfMonth && orderDate <= endOfMonth;
          });
          break;
      }
    }

    // Custom date range filter (overrides preset if both are set)
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(order => new Date(order.orderDate) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(order => new Date(order.orderDate) <= toDate);
    }

    // Search filter (order ID, customer name, etc.)
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm) ||
        (customer?.firstName && customer.firstName.toLowerCase().includes(searchTerm)) ||
        (customer?.lastName && customer.lastName.toLowerCase().includes(searchTerm))
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'recent':
          return new Date(b.orderDate) - new Date(a.orderDate);
        case 'oldest':
          return new Date(a.orderDate) - new Date(b.orderDate);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'priceHigh':
          return (b.totalPrice || 0) - (a.totalPrice || 0);
        case 'priceLow':
          return (a.totalPrice || 0) - (b.totalPrice || 0);
        default:
          return new Date(b.orderDate) - new Date(a.orderDate);
      }
    });

    setFilteredOrders(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      datePreset: 'all',
      dateFrom: '',
      dateTo: '',
      search: '',
      sortBy: 'recent',
      showFilters: false
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle delivery item filter changes
  const handleDeliveryItemFilterChange = (orderId, key, value) => {
    setDeliveryItemFilters(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [key]: value
      }
    }));
  };

  // Get filtered delivery items for a specific order
  const getFilteredDeliveryItems = (orderId, deliveryItems) => {
    if (!deliveryItems || !deliveryItemFilters[orderId]) {
      return deliveryItems;
    }

    const filters = deliveryItemFilters[orderId];
    let filtered = [...deliveryItems];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Time slot filter
    if (filters.timeSlot && filters.timeSlot !== 'all') {
      filtered = filtered.filter(item => item.deliveryTimeSlot === filters.timeSlot);
    }

    // Date preset filter
    if (filters.datePreset && filters.datePreset !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.datePreset) {
        case 'today':
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= today && itemDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          });
          break;
        case 'tomorrow':
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= tomorrow && itemDate < dayAfterTomorrow;
          });
          break;
        case 'thisWeek':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= startOfWeek && itemDate < endOfWeek;
          });
          break;
        case 'nextWeek':
          const nextWeekStart = new Date(today);
          nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
          const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= nextWeekStart && itemDate < nextWeekEnd;
          });
          break;
        case 'thisMonth':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= startOfMonth && itemDate <= endOfMonth;
          });
          break;
      }
    }

    // Sort items
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'dateRecent':
            return new Date(b.deliveryDate) - new Date(a.deliveryDate);
          case 'dateOldest':
            return new Date(a.deliveryDate) - new Date(b.deliveryDate);
          case 'name':
            return (a.menuItem?.name || '').localeCompare(b.menuItem?.name || '');
          case 'timeSlot':
            return (a.deliveryTimeSlot || '').localeCompare(b.deliveryTimeSlot || '');
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  // Clear delivery item filters for a specific order
  const clearDeliveryItemFilters = (orderId) => {
    setDeliveryItemFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[orderId];
      return newFilters;
    });
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/jkhm/seller/customers');
  };

  // Handle cancel order
  const handleCancelOrder = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelOrderModal(true);
  };

  // Confirm cancel order
  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setLoading(true);
    try {
      // Make API call to cancel order
      await cancelOrder(orderToCancel);
      
      // Refresh orders to get updated statuses
      await fetchCustomerOrders();
      
      showSuccessToast('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      showErrorToast(error.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
      setShowCancelOrderModal(false);
      setOrderToCancel(null);
    }
  };

  // Handle cancel delivery item
  const handleCancelDeliveryItem = (itemId) => {
    setItemToCancel(itemId);
    setShowCancelItemModal(true);
  };

  // Confirm cancel delivery item
  const confirmCancelDeliveryItem = async () => {
    if (!itemToCancel) return;
    
    setLoading(true);
    try {
      // Make API call to cancel delivery item
      await cancelDeliveryItem(itemToCancel);
      
      // Refresh orders to get updated statuses (order might be auto-cancelled)
      await fetchCustomerOrders();
      
      showSuccessToast('Delivery item cancelled successfully');
    } catch (error) {
      console.error('Error cancelling delivery item:', error);
      showErrorToast(error.message || 'Failed to cancel delivery item');
    } finally {
      setLoading(false);
      setShowCancelItemModal(false);
      setItemToCancel(null);
    }
  };

  // Handle view payment receipts - open in new tab
  const handleViewReceipts = (order) => {
    // Find the first available receipt
    let receiptUrl = null;
    
    if (order.payments && order.payments.length > 0) {
      for (const payment of order.payments) {
        // Check detailed receipt records first (preferred)
        if (payment.paymentReceipts && payment.paymentReceipts.length > 0) {
          receiptUrl = payment.paymentReceipts[0].receiptImageUrl || payment.paymentReceipts[0].receipt;
          break;
        }
        // Check direct receipt URL if no detailed records exist
        else if (payment.receiptUrl) {
          receiptUrl = payment.receiptUrl;
          break;
        }
      }
    }
    
    // Open receipt in new tab
    if (receiptUrl) {
      window.open(`http://localhost:5000${receiptUrl}`, '_blank', 'noopener,noreferrer');
    }
  };



  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  // Get order status color and icon
  const getOrderStatusInfo = (status) => {
    switch (status) {
      case 'Payment_Confirmed':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: MdCheckCircle, label: 'Payment Confirmed' };
      case 'In_Progress':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: MdPending, label: 'In Progress' };
      case 'Completed':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: MdCheckCircle, label: 'Completed' };
      case 'Cancelled':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: MdCancel, label: 'Cancelled' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: MdPending, label: status || 'Unknown' };
    }
  };

  // Check if user has access
  if (!user || !roles?.includes('SELLER')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <MdPerson className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view customer orders.</p>
          <button
            onClick={() => navigate('/jkhm')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if customer data is available
  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MdPerson className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">No customer data available.</p>
          <button
            onClick={handleBack}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Customers"
              >
                <MdArrowBack className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Orders</h1>
                <p className="text-sm text-gray-600">View all orders for this customer</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchCustomerOrders}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                <MdRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Customer Info Card */}
        {customer && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {customer.contacts?.[0]?.firstName?.charAt(0) || 'C'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {customer.contacts?.[0]?.firstName} {customer.contacts?.[0]?.lastName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <MdPhone className="w-4 h-4" />
                    <span>{customer.contacts?.[0]?.phoneNumbers?.[0]?.number || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdEmail className="w-4 h-4" />
                    <span>{customer.auth?.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdShoppingCart className="w-4 h-4" />
                    <span>{orders.length} orders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdShoppingCart className="w-5 h-5 text-green-600" />
                Orders History
              </h2>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => handleFilterChange('showFilters', !filters.showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
              >
                <MdFilterList className="w-4 h-4" />
                {filters.showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {filters.showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Order ID, customer name..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Payment_Confirmed">Payment Confirmed</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Preset Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Preset</label>
                  <select
                    value={filters.datePreset}
                    onChange={(e) => handleFilterChange('datePreset', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="thisWeek">This Week</option>
                    <option value="nextWeek">Next Week</option>
                    <option value="thisMonth">This Month</option>
                  </select>
                </div>

                {/* Sort By Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="recent">Most Recent First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="status">By Status</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="priceLow">Price: Low to High</option>
                  </select>
                </div>

                {/* Custom Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Range</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      placeholder="From Date"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      placeholder="To Date"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredOrders.length}</span> of{' '}
                  <span className="font-semibold">{orders.length}</span> orders
                </div>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                >
                  <MdClear className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="p-8">
              <SkeletonOrderList count={5} />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <MdCancel className="text-4xl text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchCustomerOrders}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              {orders.length === 0 ? (
                <>
                  <MdShoppingCart className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found</p>
                  <p className="text-sm text-gray-400 mt-2">This customer hasn't placed any orders yet</p>
                </>
              ) : (
                <>
                  <MdFilterList className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders match your filters</p>
                  <p className="text-sm text-gray-400 mt-2">Try adjusting your filter criteria</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="col-span-2">Order Details</div>
                  <div className="col-span-2">Date & Amount</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Delivery Items</div>
                  <div className="col-span-2">Payment</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusInfo = getOrderStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Order Details Column */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              #{order.id.slice(-4)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm truncate">Order #{order.id.slice(-8)}</h3>
                              <p className="text-xs text-gray-500 mt-1">ID: {order.id.slice(-12)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Date & Amount Column */}
                        <div className="col-span-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MdCalendarToday className="w-4 h-4" />
                              <span className="font-medium">{formatDate(order.orderDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <MdAttachMoney className="w-4 h-4 text-green-500" />
                              <span className="font-bold text-green-600">{formatPrice(order.totalPrice)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Column */}
                        <div className="col-span-2">
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} border w-fit`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.label}
                          </div>
                        </div>

                        {/* Delivery Items Column */}
                        <div className="col-span-2">
                          {order.deliveryItems && order.deliveryItems.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MdLocalShipping className="w-4 h-4" />
                                <span className="font-medium">{order.deliveryItems.length} items</span>
                              </div>
                              <button
                                onClick={() => {
                                  const newExpandedOrders = { ...expandedOrders };
                                  newExpandedOrders[order.id] = !newExpandedOrders[order.id];
                                  setExpandedOrders(newExpandedOrders);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {expandedOrders[order.id] ? 'Hide Details' : 'View Details'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">No items</div>
                          )}
                        </div>

                        {/* Payment Column */}
                        <div className="col-span-2">
                          {order.payments && order.payments.length > 0 && 
                           order.payments.some(payment => 
                             payment.receiptUrl || 
                             (payment.paymentReceipts && payment.paymentReceipts.length > 0)
                           ) ? (
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <MdReceipt className="w-4 h-4" />
                              <span className="font-medium">Receipt Available</span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">No receipt</div>
                          )}
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            {/* View Receipts Button */}
                            {order.payments && order.payments.length > 0 && 
                             order.payments.some(payment => 
                               payment.receiptUrl || 
                               (payment.paymentReceipts && payment.paymentReceipts.length > 0)
                             ) && (
                              <button
                                onClick={() => handleViewReceipts(order)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                                title="View Receipts"
                              >
                                <MdVisibility className="w-3 h-3" />
                                Receipt
                              </button>
                            )}
                            
                            {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                title="Cancel Order"
                              >
                                <MdCancel className="w-3 h-3" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    
                      {/* Expanded Delivery Items Section */}
                      {expandedOrders[order.id] && order.deliveryItems && order.deliveryItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                              <MdLocalShipping className="w-4 h-4" />
                              Delivery Items ({order.deliveryItems.length})
                            </h4>
                            
                            {/* Delivery Items Filter Toggle */}
                            <button
                              onClick={() => {
                                const currentFilters = deliveryItemFilters[order.id];
                                if (currentFilters?.showFilters) {
                                  clearDeliveryItemFilters(order.id);
                                } else {
                                  handleDeliveryItemFilterChange(order.id, 'showFilters', true);
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                            >
                              <MdFilterList className="w-4 h-4" />
                              {deliveryItemFilters[order.id]?.showFilters ? 'Hide Filters' : 'Show Filters'}
                            </button>
                          </div>
                        
                          {/* Delivery Items Filters */}
                          {deliveryItemFilters[order.id]?.showFilters && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Time Slot Filter */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Time Slot</label>
                                  <select
                                    value={deliveryItemFilters[order.id]?.timeSlot || 'all'}
                                    onChange={(e) => handleDeliveryItemFilterChange(order.id, 'timeSlot', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="all">All Time Slots</option>
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Dinner">Dinner</option>
                                  </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                  <select
                                    value={deliveryItemFilters[order.id]?.status || 'all'}
                                    onChange={(e) => handleDeliveryItemFilterChange(order.id, 'status', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="all">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In_Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </div>

                                {/* Date Preset Filter */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Preset</label>
                                  <select
                                    value={deliveryItemFilters[order.id]?.datePreset || 'all'}
                                    onChange={(e) => handleDeliveryItemFilterChange(order.id, 'datePreset', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="tomorrow">Tomorrow</option>
                                    <option value="thisWeek">This Week</option>
                                    <option value="nextWeek">Next Week</option>
                                    <option value="thisMonth">This Month</option>
                                  </select>
                                </div>



                                {/* Clear Filters Button */}
                                <div className="flex items-end">
                                  <button
                                    onClick={() => clearDeliveryItemFilters(order.id)}
                                    className="w-full px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center justify-center gap-1"
                                  >
                                    <MdClear className="w-3 h-3" />
                                    Clear
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Filtered Delivery Items */}
                          <div className="space-y-3">
                            {(() => {
                              const filteredItems = getFilteredDeliveryItems(order.id, order.deliveryItems);
                              return filteredItems.length > 0 ? (
                                <div className="max-h-80 overflow-y-auto space-y-3">
                                  {filteredItems.map((item) => (
                                    <div key={item.id} className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                            {item.quantity}
                                          </div>
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                              {item.menuItem?.name || 'Unknown Item'}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                              <div className="flex items-center gap-1">
                                                <MdCalendarToday className="w-3 h-3" />
                                                <span>{item.deliveryDate ? formatDate(item.deliveryDate) : 'No date'}</span>
                                              </div>
                                              {item.deliveryTimeSlot && (
                                                <div className="flex items-center gap-1">
                                                  <MdLocalShipping className="w-3 h-3" />
                                                  <span className="font-medium text-blue-600">{item.deliveryTimeSlot}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Delivery Address - Center */}
                                          <div className="flex-1 text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-1">
                                              <MdLocationOn className="w-3 h-3 text-red-500" />
                                              <span className="font-medium text-gray-700">Delivery Address</span>
                                            </div>
                                            <div className="text-xs text-gray-600 leading-relaxed">
                                              {item.deliveryAddress ? (
                                                <>
                                                  {item.deliveryAddress.housename && (
                                                    <div className="font-medium text-gray-800">{item.deliveryAddress.housename}</div>
                                                  )}
                                                  <div>{item.deliveryAddress.street}</div>
                                                  <div>{item.deliveryAddress.city} - {item.deliveryAddress.pincode}</div>
                                                  {item.deliveryAddress.state && (
                                                    <div>{item.deliveryAddress.state}</div>
                                                  )}
                                                </>
                                              ) : (
                                                <div className="text-gray-400 italic">No address specified</div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                            item.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                            item.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200'
                                          }`}>
                                            {item.status}
                                          </div>
                                          {item.status !== 'Cancelled' && item.status !== 'Completed' && (
                                            <button
                                              onClick={() => handleCancelDeliveryItem(item.id)}
                                              disabled={loading}
                                              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                              title="Cancel this item"
                                            >
                                              <MdCancel className="w-3 h-3" />
                                              Cancel
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-gray-500">
                                  <MdFilterList className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                  <p className="text-sm font-medium">No delivery items match your filters</p>
                                  <button
                                    onClick={() => clearDeliveryItemFilters(order.id)}
                                    className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                  >
                                    Clear Filters
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        title="Cancel Order"
        open={showCancelOrderModal}
        onOk={confirmCancelOrder}
        onCancel={() => {
          setShowCancelOrderModal(false);
          setOrderToCancel(null);
        }}
        okText="Yes, Cancel Order"
        cancelText="Keep Order"
        okType="danger"
      >
        <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
      </Modal>

      {/* Cancel Delivery Item Confirmation Modal */}
      <Modal
        title="Cancel Delivery Item"
        open={showCancelItemModal}
        onOk={confirmCancelDeliveryItem}
        onCancel={() => {
          setShowCancelItemModal(false);
          setItemToCancel(null);
        }}
        okText="Yes, Cancel Item"
        cancelText="Keep Item"
        okType="danger"
      >
        <p>Are you sure you want to cancel this delivery item? This action cannot be undone.</p>
      </Modal>

    </div>
  );
};

export default CustomerOrdersPage;
