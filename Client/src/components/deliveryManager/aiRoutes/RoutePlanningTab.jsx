import React, { useState } from 'react';
import { 
  FiMap, 
  FiClock, 
  FiZap, 
  FiUsers, 
  FiPackage, 
  FiMapPin, 
  FiTarget, 
  FiCheckCircle, 
  FiPlay,
  FiBarChart2,
  FiExternalLink,
  FiChevronUp,
  FiChevronDown
} from 'react-icons/fi';
import { showSuccessToast, showErrorToast } from '../../../utils/toastConfig.jsx';

/**
 * RoutePlanningTab - Component for AI route planning
 * Handles route planning, start time prediction, and route results display
 */
const RoutePlanningTab = ({ 
  deliveryDate,
  setDeliveryDate,
  deliverySession,
  setDeliverySession,
  numDrivers,
  setNumDrivers,
  depotLocation,
  setDepotLocation,
  routePlan,
  setRoutePlan,
  routeComparison,
  setRouteComparison,
  predictedStartTime,
  setPredictedStartTime,
  onPlanRoute,
  onPredictStartTime,
  planningRoute,
  predictingStartTime,
  onStartJourney
}) => {
  const [error, setError] = useState(null);

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FiZap className="text-yellow-400 text-xl" />
        <h2 className="text-xl font-bold text-white">AI Route Planning</h2>
      </div>
      
      {/* Planning Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Delivery Date *
          </label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Delivery Session *
          </label>
          <select
            value={deliverySession}
            onChange={(e) => setDeliverySession(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Drivers
            <span className="text-xs text-gray-400 ml-2">
              (Leave empty for AI auto-selection)
            </span>
          </label>
          <input
            type="number"
            value={numDrivers || ''}
            onChange={(e) => setNumDrivers(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Auto-select"
            min="1"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onPlanRoute}
          disabled={planningRoute}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {planningRoute ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Planning Route...</span>
            </>
          ) : (
            <>
              <FiMap className="w-4 h-4" />
              <span>Plan Route</span>
            </>
          )}
        </button>
        
        <button
          onClick={onPredictStartTime}
          disabled={predictingStartTime}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <FiClock className="w-4 h-4" />
          <span>Predict Start Time</span>
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Route Plan Results */}
      {routePlan && (
        <RoutePlanResults 
          routePlan={routePlan}
          routeComparison={routeComparison}
          deliverySession={deliverySession}
          deliveryDate={deliveryDate}
          onStartJourney={onStartJourney}
        />
      )}
      
      {/* Predicted Start Time */}
      {predictedStartTime && (
        <PredictedStartTime predictedStartTime={predictedStartTime} />
      )}
    </div>
  );
};

// Route Plan Results Component
const RoutePlanResults = ({ routePlan, routeComparison, deliverySession, deliveryDate, onStartJourney }) => {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Route Plan Results</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          routePlan.within_2_hour_constraint 
            ? 'bg-green-900/30 text-green-400' 
            : 'bg-red-900/30 text-red-400'
        }`}>
          {routePlan.within_2_hour_constraint ? 'Within 2 Hours' : 'Exceeds 2 Hours'}
        </span>
      </div>
      
      {/* Summary Cards */}
      <RouteSummaryCards routePlan={routePlan} />
      
      {/* Route Comparison */}
      {routeComparison && (
        <RouteComparison routeComparison={routeComparison} routePlan={routePlan} />
      )}
      
      {/* Individual Driver Routes - Horizontal Cards */}
      {routePlan.routes?.routes && routePlan.routes.routes.length > 0 && (
        <IndividualDriverRoutes 
          routes={routePlan.routes.routes}
          deliverySession={deliverySession}
          deliveryDate={deliveryDate}
          onStartJourney={onStartJourney}
        />
      )}
      
      {/* Routes Detail */}
      {routePlan.routes?.routes && routePlan.routes.routes.length > 0 && (
        <RouteDetails 
          routes={routePlan.routes.routes}
          deliverySession={deliverySession}
          deliveryDate={deliveryDate}
          onStartJourney={onStartJourney}
        />
      )}
    </div>
  );
};

// Route Summary Cards Component
const RouteSummaryCards = ({ routePlan }) => {
  // Calculate total time from all routes
  const calculateTotalTime = () => {
    if (!routePlan.routes?.routes || routePlan.routes.routes.length === 0) {
      return routePlan.estimated_completion_time_hours || 0;
    }
    return routePlan.routes.routes.reduce((total, route) => {
      return total + (route.estimated_time_hours || 0);
    }, 0);
  };

  // Calculate total distance from all routes
  const calculateTotalDistance = () => {
    if (!routePlan.routes?.routes || routePlan.routes.routes.length === 0) {
      return routePlan.routes?.total_distance_km || 0;
    }
    return routePlan.routes.routes.reduce((total, route) => {
      return total + (route.total_distance_km || route.distance_km || 0);
    }, 0);
  };

  const totalTime = calculateTotalTime();
  const totalDistance = calculateTotalDistance();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center gap-2 mb-2">
          <FiUsers className="text-blue-400" />
          <span className="text-sm text-gray-400">Drivers</span>
        </div>
        <p className="text-2xl font-bold text-white">{routePlan.num_drivers || 0}</p>
        {routePlan.num_drivers_auto_selected && (
          <p className="text-xs text-green-400 mt-1">AI Selected</p>
        )}
      </div>
      
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center gap-2 mb-2">
          <FiPackage className="text-green-400" />
          <span className="text-sm text-gray-400">Deliveries</span>
        </div>
        <p className="text-2xl font-bold text-white">{routePlan.total_deliveries || 0}</p>
      </div>
      
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center gap-2 mb-2">
          <FiClock className="text-yellow-400" />
          <span className="text-sm text-gray-400">Time</span>
        </div>
        <p className="text-2xl font-bold text-white">
          {totalTime > 0 ? totalTime.toFixed(1) + 'h' : 'N/A'}
        </p>
      </div>
      
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center gap-2 mb-2">
          <FiMapPin className="text-purple-400" />
          <span className="text-sm text-gray-400">Distance</span>
        </div>
        <p className="text-2xl font-bold text-white">
          {totalDistance > 0 ? totalDistance.toFixed(1) + ' km' : 'N/A'}
        </p>
      </div>
    </div>
  );
};

// Individual Driver Routes Component - Horizontal Cards View
const IndividualDriverRoutes = ({ routes, deliverySession, deliveryDate, onStartJourney }) => {

  // Extract driver name from API response
  const getDriverName = (route, index) => {
    // Priority: executive.name from API > driver_name (backward compat) > driver_id formatted > fallback
    if (route.executive?.name) {
      return route.executive.name;
    }
    
    if (route.driver_name) {
      return route.driver_name; // Backward compatibility
    }

    // Try to extract name from driver_id if it contains a name
    if (route.driver_id && route.driver_id !== `driver_${index + 1}`) {
      const formatted = route.driver_id
        .replace('driver_', '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      if (formatted && formatted !== `${index + 1}`) {
        return formatted;
      }
    }

    // Last resort fallback
    return `Driver ${index + 1}`;
  };

  // Generate full route map link from all stops
  const generateRouteMapLink = (route) => {
    // If route has map_link, use it
    if (route.map_link) {
      return route.map_link;
    }

    // Generate Google Maps directions link with all stops as waypoints
    if (route.stops && route.stops.length > 0) {
      // Get all coordinates from stops
      const coordinates = route.stops
        .filter(stop => stop.latitude && stop.longitude)
        .map(stop => `${stop.latitude},${stop.longitude}`);

      if (coordinates.length > 0) {
        // Google Maps directions with waypoints
        // Format: /dir/origin/waypoint1/waypoint2/.../destination
        const waypoints = coordinates.join('/');
        return `https://www.google.com/maps/dir/${waypoints}`;
      }
    }

    // Fallback to first stop's map_link
    if (route.stops && route.stops.length > 0 && route.stops[0].map_link) {
      return route.stops[0].map_link;
    }

    return null;
  };

  // Get location link for the route
  const getRouteLocationLink = (route) => {
    // Priority: route.location_link from API > first stop's location_link > generate from coordinates
    if (route.location_link) {
      return route.location_link;
    }

    if (route.stops && route.stops.length > 0 && route.stops[0].location_link) {
      return route.stops[0].location_link;
    }

    // Generate location link from first stop coordinates
    if (route.stops && route.stops.length > 0 && route.stops[0].latitude && route.stops[0].longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${route.stops[0].latitude},${route.stops[0].longitude}`;
    }

    return null;
  };

  return (
    <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      {/* Title */}
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-red-500 text-xl">🚗</span>
        Individual Driver Routes & Delivery Executives ({routes.length} route{routes.length !== 1 ? 's' : ''})
      </h4>

      {/* Horizontal Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {routes.map((route, index) => {
          // Extract actual data from API response
          const driverName = getDriverName(route, index);
          const mapLink = generateRouteMapLink(route);
          const locationLink = getRouteLocationLink(route);

          return (
            <div
              key={index}
              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500/50 transition-all cursor-pointer group"
              onClick={() => {
                if (onStartJourney) {
                  onStartJourney({
                    route_id: route.route_id,
                    driver_id: route.driver_id || route.executive?.user_id,
                    delivery_session: deliverySession,
                    delivery_date: deliveryDate
                  });
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                {/* Driver Name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {driverName} Route
                  </span>
                </div>

                {/* Icons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* External Link Icon */}
                  {mapLink ? (
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      title={`Open route in Google Maps: ${mapLink}`}
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span 
                      className="text-gray-600 cursor-not-allowed"
                      title="No map link available for this route"
                    >
                      <FiExternalLink className="w-4 h-4" />
                    </span>
                  )}
                  
                  {/* Map Pin Icon */}
                  {locationLink ? (
                    <a
                      href={locationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="View location"
                    >
                      <FiMapPin className="w-4 h-4" />
                    </a>
                  ) : (
                    <span 
                      className="text-gray-600 cursor-not-allowed"
                      title="No location link available"
                    >
                      <FiMapPin className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>

              {/* Open Map Button */}
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium mt-2"
                  title={`Open route in Google Maps: ${mapLink}`}
                >
                  <FiExternalLink className="w-4 h-4" />
                  <span>Open Map</span>
                </a>
              )}

              {/* Route Stats (Optional - can be hidden or shown) */}
              <div className="mt-2 pt-2 border-t border-gray-600/50">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{route.num_stops || route.total_stops || route.stops?.length || 0} stops</span>
                  {route.estimated_time_hours && (
                    <span>• {route.estimated_time_hours.toFixed(1)}h</span>
                  )}
                  {(route.total_distance_km || route.distance_km) && (
                    <span>• {(route.total_distance_km || route.distance_km).toFixed(1)} km</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

// Route Comparison Component
const RouteComparison = ({ routeComparison, routePlan }) => {
  // Calculate time savings in minutes
  const calculateTimeSavings = () => {
    if (!routeComparison?.ai_time_hours || !routeComparison?.baseline_time_hours) return 0;
    const aiMinutes = routeComparison.ai_time_hours * 60;
    const baselineMinutes = routeComparison.baseline_time_hours * 60;
    return Math.round(baselineMinutes - aiMinutes);
  };

  const timeSavings = calculateTimeSavings();
  const isAIRecommended = routeComparison?.recommendation === 'use_ai';
  
  // Get driver count - try multiple sources
  const getAIDriverCount = () => {
    return routeComparison?.ai_num_drivers || 
           routeComparison?.num_drivers || 
           routePlan?.num_drivers ||
           routeComparison?.ai_routes?.length ||
           'N/A';
  };
  
  const getBaselineDriverCount = () => {
    return routeComparison?.baseline_num_drivers || 
           routeComparison?.num_drivers || 
           routePlan?.num_drivers ||
           routeComparison?.baseline_routes?.length ||
           'N/A';
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
      <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
        <FiMap className="text-blue-400" />
        Route Comparison Analysis
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AI Optimized Route Card */}
        <div className="p-4 rounded-lg border bg-blue-900/40 border-blue-700/50 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <FiZap className="text-purple-400 text-lg" />
            <span className="text-sm font-bold text-white">AI Optimized Route</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-300">Time:</p>
              <p className="text-sm font-semibold text-white">
                {routeComparison?.ai_time_hours?.toFixed(2) || '0.00'} hours
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-300">Distance:</p>
              <p className="text-sm font-semibold text-white">
                {routeComparison?.ai_distance_km?.toFixed(2) || '0.00'} km
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-300">Drivers:</p>
              <p className="text-sm font-semibold text-white">
                {getAIDriverCount()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Baseline Route Card */}
        <div className="p-4 rounded-lg border bg-amber-900/40 border-amber-700/50 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <FiBarChart2 className="text-pink-400 text-lg" />
            <span className="text-sm font-bold text-white">Baseline Route</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-300">Time:</p>
              <p className="text-sm font-semibold text-white">
                {routeComparison?.baseline_time_hours?.toFixed(2) || '0.00'} hours
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-300">Distance:</p>
              <p className="text-sm font-semibold text-white">
                {routeComparison?.baseline_distance_km?.toFixed(2) || '0.00'} km
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-300">Drivers:</p>
              <p className="text-sm font-semibold text-white">
                {getBaselineDriverCount()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Recommendation Card */}
        <div className="p-4 rounded-lg border bg-green-900/40 border-green-700/50 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <FiCheckCircle className="text-green-400 text-lg" />
            <span className="text-sm font-bold text-white">Recommendation</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiZap className="text-purple-400" />
              <p className="text-sm font-semibold text-green-400">
                {isAIRecommended ? 'Use AI Optimized' : 'Use Baseline'}
              </p>
            </div>
            {timeSavings > 0 && (
              <div>
                <p className="text-sm font-semibold text-green-400">
                  Saves {timeSavings} minute{timeSavings !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            {timeSavings < 0 && (
              <div>
                <p className="text-sm font-semibold text-yellow-400">
                  {Math.abs(timeSavings)} minute{Math.abs(timeSavings) !== 1 ? 's' : ''} longer
                </p>
              </div>
            )}
            {timeSavings === 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-400">
                  No time difference
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Route Details Component
const RouteDetails = ({ routes, deliverySession, deliveryDate, onStartJourney }) => {
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDriverName = (route, index) => {
    if (route.executive?.name) return route.executive.name;
    if (route.driver_name) return route.driver_name;
    if (route.driver_id && route.driver_id !== `driver_${index + 1}`) {
      const formatted = route.driver_id
        .replace('driver_', '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      if (formatted && formatted !== `${index + 1}`) return formatted;
    }
    return `Driver ${index + 1}`;
  };

  return (
    <div className="mt-4">
      <h4 className="text-md font-semibold text-white mb-3">Route Details</h4>
      <div className="space-y-3">
        {routes.map((route, index) => (
          <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Driver: {getDriverName(route, index)}</p>
                <p className="text-xs text-gray-400">
                  {route.total_stops} stops • {route.estimated_time_hours?.toFixed(1)}h • {(route.total_distance_km || route.distance_km)?.toFixed(1)} km
                </p>
              </div>
            </div>
            
            {/* Stops */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {route.stops?.map((stop, stopIndex) => (
                <div key={stopIndex} className="flex items-start gap-3 p-2 bg-gray-800/50 rounded">
                  <div className="flex-1 min-w-0">
                    {/* Customer Name with Badge - Inline */}
                    <div className="flex items-center gap-2 mb-1">
                      {/* Circular Badge with Count */}
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {stop.packages || stop.stop_order || stopIndex + 1}
                      </div>
                      <p className="text-sm font-medium text-white break-words min-w-0 flex-1">
                        {stop.customer_name || `Customer ${stop.customer_id || stop.stop_order || stopIndex + 1}`}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 break-words ml-9">{stop.customer_address || stop.address || 'No address provided'}</p>
                    <div className="flex items-center gap-3 mt-1 ml-9">
                      <span className="text-xs text-gray-500">
                        ETA: {formatTime(stop.estimated_arrival_time)}
                      </span>
                      {stop.packages && stop.packages !== stop.stop_order && (
                        <span className="text-xs text-gray-500">
                          Packages: {stop.packages}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Predicted Start Time Component
const PredictedStartTime = ({ predictedStartTime }) => {
  // Format time - handles both datetime strings and time strings (HH:MM:SS)
  const formatTime = (timeValue) => {
    if (!timeValue) return 'N/A';
    
    // If it's already a time string (HH:MM:SS), format it
    if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeValue.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    }
    
    // If it's a datetime string, parse it
    try {
      return new Date(timeValue).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return timeValue; // Return as-is if parsing fails
    }
  };

  // Get the best available time value (prioritize datetime over time string)
  const getStartTime = () => {
    return predictedStartTime.predicted_start_datetime || 
           predictedStartTime.predicted_start_time || 
           null;
  };

  const getCompletionTime = () => {
    // Check driver_predictions first (most accurate per-driver)
    if (predictedStartTime.driver_predictions && 
        predictedStartTime.driver_predictions.length > 0) {
      const firstDriver = predictedStartTime.driver_predictions[0];
      return firstDriver.predicted_completion_datetime || 
             firstDriver.predicted_completion_time || 
             null;
    }
    
    // Fallback to root level
    return predictedStartTime.predicted_completion_datetime || 
           predictedStartTime.predicted_completion_time || 
           null;
  };

  const getDuration = () => {
    // Check driver_predictions first
    if (predictedStartTime.driver_predictions && 
        predictedStartTime.driver_predictions.length > 0) {
      const firstDriver = predictedStartTime.driver_predictions[0];
      return firstDriver.estimated_duration_hours || 
             predictedStartTime.estimated_duration_hours || 
             null;
    }
    
    return predictedStartTime.estimated_duration_hours || null;
  };

  const getConfidence = () => {
    // Check driver_predictions first
    if (predictedStartTime.driver_predictions && 
        predictedStartTime.driver_predictions.length > 0) {
      const firstDriver = predictedStartTime.driver_predictions[0];
      return firstDriver.confidence || null;
    }
    
    return predictedStartTime.confidence || null;
  };

  const startTime = getStartTime();
  const completionTime = getCompletionTime();
  const duration = getDuration();
  const confidence = getConfidence();
  const reasoning = predictedStartTime.reasoning || 'N/A';

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  // Get confidence color
  const getConfidenceColor = () => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-purple-900/20 border border-blue-500/40 rounded-xl p-6 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-400/30">
            <FiClock className="text-blue-400 text-xl" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Predicted Start Time</h4>
            <p className="text-xs text-gray-400 mt-0.5">AI-powered time prediction</p>
          </div>
        </div>
        {confidence && (
          <div className={`px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 ${getConfidenceColor()}`}>
            <span className="text-sm font-semibold">
              {((confidence * 100).toFixed(0))}% Confidence
            </span>
          </div>
        )}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Start Time Card */}
        <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-400/30">
              <FiPlay className="text-green-400 text-sm" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Start Time</p>
          </div>
          <p className="text-2xl font-bold text-white mb-1 group-hover:text-green-400 transition-colors">
            {formatTime(startTime)}
          </p>
          {predictedStartTime.predicted_start_datetime && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
              <FiClock className="w-3 h-3" />
              {formatDate(predictedStartTime.predicted_start_datetime)}
            </p>
          )}
        </div>

        {/* Completion Time Card */}
        <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-400/30">
              <FiCheckCircle className="text-purple-400 text-sm" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Completion Time</p>
          </div>
          <p className="text-2xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
            {formatTime(completionTime)}
          </p>
          {completionTime && predictedStartTime.driver_predictions?.[0]?.predicted_completion_datetime && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
              <FiClock className="w-3 h-3" />
              {formatDate(predictedStartTime.driver_predictions[0].predicted_completion_datetime)}
            </p>
          )}
        </div>

        {/* Duration Card */}
        <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
              <FiClock className="text-yellow-400 text-sm" />
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Duration</p>
          </div>
          <p className="text-2xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
            {duration ? `${duration.toFixed(1)}h` : 'N/A'}
          </p>
          {duration && (
            <p className="text-xs text-gray-500 mt-2">
              Estimated total time
            </p>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-blue-500/20">
        <div className="flex flex-wrap items-center gap-4">
          {reasoning && reasoning !== 'N/A' && (
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <FiTarget className="text-blue-400 text-sm mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400 mb-0.5">Reasoning</p>
                <p className="text-xs text-gray-300 leading-relaxed">{reasoning}</p>
              </div>
            </div>
          )}
          {predictedStartTime.driver_predictions && predictedStartTime.driver_predictions.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-400/20">
              <FiUsers className="text-blue-400 text-sm" />
              <span className="text-xs text-gray-300">
                <span className="font-semibold text-white">{predictedStartTime.driver_predictions.length}</span> driver{predictedStartTime.driver_predictions.length !== 1 ? 's' : ''} predicted
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutePlanningTab;

