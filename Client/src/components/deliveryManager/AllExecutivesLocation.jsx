import React, { useState, useMemo } from 'react';
import { FiMapPin, FiRefreshCw, FiUsers, FiSearch, FiNavigation, FiActivity } from 'react-icons/fi';
import { useActiveExecutives } from '../../hooks/deliverymanager';
import { useLiveVehicleTracking } from '../../hooks/deliverymanager/useAIRouteOptimization';
import { message } from 'antd';

/**
 * AllExecutivesLocation Component
 * Displays all delivery executives' locations on a single Google Maps view
 */
const AllExecutivesLocation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    data: activeExecutivesData,
    isLoading: loadingExecutives,
    error: executivesError,
    refetch: refetchExecutives
  } = useActiveExecutives();

  const executives = activeExecutivesData?.data?.executives || activeExecutivesData?.data?.data || [];

  // Fetch live vehicle tracking for all active vehicles
  const {
    data: vehicleTrackingData,
    isLoading: loadingVehicleTracking,
    error: vehicleTrackingError
  } = useLiveVehicleTracking(
    { active_only: true },
    { enabled: true }
  );

  // Create a map of driver_id to vehicle tracking data for quick lookup
  const vehicleTrackingMap = useMemo(() => {
    const map = {};
    const vehicles = vehicleTrackingData?.vehicles || vehicleTrackingData?.data || [];
    vehicles.forEach(vehicle => {
      if (vehicle.driver_id) {
        map[vehicle.driver_id] = vehicle;
      }
    });
    return map;
  }, [vehicleTrackingData]);

  // Filter executives based on search query
  const filteredExecutives = executives.filter(exec => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (exec.name || exec.email || '').toLowerCase();
    const email = (exec.email || '').toLowerCase();
    const phone = (exec.phoneNumber || '').toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  // Get location for executive (prioritize vehicle tracking data)
  const getExecutiveLocation = (executive) => {
    // First try to get from vehicle tracking data
    const vehicleTracking = vehicleTrackingMap[executive.id];
    if (vehicleTracking && vehicleTracking.latitude && vehicleTracking.longitude) {
      return {
        location: vehicleTracking.address || vehicleTracking.location || 'Current Location',
        latitude: vehicleTracking.latitude,
        longitude: vehicleTracking.longitude,
        vehicleTracking
      };
    }
    
    // Fallback to executive data
    const location = executive.currentLocation || 
                     executive.location || 
                     executive.deliveryExecutive?.location ||
                     'Kochi, Kerala';
    
    const latitude = executive.latitude || 
                     executive.deliveryExecutive?.latitude || 
                     null;
    const longitude = executive.longitude || 
                      executive.deliveryExecutive?.longitude || 
                      null;

    return { location, latitude, longitude, vehicleTracking: null };
  };

  // Generate Google Maps URL for individual executive
  const getExecutiveMapUrl = (executive) => {
    const { location, latitude, longitude } = getExecutiveLocation(executive);
    
    if (latitude && longitude) {
      // Use coordinates if available
      const encodedLocation = encodeURIComponent(`${latitude},${longitude}`);
      return `https://www.google.com/maps?q=${encodedLocation}&output=embed&z=15`;
    } else {
      // Use location name/address
      const encodedLocation = encodeURIComponent(location);
      return `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
    }
  };

  const handleRefresh = () => {
    refetchExecutives();
    message.success('Executives list refreshed');
  };

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
      {/* Header with Search and Refresh */}
      <div className="bg-gray-700 rounded-lg border border-gray-600 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiUsers className="text-blue-400" />
              All Executives ({filteredExecutives.length})
            </h4>
            {loadingVehicleTracking && (
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-700/50 rounded border border-gray-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                <span className="text-xs text-gray-400">Loading tracking...</span>
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            title="Refresh executives list"
          >
            <FiRefreshCw className="text-sm" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search executives by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Executives Grid with Maps - 2 Columns */}
      {filteredExecutives.length === 0 ? (
        <div className="bg-gray-700 rounded-lg border border-gray-600 p-12">
          <div className="text-center text-gray-400">
            <FiUsers className="mx-auto mb-4 text-4xl" />
            <p className="text-lg">No executives found</p>
            {searchQuery && (
              <p className="text-sm mt-2">Try adjusting your search query</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExecutives.map((executive) => {
            const { location, vehicleTracking } = getExecutiveLocation(executive);
            
            return (
              <div
                key={executive.id}
                className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden hover:border-blue-500/50 hover:shadow-xl transition-all duration-200"
              >
                {/* Executive Info Section */}
                <div className="p-4 bg-gray-800 border-b border-gray-600">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-lg mb-1">
                        {executive.name || executive.email?.split('@')[0] || 'Unknown Executive'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1 truncate">
                        {executive.email || 'No email'}
                      </div>
                      {executive.phoneNumber && (
                        <div className="text-sm text-gray-400 mt-1">
                          📞 {executive.phoneNumber}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                          executive.status === 'ACTIVE'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}
                      >
                        {executive.status || 'UNKNOWN'}
                      </span>
                      {/* Vehicle Tracking Status */}
                      {vehicleTracking && vehicleTracking.status && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-700/50 rounded border border-gray-600">
                          <FiActivity className={`text-xs ${
                            vehicleTracking.status === 'moving' ? 'text-green-400' : 
                            vehicleTracking.status === 'idle' ? 'text-yellow-400' : 
                            'text-gray-400'
                          }`} />
                          <span className="text-xs font-medium text-white capitalize">
                            {vehicleTracking.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Location Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-300 mt-3 pt-3 border-t border-gray-700">
                    <FiMapPin className="text-blue-400 flex-shrink-0" />
                    <span className="truncate font-medium">{location}</span>
                  </div>
                  
                  {/* Vehicle Tracking Details */}
                  {vehicleTracking && (
                    <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2">
                      {vehicleTracking.vehicle_number && (
                        <div className="text-xs">
                          <span className="text-gray-400">Vehicle:</span>
                          <span className="text-white ml-1 font-medium">{vehicleTracking.vehicle_number}</span>
                        </div>
                      )}
                      {vehicleTracking.speed !== undefined && (
                        <div className="text-xs flex items-center gap-1">
                          <FiNavigation className="text-blue-400" />
                          <span className="text-gray-400">Speed:</span>
                          <span className="text-white ml-1 font-medium">{vehicleTracking.speed} km/h</span>
                        </div>
                      )}
                      {vehicleTracking.route_id && (
                        <div className="text-xs col-span-2">
                          <span className="text-gray-400">Route:</span>
                          <span className="text-white ml-1 font-medium">{vehicleTracking.route_id}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Map Section */}
                <div className="w-full h-64 bg-gray-900">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={getExecutiveMapUrl(executive)}
                    title={`Location of ${executive.name || executive.email}`}
                    className="w-full h-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllExecutivesLocation;

