import React, { useState, useEffect } from 'react';
import { useCompanyBasePath } from '../context/TenantContext';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import useAuthStore from '../stores/Zustand.store';
import { isSeller } from '../utils/roleUtils';

// Import components
import DashboardHeader from '../components/deliveryManager/DashboardHeader';
import Sidebar from '../components/deliveryManager/Sidebar';
import StatsCards from '../components/deliveryManager/StatsCards';
import SellersTab from '../components/deliveryManager/SellersTab';

// Import hooks
import { useSellersData } from '../hooks/deliveryManager/useSellersData';
import { useOrderManagement } from '../hooks/deliveryManager/useOrderManagement';
import { useDeliveryExecutives } from '../hooks/deliveryManager/useDeliveryExecutives';
import { useActiveExecutives, useUpdateMultipleExecutiveStatus, useSaveRoutes } from '../hooks/deliverymanager';

const DeliveryManagerPageRefactored = () => {
  const { user, roles } = useAuthStore();
  const navigate = useNavigate();
  
  // State for UI
  const [activeTab, setActiveTab] = useState('sellers');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routeTableTab, setRouteTableTab] = useState('breakfast');
  const [routeTableFilters, setRouteTableFilters] = useState({
    deliveryName: '',
    executive: '',
    location: '',
    packages: '',
    distance: '',
    time: ''
  });
  const [showExecutiveAssignModal, setShowExecutiveAssignModal] = useState(false);
  const [assignedExecutiveCount, setAssignedExecutiveCount] = useState(2);
  const [showRunProgramButton, setShowRunProgramButton] = useState(false);
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);
  const [selectedExecutives, setSelectedExecutives] = useState(new Set());
  const [programExecutionResults, setProgramExecutionResults] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [executivesStatus, setExecutivesStatus] = useState({});
  const [loadingSessionData, setLoadingSessionData] = useState(false);
  const [programRunTimestamp, setProgramRunTimestamp] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [deliveryDataFilters, setDeliveryDataFilters] = useState({
    search: '',
    session: '',
    status: '',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [filteredDeliveryData, setFilteredDeliveryData] = useState([]);
  
  // State for filters
  const [orderFilters, setOrderFilters] = useState({
    status: 'all',
    dateRange: 'all',
    seller: 'all',
    amountRange: 'all',
    search: '',
    paymentStatus: 'all'
  });
  const [showOrderFilters, setShowOrderFilters] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState({});
  const [showOrdersForSeller, setShowOrdersForSeller] = useState({});
  const [defaultOrderLimit] = useState(5);

  // Custom hooks
  const {
    sellers,
    loading,
    error,
    stats,
    fetchSellersData,
    handleCancelAllOrdersForSeller
  } = useSellersData();

  const {
    deliveryItems,
    loadingItems,
    expandedOrder,
    confirmationModal,
    fetchDeliveryItems,
    handleCancelOrder,
    handleCancelDeliveryItem,
    showCancelConfirmation,
    handleCancelClick,
    closeCancelItemModal,
    handleConfirmationOK,
    handleConfirmationCancel,
    handleOrderExpand
  } = useOrderManagement();

  const {
    deliveryExecutives,
    loadingExecutives,
    executivesError,
    showActiveExecutivesTable,
    setShowActiveExecutivesTable,
    fetchDeliveryExecutives,
    handleToggleExecutiveStatus,
    handleSaveStatusChanges,
    handleWhatsAppMessage,
    handleAddExecutive,
    handleEditExecutive
  } = useDeliveryExecutives();

  // React Query hooks from original
  const {
    data: activeExecutivesData,
    isLoading: loadingActiveExecutives,
    error: activeExecutivesError,
    refetch: refetchActiveExecutives,
    isFetching: isRefetchingActiveExecutives
  } = useActiveExecutives({
    enabled: false,
    onSuccess: (data) => {
      if (data.data?.executives?.length > 0 || data.data?.data?.length > 0) {
        setShowActiveExecutivesTable(true);
      }
    },
    onError: (error) => {
      console.error('Error fetching active executives:', error);
    }
  });

  const updateExecutiveStatusMutation = useUpdateMultipleExecutiveStatus();
  const saveRoutesMutation = useSaveRoutes();

  // Extract executives from the data
  const activeExecutives = activeExecutivesData?.data?.executives || activeExecutivesData?.data?.data || [];

  // Auth check
  useEffect(() => {
    const checkUserAuth = async () => {
      if (!user || !isSeller(roles)) {
        navigate(basePath);
        return;
      }
      await fetchSellersData();
    };
    checkUserAuth();
  }, [user, roles, navigate, fetchSellersData]);

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredOrders = (seller) => {
    if (!seller.recentOrders) return [];
    
    let filtered = [...seller.recentOrders];
    
    // Apply filters
    if (orderFilters.status !== 'all') {
      filtered = filtered.filter(order => order.status === orderFilters.status);
    }
    
    if (orderFilters.dateRange !== 'all') {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      switch (orderFilters.dateRange) {
        case 'today':
          filtered = filtered.filter(order => new Date(order.createdAt).toDateString() === today.toDateString());
          break;
        case 'yesterday':
          filtered = filtered.filter(order => new Date(order.createdAt).toDateString() === yesterday.toDateString());
          break;
        case 'lastWeek':
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= lastWeek && orderDate <= today;
          });
          break;
        case 'lastMonth':
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= lastMonth && orderDate <= today;
          });
          break;
      }
    }
    
    if (orderFilters.seller !== 'all') {
      filtered = filtered.filter(order => seller.id === orderFilters.seller);
    }
    
    if (orderFilters.amountRange !== 'all') {
      filtered = filtered.filter(order => {
        const amount = order.totalPrice || 0;
        switch (orderFilters.amountRange) {
          case '0-500':
            return amount >= 0 && amount <= 500;
          case '500-1000':
            return amount >= 500 && amount <= 1000;
          case '1000-2000':
            return amount >= 1000 && amount <= 2000;
          case '2000+':
            return amount >= 2000;
          default:
            return true;
        }
      });
    }
    
    if (orderFilters.search) {
      const searchTerm = orderFilters.search.toLowerCase();
      filtered = filtered.filter(order => {
        const searchableText = [
          order.id,
          order.customerName,
          order.customerPhone,
          order.customerEmail,
          order.status,
          seller.name,
          seller.email
        ].join(' ').toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }
    
    if (orderFilters.paymentStatus !== 'all') {
      filtered = filtered.filter(order => {
        const hasReceipt = order.paymentReceipt && order.paymentReceipt.length > 0;
        if (orderFilters.paymentStatus === 'paid') return hasReceipt;
        if (orderFilters.paymentStatus === 'unpaid') return !hasReceipt;
        return true;
      });
    }
    
    // Apply limit
    const limit = showAllOrders[seller.id] ? filtered.length : defaultOrderLimit;
    return filtered.slice(0, limit);
  };

  const getDeliveryItemStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDeliveryItems = (order) => {
    const items = deliveryItems[order.id] || [];
    const isLoading = loadingItems[order.id];
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400">Loading items...</span>
        </div>
      );
    }
    
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-4 text-gray-400">
          No delivery items found
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{item.itemName}</p>
              <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDeliveryItemStatusColor(item.status)}`}>
                {item.status}
              </span>
              {item.status === 'PENDING' && (
                <button
                  onClick={() => handleCancelClick(item)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading delivery manager dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchSellersData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <DashboardHeader activeTab={activeTab} roles={roles} />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"
      >
        <FiMenu size={20} />
      </button>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        stats={stats}
      />

      {/* Main Content */}
      <div className="lg:ml-64 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 overflow-x-hidden max-w-full">
        {/* Stats Cards - Only visible in Analytics tab */}
        {activeTab === 'analytics' && <StatsCards stats={stats} />}

        {/* Tab Content */}
        {activeTab === 'sellers' && (
          <SellersTab
            sellers={sellers}
            orderFilters={orderFilters}
            setOrderFilters={setOrderFilters}
            showOrderFilters={showOrderFilters}
            setShowOrderFilters={setShowOrderFilters}
            showAllOrders={showAllOrders}
            setShowAllOrders={setShowAllOrders}
            showOrdersForSeller={showOrdersForSeller}
            setShowOrdersForSeller={setShowOrdersForSeller}
            defaultOrderLimit={defaultOrderLimit}
            expandedOrder={expandedOrder}
            setExpandedOrder={setExpandedOrder}
            deliveryItems={deliveryItems}
            setDeliveryItems={setDeliveryItems}
            loadingItems={loadingItems}
            setLoadingItems={setLoadingItems}
            fetchDeliveryItems={fetchDeliveryItems}
            handleCancelOrder={handleCancelOrder}
            showCancelConfirmation={showCancelConfirmation}
            handleCancelClick={handleCancelClick}
            handleCancelDeliveryItem={handleCancelDeliveryItem}
            closeCancelItemModal={closeCancelItemModal}
            handleCancelAllOrdersForSeller={handleCancelAllOrdersForSeller}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getFilteredOrders={getFilteredOrders}
            getDeliveryItemStatusColor={getDeliveryItemStatusColor}
            renderDeliveryItems={renderDeliveryItems}
            confirmationModal={confirmationModal}
            setConfirmationModal={setConfirmationModal}
            handleConfirmationOK={handleConfirmationOK}
            handleConfirmationCancel={handleConfirmationCancel}
          />
        )}

        {/* Other tabs would be implemented here */}
        {activeTab === 'orders' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-2">Orders Tab</h2>
            <p className="text-gray-400">Orders management functionality will be implemented here</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-2">Analytics Tab</h2>
            <p className="text-gray-400">Analytics and reporting functionality will be implemented here</p>
          </div>
        )}

        {activeTab === 'rootManagement' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-2">Route Management Tab</h2>
            <p className="text-gray-400">Route planning and management functionality will be implemented here</p>
          </div>
        )}

        {activeTab === 'deliveryExecutives' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-2">Delivery Executives Tab</h2>
            <p className="text-gray-400">Delivery executive management functionality will be implemented here</p>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-white mb-2">Admin Panel</h2>
            <p className="text-gray-400">Admin panel functionality will be implemented here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryManagerPageRefactored;
