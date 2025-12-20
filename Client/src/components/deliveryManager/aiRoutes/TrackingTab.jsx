import React, { useState, useRef, useEffect } from 'react';
import { FiNavigation, FiPlay, FiMapPin, FiClock, FiActivity, FiSave, FiStopCircle, FiTruck, FiExternalLink } from 'react-icons/fi';
import { showSuccessToast, showErrorToast } from '../../../utils/toastConfig.jsx';
import { useGetAllVehicleTracking } from '../../../hooks/deliverymanager/useAIRouteOptimization';

/**
 * TrackingTab - Component for journey tracking
 * Handles start/stop journey functionality, vehicle tracking, and tracking status
 */
const TrackingTab = ({ onStartJourneyClick, onVehicleTracking, vehicleTrackingLoading }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingPoints, setTrackingPoints] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [trackingData, setTrackingData] = useState({
    route_id: '',
    driver_id: '',
    session_id: ''
  });
  const trackingIntervalRef = useRef(null);
  const updateNumberRef = useRef(0);

  // Fetch all vehicle tracking data
  const { 
    data: allVehicleTrackingData, 
    isLoading: allVehicleTrackingLoading, 
    error: allVehicleTrackingError,
    refetch: refetchAllVehicleTracking
  } = useGetAllVehicleTracking({
    enabled: true,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Get current GPS location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || null,
            speed: position.coords.speed ? (position.coords.speed * 3.6) : null // Convert m/s to km/h
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Start tracking
  const handleStartTracking = async () => {
    if (!trackingData.route_id) {
      showErrorToast('Please enter a route ID');
      return;
    }

    try {
      // Get initial location
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      // Reset tracking points
      setTrackingPoints([]);
      updateNumberRef.current = 0;
      setIsTracking(true);

      // Start periodic location updates (every 10 seconds)
      trackingIntervalRef.current = setInterval(async () => {
        try {
          const newLocation = await getCurrentLocation();
          setCurrentLocation(newLocation);
          
          const trackingPoint = {
            timestamp: new Date().toISOString(),
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            speed_kmh: newLocation.speed,
            heading_degrees: newLocation.heading,
            accuracy_meters: newLocation.accuracy,
            update_number: ++updateNumberRef.current
          };

          setTrackingPoints(prev => [...prev, trackingPoint]);
        } catch (error) {
          console.error('Error getting location:', error);
          showErrorToast('Failed to get location update');
        }
      }, 10000); // Update every 10 seconds

      showSuccessToast('Tracking started successfully');
    } catch (error) {
      showErrorToast(error.message || 'Failed to start tracking');
    }
  };

  // Stop tracking
  const handleStopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
    showSuccessToast('Tracking stopped');
  };

  // Save tracking data
  const handleSaveTracking = async () => {
    if (trackingPoints.length === 0) {
      showErrorToast('No tracking points to save');
      return;
    }

    if (!trackingData.route_id) {
      showErrorToast('Route ID is required');
      return;
    }

    try {
      await onVehicleTracking({
        route_id: trackingData.route_id,
        driver_id: trackingData.driver_id || undefined,
        session_id: trackingData.session_id || undefined,
        tracking_points: trackingPoints
      });

      showSuccessToast(`Successfully saved ${trackingPoints.length} tracking points`);
      setTrackingPoints([]);
      updateNumberRef.current = 0;
    } catch (error) {
      showErrorToast(error.message || 'Failed to save tracking data');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiNavigation className="text-blue-400 text-xl" />
          <h2 className="text-xl font-bold text-white">Journey Tracking</h2>
        </div>
        <button
          onClick={onStartJourneyClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <FiPlay className="w-4 h-4" />
          <span>Start New Journey</span>
        </button>
      </div>

      {/* Tracking Configuration */}
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiMapPin className="text-blue-400" />
          Vehicle Tracking Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Route ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={trackingData.route_id}
              onChange={(e) => setTrackingData(prev => ({ ...prev, route_id: e.target.value }))}
              placeholder="Enter route ID"
              disabled={isTracking}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Driver ID
            </label>
            <input
              type="text"
              value={trackingData.driver_id}
              onChange={(e) => setTrackingData(prev => ({ ...prev, driver_id: e.target.value }))}
              placeholder="Enter driver ID (optional)"
              disabled={isTracking}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session ID
            </label>
            <input
              type="text"
              value={trackingData.session_id}
              onChange={(e) => setTrackingData(prev => ({ ...prev, session_id: e.target.value }))}
              placeholder="Enter session ID (optional)"
              disabled={isTracking}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Tracking Controls */}
        <div className="flex items-center gap-3">
          {!isTracking ? (
            <button
              onClick={handleStartTracking}
              disabled={!trackingData.route_id}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlay className="w-4 h-4" />
              <span>Start Tracking</span>
            </button>
          ) : (
            <button
              onClick={handleStopTracking}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <FiStopCircle className="w-4 h-4" />
              <span>Stop Tracking</span>
            </button>
          )}
          
          {trackingPoints.length > 0 && (
            <button
              onClick={handleSaveTracking}
              disabled={vehicleTrackingLoading || isTracking}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {vehicleTrackingLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span>Save Tracking Data ({trackingPoints.length} points)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Current Location Display */}
      {currentLocation && (
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FiMapPin className="text-green-400" />
            Current Location
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-400">Latitude</div>
              <div className="text-white font-mono text-sm">{currentLocation.latitude.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Longitude</div>
              <div className="text-white font-mono text-sm">{currentLocation.longitude.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Accuracy</div>
              <div className="text-white font-mono text-sm">{currentLocation.accuracy?.toFixed(1)} m</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Speed</div>
              <div className="text-white font-mono text-sm">
                {currentLocation.speed ? `${currentLocation.speed.toFixed(1)} km/h` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Status */}
      {isTracking && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <FiActivity className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">Tracking Active</span>
          </div>
          <div className="text-sm text-green-300">
            <div>Points collected: <span className="font-bold">{trackingPoints.length}</span></div>
            <div>Update interval: Every 10 seconds</div>
            <div>Last update: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {/* Tracking Points List */}
      {trackingPoints.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FiClock className="text-blue-400" />
            Tracking Points ({trackingPoints.length})
          </h3>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {trackingPoints.slice(-10).reverse().map((point, index) => (
              <div key={index} className="bg-gray-800 rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400">Update #{point.update_number}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(point.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Lat:</span> {point.latitude.toFixed(6)}
                  </div>
                  <div>
                    <span className="text-gray-400">Lng:</span> {point.longitude.toFixed(6)}
                  </div>
                  <div>
                    <span className="text-gray-400">Speed:</span> {point.speed_kmh ? `${point.speed_kmh.toFixed(1)} km/h` : 'N/A'}
                  </div>
                  <div>
                    <span className="text-gray-400">Accuracy:</span> {point.accuracy_meters?.toFixed(1)}m
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {trackingPoints.length > 10 && (
            <div className="mt-2 text-xs text-gray-400 text-center">
              Showing last 10 points. Total: {trackingPoints.length} points
            </div>
          )}
        </div>
      )}

      {/* All Vehicle Tracking */}
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiTruck className="text-blue-400" />
            Active Vehicle Tracking
            {allVehicleTrackingData?.total_active_vehicles !== undefined && (
              <span className="text-sm font-normal text-gray-400">
                ({allVehicleTrackingData.total_active_vehicles} active)
              </span>
            )}
          </h3>
          <button
            onClick={() => refetchAllVehicleTracking()}
            disabled={allVehicleTrackingLoading}
            className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
          >
            {allVehicleTrackingLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {allVehicleTrackingLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading vehicle tracking data...</p>
          </div>
        )}

        {allVehicleTrackingError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              Error loading vehicle tracking: {allVehicleTrackingError.message}
            </p>
          </div>
        )}

        {!allVehicleTrackingLoading && !allVehicleTrackingError && (
          <>
            {!allVehicleTrackingData?.vehicles || allVehicleTrackingData.vehicles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No active vehicles being tracked</p>
                <p className="text-xs text-gray-500 mt-1">Start a journey to see tracking status</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allVehicleTrackingData.vehicles.map((vehicle, index) => (
                  <div
                    key={vehicle.route_id || index}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-blue-500/50 transition-colors"
                  >
                    {/* Vehicle Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FiTruck className="text-blue-400" />
                          <h4 className="text-white font-semibold">{vehicle.vehicle_display || vehicle.vehicle_registration}</h4>
                          {vehicle.is_tracking && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 space-y-0.5">
                          <div>Route: <span className="text-gray-300">{vehicle.route_id}</span></div>
                          {vehicle.driver_id && (
                            <div>Driver: <span className="text-gray-300">{vehicle.driver_id}</span></div>
                          )}
                          <div>
                            {vehicle.delivery_date} • {vehicle.delivery_session}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Location */}
                    {vehicle.current_location && (
                      <div className="bg-gray-700/50 rounded p-3 mb-3">
                        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <FiMapPin className="text-green-400" />
                          Current Location
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Lat:</span>
                            <span className="text-white font-mono ml-1">
                              {vehicle.current_location.latitude?.toFixed(6)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Lng:</span>
                            <span className="text-white font-mono ml-1">
                              {vehicle.current_location.longitude?.toFixed(6)}
                            </span>
                          </div>
                          {vehicle.current_location.speed_kmh !== null && vehicle.current_location.speed_kmh !== undefined && (
                            <div>
                              <span className="text-gray-400">Speed:</span>
                              <span className="text-white ml-1">
                                {vehicle.current_location.speed_kmh.toFixed(1)} km/h
                              </span>
                            </div>
                          )}
                          {vehicle.current_location.heading_degrees !== null && vehicle.current_location.heading_degrees !== undefined && (
                            <div>
                              <span className="text-gray-400">Heading:</span>
                              <span className="text-white ml-1">
                                {vehicle.current_location.heading_degrees}°
                              </span>
                            </div>
                          )}
                        </div>
                        {vehicle.current_location.last_update && (
                          <div className="text-xs text-gray-500 mt-2">
                            Last update: {new Date(vehicle.current_location.last_update).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tracking Stats */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-gray-400">
                        Tracking Points: <span className="text-white font-semibold">{vehicle.total_tracking_points || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {vehicle.google_maps_link && (
                          <a
                            href={vehicle.google_maps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <FiExternalLink className="w-3 h-3" />
                            <span>Google Maps</span>
                          </a>
                        )}
                        {vehicle.mapmyindia_url && (
                          <a
                            href={vehicle.mapmyindia_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <FiExternalLink className="w-3 h-3" />
                            <span>MapMyIndia</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {allVehicleTrackingData?.timestamp && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Last updated: {new Date(allVehicleTrackingData.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingTab;
