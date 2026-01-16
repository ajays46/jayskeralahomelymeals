import React, { useState } from 'react';
import { FiTruck, FiExternalLink, FiUsers, FiRefreshCw, FiSearch, FiMapPin, FiNavigation } from 'react-icons/fi';
import { useGetAllVehicleTracking, useLiveVehicleTracking } from '../../../hooks/deliverymanager/useAIRouteOptimization';
import { useActiveExecutives } from '../../../hooks/deliverymanager';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * TrackingTab - Component for live vehicle tracking
 * Displays individual executive and all executives vehicle tracking with filters
 */
const TrackingTab = ({ onVehicleTracking, vehicleTrackingLoading } = {}) => {
  
  // Tabs for Individual Executive and All Executives
  const [activeTrackingTab, setActiveTrackingTab] = useState('all'); // 'individual' or 'all'
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState(null); // Filter by vehicle
  const [viewMode, setViewMode] = useState('executives'); // 'executives' or 'vehicles'
  
  // Filters for All Executives tab
  const [activeStatusFilter, setActiveStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [movingStatusFilter, setMovingStatusFilter] = useState('all'); // 'all', 'moving', 'stopped', 'no_data'
  const [activeMovingFilter, setActiveMovingFilter] = useState(false); // true = active AND moving
  const [selectedDriverId, setSelectedDriverId] = useState(''); // Filter by driver_id (selected from dropdown)
  
  // Fetch active executives for selection
  const {
    data: activeExecutivesData,
    isLoading: loadingExecutives,
    error: executivesError,
    refetch: refetchExecutives
  } = useActiveExecutives();
  
  const executives = activeExecutivesData?.data?.executives || activeExecutivesData?.data?.data || [];
  const vehicleChoices = activeExecutivesData?.data?.vehicle_choices || [];
  
  // Filter executives based on search query and vehicle filter
  const filteredExecutives = executives.filter(exec => {
    // Vehicle filter
    if (selectedVehicleFilter && exec.vehicle !== selectedVehicleFilter) {
      return false;
    }
    
    // Search query filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (exec.exec_name || exec.name || '').toLowerCase();
    const vehicle = (exec.vehicle || '').toLowerCase();
    const phone = (exec.whatsapp_number || exec.phoneNumber || '').toLowerCase();
    const userId = (exec.user_id || exec.id || '').toLowerCase();
    return name.includes(query) || vehicle.includes(query) || phone.includes(query) || userId.includes(query);
  });
  
  // Get executives grouped by vehicle
  const executivesByVehicle = vehicleChoices.reduce((acc, vehicle) => {
    const execsForVehicle = executives.filter(exec => exec.vehicle === vehicle);
    if (execsForVehicle.length > 0) {
      acc[vehicle] = execsForVehicle;
    }
    return acc;
  }, {});
  
  // Executives without vehicles
  const executivesWithoutVehicle = executives.filter(exec => !exec.vehicle || exec.vehicle === null);

  // Fetch live vehicle tracking for individual executive
  const {
    data: individualVehicleTrackingData,
    isLoading: loadingIndividualTracking,
    error: individualTrackingError,
    refetch: refetchIndividualTracking
  } = useLiveVehicleTracking(
    { driver_id: selectedExecutive?.user_id || selectedExecutive?.id },
    { enabled: activeTrackingTab === 'individual' && !!(selectedExecutive?.user_id || selectedExecutive?.id) }
  );

  // Build API query parameters based on filters
  // Calculate params based on current filter state using useMemo for stability
  const apiQueryParams = React.useMemo(() => {
    if (activeTrackingTab !== 'all') return {};
    
    const params = {};
    
    // Active filter: active_only=true when 'active' is selected
    if (activeStatusFilter === 'active') {
      params.active_only = true;
    }
    
    // Movement status filter: status=moving/stopped/no_data
    if (movingStatusFilter !== 'all') {
      params.status = movingStatusFilter;
    }
    
    // Driver ID filter
    if (selectedDriverId && selectedDriverId.trim()) {
      params.driver_id = selectedDriverId.trim();
    }
    
    // Active + Moving filter: if enabled, ensure both active_only and status are set
    if (activeMovingFilter) {
      params.active_only = true;
      params.status = 'moving';
    }
    
    return params;
  }, [activeTrackingTab, activeStatusFilter, movingStatusFilter, selectedDriverId, activeMovingFilter]);
  
  // Fetch live vehicle tracking with API filters
  const {
    data: allVehicleTrackingData,
    isLoading: loadingAllTracking,
    error: allTrackingError,
    refetch: refetchAllTracking
  } = useLiveVehicleTracking(
    apiQueryParams, // Pass all filter parameters to API
    { enabled: activeTrackingTab === 'all' }
  );

  // Get vehicle tracking data based on active tab
  // API response structure: { success: true, vehicles: [...], total_vehicles: X, ... }
  const allVehicles = activeTrackingTab === 'individual' 
    ? (individualVehicleTrackingData?.vehicles || individualVehicleTrackingData?.data?.vehicles || individualVehicleTrackingData?.data || [])
    : (allVehicleTrackingData?.vehicles || allVehicleTrackingData?.data?.vehicles || allVehicleTrackingData?.data || []);
  
  // Apply client-side filters for All Executives tab
  // Note: Most filters are handled by API (active_only, status, driver_id)
  // Only filter for 'inactive' status client-side since API doesn't support it
  const vehicleTrackingList = activeTrackingTab === 'all' 
    ? allVehicles.filter(vehicle => {
        // Inactive filter: API doesn't support inactive_only, so filter client-side
        if (activeStatusFilter === 'inactive' && vehicle.active === true) return false;
        
        // All other filters (active_only, status, driver_id) are handled by API
        // No need to filter them client-side
        
        return true;
      })
    : allVehicles;
  
  const isLoadingTracking = activeTrackingTab === 'individual' 
    ? loadingIndividualTracking 
    : loadingAllTracking;
  
  const trackingError = activeTrackingTab === 'individual' 
    ? individualTrackingError 
    : allTrackingError;
  
  const refetchTracking = activeTrackingTab === 'individual' 
    ? refetchIndividualTracking 
    : refetchAllTracking;


  // Error boundary - if there's an error, show it
  if (executivesError) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400 text-sm">
          Error loading executives: {executivesError.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Vehicle Tracking with Tabs */}
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        {/* Tabs for Individual Executive and All Executives */}
        <div className="mb-4">
          <div className="bg-gray-800 rounded-lg p-1 flex gap-2 border border-gray-600">
            <button
              onClick={() => {
                setActiveTrackingTab('individual');
                setSelectedExecutive(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTrackingTab === 'individual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FiUsers className="text-sm" />
              <span>Individual Executive</span>
            </button>
            <button
              onClick={() => setActiveTrackingTab('all')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTrackingTab === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FiTruck className="text-sm" />
              <span>All Executives</span>
            </button>
          </div>
        </div>

        {/* Individual Executive Tab Content */}
        {activeTrackingTab === 'individual' && (
          <div className="space-y-4">
            {/* Executive Selection */}
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FiUsers className="text-blue-400" />
                  Select Executive
                  <span className="text-xs font-normal text-gray-400">
                    ({filteredExecutives.length}{searchQuery || selectedVehicleFilter ? ` of ${executives.length}` : ''})
                  </span>
                </h4>
                <button
                  onClick={() => refetchExecutives()}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Refresh"
                >
                  <FiRefreshCw className="text-sm" />
                </button>
              </div>
              
              {/* View Mode Toggle */}
              <div className="mb-3 flex gap-2 bg-gray-700/50 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('executives');
                    setSelectedVehicleFilter(null);
                  }}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-all ${
                    viewMode === 'executives'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                  }`}
                >
                  <FiUsers className="inline mr-1" />
                  By Executive ({executives.length})
                </button>
                <button
                  onClick={() => {
                    setViewMode('vehicles');
                    setSelectedVehicleFilter(null);
                  }}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-all ${
                    viewMode === 'vehicles'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                  }`}
                >
                  <FiTruck className="inline mr-1" />
                  By Vehicle ({vehicleChoices.length})
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-3">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search executives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
              
              {/* Vehicle Filter (when viewing by executive) */}
              {viewMode === 'executives' && vehicleChoices.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1.5">Filter by Vehicle:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedVehicleFilter(null)}
                      className={`px-2.5 py-1 text-xs rounded border transition-all ${
                        !selectedVehicleFilter
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500/50'
                      }`}
                    >
                      All
                    </button>
                    {vehicleChoices.map((vehicle) => (
                      <button
                        key={vehicle}
                        onClick={() => setSelectedVehicleFilter(vehicle)}
                        className={`px-2.5 py-1 text-xs rounded border transition-all flex items-center gap-1 ${
                          selectedVehicleFilter === vehicle
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500/50'
                        }`}
                      >
                        <FiTruck className="text-xs" />
                        {vehicle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Executives List - By Executive View */}
              {loadingExecutives ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
                </div>
              ) : viewMode === 'executives' ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredExecutives.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No executives found
                    </div>
                  ) : (
                    filteredExecutives.map((executive) => {
                      const execId = executive.user_id || executive.id;
                      const isSelected = selectedExecutive && (selectedExecutive.user_id === execId || selectedExecutive.id === execId);
                      
                      return (
                        <button
                          key={execId}
                          onClick={() => setSelectedExecutive(executive)}
                          className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-400'
                              : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {executive.exec_name || executive.name || 'Unknown'}
                              </div>
                              <div className="text-xs opacity-80 space-y-0.5 mt-1">
                                {executive.vehicle && (
                                  <div className="flex items-center gap-1">
                                    <FiTruck className="text-xs" />
                                    <span>{executive.vehicle}</span>
                                  </div>
                                )}
                                {executive.whatsapp_number && (
                                  <div className="flex items-center gap-1">
                                    <span>📱 {executive.whatsapp_number}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                              executive.status === 'ACTIVE'
                                ? isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {executive.status || 'N/A'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                /* By Vehicle View */
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {Object.keys(executivesByVehicle).length === 0 && executivesWithoutVehicle.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No vehicles found
                    </div>
                  ) : (
                    <>
                      {/* Executives grouped by vehicle */}
                      {Object.entries(executivesByVehicle).map(([vehicle, execs]) => (
                        <div key={vehicle} className="bg-gray-700/50 rounded-lg p-2 border border-gray-600">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <FiTruck className="text-blue-400 text-sm" />
                            <h5 className="text-sm font-semibold text-white">{vehicle}</h5>
                            <span className="text-xs text-gray-400">({execs.length} {execs.length === 1 ? 'executive' : 'executives'})</span>
                          </div>
                          <div className="space-y-1.5">
                            {execs.map((executive) => {
                              const execId = executive.user_id || executive.id;
                              const isSelected = selectedExecutive && (selectedExecutive.user_id === execId || selectedExecutive.id === execId);
                              
                              return (
                                <button
                                  key={execId}
                                  onClick={() => setSelectedExecutive(executive)}
                                  className={`w-full text-left p-2 rounded transition-all border ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-400'
                                      : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-blue-500/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-xs">
                                        {executive.exec_name || executive.name || 'Unknown'}
                                      </div>
                                      {executive.whatsapp_number && (
                                        <div className="text-xs opacity-80 mt-0.5">
                                          📱 {executive.whatsapp_number}
                                        </div>
                                      )}
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                                      executive.status === 'ACTIVE'
                                        ? isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-green-500/20 text-green-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {executive.status || 'N/A'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {/* Executives without vehicles */}
                      {executivesWithoutVehicle.length > 0 && (
                        <div className="bg-gray-700/50 rounded-lg p-2 border border-gray-600">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <FiUsers className="text-yellow-400 text-sm" />
                            <h5 className="text-sm font-semibold text-white">No Vehicle Assigned</h5>
                            <span className="text-xs text-gray-400">({executivesWithoutVehicle.length})</span>
                          </div>
                          <div className="space-y-1.5">
                            {executivesWithoutVehicle.map((executive) => {
                              const execId = executive.user_id || executive.id;
                              const isSelected = selectedExecutive && (selectedExecutive.user_id === execId || selectedExecutive.id === execId);
                              
                              return (
                                <button
                                  key={execId}
                                  onClick={() => setSelectedExecutive(executive)}
                                  className={`w-full text-left p-2 rounded transition-all border ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-400'
                                      : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-blue-500/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-xs">
                                        {executive.exec_name || executive.name || 'Unknown'}
                                      </div>
                                      {executive.whatsapp_number && (
                                        <div className="text-xs opacity-80 mt-0.5">
                                          📱 {executive.whatsapp_number}
                                        </div>
                                      )}
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                                      executive.status === 'ACTIVE'
                                        ? isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-green-500/20 text-green-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {executive.status || 'N/A'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Tracking for Selected Executive */}
            {selectedExecutive ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiTruck className="text-blue-400" />
                    Vehicle Tracking: {selectedExecutive.exec_name || selectedExecutive.name || 'Unknown Executive'}
                  </h4>
                  <button
                    onClick={() => refetchTracking()}
                    disabled={isLoadingTracking}
                    className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiRefreshCw className={`text-sm ${isLoadingTracking ? 'animate-spin' : ''}`} />
                    <span>{isLoadingTracking ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>

                {isLoadingTracking && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading vehicle tracking...</p>
                  </div>
                )}

                {trackingError && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm">
                      Error: {trackingError.message}
                    </p>
                  </div>
                )}

                {!isLoadingTracking && !trackingError && vehicleTrackingList.length === 0 && (
                  <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-600">
                    <FiTruck className="mx-auto mb-2 text-4xl text-gray-500" />
                    <p className="text-gray-400">No vehicle tracking data available</p>
                    <p className="text-xs text-gray-500 mt-1">This executive may not be on an active journey</p>
                  </div>
                )}

                {!isLoadingTracking && !trackingError && vehicleTrackingList.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {vehicleTrackingList.map((vehicle, index) => {
                      // Create unique key by combining multiple fields to avoid duplicates
                      const uniqueKey = `${vehicle.device_id || 'device'}-${vehicle.vehicle_number || 'vehicle'}-${vehicle.driver?.user_id || 'driver'}-${index}`;
                      return (
                        <VehicleTrackingCard key={uniqueKey} vehicle={vehicle} />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-600">
                <FiUsers className="mx-auto mb-2 text-4xl text-gray-500" />
                <p className="text-gray-400">Select an executive to view their vehicle tracking</p>
              </div>
            )}
          </div>
        )}

        {/* All Executives Tab Content */}
        {activeTrackingTab === 'all' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiTruck className="text-blue-400" />
                All Vehicle Tracking
                {vehicleTrackingList.length > 0 && (
                  <span className="text-sm font-normal text-gray-400">
                    ({vehicleTrackingList.length} {vehicleTrackingList.length === 1 ? 'vehicle' : 'vehicles'})
                  </span>
                )}
                {allVehicleTrackingData?.total_vehicles !== undefined && (
                  <span className="text-xs text-gray-500">
                    (Total: {allVehicleTrackingData.total_vehicles})
                  </span>
                )}
              </h3>
              <button
                onClick={() => refetchTracking()}
                disabled={isLoadingTracking}
                className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FiRefreshCw className={`text-sm ${isLoadingTracking ? 'animate-spin' : ''}`} />
                <span>{isLoadingTracking ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            {/* Filters Section */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <FiSearch className="text-blue-400" />
                <h4 className="text-sm font-semibold text-white">Filters</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active/Inactive Filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Active Status</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveStatusFilter('all')}
                      className={`flex-1 px-2 py-1.5 text-xs rounded border transition-all ${
                        activeStatusFilter === 'all'
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-blue-500/50'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveStatusFilter('active')}
                      className={`flex-1 px-2 py-1.5 text-xs rounded border transition-all ${
                        activeStatusFilter === 'active'
                          ? 'bg-green-600 text-white border-green-400'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-green-500/50'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setActiveStatusFilter('inactive')}
                      className={`flex-1 px-2 py-1.5 text-xs rounded border transition-all ${
                        activeStatusFilter === 'inactive'
                          ? 'bg-red-600 text-white border-red-400'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-red-500/50'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>

                {/* Moving Status Filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Movement Status</label>
                  <select
                    value={movingStatusFilter}
                    onChange={(e) => setMovingStatusFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="moving">Moving</option>
                    <option value="stopped">Stopped</option>
                    <option value="no_data">No Data</option>
                  </select>
                </div>

                {/* Active + Moving Filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Active & Moving</label>
                  <button
                    onClick={() => {
                      const newValue = !activeMovingFilter;
                      setActiveMovingFilter(newValue);
                      // When enabled, automatically set active and moving filters
                      if (newValue) {
                        setActiveStatusFilter('active');
                        setMovingStatusFilter('moving');
                      }
                    }}
                    className={`w-full px-2 py-1.5 text-xs rounded border transition-all ${
                      activeMovingFilter
                        ? 'bg-green-600 text-white border-green-400'
                        : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-green-500/50'
                    }`}
                  >
                    {activeMovingFilter ? '✓ Enabled' : 'Disabled'}
                  </button>
                  {activeMovingFilter && (
                    <p className="text-xs text-gray-500 mt-1">Sets: Active + Moving</p>
                  )}
                </div>

                {/* Driver ID Filter - Dropdown */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Select Driver</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Drivers</option>
                    {executives.map((executive) => {
                      const execId = executive.user_id || executive.id;
                      const execName = executive.exec_name || executive.name || 'Unknown';
                      const vehicle = executive.vehicle ? ` - ${executive.vehicle}` : '';
                      const status = executive.status === 'ACTIVE' ? ' 🟢' : ' ⚪';
                      
                      return (
                        <option key={execId} value={execId}>
                          {execName}{vehicle}{status}
                        </option>
                      );
                    })}
                  </select>
                  {selectedDriverId && (
                    <div className="mt-1 text-xs text-gray-500">
                      {executives.find(e => (e.user_id || e.id) === selectedDriverId)?.exec_name || 'Selected'}
                    </div>
                  )}
                </div>
              </div>

              {/* Clear Filters Button */}
              {(activeStatusFilter !== 'all' || movingStatusFilter !== 'all' || activeMovingFilter || selectedDriverId) && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <button
                    onClick={() => {
                      setActiveStatusFilter('all');
                      setMovingStatusFilter('all');
                      setActiveMovingFilter(false);
                      setSelectedDriverId('');
                    }}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {isLoadingTracking && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading vehicle tracking data...</p>
              </div>
            )}

            {trackingError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  Error loading vehicle tracking: {trackingError.message}
                </p>
              </div>
            )}

            {!isLoadingTracking && !trackingError && vehicleTrackingList.length === 0 && (
              <div className="text-center py-8">
                <FiTruck className="mx-auto mb-4 text-4xl text-gray-500" />
                <p className="text-gray-400">No vehicles being tracked</p>
                <p className="text-xs text-gray-500 mt-1">No vehicle tracking data available at this time</p>
              </div>
            )}

            {!isLoadingTracking && !trackingError && vehicleTrackingList.length > 0 && (
              <>
                {/* Summary Stats */}
                {allVehicleTrackingData?.total_vehicles && (
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                      <div className="text-xs text-gray-400">Total Vehicles</div>
                      <div className="text-lg font-bold text-white">{allVehicleTrackingData.total_vehicles}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                      <div className="text-xs text-gray-400">Active</div>
                      <div className="text-lg font-bold text-green-400">
                        {vehicleTrackingList.filter(v => v.active === true).length}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                      <div className="text-xs text-gray-400">Moving</div>
                      <div className="text-lg font-bold text-green-400">
                        {vehicleTrackingList.filter(v => v.status === 'moving').length}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                      <div className="text-xs text-gray-400">Stopped</div>
                      <div className="text-lg font-bold text-yellow-400">
                        {vehicleTrackingList.filter(v => v.status === 'stopped').length}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Vehicle Tracking Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicleTrackingList.map((vehicle, index) => {
                    // Create unique key by combining multiple fields to avoid duplicates
                    const uniqueKey = `${vehicle.device_id || 'device'}-${vehicle.vehicle_number || 'vehicle'}-${vehicle.driver?.user_id || 'driver'}-${index}`;
                    return (
                      <VehicleTrackingCard 
                        key={uniqueKey} 
                        vehicle={vehicle} 
                      />
                    );
                  })}
                </div>
                
                {/* Last Updated Timestamp */}
                {allVehicleTrackingData?.timestamp && (
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    Last updated: {new Date(allVehicleTrackingData.timestamp).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Vehicle Tracking Card Component
 * Displays vehicle tracking information in a card format
 */
const VehicleTrackingCard = ({ vehicle }) => {
  // Get vehicle status with color coding
  const getStatusColor = (status) => {
    if (status === 'moving') return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (status === 'stopped') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (status === 'no_data') return 'text-red-400 bg-red-500/20 border-red-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  // Get marker icon color based on status
  const getMarkerIcon = (status) => {
    let iconColor = 'blue'; // default
    if (status === 'moving') iconColor = 'green';
    else if (status === 'stopped') iconColor = 'orange';
    else if (status === 'no_data') iconColor = 'red';
    
    try {
      return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${iconColor}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    } catch (error) {
      // Fallback to default icon if colored marker fails
      return L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }
  };

  // Extract nested data from API response
  const location = vehicle.location || {};
  const driver = vehicle.driver || {};
  const deviceDetails = vehicle.device_details || {};
  const todaysDrive = vehicle.todays_drive || {};
  const latitude = location.latitude;
  const longitude = location.longitude;
  const speed = location.speed_kph;
  const address = location.address;
  const heading = location.heading;
  const odometer = location.odometer;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-blue-500/50 transition-colors">
      {/* Vehicle Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <FiTruck className="text-blue-400" />
            <h4 className="text-white font-semibold">
              {vehicle.vehicle_number || deviceDetails.registration_number || deviceDetails.name || 'Unknown Vehicle'}
            </h4>
            {vehicle.status && (
              <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
            )}
            {vehicle.active && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Active
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 space-y-0.5">
            {driver.name && (
              <div>Driver: <span className="text-gray-300">{driver.name}</span></div>
            )}
            {driver.phone && (
              <div>Phone: <span className="text-gray-300">{driver.phone}</span></div>
            )}
            {driver.user_id && (
              <div>User ID: <span className="text-gray-300 text-xs font-mono">{driver.user_id}</span></div>
            )}
            {deviceDetails.device_type && (
              <div>Device: <span className="text-gray-300">{deviceDetails.device_type}</span></div>
            )}
            {deviceDetails.internal_battery_level !== undefined && (
              <div className="flex items-center gap-1">
                Battery: 
                <span className={`font-semibold ${
                  deviceDetails.internal_battery_level > 50 ? 'text-green-400' :
                  deviceDetails.internal_battery_level > 20 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {deviceDetails.internal_battery_level}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Location with Map */}
      {(latitude && longitude) && (
        <div className="bg-gray-700/50 rounded p-3 mb-3">
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <FiMapPin className="text-green-400" />
            Current Location
          </div>
          
          {/* Leaflet Map */}
          <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-600 mb-3">
            <MapContainer
              center={[latitude, longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker 
                position={[latitude, longitude]}
                icon={getMarkerIcon(vehicle.status)}
              >
                <Popup>
                  <div className="text-sm text-gray-100">
                    <div className="font-semibold mb-1 text-white">
                      {vehicle.vehicle_number || deviceDetails.registration_number || 'Vehicle'}
                    </div>
                    {driver.name && (
                      <div className="text-gray-300">Driver: <span className="text-white">{driver.name}</span></div>
                    )}
                    {driver.phone && (
                      <div className="text-gray-300 text-xs">Phone: <span className="text-white">{driver.phone}</span></div>
                    )}
                    {address && (
                      <div className="text-gray-300 text-xs mt-1 max-w-xs">{address}</div>
                    )}
                    {speed !== undefined && speed !== null && (
                      <div className="text-gray-300 text-xs">Speed: <span className="text-white">{speed.toFixed(1)} km/h</span></div>
                    )}
                    {heading !== undefined && heading !== null && (
                      <div className="text-gray-300 text-xs">Heading: <span className="text-white">{heading.toFixed(1)}°</span></div>
                    )}
                    {vehicle.status && (
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                          vehicle.status === 'moving' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                          vehicle.status === 'stopped' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {vehicle.status}
                        </span>
                      </div>
                    )}
                    {vehicle.last_update && (
                      <div className="text-gray-400 text-xs mt-1">
                        Updated: {new Date(vehicle.last_update).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Lat:</span>
              <span className="text-white font-mono ml-1">
                {latitude?.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Lng:</span>
              <span className="text-white font-mono ml-1">
                {longitude?.toFixed(6)}
              </span>
            </div>
            {speed !== undefined && speed !== null && (
              <div className="flex items-center gap-1">
                <FiNavigation className="text-blue-400" />
                <span className="text-gray-400">Speed:</span>
                <span className="text-white ml-1">
                  {speed.toFixed(1)} km/h
                </span>
              </div>
            )}
            {heading !== undefined && heading !== null && (
              <div>
                <span className="text-gray-400">Heading:</span>
                <span className="text-white ml-1">
                  {heading.toFixed(1)}°
                </span>
              </div>
            )}
            {address && (
              <div className="col-span-2 mt-1 pt-1 border-t border-gray-600">
                <span className="text-gray-400">Address:</span>
                <div className="text-white text-xs mt-0.5">{address}</div>
              </div>
            )}
          </div>
          {vehicle.last_update && (
            <div className="text-xs text-gray-500 mt-2">
              Last update: {new Date(vehicle.last_update).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Today's Drive Stats */}
      {(todaysDrive.today_kms !== undefined || todaysDrive.today_idle_time !== undefined || todaysDrive.today_drive_count !== undefined) && (
        <div className="bg-gray-700/30 rounded p-2 mb-3">
          <div className="text-xs text-gray-400 mb-1 font-semibold">Today's Stats</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {todaysDrive.today_kms !== undefined && (
              <div>
                <span className="text-gray-400">Distance:</span>
                <span className="text-white font-semibold ml-1">{todaysDrive.today_kms.toFixed(2)} km</span>
              </div>
            )}
            {todaysDrive.today_idle_time !== undefined && (
              <div>
                <span className="text-gray-400">Idle:</span>
                <span className="text-white font-semibold ml-1">{todaysDrive.today_idle_time} min</span>
              </div>
            )}
            {todaysDrive.today_drive_count !== undefined && (
              <div>
                <span className="text-gray-400">Trips:</span>
                <span className="text-white font-semibold ml-1">{todaysDrive.today_drive_count}</span>
              </div>
            )}
          </div>
          {odometer !== undefined && (
            <div className="text-xs text-gray-400 mt-1">
              Odometer: <span className="text-white">{odometer.toFixed(2)} km</span>
            </div>
          )}
        </div>
      )}

      {/* Additional Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-400">
          {location.gps_signal !== undefined && (
            <span>GPS Signal: <span className={`font-semibold ${
              location.gps_signal > 10 ? 'text-green-400' :
              location.gps_signal > 5 ? 'text-yellow-400' :
              'text-red-400'
            }`}>{location.gps_signal}</span></span>
          )}
        </div>
        {(latitude && longitude) && (
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <FiExternalLink className="w-3 h-3" />
            <span>View Map</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default TrackingTab;
