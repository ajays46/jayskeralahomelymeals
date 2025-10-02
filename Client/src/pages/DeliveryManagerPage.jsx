import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiShoppingBag, FiTrendingUp, FiCalendar, FiMapPin, FiTrendingDown, FiClock, FiCheckCircle, FiBarChart2, FiActivity, FiPieChart, FiTarget, FiShield, FiPackage, FiX, FiDownload, FiEye, FiEyeOff, FiMessageCircle } from 'react-icons/fi';
import { MdLocalShipping, MdStore, MdPerson, MdAttachMoney } from 'react-icons/md';
import { Modal, message } from 'antd';
import axiosInstance from '../api/axios';
import { useActiveExecutives, useUpdateMultipleExecutiveStatus, useSaveRoutes } from '../hooks/deliverymanager';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';
import useAuthStore from '../stores/Zustand.store';
import { isSeller } from '../utils/roleUtils';
import { SkeletonDeliveryManager, SkeletonLoading } from '../components/Skeleton';
import RouteHistoryManager from '../components/deliveryManager/RouteHistoryManager';

/**
 * DeliveryManagerPage - Comprehensive delivery management dashboard with route planning and analytics
 * Handles seller management, order tracking, route optimization, and delivery executive coordination
 * Features: Real-time analytics, route planning, WhatsApp integration, executive management, order tracking
 */
const DeliveryManagerPage = () => {
  const { user, roles } = useAuthStore();
  const location = useLocation();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSellers: 0
  });
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showSellerDetails, setShowSellerDetails] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('sellers'); // 'sellers' or 'orders'
  const [routeTableTab, setRouteTableTab] = useState('breakfast'); // For route planning table tabs
  
  // Route History Manager ref
  const routeHistoryManagerRef = useRef(null);
  const [routeTableFilters, setRouteTableFilters] = useState({
    deliveryName: '',
    executive: '',
    location: ''
  });
  const [showExecutiveAssignModal, setShowExecutiveAssignModal] = useState(false);
  const [assignedExecutiveCount, setAssignedExecutiveCount] = useState(2);
  const [showRunProgramButton, setShowRunProgramButton] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null); // For expanding order details
  const [deliveryItems, setDeliveryItems] = useState({}); // Store delivery items for each order
  const [loadingItems, setLoadingItems] = useState({}); // Loading state for delivery items
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile sidebar toggle
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    timeSlot: 'all'
  });
  
  // Orders tab specific filters
  const [orderFilters, setOrderFilters] = useState({
    status: 'all',
    dateRange: 'all',
    seller: 'all',
    amountRange: 'all',
    search: '',
    paymentStatus: 'all'
  });
  const [showOrderFilters, setShowOrderFilters] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState({}); // Track which sellers show all orders
  const [showOrdersForSeller, setShowOrdersForSeller] = useState({}); // Track which sellers show orders table
  const [defaultOrderLimit] = useState(5); // Default number of orders to show
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    itemId: null,
    title: '',
    content: ''
  });
  const [deliveryExecutives, setDeliveryExecutives] = useState([]);
  const [loadingExecutives, setLoadingExecutives] = useState(false);
  const [executivesError, setExecutivesError] = useState(false);
  
  // React Query hook for active executives
  const {
    data: activeExecutivesData,
    isLoading: loadingActiveExecutives,
    error: activeExecutivesError,
    refetch: refetchActiveExecutives,
    isFetching: isRefetchingActiveExecutives
  } = useActiveExecutives({
    enabled: false, // Don't fetch automatically, only when button is clicked
    onSuccess: (data) => {
      message.success(data.message || `Fetched ${data.data?.executives?.length || data.data?.data?.length || 0} active executives`);
      // Automatically show the table when executives are fetched
      if (data.data?.executives?.length > 0 || data.data?.data?.length > 0) {
        setShowActiveExecutivesTable(true);
      }
    },
    onError: (error) => {
      message.error(error.message || 'Failed to fetch active executives');
    }
  });
  
  // React Query hook for updating executive status
  const updateExecutiveStatusMutation = useUpdateMultipleExecutiveStatus();
  
  // React Query hook for saving routes
  const saveRoutesMutation = useSaveRoutes();
  
  // Extract executives from the data
  const activeExecutives = activeExecutivesData?.data?.executives || activeExecutivesData?.data?.data || [];  
  const navigate = useNavigate(); 
  const [cancellingItems, setCancellingItems] = useState(new Set());
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [itemToCancel, setItemToCancel] = useState(null);
  const [routePlanningResults, setRoutePlanningResults] = useState(null); // Store route planning results
  const [filePreviews, setFilePreviews] = useState({}); // Store file content previews
  const [loadingPreviews, setLoadingPreviews] = useState({}); // Loading state for file previews
  const [showFullContent, setShowFullContent] = useState({}); // Toggle between preview and full content
  const [selectedExecutives, setSelectedExecutives] = useState(new Set()); // Store selected executives for route planning
  const [programExecutionResults, setProgramExecutionResults] = useState(null); // Store program execution results
  const [sessionData, setSessionData] = useState(null); // Store session data
  const [showActiveExecutivesTable, setShowActiveExecutivesTable] = useState(false); // Show/hide active executives table
  const [executivesStatus, setExecutivesStatus] = useState({}); // Track status changes for executives
  const [loadingSessionData, setLoadingSessionData] = useState(false); // Loading state for session data
  const [programRunTimestamp, setProgramRunTimestamp] = useState(null); // Force refresh timestamp
  const [currentRequestId, setCurrentRequestId] = useState(null); // Store current request ID for saving routes
  const [routesSaved, setRoutesSaved] = useState(false); // Track if routes have been saved
  const [deliveryDataFilters, setDeliveryDataFilters] = useState({
    search: '',
    session: '',
    status: '',
    selectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
  });
  const [filteredDeliveryData, setFilteredDeliveryData] = useState([]);

  useEffect(() => {
    fetchSellersData();
    fetchDeliveryExecutives();
    // Auto-fetch delivery data when component mounts
    handleFetchSessionData();
  }, []);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab === 'routeManagement') {
      setActiveTab('rootManagement');
    }
  }, [location.search]);


  // Load program execution results and routes saved state from localStorage on component mount
  useEffect(() => {
    const savedExecutionResults = localStorage.getItem('programExecutionResults');
    if (savedExecutionResults) {
      try {
        const parsed = JSON.parse(savedExecutionResults);
        setProgramExecutionResults(parsed);
      } catch (error) {
        console.error('Error parsing program execution results from localStorage:', error);
      }
    }

    // Load routes saved state
    const savedRoutesState = localStorage.getItem('routesSaved');
    if (savedRoutesState === 'true') {
      setRoutesSaved(true);
    }
  }, []);


  useEffect(() => {
    if (deliveryItems) {
      // Update delivery items when they change
    }
  }, [deliveryItems]);

  // Filter delivery data whenever filters or session data changes
  useEffect(() => {
    if (sessionData?.data?.externalResponse?.data) {
      const filtered = sessionData.data.externalResponse.data.filter(item => {
        // Search filter (location, customer name, order ID)
        const searchMatch = !deliveryDataFilters.search || 
          item.street?.toLowerCase().includes(deliveryDataFilters.search.toLowerCase()) ||
          item.first_name?.toLowerCase().includes(deliveryDataFilters.search.toLowerCase()) ||
          item.last_name?.toLowerCase().includes(deliveryDataFilters.search.toLowerCase()) ||
          item.order_id?.toLowerCase().includes(deliveryDataFilters.search.toLowerCase()) ||
          item.menu_item_id?.toLowerCase().includes(deliveryDataFilters.search.toLowerCase());

        // Session filter
        const sessionMatch = !deliveryDataFilters.session || 
          item.session === deliveryDataFilters.session;

        // Status filter
        const statusMatch = !deliveryDataFilters.status || 
          item.status === deliveryDataFilters.status;

        // Date filter - check if delivery date matches selected date
        let dateMatch = true;
        if (deliveryDataFilters.selectedDate) {
          const deliveryDate = new Date(item.delivery_date);
          const selectedDate = new Date(deliveryDataFilters.selectedDate);
          
          // Compare dates (ignore time)
          dateMatch = deliveryDate.toDateString() === selectedDate.toDateString();
        }

        return searchMatch && sessionMatch && statusMatch && dateMatch;
      });
      
      setFilteredDeliveryData(filtered);
    }
  }, [sessionData, deliveryDataFilters]);

  // Auto-load text file previews when route planning results are available
  useEffect(() => {
    if (routePlanningResults?.data?.externalResponse?.data?.files) {
      const textFiles = routePlanningResults.data.externalResponse.data.files.filter(file => file.file.includes('.txt'));
      textFiles.forEach(file => {
        if (!filePreviews[file.file] && !loadingPreviews[file.file]) {
          // Small delay to avoid overwhelming the API
          setTimeout(() => fetchFilePreview(file.url, file.file), 1000 + Math.random() * 2000);
        }
      });
    }
  }, [routePlanningResults]);

  // Auto-load text file previews when program execution results are available
  useEffect(() => {
    if (programExecutionResults?.data?.externalResponse?.data?.files && programRunTimestamp) {
      const textFiles = programExecutionResults.data.externalResponse.data.files.filter(file => file.file.includes('.txt'));
      
      // Force reload ALL previews for new program execution (ignore cache)
      textFiles.forEach(file => {
        setTimeout(() => fetchFilePreview(file.url, file.file), 500 + Math.random() * 1000);
      });
    }
  }, [programExecutionResults, programRunTimestamp]); // ← Add timestamp dependency


  const fetchDeliveryItems = async (orderId) => {
    if (deliveryItems[orderId]) return;
    
    try {
      setLoadingItems(prev => ({ ...prev, [orderId]: true }));
      
      // The delivery items are already fetched in the backend response
      // We just need to find the order and extract its delivery items
      const order = sellers.flatMap(seller => seller.recentOrders || []).find(order => order.id === orderId);
      

      
      if (order && order.deliveryItems && order.deliveryItems.length > 0) {
        // Transform the delivery items to match the expected format
        const transformedItems = order.deliveryItems.map(item => {
          return {
            id: item.id,
            orderId: item.orderId,
            menuItem: {
              name: item.menuItem?.name || 'Unknown Item',
              price: item.menuItem?.price || 0
            },
            quantity: item.quantity,
            status: item.status || 'PENDING',
            deliveryDate: item.deliveryDate || new Date().toISOString(),
            deliveryTimeSlot: item.deliveryTimeSlot || 'N/A',
            // Add the user information that the backend needs
            user: {
              createdBy: order.sellerId || order.userId // This should match the seller ID
            }
          };
        });
        
        setDeliveryItems(prev => ({ ...prev, [orderId]: transformedItems }));
      } else {
        // If no delivery items found, create mock data for demonstration
        const mockItems = [
          {
            id: `mock-${orderId}-1`,
            orderId: orderId,
            menuItem: { name: 'Sample Item 1', price: 150 },
            quantity: 2,
            status: 'PENDING',
            deliveryDate: new Date().toISOString(),
            deliveryTimeSlot: '12:00 PM - 2:00 PM',
            // Add mock user info for testing
            user: {
              createdBy: 'mock-seller-id'
            }
          },
          {
            id: `mock-${orderId}-2`,
            orderId: orderId,
            menuItem: { name: 'Sample Item 2', price: 200 },
            quantity: 1,
            status: 'PENDING',
            deliveryDate: new Date().toISOString(),
            deliveryTimeSlot: '12:00 PM - 2:00 PM',
            // Add mock user info for testing
            user: {
              createdBy: 'mock-seller-id'
            }
          }
        ];
        
        setDeliveryItems(prev => ({ ...prev, [orderId]: mockItems }));
      }
    } catch (error) {
      // Create mock data on error
      const mockItems = [
        {
          id: `mock-${orderId}-1`,
          orderId: orderId,
          menuItem: { name: 'Mock Item 1', price: 150 },
          quantity: 2,
          status: 'PENDING',
          deliveryDate: new Date().toISOString(),
          deliveryTimeSlot: '12:00 PM - 2:00 PM',
          // Add mock user info for testing
          user: {
            createdBy: 'mock-seller-id'
          }
        },
        {
          id: `mock-${orderId}-2`,
          orderId: orderId,
          menuItem: { name: 'Mock Item 2', price: 200 },
          quantity: 1,
          status: 'PENDING',
          deliveryDate: new Date().toISOString(),
          deliveryTimeSlot: '12:00 PM - 2:00 PM',
          // Add mock user info for testing
          user: {
            createdBy: 'mock-seller-id'
          }
        }
      ];
      
      setDeliveryItems(prev => ({ ...prev, [orderId]: mockItems }));
    } finally {
      setLoadingItems(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setCancellingOrder(orderId);
      const response = await axiosInstance.put(`/delivery-managers/orders/${orderId}/cancel`);
      
      if (response.data.success) {
        message.success('Order cancelled successfully');
        // Refresh the sellers data to show updated order status
        fetchSellersData();
      } else {
        message.error('Failed to cancel order');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          message.error('Authentication failed. Please log in again.');
        } else if (error.response.status === 403) {
          message.error('You do not have permission to cancel this order.');
        } else if (error.response.status === 404) {
          message.error('Order not found.');
        } else if (error.response.status >= 500) {
          message.error('Server error. Please try again later.');
        } else {
          message.error(`Error: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        message.error('Network error. Please check your connection.');
      } else {
        message.error('Failed to cancel order. Please try again.');
      }
    } finally {
      setCancellingOrder(null);
    }
  };

  const showCancelConfirmation = (orderId) => {
    Modal.confirm({
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order? This action cannot be undone.',
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'No, Keep Order',
      onOk: () => handleCancelOrder(orderId)
    });
  };

  const handleCancelClick = (item) => {
    setItemToCancel(item);
    setShowCancelItemModal(true);
  };

  const handleCancelDeliveryItem = async (itemId) => {
    try {
      setCancellingItems(prev => new Set(prev).add(itemId));
      
      // Use the new delivery manager specific endpoint
      const apiUrl = `/delivery-managers/delivery-items/${itemId}/cancel`;
      
      const response = await axiosInstance.put(apiUrl);
      
      if (response.data.success) {
        message.success('Delivery item cancelled successfully');
        
        // Update the local state to reflect the change
        setDeliveryItems(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(orderId => {
            if (updated[orderId]) {
              updated[orderId] = updated[orderId].map(item => 
                item.id === itemId ? { ...item, status: 'Cancelled' } : item
              );
            }
          });
          return updated;
        });
        
        // Also refresh the main data to show updated status
        fetchSellersData();
      } else {
        message.error('Failed to cancel delivery item');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          message.error('Authentication failed. Please log in again.');
        } else if (error.response.status === 403) {
          message.error('You do not have permission to cancel this item.');
        } else if (error.response.status === 404) {
          message.error('Delivery item not found.');
        } else if (error.response.status >= 500) {
          message.error('Server error. Please try again later.');
        } else {
          message.error(`Error: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        message.error('Network error. Please check your connection.');
      } else {
        message.error('Failed to cancel delivery item. Please try again.');
      }
    } finally {
      setCancellingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      setShowCancelItemModal(false);
      setItemToCancel(null);
    }
  };

  const closeCancelItemModal = () => {
    setShowCancelItemModal(false);
    setItemToCancel(null);
  };

  const handleRunRoutePlanning = async () => {
    try {
      message.loading('🚀 Starting route planning process...', 0);
      
      // Use backend proxy to avoid CORS issues when calling external API
      const response = await axiosInstance.post('/admin/proxy-route-planning', {
        timestamp: new Date().toISOString(),
        source: 'delivery-manager-dashboard',
        userAgent: navigator.userAgent,
        dashboardVersion: '1.0.0'
      });
      
      message.destroy(); // Clear loading message
      
      if (response.data.success) {
        message.success('✅ Route planning process completed successfully!');
        
        // Store the route planning results
        setRoutePlanningResults(response.data);
        
        // Show success modal with details
        const pendingOrders = sellers.flatMap(seller => seller.recentOrders || []).filter(order => order.status === 'PENDING');
        const availableExecutives = deliveryExecutives.filter(e => e.currentStatus === 'Available');
        
        Modal.success({
          title: '🚀 Route Planning Success!',
          content: (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <h5 className="font-medium text-green-800">Route Planning Completed</h5>
                </div>
                <p className="text-sm text-green-700">
                  Your route planning request has been successfully processed and files are ready for download.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-800 mb-2">Generated Files</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• <strong>Status:</strong> {response.data.data?.status || 'Completed'}</div>
                  <div>• <strong>Request ID:</strong> {response.data.data?.requestId || 'N/A'}</div>
                  <div>• <strong>Files Generated:</strong> {response.data.data?.externalResponse?.data?.files?.length || 0} files</div>
                  <div>• <strong>Estimated Time:</strong> {response.data.data?.estimatedCompletion || 'N/A'}</div>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 className="font-medium text-yellow-800 mb-2">What's Available?</h5>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>• Interactive map links for morning, lunch, and dinner</div>
                  <div>• Detailed route plan text files</div>
                  <div>• All files are ready for immediate download</div>
                  <div>• Route planning results are displayed below on this page</div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h5 className="font-medium text-gray-800 mb-2">Current System Status</h5>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>• <strong>Pending Orders:</strong> {pendingOrders.length}</div>
                  <div>• <strong>Available Executives:</strong> {availableExecutives.length}</div>
                  <div>• <strong>Route Planning:</strong> ✅ Completed</div>
                </div>
              </div>
            </div>
          ),
          okText: 'Got it!',
          cancelText: 'Close',
          width: 600,
          centered: true,
          onOk: () => {
            // Results are now displayed inline on the page
          }
        });
      } else {
        message.error('❌ Failed to start route planning process');
      }
      
    } catch (error) {
      message.destroy(); // Clear loading message
      
      if (error.response) {
        // Server responded with error status
        message.error(`❌ Route planning failed: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // Network error
        message.error('❌ Network error: Could not connect to route planning service');
      } else {
        // Other error
        message.error(`❌ Route planning error: ${error.message}`);
      }
    }
  };

  // Function to fetch session data
  const handleFetchSessionData = async () => {
    try {
      setLoadingSessionData(true);
      message.loading('📊 Fetching session data...', 0);
      
      // Use backend proxy to avoid CORS issues when calling external API
      const response = await axiosInstance.get('/admin/proxy-session-data');
      
      message.destroy(); // Clear loading message
      
      if (response.data.success) {
        message.success('✅ Session data fetched successfully!');
        
        // Store the session data
        setSessionData(response.data);
      } else {
        message.error('❌ Failed to fetch session data');
      }
      
    } catch (error) {
      message.destroy(); // Clear loading message
      
      if (error.response) {
        // Server responded with error status
        message.error(`❌ Session data fetch failed: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // Network error
        message.error('❌ Network error: Could not connect to session data service');
      } else {
        // Other error
        message.error(`❌ Session data fetch error: ${error.message}`);
      }
    } finally {
      setLoadingSessionData(false);
    }
  };

  // New function to send WhatsApp messages via external API
  const handleSendWhatsApp = async () => {
    try {
      if (selectedExecutives.size === 0) {
        message.warning('Please enter a count for delivery executives first');
        return;
      }

      // Get the count from the selectedExecutives set (it now contains just the count number)
      const executiveCount = Array.from(selectedExecutives)[0];

      message.loading(`📱 Sending WhatsApp messages for ${executiveCount} executive(s)...`, 0);
      
      // Call the backend proxy endpoint for send_routes
      const response = await axiosInstance.post('/admin/proxy-send-routes', {
        executiveCount: executiveCount,
        timestamp: new Date().toISOString(),
        source: 'delivery-manager-dashboard',
        userAgent: navigator.userAgent,
        dashboardVersion: '1.0.0'
      });
      
      message.destroy(); // Clear loading message
      
      if (response.data.success) {
        message.success(`✅ WhatsApp messages sent successfully for ${executiveCount} executive(s)!`);
        
        // Show toast popup
        showSuccessToast(`📱 WhatsApp messages sent successfully for ${executiveCount} executive(s)!`);
        
        // Show success modal
        Modal.success({
          title: '📱 WhatsApp Messages Sent!',
          content: (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <h5 className="font-medium text-green-800">Messages Sent Successfully</h5>
                </div>
                <p className="text-sm text-green-700">
                  WhatsApp messages have been sent for {executiveCount} delivery executive(s) via the external API.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-800 mb-2">API Response Details</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• <strong>Status:</strong> {response.data.data?.status || 'Completed'}</div>
                  <div>• <strong>Request ID:</strong> {response.data.data?.requestId || 'N/A'}</div>
                  <div>• <strong>Executives:</strong> {executiveCount} count</div>
                  <div>• <strong>Execution Time:</strong> {response.data.data?.executionTime || 'N/A'}</div>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 className="font-medium text-yellow-800 mb-2">What Happened?</h5>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>• POST request sent to external API endpoint</div>
                  <div>• Authorization header included with Bearer token</div>
                  <div>• Executive count ({executiveCount}) transmitted</div>
                  <div>• External service will handle WhatsApp messaging</div>
                </div>
              </div>
            </div>
          ),
          okText: 'Got it!',
          cancelText: 'Close',
          width: 600,
          centered: true
        });
      } else {
        const errorMsg = '❌ Failed to send WhatsApp messages';
        message.error(errorMsg);
        showErrorToast(errorMsg);
      }
      
    } catch (error) {
      message.destroy(); // Clear loading message
      
      if (error.response) {
        // Server responded with error status
        const errorMsg = `❌ WhatsApp messaging failed: ${error.response.data?.message || error.response.statusText}`;
        message.error(errorMsg);
        showErrorToast(errorMsg);
      } else if (error.request) {
        // Network error
        const errorMsg = '❌ Network error: Could not connect to WhatsApp messaging service';
        message.error(errorMsg);
        showErrorToast(errorMsg);
      } else {
        // Other error
        const errorMsg = `❌ WhatsApp messaging error: ${error.message}`;
        message.error(errorMsg);
        showErrorToast(errorMsg);
      }
    }
  };

  // Function to save routes
  const handleSaveRoutes = async (routeData = null) => {
    try {
          // Always use the real backend API for saving routes
      if (!currentRequestId) {
        message.warning('No request ID available. Please run the program first.');
        return;
      }

      if (routeData) {
        // Called from Route History Manager with route data
        message.loading('💾 Saving selected route...', 0);
      } else {
        // Called from main save button
        message.loading('💾 Saving routes...', 0);
      }
      
      // Use the real backend API for both cases
      await saveRoutesMutation.mutateAsync({ requestId: currentRequestId });
      
      message.destroy(); // Clear loading message
      message.success(routeData ? 'Selected route saved successfully!' : 'Routes saved successfully!');
      
      // Set routes as saved to enable WhatsApp button
      setRoutesSaved(true);
      localStorage.setItem('routesSaved', 'true');
      
    } catch (error) {
      message.destroy(); // Clear loading message
      console.error('Error saving routes:', error);
      message.error('Failed to save routes');
    }
  };

  // New function to run program with selected executives
  const handleRunProgram = async () => {
    try {
      if (selectedExecutives.size === 0) {
        message.warning('Please enter a count for delivery executives first');
        return;
      }

      // Get the count from the selectedExecutives set (it now contains just the count number)
      const executiveCount = Array.from(selectedExecutives)[0];

              message.loading(`🚀 Sending executive count and starting program execution with ${executiveCount} executive(s)...`, 0);
        
        // Clear previous results and set new timestamp to force refresh
        setProgramExecutionResults(null);
        setFilePreviews({}); // Clear old file previews
        setLoadingPreviews({}); // Clear loading states
        setShowFullContent({}); // Reset content display toggles
        setRoutesSaved(false); // Reset routes saved state
        const newTimestamp = Date.now();
        setProgramRunTimestamp(newTimestamp); // ← Force new timestamp for refresh
        
        // First, send the executive count to the API
      try {
        await axiosInstance.post('/admin/proxy-executive-count', {
          executiveCount: executiveCount,
          timestamp: new Date().toISOString(),
          source: 'delivery-manager-dashboard',
          userAgent: navigator.userAgent,
          dashboardVersion: '1.0.0'
        });
      } catch (countError) {
        console.warn('Warning: Could not send executive count to API:', countError);
        // Continue with program execution even if count sending fails
      }
      
      // Execute the program with executive count
      
      const response = await axiosInstance.post('/admin/proxy-run-script', {
        executiveCount: executiveCount,
        timestamp: new Date().toISOString(),
        source: 'delivery-manager-dashboard',
        userAgent: navigator.userAgent,
        dashboardVersion: '1.0.0',
      });
      
      
      message.destroy(); // Clear loading message

      if (response.data.success) {
        message.success(`✅ Program executed successfully with ${executiveCount} executive(s)!`);
        
        // Store the program execution results for display
        setProgramExecutionResults(response.data);
        
        // Save to localStorage for persistence across page navigation
        localStorage.setItem('programExecutionResults', JSON.stringify(response.data));
        
        // Save route result to history
        if (routeHistoryManagerRef.current) {
          routeHistoryManagerRef.current.saveRouteResult(executiveCount, response.data);
        }
        
        // Store the request ID for saving routes later
        if (response.data.data?.requestId) {
          setCurrentRequestId(response.data.data.requestId);
        } else {
        }
        
        
        // Extract execution results from external response
      
        // Show success modal
        Modal.success({
          title: '🚀 Program Execution Success!',
          content: (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <h5 className="font-medium text-green-800">Program Executed Successfully</h5>
                </div>
                <p className="text-sm text-green-700">
                  Your program has been executed with {executiveCount} delivery executive(s).
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-800 mb-2">Execution Results</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• <strong>Breakfast Routes:</strong> {breakfastResults.length} routes</div>
                  <div>• <strong>Lunch Routes:</strong> {lunchResults.length} routes</div>
                  <div>• <strong>Dinner Routes:</strong> {dinnerResults.length} routes</div>
                  <div>• <strong>Excel Files Generated:</strong> {excelFiles.length} files</div>
                  <div>• <strong>Executives Used:</strong> {executiveCount}</div>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 className="font-medium text-yellow-800 mb-2">What Happened?</h5>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>• Executive count ({executiveCount}) was sent to the external API</div>
                  <div>• Program script was executed on external server</div>
                  <div>• {executiveCount} delivery executive(s) were assigned</div>
                  <div>• Execution completed successfully</div>
                  <div>• Results are available in the external system</div>
                </div>
              </div>
            </div>
          ),
          okText: 'Got it!',
          cancelText: 'Close',
          width: 500,
          centered: true
        });
      } else {
        message.error('❌ Failed to execute program');
      }
      
    } catch (error) {
      message.destroy(); // Clear loading message
      
      if (error.response) {
        // Server responded with error status
        message.error(`❌ Program execution failed: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // Network error
        message.error('❌ Network error: Could not connect to external service');
      } else {
        // Other error
        message.error(`❌ Program execution error: ${error.message}`);
      }
    }
  };

  const handleDownloadFile = (url, filename) => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success(`Downloading ${filename}...`);
    } catch (error) {
      message.error('Failed to download file. Please try again.');
    }
  };

  const handleOpenFileInNewTab = (url, filename) => {
    try {
      window.open(url, '_blank');
      message.success(`Opening ${filename} in new tab...`);
    } catch (error) {
      message.error('Failed to open file. Please try again.');
    }
  };

  const fetchFilePreview = async (url, filename) => {
    if (filePreviews[filename]) {
      return; // Already fetched
    }
    
    try {
      setLoadingPreviews(prev => ({ ...prev, [filename]: true }));
      
      // Try to fetch the text content from the URL
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors', // Try CORS first
        headers: {
          'Accept': 'text/plain,text/html,*/*',
        }
      });
      
      if (response.ok) {
        const content = await response.text();
        
        // Store the full content (no truncation)
        setFilePreviews(prev => {
          const newPreviews = { ...prev, [filename]: content };
          return newPreviews;
        });
      } else {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        // Try to fetch through backend proxy as fallback
        try {
          // Create a proxy request through your backend
          const proxyResponse = await axiosInstance.post('/admin/proxy-file-content', {
            url: url,
            filename: filename
          });
          
          if (proxyResponse.data.success) {
            const content = proxyResponse.data.content;
            // Store the full content (no truncation)
            setFilePreviews(prev => ({ ...prev, [filename]: content }));
            return;
          }
        } catch (proxyError) {
          // Backend proxy failed
        }
        
        setFilePreviews(prev => ({ 
          ...prev, 
          [filename]: '⚠️ CORS restriction: Cannot preview content directly. Use "Open Full" button to view complete file in new tab.' 
        }));
      } else {
        setFilePreviews(prev => ({ 
          ...prev, 
          [filename]: `❌ Error loading preview: ${error.message}. Please use "Open Full" button to view content.` 
        }));
      }
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [filename]: false }));
    }
  };

  const toggleContentDisplay = (filename) => {
    setShowFullContent(prev => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  const getDisplayContent = (filename, content) => {
    if (!content || content.includes('⚠️') || content.includes('❌')) {
      return content;
    }
    
    const isShowingFull = showFullContent[filename];
    if (isShowingFull) {
      return content; // Show full content
    } else {
      // Show preview (first 500 characters)
      return content.length > 500 ? content.substring(0, 500) + '...' : content;
    }
  };

  // These functions are no longer needed with the count-based approach
  // const handleExecutiveSelection = (executiveId) => {
  //   setSelectedExecutives(prev => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(executiveId)) {
  //       newSet.delete(executiveId);
  //     } else {
  //       newSet.add(executiveId);
  //     }
  //     return newSet;
  //   });
  // };

  // const handleSelectAllExecutives = () => {
  //   if (selectedExecutives.size === deliveryExecutives.length) {
  //     // If all are selected, deselect all
  //     setSelectedExecutives(new Set());
  //     } else {
  //       // Select all executives
  //       setSelectedExecutives(new Set(deliveryExecutives.map(e => e.id)));
  //     }
  //   };

  const handleSendSelectedExecutives = async () => {
    if (selectedExecutives.size === 0) {
      message.warning('Please enter a count for delivery executives');
      return;
    }

    // Get the count from the selectedExecutives set (it now contains just the count number)
    const executiveCount = Array.from(selectedExecutives)[0];
    
    try {
      message.loading(`🚚 Sending executive count (${executiveCount}) to EC2 instance...`, 0);
      
      // Send only the executive count to the EC2 instance
      const response = await axiosInstance.post('/admin/proxy-executive-count', {
        executiveCount: executiveCount,
        timestamp: new Date().toISOString(),
        source: 'delivery-manager-dashboard',
        userAgent: navigator.userAgent,
        dashboardVersion: '1.0.0'
      });
      
      message.destroy(); // Clear loading message
      
              if (response.data.success) {
                  message.success(`✅ Executive count (${executiveCount}) sent to EC2 instance!`);
        
        // Show simple success modal
        Modal.success({
          title: '🚚 Executive Count Sent',
          content: (
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Executive count: {executiveCount}</strong> has been sent to the EC2 instance.
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h6 className="font-medium text-blue-800 mb-2">What was sent:</h6>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• <strong>Executive Count:</strong> {executiveCount}</div>
                  <div>• <strong>Data Type:</strong> Count only (no personal details)</div>
                  <div>• <strong>Destination:</strong> AI Route API Server</div>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  The count has been sent to the route planning system. No response is expected.
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h6 className="font-medium text-gray-800 mb-2">Request Details:</h6>
                <div className="text-xs text-gray-700 space-y-1">
                  <div>• <strong>Status:</strong> {response.data.data?.status || 'Sent'}</div>
                  <div>• <strong>Request ID:</strong> {response.data.data?.requestId || 'N/A'}</div>
                  <div>• <strong>Count Sent:</strong> {executiveCount}</div>
                  <div>• <strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
          ),
            okText: 'Got it!',
            cancelText: 'Close',
            width: 500,
            centered: true,
            onOk: () => {
              message.success('Executive count sent successfully!');
            }
          });
        } else {
          message.error('❌ Failed to send executive count');
        }
      
    } catch (error) {
      message.destroy(); // Clear loading message
      
      if (error.response) {
        // Server responded with error status
        message.error(`❌ Failed to send executive count: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // Network error
        message.error('❌ Network error: Could not connect to route planning service');
      } else {
        // Other error
        message.error(`❌ Error: ${error.message}`);
      }
      
      // Show error modal with fallback
      Modal.error({
        title: '❌ Failed to Send Executive Count',
        content: (
          <div className="space-y-3">
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                Failed to send {executiveCount} executive(s) to the route planning system.
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Error Details:</strong> {error.message || 'Unknown error occurred'}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h6 className="font-medium text-blue-800 mb-2">Count Information:</h6>
              <div className="text-sm text-blue-700">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span>Executive Count:</span>
                  <span className="font-bold">{executiveCount}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800">
                The count is still stored locally. You can try sending it again or contact support.
              </p>
            </div>
          </div>
        ),
        okText: 'OK',
        width: 500,
        centered: true
      });
    }
  };

  const fetchSellersData = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      
      // Fetch sellers with their order data
      const response = await axiosInstance.get('/admin/sellers-with-orders');
      
      if (response.data.status === 'success') {
        const sellersData = response.data.data;
        
        setSellers(sellersData);
        
        // Calculate stats
        const totalOrders = sellersData.reduce((sum, seller) => sum + (seller.orderCount || 0), 0);
        const totalRevenue = sellersData.reduce((sum, seller) => sum + (seller.totalRevenue || 0), 0);
        const activeSellers = sellersData.filter(seller => seller.status === 'ACTIVE').length;
        
        setStats({
          totalSellers: sellersData.length,
          totalOrders,
          totalRevenue,
          activeSellers
        });
      } else {
        setError('Failed to fetch sellers data: Invalid response from server');
      }
    } catch (error) {
      // Provide specific error messages based on error type
      if (error.response?.status === 500) {
        setError('Server error: Unable to fetch sellers data. Please try again later.');
      } else if (error.response?.status === 401) {
        setError('Authentication error. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view sellers data.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to server. Please check your connection.');
      } else if (error.code === 'ERR_BAD_RESPONSE') {
        setError('Server error: Bad response from server. Please try again later.');
      } else {
        setError(`Failed to fetch sellers data: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryExecutives = async () => {
    try {
      setLoadingExecutives(true);
      setExecutivesError(false); // Reset error state
      const response = await axiosInstance.get('/admin/delivery-executives');
      
      if (response.data.status === 'success') {
        setDeliveryExecutives(response.data.data || []);
      } else {
        message.warning('Failed to fetch delivery executives. Some data may be unavailable.');
        setExecutivesError(true);
      }
    } catch (error) {
      // Show user-friendly error message
      if (error.response?.status === 500) {
        message.error('Server error: Unable to fetch delivery executives. Please try again later.');
      } else if (error.response?.status === 401) {
        message.error('Authentication error. Please log in again.');
      } else if (error.response?.status === 403) {
        message.error('Access denied. You do not have permission to view delivery executives.');
      } else {
        message.warning('Network error: Unable to fetch delivery executives. Please check your connection.');
      }
      
      // Set empty array to prevent UI errors
      setDeliveryExecutives([]);
      setExecutivesError(true);
    } finally {
      setLoadingExecutives(false);
    }
  };

  // Function to trigger active executives fetch
  const handleFetchActiveExecutives = () => {
    refetchActiveExecutives().then((result) => {
      if (result.data?.data?.executives?.length > 0 || result.data?.data?.data?.length > 0) {
        setShowActiveExecutivesTable(true);
      }
    });
  };

  // Function to toggle executive status
  const handleToggleExecutiveStatus = (executiveId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setExecutivesStatus(prev => ({
      ...prev,
      [executiveId]: newStatus
    }));
    
    // Show success message
    message.success(`Executive status changed to ${newStatus}`);
  };

  // Function to save status changes
  const handleSaveStatusChanges = async () => {
    try {
      const changesCount = Object.keys(executivesStatus).length;
      
      if (changesCount === 0) {
        message.warning('No changes to save');
        return;
      }

      // Prepare updates array for the API - send ALL executives with their current status
      const updates = activeExecutives.map(executive => ({
        user_id: executive.user_id,
        status: executivesStatus[executive.user_id] || executive.status, // Use changed status or original
        date: new Date().toISOString().split('T')[0] // Today's date
      }));

      // Use React Query mutation to save changes
      await updateExecutiveStatusMutation.mutateAsync(updates);
      
      // Refetch the active executives to get the updated data
      await refetchActiveExecutives();
      
      // Clear the changes after successful save
      setExecutivesStatus({});
      
    } catch (error) {
      message.error('Failed to save status changes');
      console.error('Error saving status changes:', error);
    }
  };

  const handleWhatsAppMessage = (phoneNumber, executiveName) => {
    if (!phoneNumber || phoneNumber === 'No phone') {
      message.error('No phone number available for this executive');
      return;
    }
    
    // Remove any non-digit characters and ensure it starts with country code
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with 91 (India), add it
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }
    
    // Create WhatsApp message
    const message = `Hello ${executiveName}! This is a message from the delivery management team.`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleAddExecutive = () => {
    // Navigate to the admin users page to create a new delivery executive
    navigate('/jkhm/admin/users');
    message.info('Redirecting to user creation page. Please select DELIVERY_EXECUTIVE role.');
  };

  const handleConfirmationOK = async () => {
    // Handle confirmation modal OK action
    if (confirmationModal.itemId === 'logout') {
      try {
        // Call logout API endpoint if it exists
        try {
          await axiosInstance.post('/auth/logout');
        } catch (error) {
        }
        
        // Clear all authentication data
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any cookies if they exist
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear axios default headers
        delete axiosInstance.defaults.headers.common['Authorization'];
        
        // Show success message
        message.success('Logged out successfully');
        
        // Navigate to home page
        navigate('/jkhm');
        
        // Force page reload to clear any remaining state
        window.location.reload();
      } catch (error) {
        console.error('Logout error:', error);
        message.error('Logout failed. Please try again.');
      }
    }
    setConfirmationModal({ visible: false, itemId: null, title: '', content: '' });
  };

  const handleConfirmationCancel = () => {
    // Handle confirmation modal cancel action
    setConfirmationModal({ visible: false, itemId: null, title: '', content: '' });
  };

  const cancelOrder = async (orderId) => {
    try {
      setCancellingOrder(orderId);
      const response = await axiosInstance.put(`/delivery-managers/orders/${orderId}/cancel`);
      
      if (response.data.success) {
        message.success('Order cancelled successfully');
        // Refresh the orders list
        fetchSellersData();
      } else {
        message.error('Failed to cancel order');
      }
    } catch (error) {
      message.error('Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleEditExecutive = (executive) => {
    // Navigate to the admin users page to edit the delivery executive
    navigate('/jkhm/admin/users');
    message.info(`Redirecting to edit ${executive.name}'s profile. You can update their phone number and other details.`);
  };

  const handleOrderExpand = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      // Fetch delivery items when expanding
      if (!deliveryItems[orderId]) {
        fetchDeliveryItems(orderId);
      }
    }
  };

  // Test function to create mock delivery items
  const createMockDeliveryItems = (orderId) => {
    const mockItems = [
      {
        id: `mock-${orderId}-1`,
        menuItem: {
          product: { name: 'Chicken Biriyani' },
          price: 300
        },
        quantity: 1,
        deliveryDate: new Date().toISOString(),
        deliveryTimeSlot: 'Lunch',
        status: 'Pending'
      },
      {
        id: `mock-${orderId}-2`,
        menuItem: {
          product: { name: 'Vegetable Curry' },
          price: 150
        },
        quantity: 2,
        deliveryDate: new Date().toISOString(),
        deliveryTimeSlot: 'Dinner',
        status: 'Completed'
      }
    ];
    
    setDeliveryItems(prev => ({
      ...prev,
      [orderId]: mockItems
    }));
  };

  // Function to check current user authentication
  const checkUserAuth = async () => {
    try {
      const response = await axiosInstance.get('/seller/profile');
      return response.data;
    } catch (error) {
      return null;
    }
  };





  // Filter delivery items based on selected filters
  const getFilteredDeliveryItems = (items, orderId) => {
    if (!items || items.length === 0) return [];
    
    return items.filter(item => {
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const itemDate = new Date(item.deliveryDate);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        switch (filters.dateRange) {
          case 'today':
            if (itemDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'tomorrow':
            if (itemDate.toDateString() !== tomorrow.toDateString()) return false;
            break;
          case 'thisWeek':
            if (itemDate < today || itemDate > nextWeek) return false;
            break;
          case 'nextWeek':
            const nextWeekEnd = new Date(nextWeek);
            nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
            if (itemDate < nextWeek || itemDate > nextWeekEnd) return false;
            break;
        }
      }
      
      // Time slot filter
      if (filters.timeSlot !== 'all' && item.deliveryTimeSlot !== filters.timeSlot) {
        return false;
      }
      
      return true;
    });
  };

  // Filter orders based on selected filters
  const getFilteredOrders = (seller) => {
    if (!seller.recentOrders || seller.recentOrders.length === 0) return [];
    
    const filteredOrders = seller.recentOrders.filter(order => {
      // Status filter
      if (orderFilters.status !== 'all' && order.status !== orderFilters.status) {
        return false;
      }
      
      // Date range filter
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
            if (orderDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'yesterday':
            if (orderDate.toDateString() !== yesterday.toDateString()) return false;
            break;
          case 'lastWeek':
            if (orderDate < lastWeek || orderDate > today) return false;
            break;
          case 'lastMonth':
            if (orderDate < lastMonth || orderDate > today) return false;
            break;
        }
      }
      
      // Seller filter
      if (orderFilters.seller !== 'all' && seller.id !== orderFilters.seller) {
        return false;
      }
      
      // Amount range filter
      if (orderFilters.amountRange !== 'all') {
        const amount = order.totalPrice || 0;
        switch (orderFilters.amountRange) {
          case '0-500':
            if (amount < 0 || amount > 500) return false;
            break;
          case '500-1000':
            if (amount < 500 || amount > 1000) return false;
            break;
          case '1000-2000':
            if (amount < 1000 || amount > 2000) return false;
            break;
          case '2000+':
            if (amount < 2000) return false;
            break;
        }
      }
      
      // Search filter
      if (orderFilters.search) {
        const searchTerm = orderFilters.search.toLowerCase();
        const searchableText = [
          order.id,
          order.customerName,
          order.customerPhone,
          order.customerEmail,
          order.status,
          seller.name,
          seller.email
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }
      
      // Payment status filter
      if (orderFilters.paymentStatus !== 'all') {
        const hasReceipt = order.paymentReceipt && order.paymentReceipt.length > 0;
        if (orderFilters.paymentStatus === 'paid' && !hasReceipt) return false;
        if (orderFilters.paymentStatus === 'unpaid' && hasReceipt) return false;
      }
      
      return true;
    });

    // Apply order limit if not showing all orders
    const showAll = showAllOrders[seller.id] || false;
    if (!showAll && filteredOrders.length > defaultOrderLimit) {
      return filteredOrders.slice(0, defaultOrderLimit);
    }
    
    return filteredOrders;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Generate TXT report
  const generateTxtReport = () => {
    let reportContent = 'JAYSKERALAHM - DELIVERY ORDERS REPORT\n';
    reportContent += '==========================================\n\n';
    reportContent += `Generated on: ${new Date().toLocaleString('en-IN')}\n`;
    reportContent += `Total Sellers: ${stats.totalSellers}\n`;
    reportContent += `Total Orders: ${stats.totalOrders}\n`;
    reportContent += `Total Revenue: ${formatCurrency(stats.totalRevenue)}\n\n`;

    sellers.forEach((seller, index) => {
      reportContent += `${index + 1}. SELLER: ${seller.name || seller.email}\n`;
      reportContent += `   Email: ${seller.email}\n`;
      reportContent += `   Phone: ${seller.phone || 'No phone'}\n`;
      reportContent += `   Company: ${seller.company || 'No company'}\n`;
      reportContent += `   Status: ${seller.status}\n`;
      reportContent += `   Orders: ${seller.orderCount || 0}\n`;
      reportContent += `   Revenue: ${formatCurrency(seller.totalRevenue || 0)}\n\n`;

      if (seller.recentOrders && seller.recentOrders.length > 0) {
        reportContent += '   ORDERS:\n';
        seller.recentOrders.forEach((order, orderIndex) => {
          reportContent += `   ${orderIndex + 1}. Order #${order.id.slice(-8)}\n`;
          reportContent += `      Customer: ${order.customerName || 'User'}\n`;
          reportContent += `      Phone: ${order.customerPhone || 'No phone'}\n`;
          reportContent += `      Email: ${order.customerEmail || 'No email'}\n`;
          reportContent += `      Amount: ${formatCurrency(order.totalPrice)}\n`;
          reportContent += `      Status: ${order.status}\n`;
          reportContent += `      Date: ${formatDate(order.createdAt)}\n\n`;
        });
      }
      reportContent += '----------------------------------------\n\n';
    });

    return reportContent;
  };

  // Generate Excel report (CSV format)
  const generateExcelReport = () => {
    let csvContent = 'Seller Name,Email,Phone,Company,Status,Order Count,Revenue,Customer Name,Customer Phone,Customer Email,Order ID,Order Amount,Order Status,Order Date\n';

    sellers.forEach((seller) => {
      if (seller.recentOrders && seller.recentOrders.length > 0) {
        seller.recentOrders.forEach((order) => {
          csvContent += `"${seller.name || seller.email}","${seller.email}","${seller.phone || 'No phone'}","${seller.company || 'No company'}","${seller.status}",${seller.orderCount || 0},"${formatCurrency(seller.totalRevenue || 0)}","${order.customerName || 'User'}","${order.customerPhone || 'No phone'}","${order.customerEmail || 'No email'}","${order.id.slice(-8)}","${formatCurrency(order.totalPrice)}","${order.status}","${formatDate(order.createdAt)}"\n`;
        });
      } else {
        // Seller with no orders
        csvContent += `"${seller.name || seller.email}","${seller.email}","${seller.phone || 'No phone'}","${seller.company || 'No company'}","${seller.status}",${seller.orderCount || 0},"${formatCurrency(seller.totalRevenue || 0)}","","","","","","",""\n`;
      }
    });

    return csvContent;
  };

  // Download TXT report
  const downloadTxtReport = () => {
    try {
      const reportContent = generateTxtReport();
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `delivery-orders-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('TXT report downloaded successfully!');
    } catch (error) {
      message.error('Failed to download TXT report');
      console.error('Error generating TXT report:', error);
    }
  };

  // Download Excel report (CSV)
  const downloadExcelReport = () => {
    try {
      const csvContent = generateExcelReport();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `delivery-orders-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Excel report (CSV) downloaded successfully!');
    } catch (error) {
      message.error('Failed to download Excel report');
      console.error('Error generating Excel report:', error);
    }
  };

  const getDeliveryItemStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const handleSellerClick = (seller) => {
    setSelectedSeller(seller);
    setShowSellerDetails(true);
  };

  const closeSellerDetails = () => {
    setShowSellerDetails(false);
    setSelectedSeller(null);
  };

  // Toggle showing orders table for a specific seller
  const toggleShowOrders = (sellerId) => {
    setShowOrdersForSeller(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }));
  };

  // Toggle showing all orders for a specific seller
  const toggleShowAllOrders = (sellerId) => {
    setShowAllOrders(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }));
  };

  const renderDeliveryItems = (order) => {
    const items = deliveryItems[order.id];
    
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <FiPackage className="mx-auto h-8 w-8 mb-2" />
          <p>No delivery items found for this order</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDeliveryItemStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.quantity}x {item.menuItem?.name || 'Unknown Item'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Delivery Date: {formatDate(item.deliveryDate)}</div>
                  <div>Time Slot: {item.deliveryTimeSlot || 'N/A'}</div>
                  <div>Price: ₹{item.menuItem?.price || 0}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {(item.status === 'Pending' || item.status === 'PENDING' || item.status === 'pending') && (
                  <button
                                                  onClick={() => handleCancelClick(item)}
                    disabled={cancellingItems.has(item.id)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      cancellingItems.has(item.id)
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {cancellingItems.has(item.id) ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Cancelling...
                      </div>
                    ) : (
                      'Cancel Item'
                    )}
                  </button>
                )}
                {(item.status === 'Completed' || item.status === 'COMPLETED' || item.status === 'completed') && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded">
                    Completed
                  </span>
                )}
                {(item.status === 'Cancelled' || item.status === 'CANCELLED' || item.status === 'cancelled') && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded">
                    🚫 Cancelled
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleCancelAllOrdersForSeller = async (sellerId) => {
    try {
      // Get all pending orders for this seller
      const seller = sellers.find(s => s.id === sellerId);
      if (!seller || !seller.recentOrders) {
        message.error('No orders found for this seller');
        return;
      }

      const pendingOrders = seller.recentOrders.filter(order => order.status === 'PENDING');
      if (pendingOrders.length === 0) {
        message.info('No pending orders to cancel for this seller');
        return;
      }

      // Show confirmation
      const confirmed = window.confirm(
        `Are you sure you want to cancel ALL ${pendingOrders.length} pending orders for ${seller.name || seller.email}?\n\nThis action cannot be undone and will cancel:\n• ${pendingOrders.length} orders\n• Total value: ${formatCurrency(pendingOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0))}`
      );

      if (!confirmed) {
        return;
      }

      // Cancel all pending orders
      message.loading(`Cancelling ${pendingOrders.length} orders...`, 0);
      
      const cancelPromises = pendingOrders.map(order => 
        axiosInstance.put(`/delivery-managers/orders/${order.id}/cancel`)
      );

      const results = await Promise.allSettled(cancelPromises);
      
      // Count successful and failed cancellations
      const successful = results.filter(result => result.status === 'fulfilled' && result.value?.data?.success).length;
      const failed = results.length - successful;

      message.destroy();

      if (successful > 0) {
        message.success(`Successfully cancelled ${successful} orders${failed > 0 ? ` (${failed} failed)` : ''}`);
        // Refresh the data
        fetchSellersData();
      } else {
        message.error(`Failed to cancel any orders. ${failed} orders failed.`);
      }

    } catch (error) {
      message.destroy();
      message.error('Failed to cancel orders. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonDeliveryManager />
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
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 sm:h-20 lg:h-24 bg-gray-800 border-b border-gray-700 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-8 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[calc(100%-2rem)]">
          <button
            onClick={() => navigate('/jkhm')}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            aria-label="Go back to home"
          >
            <FiArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <MdLocalShipping className="text-xl sm:text-2xl text-blue-500 flex-shrink-0" />
            <h1 className="text-sm sm:text-lg lg:text-xl font-bold truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
              {activeTab === 'sellers' ? 'Sellers' : activeTab === 'orders' ? 'Orders' : 'Analytics'} Dashboard
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {isSeller(roles) && (
            <button
              onClick={() => navigate('/jkhm/seller/customers')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
              title="Go to Customers List"
            >
              <MdStore className="w-4 h-4" />
              <span className="hidden sm:inline">Customers</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content with proper spacing for navbar */}
      <div className="pt-16 sm:pt-20 lg:pt-24"> {/* Add top padding to account for fixed navbar height */}
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden fixed top-20 sm:top-24 left-3 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-16 sm:top-20 lg:top-24 w-64 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] bg-gray-800 border-r border-gray-700 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white px-2">Navigation</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2 flex-1">
              <button
                onClick={() => {
                  setActiveTab('sellers');
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'sellers'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <MdStore className="text-lg" />
                <span>Sellers</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <FiShoppingBag className="text-lg" />
                <span>Orders</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <FiBarChart2 className="text-lg" />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('rootManagement');
                  setSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'rootManagement'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <FiActivity className="text-lg" />
                <span>Route & Management</span>
              </button>
            </nav>

            {/* Logout Button at Bottom */}
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setConfirmationModal({
                    visible: true,
                    itemId: 'logout',
                    title: 'Confirm Logout',
                    content: 'Are you sure you want to logout? This will end your current session.'
                  });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors bg-red-600 hover:bg-red-700 text-white font-medium"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="lg:ml-64 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 overflow-x-hidden max-w-full">
          {/* Mobile Backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Stats Cards - Only visible in Analytics tab */}
          {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium">Total Sellers</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalSellers}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-500/20 rounded-full flex-shrink-0">
                  <MdStore className="text-xl sm:text-2xl text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium">Orders Placed</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-500/20 rounded-full flex-shrink-0">
                  <FiShoppingBag className="text-xl sm:text-2xl text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium">Total Order Value</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-full flex-shrink-0">
                  <MdAttachMoney className="text-xl sm:text-2xl text-yellow-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-400 text-xs sm:text-sm font-medium">Active Sellers</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stats.activeSellers}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-500/20 rounded-full flex-shrink-0">
                  <FiTrendingUp className="text-xl sm:text-2xl text-green-500" />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Tab Content */}
          {activeTab === 'sellers' && (
            <>
          {/* Sellers Table */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6 sm:mb-8">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-700">
                  <h2 className="text-base sm:text-lg font-semibold text-white">Sellers List</h2>
                  <p className="text-gray-400 text-xs sm:text-sm">View sellers and the orders they're placing for users</p>
            </div>
            
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[400px]">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300  tracking-wider min-w-[200px]">
                      Seller
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300  tracking-wider min-w-[100px]">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300  tracking-wider min-w-[120px]">
                          Orders Placed
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300  tracking-wider min-w-[120px]">
                          Total Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {sellers.map((seller) => (
                    <tr 
                      key={seller.id} 
                      className="hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleSellerClick(seller)}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <MdStore className="text-white text-sm sm:text-lg" />
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-medium text-white truncate">
                              {seller.name || seller.email || 'Unknown Seller'}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400 truncate">
                              {seller.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          seller.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {seller.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                        {seller.orderCount || 0}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-white">
                            {formatCurrency(
                              seller.recentOrders && seller.recentOrders.length > 0
                                ? seller.recentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
                                : 0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Summary Row */}
                    <tfoot className="bg-gray-700">
                      <tr className="font-semibold">
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-white">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8">
                              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <MdStore className="text-white text-xs sm:text-sm" />
                              </div>
                            </div>
                            <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-semibold text-white">Total Summary</div>
                              <div className="text-xs text-blue-200">All Sellers Combined</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-white">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            stats.activeSellers > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {stats.activeSellers} Active
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-white font-bold">
                          {stats.totalOrders}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-green-400 font-bold">
                          {formatCurrency(
                            sellers.reduce((total, seller) => {
                              const sellerTotal = seller.recentOrders && seller.recentOrders.length > 0
                                ? seller.recentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
                                : 0;
                              return total + sellerTotal;
                            }, 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {sellers.length === 0 && (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <MdStore className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-400">No sellers found</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">Get started by adding some sellers to your platform.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              {/* Orders Filter Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Orders Management</h2>
                <button
                  onClick={() => setShowOrderFilters(!showOrderFilters)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <FiBarChart2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{showOrderFilters ? 'Hide Filters' : 'Show Filters'}</span>
                  <span className="sm:hidden">{showOrderFilters ? 'Hide' : 'Filters'}</span>
                </button>
              </div>

              {/* Orders Filter Section */}
              {showOrderFilters && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <h3 className="text-base sm:text-lg font-semibold text-white">Filter Orders</h3>
                    <button
                      onClick={() => setOrderFilters({
                        status: 'all',
                        dateRange: 'all',
                        seller: 'all',
                        amountRange: 'all',
                        search: '',
                        paymentStatus: 'all'
                      })}
                      className="px-3 py-1 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors self-start sm:self-auto"
                    >
                      Clear All
                    </button>
                  </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                  {/* Search Filter */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Order ID, Customer, Phone..."
                      value={orderFilters.search}
                      onChange={(e) => setOrderFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Status</label>
                    <select
                      value={orderFilters.status}
                      onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Payment_Confirmed">Payment Confirmed</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Date Range</label>
                    <select
                      value={orderFilters.dateRange}
                      onChange={(e) => setOrderFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="lastWeek">Last 7 Days</option>
                      <option value="lastMonth">Last 30 Days</option>
                    </select>
                  </div>
                  
                  {/* Seller Filter */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Seller</label>
                    <select
                      value={orderFilters.seller}
                      onChange={(e) => setOrderFilters(prev => ({ ...prev, seller: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Sellers</option>
                      {sellers.map(seller => (
                        <option key={seller.id} value={seller.id}>
                          {seller.name || seller.email || 'Unknown Seller'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Amount Range Filter */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Amount Range</label>
                    <select
                      value={orderFilters.amountRange}
                      onChange={(e) => setOrderFilters(prev => ({ ...prev, amountRange: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Amounts</option>
                      <option value="0-500">₹0 - ₹500</option>
                      <option value="500-1000">₹500 - ₹1,000</option>
                      <option value="1000-2000">₹1,000 - ₹2,000</option>
                      <option value="2000+">₹2,000+</option>
                    </select>
                  </div>
                  
                  {/* Payment Status Filter */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Payment Status</label>
                    <select
                      value={orderFilters.paymentStatus}
                      onChange={(e) => setOrderFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Payments</option>
                      <option value="paid">Paid (Has Receipt)</option>
                      <option value="unpaid">Unpaid (No Receipt)</option>
                    </select>
                  </div>
                </div>
                </div>
              )}

              {/* Orders Summary */}
              {(() => {
                const totalFilteredOrders = sellers.reduce((total, seller) => {
                  return total + getFilteredOrders(seller).length;
                }, 0);
                
                const totalOrders = sellers.reduce((total, seller) => {
                  return total + (seller.recentOrders ? seller.recentOrders.length : 0);
                }, 0);
                
                return (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-300">
                          Showing <span className="text-white font-semibold">{totalFilteredOrders}</span> of <span className="text-white font-semibold">{totalOrders}</span> orders
                        </div>
                        {Object.values(orderFilters).some(filter => filter !== 'all' && filter !== '') && (
                          <div className="text-xs text-blue-400">
                            Filters applied
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {totalFilteredOrders > 0 && (
                          <span>
                            Total Value: {formatCurrency(
                              sellers.reduce((total, seller) => {
                                return total + getFilteredOrders(seller).reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                              }, 0)
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Seller Orders for Users Section */}
              <div className="space-y-6">
                {sellers.map((seller) => {
                  const filteredOrders = getFilteredOrders(seller);
                  const hasOrders = seller.recentOrders && seller.recentOrders.length > 0;
                  const hasFilteredOrders = filteredOrders.length > 0;
                  
                  // Only show seller if they have orders OR if no filters are applied
                  const shouldShowSeller = hasOrders && (hasFilteredOrders || !Object.values(orderFilters).some(filter => filter !== 'all' && filter !== ''));
                  
                  if (!shouldShowSeller) return null;
                  
                  return (
                  <div key={seller.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-700 bg-gray-750">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <MdStore className="text-white text-lg" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {seller.name || seller.email || 'Unknown Seller'}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {(() => {
                                const filteredOrders = getFilteredOrders(seller);
                                const totalOrders = seller.recentOrders ? seller.recentOrders.length : 0;
                                const filteredCount = filteredOrders.length;
                                const filteredTotal = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                                
                                return (
                                  <>
                                    {filteredCount} of {totalOrders} orders • {formatCurrency(filteredTotal)}
                                    {Object.values(orderFilters).some(filter => filter !== 'all' && filter !== '') && (
                                      <span className="text-blue-400 ml-2">(filtered)</span>
                                    )}
                                  </>
                                );
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            seller.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {seller.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {(() => {
                      const showOrders = showOrdersForSeller[seller.id] || false;
                      const filteredOrders = getFilteredOrders(seller);
                      const totalFilteredOrders = seller.recentOrders ? seller.recentOrders.filter(order => {
                        // Apply the same filtering logic as getFilteredOrders but without the limit
                        if (orderFilters.status !== 'all' && order.status !== orderFilters.status) return false;
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
                              if (orderDate.toDateString() !== today.toDateString()) return false;
                              break;
                            case 'yesterday':
                              if (orderDate.toDateString() !== yesterday.toDateString()) return false;
                              break;
                            case 'lastWeek':
                              if (orderDate < lastWeek || orderDate > today) return false;
                              break;
                            case 'lastMonth':
                              if (orderDate < lastMonth || orderDate > today) return false;
                              break;
                          }
                        }
                        if (orderFilters.seller !== 'all' && seller.id !== orderFilters.seller) return false;
                        if (orderFilters.amountRange !== 'all') {
                          const amount = order.totalPrice || 0;
                          switch (orderFilters.amountRange) {
                            case '0-500':
                              if (amount < 0 || amount > 500) return false;
                              break;
                            case '500-1000':
                              if (amount < 500 || amount > 1000) return false;
                              break;
                            case '1000-2000':
                              if (amount < 1000 || amount > 2000) return false;
                              break;
                            case '2000+':
                              if (amount < 2000) return false;
                              break;
                          }
                        }
                        if (orderFilters.search) {
                          const searchTerm = orderFilters.search.toLowerCase();
                          const searchableText = [
                            order.id,
                            order.customerName,
                            order.customerPhone,
                            order.customerEmail,
                            order.status,
                            seller.name,
                            seller.email
                          ].join(' ').toLowerCase();
                          if (!searchableText.includes(searchTerm)) return false;
                        }
                        if (orderFilters.paymentStatus !== 'all') {
                          const hasReceipt = order.paymentReceipt && order.paymentReceipt.length > 0;
                          if (orderFilters.paymentStatus === 'paid' && !hasReceipt) return false;
                          if (orderFilters.paymentStatus === 'unpaid' && hasReceipt) return false;
                        }
                        return true;
                      }).length : 0;
                      const showAll = showAllOrders[seller.id] || false;
                      const hasMoreOrders = totalFilteredOrders > defaultOrderLimit;
                      
                      // If orders table is not shown, display a compact button to show orders
                      if (!showOrders) {
                        return (
                          <div className="text-center py-3">
                            <div className="flex items-center justify-center gap-3">
                              <FiShoppingBag className="h-5 w-5 text-gray-400" />
                              <span className="text-sm text-gray-400">
                                {totalFilteredOrders > 0 
                                  ? `${totalFilteredOrders} orders` 
                                  : 'No orders'
                                }
                              </span>
                              <button
                                onClick={() => toggleShowOrders(seller.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                              >
                                <FiEye className="w-3 h-3" />
                                Show
                              </button>
                            </div>
                          </div>
                        );
                      }
                      
                      return filteredOrders && filteredOrders.length > 0 ? (
                        <div>
                          {/* Orders Table Controls */}
                          <div className="mb-3 flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                              {hasMoreOrders ? (
                                <>Showing {filteredOrders.length} of {totalFilteredOrders}</>
                              ) : (
                                <>{filteredOrders.length} orders</>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Hide Orders Button */}
                              <button
                                onClick={() => toggleShowOrders(seller.id)}
                                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                              >
                                <FiEyeOff className="w-3 h-3" />
                                Hide
                              </button>
                              
                              {/* Show All Orders Button */}
                              {hasMoreOrders && (
                                <button
                                  onClick={() => toggleShowAllOrders(seller.id)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                                >
                                  {showAll ? (
                                    <>
                                      <FiEyeOff className="w-3 h-3" />
                                      Less
                                    </>
                                  ) : (
                                    <>
                                      <FiEye className="w-3 h-3" />
                                      All
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="overflow-x-auto max-w-full">
                          <table className="w-full min-w-[600px] sm:min-w-[700px] lg:min-w-[800px]">
                            <thead className="bg-gray-700">
                              <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">
                                  Order ID
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-48">
                                  Customer
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-28">
                                  Date
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24">
                                  Amount
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">
                                  Status
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">
                                  Receipt
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-32">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                              {filteredOrders.map((order) => (
                              <React.Fragment key={order.id}>
                                <tr className="hover:bg-gray-700 transition-colors">
                                  <td className="px-3 py-4 text-sm text-white">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleOrderExpand(order.id)}
                                        className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                                      >
                                        {expandedOrder === order.id ? '▼' : '▶'}
                                      </button>
                                      <span className="font-mono text-xs truncate">#{order.id.slice(-8)}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4">
                        <div className="flex items-center min-w-0">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                              <MdPerson className="text-white text-xs" />
                            </div>
                          </div>
                          <div className="ml-2 min-w-0 flex-1">
                            <div className="text-xs font-medium text-white truncate">
                              {order.customerName || 'User'}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              📱 {order.customerPhone || order.customerEmail || 'No contact'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-3 py-4 text-xs text-green-400 font-medium">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'Delivered' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : order.status === 'Payment_Confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'Confirmed'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-xs text-gray-400">
                        {/* Payment Receipt Column */}
                        {order.paymentReceipts && order.paymentReceipts.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {order.paymentReceipts.slice(0, 1).map((receipt, index) => (
                              <a
                                key={receipt.id}
                                href={`${import.meta.env.VITE_DEV_API_URL}${receipt.imageUrl || receipt.receiptUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                              >
                                <span>📄</span>
                                View
                              </a>
                            ))}
                            {order.paymentReceipts.length > 1 && (
                              <span className="text-xs text-gray-400">+{order.paymentReceipts.length - 1} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">No Receipt</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-xs text-gray-400">
                        <div className="flex flex-col gap-1">
                          {/* Cancel Order Button - Show for orders that can be cancelled */}
                          {(order.status === 'Pending' || order.status === 'Payment_Confirmed' || order.status === 'Confirmed') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to cancel order #${order.id.slice(-8)}?\n\nThis will cancel the entire order and all its delivery items.`)) {
                                  cancelOrder(order.id);
                                }
                              }}
                              disabled={cancellingOrder === order.id}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                cancellingOrder === order.id
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                              title="Cancel Entire Order"
                            >
                              {cancellingOrder === order.id ? (
                                <div className="flex items-center gap-1">
                                  <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white"></div>
                                  Cancel...
                                </div>
                              ) : (
                                'Cancel'
                              )}
                            </button>
                          )}
                          
                          {/* View Details Button */}
                          <button
                            onClick={() => handleOrderExpand(order.id)}
                            className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                          >
                            {expandedOrder === order.id ? 'Hide' : 'Details'}
                          </button>
                        </div>
                      </td>
                    </tr>
                                
                                {/* Expanded Order Details */}
                                {expandedOrder === order.id && (
                                  <tr className="bg-gray-700 border-t border-gray-600">
                                    <td colSpan="7" className="px-3 py-4">
                                      <div className="bg-gray-700 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                          <FiShoppingBag className="text-blue-400" />
                                          Order Details & Delivery Items
                                        </h4>
                                        
                                        {/* Delivery Items */}
                                        <div className="space-y-3">
                                          {/* Filter Controls */}
                                          <div className="bg-gray-600 rounded-lg p-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                              <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-300">Status:</label>
                                                <select
                                                  value={filters.status}
                                                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                                  className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
                                                >
                                                  <option value="all">All Status</option>
                                                  <option value="Pending">Pending</option>
                                                  <option value="Completed">Completed</option>
                                                  <option value="Cancelled">Cancelled</option>
                                                </select>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-300">Date:</label>
                                                <select
                                                  value={filters.dateRange}
                                                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                                                  className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
                                                >
                                                  <option value="all">All Dates</option>
                                                  <option value="today">Today</option>
                                                  <option value="tomorrow">Tomorrow</option>
                                                  <option value="thisWeek">This Week</option>
                                                  <option value="nextWeek">Next Week</option>
                                                </select>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-300">Time:</label>
                                                <select
                                                  value={filters.timeSlot}
                                                  onChange={(e) => setFilters(prev => ({ ...prev, timeSlot: e.target.value }))}
                                                  className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
                                                >
                                                  <option value="all">All Times</option>
                                                  <option value="Breakfast">Breakfast</option>
                                                  <option value="Lunch">Lunch</option>
                                                  <option value="Dinner">Dinner</option>
                                                </select>
                                              </div>
                                              
                                              <button
                                                onClick={() => setFilters({ status: 'all', dateRange: 'all', timeSlot: 'all' })}
                                                className="px-2 py-1 bg-gray-500 hover:bg-gray-400 text-white text-xs rounded transition-colors"
                                              >
                                                Clear Filters
                                              </button>
                                            </div>
                                          </div>
                                          
                                          {loadingItems[order.id] ? (
                                            <div className="space-y-3">
                                              {Array.from({ length: 3 }).map((_, index) => (
                                                <div key={index} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                                                  <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                                    <div className="flex-1 space-y-2">
                                                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                                                    </div>
                                                    <div className="w-20 h-6 bg-gray-700 rounded-full"></div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : deliveryItems[order.id] && deliveryItems[order.id].length > 0 ? (
                                            <div>
                                              {/* Filter Results Summary */}
                                              <div className="mb-3 text-xs text-gray-400">
                                                Showing {getFilteredDeliveryItems(deliveryItems[order.id], order.id).length} of {deliveryItems[order.id].length} delivery items
                                              </div>
                                              
                                              {/* Scrollable Delivery Items Container */}
                                              <div className={`space-y-2 ${
                                                getFilteredDeliveryItems(deliveryItems[order.id], order.id).length >= 5 
                                                  ? 'max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-600' 
                                                  : ''
                                              }`}>
                                                {getFilteredDeliveryItems(deliveryItems[order.id], order.id).map((item) => (
                                                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                      <div>
                                                        <div className="text-sm text-gray-400">
                                                          {new Date(item.deliveryDate).toLocaleDateString('en-IN')} - {item.deliveryTimeSlot}
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        item.status === 'Pending' 
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : item.status === 'Completed'
                                                          ? 'bg-green-100 text-green-800'
                                                          : item.status === 'Cancelled'
                                                          ? 'bg-red-100 text-red-800'
                                                          : 'bg-gray-100 text-gray-800'
                                                      }`}>
                                                        {item.status}
                                                      </span>
                                                      {(item.status === 'Pending' || item.status === 'PENDING' || item.status === 'pending') && (
                                                        <button
                                                          onClick={() => handleCancelClick(item)}
                                                          disabled={cancellingItems.has(item.id)}
                                                          className={`px-2 py-1 text-xs rounded transition-colors ${
                                                            cancellingItems.has(item.id)
                                                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                              : 'bg-red-600 hover:bg-red-700 text-white'
                                                          }`}
                                                        >
                                                          {cancellingItems.has(item.id) ? (
                                                            <div className="flex items-center gap-1">
                                                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                              Cancelling...
                                                            </div>
                                                          ) : (
                                                            'Cancel Item'
                                                          )}
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                              
                                              {/* No Results Message */}
                                              {getFilteredDeliveryItems(deliveryItems[order.id], order.id).length === 0 && (
                                                <div className="text-center py-4 text-gray-400 text-sm">
                                                  No delivery items match the selected filters.
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="text-center py-4">
                                              <p className="text-gray-400">No delivery items found for this order.</p>
                                              {/* Fallback: Show basic order info */}
                                              <div className="mt-3 p-3 bg-gray-600 rounded-lg text-left">
                                                <h5 className="text-sm font-medium text-white mb-2">Order Information</h5>
                                                <div className="space-y-1 text-xs">
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Order ID:</span>
                                                    <span className="text-white">#{order.id.slice(-8)}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Status:</span>
                                                    <span className="text-white">{order.status}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Total Amount:</span>
                                                    <span className="text-green-400">{formatCurrency(order.totalPrice)}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Order Date:</span>
                                                    <span className="text-white">{formatDate(order.createdAt)}</span>
                                                  </div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-gray-500">
                                                  <p className="text-xs text-gray-400">
                                                    Delivery items are being loaded. If this persists, please check the API connection.
                                                  </p>
                                                  <p className="text-xs text-gray-400 mt-1">
                                                    API Response: {deliveryItems[order.id] ? 'Data loaded' : 'No data available'}
                                                  </p>
                                                </div>
                                              </div>
                                              
                                              {/* Temporary: Show mock delivery items for demonstration */}
                                              <div className="mt-4 p-3 bg-gray-600 rounded-lg">
                                                <h6 className="text-sm font-medium text-white mb-2 text-center">📋 Sample Delivery Items (Mock Data)</h6>
                                                <div className="space-y-2">
                                                  <div className="flex items-center justify-between p-2 bg-gray-500 rounded">
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                      <span className="text-xs text-white">Chicken Biriyani</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs text-gray-300">Qty: 1 × ₹300</span>
                                                      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Pending</span>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center justify-between p-2 bg-gray-500 rounded">
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                      <span className="text-xs text-white">Vegetable Curry</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs text-gray-300">Qty: 2 × ₹150</span>
                                                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Completed</span>
                                                    </div>
                                                  </div>
                                                </div>
                                                <p className="text-xs text-gray-400 text-center mt-2">
                                                  This is sample data. Real delivery items will appear when the API is connected.
                                                </p>

                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Order Summary */}
                                        <div className="mt-4 pt-4 border-t border-gray-600">
                                          <div className="flex items-center justify-between text-lg font-semibold">
                                            <span className="text-gray-300">Total:</span>
                                            <span className="text-green-400">
                                              {formatCurrency(order.totalPrice)}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Quick Actions */}
                                        <div className="mt-4 flex items-center gap-3">
                                          {/* Removed Track Delivery, Mark Complete, and Update Status buttons */}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 sm:py-12 px-4">
                          <FiShoppingBag className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-400">No orders found</h3>
                          <p className="mt-1 text-xs sm:text-sm text-gray-500">
                            {Object.values(orderFilters).some(filter => filter !== 'all' && filter !== '') 
                              ? 'No orders match the selected filters.' 
                              : 'This seller hasn\'t placed any orders for users yet.'
                            }
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  );
                })}

            {sellers.length === 0 && (
              <div className="text-center py-8 sm:py-12 px-4">
                    <FiShoppingBag className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-400">No sellers found</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">Orders will appear here once sellers start placing orders for users.</p>
              </div>
            )}
          </div>
            </>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <>
              {/* Download Reports Section */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiDownload className="text-blue-400" />
                    Download Reports
                  </h3>
                  <div className="text-sm text-gray-400">
                    Get detailed reports of all orders and sellers
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={downloadTxtReport}
                    className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FiDownload className="text-lg" />
                    <div className="text-left">
                      <div className="font-semibold">Download TXT Report</div>
                      <div className="text-xs text-blue-200">Human-readable format</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={downloadExcelReport}
                    className="flex items-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FiDownload className="text-lg" />
                    <div className="text-left">
                      <div className="font-semibold">Download Excel Report</div>
                      <div className="text-xs text-green-200">CSV format for spreadsheets</div>
                    </div>
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <h4 className="text-sm font-medium text-white mb-2">Report Contents:</h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>• Seller information (name, email, phone, company, status)</div>
                    <div>• Order details (customer name, phone, email, amount, status, date)</div>
                    <div>• Revenue summaries and order counts</div>
                    <div>• Generated on: {new Date().toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Active Sellers</p>
                      <p className="text-xl font-bold text-green-400">{stats.activeSellers}</p>
                    </div>
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <FiTrendingUp className="text-lg text-green-500" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Sellers with Orders</p>
                      <p className="text-xl font-bold text-blue-400">
                        {sellers.filter(seller => seller.orderCount > 0).length}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <MdStore className="text-lg text-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Average Orders per Seller</p>
                      <p className="text-xl font-bold text-yellow-400">
                        {stats.totalSellers > 0 ? Math.round(stats.totalOrders / stats.totalSellers) : 0}
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-500/20 rounded-full">
                      <FiBarChart2 className="text-lg text-yellow-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Performance Metrics */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FiActivity className="text-blue-400" />
                      Performance Metrics
                    </h3>
                    <FiBarChart2 className="text-gray-400 text-xl" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">Active Sellers</span>
                      </div>
                      <span className="text-white font-semibold">{stats.activeSellers}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300">Sellers with Orders</span>
                      </div>
                      <span className="text-white font-semibold">{sellers.filter(seller => seller.orderCount > 0).length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300">Average Orders per Seller</span>
                      </div>
                      <span className="text-white font-semibold">
                        {stats.totalSellers > 0 ? Math.round(stats.totalOrders / stats.totalSellers) : 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-300">Total Order Value</span>
                      </div>
                      <span className="text-green-400 font-semibold">{formatCurrency(stats.totalRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Status Breakdown */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FiPieChart className="text-green-400" />
                      Order Status Breakdown
                    </h3>
                    <FiBarChart2 className="text-gray-400 text-xl" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300">Pending Orders</span>
                      </div>
                      <span className="text-yellow-400 font-semibold">
                        {sellers.flatMap(seller => seller.recentOrders || []).filter(order => order.status === 'PENDING').length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">Completed Orders</span>
                      </div>
                      <span className="text-green-400 font-semibold">
                        {sellers.flatMap(seller => seller.recentOrders || []).filter(order => order.status === 'COMPLETED').length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span className="text-gray-300">Cancelled Orders</span>
                      </div>
                      <span className="text-red-400 font-semibold">
                        {sellers.flatMap(seller => seller.recentOrders || []).filter(order => order.status === 'CANCELLED').length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300">Total Orders</span>
                      </div>
                      <span className="text-white font-semibold">{stats.totalOrders}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiTarget className="text-yellow-400" />
                    Top Performing Sellers
                  </h3>
                  <MdStore className="text-gray-400 text-xl" />
                </div>
                
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full min-w-[300px]">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Seller
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Orders
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Performance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {sellers
                        .filter(seller => seller.orderCount > 0)
                        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                        .slice(0, 5)
                        .map((seller, index) => (
                        <tr key={seller.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index === 0 && <span className="text-yellow-400 text-lg">🥇</span>}
                              {index === 1 && <span className="text-gray-400 text-lg">🥈</span>}
                              {index === 2 && <span className="text-orange-600 text-lg">🥉</span>}
                              {index > 2 && <span className="text-gray-500 text-sm">#{index + 1}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <MdStore className="text-white text-sm" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-white">
                                  {seller.name || seller.email || 'Unknown Seller'}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {seller.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                            {seller.orderCount || 0}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                            {formatCurrency(seller.totalRevenue)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min((seller.orderCount / Math.max(...sellers.filter(s => s.orderCount > 0).map(s => s.orderCount))) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400">
                                {Math.round((seller.orderCount / Math.max(...sellers.filter(s => s.orderCount > 0).map(s => s.orderCount))) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {sellers.filter(seller => seller.orderCount > 0).length === 0 && (
                  <div className="text-center py-8">
                    <FiTarget className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-400">No performance data</h3>
                    <p className="mt-1 text-sm text-gray-500">Performance metrics will appear once sellers start placing orders.</p>
                  </div>
                )}
              </div>

              {/* Revenue Trend Chart */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiTrendingUp className="text-green-400" />
                    Revenue Trend (This Month)
                  </h3>
                  <FiCalendar className="text-gray-400 text-xl" />
                </div>
                
                <div className="h-64 flex items-end justify-between gap-2">
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => {
                    const mockRevenue = [12000, 15000, 18000, 14000];
                    const maxRevenue = Math.max(...mockRevenue);
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="text-xs text-gray-400 mb-2">{week}</div>
                        <div 
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-500 hover:to-green-300"
                          style={{ height: `${(mockRevenue[index] / maxRevenue) * 200}px` }}
                        ></div>
                        <div className="text-xs text-gray-300 mt-2">{formatCurrency(mockRevenue[index])}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Root & Management Tab Content */}
          {activeTab === 'rootManagement' && (
            <>
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiActivity className="text-blue-400" />
                    Route & Management Dashboard
                  </h3>
                  <div className="flex items-center gap-3">
                    <FiTarget className="text-gray-400 text-xl" />
                  </div>
                </div>
                
                

                {/* Session Data Component */}
                <div className="mt-8">
                  <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-medium text-white flex items-center gap-2">
                        <FiBarChart2 className="text-blue-400" />
                        Delivery Data Monitor
                      </h4>
                      <div className="flex items-center gap-2">
                        {sessionData && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                            <span>📊</span>
                            <span>Data Available</span>
                          </div>
                        )}
                        <div className="p-2 bg-blue-500/20 rounded-full">
                          <FiActivity className="text-blue-400 text-lg" />
                        </div>
                      </div>
                    </div>
                    


                    {/* Session Data Display */}
                    {sessionData && (
                      <div className="mt-6 bg-gray-800 rounded-lg border border-gray-600 p-4">
                        <h5 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                          📊 Delivery Session Data Results
                        </h5>
                        




                        {/* New Comprehensive Delivery Data Table */}
                        {sessionData.data?.externalResponse?.data && (
                          <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden shadow-lg">
                            <div className="px-4 py-3 border-b border-gray-600 bg-gradient-to-r from-indigo-600 to-indigo-700">
                              <h6 className="text-base font-semibold text-white flex items-center gap-2">
                                <FiBarChart2 className="text-indigo-300" />
                                Complete Delivery Data Table
                                <span className="text-xs text-indigo-200 font-normal ml-2">
                                  ({filteredDeliveryData.length} of {sessionData.data.externalResponse.count || 0} delivery items)
                                </span>
                              </h6>
                            </div>
                            
                            {/* Search and Filter Controls */}
                            <div className="p-3 sm:p-4 bg-gray-600 border-b border-gray-500">
                              <div className="flex flex-col gap-3 sm:gap-4">
                                {/* Search Row */}
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder="Search by customer name, address, or order ID..."
                                    value={deliveryDataFilters.search}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    onChange={(e) => {
                                      setDeliveryDataFilters(prev => ({
                                        ...prev,
                                        search: e.target.value
                                      }));
                                    }}
                                  />
                                </div>
                                
                                {/* Filters Row */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                  {/* Date Filter */}
                                  <div className="flex gap-2">
                                    <div className="flex flex-col">
                                      <label className="text-xs text-gray-300 mb-1">Select Date</label>
                                      <input
                                        type="date"
                                        value={deliveryDataFilters.selectedDate}
                                        className="px-2 py-2 sm:px-3 sm:py-2 bg-gray-700 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                                        onChange={(e) => {
                                          setDeliveryDataFilters(prev => ({
                                            ...prev,
                                            selectedDate: e.target.value
                                          }));
                                        }}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Dropdown Filters */}
                                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                                    <select 
                                      value={deliveryDataFilters.session}
                                      className="px-2 py-2 sm:px-3 sm:py-1 bg-gray-700 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                                      onChange={(e) => {
                                        setDeliveryDataFilters(prev => ({
                                          ...prev,
                                          session: e.target.value
                                        }));
                                      }}
                                    >
                                      <option value="">All Sessions</option>
                                      <option value="Breakfast">Breakfast</option>
                                      <option value="Lunch">Lunch</option>
                                      <option value="Dinner">Dinner</option>
                                    </select>
                                    <select 
                                      value={deliveryDataFilters.status}
                                      className="px-2 py-2 sm:px-3 sm:py-1 bg-gray-700 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                                      onChange={(e) => {
                                        setDeliveryDataFilters(prev => ({
                                          ...prev,
                                          status: e.target.value
                                        }));
                                      }}
                                    >
                                      <option value="">All Statuses</option>
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Delivered">Delivered</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="max-h-96 overflow-y-auto">
                              {/* Desktop Table View */}
                              <div className="hidden lg:block">
                                <table className="w-full">
                                  <thead className="bg-gray-600 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        👤 Customer
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        📅 Delivery Date
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        🍽️ Session
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        📦 Quantity
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        📍 Address
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        📊 Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-gray-700 divide-y divide-gray-600">
                                    {filteredDeliveryData.map((item, index) => (
                                      <tr key={index} className="hover:bg-gray-600 transition-colors">
                                        {/* Customer Name */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8">
                                              <div className={`h-8 w-8 rounded-full flex items-center justify-center shadow-lg ${
                                                item.session === 'Breakfast' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                                item.session === 'Lunch' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                                                'bg-gradient-to-br from-purple-400 to-purple-600'
                                              }`}>
                                                <span className="text-white text-xs font-bold">
                                                  {item.first_name?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="ml-3">
                                              <div className="text-sm font-medium text-white">
                                                {item.first_name || 'Unknown'} {item.last_name || ''}
                                              </div>
                                              <div className="text-xs text-gray-400">
                                                {item.whatsapp_number || 'No WhatsApp'}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        
                                        {/* Delivery Date */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="text-sm text-white">
                                            {new Date(item.delivery_date).toLocaleDateString('en-US', {
                                              weekday: 'short',
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </div>
                                        </td>
                                        
                                        {/* Session */}
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            item.session === 'Breakfast' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                            item.session === 'Lunch' ? 'bg-green-100 text-green-800 border border-green-200' :
                                            'bg-purple-100 text-purple-800 border border-purple-200'
                                          }`}>
                                            {item.session || 'Unknown'}
                                          </span>
                                        </td>
                                        
                                        {/* Quantity */}
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                            {item.quantity || 0}
                                          </span>
                                        </td>
                                        
                                        {/* Address */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          <div className="max-w-xs">
                                            <div className="text-sm text-white truncate" title={item.street}>
                                              {item.street || 'No address'}
                                            </div>
                                            {item.geo_location && (
                                              <div className="text-xs text-gray-400 mt-1">
                                                📍 {item.geo_location}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        
                                        {/* Status */}
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                            item.status === 'Delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                            item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                            item.status === 'Cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                            'bg-gray-100 text-gray-800 border border-gray-200'
                                          }`}>
                                            {item.status || 'Unknown'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Mobile Card View */}
                              <div className="lg:hidden space-y-3">
                                {filteredDeliveryData.map((item, index) => (
                                  <div key={index} className="bg-gray-600 rounded-lg p-4 border border-gray-500">
                                    {/* Customer Header */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-lg ${
                                          item.session === 'Breakfast' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                          item.session === 'Lunch' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                                          'bg-gradient-to-br from-purple-400 to-purple-600'
                                        }`}>
                                          <span className="text-white text-sm font-bold">
                                            {item.first_name?.charAt(0)?.toUpperCase() || 'U'}
                                          </span>
                                        </div>
                                        <div className="ml-3">
                                          <div className="text-sm font-medium text-white">
                                            {item.first_name || 'Unknown'} {item.last_name || ''}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {item.whatsapp_number || 'No WhatsApp'}
                                          </div>
                                        </div>
                                      </div>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                        item.status === 'Delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                        item.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                        item.status === 'Cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                        'bg-gray-100 text-gray-800 border border-gray-200'
                                      }`}>
                                        {item.status || 'Unknown'}
                                      </span>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div>
                                        <div className="text-gray-400 mb-1">📅 Delivery Date</div>
                                        <div className="text-white">
                                          {new Date(item.delivery_date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-gray-400 mb-1">🍽️ Session</div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          item.session === 'Breakfast' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                          item.session === 'Lunch' ? 'bg-green-100 text-green-800 border border-green-200' :
                                          'bg-purple-100 text-purple-800 border border-purple-200'
                                        }`}>
                                          {item.session || 'Unknown'}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="text-gray-400 mb-1">📦 Quantity</div>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                          {item.quantity || 0}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="text-gray-400 mb-1">📍 Address</div>
                                        <div className="text-white truncate">
                                          {item.street || 'No address'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Full Address (if truncated) */}
                                    {item.street && item.street.length > 30 && (
                                      <div className="mt-2 pt-2 border-t border-gray-500">
                                        <div className="text-gray-400 text-xs mb-1">📍 Full Address</div>
                                        <div className="text-white text-xs">{item.street}</div>
                                        {item.geo_location && (
                                          <div className="text-xs text-gray-400 mt-1">
                                            📍 {item.geo_location}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}


                      </div>
                    )}
                  </div>
                </div>

                {/* Route Planning Component */}
                {/* Active Executives Management */}
                <div className="mt-6">
                  <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-medium text-white flex items-center gap-2">
                        <FiUsers className="text-blue-400" />
                        👥 Active Executives Management
                      </h4>
                      <div className="p-2 bg-blue-500/20 rounded-full">
                        <FiUsers className="text-blue-400 text-lg" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-4">
                      <button
                        onClick={handleFetchActiveExecutives}
                        disabled={loadingActiveExecutives || isRefetchingActiveExecutives}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 disabled:transform-none"
                      >
                        {loadingActiveExecutives || isRefetchingActiveExecutives ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Fetching Active Executives...
                          </>
                        ) : (
                          <>
                            <FiUsers className="text-lg" />
                            👥 Fetch Active Executives
                          </>
                        )}
                      </button>
                      
                      {activeExecutives.length > 0 && (
                        <div className="text-center space-y-3">
                          <p className="text-green-400 text-sm font-medium">
                            ✅ {activeExecutives.length} active executives loaded
                          </p>
                          <button
                            onClick={() => {
                              setShowActiveExecutivesTable(!showActiveExecutivesTable);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                          >
                            {showActiveExecutivesTable ? (
                              <>
                                <FiEyeOff className="w-4 h-4" />
                                Hide Table
                              </>
                            ) : (
                              <>
                                <FiEye className="w-4 h-4" />
                                Show Table
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Active Executives Table */}
                {showActiveExecutivesTable && activeExecutives && activeExecutives.length > 0 && (
                  <div className="mt-6">
                    <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-white flex items-center gap-2">
                          <FiUsers className="text-blue-400" />
                          Active Executives ({activeExecutives.length})
                        </h4>
                        <div className="flex items-center gap-3">
                          {Object.keys(executivesStatus).length > 0 && (
                            <button
                              onClick={handleSaveStatusChanges}
                              disabled={updateExecutiveStatusMutation.isPending}
                              className={`px-4 py-2 text-white text-sm rounded-lg transition-colors flex items-center gap-2 ${
                                updateExecutiveStatusMutation.isPending
                                  ? 'bg-gray-500 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              <FiCheckCircle className="w-4 h-4" />
                              {updateExecutiveStatusMutation.isPending ? 'Saving...' : `Save Changes (${Object.keys(executivesStatus).length})`}
                            </button>
                          )}
                          <button
                            onClick={() => setShowActiveExecutivesTable(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-gray-700 z-10">
                            <tr className="border-b border-gray-600">
                              <th className="text-left py-3 px-4 text-gray-300 font-medium">No.</th>
                              <th className="text-left py-3 px-4 text-gray-300 font-medium">Name</th>
                              <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                              <th className="text-left py-3 px-4 text-gray-300 font-medium">WhatsApp</th>
                              <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              try {
                                // Test row to ensure table is rendering
                                if (activeExecutives.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan="5" className="py-8 text-center text-gray-400">
                                        No executives found
                                      </td>
                                    </tr>
                                  );
                                }
                                
                                return activeExecutives.map((executive, index) => {
                                  // Add error handling for each executive
                                  if (!executive) return null;
                                  
                                  return (
                                    <tr key={executive.user_id || executive.id || index} className="border-b border-gray-600 hover:bg-gray-600/50 transition-colors">
                                      <td className="py-3 px-4 text-gray-300 font-bold text-center bg-gray-600/30">
                                        {index + 1 || 'N/A'}
                                      </td>
                                      <td className="py-3 px-4 text-white font-medium">
                                        {executive.exec_name || executive.name || 'N/A'}
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          (executivesStatus[executive.user_id] || executive.status) === 'ACTIVE' 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-600 text-gray-300'
                                        }`}>
                                          {executivesStatus[executive.user_id] || executive.status || 'UNKNOWN'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-gray-300">
                                        {executive.whatsapp_number ? (
                                          <a 
                                            href={`https://wa.me/${executive.whatsapp_number.replace('+', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                          >
                                            <FiMessageCircle className="w-4 h-4" />
                                            {executive.whatsapp_number}
                                          </a>
                                        ) : (
                                          <span className="text-gray-500">No WhatsApp</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-4">
                                        <button
                                          onClick={() => handleToggleExecutiveStatus(executive.user_id || executive.id, executivesStatus[executive.user_id] || executive.status)}
                                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                            (executivesStatus[executive.user_id] || executive.status) === 'ACTIVE'
                                              ? 'bg-red-600 text-white hover:bg-red-700'
                                              : 'bg-green-600 text-white hover:bg-green-700'
                                          }`}
                                        >
                                          {(executivesStatus[executive.user_id] || executive.status) === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                });
                              } catch (error) {
                                console.error('Error rendering executives table:', error);
                                return (
                                  <tr>
                                    <td colSpan="5" className="py-8 text-center text-red-400">
                                      Error rendering table: {error.message}
                                    </td>
                                  </tr>
                                );
                              }
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* <div className="mt-6">
                  <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-medium text-white flex items-center gap-2">
                        <FiMapPin className="text-green-400" />
                        Route Planning System
                      </h4>
                      <div className="flex items-center gap-2">
                        {routePlanningResults && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                            <span>✅</span>
                            <span>Ready</span>
                          </div>
                        )}
                        <div className="p-2 bg-green-500/20 rounded-full">
                          <FiTarget className="text-green-400 text-lg" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-4">
                      <button
                        onClick={() => handleRunRoutePlanning()}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                      >
                        <FiActivity className="text-lg" />
                        🚀 Run Route Planning
                      </button>
                    </div>
                  </div>
                </div> */}


                {/* Delivery Executive Information - Always Visible */}
                <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <MdLocalShipping className="text-blue-400" />
                    🚚 Delivery Executive Information
                  </h4>
                  

                  {/* Assign Executives Button */}
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h5 className="text-md font-medium text-white mb-4">📋 Assign Executives for Route Planning:</h5>
                    
                    <button
                      onClick={() => setShowExecutiveAssignModal(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      <span className="text-xl">👥</span>
                      <span>Assign Executives for Route Planning</span>
                    </button>
                  </div>

                  {/* Run Program Button - Shows after executive assignment */}
                  {showRunProgramButton && assignedExecutiveCount > 0 && (
                    <div className="mt-6 bg-gray-700 p-4 rounded-lg border border-gray-600">
                      <h5 className="text-md font-medium text-white mb-4">⚡ Run Program with Assigned Executives:</h5>
                      
                      <button
                        onClick={handleRunProgram}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                      >
                        <span className="text-xl">🚀</span>
                        <span>Run Program With {assignedExecutiveCount} Executives</span>
                      </button>
                      
                      <div className="mt-3 text-xs text-gray-400 text-center">
                        This will send the executive count to the API and run the program with {assignedExecutiveCount} executive(s).
                      </div>
                    </div>
                  )}



                </div>
              </div>

              {/* Route Planning Results - Displayed Below Executive Info */}
              {routePlanningResults && (
                <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <FiPackage className="text-green-400" />
                    🚀 Route Planning Results
                  </h4>

                  {/* Generated Files Grid */}
                  {routePlanningResults.data?.externalResponse?.data?.files && (
                    <div className="mb-6">
                      <h5 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                        📁 Generated Route Files
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {routePlanningResults.data.externalResponse.data.files.map((file, index) => (
                          <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h6 className="font-medium text-white mb-1">{file.file}</h6>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    file.ready 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {file.ready ? '✅ Ready' : '⏳ Processing'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {file.file.includes('map') ? '🗺️ Interactive Map' : '📋 Route Plan'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {file.file.includes('map') ? (
                                <button
                                  onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                                  title="Open interactive map in new tab"
                                >
                                  <span>🗺️</span>
                                  Open Interactive Map
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDownloadFile(file.url, file.file)}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                                  title="Download route plan file"
                                >
                                  <span>📥</span>
                                  Download Route Plan
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                                title="Open file in new tab"
                              >
                                <span>🔗</span>
                                Open in New Tab
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text File Previews */}
                  {routePlanningResults.data?.externalResponse?.data?.files && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-md font-semibold text-white flex items-center gap-2">
                          📖 Route Plan Previews
                        </h5>
                        <button
                          onClick={() => {
                            // Clear existing previews and reload
                            setFilePreviews({});
                            setLoadingPreviews({});
                            const textFiles = routePlanningResults.data.externalResponse.data.files.filter(file => file.file.includes('.txt'));
                            textFiles.forEach(file => {
                              setTimeout(() => fetchFilePreview(file.url, file.file), 500);
                            });
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-2"
                        >
                          🔄 Refresh Previews
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {routePlanningResults.data.externalResponse.data.files
                          .filter(file => file.file.includes('.txt'))
                          .map((file, index) => (
                            <div key={index} className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
                              <div className="bg-gray-600 px-4 py-3 border-b border-gray-500">
                                <div className="flex items-center justify-between">
                                  <h6 className="font-medium text-white">{file.file}</h6>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleDownloadFile(file.url, file.file)}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                    >
                                      📥 Download
                                    </button>
                                    <button
                                      onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                    >
                                      🔗 Open Full
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Text File Preview */}
                              <div className="p-4">
                                <div className="bg-gray-800 rounded border border-gray-600 p-4 max-h-96 overflow-y-auto">
                                  <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                    {/* Show preview content or loading state */}
                                    {!filePreviews[file.file] && !loadingPreviews[file.file] ? (
                                      <div className="text-center py-4">
                                        <p className="text-gray-400 mb-3">Preview not loaded yet</p>
                                        <button
                                          onClick={() => fetchFilePreview(file.url, file.file)}
                                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                        >
                                          🔍 Load Preview
                                        </button>
                                      </div>
                                    ) : loadingPreviews[file.file] ? (
                                      <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                        <p className="text-gray-400">Loading preview...</p>
                                      </div>
                                    ) : (
                                      <div>
                                        {/* Content Display Controls */}
                                        {filePreviews[file.file] && !filePreviews[file.file].includes('⚠️') && !filePreviews[file.file].includes('❌') && (
                                          <div className="flex items-center justify-between mb-3 p-2 bg-gray-700 rounded border border-gray-600">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-400">
                                                {showFullContent[file.file] ? '📖 Full Content' : '👁️ Preview Mode'}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                ({filePreviews[file.file].length} characters)
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => toggleContentDisplay(file.file)}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                              >
                                                {showFullContent[file.file] ? '👁️ Show Preview' : '📖 Show Full'}
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Content Display */}
                                        <div className="text-xs text-gray-300 leading-relaxed">
                                          {getDisplayContent(file.file, filePreviews[file.file])}
                                        </div>
                                        
                                        {/* Error Messages and Help */}
                                        {filePreviews[file.file] && filePreviews[file.file].includes('⚠️ CORS restriction') && (
                                          <div className="mt-3 pt-2 border-t border-gray-600">
                                            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
                                              <p className="text-xs text-yellow-300 mb-2">
                                                <span className="font-medium">CORS Issue Detected:</span> Browser cannot directly access external files.
                                              </p>
                                              <div className="text-xs text-yellow-400 space-y-1">
                                                <div>• Use "Open Full" to view complete content</div>
                                                <div>• Use "Download" to save file locally</div>
                                                <div>• Preview will be available after download</div>
                                              </div>
                                              <div className="mt-3 pt-2 border-t border-yellow-700/30">
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => fetchFilePreview(file.url, file.file)}
                                                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                                                  >
                                                    🔄 Retry Preview
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                                  >
                                                    🔗 View Full Content
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {filePreviews[file.file] && filePreviews[file.file].includes('❌ Error') && (
                                          <div className="mt-3 pt-2 border-t border-gray-600">
                                            <div className="bg-red-900/20 border border-red-700/30 rounded p-3">
                                              <p className="text-xs text-red-300 mb-2">
                                                <span className="font-medium">Preview Failed:</span> Unable to load file content.
                                              </p>
                                              <div className="text-xs text-red-400 space-y-1">
                                                <div>• Check your internet connection</div>
                                                <div>• Try "Open Full" button instead</div>
                                                <div>• Contact support if issue persists</div>
                                              </div>
                                              <div className="mt-3 pt-2 border-t border-red-700/30">
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => fetchFilePreview(file.url, file.file)}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                                  >
                                                    🔄 Retry Preview
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                                  >
                                                    🔗 View Full Content
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {filePreviews[file.file] && !filePreviews[file.file].includes('⚠️') && !filePreviews[file.file].includes('❌') && filePreviews[file.file].length > 500 && (
                                          <div className="mt-3 pt-2 border-t border-gray-600">
                                            <div className="bg-blue-900/20 border border-blue-700/30 rounded p-3">
                                              <p className="text-xs text-blue-300 mb-2">
                                                <span className="font-medium">Content Available:</span> 
                                                {showFullContent[file.file] ? ' Showing complete file content.' : ' Showing preview (first 500 characters).'}
                                              </p>
                                              <div className="text-xs text-blue-400 space-y-1">
                                                <div>• Use toggle button above to switch between preview and full content</div>
                                                <div>• Use "Download" to save file locally</div>
                                                <div>• Use "Open Full" to view in new tab</div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* File Categories Summary */}
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h5 className="font-medium text-white mb-3">📊 File Summary:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-600 rounded border border-gray-500">
                        <div className="text-2xl mb-2">🗺️</div>
                        <div className="font-medium text-white">Interactive Maps</div>
                        <div className="text-gray-300">
                          {routePlanningResults.data?.externalResponse?.data?.files?.filter(f => f.file.includes('map')).length || 0} files
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-600 rounded border border-gray-500">
                        <div className="text-2xl mb-2">📋</div>
                        <div className="font-medium text-white">Route Plans</div>
                        <div className="text-gray-300">
                          {routePlanningResults.data?.externalResponse?.data?.files?.filter(f => f.file.includes('.txt')).length || 0} files
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-600 rounded border border-gray-500">
                        <div className="text-2xl mb-2">⚡</div>
                        <div className="font-medium text-white">Total Files</div>
                        <div className="text-gray-300">
                          {routePlanningResults.data?.externalResponse?.data?.files?.length || 0} generated
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Route History Manager */}
              <RouteHistoryManager
                ref={routeHistoryManagerRef}
                onSaveRoute={handleSaveRoutes}
                onClearHistory={() => {
                  // Optional cleanup - can add any cleanup logic here
                }}
                showSuccessToast={showSuccessToast}
                showErrorToast={showErrorToast}
              />

              {/* Program Execution Results - Displayed Below Route Planning Results */}
              {false && programExecutionResults && (
                <div className="mt-4 bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                    <FiPackage className="text-blue-400" />
                    🚀 Program Execution Results
                  </h4>

                  {/* Compact Execution Summary */}
                  <div className="mb-3 bg-gray-700 p-2 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <span className="text-lg">👥</span>
                          <span className="text-gray-300">Drivers:</span>
                          <span className="text-white font-medium">{programExecutionResults.data?.numDrivers || 0}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-lg">✅</span>
                          <span className="text-gray-300">Status:</span>
                          <span className="text-white font-medium">{programExecutionResults.data?.status || 'Completed'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Route Execution Results */}
                  {programExecutionResults.data?.externalResponse?.executionResult && (
                    <div className="mb-3 bg-gray-700 p-2 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <span className="text-orange-400">🌅</span>
                            <span className="text-gray-300">Breakfast:</span>
                            <span className="text-white font-medium">{programExecutionResults.data.externalResponse.executionResult.breakfast?.length || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-yellow-400">☀️</span>
                            <span className="text-gray-300">Lunch:</span>
                            <span className="text-white font-medium">{programExecutionResults.data.externalResponse.executionResult.lunch?.length || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-blue-400">🌙</span>
                            <span className="text-gray-300">Dinner:</span>
                            <span className="text-white font-medium">{programExecutionResults.data.externalResponse.executionResult.dinner?.length || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Route Planning Data Table */}
                  {programExecutionResults.data?.externalResponse?.result && (
                    <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-lg">
                      <h5 className="font-semibold text-gray-800 mb-3 text-base">📋 Route Planning Details</h5>
                      
                      {/* Date Display */}
                      {programExecutionResults.data.externalResponse.result[routeTableTab] && 
                       programExecutionResults.data.externalResponse.result[routeTableTab].length > 0 && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">📅</span>
                            <span className="text-sm font-medium text-blue-800">
                              Delivery Date: {programExecutionResults.data.externalResponse.result[routeTableTab][0]?.Date || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Tabs for different meal types */}
                      <div className="mb-3">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700">Meal Type:</label>
                          <select
                            value={routeTableTab}
                            onChange={(e) => setRouteTableTab(e.target.value)}
                            className="px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                              const data = programExecutionResults.data.externalResponse.result[mealType];
                              if (!data || data.length === 0) return null;
                              
                              return (
                                <option key={mealType} value={mealType}>
                                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)} ({data.length})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Filter Section */}
                      {programExecutionResults.data.externalResponse.result[routeTableTab] && (
                        <div className="mb-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <h6 className="text-xs font-semibold text-gray-700 mb-2">🔍 Filter Routes</h6>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Name</label>
                              <input
                                type="text"
                                placeholder="Search by name..."
                                value={routeTableFilters.deliveryName}
                                onChange={(e) => setRouteTableFilters(prev => ({ ...prev, deliveryName: e.target.value }))}
                                className="w-full px-2 py-1.5 text-xs text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Executive</label>
                              <input
                                type="text"
                                placeholder="Search by executive..."
                                value={routeTableFilters.executive}
                                onChange={(e) => setRouteTableFilters(prev => ({ ...prev, executive: e.target.value }))}
                                className="w-full px-2 py-1.5 text-xs text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                              <input
                                type="text"
                                placeholder="Search by location..."
                                value={routeTableFilters.location}
                                onChange={(e) => setRouteTableFilters(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full px-2 py-1.5 text-xs text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <button
                              onClick={() => setRouteTableFilters({
                                deliveryName: '',
                                executive: '',
                                location: ''
                              })}
                              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                            >
                              Clear All Filters
                            </button>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const filteredData = programExecutionResults.data.externalResponse.result[routeTableTab].filter(item => {
                                  const deliveryNameMatch = !routeTableFilters.deliveryName || 
                                    (item.Delivery_Name && item.Delivery_Name.toLowerCase().includes(routeTableFilters.deliveryName.toLowerCase()));
                                  const executiveMatch = !routeTableFilters.executive || 
                                    (item.Executive && item.Executive.toLowerCase().includes(routeTableFilters.executive.toLowerCase()));
                                  const locationMatch = !routeTableFilters.location || 
                                    (item.Location && item.Location.toLowerCase().includes(routeTableFilters.location.toLowerCase()));
                                  
                                  return deliveryNameMatch && executiveMatch && locationMatch;
                                });
                                return `Showing ${filteredData.length} of ${programExecutionResults.data.externalResponse.result[routeTableTab].length} routes`;
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Table for selected meal type */}
                      {programExecutionResults.data.externalResponse.result[routeTableTab] && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Stop #</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Delivery Name</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Executive</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Location</th>
                                  <th className="text-center py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Packages</th>
                                  <th className="text-center py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Distance (km)</th>
                                  <th className="text-center py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Time (min)</th>
                                  <th className="text-center py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Map Link</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(() => {
                                  const filteredData = programExecutionResults.data.externalResponse.result[routeTableTab].filter(item => {
                                    const deliveryNameMatch = !routeTableFilters.deliveryName || 
                                      (item.Delivery_Name && item.Delivery_Name.toLowerCase().includes(routeTableFilters.deliveryName.toLowerCase()));
                                    const executiveMatch = !routeTableFilters.executive || 
                                      (item.Executive && item.Executive.toLowerCase().includes(routeTableFilters.executive.toLowerCase()));
                                    const locationMatch = !routeTableFilters.location || 
                                      (item.Location && item.Location.toLowerCase().includes(routeTableFilters.location.toLowerCase()));
                                    
                                    return deliveryNameMatch && executiveMatch && locationMatch;
                                  });
                                  
                                  return filteredData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                                      <td className="py-3 px-4 text-gray-900 font-medium text-sm">
                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                          {item.Stop_No || '-'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-gray-900 font-semibold text-sm">
                                        <div className="max-w-xs truncate" title={item.Delivery_Name}>
                                          {item.Delivery_Name || '-'}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          item.Executive === 'Unassigned' || !item.Executive
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          {item.Executive || 'Unassigned'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-gray-700 text-sm">
                                        <div className="max-w-xs truncate" title={item.Location}>
                                          {item.Location || '-'}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-center text-gray-900 font-semibold text-sm">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                                          {item.Packages || '-'}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-center text-gray-700 text-sm">
                                        {item.Distance_From_Prev_Stop_km ? (
                                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                                            {item.Distance_From_Prev_Stop_km} km
                                          </span>
                                        ) : '-'}
                                      </td>
                                      <td className="py-3 px-4 text-center text-gray-700 text-sm">
                                        {item.Leg_Time_min ? (
                                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                                            {item.Leg_Time_min} min
                                          </span>
                                        ) : '-'}
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        {item.Map_Link ? (
                                          <a
                                            href={item.Map_Link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                                          >
                                            <FiMapPin className="w-3 h-3 mr-1" />
                                            View Route
                                          </a>
                                        ) : (
                                          <span className="text-gray-400 text-sm">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                          {/* Table Footer with Summary */}
                          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-lg">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center space-x-4">
                                <span className="font-medium">
                                  {(() => {
                                    const filteredData = programExecutionResults.data.externalResponse.result[routeTableTab].filter(item => {
                                      const deliveryNameMatch = !routeTableFilters.deliveryName || 
                                        (item.Delivery_Name && item.Delivery_Name.toLowerCase().includes(routeTableFilters.deliveryName.toLowerCase()));
                                      const executiveMatch = !routeTableFilters.executive || 
                                        (item.Executive && item.Executive.toLowerCase().includes(routeTableFilters.executive.toLowerCase()));
                                      const locationMatch = !routeTableFilters.location || 
                                        (item.Location && item.Location.toLowerCase().includes(routeTableFilters.location.toLowerCase()));
                                      
                                      return deliveryNameMatch && executiveMatch && locationMatch;
                                    });
                                    return `Showing ${filteredData.length} of ${programExecutionResults.data.externalResponse.result[routeTableTab].length} routes`;
                                  })()}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>
                                  {(() => {
                                    const filteredData = programExecutionResults.data.externalResponse.result[routeTableTab].filter(item => {
                                      const deliveryNameMatch = !routeTableFilters.deliveryName || 
                                        (item.Delivery_Name && item.Delivery_Name.toLowerCase().includes(routeTableFilters.deliveryName.toLowerCase()));
                                      const executiveMatch = !routeTableFilters.executive || 
                                        (item.Executive && item.Executive.toLowerCase().includes(routeTableFilters.executive.toLowerCase()));
                                      const locationMatch = !routeTableFilters.location || 
                                        (item.Location && item.Location.toLowerCase().includes(routeTableFilters.location.toLowerCase()));
                                      
                                      return deliveryNameMatch && executiveMatch && locationMatch;
                                    });
                                    
                                    const totalPackages = filteredData.reduce((sum, item) => sum + (parseInt(item.Packages) || 0), 0);
                                    const totalDistance = filteredData.reduce((sum, item) => sum + (parseFloat(item.Distance_From_Prev_Stop_km) || 0), 0);
                                    const totalTime = filteredData.reduce((sum, item) => sum + (parseInt(item.Leg_Time_min) || 0), 0);
                                    
                                    return `Total: ${totalPackages} packages • ${totalDistance.toFixed(1)} km • ${totalTime} min`;
                                  })()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Last updated: {new Date().toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Excel Files Generated */}
                  {programExecutionResults.data?.externalResponse?.excel_files && 
                   programExecutionResults.data.externalResponse.excel_files.length > 0 && (
                    <div className="mb-6 bg-gray-700 p-4 rounded-lg border border-gray-600">
                      <h5 className="font-medium text-white mb-3">📊 Excel Files Generated:</h5>
                      <div className="space-y-2">
                        {programExecutionResults.data.externalResponse.excel_files.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="text-green-400">📄</span>
                            <span className="font-mono">{file}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated Files (if any) */}
                  {programExecutionResults.data?.externalResponse?.data?.files && (
                    <div className="mb-6">
                      <h5 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                        📁 Generated Program Files
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {programExecutionResults.data.externalResponse.data.files.map((file, index) => (
                          <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h6 className="font-medium text-white mb-1">{file.file}</h6>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    file.ready 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {file.ready ? '✅ Ready' : '⏳ Processing'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {file.file.includes('map') ? '🗺️ Interactive Map' : '📋 Program Output'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {file.file.includes('map') ? (
                                <button
                                  onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                                  title="Open interactive map in new tab"
                                >
                                  <span>🗺️</span>
                                  Open Interactive Map
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDownloadFile(file.url, file.file)}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                                  title="Download program output file"
                                >
                                  <span>📥</span>
                                  Download Output
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                                title="Open file in new tab"
                              >
                                <span>🔗</span>
                                Open in New Tab
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text File Previews for Program Execution Results */}
                  {programExecutionResults.data?.externalResponse?.data?.files && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-md font-semibold text-white flex items-center gap-2">
                          📖 Program Output Previews
                        </h5>
                        <button
                          onClick={() => {
                            // Clear existing previews and reload
                            setFilePreviews({});
                            setLoadingPreviews({});
                            const textFiles = programExecutionResults.data.externalResponse.data.files.filter(file => file.file.includes('.txt'));
                            textFiles.forEach(file => {
                              setTimeout(() => fetchFilePreview(file.url, file.file), 500);
                            });
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-2"
                        >
                          🔄 Refresh Previews
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {programExecutionResults.data.externalResponse.data.files
                          .filter(file => file.file.includes('.txt'))
                          .map((file, index) => (
                            <div key={index} className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
                              <div className="bg-gray-600 px-4 py-3 border-b border-gray-500">
                                <div className="flex items-center justify-between">
                                  <h6 className="font-medium text-white">{file.file}</h6>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleDownloadFile(file.url, file.file)}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                    >
                                      📥 Download
                                    </button>
                                    <button
                                      onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                    >
                                      🔗 Open Full
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Text File Preview */}
                              <div className="p-4">
                                <div className="bg-gray-800 rounded border border-gray-600 p-4 max-h-96 overflow-y-auto">
                                  <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                    {/* Show preview content or loading state */}
                                    {!filePreviews[file.file] && !loadingPreviews[file.file] ? (
                                      <div className="text-center py-4">
                                        <p className="text-gray-400 mb-3">Preview not loaded yet</p>
                                        <button
                                          onClick={() => fetchFilePreview(file.url, file.file)}
                                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                        >
                                          🔍 Load Preview
                                        </button>
                                      </div>
                                    ) : loadingPreviews[file.file] ? (
                                      <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                        <p className="text-gray-400">Loading preview...</p>
                                      </div>
                                    ) : (
                                      <div>
                                        {/* Content Display Controls */}
                                        {filePreviews[file.file] && !filePreviews[file.file].includes('⚠️') && !filePreviews[file.file].includes('❌') && (
                                          <div className="flex items-center justify-between mb-3 p-2 bg-gray-700 rounded border border-gray-600">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-gray-400">
                                                {showFullContent[file.file] ? '📖 Full Content' : '👁️ Preview Mode'}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                ({filePreviews[file.file].length} characters)
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => toggleContentDisplay(file.file)}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                              >
                                                {showFullContent[file.file] ? '👁️ Show Preview' : '📖 Show Full'}
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Content Display */}
                                        <div className="text-xs text-gray-300 leading-relaxed">
                                          {getDisplayContent(file.file, filePreviews[file.file])}
                                        </div>
                                        
                                        {/* Error Messages and Help */}
                                        {filePreviews[file.file] && filePreviews[file.file].includes('⚠️ CORS restriction') && (
                                          <div className="mt-3 pt-2 border-t border-gray-600">
                                            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-3">
                                              <p className="text-xs text-yellow-300 mb-2">
                                                <span className="font-medium">CORS Issue Detected:</span> Browser cannot directly access external files.
                                              </p>
                                              <div className="text-xs text-yellow-400 space-y-1">
                                                <div>• Use "Open Full" to view complete content</div>
                                                <div>• Use "Download" to save file locally</div>
                                                <div>• Preview will be available after download</div>
                                              </div>
                                              <div className="mt-3 pt-2 border-t border-yellow-700/30">
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => fetchFilePreview(file.url, file.file)}
                                                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                                                  >
                                                    🔄 Retry Preview
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                                  >
                                                    🔗 View Full Content
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {filePreviews[file.file] && filePreviews[file.file].includes('❌ Error') && (
                                          <div className="mt-3 pt-2 border-t border-gray-600">
                                            <div className="bg-red-900/20 border border-red-700/30 rounded p-3">
                                              <p className="text-xs text-red-300 mb-2">
                                                <span className="font-medium">Preview Failed:</span> Unable to load file content.
                                              </p>
                                              <div className="text-xs text-red-400 space-y-1">
                                                <div>• Check your internet connection</div>
                                                <div>• Try "Open Full" button instead</div>
                                                <div>• Contact support if issue persists</div>
                                              </div>
                                              <div className="mt-3 pt-2 border-t border-red-700/30">
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => fetchFilePreview(file.url, file.file)}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                                  >
                                                    🔄 Retry Preview
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenFileInNewTab(file.url, file.file)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                                  >
                                                    🔗 View Full Content
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {filePreviews[file.file] && !filePreviews[file.file].includes('⚠️') && !filePreviews[file.file].includes('❌') && filePreviews[file.file].length > 500 && (
                                          <div className="mt-3 pt-2 border-t border-gray-600">
                                            <div className="bg-blue-900/20 border border-blue-700/30 rounded p-3">
                                              <p className="text-xs text-blue-300 mb-2">
                                                <span className="font-medium">Content Available:</span> 
                                                {showFullContent[file.file] ? ' Showing complete file content.' : ' Showing preview (first 500 characters).'}
                                              </p>
                                              <div className="text-xs text-blue-400 space-y-1">
                                                <div>• Use toggle button above to switch between preview and full content</div>
                                                <div>• Use "Download" to save file locally</div>
                                                <div>• Use "Open Full" to view in new tab</div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}


                  {/* Send WhatsApp Button - Shows only after routes are saved */}
                  {routesSaved && (
                    <div className="mt-6 pt-4 border-t border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <FiMessageCircle className="text-white text-xl" />
                          </div>
                          <div>
                            <h5 className="text-white font-medium text-lg">
                              📱 Send WhatsApp to Executives
                            </h5>
                            <p className="text-gray-400 text-sm">
                              Send delivery instructions and route information to executives
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={handleSendWhatsApp}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                        >
                          <FiMessageCircle className="w-5 h-5" />
                          Send WhatsApp to {assignedExecutiveCount} Executives
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Seller Details Modal */}
      {showSellerDetails && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Seller Details</h3>
              <button
                onClick={closeSellerDetails}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="text-white">{selectedSeller.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{selectedSeller.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedSeller.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSeller.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Joined</p>
                      <p className="text-white">{formatDate(selectedSeller.createdAt)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Order Performance</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Orders Placed for Users</p>
                      <p className="text-2xl font-bold text-white">{selectedSeller.orderCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Order Value</p>
                      <p className="text-2xl font-bold text-green-500">{formatCurrency(selectedSeller.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Average Order Value</p>
                      <p className="text-white">
                        {selectedSeller.orderCount > 0 
                          ? formatCurrency(selectedSeller.totalRevenue / selectedSeller.orderCount)
                          : formatCurrency(0)
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedSeller.recentOrders && selectedSeller.recentOrders.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Orders for Users</h4>
                  <div className="space-y-2">
                    {selectedSeller.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="bg-gray-700 rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                          <span className="text-white text-sm">Order #{order.id.slice(-8)}</span>
                            {order.customerName && (
                              <div className="text-blue-300 text-xs">
                                For: {order.customerName} 📱 {order.customerPhone || order.customerEmail || 'No contact info'}
                              </div>
                            )}
                          </div>
                          <span className="text-green-400 text-sm">{formatCurrency(order.totalPrice)}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Item Confirmation Modal */}
      {showCancelItemModal && itemToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiX className="w-6 h-6 text-red-600" />
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
                  {itemToCancel.menuItem?.name || 'this delivery item'}
                </span>
                ?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Delivery Date:</span> {itemToCancel.deliveryDate ? new Date(itemToCancel.deliveryDate).toLocaleDateString('en-IN') : 'Not specified'}
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
                onClick={closeCancelItemModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Item
              </button>
              <button
                onClick={() => handleCancelDeliveryItem(itemToCancel.id)}
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

      {/* Confirmation Modal */}
      <Modal
        title={confirmationModal.title}
        open={confirmationModal.visible}
        onOk={handleConfirmationOK}
        onCancel={handleConfirmationCancel}
        okText={confirmationModal.itemId === 'logout' ? 'Yes, Logout' : 'Yes, Cancel'}
        cancelText={confirmationModal.itemId === 'logout' ? 'Cancel' : 'No, Keep'}
        okType={confirmationModal.itemId === 'logout' ? 'danger' : 'danger'}
        width={400}
        centered
      >
        <div className="py-4">
          <p className="text-gray-700">{confirmationModal.content}</p>
          {confirmationModal.itemId === 'logout' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium">This action cannot be undone.</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Executive Assignment Modal */}
      <Modal
        title="Assign Executives for Route Planning"
        open={showExecutiveAssignModal}
        onOk={() => {
          if (assignedExecutiveCount > 0) {
            setShowExecutiveAssignModal(false);
            setShowRunProgramButton(true);
            setSelectedExecutives(new Set([assignedExecutiveCount]));
          }
        }}
        onCancel={() => setShowExecutiveAssignModal(false)}
        okText="Assign Executives"
        cancelText="Cancel"
        okButtonProps={{ disabled: assignedExecutiveCount <= 0 }}
        width={500}
      >
        <div className="py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many executives do you need for route planning?
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={assignedExecutiveCount}
              onChange={(e) => setAssignedExecutiveCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter number of executives"
            />
          </div>
          
          
          {assignedExecutiveCount > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm text-green-700">
                  {assignedExecutiveCount} executive{assignedExecutiveCount !== 1 ? 's' : ''} will be assigned for route planning
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};

export default DeliveryManagerPage;
