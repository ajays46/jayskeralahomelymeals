import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLogOut, FiMapPin, FiPlay } from 'react-icons/fi';
import { MdLocalShipping } from 'react-icons/md';
import { message } from 'antd';
import { toast } from 'react-toastify';
import useAuthStore from '../stores/Zustand.store';
import axiosInstance from '../api/axios';
import { SkeletonCard, SkeletonTable, SkeletonLoading, SkeletonDashboard } from '../components/Skeleton';
import { useStartJourney, useCompleteDriverSession, useStopReached, useEndJourney } from '../hooks/deliverymanager/useAIRouteOptimization';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';

/**
 * DeliveryExecutivePage - Delivery executive dashboard with route and order management
 * Handles delivery executive operations including route viewing, order updates, and location tracking
 * Features: Route management, order status updates, location tracking, delivery analytics
 */
const DeliveryExecutivePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('routes'); // routes only
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  
  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Routes state
  const [routes, setRoutes] = useState({ sessions: {} }); // Initialize as object with sessions property
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState(null);
  const [selectedSession, setSelectedSession] = useState('breakfast'); // breakfast, lunch, dinner
  const [showAllStops, setShowAllStops] = useState(false);
  
  // Delivery completion state
  const [completingDelivery, setCompletingDelivery] = useState(null); // stop index being completed
  const [completionLocation, setCompletionLocation] = useState(null);
  const [completionLocationLoading, setCompletionLocationLoading] = useState(false);
  const [completionLocationError, setCompletionLocationError] = useState(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(null); // stop index being uploaded
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);
  
  // Delivery status state
  const [deliveryStatus, setDeliveryStatus] = useState({});
  const [loadingStatus, setLoadingStatus] = useState({});
  
  // Get user and roles first (before state that uses them)
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const logout = useAuthStore((state) => state.logout);
  
  // Start Journey state
  const [showStartJourneyModal, setShowStartJourneyModal] = useState(false);
  const [startJourneyData, setStartJourneyData] = useState({
    route_id: '',
    driver_id: ''
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState(null); // Track active journey route_id
  
  // End Session state
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [endSessionData, setEndSessionData] = useState({
    sessionName: '',
    sessionId: ''
  });
  
  // React Query hooks
  const startJourneyMutation = useStartJourney();
  const completeSessionMutation = useCompleteDriverSession();
  const stopReachedMutation = useStopReached();
  const endJourneyMutation = useEndJourney();

  // Get display name with fallbacks
  const getDisplayName = () => {
    return user?.firstName || user?.name || user?.email?.split('@')[0] || 'Delivery Executive';
  };

  useEffect(() => {
    if (!user || !roles.includes('DELIVERY_EXECUTIVE')) {
      message.error('Access denied. Delivery Executive role required.');
      navigate('/jkhm');
      return;
    }
    // Simulate loading for profile data
    setTimeout(() => setLoading(false), 1000);
  }, [user, roles, navigate]);

  // Auto-fetch routes when component loads if on routes tab
  useEffect(() => {
    const phoneNumber = getUserPhoneNumber();
    
    if (activeTab === 'routes' && phoneNumber && (!routes.sessions || Object.keys(routes.sessions).length === 0) && !routesLoading) {
      fetchRoutes();
    }
  }, [activeTab, user]);

  // Auto-fetch delivery status when routes are loaded
  useEffect(() => {
    if (routes.sessions && routes.sessions[selectedSession]) {
      const stops = routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub');
      
      // Fetch status for each stop
      stops.forEach((stop, index) => {
        if (stop.Delivery_Item_ID) {
          fetchDeliveryStatus(stop.Delivery_Item_ID, index);
        }
      });
    }
  }, [routes, selectedSession]);

  // Initialize driver_id when user is available
  useEffect(() => {
    if (user?.id) {
      setStartJourneyData(prev => ({
        ...prev,
        driver_id: user.id
      }));
    }
  }, [user?.id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Location capture functions for delivery completion
  const getCompletionLocation = () => {
    setCompletionLocationLoading(true);
    setCompletionLocationError(null);
    
    if (!navigator.geolocation) {
      setCompletionLocationError('Geolocation is not supported by this browser.');
      setCompletionLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        
        const { latitude, longitude } = position.coords;
        setCompletionLocation({
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        });
        setCompletionLocationLoading(false);
        
        // Reverse geocoding to get address
        reverseGeocodeCompletion(latitude, longitude);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
            break;
        }
        setCompletionLocationError(errorMessage);
        setCompletionLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const reverseGeocodeCompletion = async (latitude, longitude) => {
    
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.display_name) {
          const addressData = {
            address: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
            state: data.address?.state || 'Unknown',
            country: data.address?.country || 'Unknown',
            postalCode: data.address?.postcode || 'Unknown'
          };
          
          setCompletionLocation(prev => ({
            ...prev,
            ...addressData
          }));
        } else {
        }
      } else {
      }
    } catch (error) {
      const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      setCompletionLocation(prev => ({
        ...prev,
        address: fallbackAddress,
        city: 'Coordinates Only',
        state: 'Coordinates Only',
        country: 'Coordinates Only',
        postalCode: 'N/A'
      }));
    }
  };



  const clearCompletionLocation = () => {
    setCompletionLocation(null);
    setCompletionLocationError(null);
  };

  // Image upload functions
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageUploadError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageUploadError('Image size should be less than 5MB.');
        return;
      }
      
      setSelectedImage(file);
      setImageUploadError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUploadError(null);
    setUploadingImage(null);
  };

  // Fetch delivery status for a specific delivery item
  const fetchDeliveryStatus = async (deliveryItemId, stopIndex) => {
    if (!deliveryItemId) return;
    
    setLoadingStatus(prev => ({ ...prev, [stopIndex]: true }));
    
    try {
      const response = await axiosInstance.get(`/api/delivery-items/status/${deliveryItemId}`);
      
      if (response.data.success) {
        setDeliveryStatus(prev => ({
          ...prev,
          [stopIndex]: response.data.data
        }));
      }
    } catch (error) {
      // Silent error handling - status will remain as is
    } finally {
      setLoadingStatus(prev => ({ ...prev, [stopIndex]: false }));
    }
  };

  const handleImageUpload = async (stopIndex) => {
    if (!selectedImage) {
      setImageUploadError('Please select an image first.');
      return;
    }

    setImageUploadLoading(true);
    setImageUploadError(null);

    try {
      // Get the current stop data
      const currentStop = routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub')[stopIndex];
      const deliveryItemId = currentStop?.Delivery_Item_ID;
      const deliveryDate = currentStop?.Date;
      
      if (!deliveryItemId) {
        setImageUploadError('No delivery item ID found for this delivery stop.');
        return;
      }

      if (!deliveryDate) {
        setImageUploadError('No delivery date found for this stop.');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('delivery_item_id', deliveryItemId);
      formData.append('session', selectedSession.charAt(0).toUpperCase() + selectedSession.slice(1)); // Breakfast, Lunch, Dinner
      formData.append('date', deliveryDate); // Use the Date from the specific stop

      const response = await axiosInstance.post('/api/delivery-items/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Fetch updated delivery status from database
        await fetchDeliveryStatus(deliveryItemId, stopIndex);
        
        // Show success toast
        toast.success(
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <div className="font-semibold text-green-800 text-base">✅ Delivery Completed!</div>
              <div className="text-sm text-green-700 mt-1">Photo uploaded and delivery marked as completed.</div>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            style: {
              background: "#f0f9ff",
              border: "1px solid #10b981",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
            },
          }
        );
        
        // Clear upload state
        clearImageUpload();
      } else {
        throw new Error(response.data.message || 'Failed to upload image');
      }
    } catch (apiError) {
      
      // Show error toast
      toast.error(
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-semibold text-red-800 text-base">❌ Upload Failed</div>
            <div className="text-sm text-red-700 mt-1">
              {apiError.response?.data?.message || apiError.message || 'Failed to upload image. Please try again.'}
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          style: {
            background: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
          },
        }
      );
      
      setImageUploadError(apiError.response?.data?.message || apiError.message || 'Failed to upload image. Please try again.');
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleCompleteDelivery = async (stopIndex) => {

    if (!completionLocation) {
      setCompletionLocationError('Please capture your current location first.');
      return;
    }

    setCompletionLoading(true);
    setCompletionLocationError(null);

    try {
      // Get the current stop data
      const currentStop = routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub')[stopIndex];
      
      // Use the real Delivery_Item_ID from the route data
      const deliveryItemId = currentStop?.Delivery_Item_ID;
      
      if (!deliveryItemId) {
        setCompletionLocationError('No delivery item ID found for this delivery stop.');
        return;
      }
      
      const requestData = {
        latitude: completionLocation.latitude,
        longitude: completionLocation.longitude
      };
      
      const response = await axiosInstance.put(`/api/delivery-items/${deliveryItemId}/address`, requestData);

      if (response.data.success) {
        
        // Show toastify success popup
        toast.success(
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold text-green-800 text-base">✅ Address Updated Successfully!</div>
              <div className="text-sm text-green-700 mt-1">GPS coordinates have been updated for this delivery location.</div>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            style: {
              background: "#f0f9ff",
              border: "1px solid #10b981",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
            },
          }
        );
        
        // Clear completion state
        setCompletingDelivery(null);
        clearCompletionLocation();
      } else {
        throw new Error(response.data.message || 'Failed to update delivery address');
      }
    } catch (apiError) {
      
      // Show toastify error popup
      toast.error(
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-semibold text-red-800 text-base">❌ Update Failed</div>
            <div className="text-sm text-red-700 mt-1">
              {apiError.response?.data?.message || apiError.message || 'Failed to update delivery address. Please try again.'}
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          style: {
            background: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
          },
        }
      );
      
      setCompletionLocationError(apiError.response?.data?.message || apiError.message || 'Failed to update delivery address. Please try again.');
    } finally {
      setCompletionLoading(false);
    }
  };


  const handleLogout = async () => {
    try {
      // Call logout API endpoint if it exists
      try {
        await axiosInstance.post('/auth/logout');
      } catch (error) {
        // Logout API call failed, proceeding with local logout
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
      
      // Call logout from store
      logout();
      
      // Show success message
      message.success('Logged out successfully');
      
      // Navigate to home page
      navigate('/jkhm');
      
      // Force page reload to clear any remaining state
      window.location.reload();
    } catch (error) {
      message.error('Logout failed. Please try again.');
    }
  };


  // Get phone number from user object
  const getUserPhoneNumber = () => {
    // Try different possible locations for phone number
    if (user?.phoneNumber) return user.phoneNumber;
    if (user?.phone) return user.phone;
    if (user?.contacts?.[0]?.phoneNumbers?.[0]?.number) return user.contacts[0].phoneNumbers[0].number;
    if (user?.contacts?.[0]?.phone) return user.contacts[0].phone;
    return null;
  };

  // Fetch routes function
  const fetchRoutes = async () => {
    const phoneNumber = getUserPhoneNumber();
  
    
    
    if (!phoneNumber) {
      setRoutesError('Phone number not found for delivery executive');
      return;
    }
    setRoutesLoading(true);
    setRoutesError(null);

    try {
      const apiUrl = `/delivery-executives/get-routes/${phoneNumber}`;
      
      const response = await axiosInstance.get(apiUrl);

      if (response.data && response.data.success) {
        const routesData = response.data.data;
        
        // Handle different response structures
        // Structure 1: Object with sessions property
        if (routesData && typeof routesData === 'object' && routesData.sessions) {
          setRoutes(routesData);
          message.success('Routes loaded successfully!');
        }
        // Structure 2: Array - convert to object with sessions
        else if (Array.isArray(routesData) && routesData.length > 0) {
          // If it's an array, try to structure it
          const structuredRoutes = {
            sessions: routesData[0]?.sessions || {},
            ...routesData[0]
          };
          setRoutes(structuredRoutes);
          message.success('Routes loaded successfully!');
        }
        // Structure 3: Empty or no data
        else {
          setRoutes({ sessions: {} });
          message.info('No routes assigned for today');
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch routes');
      }
    } catch (apiError) {
      const errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to fetch routes. Please try again.';
      setRoutesError(errorMessage);
      message.error(errorMessage);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Handle routes tab click
  const handleRoutesTabClick = () => {
    const phoneNumber = getUserPhoneNumber();
    
    setActiveTab('routes');
    setSidebarOpen(false);
    
    // Fetch routes when switching to routes tab
    if ((!routes.sessions || Object.keys(routes.sessions).length === 0) && !routesLoading && phoneNumber) {
      fetchRoutes();
    }
  };

  // Get current GPS location
  const getCurrentLocationForJourney = () => {
    if (!navigator.geolocation) {
      showErrorToast('Geolocation is not supported by your browser');
      return;
    }
    
    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCurrentLocation(location);
        // Note: Location is captured but not sent to API (API only requires route_id and driver_id)
        setLocationLoading(false);
        showSuccessToast('Location captured successfully!');
      },
      (error) => {
        setLocationLoading(false);
        let errorMsg = 'Unable to get location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location access denied. Please enable location services.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out';
        }
        showErrorToast(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Start Journey button click
  const handleStartJourneyClick = () => {
    if (!user?.id) {
      showErrorToast('User ID not found. Please log in again.');
      return;
    }
    
    // Set driver_id and open modal for confirmation
    setStartJourneyData({
      route_id: '',
      driver_id: user?.id || ''
    });
    setShowStartJourneyModal(true);
    
    // Auto-get location when modal opens
    getCurrentLocationForJourney();
  };

  // Handle Start Journey submission
  const handleStartJourney = async () => {
    if (!startJourneyData.route_id) {
      showErrorToast('Route ID is required');
      return;
    }
    
    if (!startJourneyData.driver_id) {
      showErrorToast('Driver ID is required');
      return;
    }
    
    try {
      const result = await startJourneyMutation.mutateAsync({
        route_id: startJourneyData.route_id,
        driver_id: startJourneyData.driver_id
      });
      
      // Store the route_id for later use
      if (result.route_id) {
        setActiveRouteId(result.route_id);
      }
      
      showSuccessToast('Journey started successfully!');
      setShowStartJourneyModal(false);
      setStartJourneyData({
        route_id: '',
        driver_id: user?.id || ''
      });
      
      // Refresh routes after starting journey
      fetchRoutes();
    } catch (error) {
      showErrorToast(error.message || 'Failed to start journey');
    }
  };

  // Handle marking a stop as reached/delivered
  const handleStopReached = async (stop, stopIndex) => {
    if (!user?.id || !activeRouteId) {
      showErrorToast('No active journey. Please start a journey first.');
      return;
    }
    
    try {
      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      
      await stopReachedMutation.mutateAsync({
        user_id: user.id,
        route_id: activeRouteId,
        stop_order: stop.Stop_No || stopIndex + 1,
        delivery_id: stop.Delivery_Item_ID,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        status: 'delivered',
        packages_delivered: stop.Packages || 1
      });
      
      showSuccessToast(`Stop ${stop.Stop_No || stopIndex + 1} marked as delivered!`);
      fetchRoutes();
    } catch (error) {
      showErrorToast(error.message || 'Failed to mark stop as reached');
    }
  };

  // Handle ending the journey
  const handleEndJourney = async () => {
    if (!user?.id || !activeRouteId) {
      showErrorToast('No active journey to end.');
      return;
    }
    
    try {
      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      
      await endJourneyMutation.mutateAsync({
        user_id: user.id,
        route_id: activeRouteId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      showSuccessToast('Journey ended successfully!');
      setActiveRouteId(null);
      fetchRoutes();
    } catch (error) {
      showErrorToast(error.message || 'Failed to end journey');
    }
  };

  // Handle End Session button click
  const handleEndSessionClick = (sessionName) => {
    // Generate session ID based on session name and current date
    const today = new Date().toISOString().split('T')[0];
    const sessionId = `${sessionName}_${today}_${user?.id || 'unknown'}`;
    
    setEndSessionData({
      sessionName: sessionName,
      sessionId: sessionId
    });
    setShowEndSessionModal(true);
  };

  // Handle End Session submission
  const handleEndSession = async () => {
    if (!endSessionData.sessionId) {
      showErrorToast('Session ID is required');
      return;
    }
    
    try {
      await completeSessionMutation.mutateAsync({
        sessionId: endSessionData.sessionId,
        route_id: routes?.route_id || endSessionData.sessionId,
        end_time: new Date().toISOString()
      });
      showSuccessToast(`${endSessionData.sessionName.charAt(0).toUpperCase() + endSessionData.sessionName.slice(1)} session completed successfully!`);
      setShowEndSessionModal(false);
      setEndSessionData({ sessionName: '', sessionId: '' });
      // Refresh routes after session completion
      fetchRoutes();
    } catch (error) {
      showErrorToast(error.message || 'Failed to complete session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          {/* Mobile Header Skeleton */}
          <div className="bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="h-8 w-32 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-600 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Mobile Content Skeleton */}
          <div className="p-4 space-y-4">
            <SkeletonDashboard />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex">
          {/* Sidebar Skeleton */}
          <div className="w-64 bg-gray-800 p-4">
            <div className="space-y-4">
              <div className="h-8 bg-gray-600 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Main Content Skeleton */}
          <div className="flex-1 p-6">
            <SkeletonDashboard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full h-16 sm:h-20 lg:h-24 bg-gray-800 border-b border-gray-700 z-40 flex items-center px-3 sm:px-4 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/jkhm')}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Go back to home"
          >
            <FiArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <MdLocalShipping className="text-xl sm:text-2xl text-blue-500" />
            <h1 className="text-base sm:text-xl font-bold text-white">Delivery Executive</h1>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-gray-400 ml-auto hidden sm:block">
          <span className="hidden sm:inline">Welcome, </span>
          <span className="font-medium text-white">{getDisplayName()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 sm:pt-20 lg:pt-24">
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

        {/* Sidebar */}
        <div className={`fixed left-0 top-16 sm:top-20 lg:top-24 w-64 h-screen bg-gray-800 border-r border-gray-700 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-3 sm:p-4">
            {/* User Info Section */}
            <div className="mb-4 sm:mb-6 p-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <MdLocalShipping className="text-white text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-400">Delivery Executive</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-white px-2">Navigation</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              <button
                onClick={handleRoutesTabClick}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors text-sm sm:text-base ${
                  activeTab === 'routes'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Routes</span>
              </button>


              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors text-sm sm:text-base text-red-400 hover:text-red-300 hover:bg-red-900/20 mt-4"
              >
                <FiLogOut className="text-base sm:text-lg" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="lg:ml-64 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Mobile Backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}



          {/* Routes Tab Content */}
          {activeTab === 'routes' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Page Header - Hidden on Mobile */}
              <div className="hidden sm:block bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg border border-gray-700 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Delivery Routes</h2>
                    <p className="text-indigo-100 text-sm sm:text-base">View and manage your delivery routes</p>
                  </div>
                </div>
              </div>

              {/* Session Overview Cards */}
              {routes.sessions && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {Object.entries(routes.sessions).map(([session, data]) => (
                    <div key={session} className="bg-gray-800 rounded-lg p-2 sm:p-4 text-center border border-gray-700">
                      <div className="text-xs sm:text-lg font-bold text-blue-400 capitalize mb-1 sm:mb-2">{session}</div>
                      <div className="text-lg sm:text-2xl font-bold text-white mb-1">
                        {data.stops.filter(stop => stop.Delivery_Name !== 'Return to Hub').length}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm mb-1">Stops</div>
                      <div className="text-gray-300 text-xs sm:text-sm">
                        {data.stops.reduce((total, stop) => total + (stop.Packages || 0), 0)} packages
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Routes Content */}
              <div className="w-full">
                {/* Today's Routes */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      📅 Today's Routes
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleStartJourneyClick}
                        disabled={routesLoading || !routes.sessions || Object.keys(routes.sessions).length === 0}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg transition-colors text-xs sm:text-sm flex items-center gap-1 font-medium"
                      >
                        <FiPlay className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Start Journey</span>
                        <span className="sm:hidden">Start</span>
                      </button>
                      <button
                        onClick={fetchRoutes}
                        disabled={routesLoading}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-lg transition-colors text-xs sm:text-sm flex items-center gap-1"
                      >
                        {routesLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Loading State */}
                  {routesLoading && (
                    <div className="space-y-3 sm:space-y-4">
                      {/* Session Overview Cards Skeleton */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={`session-${index}`} className="bg-gray-700 rounded-lg p-2 sm:p-4 animate-pulse">
                            <div className="h-3 sm:h-4 bg-gray-500 rounded w-3/4 mb-2"></div>
                            <div className="h-4 sm:h-6 bg-gray-500 rounded w-1/2 mb-1"></div>
                            <div className="h-2 sm:h-3 bg-gray-500 rounded w-1/3 mb-1"></div>
                            <div className="h-2 sm:h-3 bg-gray-500 rounded w-2/3"></div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Route Cards Skeleton */}
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div key={`route-${index}`} className="bg-gray-700 rounded-lg p-3 sm:p-4 animate-pulse">
                          <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-500 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 sm:h-4 bg-gray-500 rounded w-3/4"></div>
                              <div className="h-2 sm:h-3 bg-gray-500 rounded w-1/2"></div>
                            </div>
                            <div className="w-12 sm:w-16 h-4 sm:h-6 bg-gray-500 rounded-full"></div>
                          </div>
                          <div className="h-8 sm:h-10 bg-gray-500 rounded w-full sm:w-auto"></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error State */}
                  {routesError && (
                    <div className="text-center py-8">
                      <div className="text-red-500 text-4xl mb-4">⚠️</div>
                      <p className="text-red-400 mb-4">{routesError}</p>
                      <button
                        onClick={fetchRoutes}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Routes List */}
                  {!routesLoading && !routesError && (
                    <div className="space-y-4">
                      {(!routes.sessions || Object.keys(routes.sessions).length === 0) ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-4">📋</div>
                          <p className="text-gray-400 mb-2">No routes found</p>
                          <p className="text-gray-500 text-sm">No delivery routes assigned for today</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Session Tabs */}
                          <div className="flex space-x-2 bg-gray-700 rounded-lg p-1">
                            {Object.keys(routes.sessions || {}).map((session) => (
                              <button
                                key={session}
                                onClick={() => setSelectedSession(session)}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  selectedSession === session
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                }`}
                              >
                                {session.charAt(0).toUpperCase() + session.slice(1)}
                              </button>
                            ))}
                          </div>

                          {/* Selected Session Details */}
                          {routes.sessions && routes.sessions[selectedSession] && (
                            <div className="space-y-4">
                              {/* Session Header */}
                              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                  <h4 className="text-lg font-semibold text-white capitalize">
                                    {selectedSession} Route
                                  </h4>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                                      {routes.sessions[selectedSession].stops.length} Stops
                                    </span>
                                    <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                                      {routes.sessions[selectedSession].stops.reduce((total, stop) => total + (stop.Packages || 0), 0)} Packages
                                    </span>
                                    <button
                                      onClick={() => handleEndSessionClick(selectedSession)}
                                      disabled={completeSessionMutation.isPending}
                                      className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white text-xs rounded-full transition-colors flex items-center gap-1 font-medium"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                      </svg>
                                      End Session
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Map Link */}
                                {routes.sessions[selectedSession].map_link && (
                                  <div className="mb-4">
                                    <a
                                      href={routes.sessions[selectedSession].map_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm sm:text-base font-medium"
                                    >
                                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      Open in Google Maps
                                    </a>
                                  </div>
                                )}

                              </div>

                              {/* Stops List */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-md font-semibold text-white">Delivery Stops</h5>
                                  {routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub').length > 2 && (
                                    <button
                                      onClick={() => setShowAllStops(!showAllStops)}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                                    >
                                      {showAllStops ? 'Show Less' : `Show All (${routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub').length})`}
                                    </button>
                                  )}
                                </div>
                                
                                {(showAllStops ? routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub') : routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub').slice(0, 2)).map((stop, index) => (
                                  <div key={index} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                          {stop.Stop_No}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h6 className="text-white font-medium truncate">
                                            {stop.Delivery_Name || 'Unknown Delivery'}
                                          </h6>
                                          <p className="text-gray-400 text-xs truncate">
                                            {stop.Location || 'Location not specified'}
                                          </p>
                                        </div>
                                      </div>
                                      {stop.Packages && (
                                        <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full flex-shrink-0 ml-2">
                                          {stop.Packages}
                                        </span>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-3">
                                      {/* All Action Buttons in One Row */}
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        {/* Directions Button */}
                                        {stop.Map_Link && (
                                          <a
                                            href={stop.Map_Link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Get Directions
                                          </a>
                                        )}
                                        
                                        {/* Upload Image Button - Hide if delivered */}
                                        {deliveryStatus[index]?.status !== 'Delivered' && (
                                          <button
                                            onClick={() => setUploadingImage(uploadingImage === index ? null : index)}
                                            className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {uploadingImage === index ? 'Cancel' : 'Upload Photo'}
                                          </button>
                                        )}
                                        
                                        {/* Update Address Button - Always visible */}
                                        <button
                                          onClick={() => setCompletingDelivery(completingDelivery === index ? null : index)}
                                          className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {completingDelivery === index ? 'Cancel' : 'Update Address'}
                                        </button>
                                        
                                      </div>
                                    </div>

                                    {/* Delivery Status Display */}
                                    {(deliveryStatus[index] || loadingStatus[index]) && (
                                      <div className={`mt-3 p-3 rounded-lg border ${
                                        loadingStatus[index] 
                                          ? 'bg-gray-900/20 border-gray-600'
                                          : deliveryStatus[index].status === 'Delivered' 
                                          ? 'bg-green-900/20 border-green-600' 
                                          : deliveryStatus[index].status === 'Pending'
                                          ? 'bg-yellow-900/20 border-yellow-600'
                                          : deliveryStatus[index].status === 'Confirmed'
                                          ? 'bg-blue-900/20 border-blue-600'
                                          : deliveryStatus[index].status === 'Cancelled'
                                          ? 'bg-red-900/20 border-red-600'
                                          : 'bg-gray-900/20 border-gray-600'
                                      }`}>
                                        <div className="flex items-center gap-2">
                                          {loadingStatus[index] ? (
                                            <>
                                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                                              <div>
                                                <div className="text-gray-400 font-medium text-sm">Loading Status...</div>
                                                <div className="text-gray-300 text-xs">Fetching delivery information</div>
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <svg className={`w-5 h-5 ${
                                                deliveryStatus[index].status === 'Delivered' 
                                                  ? 'text-green-500' 
                                                  : deliveryStatus[index].status === 'Pending'
                                                  ? 'text-yellow-500'
                                                  : deliveryStatus[index].status === 'Confirmed'
                                                  ? 'text-blue-500'
                                                  : deliveryStatus[index].status === 'Cancelled'
                                                  ? 'text-red-500'
                                                  : 'text-gray-500'
                                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {deliveryStatus[index].status === 'Delivered' ? (
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                ) : deliveryStatus[index].status === 'Pending' ? (
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                ) : deliveryStatus[index].status === 'Confirmed' ? (
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                ) : deliveryStatus[index].status === 'Cancelled' ? (
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                ) : (
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                )}
                                              </svg>
                                              <div>
                                                <div className={`font-medium text-sm ${
                                                  deliveryStatus[index].status === 'Delivered' 
                                                    ? 'text-green-400' 
                                                    : deliveryStatus[index].status === 'Pending'
                                                    ? 'text-yellow-400'
                                                    : deliveryStatus[index].status === 'Confirmed'
                                                    ? 'text-blue-400'
                                                    : deliveryStatus[index].status === 'Cancelled'
                                                    ? 'text-red-400'
                                                    : 'text-gray-400'
                                                }`}>
                                                  {deliveryStatus[index].status === 'Delivered' ? '✅ Delivered' :
                                                   deliveryStatus[index].status === 'Pending' ? '⏳ Pending' :
                                                   deliveryStatus[index].status === 'Confirmed' ? '✅ Confirmed' :
                                                   deliveryStatus[index].status === 'Cancelled' ? '❌ Cancelled' :
                                                   deliveryStatus[index].status}
                                                </div>
                                                <div className={`text-xs ${
                                                  deliveryStatus[index].status === 'Delivered' 
                                                    ? 'text-green-300' 
                                                    : deliveryStatus[index].status === 'Pending'
                                                    ? 'text-yellow-300'
                                                    : deliveryStatus[index].status === 'Confirmed'
                                                    ? 'text-blue-300'
                                                    : deliveryStatus[index].status === 'Cancelled'
                                                    ? 'text-red-300'
                                                    : 'text-gray-300'
                                                }`}>
                                                  Updated: {new Date(deliveryStatus[index].updatedAt).toLocaleString()}
                                                </div>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Action UI - Show only one at a time */}
                                    {(completingDelivery === index || uploadingImage === index) && (
                                      <div className="mt-4 p-4 bg-gray-600 rounded-lg border border-gray-500">
                                        {/* Delivery Completion UI */}
                                        {completingDelivery === index && (
                                          <>
                                            <h6 className="text-white font-medium mb-3 flex items-center gap-2">
                                              <FiMapPin className="text-blue-400" />
                                              📍 Update Delivery Address
                                            </h6>
                                            
                                            <div className="space-y-4">
                                              {/* GPS Location Capture */}
                                              <div className="bg-gray-500 rounded-lg p-3 border border-gray-400">
                                                <h7 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                                                  <FiMapPin className="text-blue-400" />
                                                  📍 GPS Location
                                                </h7>
                                                <button 
                                                  onClick={getCompletionLocation}
                                                  disabled={completionLocationLoading}
                                                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                  {completionLocationLoading ? (
                                                    <>
                                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                      Getting Location...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <FiMapPin className="text-base" />
                                                      Get Current Location
                                                    </>
                                                  )}
                                                </button>
                                              </div>

                                              {/* Clear Button */}
                                              {completionLocation && (
                                                <div className="text-center">
                                                  <button 
                                                    onClick={clearCompletionLocation}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                                  >
                                                    🗑️ Clear All
                                                  </button>
                                                </div>
                                              )}

                                              {/* Error Display */}
                                              {completionLocationError && (
                                                <div className="bg-red-900/20 border border-red-500 rounded-lg p-2">
                                                  <p className="text-red-400 text-sm">{completionLocationError}</p>
                                                </div>
                                              )}

                                              {/* Complete Button */}
                                              <div className="pt-2">
                                                <button
                                                  onClick={() => handleCompleteDelivery(index)}
                                                  disabled={!completionLocation || completionLoading}
                                                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                                    completionLocation && !completionLoading
                                                      ? 'bg-green-600 hover:bg-green-700 text-white'
                                                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                                  }`}
                                                >
                                                  {completionLoading ? (
                                                    <>
                                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                      Completing...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                      </svg>
                                                      ✅ Complete This Delivery
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          </>
                                        )}

                                        {/* Image Upload UI */}
                                        {uploadingImage === index && (
                                          <>
                                            <h6 className="text-white font-medium mb-3 flex items-center gap-2">
                                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                              </svg>
                                              📸 Upload Delivery Photo
                                            </h6>
                                            
                                            <div className="space-y-4">
                                              {/* File Input - Compact */}
                                              <div className="bg-gray-500 rounded-lg p-2 border border-gray-400">
                                                <label className="block">
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageSelect}
                                                    className="hidden"
                                                    id={`image-upload-${index}`}
                                                  />
                                                  <div className="flex items-center justify-center w-full h-16 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-purple-400 transition-colors">
                                                    <div className="text-center">
                                                      <svg className="w-4 h-4 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                      </svg>
                                                      <p className="text-gray-300 text-xs">
                                                        {selectedImage ? 'Change Image' : 'Select Image'}
                                                      </p>
                                                      <p className="text-gray-400 text-xs">Max 5MB</p>
                                                    </div>
                                                  </div>
                                                </label>
                                              </div>

                                              {/* Image Preview - Compact */}
                                              {imagePreview && (
                                                <div className="bg-gray-500 rounded-lg p-2 border border-gray-400">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className="text-white font-medium text-xs">Preview:</span>
                                                    <button
                                                      onClick={clearImageUpload}
                                                      className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                                                    >
                                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                  <div className="relative">
                                                    <img
                                                      src={imagePreview}
                                                      alt="Preview"
                                                      className="w-full h-24 object-cover rounded-lg border border-gray-400"
                                                    />
                                                  </div>
                                                </div>
                                              )}

                                              {/* Error Display */}
                                              {imageUploadError && (
                                                <div className="bg-red-900/20 border border-red-500 rounded-lg p-2">
                                                  <p className="text-red-400 text-sm">{imageUploadError}</p>
                                                </div>
                                              )}

                                              {/* Upload Button */}
                                              <div className="pt-2">
                                                <button
                                                  onClick={() => handleImageUpload(index)}
                                                  disabled={!selectedImage || imageUploadLoading}
                                                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                                    selectedImage && !imageUploadLoading
                                                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                                  }`}
                                                >
                                                  {imageUploadLoading ? (
                                                    <>
                                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                      Uploading...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                      </svg>
                                                      📤 Upload Photo
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Fixed Return to Hub Component */}
                              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-yellow-400 text-sm font-medium">Return to Hub</span>
                                  </div>
                                  <span className="text-yellow-300 text-xs">End of Route</span>
                                </div>
                                <div className="mt-2">
                                  <a
                                    href={routes.sessions[selectedSession].map_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Return Directions
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiLogOut className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirm Logout</h3>
                <p className="text-gray-400 text-sm">Are you sure you want to logout?</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-6">
              You will be redirected to the home page and all your session data will be cleared.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Journey Confirmation Modal */}
      {showStartJourneyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FiPlay className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Start Journey</h3>
                <p className="text-gray-400 text-sm">Ready to start your delivery journey?</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              {/* Route ID */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Route ID *</label>
                <input
                  type="text"
                  value={startJourneyData.route_id}
                  onChange={(e) => setStartJourneyData(prev => ({ ...prev, route_id: e.target.value }))}
                  placeholder="Enter route ID"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm"
                />
              </div>
              
              {/* Driver ID */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Driver ID *</label>
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <p className="text-white font-mono text-sm">{startJourneyData.driver_id || user?.id || 'N/A'}</p>
                </div>
                <p className="text-gray-500 text-xs mt-1">Auto-filled from your account</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStartJourneyModal(false);
                  setCurrentLocation(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleStartJourney}
                disabled={startJourneyMutation.isPending || !startJourneyData.route_id || !startJourneyData.driver_id}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {startJourneyMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <FiPlay className="w-4 h-4" />
                    Start Journey
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">End {endSessionData.sessionName.charAt(0).toUpperCase() + endSessionData.sessionName.slice(1)} Session</h3>
                <p className="text-gray-400 text-sm">Are you sure you want to end this session?</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-2">
                This will mark the <span className="font-semibold text-white capitalize">{endSessionData.sessionName}</span> session as completed.
              </p>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Session:</span>
                  <span className="text-white capitalize font-medium">{endSessionData.sessionName}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">End Time:</span>
                  <span className="text-white font-mono">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <p className="text-yellow-400 text-xs mt-2">
                ⚠️ This action will trigger reinforcement learning and cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEndSessionModal(false);
                  setEndSessionData({ sessionName: '', sessionId: '' });
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={completeSessionMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {completeSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    End Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryExecutivePage;
