import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiClock, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import { MdLocalShipping, MdPerson, MdAttachMoney, MdPhone } from 'react-icons/md';
import { message } from 'antd';
import useAuthStore from '../stores/Zustand.store';
import axiosInstance from '../api/axios';

const DeliveryExecutivePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // Only profile tab
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
  
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);

  useEffect(() => {
    if (!user || !roles.includes('DELIVERY_EXECUTIVE')) {
      message.error('Access denied. Delivery Executive role required.');
      navigate('/jkhm');
      return;
    }
    // Simulate loading for profile data
    setTimeout(() => setLoading(false), 1000);
  }, [user, roles, navigate]);

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
      // Convert photo to base64 for API
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result; // This is the base64 string
        
        try {
          // Send to backend API using axios
          const response = await axiosInstance.post(`/delivery-executives/${user?.id}/image`, {
            imageData: imageData
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
      
      reader.readAsDataURL(selectedPhoto);

    } catch (error) {
      setPhotoError('Failed to process photo. Please try again.');
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
      // Convert photo to base64 for API
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result; // This is the base64 string
        
        try {
          // Send to backend API using axios
          const response = await axiosInstance.put(`/delivery-executives/${user?.id}/delivery-details`, {
            imageData: imageData,
            location: currentLocation,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
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
      
      reader.readAsDataURL(selectedPhoto);

    } catch (error) {
      setPhotoError('Failed to process photo. Please try again.');
      setPhotoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading delivery executive profile...</p>
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
            <h1 className="text-xl font-bold">Delivery Executive Profile</h1>
          </div>
        </div>
        <div className="text-sm text-gray-400 ml-auto">
          Welcome, {user?.name || 'Delivery Executive'}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24">
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
                  setActiveTab('profile');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <MdPerson className="text-lg" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('delivery');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'delivery'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <MdLocalShipping className="text-lg" />
                <span>Delivery</span>
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

          {/* Profile Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                    <MdLocalShipping className="text-4xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{user?.name || 'Delivery Executive'}</h2>
                    <p className="text-blue-100">Professional Delivery Executive</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✅ Active
                      </span>
                      <span className="text-blue-100 text-sm">Member since {user?.createdAt ? formatDate(user.createdAt) : 'Recently'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MdPerson className="text-blue-400" />
                    Personal Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Full Name</label>
                      <p className="text-white text-lg font-medium">{user?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Email Address</label>
                      <p className="text-white">{user?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Phone Number</label>
                      <p className="text-white flex items-center gap-2">
                        <MdPhone className="text-green-400" />
                        {user?.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">User ID</label>
                      <p className="text-gray-300 font-mono text-sm">#{user?.id?.slice(-8) || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MdLocalShipping className="text-green-400" />
                    Professional Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Role</label>
                      <p className="text-white">Delivery Executive</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Status</label>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Company</label>
                      <p className="text-white">{user?.companyName || 'Jay\'s Kerala Homely Meals'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Department</label>
                      <p className="text-white">Delivery Operations</p>
                    </div>
                  </div>
                </div>
                
                {/* Account Information */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiUser className="text-purple-400" />
                    Account Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Account Type</label>
                      <p className="text-white">Professional</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Member Since</label>
                      <p className="text-white">{user?.createdAt ? formatDate(user.createdAt) : 'Recently'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Last Active</label>
                      <p className="text-white">Today</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Account Status</label>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Profile Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Work Schedule & Availability */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiClock className="text-orange-400" />
                    Work Schedule
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Current Status</label>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Available for Deliveries
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Working Hours</label>
                      <p className="text-white">Flexible (Based on orders)</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Preferred Areas</label>
                      <p className="text-white">City-wide delivery coverage</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Vehicle Type</label>
                      <p className="text-white">Two-wheeler / Bicycle</p>
                    </div>
                  </div>
                </div>
                
                {/* Skills & Specializations */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiCheckCircle className="text-purple-400" />
                    Skills & Specializations
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Delivery Expertise</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Food Delivery
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Fast Delivery
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Customer Service
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Languages</label>
                      <p className="text-white">English, Malayalam, Hindi</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Certifications</label>
                      <p className="text-white">Food Safety Certified</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => navigate('/jkhm/profile')}
                    className="flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <MdPerson className="text-xl" />
                    <div className="text-left">
                      <p className="font-medium">Edit Profile</p>
                      <p className="text-sm text-blue-100">Update personal info</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/jkhm')}
                    className="flex items-center gap-3 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <MdLocalShipping className="text-xl" />
                    <div className="text-left">
                      <p className="font-medium">Go to Home</p>
                      <p className="text-sm text-green-100">Return to main page</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-3 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <FiCheckCircle className="text-xl" />
                    <div className="text-left">
                      <p className="font-medium">Refresh Page</p>
                      <p className="text-sm text-purple-100">Reload profile data</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Page Content - Combined Location & Photo */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              {/* Page Header */}
              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center gap-4">
                  <MdLocalShipping className="text-4xl text-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Delivery Management</h2>
                    <p className="text-green-100">Location tracking and photo documentation</p>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Location Search */}
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <FiMapPin className="text-blue-400" />
                      📍 Location Management
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Location Search */}
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h4 className="text-md font-medium text-white mb-4">🔍 Find Your Current Location</h4>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={getCurrentLocation}
                              disabled={locationLoading}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                              {locationLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Getting Location...
                                </>
                              ) : (
                                <>
                                  <FiMapPin className="text-lg" />
                                  Get Current Location
                                </>
                              )}
                            </button>
                            <span className="text-gray-400 text-sm">or</span>
                            <input
                              type="text"
                              value={manualAddress}
                              onChange={(e) => setManualAddress(e.target.value)}
                              placeholder="Enter address manually..."
                              className="flex-1 px-4 py-3 bg-gray-600 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={handleManualAddressSubmit}
                              disabled={!manualAddress.trim()}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg transition-colors"
                            >
                              Search Location
                            </button>
                            {currentLocation && (
                              <button 
                                onClick={clearLocation}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      📸 Photo Documentation
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Image Upload Area */}
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h4 className="text-md font-medium text-white mb-4">📤 Upload Delivery Photo</h4>
                        
                        <div 
                          className="border-2 border-dashed border-gray-500 rounded-lg p-8 text-center hover:border-purple-400 transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          {!selectedPhoto ? (
                            <>
                              <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <p className="text-gray-400 mb-2">Drag and drop your photo here</p>
                              <p className="text-gray-500 text-sm mb-4">or click to browse files</p>
                              
                              <div className="space-y-3">
                                <label className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer inline-block">
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
                          <div className="space-y-4">
                            <div className="bg-gray-600 rounded-lg p-4 border border-gray-500">
                              <img 
                                src={photoPreview} 
                                alt="Delivery Photo Preview" 
                                className="w-full h-64 object-cover rounded-lg"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className="text-sm font-medium text-gray-400">File Name</label>
                                <p className="text-white mt-1 truncate">{selectedPhoto?.name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-400">File Size</label>
                                <p className="text-white mt-1">{selectedPhoto ? (selectedPhoto.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-400">File Type</label>
                                <p className="text-white mt-1">{selectedPhoto?.type || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-400">Dimensions</label>
                                <p className="text-white mt-1">Auto-detected</p>
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
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MdLocalShipping className="text-green-400" />
                  🚀 Send Delivery Details
                </h3>
                
                <div className="space-y-4">
                  {/* Status Summary */}
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-md font-medium text-white mb-3">📋 Delivery Summary</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Location Status */}
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${currentLocation ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="text-white font-medium">Location</p>
                          <p className="text-gray-400 text-sm">
                            {currentLocation ? 'Captured' : 'Not captured'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Photo Status */}
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${selectedPhoto ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="text-white font-medium">Photo</p>
                          <p className="text-gray-400 text-sm">
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
                      className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-3 mx-auto ${
                        currentLocation && selectedPhoto && !photoLoading
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {photoLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <MdLocalShipping className="text-2xl" />
                          📤 Send Delivery Details
                        </>
                      )}
                    </button>
                    
                    {!currentLocation && !selectedPhoto && (
                      <p className="text-gray-400 text-sm mt-3">
                        Please capture location and select photo to enable sending
                      </p>
                    )}
                    {!currentLocation && selectedPhoto && (
                      <p className="text-gray-400 text-sm mt-3">
                        Please capture your current location first
                      </p>
                    )}
                    {currentLocation && !selectedPhoto && (
                      <p className="text-gray-400 text-sm mt-3">
                        Please select a delivery photo first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryExecutivePage;
