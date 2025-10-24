import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MdPerson,
  MdShoppingCart,
  MdAttachMoney,
  MdCalendarToday,
  MdLocalShipping,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdRefresh,
  MdLocationOn,
  MdReceipt,
  MdOpenInNew
} from 'react-icons/md';
import axios from 'axios';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';

/**
 * CustomerPortalPage - Customer self-service portal for order status viewing
 * Provides read-only access to customer order information and status
 * Features: Order status viewing, delivery tracking, payment receipts
 */
const CustomerPortalPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(null);

  // State management
  const [customerInfo, setCustomerInfo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderSummary, setOrderSummary] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Initialize token and hide it from URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    
    if (!urlToken) {
      // Try to get token from sessionStorage (for page refresh)
      const storedToken = sessionStorage.getItem('customerPortalToken');
      if (storedToken) {
        setToken(storedToken);
        return;
      }
      
      setError('No access token provided. Please use a valid link.');
      setLoading(false);
      return;
    }

    // Store token in sessionStorage and remove from URL for security
    sessionStorage.setItem('customerPortalToken', urlToken);
    setToken(urlToken);
    
    // Remove token from URL without page reload
    const url = new URL(window.location);
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.pathname);
  }, [searchParams]);

  // Fetch customer data
  useEffect(() => {
    if (!token) {
      return;
    }

    fetchCustomerData();
  }, [token]);

  // Cleanup sessionStorage on component unmount
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('customerPortalToken');
    };
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer info and order summary
      const baseURL = import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000/api';
      const [summaryResponse, ordersResponse, addressesResponse] = await Promise.all([
        axios.get(`${baseURL}/customer-portal/order-summary?token=${token}`),
        axios.get(`${baseURL}/customer-portal/orders?token=${token}`),
        axios.get(`${baseURL}/customer-portal/addresses?token=${token}`)
      ]);

      if (summaryResponse.data.success) {
        setCustomerInfo(summaryResponse.data.data.customer);
        setOrderSummary(summaryResponse.data.data.summary);
      }

      if (ordersResponse.data.success) {
        setOrders(ordersResponse.data.data.orders);
      }

      if (addressesResponse.data.success) {
        setAddresses(addressesResponse.data.data.addresses);
      }

    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError(error.response?.data?.message || 'Failed to load customer data');
      showErrorToast('Failed to load customer data');
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

  // Handle view payment receipts
  const handleViewReceipts = (order) => {
    let receiptUrl = null;
    
    if (order.payments && order.payments.length > 0) {
      for (const payment of order.payments) {
        if (payment.paymentReceipts && payment.paymentReceipts.length > 0) {
          receiptUrl = payment.paymentReceipts[0].receiptImageUrl || payment.paymentReceipts[0].receipt;
          break;
        } else if (payment.receiptUrl) {
          receiptUrl = payment.receiptUrl;
          break;
        }
      }
    }
    
    if (receiptUrl) {
      const baseURL = import.meta.env.VITE_DEV_API_URL || 'http://localhost:5000';
      window.open(`${baseURL.replace('/api', '')}${receiptUrl}`, '_blank', 'noopener,noreferrer');
    }
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header - Amazon/Flipkart Style */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {customerInfo?.customerName?.charAt(0) || 'C'}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-500">Welcome back, {customerInfo?.customerName || 'Customer'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchCustomerData}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm"
              >
                <MdRefresh className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Modern Stats Cards - Amazon Style */}
        {orderSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{orderSummary.totalOrders}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MdShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(orderSummary.totalSpent)}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MdAttachMoney className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Orders</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{orderSummary.activeOrders}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <MdPending className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{orderSummary.completedOrders}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MdCheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Deliveries Section */}
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const todaysDeliveries = orders.flatMap(order => 
            order.deliveryItems?.filter(item => 
              item.deliveryDate && item.deliveryDate.split('T')[0] === today
            ).map(item => ({ ...item, orderId: order.id, orderNumber: order.id.slice(-8) })) || []
          );

          if (todaysDeliveries.length > 0) {
            return (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <MdLocalShipping className="w-4 h-4 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Today's Deliveries</h2>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    {todaysDeliveries.length} item{todaysDeliveries.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid gap-3">
                  {todaysDeliveries.map((item, index) => (
                    <div key={`${item.orderId}-${item.id}`} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
                            {item.quantity}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.menuItem?.name || 'Unknown Item'}</h3>
                            <p className="text-sm text-gray-500">Order #{item.orderNumber}</p>
                            {item.deliveryTimeSlot && (
                              <p className="text-sm text-orange-600 font-medium">{item.deliveryTimeSlot}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            item.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {item.status}
                          </div>
                          {item.deliveryAddress && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.deliveryAddress.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <MdLocalShipping className="w-4 h-4 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Today's Deliveries</h2>
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                  No deliveries
                </span>
              </div>
              
              <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdLocalShipping className="text-xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No deliveries today</h3>
                <p className="text-gray-500">You don't have any deliveries scheduled for today</p>
              </div>
            </div>
          );
        })()}

        {/* Modern Orders Section - Flipkart/Amazon Style */}
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
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Order Header - Amazon Style */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500">
                            Order placed on <span className="font-medium text-gray-900">{formatDate(order.orderDate)}</span>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                      </div>
                    </div>

                    {/* Order Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-8)}</h3>
                          <p className="text-sm text-gray-500">Order ID: {order.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
                          <p className="text-sm text-gray-500">{order.deliveryItems?.length || 0} item{(order.deliveryItems?.length || 0) !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                        {order.deliveryItems && order.deliveryItems.length > 0 && (
                          <button
                            onClick={() => {
                              const newExpandedOrders = { ...expandedOrders };
                              newExpandedOrders[order.id] = !newExpandedOrders[order.id];
                              setExpandedOrders(newExpandedOrders);
                            }}
                            className="px-4 py-2 text-orange-600 border border-orange-200 rounded-md hover:bg-orange-50 transition-colors text-sm font-medium"
                          >
                            {expandedOrders[order.id] ? 'Hide Details' : 'Track Package'}
                          </button>
                        )}
                        
                        {order.payments && order.payments.length > 0 && 
                         order.payments.some(payment => 
                           payment.receiptUrl || 
                           (payment.paymentReceipts && payment.paymentReceipts.length > 0)
                         ) && (
                          <button
                            onClick={() => handleViewReceipts(order)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <MdReceipt className="w-4 h-4" />
                            View Receipt
                          </button>
                        )}
                      </div>

                      {/* Expanded Delivery Items - Modern Card Layout */}
                      {expandedOrders[order.id] && order.deliveryItems && order.deliveryItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MdLocalShipping className="w-4 h-4" />
                            Package Details ({order.deliveryItems.length} item{order.deliveryItems.length !== 1 ? 's' : ''})
                          </h4>
                          
                          <div className="grid gap-3">
                            {order.deliveryItems.map((item) => (
                              <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
                                      {item.quantity}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-gray-900 mb-1">
                                        {item.menuItem?.name || 'Unknown Item'}
                                      </h5>
                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <MdCalendarToday className="w-3 h-3" />
                                          <span>{formatDate(item.deliveryDate)}</span>
                                        </div>
                                        {item.deliveryTimeSlot && (
                                          <div className="flex items-center gap-1">
                                            <MdLocalShipping className="w-3 h-3" />
                                            <span className="font-medium text-orange-600">{item.deliveryTimeSlot}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    item.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {item.status}
                                  </div>
                                </div>
                                
                                {/* Delivery Address - Modern Card */}
                                {item.deliveryAddress && (
                                  <div className="mt-3 bg-white rounded-md p-3 border border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                      <MdLocationOn className="w-3 h-3 text-red-500" />
                                      <span className="font-medium text-gray-700">Delivery Address</span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      {item.deliveryAddress.housename && (
                                        <div className="font-medium text-gray-800">{item.deliveryAddress.housename}</div>
                                      )}
                                      <div>{item.deliveryAddress.street}</div>
                                      <div>{item.deliveryAddress.city}{item.deliveryAddress.pincode && item.deliveryAddress.pincode !== 0 ? ` - ${item.deliveryAddress.pincode}` : ''}</div>
                                      {item.deliveryAddress.googleMapsUrl && (
                                        <div className="mt-2">
                                          <a
                                            href={item.deliveryAddress.googleMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                                          >
                                            <MdOpenInNew className="w-3 h-3" />
                                            View on Maps
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

export default CustomerPortalPage;
