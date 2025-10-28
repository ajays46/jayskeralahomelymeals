import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showErrorToast } from '../utils/toastConfig.jsx';
import { 
  MdPerson,
  MdShoppingCart,
  MdAttachMoney,
  MdCalendarToday,
  MdLocalShipping,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdLocationOn,
  MdReceipt
} from 'react-icons/md';

/**
 * CustomerOrdersPage - Customer orders page after login
 * Displays customer orders using authenticated API access
 * Features: Protected orders view, session management
 */
const CustomerOrdersPage = () => {
  const navigate = useNavigate();

  // State management
  const [customerInfo, setCustomerInfo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderSummary, setOrderSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Check authentication and fetch data
  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseURL = import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000/api';
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        navigate('/customer-login');
        return;
      }

      // Decode the token to get userId
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = tokenPayload.userId;

      if (!userId) {
        showErrorToast('Invalid session. Please login again.');
        navigate('/customer-login');
        return;
      }

      // Fetch orders using authenticated endpoint
      try {
        const ordersResponse = await axios.get(`${baseURL}/orders/user/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (ordersResponse.data.success) {
          const ordersData = ordersResponse.data.data.orders || ordersResponse.data.data || [];
          setOrders(ordersData);
          
          // Set customer info (get from user data if available)
          setCustomerInfo({
            customerName: 'Customer',
            phoneNumber: ''
          });

          // Calculate summary
          const summary = {
            totalOrders: ordersData.length,
            totalSpent: ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
            activeOrders: ordersData.filter(order => 
              order.status === 'Payment_Confirmed' || order.status === 'In_Progress'
            ).length,
            completedOrders: ordersData.filter(order => order.status === 'Completed').length,
            cancelledOrders: ordersData.filter(order => order.status === 'Cancelled').length,
            recentOrders: ordersData.slice(0, 5)
          };
          setOrderSummary(summary);
        }
      } catch (apiError) {
        // If the API endpoint doesn't exist, show a helpful message
        console.error('API Error:', apiError);
        setError('Unable to fetch orders at this time. Please contact support or try again later.');
        showErrorToast('Unable to load orders. This feature is still being set up.');
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Session expired or unauthorized
        localStorage.removeItem('accessToken');
        showErrorToast('Session expired. Please login again.');
        navigate('/customer-login');
      } else {
        setError(error.response?.data?.message || 'Failed to load customer data');
        showErrorToast('Failed to load customer data');
      }
    } finally {
      setLoading(false);
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
    if (!price || price === 0) return 'N/A';
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/customer-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading your orders...</h3>
          <p className="text-gray-500">Please wait while we fetch your order details</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdPerson className="text-2xl text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleLogout}
            className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {customerInfo?.customerName?.charAt(0) || 'C'}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-500">Welcome, {customerInfo?.customerName || 'Customer'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {orderSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{orderSummary.totalOrders}</p>
                </div>
                <MdShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(orderSummary.totalSpent)}</p>
                </div>
                <MdAttachMoney className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Orders</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{orderSummary.activeOrders}</p>
                </div>
                <MdPending className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{orderSummary.completedOrders}</p>
                </div>
                <MdCheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Orders</h2>
            <span className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdShoppingCart className="text-2xl text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500">You haven't placed any orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Order placed on <span className="font-medium text-gray-900">{formatDate(order.orderDate || order.createdAt)}</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</h3>
                          <p className="text-sm text-gray-500">Order ID: {order.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersPage;
