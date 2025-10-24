import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast 
} from '../utils/toastConfig.jsx';

/**
 * CustomersListPage - Customer management page with advanced filtering and search
 * Handles customer listing, search, filtering, and management operations
 * Features: Advanced search, filtering, pagination, bulk operations, customer analytics
 */
import { 
  MdPerson,
  MdArrowBack,
  MdRefresh,
  MdAdd,
  MdDashboard,
  MdLocalShipping
} from 'react-icons/md';
import { useSeller } from '../hooks/sellerHooks/useSeller';
import useAuthStore from '../stores/Zustand.store';
import axiosInstance from '../api/axios';
import { isDeliveryManager } from '../utils/roleUtils';
import { getValidDrafts, cleanExpiredDrafts } from '../utils/draftOrderUtils';

// Import optimized components
import CustomerFilters from '../components/customers/CustomerFilters';
import CustomerTable from '../components/customers/CustomerTable';
import ResultsSummary from '../components/customers/ResultsSummary';
import DeleteModal from '../components/customers/DeleteModal';
import Pagination from '../components/Pagination';
import { SkeletonTable, SkeletonFilters, SkeletonHeader, SkeletonPagination, SkeletonCustomerCard, SkeletonDashboard } from '../components/Skeleton';

const CustomersListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles } = useAuthStore();
  const { sellerUsers, loading: sellerUsersLoading, getSellerUsers } = useSeller();

  // State management - optimized with fewer state variables
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
  const [generatingLinks, setGeneratingLinks] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [draftOrders, setDraftOrders] = useState([]);
  const successMessageShown = useRef(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Memoized utility functions
  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price || 0);
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Memoized business logic functions
  const hasPendingPayments = useCallback((customer) => {
    if (!customer.orders || customer.orders.length === 0) {
      return false;
    }
    
    return customer.orders.some(order => {
      return order.payments && order.payments.some(payment => 
        payment.paymentStatus === 'Pending' && (!payment.receiptUrl || payment.receiptUrl === '')
      );
    });
  }, []);

  const getPendingPayment = useCallback((customer) => {
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
  }, []);

  const getDraftForCustomer = useCallback((customerId) => {
    return draftOrders.find(draft => draft.selectedUser?.id === customerId);
  }, [draftOrders]);

  // Memoized filtered customers - major performance optimization
  const filteredCustomers = useMemo(() => {
    if (!sellerUsers || sellerUsers.length === 0) return [];
    
    return sellerUsers.filter(customer => {
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

        // Location filter
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

        // Recently added filter
        if (filters.recentlyAdded) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (new Date(customer.createdAt) < thirtyDaysAgo) {
            return false;
          }
        }

        // Pending payments filter
        if (filters.pendingPayments) {
          if (!hasPendingPayments(customer)) {
            return false;
          }
        }

        return true;
      } catch (error) {
        // Silent fallback - exclude customer from results
        return false;
      }
    });
  }, [sellerUsers, searchTerm, filters, hasPendingPayments]);

  // Memoized sorted customers
  const sortedCustomers = useMemo(() => {
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

    return customersToSort.sort((a, b) => {
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
          case 'pendingPayments':
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          default:
            return 0;
        }
      } catch (error) {
        // Silent fallback - return original order
        return 0;
      }
    });
  }, [filteredCustomers, sortBy, getDraftForCustomer, hasPendingPayments]);

  // Pagination calculations
  const totalItems = sortedCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = sortedCustomers.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy]);

  // Memoized callbacks for event handlers
  const handleEditUser = useCallback((user) => {
    setEditingUsers(prev => new Set(prev).add(user.id));
    navigate('/jkhm/edit-customer', { 
      state: { editUser: user } 
    });
  }, [navigate]);

  const handleDeleteUser = useCallback((user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
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
  }, [userToDelete, selectedCustomer]); // Removed getSellerUsers from dependency array

  const cancelDeleteUser = useCallback(() => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  }, []);

  const handleGenerateLink = useCallback(async (userId) => {
    setGeneratingLinks(prev => new Set(prev).add(userId));
    try {
      const response = await axiosInstance.post(`/seller/users/${userId}/generate-link`);
      if (response.data.success) {
        showSuccessToast('Customer portal link generated successfully!');
        return response.data.data;
      } else {
        showErrorToast(response.data.message || 'Failed to generate customer link');
      }
    } catch (error) {
      showErrorToast('Failed to generate customer link');
      console.error('Error generating customer link:', error);
    } finally {
      setGeneratingLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }, []);

  const handleResumeOrder = useCallback((draftOrder, action = 'payment') => {
    try {
      if (action === 'edit') {
        // Navigate to booking wizard to edit the draft order
        navigate('/jkhm/place-order', {
          state: {
            draftOrder: draftOrder,
            resumeDraft: true,
            editMode: true
          }
        });
        return;
      }

      // Default action: proceed to payment
      const orderId = draftOrder.id || `draft_${Date.now()}`;
      
      const orderTimes = [];
      if (draftOrder.selectedMenu?.hasBreakfast) orderTimes.push('Breakfast');
      if (draftOrder.selectedMenu?.hasLunch) orderTimes.push('Lunch');
      if (draftOrder.selectedMenu?.hasDinner) orderTimes.push('Dinner');
      
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
      
      const deliveryAddressId = draftOrder.selectedUser?.addresses?.[0]?.id || null;
      
      const orderDataForPayment = {
        ...draftOrder,
        id: orderId,
        orderId: orderId,
        originalDraftId: draftOrder.id,
        orderTimes: orderTimes,
        orderItems: orderItems,
        deliveryAddressId: deliveryAddressId,
        selectedDates: draftOrder.selectedDates ? 
          draftOrder.selectedDates.map(date => 
            typeof date === 'string' ? date : date.toISOString().split('T')[0]
          ) : [],
        orderDate: draftOrder.selectedDates?.[0] ? 
          (typeof draftOrder.selectedDates[0] === 'string' ? 
            draftOrder.selectedDates[0] : 
            draftOrder.selectedDates[0].toISOString().split('T')[0]
          ) : new Date().toISOString().split('T')[0],
        totalPrice: draftOrder.selectedMenu?.price || 0,
        totalAmount: draftOrder.selectedMenu?.price || 0,
        customerName: draftOrder.customerName || `${draftOrder.selectedUser?.contacts?.[0]?.firstName || ''}`.trim(),
        menuName: draftOrder.selectedMenu?.name || 'Unknown Menu',
        userId: draftOrder.selectedUser?.id,
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
        deliveryLocations: draftOrder.deliveryLocations || {},
        skipMeals: draftOrder.skipMeals || {}
      };

      localStorage.setItem('savedOrder', JSON.stringify(orderDataForPayment));
      localStorage.setItem('fromDraft', 'true');
      
      navigate('/jkhm/process-payment');
      
    } catch (error) {
      showErrorToast('Failed to resume order. Please try again.');
    }
  }, [navigate]);

  const handleDeleteDraft = useCallback((draftId) => {
    // Clean expired drafts first, then remove the specific draft
    cleanExpiredDrafts();
    
    const updatedDrafts = draftOrders.filter(draft => draft.id !== draftId);
    setDraftOrders(updatedDrafts);
    localStorage.setItem('draftOrders', JSON.stringify(updatedDrafts));
    showSuccessToast('Draft order deleted successfully!');
  }, [draftOrders]);

  const clearFilters = useCallback(() => {
    setFilters({
      recentlyAdded: false,
      pendingPayments: false,
      phoneNumber: '',
      location: '',
      name: ''
    });
    setSearchTerm('');
  }, []);

  // Effects
  useEffect(() => {
    if (user && roles?.includes('SELLER')) {
      getSellerUsers();
    }
  }, [user, roles]); // Removed getSellerUsers from dependency array to prevent infinite loops

  useEffect(() => {
    if (location.state?.receiptUploaded) {
      getSellerUsers();
      
      if (location.state?.message && !successMessageShown.current) {
        showSuccessToast(location.state.message);
        successMessageShown.current = true;
        
        setTimeout(() => {
          successMessageShown.current = false;
        }, 5000);
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state?.receiptUploaded]); // Removed getSellerUsers from dependency array

  useEffect(() => {
    if (location.state?.showOrderSuccess && !successMessageShown.current) {
      if (location.state?.timestamp && Date.now() - location.state.timestamp < 10000) {
        showSuccessToast(location.state.successMessage || 'Order completed successfully!');
        successMessageShown.current = true;
        
        setTimeout(() => {
          successMessageShown.current = false;
        }, 10000);
      }
      
      const loadDraftOrders = () => {
        const savedDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
        setDraftOrders(savedDrafts);
      };
      loadDraftOrders();
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  useEffect(() => {
    const loadDraftOrders = () => {
      // Clean expired drafts and get valid ones
      const validDrafts = getValidDrafts();
      setDraftOrders(validDrafts);
    };
    
    loadDraftOrders();
    
    const handleStorageChange = (e) => {
      if (e.key === 'draftOrders') {
        loadDraftOrders();
      }
    };
    
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

  // Loading and error states
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <SkeletonHeader />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-4">
          <SkeletonFilters className="mb-4" />
          <SkeletonTable rows={8} columns={4} />
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-4">
            {/* Left Side - Back Button and Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/jkhm/seller')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go to Seller Dashboard"
              >
                <MdArrowBack className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Customers List</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Manage and filter your customer details</p>
              </div>
            </div>
            
            {/* Right Side - Action Buttons */}
            <div className="flex flex-row items-center gap-2">
              <button
                onClick={() => navigate('/jkhm/seller')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-sm"
              >
                <MdDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              {isDeliveryManager(roles) && (
                <button
                  onClick={() => navigate('/jkhm/delivery-manager')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm"
                  title="Go to Delivery Manager Dashboard"
                >
                  <MdLocalShipping className="w-4 h-4" />
                  <span className="hidden sm:inline">Delivery Manager</span>
                </button>
              )}
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-4">
        {/* Search and Filters */}
        <div className="mb-4">
          {sellerUsersLoading ? (
            <SkeletonFilters />
          ) : (
            <CustomerFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filters={filters}
              setFilters={setFilters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              clearFilters={clearFilters}
            />
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          {sellerUsersLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            </div>
          ) : (
            <ResultsSummary
              sortBy={sortBy}
              sortedCustomers={sortedCustomers}
              filteredCustomers={filteredCustomers}
              sellerUsers={sellerUsers}
              filters={filters}
              totalItems={totalItems}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {sellerUsersLoading ? (
            <>
              <SkeletonTable rows={8} columns={4} />
              <SkeletonPagination />
            </>
          ) : (
            <>
              <CustomerTable
                sellerUsersLoading={sellerUsersLoading}
                sellerUsers={sellerUsers}
                sortedCustomers={paginatedCustomers}
                selectedCustomer={selectedCustomer}
                editingUsers={editingUsers}
                deletingUsers={deletingUsers}
                generatingLinks={generatingLinks}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                onResumeOrder={handleResumeOrder}
                onUploadReceipt={() => {}} // Handled in CustomerCard
                onBookOrder={() => {}} // Handled in CustomerCard
                onViewOrders={() => {}} // Handled in CustomerCard
                onGenerateLink={handleGenerateLink}
                formatPrice={formatPrice}
                formatDate={formatDate}
                getDraftForCustomer={getDraftForCustomer}
                getPendingPayment={getPendingPayment}
                hasPendingPayments={hasPendingPayments}
                clearFilters={clearFilters}
                filters={filters}
                sortBy={sortBy}
                navigate={navigate}
              />
              
              {/* Pagination */}
              {totalItems > 0 && (
                <div className="p-4 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        showDeleteModal={showDeleteModal}
        userToDelete={userToDelete}
        deletingUsers={deletingUsers}
        onCancel={cancelDeleteUser}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
};

export default CustomersListPage;
