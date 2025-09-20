import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiLogOut } from 'react-icons/fi';
import { MdLocalShipping, MdAttachMoney, MdPhone } from 'react-icons/md';
import { message } from 'antd';
import useAuthStore from '../stores/Zustand.store';
import axiosInstance from '../api/axios';
import { SkeletonCard, SkeletonTable, SkeletonLoading, SkeletonDashboard } from '../components/Skeleton';

const DeliveryExecutivePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('routes'); // routes, delivery
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Location states
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [locationError, setLocationError] = useState(null);
  
  // Photo upload states
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  
  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Routes state
  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState(null);
  const [selectedSession, setSelectedSession] = useState('breakfast'); // breakfast, lunch, dinner
  const [showAllStops, setShowAllStops] = useState(false);
  
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const logout = useAuthStore((state) => state.logout);

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
    
    if (activeTab === 'routes' && phoneNumber && routes.length === 0 && !routesLoading) {
      fetchRoutes();
    }
  }, [activeTab, user]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Location functions
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        });
        setLocationLoading(false);
        
        // Reverse geocoding to get address
        reverseGeocode(latitude, longitude);
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
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          setCurrentLocation(prev => ({
            ...prev,
            address: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
            state: data.address?.state || 'Unknown',
            country: data.address?.country || 'Unknown',
            postalCode: data.address?.postcode || 'Unknown'
          }));
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to coordinates if reverse geocoding fails
      setCurrentLocation(prev => ({
        ...prev,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: 'Coordinates Only',
        state: 'Coordinates Only',
        country: 'Coordinates Only',
        postalCode: 'N/A'
      }));
    }
  };

  const handleManualAddressSubmit = () => {
    if (manualAddress.trim()) {
      setCurrentLocation({
        address: manualAddress.trim(),
        city: 'Manual Entry',
        state: 'Manual Entry',
        country: 'Manual Entry',
        postalCode: 'N/A',
        timestamp: new Date().toISOString()
      });
      setLocationError(null);
    }
  };

  const clearLocation = () => {
    setCurrentLocation(null);
    setManualAddress('');
    setLocationError(null);
  };

  // Photo upload functions
  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setPhotoError('Please select a valid image file (JPG, PNG, or GIF)');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setPhotoError('File size must be less than 5MB');
        return;
      }

      setSelectedPhoto(file);
      setPhotoError(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) {
      setPhotoError('Please select a photo first');
      return;
    }

    setPhotoLoading(true);
    setPhotoError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', selectedPhoto);
      
      // Send to backend API using axios
      const response = await axiosInstance.post(`/delivery-details/${user?.id}/delivery-details`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        message.success(response.data.message || 'Photo uploaded successfully!');
        
        // Clear the form after successful upload
        setSelectedPhoto(null);
        setPhotoPreview(null);
      } else {
        throw new Error(response.data.message || 'Failed to upload photo');
      }
    } catch (apiError) {
      setPhotoError(apiError.response?.data?.message || apiError.message || 'Failed to upload photo. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const clearPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setPhotoError(null);
    // Clear the file input
    const fileInput = document.getElementById('photo-upload');
    if (fileInput) fileInput.value = '';
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
      console.error('Logout error:', error);
      message.error('Logout failed. Please try again.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const event = { target: { files } };
      handlePhotoSelect(event);
    }
  };

  const handleSendDeliveryDetails = async () => {
    if (!currentLocation) {
      setLocationError('Please capture your current location first.');
      return;
    }
    if (!selectedPhoto) {
      setPhotoError('Please select a delivery photo first.');
      return;
    }

    setPhotoLoading(true);
    setPhotoError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', selectedPhoto);
      formData.append('location', currentLocation.address || JSON.stringify(currentLocation));
      formData.append('latitude', currentLocation.latitude?.toString() || '');
      formData.append('longitude', currentLocation.longitude?.toString() || '');
      
      // Send to backend API using axios
      const response = await axiosInstance.post(`/delivery-details/${user?.id}/delivery-details`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        message.success(response.data.message || 'Delivery details sent successfully!');
        clearLocation();
        clearPhoto();
      } else {
        throw new Error(response.data.message || 'Failed to send delivery details');
      }
    } catch (apiError) {
      setPhotoError(apiError.response?.data?.message || apiError.message || 'Failed to send delivery details. Please try again.');
    } finally {
      setPhotoLoading(false);
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
        const routesData = response.data.data || [];
        setRoutes(routesData);
        
        if (routesData.length === 0) {
          message.info('No routes assigned for today');
        } else {
          message.success('Routes loaded successfully!');
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch routes');
      }
    } catch (apiError) {
      console.error('❌ API Error:', apiError);
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
    if (routes.length === 0 && !routesLoading && phoneNumber) {
      fetchRoutes();
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

              <button
                onClick={() => {
                  setActiveTab('delivery');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors text-sm sm:text-base ${
                  activeTab === 'delivery'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <MdLocalShipping className="text-base sm:text-lg" />
                <span>Delivery</span>
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


          {/* Delivery Page Content - Combined Location & Photo */}
          {activeTab === 'delivery' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Page Header */}
              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg border border-gray-700 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                  <MdLocalShipping className="text-3xl sm:text-4xl text-white" />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Delivery Management</h2>
                    <p className="text-green-100 text-sm sm:text-base">Location tracking and photo documentation</p>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column - Location Search */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                      <FiMapPin className="text-blue-400" />
                      📍 Location Management
                    </h3>
                    
                    <div className="space-y-4 sm:space-y-6">
                      {/* Location Search */}
                      <div className="bg-gray-700 rounded-lg p-4 sm:p-6 border border-gray-600">
                        <h4 className="text-sm sm:text-base font-medium text-white mb-3 sm:mb-4">🔍 Find Your Current Location</h4>
                        
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                            <button 
                              onClick={getCurrentLocation}
                              disabled={locationLoading}
                              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                              {locationLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Getting Location...
                                </>
                              ) : (
                                <>
                                  <FiMapPin className="text-base sm:text-lg" />
                                  Get Current Location
                                </>
                              )}
                            </button>
                            <span className="text-gray-400 text-xs sm:text-sm text-center sm:hidden">or</span>
                            <input
                              type="text"
                              value={manualAddress}
                              onChange={(e) => setManualAddress(e.target.value)}
                              placeholder="Enter address manually..."
                              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            />
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button 
                              onClick={handleManualAddressSubmit}
                              disabled={!manualAddress.trim()}
                              className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg transition-colors text-sm sm:text-base"
                            >
                              Search Location
                            </button>
                            {currentLocation && (
                              <button 
                                onClick={clearLocation}
                                className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Error Display */}
                          {locationError && (
                            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
                              <p className="text-red-400 text-sm">{locationError}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location Results */}
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h4 className="text-md font-medium text-white mb-4">📍 Current Location Info</h4>
                        
                        {currentLocation ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-400">Address</label>
                              <p className="text-white mt-1 break-words">{currentLocation.address}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-400">Coordinates</label>
                              <p className="text-white mt-1 font-mono text-sm">
                                {currentLocation.latitude ? `${currentLocation.latitude.toFixed(6)}° N, ${currentLocation.longitude.toFixed(6)}° E` : 'N/A'}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-400">City</label>
                                <p className="text-white mt-1">{currentLocation.city}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-400">State</label>
                                <p className="text-white mt-1">{currentLocation.state}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-400">Country</label>
                                <p className="text-white mt-1">{currentLocation.country}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-400">Postal Code</label>
                                <p className="text-white mt-1">{currentLocation.postalCode}</p>
                              </div>
                            </div>
                            {currentLocation.timestamp && (
                              <div>
                                <label className="text-sm font-medium text-gray-400">Last Updated</label>
                                <p className="text-white mt-1 text-sm">{new Date(currentLocation.timestamp).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">
                              <FiMapPin className="w-12 h-12 mx-auto" />
                            </div>
                            <p className="text-gray-400">No location data available</p>
                            <p className="text-gray-500 text-sm mt-1">Click "Get Current Location" to start</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Photo Upload */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      📸 Photo Documentation
                    </h3>
                    
                    <div className="space-y-4 sm:space-y-6">
                      {/* Image Upload Area */}
                      <div className="bg-gray-700 rounded-lg p-4 sm:p-6 border border-gray-600">
                        <h4 className="text-sm sm:text-base font-medium text-white mb-3 sm:mb-4">📤 Upload Delivery Photo</h4>
                        
                        <div 
                          className="border-2 border-dashed border-gray-500 rounded-lg p-4 sm:p-8 text-center hover:border-purple-400 transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          {!selectedPhoto ? (
                            <>
                              <div className="text-gray-400 mb-3 sm:mb-4">
                                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <p className="text-gray-400 mb-2 text-sm sm:text-base">Drag and drop your photo here</p>
                              <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">or click to browse files</p>
                              
                              <div className="space-y-3">
                                <label className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer inline-block text-sm sm:text-base">
                                  <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                  />
                                  Choose Photo
                                </label>
                                <p className="text-gray-500 text-xs">Supported: JPG, PNG, GIF (Max: 5MB)</p>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-green-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <p className="text-green-400 font-medium">Photo Selected!</p>
                              <p className="text-gray-400 text-sm">{selectedPhoto.name}</p>
                              <p className="text-gray-500 text-xs">{(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</p>
                              
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={handlePhotoUpload}
                                  disabled={photoLoading}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                                >
                                  {photoLoading ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                                      Uploading...
                                    </>
                                  ) : (
                                    '📤 Upload Photo'
                                  )}
                                </button>
                                <button 
                                  onClick={clearPhoto}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Error Display */}
                        {photoError && (
                          <div className="mt-4 bg-red-900/20 border border-red-500 rounded-lg p-3">
                            <p className="text-red-400 text-sm">{photoError}</p>
                          </div>
                        )}
                      </div>

                      {/* Image Preview */}
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h4 className="text-md font-medium text-white mb-4">🖼️ Photo Preview</h4>
                        
                        {photoPreview ? (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="bg-gray-600 rounded-lg p-3 sm:p-4 border border-gray-500">
                              <img 
                                src={photoPreview} 
                                alt="Delivery Photo Preview" 
                                className="w-full h-48 sm:h-64 object-cover rounded-lg"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                              <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-400">File Name</label>
                                <p className="text-white mt-1 truncate text-xs sm:text-sm">{selectedPhoto?.name}</p>
                              </div>
                              <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-400">File Size</label>
                                <p className="text-white mt-1 text-xs sm:text-sm">{selectedPhoto ? (selectedPhoto.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-400">File Type</label>
                                <p className="text-white mt-1 text-xs sm:text-sm">{selectedPhoto?.type || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-400">Dimensions</label>
                                <p className="text-white mt-1 text-xs sm:text-sm">Auto-detected</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-600 rounded-lg p-8 text-center border border-gray-500">
                            <div className="text-gray-400 mb-4">
                              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-gray-400">No photo selected</p>
                            <p className="text-gray-500 text-sm mt-2">Upload a photo to see preview</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Button Section */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <MdLocalShipping className="text-green-400" />
                  🚀 Send Delivery Details
                </h3>
                
                <div className="space-y-3 sm:space-y-4">
                  {/* Status Summary */}
                  <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                    <h4 className="text-sm sm:text-base font-medium text-white mb-3">📋 Delivery Summary</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Location Status */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-3 h-3 rounded-full ${currentLocation ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="text-white font-medium text-sm sm:text-base">Location</p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            {currentLocation ? 'Captured' : 'Not captured'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Photo Status */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-3 h-3 rounded-full ${selectedPhoto ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="text-white font-medium text-sm sm:text-base">Photo</p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            {selectedPhoto ? 'Selected' : 'Not selected'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="text-center">
                    <button
                      onClick={handleSendDeliveryDetails}
                      disabled={!currentLocation || !selectedPhoto || photoLoading}
                      className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 mx-auto ${
                        currentLocation && selectedPhoto && !photoLoading
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {photoLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <MdLocalShipping className="text-xl sm:text-2xl" />
                          📤 Send Delivery Details
                        </>
                      )}
                    </button>
                    
                    {!currentLocation && !selectedPhoto && (
                      <p className="text-gray-400 text-xs sm:text-sm mt-3">
                        Please capture location and select photo to enable sending
                      </p>
                    )}
                    {!currentLocation && selectedPhoto && (
                      <p className="text-gray-400 text-xs sm:text-sm mt-3">
                        Please capture your current location first
                      </p>
                    )}
                    {currentLocation && !selectedPhoto && (
                      <p className="text-gray-400 text-xs sm:text-sm mt-3">
                        Please select a delivery photo first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      📅 Today's Routes
                    </h3>
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
                      {routes.length === 0 ? (
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
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-lg font-semibold text-white capitalize">
                                    {selectedSession} Route
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                                      {routes.sessions[selectedSession].stops.length} Stops
                                    </span>
                                    <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                                      {routes.sessions[selectedSession].stops.reduce((total, stop) => total + (stop.Packages || 0), 0)} Packages
                                    </span>
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

                                    {/* Regular Stop with Directions */}
                                    {stop.Map_Link && (
                                      <div className="mt-3">
                                        <a
                                          href={stop.Map_Link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                          Get Directions
                                        </a>
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
    </div>
  );
};

export default DeliveryExecutivePage;
