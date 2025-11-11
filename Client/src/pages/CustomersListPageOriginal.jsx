import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast 
} from '../utils/toastConfig.jsx';
import { 
  MdPeople, 
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdAdd,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdCalendarToday,
  MdShoppingCart,
  MdAttachMoney,
  MdPerson,
  MdArrowBack,
  MdFilterAlt,
  MdClear,
  MdDashboard,
  MdReceipt
} from 'react-icons/md';
import { useSeller } from '../hooks/sellerHooks/useSeller';
import useAuthStore from '../stores/Zustand.store';
import axiosInstance from '../api/axios';

const CustomersListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles } = useAuthStore();
  const { sellerUsers, loading: sellerUsersLoading, getSellerUsers } = useSeller();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    recentlyAdded: false,
    pendingPayments: false,
    phoneNumber: '',
    location: '',
    name: ''
  });
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
     const [deletingUsers, setDeletingUsers] = useState(new Set());
   const [editingUsers, setEditingUsers] = useState(new Set());
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [userToDelete, setUserToDelete] = useState(null);
   const [draftOrders, setDraftOrders] = useState([]);
   const successMessageShown = useRef(false);

  // Fetch seller users on component mount
  useEffect(() => {
    if (user && roles?.includes('SELLER')) {
      getSellerUsers();
    }
  }, [user, roles]); // Removed getSellerUsers from dependency array to prevent infinite loops

  // Refresh customer data when coming back from payment page
  useEffect(() => {
    if (location.state?.receiptUploaded) {
      // Refresh customer data to reflect the uploaded receipt
      getSellerUsers();
      
      // Show success message only once
      if (location.state?.message && !successMessageShown.current) {
        showSuccessToast(location.state.message);
        successMessageShown.current = true;
        
        // Reset the flag after 5 seconds to allow future success messages
        setTimeout(() => {
          successMessageShown.current = false;
        }, 5000);
      }
      
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.receiptUploaded]);

  // Show success message if coming from successful order
  useEffect(() => {
    if (location.state?.showOrderSuccess && !successMessageShown.current) {
      // Only show success message once, not on page refresh
      if (location.state?.timestamp && Date.now() - location.state.timestamp < 10000) {
        showSuccessToast(location.state.successMessage || 'Order completed successfully!');
        successMessageShown.current = true;
        
        // Reset the flag after 10 seconds to allow future success messages
        setTimeout(() => {
          successMessageShown.current = false;
        }, 10000);
      }
      
      // Refresh draft orders list to remove completed draft
      const loadDraftOrders = () => {
        const savedDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
        setDraftOrders(savedDrafts);
      };
      loadDraftOrders();
      
      // Clear the success state to prevent showing again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // Load draft orders from localStorage
  useEffect(() => {
    const loadDraftOrders = () => {
      const savedDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
      
      // Clean up any invalid drafts
      const validDrafts = savedDrafts.filter(draft => {
        return draft.selectedUser && draft.selectedMenu && draft.selectedDates;
      });
      
      if (validDrafts.length !== savedDrafts.length) {
        localStorage.setItem('draftOrders', JSON.stringify(validDrafts));
      }
      
      setDraftOrders(validDrafts);
    };
    
    loadDraftOrders();
    
    // Listen for storage changes to update the list
    const handleStorageChange = (e) => {
      if (e.key === 'draftOrders') {
        loadDraftOrders();
      }
    };
    
    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadDraftOrders();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('draftOrdersUpdated', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('draftOrdersUpdated', handleCustomStorageChange);
    };
  }, []);

     const handleEditUser = (user) => {
     setEditingUsers(prev => new Set(prev).add(user.id));
     // Navigate to edit page
     navigate('/jkhm/edit-customer', { 
       state: { 
         editUser: user 
       } 
     });
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
        showSuccessToast('Customer deleted successfully');
        getSellerUsers();
        if (selectedCustomer?.id === userToDelete.id) {
          setSelectedCustomer(null);
        }
      } else {
        showErrorToast(response.data.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      showErrorToast('Failed to delete customer');
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

  const handleResumeOrder = (draftOrder) => {
    try {
      // Prepare the data properly for PaymentWizardPage
      const orderId = draftOrder.id || `draft_${Date.now()}`;
      
      // Transform selectedDates to orderTimes (required by payment service)
      const orderTimes = [];
      if (draftOrder.selectedMenu?.hasBreakfast) orderTimes.push('Breakfast');
      if (draftOrder.selectedMenu?.hasLunch) orderTimes.push('Lunch');
      if (draftOrder.selectedMenu?.hasDinner) orderTimes.push('Dinner');
      
      // Create orderItems from selectedMenu
      const orderItems = [];
      if (draftOrder.selectedMenu?.menuItem) {
        if (draftOrder.selectedMenu.hasBreakfast) {
          orderItems.push({
            menuItemId: draftOrder.selectedMenu.menuItem.id,
            quantity: draftOrder.selectedDates?.length || 1,
            mealType: 'breakfast'
          });
        }
        if (draftOrder.selectedMenu.hasLunch) {
          orderItems.push({
            menuItemId: draftOrder.selectedMenu.menuItem.id,
            quantity: draftOrder.selectedDates?.length || 1,
            mealType: 'lunch'
          });
        }
        if (draftOrder.selectedMenu.hasDinner) {
          orderItems.push({
            menuItemId: draftOrder.selectedMenu.menuItem.id,
            quantity: draftOrder.selectedDates?.length || 1,
            mealType: 'dinner'
          });
        }
      }
      
      // Get delivery address ID from the user's addresses
      const deliveryAddressId = draftOrder.selectedUser?.addresses?.[0]?.id || null;
      
      const orderDataForPayment = {
        ...draftOrder,
        // Ensure we have a proper orderId for payment processing
        id: orderId,
        orderId: orderId, // Add orderId field for payment controller
        // Store original draft ID for removal
        originalDraftId: draftOrder.id,
        // Transform data to match payment service expectations
        orderTimes: orderTimes,
        orderItems: orderItems,
        deliveryAddressId: deliveryAddressId,
        // Ensure selectedDates are date strings
        selectedDates: draftOrder.selectedDates ? 
          draftOrder.selectedDates.map(date => 
            typeof date === 'string' ? date : date.toISOString().split('T')[0]
          ) : [],
        // Ensure we have all required fields for PaymentWizardPage
        orderDate: draftOrder.selectedDates?.[0] ? 
          (typeof draftOrder.selectedDates[0] === 'string' ? 
            draftOrder.selectedDates[0] : 
            draftOrder.selectedDates[0].toISOString().split('T')[0]
          ) : new Date().toISOString().split('T')[0],
        totalPrice: draftOrder.selectedMenu?.price || 0,
        totalAmount: draftOrder.selectedMenu?.price || 0, // PaymentWizardPage uses both totalPrice and totalAmount
        customerName: draftOrder.customerName || `${draftOrder.selectedUser?.contacts?.[0]?.firstName || ''}`.trim(),
        menuName: draftOrder.selectedMenu?.name || 'Unknown Menu',
        // Include user ID for order creation
        userId: draftOrder.selectedUser?.id,
        // Prepare delivery address properly
        deliveryAddress: draftOrder.deliveryAddress || 
          (draftOrder.selectedUser?.addresses?.[0] ? {
            housename: draftOrder.selectedUser.addresses[0].housename || '',
            street: draftOrder.selectedUser.addresses[0].street || '',
            city: draftOrder.selectedUser.addresses[0].city || '',
            pincode: draftOrder.selectedUser.addresses[0].pincode || '',
            state: draftOrder.selectedUser.addresses[0].state || '',
            landmark: draftOrder.selectedUser.addresses[0].landmark || ''
          } : {}),
        deliveryLocationNames: draftOrder.deliveryLocationNames || [],
        // Add deliveryLocations for delivery items creation
        deliveryLocations: draftOrder.deliveryLocations || {},
        // Add skipMeals for delivery items creation
        skipMeals: draftOrder.skipMeals || {}
      };


      // Save the prepared data
      localStorage.setItem('savedOrder', JSON.stringify(orderDataForPayment));
      localStorage.setItem('fromDraft', 'true');
      
      // Navigate immediately
      navigate('/jkhm/process-payment');
      
    } catch (error) {
      console.error('❌ Error in handleResumeOrder:', error);
      showErrorToast('Failed to resume order. Please try again.');
    }
  };

  const handleDeleteDraft = (draftId) => {
    const updatedDrafts = draftOrders.filter(draft => draft.id !== draftId);
    setDraftOrders(updatedDrafts);
    localStorage.setItem('draftOrders', JSON.stringify(updatedDrafts));
    showSuccessToast('Draft order deleted successfully!');
  };

  // Manual cleanup function for completed drafts
  const cleanupCompletedDrafts = () => {
    const existingDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
    
    // Remove any drafts that might be orphaned or completed
    const cleanedDrafts = existingDrafts.filter(draft => {
      // Keep drafts that have valid data
      return draft.selectedUser && draft.selectedMenu && draft.selectedDates;
    });
    
    if (cleanedDrafts.length !== existingDrafts.length) {
      localStorage.setItem('draftOrders', JSON.stringify(cleanedDrafts));
      setDraftOrders(cleanedDrafts);
      showSuccessToast(`Cleaned up ${existingDrafts.length - cleanedDrafts.length} completed drafts`);
    }
  };

  // Force remove draft for specific customer
  const forceRemoveDraftForCustomer = (customerId) => {
    const existingDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
    const updatedDrafts = existingDrafts.filter(draft => draft.selectedUser?.id !== customerId);
    
    if (updatedDrafts.length < existingDrafts.length) {
      localStorage.setItem('draftOrders', JSON.stringify(updatedDrafts));
      setDraftOrders(updatedDrafts);
      showSuccessToast('Draft order removed for this customer');
    }
  };

  const formatDraftDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get draft order for a specific customer
  const getDraftForCustomer = (customerId) => {
    const draft = draftOrders.find(draft => draft.selectedUser?.id === customerId);
    return draft;
  };

  const clearFilters = () => {
    setFilters({
      recentlyAdded: false,
      pendingPayments: false,
      phoneNumber: '',
      location: '',
      name: ''
    });
    setSearchTerm('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price || 0);
  };

  // Check if customer has pending payments (orders without receipts)
  const hasPendingPayments = (customer) => {
    if (!customer.orders || customer.orders.length === 0) {
      return false;
    }
    
    // Check if any order has payments without receipts
    const hasPending = customer.orders.some(order => {
      return order.payments && order.payments.some(payment => 
        payment.paymentStatus === 'Pending' && (!payment.receiptUrl || payment.receiptUrl === '')
      );
    });
    
    return hasPending;
  };

  // Get pending payment for upload receipt
  const getPendingPayment = (customer) => {
    if (!customer.orders || customer.orders.length === 0) {
      return null;
    }
    
    for (const order of customer.orders) {
      if (order.payments) {
        const pendingPayment = order.payments.find(payment => 
          payment.paymentStatus === 'Pending' && (!payment.receiptUrl || payment.receiptUrl === '')
        );
        if (pendingPayment) {
          return pendingPayment;
        }
      }
    }
    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

     // Filter and sort customers
   const filteredCustomers = sellerUsers.filter(customer => {
     try {
       const contact = customer.contacts?.[0];
       if (!contact) return false;

         // Search term filter
     if (searchTerm) {
       const searchLower = searchTerm.toLowerCase();
       const fullName = `${contact.firstName || ''}`.trim().toLowerCase();
       const matchesSearch = 
         fullName.includes(searchLower) ||
         contact.phoneNumbers?.[0]?.number?.includes(searchTerm) ||
         customer.auth?.email?.toLowerCase().includes(searchLower) ||
         // Location search - check addresses with proper null checks
         (customer.addresses && Array.isArray(customer.addresses) && 
          customer.addresses.some(address => 
            address && 
            (address.city?.toLowerCase().includes(searchLower) ||
             address.street?.toLowerCase().includes(searchLower) ||
             address.pincode?.includes(searchTerm))
          )
         );
       
       if (!matchesSearch) return false;
     }

    // Phone number filter
    if (filters.phoneNumber && !contact.phoneNumbers?.[0]?.number?.includes(filters.phoneNumber)) {
      return false;
    }

    // Name filter
    if (filters.name) {
      const fullName = `${contact.firstName || ''}`.trim().toLowerCase();
      if (!fullName.includes(filters.name.toLowerCase())) {
        return false;
      }
    }

         // Location filter (check addresses)
     if (filters.location) {
       const hasMatchingAddress = customer.addresses && 
         Array.isArray(customer.addresses) && 
         customer.addresses.some(address => 
           address && 
           (address.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
            address.street?.toLowerCase().includes(filters.location.toLowerCase()))
         );
       if (!hasMatchingAddress) return false;
     }

    // Recently added filter (last 30 days)
    if (filters.recentlyAdded) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(customer.createdAt) < thirtyDaysAgo) {
        return false;
      }
    }

    // Pending payments filter (customers with upload receipt needed)
    if (filters.pendingPayments) {
      if (!hasPendingPayments(customer)) {
        return false;
      }
    }

           return true;
     } catch (error) {
       console.error('Error filtering customer:', customer?.id, error);
       return false; // Skip this customer if there's an error
     }
   });

     // First filter by draft orders or pending payments if selected
     let customersToSort = [...filteredCustomers];
     if (sortBy === 'hasDraft') {
       customersToSort = filteredCustomers.filter(customer => {
         const customerDraft = getDraftForCustomer(customer.id);
         return !!customerDraft;
       });
     } else if (sortBy === 'pendingPayments') {
       customersToSort = filteredCustomers.filter(customer => {
         return hasPendingPayments(customer);
       });
     }

     const sortedCustomers = customersToSort.sort((a, b) => {
     try {
       const contactA = a.contacts?.[0];
       const contactB = b.contacts?.[0];

    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case 'name':
        const nameA = `${contactA?.firstName || ''}`.trim().toLowerCase();
        const nameB = `${contactB?.firstName || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      case 'orders':
        const ordersA = a.orders?.length || 0;
        const ordersB = b.orders?.length || 0;
        return ordersB - ordersA;
      case 'revenue':
        const revenueA = a.orders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) || 0;
        const revenueB = b.orders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) || 0;
        return revenueB - revenueA;
      case 'hasDraft':
        // When filtering by drafts, sort by most recent
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case 'pendingPayments':
        // When filtering by pending payments, sort by most recent
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
               default:
           return 0;
       }
     } catch (error) {
       console.error('Error sorting customers:', error);
       return 0; // Default sort order if there's an error
     }
   });

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!roles?.includes('SELLER')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <MdPerson className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the customers list.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
             {/* Header */}
       <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 mt-2">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-4 gap-3">
             <div className="flex items-center gap-3">
               <button
                 onClick={() => navigate('/jkhm/seller')}
                 className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                 title="Go to Seller Dashboard"
               >
                 <MdArrowBack className="w-5 h-5" />
               </button>
               <div>
                 <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers List</h1>
                 <p className="text-sm text-gray-600">Manage and filter your customer database</p>
               </div>
             </div>
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
               <button
                 onClick={() => navigate('/jkhm/seller')}
                 className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-sm"
               >
                 <MdDashboard className="w-4 h-4" />
                 <span className="hidden sm:inline">Dashboard</span>
               </button>
               <button
                 onClick={() => getSellerUsers()}
                 className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
               >
                 <MdRefresh className="w-4 h-4" />
                 <span className="hidden sm:inline">Refresh</span>
               </button>
               <button
                 onClick={() => navigate('/jkhm/create-user')}
                 className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
               >
                 <MdAdd className="w-4 h-4" />
                 <span className="hidden sm:inline">Add Customer</span>
               </button>
             </div>
           </div>
         </div>
       </div>

             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
         {/* Search and Filters */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
                     <div className="flex flex-col gap-3">
             {/* Search Bar */}
             <div className="relative">
               <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input
                 type="text"
                 placeholder="Search by name, phone, email, or location..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
               />
             </div>

             {/* Filter Toggle and Sort */}
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    showFilters 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MdFilterAlt className="w-4 h-4" />
                  Filters
                  {Object.values(filters).some(Boolean) && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {Object.values(filters).filter(Boolean).length}
                    </span>
                  )}
                </button>
                
                {(Object.values(filters).some(Boolean) || searchTerm) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MdClear className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="recent">Recently Added</option>
                <option value="pendingPayments">Payment Receipt Upload</option>
                <option value="hasDraft">Has Draft Orders</option>
                <option value="name">Alphabetical</option>
                <option value="orders">Order Volume</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Filter by phone..."
                    value={filters.phoneNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={filters.name}
                    onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="Filter by city/street..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.recentlyAdded}
                      onChange={(e) => setFilters(prev => ({ ...prev, recentlyAdded: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Show only customers added in the last 30 days</span>
                  </label>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.pendingPayments}
                      onChange={(e) => setFilters(prev => ({ ...prev, pendingPayments: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MdReceipt className="w-4 h-4 text-orange-600" />
                      Show only customers with pending payment receipts
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Results Summary */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-gray-600">
              {sortBy === 'hasDraft' ? (
                <>
                  Showing <span className="font-semibold">{sortedCustomers.length}</span> customers with draft orders
                </>
              ) : sortBy === 'pendingPayments' ? (
                <>
                  Showing <span className="font-semibold">{sortedCustomers.length}</span> customers with pending payment receipts
                </>
              ) : filters.pendingPayments ? (
                <>
                  Showing <span className="font-semibold">{filteredCustomers.length}</span> customers with pending payment receipts
                </>
              ) : (
                <>
                  Showing <span className="font-semibold">{filteredCustomers.length}</span> of{' '}
                  <span className="font-semibold">{sellerUsers.length}</span> customers
                </>
              )}
            </p>
            {sortBy === 'hasDraft' && sortedCustomers.length === 0 && (
              <p className="text-sm text-orange-600 font-medium">
                No customers with draft orders found
              </p>
            )}
            {sortBy === 'pendingPayments' && sortedCustomers.length === 0 && (
              <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
                <MdReceipt className="w-4 h-4" />
                No customers with pending payment receipts found
              </p>
            )}
            {filters.pendingPayments && filteredCustomers.length === 0 && (
              <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
                <MdReceipt className="w-4 h-4" />
                No customers with pending payment receipts found
              </p>
            )}
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {sellerUsersLoading ? (
            <div className="p-8 text-center bg-blue-50">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-700 font-medium text-lg">Loading customers...</p>
              <p className="text-blue-500 text-sm mt-2">Please wait while we fetch your customer data</p>
            </div>
          ) : !sellerUsers || sellerUsers.length === 0 ? (
            <div className="p-8 text-center">
              <MdPeople className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No customers found</p>
              <p className="text-sm text-gray-400 mt-2">Start by adding your first customer</p>
              <button
                onClick={() => navigate('/jkhm/create-user')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Customer
              </button>
            </div>
          ) : sortedCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <MdPeople className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No customers found matching your criteria</p>
              {Object.values(filters).some(Boolean) && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear filters to see all customers
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="col-span-3">Customer Details</div>
                  <div className="col-span-2">Contact Info</div>
                  <div className="col-span-3">Location</div>
                  <div className="col-span-2">Orders & Revenue</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {sortedCustomers.map((customer) => {
                  const customerDraft = getDraftForCustomer(customer.id);
                  return (
                  <div
                    key={customer.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      selectedCustomer?.id === customer.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    } ${customerDraft ? 'bg-orange-50 border-l-4 border-orange-400' : ''}`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Customer Details Column */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-lg">
                            {customer.contacts?.[0]?.firstName?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs">
                                <MdPhone className="w-3.5 h-3.5 text-blue-600" />
                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md truncate">
                                  {customer.contacts?.[0]?.phoneNumbers?.[0]?.number || 'No phone'}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-gray-900 truncate">
                                {customer.contacts?.[0]?.firstName}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full w-fit">
                                  ID: {customer.id.slice(-6)}
                                </span>
                                {customerDraft && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                    Draft Available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info Column */}
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <MdEmail className="w-3.5 h-3.5 text-gray-500" />
                            <span className="font-medium truncate">
                              {customer.auth?.email || 'No email'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <MdCalendarToday className="w-3.5 h-3.5 text-gray-500" />
                            <span className="font-medium">
                              {formatDate(customer.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Location Column */}
                      <div className="col-span-3">
                        {customer.addresses && customer.addresses.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                              <MdLocationOn className="w-3.5 h-3.5 text-gray-500" />
                              <span className="font-medium">
                                {customer.addresses.length} address{customer.addresses.length !== 1 ? 'es' : ''}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                              <div className="font-medium text-gray-700">{customer.addresses[0].city}</div>
                              <div className="text-gray-500 truncate">
                                {customer.addresses[0].street}, {customer.addresses[0].pincode}
                              </div>
                            </div>
                            {customer.addresses.length > 1 && (
                              <div className="text-xs text-blue-600 font-medium">
                                +{customer.addresses.length - 1} more location{customer.addresses.length > 2 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">No addresses</div>
                        )}
                      </div>

                      {/* Orders & Revenue Column */}
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <MdShoppingCart className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-700">
                              {customer.orders?.length || 0} orders
                            </span>
                          </div>
                          {customer.orders && customer.orders.length > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              <MdAttachMoney className="w-4 h-4 text-green-500" />
                              <span className="font-bold text-green-600">
                                {formatPrice(customer.orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Column */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5">
                          {/* Show appropriate button based on customer status */}
                          {customerDraft ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleResumeOrder(customerDraft);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                              title="Resume Draft Order"
                            >
                              Resume Order
                            </button>
                          ) : hasPendingPayments(customer) ? (
                            <button
                              onClick={() => {
                                const pendingPayment = getPendingPayment(customer);
                                if (pendingPayment) {
                                  // Navigate to PaymentWizardPage with receipt upload step
                                  navigate('/jkhm/process-payment', {
                                    state: {
                                      paymentId: pendingPayment.id,
                                      goToReceiptUpload: true,
                                      customer: customer
                                    }
                                  });
                                }
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              title="Upload Payment Receipt"
                            >
                              Upload Receipt
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate('/jkhm/place-order', { 
                                state: { 
                                  selectedUser: customer,
                                  skipToMenuSelection: true
                                } 
                              })}
                              className="px-2.5 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                              title="Book Order"
                            >
                              Book Order
                            </button>
                          )}
                          
                          <button
                            onClick={() => navigate('/jkhm/delivery-items', { 
                              state: { 
                                customer: customer
                              } 
                            })}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 hover:border-gray-300"
                            title="View Orders"
                          >
                            <MdVisibility className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEditUser(customer)}
                            disabled={editingUsers.has(customer.id)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 hover:border-blue-300 disabled:opacity-50"
                            title="Edit Customer"
                          >
                            {editingUsers.has(customer.id) ? (
                              <div className="animate-spin rounded-full w-4 h-4 border-2 border-blue-600 border-t-transparent"></div>
                            ) : (
                              <MdEdit className="w-4 h-4" />
                            )}
                          </button>
                          
                          {/* Delete button - disabled for customers with orders */}
                          <button
                            onClick={() => handleDeleteUser(customer)}
                            disabled={deletingUsers.has(customer.id) || (customer.orders && customer.orders.length > 0)}
                            className={`p-1.5 rounded-md transition-colors border ${
                              (customer.orders && customer.orders.length > 0) || deletingUsers.has(customer.id)
                                ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800 hover:bg-red-100 border-red-200 hover:border-red-300'
                            }`}
                            title={
                              customer.orders && customer.orders.length > 0
                                ? "Cannot delete customer with orders"
                                : "Delete Customer"
                            }
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Customer</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {userToDelete?.contacts?.[0]?.firstName}
              </span>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDeleteUser}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deletingUsers.has(userToDelete?.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingUsers.has(userToDelete?.id) ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersListPage;
