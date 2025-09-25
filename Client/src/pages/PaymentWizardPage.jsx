import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { 
  MdCreditCard, 
  MdAccountBalance, 
  MdPhoneAndroid, 
  MdReceipt,
  MdArrowForward,
  MdArrowBack,
  MdCheckCircle,
  MdPayment,
  MdShoppingCart,
  MdLocationOn,
  MdSchedule,
  MdPerson,
  MdWarning,
  MdCheckCircleOutline,
  MdEdit,
  MdContentCopy,
  MdFileUpload,
  MdDelete,
  MdVisibility,
  MdVisibilityOff,
  MdCloudUpload,
  MdInfo,
  MdCancel
} from 'react-icons/md';
import { createPayment, useOrder } from '../hooks/userHooks/useOrder';
import { 
  showSuccessToast, 
  showErrorToast, 
  showPaymentSuccess,
  showPaymentError,
  showOrderSuccess,
  showOrderError
} from '../utils/toastConfig.jsx';
import axiosInstance from '../api/axios.js';
import useAuthStore from '../stores/Zustand.store.js';
import { SkeletonWizardStep, SkeletonLoading } from '../components/Skeleton';

const PaymentWizardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [upiId] = useState('jayskerala@okicici');
  const [upiPhoneNumber] = useState('+91 9876543210');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    housename: '',
    street: '',
    city: '',
    pincode: '',
    state: '',
    landmark: ''
  });
  const [showUpiId, setShowUpiId] = useState(false);
  const [upiIdCopied, setUpiIdCopied] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isUploadingToExternal, setIsUploadingToExternal] = useState(false);
  const [externalUploadUrl, setExternalUploadUrl] = useState(null);
  const [externalUploadError, setExternalUploadError] = useState(null);

  const steps = [
    { id: 1, title: 'Payment Method', icon: MdPayment, color: 'green' },
    { id: 2, title: 'Confirm Payment', icon: MdReceipt, color: 'purple' }
  ];

  const paymentMethods = [
    { 
      id: 'UPI', 
      name: 'UPI Payment', 
      icon: MdPhoneAndroid, 
      color: 'purple',
      description: 'Pay using UPI apps like Google Pay, PhonePe, Paytm'
    },
    { 
      id: 'CreditCard', 
      name: 'Credit Card', 
      icon: MdCreditCard, 
      color: 'blue',
      description: 'Pay using credit card'
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
    // Check if this is a receipt upload mode
    if (location.state?.goToReceiptUpload && location.state?.paymentId) {
      setCurrentStep(2); // Go directly to receipt upload step
      // We'll fetch the payment details and create a mock order for display
      fetchPaymentForReceiptUpload(location.state.paymentId);
      return;
    }
    
    // Get order data from navigation state or localStorage
    const orderDataFromState = location.state?.orderData;
    if (orderDataFromState) {
      setOrder(orderDataFromState);
      setPaymentAmount(orderDataFromState.totalPrice?.toString() || '');
      
      // Initialize selected dates from order data
      if (orderDataFromState.selectedDates && orderDataFromState.selectedDates.length > 0) {
        const dates = orderDataFromState.selectedDates.map(dateStr => new Date(dateStr));
        setSelectedDates(dates);
      } else {
        // Auto-select dates based on menu type if no dates are provided and not skipped
        autoSelectDatesForMenu(orderDataFromState.menu);
      }
      
      // Show success message if coming from draft
      if (location.state?.fromDraft || localStorage.getItem('fromDraft') === 'true') {
        showSuccessToast('Draft order loaded successfully! You can now complete your payment.');
        localStorage.removeItem('fromDraft'); // Clear the flag
      }
    } else {
      const savedOrder = localStorage.getItem('savedOrder');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setOrder(parsedOrder);
        setOrderDetails(parsedOrder); // Also set orderDetails for proper display
        setPaymentAmount(parsedOrder.totalPrice?.toString() || '');
        
        // Initialize selected dates from saved order data
        if (parsedOrder.selectedDates && parsedOrder.selectedDates.length > 0) {
          const dates = parsedOrder.selectedDates.map(dateStr => new Date(dateStr));
          setSelectedDates(dates);
        } else {
          // Auto-select dates based on menu type if no dates are provided and not skipped
          autoSelectDatesForMenu(parsedOrder.menu);
        }
        
        // Show success message if coming from draft
        if (localStorage.getItem('fromDraft') === 'true') {
          showSuccessToast('Draft order loaded successfully! You can now complete your payment.');
          localStorage.removeItem('fromDraft'); // Clear the flag
        }
      } else {
        navigate('/jkhm/place-order');
      }
    }
  }, [location.state, navigate]);

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-select dates when order menu is available and no dates are selected
  useEffect(() => {
    if (order?.menu && selectedDates.length === 0) {
      autoSelectDatesForMenu(order.menu);
    }
  }, [order?.menu, selectedDates.length]);

  // Fetch order details if orderId is provided in URL params
  useEffect(() => {
    const orderId = location.pathname.split('/').pop();
    
    // Only fetch if it's a valid UUID-like order ID (not route names)
    const isValidOrderId = orderId && 
      orderId !== 'payment-wizard' && 
      orderId !== 'process-payment' && 
      orderId.length > 10 &&
      !orderId.includes('-'); // Route names typically have hyphens
    
    if (isValidOrderId) {
      fetchOrderDetails(orderId);
    }
  }, [location.pathname]);

  const fetchOrderDetails = async (orderId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
      if (response.data.success) {
        setOrderDetails(response.data.data);
        setPaymentAmount(response.data.data.totalAmount?.toString() || '');
      } else {
        // API returned error
        setError('Failed to fetch order details');
      }
    } catch (error) {
      // Error fetching order details
      if (error.response?.status === 404) {
        setError(`Order with ID "${orderId}" not found`);
      } else if (error.response?.status === 500) {
        setError('Server error while fetching order details');
      } else {
        setError('Failed to fetch order details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentForReceiptUpload = async (paymentId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/payments/${paymentId}`);
      if (response.data.success) {
        const payment = response.data.data.payment;
        
        // Get order details to include delivery information
        let orderDetails = null;
        if (payment.orderId) {
          try {
            const orderResponse = await axiosInstance.get(`/orders/${payment.orderId}`);
            if (orderResponse.data.success) {
              orderDetails = orderResponse.data.data;
            }
          } catch (orderError) {
            // Could not fetch order details
          }
        }
        
        // Create a mock order object for display purposes
        const mockOrder = {
          id: payment.orderId || 'pending',
          customerName: location.state?.customer?.contacts?.[0]?.firstName || 'Customer',
          totalPrice: payment.paymentAmount,
          totalAmount: payment.paymentAmount,
          menuName: orderDetails?.menuName || 'Payment Receipt Upload',
          orderDate: payment.createdAt,
          paymentMethod: payment.paymentMethod,
          status: 'Pending',
          // Include delivery information from order details
          selectedDates: orderDetails?.selectedDates || [],
          deliveryAddress: orderDetails?.deliveryAddress || null
        };
        
        // If no selectedDates from order API, try to create some default dates for display
        if (!mockOrder.selectedDates || mockOrder.selectedDates.length === 0) {
          // Create a default 7-day range starting from tomorrow
          const defaultDates = [];
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          for (let i = 0; i < 7; i++) {
            const date = new Date(tomorrow);
            date.setDate(tomorrow.getDate() + i);
            defaultDates.push(date.toISOString().split('T')[0]);
          }
          
          mockOrder.selectedDates = defaultDates;
        }
        
        
        setOrder(mockOrder);
        setOrderDetails(mockOrder);
        setPaymentAmount(payment.paymentAmount?.toString() || '');
        setPaymentMethod(payment.paymentMethod || '');
        
        // Set selected dates for display
        if (orderDetails?.selectedDates && orderDetails.selectedDates.length > 0) {
          const dates = orderDetails.selectedDates.map(dateStr => new Date(dateStr));
          setSelectedDates(dates);
        }
      } else {
        setError('Failed to fetch payment details');
      }
    } catch (error) {
      // Error fetching payment details
      setError('Failed to fetch payment details');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return paymentMethod;
      case 2: 
        // For receipt upload mode, require a receipt file
        if (location.state?.goToReceiptUpload) {
          return !!receiptFile;
        }
        // For normal payment, receipt is optional
        return true;
      default: return false;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        showErrorToast('Please upload a valid image (JPG, PNG) or PDF file');
        return;
      }
      
      setReceiptFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setReceiptPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
      
      // Receipt selected successfully
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('File size must be less than 5MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showErrorToast('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }
    
    setReceiptFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
    
    // Receipt selected successfully
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setUpiIdCopied(true);
      // UPI ID copied to clipboard
      setTimeout(() => setUpiIdCopied(false), 2000);
    } catch (error) {
      showErrorToast('Failed to copy UPI ID');
    }
  };

  // Function to upload image to external API via backend
  const uploadImageToExternalAPI = async (file) => {
    try {
      setIsUploadingToExternal(true);
      setExternalUploadError(null);
      
      const formData = new FormData();
      formData.append('image', file);
      
      // Get the expected amount from the current order
      const currentOrder = orderDetails || order;
      const expectedAmount = currentOrder?.totalAmount || currentOrder?.totalPrice || paymentAmount || 0;
      
      // Add the expected amount to the form data
      formData.append('expected_amount', expectedAmount.toString());
      
      const response = await axiosInstance.post('/external/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Look for URL in multiple possible locations
        const imageUrl = response.data.data?.url || 
                        response.data.s3_url || 
                        response.data.url || 
                        response.data.data?.s3_url;
        
        if (imageUrl) {
          setExternalUploadUrl(imageUrl);
          setExternalUploadError(null);
          // Don't show success toast here - let the payment completion handle it
        } else {
          setExternalUploadError(null);
        }
        return { success: true, data: response.data, url: imageUrl };
      } else {
        // Backend handled the external upload failure gracefully
        setExternalUploadError(null);
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      // Handle validation failure from external API
      if (error.response?.status === 400 && error.response?.data?.success === false) {
        const errorMessage = error.response.data.message || 'Payment receipt verification failed';
        const errorDetails = error.response.data.details || [];
        
        setExternalUploadError(errorMessage);
        showErrorToast(`${errorMessage}. Please check your receipt and try again.`);
        
        return { success: false, error: errorMessage, details: errorDetails };
      }
      
      // Don't set error state for other errors - backend handles all error cases
      setExternalUploadError(null);
      return null;
    } finally {
      setIsUploadingToExternal(false);
    }
  };

  // Function to retry external upload
  const retryExternalUpload = async () => {
    if (receiptFile && receiptFile.type.startsWith('image/')) {
      await uploadImageToExternalAPI(receiptFile);
    }
  };

  const handleEditAddress = (addressType) => {
    setEditingAddress(addressType);
    setShowAddressModal(true);
    
    // Pre-fill form with existing address if available
    const currentOrder = orderDetails || order;
    if (currentOrder && currentOrder.deliveryAddress) {
      setAddressForm({
        housename: currentOrder.deliveryAddress.housename || '',
        street: currentOrder.deliveryAddress.street || '',
        city: currentOrder.deliveryAddress.city || '',
        pincode: currentOrder.deliveryAddress.pincode || '',
        state: currentOrder.deliveryAddress.state || '',
        landmark: currentOrder.deliveryAddress.landmark || ''
      });
    }
  };

  const handleSaveAddress = async (addressData) => {
    try {
      const currentOrder = orderDetails || order;
      if (!currentOrder) {
        showErrorToast('No order found');
        return;
      }

      const response = await axiosInstance.put(`/orders/${currentOrder.id}/address`, addressData);
      
      if (response.data.success) {
        showSuccessToast('Address updated successfully');
        setShowAddressModal(false);
        setEditingAddress(null);
        setAddressForm({
          housename: '',
          street: '',
          city: '',
          pincode: '',
          state: '',
          landmark: ''
        });
        
        // Refresh order details
        if (orderDetails) {
          await fetchOrderDetails(currentOrder.id);
        }
      } else {
        showErrorToast(response.data.message || 'Failed to update address');
      }
    } catch (error) {
      // Error updating address
      showErrorToast('Failed to update address');
    }
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm({
      housename: '',
      street: '',
      city: '',
      pincode: '',
      state: '',
      landmark: ''
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (dates) => {
    if (!dates || dates.length === 0) return '';
    if (dates.length === 1) return formatDate(dates[0]);
    
    const sortedDates = [...dates].sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Helper function to get customer name
  const getCustomerName = () => {
    // First priority: Get from order data (this includes selected customer name from booking)
    if (orderDetails?.customerName && orderDetails.customerName !== 'N/A') {
      return orderDetails.customerName;
    }
    if (order?.customerName && order.customerName !== 'N/A') {
      return order.customerName;
    }
    
    // Second priority: Get from current logged-in user (fallback for regular users)
    if (user?.contacts?.[0]?.firstName) {
      const firstName = user.contacts[0].firstName || '';
      return firstName.trim();
    }
    
    // Final fallback: User email or auth data
    if (user?.auth?.email) return user.auth.email;
    if (user?.email) return user.email;
    
    return 'N/A';
  };

  // Helper functions for auto-selection
  const isWeekday = (date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  };

  const isWeekdayMenu = (menu) => {
    if (!menu) return false;
    
    const itemName = menu.name?.toLowerCase() || '';
    
    // Check if it's a full week menu (should not be restricted to weekdays)
    if (itemName.includes('full week')) {
      return false;
    }
    
    // Check if it's a weekday menu based on name only
    const isWeekdayByName = itemName.includes('week day') || itemName.includes('weekday') || itemName.includes('monday') || itemName.includes('tuesday') || itemName.includes('wednesday') || itemName.includes('thursday') || itemName.includes('friday');
    return isWeekdayByName;
  };

  const getAutoSelectionDays = (menu) => {
    if (!menu) return 0;
    
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

  const autoSelectDatesForMenu = (menu) => {
    if (!menu) {
      return;
    }
    
    const autoDays = getAutoSelectionDays(menu);
    if (autoDays === 0) {
      return; // No auto-selection for daily rates
    }
    
    // Start from tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const selectedDates = [];
    const menuName = menu.name?.toLowerCase() || '';
    const isWeekDayPlan = menuName.includes('week-day') || menuName.includes('weekday') || isWeekdayMenu(menu);
    
    if (isWeekDayPlan) {
      let currentDay = new Date(tomorrow);
      
      // If tomorrow is weekend, start from next Monday
      if (currentDay.getDay() === 0) {
        currentDay.setDate(currentDay.getDate() + 1);
      } else if (currentDay.getDay() === 6) {
        currentDay.setDate(currentDay.getDate() + 2);
      }
      
      let daysSelected = 0;
      while (daysSelected < 5) {
        selectedDates.push(new Date(currentDay));
        daysSelected++;
        
        currentDay.setDate(currentDay.getDate() + 1);
        
        if (currentDay.getDay() === 6) {
          currentDay.setDate(currentDay.getDate() + 2);
        } else if (currentDay.getDay() === 0) {
          currentDay.setDate(currentDay.getDate() + 1);
        }
      }
    } else {
      for (let i = 0; i < autoDays; i++) {
        selectedDates.push(new Date(tomorrow));
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
    }
    
    setSelectedDates(selectedDates);
    
    // Show success message
    if (isWeekDayPlan) {
      const startDateDisplay = formatDateForDisplay(selectedDates[0]);
      const endDateDisplay = formatDateForDisplay(selectedDates[selectedDates.length - 1]);
      showSuccessToast(`Auto-selected 5 weekdays from ${startDateDisplay} to ${endDateDisplay}`);
    } else {
      let message = '';
      
      if (menuName.includes('monthly') || menuName.includes('month')) {
        message = `Auto-selected 30 consecutive days starting from ${formatDateForDisplay(selectedDates[0])}`;
      } else if (menuName.includes('weekly') || menuName.includes('week')) {
        message = `Auto-selected 7 consecutive days starting from ${formatDateForDisplay(selectedDates[0])}`;
      } else if (menuName.includes('full week')) {
        message = `Auto-selected 7 consecutive days starting from ${formatDateForDisplay(selectedDates[0])}`;
      } else {
        message = `Auto-selected ${autoDays} consecutive days starting from ${formatDateForDisplay(selectedDates[0])}`;
      }
      
      showSuccessToast(message);
    }
  };

  const handleAutoDateSelection = (startDate, days) => {
    const selectedDates = [];
    const currentDate = new Date(startDate);
    
    const menuName = order?.menu?.name?.toLowerCase() || '';
    const isWeekDayPlan = menuName.includes('week-day') || menuName.includes('weekday') || isWeekdayMenu(order?.menu);
    
    if (isWeekDayPlan) {
      let currentDay = new Date(currentDate);
      
      if (currentDay.getDay() === 0) {
        currentDay.setDate(currentDay.getDate() + 1);
      } else if (currentDay.getDay() === 6) {
        currentDay.setDate(currentDay.getDate() + 2);
      }
      
      let daysSelected = 0;
      while (daysSelected < 5) {
        selectedDates.push(new Date(currentDay));
        daysSelected++;
        
        currentDay.setDate(currentDay.getDate() + 1);
        
        if (currentDay.getDay() === 6) {
          currentDay.setDate(currentDay.getDate() + 2);
        } else if (currentDay.getDay() === 0) {
          currentDay.setDate(currentDay.getDate() + 1);
        }
      }
    } else {
      for (let i = 0; i < days; i++) {
        selectedDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    setSelectedDates(selectedDates);
    
    if (isWeekDayPlan) {
      const startDateDisplay = formatDateForDisplay(selectedDates[0]);
      const endDateDisplay = formatDateForDisplay(selectedDates[selectedDates.length - 1]);
      showSuccessToast(`Selected 5 weekdays from ${startDateDisplay} to ${endDateDisplay}`);
    } else {
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



  const handleReceiptUpload = async () => {
    if (!receiptFile) {
      showErrorToast('Please select a receipt file');
      return;
    }

    setPaymentProcessing(true);
    
    try {
      // First, upload to external API if it's an image
      let externalReceiptUrl = null;
      let externalValidationPassed = false;
      
      if (receiptFile.type.startsWith('image/')) {
        try {
          const externalResult = await uploadImageToExternalAPI(receiptFile);
          if (externalResult?.success === true) {
            // External validation passed successfully
            externalReceiptUrl = externalResult.url || externalResult.data?.downloadUrl || externalResult.data?.url;
            externalValidationPassed = true;
          } else if (externalResult?.success === false) {
            // External validation failed - prevent receipt upload
            showErrorToast('Payment receipt verification failed. Please check your receipt and try again.');
            return; // Stop receipt upload processing
          }
        } catch (externalError) {
          // External upload failed, continuing with local upload
        }
      }

      const formData = new FormData();
      formData.append('receipt', receiptFile);
      
      // Add external upload URL if available
      if (externalReceiptUrl) {
        formData.append('externalReceiptUrl', externalReceiptUrl);
      }
      
      const response = await axiosInstance.post(`/payments/${location.state.paymentId}/receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Navigate back to customer list with success state
        navigate('/jkhm/seller/customers', {
          state: {
            showReceiptSuccess: true,
            receiptUploaded: true,
            message: 'Payment receipt uploaded successfully!',
            customer: location.state.customer
          }
        });
      } else {
        showErrorToast(response.data.message || 'Failed to upload receipt');
      }
    } catch (error) {
      showErrorToast('Failed to upload receipt. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePaymentSubmit = async () => {
    // Check if this is receipt upload mode
    if (location.state?.goToReceiptUpload && location.state?.paymentId) {
      await handleReceiptUpload();
      return;
    }

    // Comprehensive validation
    if (!order && !orderDetails) {
      showErrorToast('No order found. Please complete your booking first.');
      return;
    }

    if (!paymentMethod) {
      showErrorToast('Please select a payment method');
      return;
    }

    // Receipt is now optional - no validation required

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showErrorToast('Please enter a valid payment amount');
      return;
    }

    // Payment reference is now optional - no validation required

    setPaymentProcessing(true);

    try {
      const currentOrder = orderDetails || order;
      
      // First, upload to external API if it's an image and we have a receipt file
      let externalReceiptUrl = null;
      let externalValidationPassed = false;
      
      if (receiptFile && receiptFile.type.startsWith('image/')) {
        try {
          const externalResult = await uploadImageToExternalAPI(receiptFile);
          if (externalResult?.success === true) {
            // External validation passed successfully
            externalReceiptUrl = externalResult.url || externalResult.data?.downloadUrl || externalResult.data?.url;
            externalValidationPassed = true;
          } else if (externalResult?.success === false) {
            // External validation failed - prevent payment completion
            showErrorToast('Payment receipt verification failed. Please check your receipt and try again.');
            return; // Stop payment processing
          }
        } catch (externalError) {
          // External upload failed, continuing with local upload
        }
      }
      
      const formData = new FormData();
      
      // Payment details
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentAmount', paymentAmount);
      formData.append('paymentReference', paymentReference || ''); // Optional reference
      formData.append('paymentNotes', paymentNotes);
      
      // Receipt file (optional)
      if (receiptFile) {
        formData.append('receipt', receiptFile);
        formData.append('receiptType', receiptFile.type.startsWith('image/') ? 'Image' : 'PDF');
        formData.append('receiptFileName', receiptFile.name);
        
        // Add external upload URL if available
        if (externalReceiptUrl) {
          formData.append('externalReceiptUrl', externalReceiptUrl);
        }
      }
      
      // Order details - only send orderId if it's a real order ID, not 'pending'
      if (currentOrder.id && currentOrder.id !== 'pending') {
        formData.append('orderId', currentOrder.id);
      }
      
      formData.append('orderData', JSON.stringify(currentOrder));

      const response = await createPayment(formData);
      
      if (response.success) {
        // Clear saved order data
        localStorage.removeItem('savedOrder');
        
        // Clear draft order if it was from a draft
        const isFromDraft = localStorage.getItem('fromDraft') === 'true' || 
                           currentOrder?.id?.startsWith('draft_') || 
                           currentOrder?.originalDraftId;
                           
        if (isFromDraft && currentOrder?.id && currentOrder?.userId) {
          const existingDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
          
          // Simple and aggressive approach: remove ALL drafts for this customer
          const updatedDrafts = existingDrafts.filter(draft => {
            const shouldKeep = draft.selectedUser?.id !== currentOrder.userId;
            return shouldKeep;
          });
          
          localStorage.setItem('draftOrders', JSON.stringify(updatedDrafts));
          localStorage.removeItem('fromDraft'); // Clear the flag
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('draftOrdersUpdated'));
        }
        
        // Navigate to Customer List Page with success state
        navigate('/jkhm/seller/customers', { 
          state: { 
            showOrderSuccess: true,
            timestamp: Date.now(), // Add timestamp to prevent showing on refresh
            orderDetails: currentOrder,
            successMessage: 'Order placed successfully! Payment confirmed.',
            paymentDetails: {
              method: paymentMethod,
              amount: paymentAmount,
              reference: paymentReference
            }
          } 
        });
      } else {
        showPaymentError(response.message || 'Payment submission failed');
      }
    } catch (error) {
      // Handle specific error types
      if (error.response?.status === 413) {
        showPaymentError('File size too large. Please upload a smaller receipt.');
      } else if (error.response?.status === 400) {
        showPaymentError('Invalid payment data. Please check your inputs.');
      } else if (error.response?.status === 500) {
        showPaymentError('Server error. Please try again later.');
      } else {
        showPaymentError('Payment submission failed. Please try again.');
      }
    } finally {
      setPaymentProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Select Payment Method</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Choose your preferred payment method</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Available Payment Methods</h3>
                <div className="grid grid-cols-1 gap-3">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <div key={method.id}>
                        <button
                          onClick={() => setPaymentMethod(method.id)}
                          className={`w-full p-2 sm:p-3 border-2 rounded-lg transition-all text-left min-h-[60px] sm:min-h-0 ${
                            paymentMethod === method.id
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              paymentMethod === method.id ? 'bg-blue-600' : 'bg-gray-600'
                            }`}>
                              <IconComponent className="text-white text-sm sm:text-lg" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-800 text-xs sm:text-sm break-words">{method.name}</h3>
                              <p className="text-xs text-slate-600 break-words">{method.description}</p>
                            </div>
                            {paymentMethod === method.id && (
                              <MdCheckCircle className="text-blue-600 text-sm sm:text-lg flex-shrink-0" />
                            )}
                          </div>
                        </button>
                        
                        {/* UPI Payment Details - Show below UPI button */}
                        {method.id === 'UPI' && paymentMethod === 'UPI' && (
                          <div className="mt-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                                <MdPhoneAndroid className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                                UPI Payment Details
                              </h4>
                              <button
                                onClick={() => setShowUpiId(!showUpiId)}
                                className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                              >
                                {showUpiId ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
                              </button>
                            </div>
                            
                            {/* Phone Number Section */}
                            <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 mb-3 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-gray-600 mb-1">Phone Number:</div>
                                  <div className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                                    {upiPhoneNumber}
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(upiPhoneNumber);
                                      // Phone number copied to clipboard
                                    } catch (error) {
                                      showErrorToast('Failed to copy phone number');
                                    }
                                  }}
                                  className="px-2 sm:px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-xs font-medium hover:bg-green-200 transition-all min-h-[44px] sm:min-h-0 flex items-center justify-center"
                                >
                                  <MdContentCopy className="w-3 h-3 inline mr-1" />
                                  Copy
                                </button>
                              </div>
                            </div>

                            {/* UPI ID Section - Optional */}
                            <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 mb-3 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-gray-600 mb-1">UPI ID (Optional):</div>
                                  <div className="font-mono text-sm sm:text-base font-semibold text-gray-900 break-words">
                                    {showUpiId ? upiId : '••••••••@••••••'}
                                  </div>
                                </div>
                                <button
                                  onClick={handleCopyUpiId}
                                  className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all min-h-[44px] sm:min-h-0 flex items-center justify-center ${
                                    upiIdCopied
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  }`}
                                >
                                  {upiIdCopied ? (
                                    <>
                                      <MdCheckCircle className="w-3 h-3 inline mr-1" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <MdContentCopy className="w-3 h-3 inline mr-1" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            {/* Instructions */}
                            <div className="text-xs text-gray-600 space-y-2">
                              <div className="font-medium text-gray-800 mb-2">Payment Instructions:</div>
                              <div className="flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5 font-bold flex-shrink-0">•</span>
                                <span className="break-words">Use any UPI app (Google Pay, PhonePe, Paytm, BHIM)</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5 font-bold flex-shrink-0">•</span>
                                <span className="break-words">Enter the exact amount: <span className="font-semibold text-gray-900">{formatPrice(orderDetails?.totalAmount || order?.totalPrice || 0)}</span></span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5 font-bold flex-shrink-0">•</span>
                                <span className="break-words">Use the phone number above to send payment (UPI ID is optional)</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-purple-600 mt-0.5 font-bold flex-shrink-0">•</span>
                                <span className="break-words">Complete the payment and upload the receipt below</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
              </div>

              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    {/* Order Information */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Order Details</h4>
                        {(orderDetails || order)?.id && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md font-medium">
                            Order #{orderDetails?.id || order?.id}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Customer Name:</span>
                          <span className="font-medium text-gray-900 break-words">{getCustomerName()}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Menu Package:</span>
                          <span className="font-medium text-gray-900 break-words">{orderDetails?.menuName || order?.menuName}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium text-gray-900 break-words">{formatDate(orderDetails?.orderDate || order?.orderDate)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Delivery Days:</span>
                          <span className="font-medium text-gray-900 break-words">
                                                    {`${orderDetails?.selectedDates?.length || order?.selectedDates?.length || 0} day(s)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-3">Payment Summary</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Order Amount:</span>
                          <span className="font-medium text-gray-900 break-words">{formatPrice(orderDetails?.totalAmount || order?.totalPrice || 0)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Delivery Fee:</span>
                          <span className="font-medium text-green-600">Free</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-gray-900 font-semibold">Total Amount:</span>
                            <span className="text-gray-900 text-sm sm:text-base font-bold">{formatPrice(orderDetails?.totalAmount || order?.totalPrice || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {(orderDetails?.deliveryAddress || order?.deliveryAddress) && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-2">Delivery Address</h4>
                        <div className="text-xs text-gray-600 break-words">
                          {orderDetails?.deliveryAddress?.housename && `${orderDetails.deliveryAddress.housename}, `}
                          {orderDetails?.deliveryAddress?.street || order?.deliveryAddress?.street}
                          <br />
                          {orderDetails?.deliveryAddress?.city || order?.deliveryAddress?.city}, 
                          {orderDetails?.deliveryAddress?.pincode || order?.deliveryAddress?.pincode}
                          <br />
                          {orderDetails?.deliveryAddress?.state || order?.deliveryAddress?.state}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

             case 2:
         return (
           <div className="space-y-3">
             <div className="text-center mb-4 sm:mb-6">
               <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                 {location.state?.goToReceiptUpload ? 'Upload Payment Receipt' : 'Confirm Payment'}
               </h2>
               <p className="text-gray-600 text-xs sm:text-sm">
                 {location.state?.goToReceiptUpload 
                   ? 'Upload your payment receipt to complete the order' 
                   : 'Upload proof of your payment and review order details'
                 }
               </p>
             </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column - Payment Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {location.state?.goToReceiptUpload ? 'Payment Receipt Upload' : 'Payment Receipt Upload '}
                </h3>
                
                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-all duration-200 ${
                    isDragOver 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-gray-100'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer block">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                        isDragOver ? 'bg-purple-200' : 'bg-purple-100'
                      }`}>
                        <MdFileUpload className={`text-lg sm:text-xl transition-colors ${
                          isDragOver ? 'text-purple-700' : 'text-purple-600'
                        }`} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
                        {location.state?.goToReceiptUpload ? 'Select Payment Receipt' : 'Upload Payment Receipt (Optional)'}
                      </h3>
                      <p className="text-gray-600 mb-1 text-xs">
                        {isDragOver ? 'Drop your file here' : location.state?.goToReceiptUpload ? 'Click here or drag and drop your receipt' : 'Click here or drag and drop your receipt (optional)'}
                      </p>
                      
                      <div className="bg-white rounded-md p-2 border border-gray-200 max-w-sm mx-auto">
                        <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs text-gray-600 mb-1">
                          <span className="flex items-center gap-1">
                            <span className="text-green-600">📷</span>
                            <span className="hidden sm:inline">JPG</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-blue-600">🖼️</span>
                            <span className="hidden sm:inline">PNG</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-red-600">📄</span>
                            <span className="hidden sm:inline">PDF</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Max: 5MB</p>
                      </div>
                      
                      <div className="mt-1">
                        <button
                          type="button"
                          className="px-3 py-1.5 sm:px-2 sm:py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-xs min-h-[44px] sm:min-h-0"
                        >
                          Choose File
                        </button>
                      </div>
                    </div>
                  </label>
                </div>
                
                {/* Receipt Preview */}
                {receiptFile && (
                  <div className="mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <h4 className="font-semibold text-gray-800 text-xs sm:text-sm">Receipt Preview:</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowReceiptModal(true)}
                          className="px-2 py-1.5 sm:py-1 bg-blue-100 text-blue-800 rounded-lg text-xs hover:bg-blue-200 transition-colors min-h-[44px] sm:min-h-0"
                        >
                          <MdVisibility className="w-3 h-3 inline mr-1" />
                          View Full
                        </button>
                        <button
                          onClick={() => {
                            setReceiptFile(null);
                            setReceiptPreview(null);
                            setExternalUploadUrl(null);
                            setExternalUploadError(null);
                          }}
                          className="px-2 py-1.5 sm:py-1 bg-red-100 text-red-800 rounded-lg text-xs hover:bg-red-200 transition-colors min-h-[44px] sm:min-h-0"
                        >
                          <MdDelete className="w-3 h-3 inline mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {receiptPreview ? (
                      <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
                        <img 
                          src={receiptPreview} 
                          alt="Receipt preview" 
                          className="max-w-full h-32 sm:h-48 object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 text-center">
                        <MdReceipt className="text-2xl sm:text-3xl text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium text-xs sm:text-sm break-words">{receiptFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-3 space-y-2">
                      {/* File selected status */}
                      <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-800">
                          <MdFileUpload className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="font-medium text-xs sm:text-sm">
                            {location.state?.goToReceiptUpload ? 'Receipt file selected' : 'Receipt file selected (optional)'}
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1 break-words">
                          File: {receiptFile.name} ({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {location.state?.goToReceiptUpload 
                            ? 'Click "Upload Receipt" button to upload the file'
                            : 'Will be uploaded when you complete payment'
                          }
                        </p>
                      </div>
                      
                      {/* External validation success */}
                      {externalUploadUrl && !externalUploadError && (
                        <div className="p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-green-800">
                            <MdCheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-medium text-xs sm:text-sm">Receipt Verification Passed</span>
                          </div>
                          <p className="text-xs text-green-700 mt-1">
                            Payment receipt has been verified successfully. You can proceed with payment.
                          </p>
                        </div>
                      )}
                      
                      {/* External validation error */}
                      {externalUploadError && (
                        <div className="p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 text-red-800">
                            <MdWarning className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-medium text-xs sm:text-sm">Receipt Verification Failed</span>
                          </div>
                          <p className="text-xs text-red-700 mt-1 break-words">
                            {externalUploadError}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Please check your receipt details and try again.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Method Summary */}
                {paymentMethod && (
                  <div className="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 text-xs sm:text-sm mb-2">Selected Payment Method</h4>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const method = paymentMethods.find(m => m.id === paymentMethod);
                        const IconComponent = method?.icon;
                        return (
                          <>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <IconComponent className="text-white text-xs sm:text-sm" />
                            </div>
                            <span className="text-blue-800 font-medium text-xs sm:text-sm break-words">{method?.name}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Order Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-4 border border-gray-200">
                  <div className="space-y-3">
                    {/* Order Information */}
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">Order Details</h4>
                        {(orderDetails || order)?.id && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md font-medium">
                            Order #{orderDetails?.id || order?.id}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Customer Name:</span>
                          <span className="font-medium text-gray-900 break-words">{getCustomerName()}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Menu Package:</span>
                          <span className="font-medium text-gray-900 break-words">{orderDetails?.menuName || order?.menuName}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium text-gray-900 break-words">{formatDate(orderDetails?.orderDate || order?.orderDate)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Delivery Days:</span>
                          <span className="font-medium text-gray-900 break-words">
                            {(() => {
                              const currentOrder = orderDetails || order;
                              const dates = currentOrder?.selectedDates || [];
                              return `${dates.length} day(s)`;
                            })()}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Delivery Period:</span>
                          <span className="font-medium text-gray-900 break-words">
                            {(() => {
                              const currentOrder = orderDetails || order;
                              const dates = currentOrder?.selectedDates || [];
                              return formatDateRange(dates);
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-3">Payment Summary</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Order Amount:</span>
                          <span className="font-medium text-gray-900 break-words">{formatPrice(orderDetails?.totalAmount || order?.totalPrice || 0)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-gray-600">Delivery Fee:</span>
                          <span className="font-medium text-green-600">Free</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-gray-900 font-semibold">Total Amount:</span>
                            <span className="text-gray-900 text-sm sm:text-base font-bold">{formatPrice(orderDetails?.totalAmount || order?.totalPrice || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {(orderDetails?.deliveryAddress || order?.deliveryAddress) && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 text-xs sm:text-sm mb-2">Delivery Address</h4>
                        <div className="text-xs text-gray-600 break-words">
                          {orderDetails?.deliveryAddress?.housename && `${orderDetails.deliveryAddress.housename}, `}
                          {orderDetails?.deliveryAddress?.street || order?.deliveryAddress?.street}
                          <br />
                          {orderDetails?.deliveryAddress?.city || order?.deliveryAddress?.city}, 
                          {orderDetails?.deliveryAddress?.pincode || order?.deliveryAddress?.pincode}
                          <br />
                          {orderDetails?.deliveryAddress?.state || order?.deliveryAddress?.state}
                        </div>
                      </div>
                    )}

                    {/* Complete Payment Button */}
                    <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                      <button
                        onClick={handlePaymentSubmit}
                        disabled={!canProceed() || paymentProcessing}
                        className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm text-xs sm:text-sm min-h-[44px] sm:min-h-0"
                      >
                        {paymentProcessing ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                            <span className="text-xs sm:text-sm">{location.state?.goToReceiptUpload ? 'Uploading Receipt...' : 'Processing Payment...'}</span>
                          </div>
                        ) : (
                          location.state?.goToReceiptUpload ? 'Upload Receipt' : 'Complete Payment'
                        )}
                      </button>
                      
                      <div className="text-xs text-slate-500 text-center pt-2">
                        {receiptFile ? 'Click to upload receipt and complete payment' : 'Payment receipt can be uploaded later'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );



      default:
        return null;
    }
  };

  if (!order && !location.state?.goToReceiptUpload) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MdWarning className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Order Found</h2>
          <p className="text-gray-600 mb-4">Please complete your booking first.</p>
          <button
            onClick={() => navigate('/jkhm/place-order')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Bookings
          </button>
        </div>
      </div>
    );
  }

  // Show loading state for receipt upload mode while fetching payment details
  if (location.state?.goToReceiptUpload && !order && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonWizardStep />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-3 py-4 pt-8">
                 {/* Professional Header */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
           <div className="px-3 sm:px-4 py-3 border-b border-gray-200">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <div className="min-w-0 flex-1">
                 <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Payment Processing</h1>
                 <p className="text-gray-600 mt-1 text-xs sm:text-sm">Complete your order payment securely</p>
               </div>
               <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-sm min-h-[44px] sm:min-h-0"
                >
                  <MdCancel className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cancel Order</span>
                  <span className="sm:hidden">Cancel</span>
                </button>
                <button
                  onClick={() => navigate('/jkhm/place-order')}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-sm min-h-[44px] sm:min-h-0"
                >
                  <MdEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Create New Order</span>
                  <span className="sm:hidden">New Order</span>
                </button>
              </div>
             </div>
           </div>
          
          {/* Professional Step Progress */}
          <div className="px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-200 ${
                      currentStep >= step.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {currentStep > step.id ? (
                        <MdCheckCircle className="text-xs sm:text-sm" />
                      ) : (
                        <step.icon className="text-xs sm:text-sm" />
                      )}
                    </div>
                    
                    <div className="ml-1 sm:ml-2 hidden md:block">
                      <div className={`text-xs font-medium transition-colors ${
                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Mobile Step Title */}
            <div className="mt-2 md:hidden">
              <div className={`text-xs font-medium text-center transition-colors ${
                currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {steps[currentStep - 1]?.title}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column - Wizard Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 sm:p-4">
                {renderStepContent()}
              </div>
              
              {/* Professional Navigation */}
              <div className="px-3 sm:px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`flex items-center justify-center px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none min-h-[44px] sm:min-h-0 ${
                        currentStep === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <MdArrowBack className="mr-1 text-sm sm:text-base" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>
                    
                    <div className="text-xs text-gray-500 px-2 sm:px-3 whitespace-nowrap">
                      Step {currentStep} of {steps.length}
                    </div>
                    
                    {currentStep < steps.length ? (
                      <button
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none min-h-[44px] sm:min-h-0 ${
                          !canProceed()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <MdArrowForward className="ml-1 text-sm sm:text-base" />
                      </button>
                    ) : (
                      <div className="text-xs text-gray-500 text-center w-full sm:w-auto">
                        Payment can be completed in the step above
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

                     {/* Right Column - Professional Summary */}
           <div className="lg:col-span-1">
             <div className="sticky top-4">
               <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                 <div className="px-3 py-2 border-b border-gray-200">
                   <h3 className="text-sm sm:text-base font-semibold text-gray-900">Payment Status</h3>
                 </div>
                 
                 {order && (
                   <div className="p-3 space-y-3">
                     <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
                       <div className="text-center">
                         <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                           <MdPayment className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                         </div>
                         <div className="text-xs sm:text-sm font-medium text-gray-900">Payment Method</div>
                         <div className="text-xs text-gray-600 mt-1 break-words">
                           {paymentMethods.find(m => m.id === paymentMethod)?.name || 'Not selected'}
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-green-50 rounded-lg p-2 sm:p-3 border border-green-200">
                       <div className="text-center">
                         <div className="text-xs sm:text-sm font-medium text-green-800">Order Total</div>
                         <div className="text-base sm:text-lg font-bold text-green-700">₹{order.totalPrice || 0}</div>
                       </div>
                     </div>
                     
                     {receiptFile && (
                       <div className="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-200">
                         <div className="text-center">
                           <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                           <MdCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                           </div>
                           <div className="text-xs sm:text-sm font-medium text-blue-800">Receipt Uploaded</div>
                           <div className="text-xs text-blue-600 mt-1 break-words">{receiptFile.name}</div>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>
      
      {/* Receipt Preview Modal */}
      <Modal
        title="Payment Receipt Preview"
        open={showReceiptModal}
        onCancel={() => setShowReceiptModal(false)}
        footer={[
          <button
            key="close"
            onClick={() => setShowReceiptModal(false)}
            className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0"
          >
            Close
          </button>
        ]}
        width={isMobile ? '95%' : 800}
      >
        {receiptPreview ? (
          <div className="text-center">
            <img
              src={receiptPreview}
              alt="Payment Receipt"
              className="max-w-full h-auto rounded-lg shadow-lg max-h-96 sm:max-h-none"
            />
            <div className="mt-4 text-xs sm:text-sm text-gray-600">
              <p><strong>File:</strong> <span className="break-words">{receiptFile?.name}</span></p>
              <p><strong>Size:</strong> {(receiptFile?.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> <span className="break-words">{receiptFile?.type}</span></p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <MdReceipt className="text-4xl sm:text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">No receipt preview available</p>
          </div>
        )}
      </Modal>

      {/* Address Edit Modal */}
      <Modal
        title={editingAddress ? "Edit Address" : "Add New Address"}
        open={showAddressModal}
        onCancel={handleCloseAddressModal}
        footer={[
          <button
            key="cancel"
            onClick={handleCloseAddressModal}
            className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0"
          >
            Cancel
          </button>,
          <button
            key="save"
            onClick={handleSaveAddress}
            className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm min-h-[44px] sm:min-h-0"
          >
            Save Address
          </button>
        ]}
        width={isMobile ? '95%' : 600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Address Name *
            </label>
            <input
              type="text"
              value={addressForm.name}
              onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="e.g., Home, Office, etc."
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Full Address *
            </label>
            <textarea
              value={addressForm.address}
              onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={3}
              placeholder="Enter complete address with landmarks"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="City"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Pincode *
              </label>
              <input
                type="text"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Pincode"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              value={addressForm.state}
              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="State"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Contact Number *
            </label>
            <input
              type="tel"
              value={addressForm.contactNumber}
              onChange={(e) => setAddressForm({ ...addressForm, contactNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Contact number"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="ml-2 text-xs sm:text-sm text-gray-700">
              Set as default address
            </label>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        title="Cancel Order"
        open={showCancelModal}
        onOk={() => {
          // Clear saved order data
          localStorage.removeItem('savedOrder');
          localStorage.removeItem('fromDraft');
          
          // Clear any draft orders for the current user
          const existingDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
          const currentOrder = orderDetails || order;
          if (currentOrder?.userId) {
            const updatedDrafts = existingDrafts.filter(draft => 
              draft.selectedUser?.id !== currentOrder.userId
            );
            localStorage.setItem('draftOrders', JSON.stringify(updatedDrafts));
          }
          
          // Navigate to customers list
          navigate('/jkhm/seller/customers');
        }}
        onCancel={() => setShowCancelModal(false)}
        okText="Yes, Cancel Order"
        cancelText="Keep Order"
        okType="danger"
        width={isMobile ? '95%' : 400}
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdWarning className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Cancel Order?</h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            Are you sure you want to cancel this order? This action cannot be undone and all order data will be lost.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentWizardPage;
