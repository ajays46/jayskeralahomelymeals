import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiShoppingBag, FiTrendingUp, FiCalendar, FiMapPin, FiTrendingDown, FiClock, FiCheckCircle, FiBarChart2, FiActivity, FiPieChart, FiTarget, FiShield, FiPackage, FiX } from 'react-icons/fi';
import { MdLocalShipping, MdStore, MdPerson, MdAttachMoney } from 'react-icons/md';
import { Modal, message } from 'antd';
import axiosInstance from '../api/axios';

const DeliveryManagerPage = () => {
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
  const [expandedOrder, setExpandedOrder] = useState(null); // For expanding order details
  const [deliveryItems, setDeliveryItems] = useState({}); // Store delivery items for each order
  const [loadingItems, setLoadingItems] = useState({}); // Loading state for delivery items
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile sidebar toggle
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    timeSlot: 'all'
  });
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    itemId: null,
    title: '',
    content: ''
  });
  const [deliveryExecutives, setDeliveryExecutives] = useState([]);
  const [loadingExecutives, setLoadingExecutives] = useState(false);
  const [executivesError, setExecutivesError] = useState(false);
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
  const [loadingSessionData, setLoadingSessionData] = useState(false); // Loading state for session data

  useEffect(() => {
    fetchSellersData();
    fetchDeliveryExecutives();
    

  }, []);



  useEffect(() => {
    if (deliveryItems) {
      // Update delivery items when they change
    }
  }, [deliveryItems]);

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
    if (programExecutionResults?.data?.externalResponse?.data?.files) {
      const textFiles = programExecutionResults.data.externalResponse.data.files.filter(file => file.file.includes('.txt'));
      textFiles.forEach(file => {
        if (!filePreviews[file.file] && !loadingPreviews[file.file]) {
          // Small delay to avoid overwhelming the API
          setTimeout(() => fetchFilePreview(file.url, file.file), 1000 + Math.random() * 2000);
        }
      });
    }
  }, [programExecutionResults]);



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
      console.error('Error processing delivery items:', error);
      
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
      console.error('Error cancelling order:', error);
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
      console.error('❌ Error cancelling delivery item:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
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
      console.error('Route planning error:', error);
      
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
      console.error('Session data fetch error:', error);
      
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
        message.error('❌ Failed to send WhatsApp messages');
      }
      
    } catch (error) {
      message.destroy(); // Clear loading message
      console.error('WhatsApp messaging error:', error);
      
      if (error.response) {
        // Server responded with error status
        message.error(`❌ WhatsApp messaging failed: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // Network error
        message.error('❌ Network error: Could not connect to WhatsApp messaging service');
      } else {
        // Other error
        message.error(`❌ WhatsApp messaging error: ${error.message}`);
      }
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
      
      // Clear previous program execution results
      setProgramExecutionResults(null);
      
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
        dashboardVersion: '1.0.0'
      });
      
      message.destroy(); // Clear loading message
      
      if (response.data.success) {
        message.success(`✅ Program executed successfully with ${executiveCount} executive(s)!`);
        
        // Store the program execution results for display
        setProgramExecutionResults(response.data);
        
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
                <h5 className="font-medium text-blue-800 mb-2">Execution Details</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• <strong>Status:</strong> {response.data.data?.status || 'Completed'}</div>
                  <div>• <strong>Request ID:</strong> {response.data.data?.requestId || 'N/A'}</div>
                  <div>• <strong>Executives Used:</strong> {executiveCount}</div>
                  <div>• <strong>Execution Time:</strong> {response.data.data?.executionTime || 'N/A'}</div>
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
          centered: true,
          onOk: () => {
            // Program execution completed
          }
        });
      } else {
        message.error('❌ Failed to execute program');
      }
      
    } catch (error) {
      message.destroy(); // Clear loading message
      console.error('Program execution error:', error);
      
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
      console.error('Download error:', error);
      message.error('Failed to download file. Please try again.');
    }
  };

  const handleOpenFileInNewTab = (url, filename) => {
    try {
      window.open(url, '_blank');
      message.success(`Opening ${filename} in new tab...`);
    } catch (error) {
      console.error('Open file error:', error);
      message.error('Failed to open file. Please try again.');
    }
  };

  const fetchFilePreview = async (url, filename) => {
    if (filePreviews[filename]) return; // Already fetched
    
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
        setFilePreviews(prev => ({ ...prev, [filename]: content }));
      } else {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error fetching preview for ${filename}:`, error);
      
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
          console.error(`Backend proxy also failed for ${filename}:`, proxyError);
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
                  <div>• <strong>Destination:</strong> EC2 instance at 13.203.227.119:5001</div>
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
      console.error('Error sending executive count:', error);
      
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
        console.error('API returned error status:', response.data);
        setError('Failed to fetch sellers data: Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching sellers data:', error);
      
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
        console.error('API returned error status:', response.data);
        message.warning('Failed to fetch delivery executives. Some data may be unavailable.');
        setExecutivesError(true);
      }
    } catch (error) {
      console.error('Error fetching delivery executives:', error);
      
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

  const handleConfirmationOK = () => {
    // Handle confirmation modal OK action
    if (confirmationModal.itemId) {
      // Handle the specific action based on modal type
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
      console.error('Error cancelling order:', error);
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
      console.error('🔍 Auth check failed:', error);
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
      console.error('Error cancelling all orders for seller:', error);
      message.error('Failed to cancel orders. Please try again.');
    }
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
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
      <div className="fixed top-0 left-0 w-full h-20 lg:h-24 bg-gray-800 border-b border-gray-700 z-40 flex items-center px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/jkhm')}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Go back to home"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <MdLocalShipping className="text-2xl text-blue-500" />
            <h1 className="text-xl font-bold">
              {activeTab === 'sellers' ? 'Sellers Management' : activeTab === 'orders' ? 'Orders Management' : 'Analytics Dashboard'} Dashboard
            </h1>
                </div>
              </div>
              <div className="text-sm text-gray-400">
          {/* Removed descriptive text */}
              </div>
        {/* Removed Download Report and View Analytics buttons */}
            </div>

      {/* Main Content with proper spacing for navbar */}
      <div className="pt-24"> {/* Add top padding to account for fixed navbar height (h-20 lg:h-24) */}
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden fixed top-28 left-4 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-gray-800 text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Sidebar */}
        <div className={`fixed left-0 top-24 w-64 h-screen bg-gray-800 border-r border-gray-700 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4">
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
            <nav className="space-y-2">
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
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="lg:ml-64 px-4 lg:px-6 py-6">
          {/* Mobile Backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Stats Cards - Only visible in Analytics tab */}
          {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Sellers</p>
                  <p className="text-2xl font-bold text-white">{stats.totalSellers}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <MdStore className="text-2xl text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">Orders Placed</p>
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <FiShoppingBag className="text-2xl text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">Total Order Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <MdAttachMoney className="text-2xl text-yellow-500" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Sellers</p>
                  <p className="text-2xl font-bold text-white">{stats.activeSellers}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <FiTrendingUp className="text-2xl text-green-500" />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Tab Content */}
          {activeTab === 'sellers' && (
            <>
          {/* Sellers Table */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-white">Sellers & Their Orders for Users</h2>
                  <p className="text-gray-400 text-sm">View sellers and the orders they're placing for users</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Orders Placed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <MdStore className="text-white text-lg" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {seller.name || seller.email || 'Unknown Seller'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {seller.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          seller.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {seller.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {seller.orderCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
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
                        <td className="px-6 py-4 text-sm text-white">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <MdStore className="text-white text-sm" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-white">Total Summary</div>
                              <div className="text-xs text-blue-200">All Sellers Combined</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            stats.activeSellers > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {stats.activeSellers} Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white font-bold">
                          {stats.totalOrders}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-400 font-bold">
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
                  <div className="text-center py-12">
                    <MdStore className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-400">No sellers found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding some sellers to your platform.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              {/* Seller Orders for Users Section */}
              <div className="space-y-6">
                {sellers.map((seller) => (
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
                              {seller.orderCount || 0} orders • {formatCurrency(
                                seller.recentOrders && seller.recentOrders.length > 0
                                  ? seller.recentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
                                  : 0
                              )}
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
                    
                    {seller.recentOrders && seller.recentOrders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                User (Customer)
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Order Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {seller.recentOrders.map((order) => (
                              <React.Fragment key={order.id}>
                                <tr className="hover:bg-gray-700 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleOrderExpand(order.id)}
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                      >
                                        {expandedOrder === order.id ? '▼' : '▶'}
                                      </button>
                                      <span className="font-mono">#{order.id.slice(-8)}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8">
                                        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                                          <MdPerson className="text-white text-sm" />
                                        </div>
                                      </div>
                                      <div className="ml-3">
                                        <div className="text-sm font-medium text-white">
                                          {order.customerName || 'User'}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                          {order.customerEmail || 'No email'}
                                        </div>
                                      </div>
                                    </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {formatDate(order.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                                    {formatCurrency(order.totalPrice)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
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
                                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                            cancellingOrder === order.id
                                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                              : 'bg-red-600 hover:bg-red-700 text-white'
                                          }`}
                                          title="Cancel Entire Order"
                                        >
                                          {cancellingOrder === order.id ? (
                                            <div className="flex items-center gap-1">
                                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                              Cancelling...
                                            </div>
                                          ) : (
                                            'Cancel Order'
                                          )}
                                        </button>
                                      )}
                                      
                                      {/* View Details Button */}
                                      <button
                                        onClick={() => handleOrderExpand(order.id)}
                                        className="text-blue-400 hover:text-blue-300 transition-colors text-xs"
                                      >
                                        {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                                      </button>
                                    </div>
                      </td>
                    </tr>
                                
                                {/* Expanded Order Details */}
                                {expandedOrder === order.id && (
                                  <tr className="bg-gray-700 border-t border-gray-600">
                                    <td colSpan="6" className="px-6 py-4">
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
                                            <div className="text-center py-4">
                                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                              <p className="text-gray-400">Loading delivery items...</p>
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
                    ) : (
                      <div className="text-center py-12">
                        <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-400">No orders found</h3>
                        <p className="mt-1 text-sm text-gray-500">This seller hasn't placed any orders for users yet.</p>
                      </div>
                    )}
                  </div>
                ))}

            {sellers.length === 0 && (
              <div className="text-center py-12">
                    <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-400">No sellers found</h3>
                    <p className="mt-1 text-sm text-gray-500">Orders will appear here once sellers start placing orders for users.</p>
              </div>
            )}
          </div>
            </>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <>
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
                
                <div className="overflow-x-auto">
                  <table className="w-full">
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
                  <FiTarget className="text-gray-400 text-xl" />
                </div>
                
                

                {/* Session Data Component */}
                <div className="mt-8">
                  <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-medium text-white flex items-center gap-2">
                        <FiBarChart2 className="text-blue-400" />
                        Session Data Monitor
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
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={handleFetchSessionData}
                        disabled={loadingSessionData}
                        className={`w-full sm:w-auto px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3 ${
                          loadingSessionData
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                        }`}
                      >
                        {loadingSessionData ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Fetching...</span>
                          </>
                        ) : (
                          <>
                            <FiBarChart2 className="text-lg" />
                            <span>📊 Fetch Session Data</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Session Data Display */}
                    {sessionData && (
                      <div className="mt-6 bg-gray-800 rounded-lg border border-gray-600 p-4">
                        <h5 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                          📊 Delivery Session Data Results
                        </h5>
                        


                        {/* Enhanced Delivery Data Summary Cards */}
                        {sessionData.data?.externalResponse?.data && (
                          <div className="mb-8 bg-gray-700 p-6 rounded-lg border border-gray-600">
                            <h6 className="font-medium text-white mb-6 text-center text-lg">📊 Delivery Summary Dashboard</h6>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Morning Summary Card */}
                              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                                <div className="text-4xl mb-3">🌅</div>
                                <div className="text-lg font-semibold text-white mb-2">Morning Delivery</div>
                                <div className="text-3xl font-bold text-blue-400 mb-2">
                                  {sessionData.data.externalResponse.data.totals?.morning || 0}
                                </div>
                                <div className="text-sm text-blue-300">Total Customers</div>
                                <div className="mt-3 text-xs text-blue-200">
                                  {sessionData.data.externalResponse.data.morning?.length || 0} Locations
                                </div>
                              </div>
                              
                              {/* Lunch Summary Card */}
                              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                                <div className="text-4xl mb-3">🍽️</div>
                                <div className="text-lg font-semibold text-white mb-2">Lunch Delivery</div>
                                <div className="text-3xl font-bold text-green-400 mb-2">
                                  {sessionData.data.externalResponse.data.totals?.lunch || 0}
                                </div>
                                <div className="text-sm text-green-300">Total Customers</div>
                                <div className="mt-3 text-xs text-green-200">
                                  {sessionData.data.externalResponse.data.lunch?.length || 0} Locations
                                </div>
                              </div>
                              
                              {/* Dinner Summary Card */}
                              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                                <div className="text-4xl mb-3">🌙</div>
                                <div className="text-lg font-semibold text-white mb-2">Dinner Delivery</div>
                                <div className="text-3xl font-bold text-purple-400 mb-2">
                                  {sessionData.data.externalResponse.data.totals?.dinner || 0}
                                </div>
                                <div className="text-sm text-purple-300">Total Customers</div>
                                <div className="mt-3 text-xs text-purple-200">
                                  {sessionData.data.externalResponse.data.dinner?.length || 0} Locations
                                </div>
                              </div>
                            </div>
                            
                            {/* Grand Total */}
                            <div className="mt-6 pt-6 border-t border-gray-600">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-2">
                                  🎯 Total Delivery Operations
                                </div>
                                <div className="text-4xl font-bold text-yellow-400">
                                  {(sessionData.data.externalResponse.data.totals?.morning || 0) + 
                                   (sessionData.data.externalResponse.data.totals?.lunch || 0) + 
                                   (sessionData.data.externalResponse.data.totals?.dinner || 0)} Customers
                                </div>
                                <div className="text-sm text-gray-300 mt-2">
                                  Across {(sessionData.data.externalResponse.data.morning?.length || 0) + 
                                         (sessionData.data.externalResponse.data.lunch?.length || 0) + 
                                         (sessionData.data.externalResponse.data.dinner?.length || 0)} Unique Locations
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Enhanced Delivery Data Tables by Time Slot */}
                        {sessionData.data?.externalResponse?.data && (
                          <div className="space-y-8">
                            {/* Morning Delivery Table */}
                            {sessionData.data.externalResponse.data.morning && (
                              <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden shadow-lg">
                                                                <div className="px-4 py-3 border-b border-gray-600 bg-gradient-to-r from-blue-600 to-blue-700">
                                  <h6 className="text-base font-semibold text-white flex items-center gap-2">
                                    🌅 Morning Delivery Schedule
                                    <span className="text-xs text-blue-200 font-normal ml-2">
                                      ({sessionData.data.externalResponse.data.totals?.morning || 0} customers • {sessionData.data.externalResponse.data.morning?.length || 0} locations)
                                    </span>
                                  </h6>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-600 sticky top-0 z-10">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          📍 Location
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          👥 Customer Count
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          🗺️ Delivery Areas
                                        </th>
                                    </tr>
                                  </thead>
                                    <tbody className="bg-gray-700 divide-y divide-gray-600">
                                                                            {sessionData.data.externalResponse.data.morning.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-600 transition-colors">
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <div className="flex-shrink-0 h-8 w-8">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                                                  <FiMapPin className="text-white text-sm" />
                                                </div>
                                              </div>
                                              <div className="ml-3">
                                                <div className="text-base font-bold text-white">
                                                  {item.locations[0] || 'Unknown'}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="flex flex-col items-center">
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                {item.customer_count}
                                              </span>
                                              <div className="text-xs text-gray-400 mt-1">
                                                customers
                                            </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                              {item.locations.map((location, locIndex) => (
                                                <span key={locIndex} className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                  locIndex === 0 
                                                    ? 'bg-blue-600 text-white border border-blue-500' 
                                                    : 'bg-gray-600 text-gray-300 border border-gray-500'
                                                }`}>
                                                  {location}
                                            </span>
                                              ))}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Lunch Delivery Table */}
                            {sessionData.data.externalResponse.data.lunch && (
                              <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden shadow-lg">
                                                                <div className="px-4 py-3 border-b border-gray-600 bg-gradient-to-r from-green-600 to-green-700">
                                  <h6 className="text-base font-semibold text-white flex items-center gap-2">
                                    🍽️ Lunch Delivery Schedule
                                    <span className="text-xs text-green-200 font-normal ml-2">
                                      ({sessionData.data.externalResponse.data.totals?.lunch || 0} customers • {sessionData.data.externalResponse.data.lunch?.length || 0} locations)
                                    </span>
                                  </h6>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-600 sticky top-0 z-10">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          📍 Location
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          👥 Customer Count
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          🗺️ Delivery Areas
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-gray-700 divide-y divide-gray-600">
                                      {sessionData.data.externalResponse.data.lunch.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-600 transition-colors">
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <div className="flex-shrink-0 h-8 w-8">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                                                  <FiMapPin className="text-white text-sm" />
                                                </div>
                                              </div>
                                              <div className="ml-3">
                                                <div className="text-base font-bold text-white">
                                                  {item.locations[0] || 'Unknown'}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="flex flex-col items-center">
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 border border-green-200">
                                                {item.customer_count}
                                              </span>
                                              <div className="text-xs text-gray-400 mt-1">
                                                customers
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                              {item.locations.map((location, locIndex) => (
                                                <span key={locIndex} className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                  locIndex === 0 
                                                    ? 'bg-green-600 text-white border border-green-500' 
                                                    : 'bg-gray-600 text-gray-300 border border-gray-500'
                                                }`}>
                                                  {location}
                                                </span>
                                              ))}
                                            </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              </div>
                            )}

                            {/* Dinner Delivery Table */}
                            {sessionData.data.externalResponse.data.dinner && (
                              <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden shadow-lg">
                                                                <div className="px-4 py-3 border-b border-gray-600 bg-gradient-to-r from-purple-600 to-purple-700">
                                  <h6 className="text-base font-semibold text-white flex items-center gap-2">
                                    🌙 Dinner Delivery Schedule
                                    <span className="text-xs text-purple-200 font-normal ml-2">
                                      ({sessionData.data.externalResponse.data.totals?.dinner || 0} customers • {sessionData.data.externalResponse.data.dinner?.length || 0} locations)
                                    </span>
                                  </h6>
                          </div>
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-600 sticky top-0 z-10">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          📍 Location
                                        </th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          👥 Customer Count
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                          🗺️ Delivery Areas
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-gray-700 divide-y divide-gray-600">
                                                                            {sessionData.data.externalResponse.data.dinner.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-600 transition-colors">
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <div className="flex-shrink-0 h-8 w-8">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                                                  <FiMapPin className="text-white text-sm" />
                                                </div>
                                              </div>
                                              <div className="ml-3">
                                                <div className="text-base font-bold text-white">
                                                  {item.locations[0] || 'Unknown'}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="flex flex-col items-center">
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                                {item.customer_count}
                                              </span>
                                              <div className="text-xs text-gray-400 mt-1">
                                                customers
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                              {item.locations.map((location, locIndex) => (
                                                <span key={locIndex} className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                  locIndex === 0 
                                                    ? 'bg-purple-600 text-white border border-purple-500' 
                                                    : 'bg-gray-600 text-gray-300 border border-gray-500'
                                                }`}>
                                                  {location}
                                                </span>
                                              ))}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}


                      </div>
                    )}
                  </div>
                </div>

                {/* Route Planning Component */}
                <div className="mt-6">
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
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={() => handleRunRoutePlanning()}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                      >
                        <FiActivity className="text-lg" />
                        🚀 Run Route Planning
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delivery Executive Information - Always Visible */}
                <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <MdLocalShipping className="text-blue-400" />
                    🚚 Delivery Executive Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {deliveryExecutives.length}
                      </div>
                      <div className="text-sm text-gray-300">Total Executives</div>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {deliveryExecutives.filter(e => e.currentStatus === 'Available').length}
                      </div>
                      <div className="text-sm text-gray-300">Available Now</div>
                    </div>
                  </div>

                  {/* Simple Count Input and Send */}
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h5 className="text-md font-medium text-white mb-4">📋 Assign Executives for Route Planning:</h5>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-300">How many executives do you need?</label>
                        <input
                          type="number"
                          min="1"
                          value={selectedExecutives.size > 0 ? Array.from(selectedExecutives)[0] : ''}
                          onChange={(e) => {
                            const count = parseInt(e.target.value) || 0;
                            if (count > 0) {
                              setSelectedExecutives(new Set([count])); // Store just the count number
                            } else {
                              setSelectedExecutives(new Set());
                            }
                          }}
                          className="w-20 px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded text-center"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    {selectedExecutives.size > 0 && (
                      <div className="p-3 bg-green-600/20 border border-green-600/30 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-300">
                            ✅ {Array.from(selectedExecutives)[0]} executive(s) will be assigned for route planning
                          </span>
                        </div>
                      </div>
                    )}
                    
                  </div>

                  {/* Combined Run Program Button */}
                  {selectedExecutives.size > 0 && (
                    <div className="mt-6 bg-gray-700 p-4 rounded-lg border border-gray-600">
                      <h5 className="text-md font-medium text-white mb-4">⚡ Run Program with Selected Executives:</h5>
                      
                      <button
                        onClick={handleRunProgram}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                      >
                        <span className="text-xl">🚀</span>
                        <span>Run Program With {Array.from(selectedExecutives)[0]} Executives</span>
                      </button>
                      
                      <div className="mt-3 text-xs text-gray-400 text-center">
                        This will send the executive count to the API and run the program with {Array.from(selectedExecutives)[0]} executive(s).
                      </div>
                    </div>
                  )}

                  {/* Send WhatsApp Button */}
                  {selectedExecutives.size > 0 && (
                    <div className="mt-6 bg-gray-700 p-4 rounded-lg border border-gray-600">
                      <h5 className="text-md font-medium text-white mb-4">📱 Send WhatsApp Message to Selected Executives:</h5>
                      
                      <button
                        onClick={handleSendWhatsApp}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                      >
                        <span className="text-xl">📱</span>
                        <span>Send WhatsApp to {Array.from(selectedExecutives)[0]} Executive(s)</span>
                      </button>
                      
                      <div className="mt-3 text-xs text-gray-400 text-center">
                        Note: This will send a POST request to the external API endpoint with Authorization header. The external service will handle WhatsApp messaging.
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

              {/* Program Execution Results - Displayed Below Route Planning Results */}
              {programExecutionResults && (
                <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <FiPackage className="text-blue-400" />
                    🚀 Program Execution Results
                  </h4>

                  {/* Execution Summary */}
                  <div className="mb-6 bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h5 className="font-medium text-white mb-3">📊 Execution Summary:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-600 rounded border border-gray-500">
                        <div className="text-2xl mb-2">👥</div>
                        <div className="font-medium text-white">Drivers Used</div>
                        <div className="text-gray-300">
                          {programExecutionResults.data?.numDrivers || 0}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-600 rounded border border-gray-500">
                        <div className="text-2xl mb-2">✅</div>
                        <div className="font-medium text-white">Status</div>
                        <div className="text-gray-300">
                          {programExecutionResults.data?.status || 'Completed'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-600 rounded border border-gray-500">
                        <div className="text-2xl mb-2">🆔</div>
                        <div className="font-medium text-white">Request ID</div>
                        <div className="text-gray-300">
                          {programExecutionResults.data?.requestId || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

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

                  {/* Execution Details */}
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h5 className="font-medium text-white mb-3">⚙️ Execution Details:</h5>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Execution Time:</span>
                        <span>{programExecutionResults.data?.executionTime ? new Date(programExecutionResults.data.executionTime).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timestamp:</span>
                        <span>{programExecutionResults.data?.timestamp ? new Date(programExecutionResults.data.timestamp).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Message:</span>
                        <span>{programExecutionResults.message || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
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
                              <div className="text-blue-300 text-xs">For: {order.customerName}</div>
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
        okText="Yes, Cancel"
        cancelText="No, Keep"
        okType="danger"
      >
        <p>{confirmationModal.content}</p>
      </Modal>
    </div>
  );
};

export default DeliveryManagerPage;
