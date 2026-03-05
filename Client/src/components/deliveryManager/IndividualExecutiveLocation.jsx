import React, { useState, useEffect } from 'react';
import { FiUsers, FiMapPin, FiRefreshCw, FiSearch, FiCheck, FiMail, FiPhone, FiNavigation, FiActivity } from 'react-icons/fi';
import { useActiveExecutives } from '../../hooks/deliverymanager';
import { useLiveVehicleTracking } from '../../hooks/deliverymanager/useAIRouteOptimization';
import { message } from 'antd';

/**
 * IndividualExecutiveLocation Component
 * Allows selecting a delivery executive and viewing their current location on Google Maps
 */
const IndividualExecutiveLocation = () => {
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    data: activeExecutivesData,
    isLoading: loadingExecutives,
    error: executivesError,
    refetch: refetchExecutives
  } = useActiveExecutives();

  const executives = activeExecutivesData?.data?.executives || activeExecutivesData?.data?.data || [];

  // Fetch vehicle tracking for selected executive
  const {
    data: vehicleTrackingData,
    isLoading: loadingVehicleTracking,
    error: vehicleTrackingError
  } = useLiveVehicleTracking(
    { driver_id: selectedExecutive?.id },
    { enabled: !!selectedExecutive?.id }
  );

  // Get vehicle tracking info for selected executive
  const vehicleTracking = vehicleTrackingData?.vehicles?.[0] || 
                         vehicleTrackingData?.data?.[0] || 
                         null;

  // Filter executives based on search query
  const filteredExecutives = executives.filter(exec => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (exec.name || exec.email || '').toLowerCase();
    const email = (exec.email || '').toLowerCase();
    const phone = (exec.phoneNumber || '').toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  // Get location for selected executive (prioritize vehicle tracking data)
  const getExecutiveLocation = (executive) => {
    // First try to get from vehicle tracking data
    if (vehicleTracking && vehicleTracking.latitude && vehicleTracking.longitude) {
      return {
        location: vehicleTracking.address || vehicleTracking.location || 'Current Location',
        latitude: vehicleTracking.latitude,
        longitude: vehicleTracking.longitude
      };
    }
    
    // Fallback to executive data
    const location = executive.currentLocation || 
                     executive.location || 
                     executive.deliveryExecutive?.location ||
                     'Kochi, Kerala'; // Default location
    
    // Try to get coordinates if available
    const latitude = executive.latitude || 
                     executive.deliveryExecutive?.latitude || 
                     null;
    const longitude = executive.longitude || 
                      executive.deliveryExecutive?.longitude || 
                      null;

    return { location, latitude, longitude };
  };

  // Generate Google Maps iframe URL
  const getGoogleMapsUrl = (executive) => {
    const { location, latitude, longitude } = getExecutiveLocation(executive);
    
    if (latitude && longitude) {
      // Use coordinates if available - embed URL format
      const encodedLocation = encodeURIComponent(`${latitude},${longitude}`);
      return `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
    } else {
      // Use location name/address - embed URL format (no API key needed)
      const encodedLocation = encodeURIComponent(location);
      return `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
    }
  };

  const handleSelectExecutive = (executive) => {
    setSelectedExecutive(executive);
  };

  const handleRefresh = () => {
    refetchExecutives();
    message.success('Executives list refreshed');
  };

  // Add custom scrollbar styling
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('custom-scrollbar-style')) {
      const style = document.createElement('style');
      style.id = 'custom-scrollbar-style';
      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (loadingExecutives) {
    return (
      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading executives...</p>
          </div>
        </div>
      </div>
    );
  }

  if (executivesError) {
    return (
      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">Error loading executives</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact Executive Selection Panel */}
      <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
        {/* Compact Header */}
        <div className="bg-gray-800 px-4 py-2.5 border-b border-gray-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiUsers className="text-blue-400 text-base" />
            <h4 className="text-sm font-semibold text-white">Select Executive</h4>
            <span className="text-xs text-gray-400">({filteredExecutives.length})</span>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className="text-sm" />
          </button>
        </div>

        <div className="p-3">
          {/* Compact Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Executives Grid - 2 Columns */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 #1f2937' }}>
            {filteredExecutives.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <FiUsers className="mx-auto mb-2 text-xl" />
                <p className="text-sm">No executives found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredExecutives.map((executive) => {
                  const isSelected = selectedExecutive?.id === executive.id;
                  const { location } = getExecutiveLocation(executive);
                  
                  return (
                    <button
                      key={executive.id}
                      onClick={() => handleSelectExecutive(executive)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-blue-500/50 hover:bg-gray-750'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Small Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isSelected 
                            ? 'bg-white/20' 
                            : 'bg-blue-500/20'
                        }`}>
                          <FiUsers className={`text-sm ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                        </div>

                        {/* Compact Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-sm flex items-center gap-1.5 ${
                                isSelected ? 'text-white' : 'text-white'
                              }`}>
                                <span className="truncate">
                                  {executive.name || executive.email?.split('@')[0] || 'Unknown'}
                                </span>
                                {isSelected && (
                                  <FiCheck className="text-white text-xs flex-shrink-0" />
                                )}
                              </div>
                              <div className={`text-xs mt-0.5 truncate ${
                                isSelected ? 'text-white/80' : 'text-gray-400'
                              }`}>
                                {executive.email || 'No email'}
                              </div>
                            </div>
                            
                            {/* Compact Status Badge */}
                            <div className="flex-shrink-0">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  executive.status === 'ACTIVE'
                                    ? isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-green-500/20 text-green-400'
                                    : isSelected
                                      ? 'bg-white/10 text-white/80'
                                      : 'bg-gray-500/20 text-gray-400'
                                }`}
                              >
                                {executive.status || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Display */}
      {selectedExecutive ? (
        <div className="bg-gray-700 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
          {/* Map Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 border-b border-gray-600">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FiMapPin className="text-blue-400 text-xl" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {selectedExecutive.name || selectedExecutive.email?.split('@')[0] || 'Selected Executive'}
                  </h4>
                  <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <FiMapPin className="text-xs" />
                    {getExecutiveLocation(selectedExecutive).location}
                  </p>
                </div>
              </div>
              
              {/* Vehicle Tracking Status */}
              {loadingVehicleTracking && selectedExecutive?.id && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                  <span className="text-xs text-gray-400">Loading tracking...</span>
                </div>
              )}
              {vehicleTracking && !loadingVehicleTracking && (
                <div className="flex items-center gap-3">
                  {vehicleTracking.status && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600">
                      <FiActivity className={`text-sm ${
                        vehicleTracking.status === 'moving' ? 'text-green-400' : 
                        vehicleTracking.status === 'idle' ? 'text-yellow-400' : 
                        'text-gray-400'
                      }`} />
                      <span className="text-xs font-medium text-white capitalize">
                        {vehicleTracking.status}
                      </span>
                    </div>
                  )}
                  {vehicleTracking.speed !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600">
                      <FiNavigation className="text-blue-400 text-sm" />
                      <span className="text-xs font-medium text-white">
                        {vehicleTracking.speed} km/h
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Vehicle Tracking Details */}
            {vehicleTracking && (
              <div className="mt-3 pt-3 border-t border-gray-600 grid grid-cols-2 md:grid-cols-4 gap-3">
                {vehicleTracking.vehicle_number && (
                  <div className="text-xs">
                    <span className="text-gray-400">Vehicle:</span>
                    <span className="text-white ml-1 font-medium">{vehicleTracking.vehicle_number}</span>
                  </div>
                )}
                {vehicleTracking.route_id && (
                  <div className="text-xs">
                    <span className="text-gray-400">Route ID:</span>
                    <span className="text-white ml-1 font-medium">{vehicleTracking.route_id}</span>
                  </div>
                )}
                {vehicleTracking.last_updated && (
                  <div className="text-xs">
                    <span className="text-gray-400">Updated:</span>
                    <span className="text-white ml-1 font-medium">
                      {new Date(vehicleTracking.last_updated).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {vehicleTracking.distance !== undefined && (
                  <div className="text-xs">
                    <span className="text-gray-400">Distance:</span>
                    <span className="text-white ml-1 font-medium">{vehicleTracking.distance.toFixed(2)} km</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Map */}
            <div className="w-full h-96 rounded-xl overflow-hidden border-2 border-gray-600 shadow-inner">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={getGoogleMapsUrl(selectedExecutive)}
                title={`Location of ${selectedExecutive.name || selectedExecutive.email}`}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-700 rounded-xl border-2 border-dashed border-gray-600 p-16 text-center">
          <div className="bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <FiMapPin className="text-4xl text-gray-500" />
          </div>
          <p className="text-lg font-medium text-gray-400 mb-2">No Executive Selected</p>
          <p className="text-sm text-gray-500">Select an executive from the list above to view their location on the map</p>
        </div>
      )}
    </div>
  );
};

export default IndividualExecutiveLocation;

