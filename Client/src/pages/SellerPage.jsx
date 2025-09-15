import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast 
} from '../utils/toastConfig.jsx';
import { 
  MdPeople, 
  MdShoppingCart, 
  MdTrendingUp, 
  MdAttachMoney,
  MdCalendarToday,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdSearch,
  MdFilterList,
  MdAdd,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdRefresh,
  MdDownload,
  MdMoreVert,
  MdDashboard,
  MdRestaurant,
  MdDeliveryDining,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdWarning,
  MdPerson,
  MdPayment,
  MdAccessTime,
  MdFilterAlt
} from 'react-icons/md';
import { useSeller } from '../hooks/sellerHooks/useSeller';
import useAuthStore from '../stores/Zustand.store';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

const SellerPage = () => {
  try {
    const navigate = useNavigate();
    const { user, roles } = useAuthStore();
    const { sellerUsers, loading: sellerUsersLoading, getSellerUsers } = useSeller();
  
    // State management
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [stats, setStats] = useState({
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      activeOrders: 0
    });
    const [cancellingItems, setCancellingItems] = useState(new Set());
    const [deletingUsers, setDeletingUsers] = useState(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    
    
    
    // New state for order cancellation
    const [cancellingOrders, setCancellingOrders] = useState(new Set());
    const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);

    // New state for order filtering
    const [orderFilters, setOrderFilters] = useState({
      status: 'all',
      dateRange: 'all',
      searchTerm: '',
      sortBy: 'recent'
    });

    // Fetch seller users on component mount
    useEffect(() => {
      if (user && roles?.includes('SELLER')) {
        getSellerUsers();
      }
    }, [user, roles]);

    // Calculate stats when users change
    useEffect(() => {
      if (sellerUsers.length > 0) {
        calculateStats();
      }
    }, [sellerUsers]);

    const calculateStats = () => {
      let totalOrders = 0;
      let totalRevenue = 0;
      let activeOrders = 0;

      sellerUsers.forEach(user => {
        if (user.orders) {
          totalOrders += user.orders.length;
          user.orders.forEach(order => {
            if (order.totalPrice) {
              totalRevenue += order.totalPrice;
            }
            if (order.status === 'Payment_Confirmed' || order.status === 'In_Progress') {
              activeOrders++;
            }
          });
        }
      });

      setStats({
        totalUsers: sellerUsers.length,
        totalOrders,
        totalRevenue,
        activeOrders
      });
    };

    const fetchUserOrders = async (userId) => {
      setLoadingOrders(true);
      try {
        const response = await axiosInstance.get(`/seller/users/${userId}/orders`);
        if (response.data.success) {
          setUserOrders(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching user orders:', error);
        showErrorToast('Failed to fetch user orders');
      } finally {
        setLoadingOrders(false);
      }
    };

    const handleUserSelect = (user) => {
      setSelectedUser(user);
      fetchUserOrders(user.id);
    };

    const cancelDeliveryItem = async (deliveryItemId) => {
      setCancellingItems(prev => new Set(prev).add(deliveryItemId));
      try {
        const response = await axiosInstance.put(`/seller/delivery-items/${deliveryItemId}/cancel`);
        if (response.data.success) {
          // Get the delivery item details to show what was cancelled
          const deliveryItem = userOrders.flatMap(order => order.deliveryItems || [])
            .find(item => item.id === deliveryItemId);
          
          if (deliveryItem) {
            const itemName = deliveryItem.menuItem?.name || 'Menu Item';
            showSuccessToast(`Delivery item cancelled successfully: ${itemName}`);
          } else {
            showSuccessToast('Delivery item cancelled successfully');
          }
          
          // Refresh the orders to show updated status
          if (selectedUser) {
            fetchUserOrders(selectedUser.id);
          }
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

    const cancelOrder = async (orderId) => {
      setCancellingOrders(prev => new Set(prev).add(orderId));
      try {
        const response = await axiosInstance.put(`/orders/${orderId}/cancel`);
        if (response.data.success) {
          showSuccessToast('Order cancelled successfully!');
          
          // Refresh the orders to show updated status
          if (selectedUser) {
            fetchUserOrders(selectedUser.id);
          }
        } else {
          showErrorToast(response.data.message || 'Failed to cancel order');
        }
      } catch (error) {
        console.error('Error cancelling order:', error);
        showErrorToast('Failed to cancel order');
      } finally {
        setCancellingOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
        setShowCancelOrderModal(false);
        setOrderToCancel(null);
      }
    };

    const handleDeleteUser = (user) => {
      setUserToDelete(user);
      setShowDeleteModal(true);
    };

    const confirmDeleteUser = async () => {
      if (!userToDelete) return;
      
      setDeletingUsers(prev => new Set(prev).add(userToDelete.id));
      try {
        const response = await axiosInstance.delete(`/seller/users/${userToDelete.id}`);
        if (response.data.success) {
          showSuccessToast('User deleted successfully');
          // Remove user from local state
          getSellerUsers();
          // Clear selected user if it was the deleted one
          if (selectedUser?.id === userToDelete.id) {
            setSelectedUser(null);
            setUserOrders([]);
          }
        } else {
          showErrorToast(response.data.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        showErrorToast('Failed to delete user');
      } finally {
        setDeletingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userToDelete.id);
          return newSet;
        });
        setShowDeleteModal(false);
        setUserToDelete(null);
      }
    };

    const cancelDeleteUser = () => {
      setShowDeleteModal(false);
      setUserToDelete(null);
    };

    

    const getStatusColor = (status) => {
      switch (status) {
        case 'Payment_Confirmed':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'In_Progress':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Cancelled':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'Payment_Confirmed':
          return <MdCheckCircle className="w-4 h-4" />;
        case 'In_Progress':
          return <MdDeliveryDining className="w-4 h-4" />;
        case 'Pending':
          return <MdPending className="w-4 h-4" />;
        case 'Cancelled':
          return <MdCancel className="w-4 h-4" />;
        default:
          return <MdWarning className="w-4 h-4" />;
      }
    };

    

    const canCancelOrder = (status) => {
      return status === 'Pending' || status === 'Payment_Confirmed' || status === 'In_Progress';
    };

    const handleCancelOrder = (order) => {
      setOrderToCancel(order);
      setShowCancelOrderModal(true);
    };

    const closeCancelOrderModal = () => {
      setShowCancelOrderModal(false);
      setOrderToCancel(null);
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

    

    const filteredUsers = sellerUsers.filter(user => {
      const matchesSearch = user.contacts?.[0]?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.contacts?.[0]?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.contacts?.[0]?.phoneNumbers?.[0]?.number?.includes(searchTerm);
      
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'with-orders') return matchesSearch && user.orders && user.orders.length > 0;
      if (filterStatus === 'without-orders') return matchesSearch && (!user.orders || user.orders.length === 0);
      
      return matchesSearch;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'name') {
        const nameA = `${a.contacts?.[0]?.firstName || ''} ${a.contacts?.[0]?.lastName || ''}`.toLowerCase();
        const nameB = `${b.contacts?.[0]?.firstName || ''} ${b.contacts?.[0]?.lastName || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'orders') {
        const ordersA = a.orders?.length || 0;
        const ordersB = b.orders?.length || 0;
        return ordersB - ordersA;
      }
      return 0;
    });

    

      // Filter and sort orders for the selected user
    const getFilteredOrders = () => {
      if (!userOrders || userOrders.length === 0) return [];
      
      let filtered = [...userOrders];
      
      // Apply status filter
      if (orderFilters.status !== 'all') {
        filtered = filtered.filter(order => order.status === orderFilters.status);
      }
      
      // Apply date range filter
      if (orderFilters.dateRange !== 'all') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.orderDate || order.createdAt);
          
          switch (orderFilters.dateRange) {
            case 'today':
              return orderDate.toDateString() === today.toDateString();
            case 'tomorrow':
              return orderDate.toDateString() === tomorrow.toDateString();
            case 'thisWeek':
              return orderDate >= today && orderDate <= nextWeek;
            case 'lastWeek':
              const lastWeek = new Date(today);
              lastWeek.setDate(lastWeek.getDate() - 7);
              return orderDate >= lastWeek && orderDate < today;
            case 'thisMonth':
              return orderDate.getMonth() === today.getMonth() && 
                     orderDate.getFullYear() === today.getFullYear();
            default:
              return true;
          }
        });
      }
      
      // Apply search filter
      if (orderFilters.searchTerm) {
        const searchTerm = orderFilters.searchTerm.toLowerCase();
        filtered = filtered.filter(order => 
          order.id.toLowerCase().includes(searchTerm) ||
          order.status?.toLowerCase().includes(searchTerm) ||
          (order.deliveryItems && order.deliveryItems.some(item => 
            item.menuItem?.name?.toLowerCase().includes(searchTerm)
          ))
        );
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        switch (orderFilters.sortBy) {
          case 'recent':
            return new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt);
          case 'oldest':
            return new Date(a.orderDate || a.createdAt) - new Date(b.orderDate || b.createdAt);
          case 'amount-high':
            return (b.totalPrice || 0) - (a.totalPrice || 0);
          case 'amount-low':
            return (a.totalPrice || 0) - (b.totalPrice || 0);
          case 'status':
            return (a.status || '').localeCompare(b.status || '');
          default:
            return 0;
        }
      });
      
      return filtered;
    };

    if (!user || !roles?.includes('SELLER')) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <MdWarning className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access the seller dashboard.</p>
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

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Professional Business Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 mt-16 sm:mt-20 lg:mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 sm:py-8 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                    <MdDashboard className="text-2xl text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Sales Dashboard</h1>
                    <p className="text-base sm:text-lg text-gray-600 mt-1">Customer Management & Order Analytics</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => getSellerUsers()}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                >
                  <MdRefresh className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh Data</span>
                </button>
                <button
                  onClick={() => navigate('/jkhm/place-order')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                >
                  <MdAdd className="w-4 h-4" />
                  <span className="hidden sm:inline">New Booking</span>
                </button>
                <button
                  onClick={() => navigate('/jkhm/seller/customers')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm"
                >
                  <MdPeople className="w-4 h-4" />
                  <span className="hidden sm:inline">View All Customers</span>
                </button>
                <button
                  onClick={() => navigate('/jkhm/create-user')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm"
                >
                  <MdPerson className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Customer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Business Metrics Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">Active customer base</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MdPeople className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                  <p className="text-sm text-gray-500 mt-1">All time orders</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MdShoppingCart className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{formatPrice(stats.totalRevenue)}</p>
                  <p className="text-sm text-gray-500 mt-1">Gross revenue</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MdAttachMoney className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeOrders}</p>
                  <p className="text-sm text-gray-500 mt-1">In progress</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MdTrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </div>





          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Orders Table Section */}
            <div className="xl:col-span-2">
              {selectedUser && userOrders.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-6">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <MdShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">Order Management</h3>
                          <p className="text-slate-200 text-sm">
                            {selectedUser.contacts?.[0]?.firstName} {selectedUser.contacts?.[0]?.lastName} • {getFilteredOrders().length} of {userOrders.length} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-sm bg-white/20 px-4 py-2 rounded-lg font-medium">
                        Total Value: {formatPrice(userOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Filters Section */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col gap-4">
                      {/* Search Bar */}
                      <div className="flex-1">
                        <div className="relative">
                          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search orders by ID, status, or menu items..."
                            value={orderFilters.searchTerm}
                            onChange={(e) => setOrderFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Status Filter */}
                        <select
                          value={orderFilters.status}
                          onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Payment_Confirmed">Payment Confirmed</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="In_Progress">In Progress</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        
                        {/* Date Range Filter */}
                        <select
                          value={orderFilters.dateRange}
                          onChange={(e) => setOrderFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Dates</option>
                          <option value="today">Today</option>
                          <option value="tomorrow">Tomorrow</option>
                          <option value="thisWeek">This Week</option>
                          <option value="lastWeek">Last Week</option>
                          <option value="thisMonth">This Month</option>
                        </select>
                        
                        {/* Sort By */}
                        <select
                          value={orderFilters.sortBy}
                          onChange={(e) => setOrderFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="recent">Most Recent</option>
                          <option value="oldest">Oldest First</option>
                          <option value="amount-high">Amount High to Low</option>
                          <option value="amount-low">Amount Low to High</option>
                          <option value="status">By Status</option>
                        </select>
                        
                        {/* Clear Filters Button */}
                        <button
                          onClick={() => setOrderFilters({
                            status: 'all',
                            dateRange: 'all',
                            searchTerm: '',
                            sortBy: 'recent'
                          })}
                          className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          <MdFilterAlt className="w-4 h-4" />
                          Clear
                        </button>
                      </div>
                      
                      {/* Active Filters Display */}
                      {(orderFilters.status !== 'all' || orderFilters.dateRange !== 'all' || orderFilters.searchTerm || orderFilters.sortBy !== 'recent') && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-gray-600">Active filters:</span>
                          {orderFilters.status !== 'all' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              Status: {orderFilters.status}
                            </span>
                          )}
                          {orderFilters.dateRange !== 'all' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              Date: {orderFilters.dateRange}
                            </span>
                          )}
                          {orderFilters.searchTerm && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                              Search: "{orderFilters.searchTerm}"
                            </span>
                          )}
                          {orderFilters.sortBy !== 'recent' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                              Sort: {orderFilters.sortBy}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Order Details
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Order Status & Payment
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            View Items
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Payment Receipts
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Address
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredOrders().length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <MdSearch className="text-4xl text-gray-300" />
                                <div>
                                  <p className="text-gray-500 font-medium">No orders found</p>
                                  <p className="text-sm text-gray-400">
                                    {userOrders.length > 0 
                                      ? 'Try adjusting your filters or search terms'
                                      : 'This customer has no orders yet'
                                    }
                                  </p>
                                </div>
                                {userOrders.length > 0 && (
                                  <button
                                    onClick={() => setOrderFilters({
                                      status: 'all',
                                      dateRange: 'all',
                                      searchTerm: '',
                                      sortBy: 'recent'
                                    })}
                                    className="px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    Clear All Filters
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          getFilteredOrders().map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              {/* Order Details Column */}
                              <td className="px-4 py-4 align-top">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <MdShoppingCart className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold text-gray-900 text-sm">
                                        #{order.id.slice(-6)}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {formatDate(order.orderDate)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-lg font-bold text-gray-900">
                                    {formatPrice(order.totalPrice)}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Order Status & Payment Column */}
                              <td className="px-4 py-4 align-top">
                                <div className="space-y-3">
                                  {/* Order Status Section */}
                                  <div className="space-y-2">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      Order Status:
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)}
                                        <span className="hidden sm:inline">{order.status}</span>
                                      </span>

                                    </div>
                                  </div>
                                  {/* Payment Section */}
                                  {order.payments && order.payments.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Payment Details:
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-sm text-gray-600">
                                          <span className="font-medium">Method:</span> {order.payments[0].paymentMethod}
                                        </div>
                                        <div className="text-sm">
                                          <span className="font-medium">Status: </span>
                                          <span className={`font-medium ${order.payments[0].paymentStatus === 'Confirmed' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {order.payments[0].paymentStatus}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                                                             {/* View Items Column */}
                               <td className="px-4 py-4 align-middle">
                                 <div className="flex items-center justify-center">
                                   <button
                                     onClick={() => {
                                       // Scroll to top before navigation
                                       window.scrollTo(0, 0);
                                       navigate(`/jkhm/delivery-items/${order.id}`, { state: { orderData: order } });
                                     }}
                                     className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                                   >
                                     <MdVisibility className="w-4 h-4" />
                                     View Items
                                   </button>
                                 </div>
                               </td>
                               
                                                               {/* Payment Receipts Column */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                                  {order.payments && order.payments.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                      {order.payments.map((payment, paymentIndex) => {
                                        // Get all receipts for this payment, avoiding duplicates
                                        const receipts = [];
                                        
                                        // Check if we have detailed receipt records first (preferred)
                                        if (payment.paymentReceipts && payment.paymentReceipts.length > 0) {
                                          payment.paymentReceipts.forEach((receipt, index) => {
                                            receipts.push({
                                              id: receipt.id,
                                              type: 'detailed',
                                              url: receipt.receiptImageUrl || receipt.receipt,
                                              imageUrl: receipt.receiptImageUrl || receipt.receipt
                                            });
                                          });
                                        }
                                        // Only add direct receipt URL if no detailed records exist (to avoid duplicates)
                                        else if (payment.receiptUrl) {
                                          receipts.push({
                                            id: `direct-${payment.id}`,
                                            type: 'direct',
                                            url: payment.receiptUrl,
                                            imageUrl: payment.receiptUrl
                                          });
                                        }
                                        
                                        if (receipts.length === 0) return null;
                                        
                                        return (
                                          <div key={payment.id} className="space-y-2">
                                            {/* Show payment method and status */}
                                            <div className="text-xs text-gray-600">
                                              {payment.paymentMethod} - {payment.paymentStatus}
                                            </div>
                                            
                                            {/* Show receipts (now without duplicates) */}
                                            {receipts.map((receipt) => (
                                              <div key={receipt.id} className="flex items-center gap-2">
                                                <img 
                                                  src={`${import.meta.env.VITE_DEV_API_URL}${receipt.imageUrl}`}
                                                  alt="Payment Receipt"
                                                  className="w-16 h-16 object-cover rounded border"
                                                  onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                  }}
                                                />
                                                <a
                                                  href={`http://localhost:5000${receipt.url}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                                                >
                                                  <span>📄</span>
                                                  View
                                                </a>
                                                <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hidden">
                                                  Receipt
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {/* Show message if no payments or receipts */}
                                  {(!order.payments || order.payments.length === 0 || 
                                    !order.payments.some(payment => 
                                      payment.receiptUrl || 
                                      (payment.paymentReceipts && payment.paymentReceipts.length > 0)
                                    )) && (
                                    <div className="text-gray-500 text-xs">
                                      No Receipt Uploaded
                                    </div>
                                  )}
                                </td>
                              
                              {/* Address Column */}
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm text-gray-900">
                                  {order.deliveryItems && order.deliveryItems.length > 0 && order.deliveryItems[0].deliveryAddress ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <MdLocationOn className="w-4 h-4 text-red-500 flex-shrink-0" />
                                        <span className="font-medium">Address:</span>
                                      </div>
                                      <div className="pl-6 text-gray-600 space-y-1">
                                        {order.deliveryItems[0].deliveryAddress.street && (
                                          <div className="text-sm truncate max-w-48" title={order.deliveryItems[0].deliveryAddress.street}>
                                            {order.deliveryItems[0].deliveryAddress.street}
                                          </div>
                                        )}
                                        {order.deliveryItems[0].deliveryAddress.housename && (
                                          <div className="text-sm truncate max-w-48" title={order.deliveryItems[0].deliveryAddress.housename}>
                                            {order.deliveryItems[0].deliveryAddress.housename}
                                          </div>
                                        )}
                                        {order.deliveryItems[0].deliveryAddress.city && (
                                          <div className="text-sm truncate max-w-48" title={order.deliveryItems[0].deliveryAddress.city}>
                                            {order.deliveryItems[0].deliveryAddress.city}
                                          </div>
                                        )}
                                        {order.deliveryItems[0].deliveryAddress.pincode && (
                                          <div className="text-sm">{order.deliveryItems[0].deliveryAddress.pincode}</div>
                                        )}
                                      </div>
                                    </div>
                                  ) : order.deliveryAddressId ? (
                                    <div className="flex items-center gap-2">
                                      <MdLocationOn className="w-4 h-4 text-red-500 flex-shrink-0" />
                                      <span className="font-medium">Address ID:</span>
                                      <span className="text-gray-600 text-sm">{order.deliveryAddressId.slice(-6)}</span>
                                    </div>
                                  ) : (
                                    <div className="text-gray-500 italic text-sm">No address</div>
                                  )}
                                </div>
                              </td>

                              {/* Actions Column */}
                              <td className="px-4 py-4 align-top">
                                <div className="flex items-center gap-2">
                                  {canCancelOrder(order.status) && (
                                    <button
                                      onClick={() => handleCancelOrder(order)}
                                      disabled={cancellingOrders.has(order.id)}
                                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                                        cancellingOrders.has(order.id)
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                                      }`}
                                    >
                                      {cancellingOrders.has(order.id) ? (
                                        <div className="flex items-center justify-center gap-2">
                                          <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                                          Cancelling...
                                        </div>
                                      ) : (
                                        <>
                                          <MdCancel className="w-3 h-3 inline mr-1" />
                                          Cancel Order
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Quick Actions */}
            <div className="xl:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Empty space for future content */}
              </div>
            </div>
          </div>
        </div>




        {/* Business Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <MdWarning className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Remove Customer</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 font-medium">
                    Are you sure you want to remove{' '}
                    <span className="text-gray-900 font-bold">
                      {userToDelete.contacts?.[0]?.firstName} {userToDelete.contacts?.[0]?.lastName}
                    </span>
                    {' '}from your customer database?
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> This will permanently remove the customer and all associated data including order history, addresses, and contact information.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelDeleteUser}
                  className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  Keep Customer
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={deletingUsers.has(userToDelete.id)}
                  className={`flex-1 px-6 py-3 text-sm font-medium text-white rounded-lg transition-all duration-200 ${
                    deletingUsers.has(userToDelete.id)
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 shadow-sm'
                  }`}
                >
                  {deletingUsers.has(userToDelete.id) ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Removing...
                    </div>
                  ) : (
                    'Remove Customer'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Business Order Cancellation Modal */}
        {showCancelOrderModal && orderToCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MdWarning className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Cancel Business Order</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-8 space-y-4">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
                      <p className="text-sm font-medium text-gray-900">#{orderToCancel.id.slice(-6)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Order Amount</p>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(orderToCancel.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Current Status</p>
                      <p className="text-sm font-medium text-gray-900">{orderToCancel.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Action</p>
                      <p className="text-sm font-medium text-gray-900">Cancel & Restore Stock</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-700">
                    <strong>Business Impact:</strong> Cancelling this order will restore inventory quantities and update your order analytics. This action is recommended only for genuine business needs.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closeCancelOrderModal}
                  className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  Maintain Order
                </button>
                <button
                  onClick={() => cancelOrder(orderToCancel.id)}
                  disabled={cancellingOrders.has(orderToCancel.id)}
                  className={`flex-1 px-6 py-3 text-sm font-medium text-white rounded-lg transition-all duration-200 ${
                    cancellingOrders.has(orderToCancel.id)
                      ? 'bg-orange-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 shadow-sm'
                  }`}
                >
                  {cancellingOrders.has(orderToCancel.id) ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    'Cancel Order & Restore Inventory'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in SellerPage:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default SellerPage;
