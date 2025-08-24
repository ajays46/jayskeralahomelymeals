import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast,
  showPaymentSuccess,
  showPaymentError,
  showAddressSuccess,
  showCopiedToClipboard
} from '../utils/toastConfig.jsx';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { 
  MdCreditCard, 
  MdAccountBalance, 
  MdPhoneAndroid, 
  MdReceipt,
  MdArrowBack,
  MdCancel,
  MdCheckCircle,
  MdWarning,
  MdLocationOn,
  MdSchedule,
  MdShoppingCart,
  MdPayment,
  MdEdit,
  MdAdd
} from 'react-icons/md';
import { createPayment, cancelOrder } from '../hooks/userHooks/useOrder';
import Navbar from '../components/Navbar';

// Address Edit Modal Component
const AddressEditModal = ({ isOpen, onClose, onSave, addressType, currentAddress }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  // Update form data when currentAddress changes
  useEffect(() => {
    if (currentAddress) {
      setFormData({
        name: currentAddress.name || '',
        phone: currentAddress.phone || '',
        address: currentAddress.address || '',
        city: currentAddress.city || '',
        state: currentAddress.state || '',
        pincode: currentAddress.pincode || '',
        landmark: currentAddress.landmark || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
      });
    }
  }, [currentAddress, addressType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getAddressTypeLabel = () => {
    switch (addressType) {
      case 'breakfast': return 'Breakfast Delivery';
      case 'lunch': return 'Lunch Delivery';
      case 'dinner': return 'Dinner Delivery';
      default: return 'Primary Delivery';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
                         <h2 className="text-xl font-bold flex items-center gap-3">
               <MdLocationOn className="text-2xl" />
               Edit {getAddressTypeLabel()} Address
             </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <MdCancel className="text-2xl" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter complete address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter state"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter pincode"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Near landmark (optional)"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
                         <button
               type="submit"
               className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
             >
               Save Changes
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get order data from navigation state or localStorage
  const orderDataFromState = location.state?.orderData;
  

  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [upiId, setUpiId] = useState('jayskerala@okicici'); // Default UPI ID
  const [copied, setCopied] = useState(false);
  
  // Use Modal hook for better control
  const [modal, contextHolder] = Modal.useModal();

  // Payment methods
  const paymentMethods = [
    { 
      id: 'UPI', 
      name: 'UPI Payment', 
      icon: MdPhoneAndroid, 
      color: 'purple',
      description: 'Pay using UPI apps like Google Pay, PhonePe, Paytm',
      upiId: 'jayskerala@okicici'
    },
    { 
      id: 'CreditCard', 
      name: 'Credit Card', 
      icon: MdCreditCard, 
      color: 'blue',
      description: 'Pay using credit card'
    },
    { 
      id: 'DebitCard', 
      name: 'Debit Card', 
      icon: MdCreditCard, 
      color: 'green',
      description: 'Pay using debit card'
    },
    { 
      id: 'NetBanking', 
      name: 'Net Banking', 
      icon: MdAccountBalance, 
      color: 'orange',
      description: 'Pay using net banking'
    }
  ];

  useEffect(() => {
    // Fetch order details
    fetchOrderDetails();
  }, [orderId, orderDataFromState]);



  const fetchOrderDetails = async () => {
    try {
      // Priority: 1. Navigation state, 2. localStorage, 3. Fetch by orderId
      if (orderDataFromState) {
        setOrder(orderDataFromState);
        setLoading(false);
        return;
      }
      
      const savedOrder = localStorage.getItem('savedOrder');
      
      if (savedOrder) {
        const orderData = JSON.parse(savedOrder);
        setOrder(orderData);
      } else if (orderId) {
        // If orderId is provided, try to fetch order from API
        // This handles the case where user comes directly to payment page
        // For now, redirect to booking page
        navigate('/jkhm/bookings');
        return;
      } else {
        // If no order data found, redirect to booking page
        navigate('/jkhm/bookings');
        return;
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      showErrorToast('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (methodId) => {
    setPaymentMethod(methodId);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setReceiptFile(file);
      
      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setReceiptPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handlePaymentSubmit = async () => {
    // Check if order data is available
    if (!order) {
      showErrorToast('Order data is missing. Please try booking again.');
      return;
    }

    // Check if user ID is present
    if (!order.userId) {
      showErrorToast('User ID is missing from order data. Please try booking again.');
      return;
    }

    if (!paymentMethod) {
      showErrorToast('Please select a payment method');
      return;
    }

    if (!receiptFile) {
      showErrorToast('Please upload payment receipt');
      return;
    }

    setPaymentProcessing(true);

    try {
      const formData = new FormData();
      
      // Only append orderId if it exists (for existing orders)
      if (orderId) {
        formData.append('orderId', orderId);
      }
      
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentAmount', order.totalPrice || 0);
      formData.append('receipt', receiptFile);
      formData.append('receiptType', receiptFile.type.startsWith('image/') ? 'Image' : 'PDF');

      // Validate that all required order data is present
      if (!order.userId) {
        showErrorToast('User ID is missing from order data. Please try booking again.');
        return;
      }
      
      if (!order.orderItems || order.orderItems.length === 0) {
        showErrorToast('Order items are missing. Please try booking again.');
        return;
      }
      
      if (!order.selectedDates || order.selectedDates.length === 0) {
        showErrorToast('Selected dates are missing. Please try booking again.');
        return;
      }
      
      if (!order.orderTimes || order.orderTimes.length === 0) {
        showErrorToast('Order times are missing. Please try booking again.');
        return;
      }

      // Add orderData for delivery items creation
      const orderData = {
        orderTimes: order.orderTimes,
        orderItems: order.orderItems,
        deliveryLocations: order.deliveryLocations,
        selectedDates: order.selectedDates,
        skipMeals: order.skipMeals || {},
        orderDate: order.orderDate,
        orderMode: order.orderMode,
        menuId: order.menuId,
        menuName: order.menuName,
        deliveryAddressId: order.deliveryAddressId || 
          order.deliveryLocations?.full || 
          order.deliveryLocations?.breakfast || 
          order.deliveryLocations?.lunch || 
          order.deliveryLocations?.dinner,
        userId: order.userId // Include userId for server-side order creation
      };


      
      // Additional validation of orderData before sending
      if (!orderData.userId) {
        showErrorToast('User ID is missing. Please try booking again.');
        return;
      }
      
      if (!orderData.orderItems || orderData.orderItems.length === 0) {
        showErrorToast('Order items are missing. Please try booking again.');
        return;
      }
      
      if (!orderData.selectedDates || orderData.selectedDates.length === 0) {
        showErrorToast('Selected dates are missing. Please try booking again.');
        return;
      }
      
      if (!orderData.orderTimes || orderData.orderTimes.length === 0) {
        showErrorToast('Order times are missing. Please try booking again.');
        return;
      }

      formData.append('orderData', JSON.stringify(orderData));



      const response = await createPayment(formData);
      
      if (response.success) {
        // Clear the saved order from localStorage
        localStorage.removeItem('savedOrder');
        // Navigate to booking page with success state
        navigate('/jkhm/bookings', { 
          state: { 
            showOrderSuccess: true,
            orderDetails: order,
            successMessage: 'Order placed successfully! Payment confirmed.'
          } 
        });
      } else {
        showPaymentError(response.message || 'Payment submission failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showPaymentError('Payment submission failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

    const handleCancelOrder = async () => {
     // For new orders (no orderId), just redirect back to booking
     if (!orderId) {
       navigate('/jkhm/bookings');
       return;
     }
     
     try {
       // Use Modal hook instead of static method
       modal.confirm({
         title: 'Cancel Order',
         content: 'Are you sure you want to cancel this order? This action cannot be undone.',
         okText: 'Yes, Cancel Order',
         okType: 'danger',
         cancelText: 'No, Keep Order',
         centered: true,
         maskClosable: false,
         closable: true,
         onOk: async () => {
           await performCancelOrder();
         },
         onCancel: () => {
         },
       });
     } catch (error) {
       // Fallback to browser confirm if Ant Design fails
       console.error('Ant Design Modal failed, using browser confirm:', error);
       if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
         await performCancelOrder();
       }
     }
   };

    const performCancelOrder = async () => {
     // This function should only be called when orderId exists
     if (!orderId) {
       navigate('/jkhm/bookings');
       return;
     }
     
     try {
       const response = await cancelOrder(orderId);
               if (response.success) {
          // Clear the saved order from localStorage
          localStorage.removeItem('savedOrder');
          showSuccessToast('Order cancelled successfully', 'Order Cancelled');
          navigate('/jkhm/bookings');
        } else {
          showErrorToast(response.message || 'Failed to cancel order', 'Cancel Failed');
        }
      } catch (error) {
        console.error('Cancel order error:', error);
        showErrorToast('Failed to cancel order', 'Cancel Failed');
      }
   };

  const handleEditAddress = (addressType) => {
    // Get the current address data
    let currentAddressData = null;
    
    if (addressType === 'breakfast') {
      currentAddressData = order.deliveryLocations?.breakfast;
    } else if (addressType === 'lunch') {
      currentAddressData = order.deliveryLocations?.lunch;
    } else if (addressType === 'dinner') {
      currentAddressData = order.deliveryLocations?.dinner;
    } else {
      // For primary address, try to get from primary or use the first available address
      currentAddressData = order.deliveryLocations?.primary || 
                         order.deliveryLocations?.breakfast || 
                         order.deliveryLocations?.lunch || 
                         order.deliveryLocations?.dinner;
    }
    
    setEditingAddress(addressType);
    setShowAddressModal(true);
  };

  const handleSaveAddress = (addressData) => {
    // Update the order with new address
    const updatedOrder = { ...order };
    
    if (editingAddress === 'breakfast') {
      updatedOrder.deliveryLocations = { ...updatedOrder.deliveryLocations, breakfast: addressData };
      updatedOrder.deliveryLocationNames = { ...updatedOrder.deliveryLocationNames, breakfast: addressData.name };
    } else if (editingAddress === 'lunch') {
      updatedOrder.deliveryLocations = { ...updatedOrder.deliveryLocations, lunch: addressData };
      updatedOrder.deliveryLocationNames = { ...updatedOrder.deliveryLocationNames, lunch: addressData.name };
    } else if (editingAddress === 'dinner') {
      updatedOrder.deliveryLocations = { ...updatedOrder.deliveryLocations, dinner: addressData };
      updatedOrder.deliveryLocationNames = { ...updatedOrder.deliveryLocationNames, dinner: addressData.name };
    } else {
      // Primary address
      updatedOrder.deliveryLocations = { ...updatedOrder.deliveryLocations, primary: addressData };
      updatedOrder.deliveryLocationNames = { ...updatedOrder.deliveryLocationNames, full: addressData.name };
    }
    
    // Update localStorage
    localStorage.setItem('savedOrder', JSON.stringify(updatedOrder));
    setOrder(updatedOrder);
    setShowAddressModal(false);
    setEditingAddress(null);
    showAddressSuccess('Address updated successfully');
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      showCopiedToClipboard('UPI ID');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy UPI ID:', error);
      showErrorToast('Failed to copy UPI ID', 'Copy Failed');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price); // Price is already in rupees
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (dates) => {
    if (!dates || dates.length === 0) return '';
    
    if (dates.length === 1) {
      return formatDate(dates[0]);
    }
    
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);
    
    const startMonth = startDate.toLocaleDateString('en-IN', { month: 'long' });
    const endMonth = endDate.toLocaleDateString('en-IN', { month: 'long' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} to ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} to ${endMonth} ${endDay}, ${year}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <MdWarning className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/jkhm/bookings')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {contextHolder}
      <Navbar />
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-orange-100 mt-20 lg:mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/jkhm/bookings')}
                className="p-2 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <MdArrowBack className="text-2xl text-orange-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Payment Checkout</h1>
                <p className="text-sm text-gray-600">
          {orderId ? `Order #${orderId}` : 'New Order'}
        </p>
              </div>
            </div>
            <button
              onClick={handleCancelOrder}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <MdCancel className="text-lg" />
              <span className="hidden sm:inline">Cancel Order</span>
              <span className="sm:hidden">Cancel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <MdShoppingCart className="text-2xl" />
                  Order Summary
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Menu Details */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MdCheckCircle className="text-green-500" />
                    Selected Menu
                  </h3>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-bold text-lg text-orange-800">{order.menuName}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.orderTimes?.includes('Morning') && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          🍳 Breakfast
                        </span>
                      )}
                      {order.orderTimes?.includes('Noon') && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          🍽️ Lunch
                        </span>
                      )}
                      {order.orderTimes?.includes('Night') && (
                        <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                          🌙 Dinner
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MdLocationOn className="text-blue-500" />
                    Delivery Details
                  </h3>
                  <div className="space-y-3">
                                         <div className="flex items-start gap-3">
                       <MdSchedule className="text-gray-500 mt-1 flex-shrink-0" />
                       <div>
                         <p className="font-medium text-gray-800">Delivery Dates</p>
                         <p className="text-sm text-gray-600">
                           {order.selectedDates?.length || 1} day(s) selected
                         </p>
                         {order.selectedDates && order.selectedDates.length > 0 && (
                           <div className="mt-2">
                             <div className="flex items-center gap-2">
                               <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                               <span className="text-sm text-gray-700 font-medium">
                                 {formatDateRange(order.selectedDates)}
                               </span>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                                         {/* Always show delivery addresses section */}
                     <div className="flex items-start gap-3">
                       <MdLocationOn className="text-gray-500 mt-1 flex-shrink-0" />
                       <div className="flex-1">
                                                   <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-800">Delivery Addresses</p>
                          </div>
                         <div className="text-sm text-gray-600 space-y-2">
                           {order.deliveryLocations?.breakfast && (
                             <div className="bg-green-50 p-3 rounded-lg border border-green-200 relative">
                               <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-2">
                                   <span className="text-green-600">🍳</span>
                                   <span className="font-semibold text-green-800">Breakfast Delivery</span>
                                 </div>
                                 <button
                                   onClick={() => handleEditAddress('breakfast')}
                                   className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                 >
                                   <MdEdit className="text-sm" />
                                   Edit
                                 </button>
                               </div>
                               <p className="text-gray-700 break-words font-medium">
                                 {order.deliveryLocationNames?.breakfast || 'Primary Address'}
                               </p>
                               {order.deliveryLocationNames?.breakfast && (
                                 <p className="text-xs text-green-600 mt-1">Full address details shown above</p>
                               )}
                             </div>
                           )}
                           {order.deliveryLocations?.lunch && (
                             <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 relative">
                               <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-2">
                                   <span className="text-yellow-600">🍽️</span>
                                   <span className="font-semibold text-yellow-800">Lunch Delivery</span>
                                 </div>
                                 <button
                                   onClick={() => handleEditAddress('lunch')}
                                   className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                 >
                                   <MdEdit className="text-sm" />
                                   Edit
                                 </button>
                               </div>
                               <p className="text-gray-700 break-words font-medium">
                                 {order.deliveryLocationNames?.lunch || 'Primary Address'}
                               </p>
                               {order.deliveryLocationNames?.lunch && (
                                 <p className="text-xs text-yellow-600 mt-1">Full address details shown above</p>
                               )}
                             </div>
                           )}
                           {order.deliveryLocations?.dinner && (
                             <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 relative">
                               <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-2">
                                   <span className="text-pink-600">🌙</span>
                                   <span className="font-semibold text-pink-800">Dinner Delivery</span>
                                 </div>
                                 <button
                                   onClick={() => handleEditAddress('dinner')}
                                   className="flex items-center gap-1 px-2 py-1 text-xs bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
                                 >
                                   <MdEdit className="text-sm" />
                                   Edit
                                 </button>
                               </div>
                               <p className="text-gray-700 break-words font-medium">
                                 {order.deliveryLocationNames?.dinner || 'Primary Address'}
                               </p>
                               {order.deliveryLocationNames?.dinner && (
                                 <p className="text-xs text-pink-600 mt-1">Full address details shown above</p>
                               )}
                             </div>
                           )}
                           {/* Show primary address if no meal-specific addresses */}
                           {(!order.deliveryLocations?.breakfast && !order.deliveryLocations?.lunch && !order.deliveryLocations?.dinner) && (
                             <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 relative">
                               <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-2">
                                   <span className="text-blue-600">📍</span>
                                   <span className="font-semibold text-blue-800">All Meals Delivery</span>
                                 </div>
                                 <button
                                   onClick={() => handleEditAddress('primary')}
                                   className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                 >
                                   <MdEdit className="text-sm" />
                                   Edit
                                 </button>
                               </div>
                               <p className="text-gray-700 font-medium">
                                 {order.deliveryLocationNames?.full || 'Primary Address'}
                               </p>
                               {order.deliveryLocationNames?.full && (
                                 <p className="text-xs text-blue-600 mt-1">Full address details shown above</p>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                  </div>
                </div>

                {/* Skip Meals Summary */}
                {order.skipMeals && Object.keys(order.skipMeals).length > 0 && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <MdWarning className="text-orange-500" />
                      Skipped Meals
                    </h3>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-orange-700">
                        You have skipped some meals. Your order has been adjusted accordingly.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <MdPayment className="text-2xl" />
                  Select Payment Method
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          paymentMethod === method.id
                            ? `border-${method.color}-500 bg-${method.color}-50`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-${method.color}-500 flex items-center justify-center`}>
                            <IconComponent className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{method.name}</h3>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                          {paymentMethod === method.id && (
                            <MdCheckCircle className="text-green-500 text-xl" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* UPI ID Display and Copy Button */}
                {paymentMethod === 'UPI' && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                        <MdPhoneAndroid className="text-purple-600" />
                        UPI ID
                      </h4>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        Copy to Pay
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white p-3 rounded-lg border border-purple-300">
                        <p className="font-mono text-lg text-purple-800 font-semibold">
                          {paymentMethods.find(m => m.id === 'UPI')?.upiId}
                        </p>
                      </div>
                      <button
                        onClick={handleCopyUpiId}
                        className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                          copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                        }`}
                      >
                        {copied ? (
                          <>
                            <MdCheckCircle className="text-lg" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <MdReceipt className="text-lg" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-purple-600 mt-2">
                      📱 Use any UPI app (Google Pay, PhonePe, Paytm) to pay using this UPI ID
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <MdReceipt className="text-2xl" />
                  Upload Payment Receipt
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      <MdReceipt className="text-4xl text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        Click to upload payment receipt
                      </p>
                      <p className="text-sm text-gray-500">
                        Supported formats: JPG, PNG, PDF (Max 5MB)
                      </p>
                    </label>
                  </div>
                  
                  {receiptPreview && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Receipt Preview:</h4>
                      <img 
                        src={receiptPreview} 
                        alt="Receipt preview" 
                        className="max-w-full h-48 object-contain border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                  
                  {receiptFile && !receiptPreview && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 font-medium">
                        📄 {receiptFile.name} uploaded successfully
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                  <h2 className="text-xl font-bold">Payment Summary</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order Total:</span>
                    <span className="font-bold text-2xl text-orange-600">
                      {formatPrice(order.totalPrice || 0)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                      <span className="text-xl font-bold text-orange-600">
                        {formatPrice(order.totalPrice || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={!paymentMethod || !receiptFile || paymentProcessing}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <MdPayment className="text-xl" />
                        Submit Payment
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    By submitting payment, you agree to our terms and conditions
                  </p>
                </div>
              </div>
            </div>
                     </div>
         </div>
       </div>

               {/* Address Edit Modal */}
        {showAddressModal && (
          <AddressEditModal
            isOpen={showAddressModal}
            onClose={handleCloseAddressModal}
            onSave={handleSaveAddress}
            addressType={editingAddress}
            currentAddress={(() => {
              let addressData = null;
              if (editingAddress === 'breakfast') {
                addressData = order.deliveryLocations?.breakfast;
              } else if (editingAddress === 'lunch') {
                addressData = order.deliveryLocations?.lunch;
              } else if (editingAddress === 'dinner') {
                addressData = order.deliveryLocations?.dinner;
              } else {
                // For primary address, try to get from primary or use the first available address
                addressData = order.deliveryLocations?.primary || 
                           order.deliveryLocations?.breakfast || 
                           order.deliveryLocations?.lunch || 
                           order.deliveryLocations?.dinner;
              }
              return addressData;
            })()}
          />
        )}

     </div>
   );
 };

export default PaymentPage; 