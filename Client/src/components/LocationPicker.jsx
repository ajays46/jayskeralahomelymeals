import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiNavigation, FiX, FiCheck } from 'react-icons/fi';

const LocationPicker = ({ 
  value, 
  onChange, 
  placeholder = "Enter delivery location...",
  className = "",
  showMap = false 
}) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const inputRef = useRef(null);

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get address
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        const address = data.display_name;
        setSelectedLocation({ lat, lng, address });
        onChange({ target: { value: address } });
        setShowLocationModal(true);
      }
    } catch (error) {
      setLocationError('Could not get address from coordinates.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    onChange({ target: { value: location.address } });
    setShowLocationModal(false);
  };

  // Handle manual input
  const handleInputChange = (e) => {
    onChange(e);
    setSelectedLocation(null);
  };

  return (
    <div className="relative">
      {/* Location Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-20 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm lg:text-base ${className}`}
        />
        
        {/* Location Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <FiMapPin className="text-gray-400 text-sm sm:text-base" />
        </div>

        {/* Get Current Location Button */}
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Get current location"
        >
          {isGettingLocation ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FiNavigation className="text-sm sm:text-base" />
          )}
        </button>
      </div>

      {/* Location Error */}
      {locationError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-xs sm:text-sm">{locationError}</p>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Location</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Detected Address:</p>
                <p className="text-sm font-medium text-gray-800">{selectedLocation.address}</p>
              </div>

              {showMap && (
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FiMapPin className="text-gray-400 text-2xl mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Map view would be here</p>
                    <p className="text-xs text-gray-400">
                      Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLocationSelect(selectedLocation)}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FiCheck size={16} />
                  Use This Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Location Indicator */}
      {selectedLocation && !showLocationModal && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FiCheck className="text-green-500 text-sm" />
            <p className="text-green-700 text-xs sm:text-sm">Location set from GPS</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 