import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdLocalShipping, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { SkeletonLoading } from './Skeleton';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * RecentRoutesView - Component for displaying recent routes with map visualization
 * Features: Interactive map, route filtering, session-based color coding, stop markers
 */
const RecentRoutesView = ({ 
  routeMapData, 
  routeMapLoading, 
  routeMapError, 
  routeMapFilters, 
  setRouteMapFilters, 
  refetchRouteMap 
}) => {
  // State to track expanded delivery names for each route
  const [expandedRoutes, setExpandedRoutes] = useState(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Session colors
  const sessionColors = {
    BREAKFAST: '#FF6B6B',
    LUNCH: '#4ECDC4',
    DINNER: '#45B7D1'
  };

  // Toggle expanded state for a route
  const toggleRouteExpansion = (routeId) => {
    setExpandedRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  // Extract routes from data
  const routes = useMemo(() => {
    if (!routeMapData) return [];
    
    // The API returns routes directly at the top level
    if (Array.isArray(routeMapData.routes)) {
      return routeMapData.routes;
    }
    
    // Fallback for nested structure
    if (routeMapData.data?.routes) {
      return Array.isArray(routeMapData.data.routes) 
        ? routeMapData.data.routes 
        : routeMapData.data.routes?.routes || [];
    }
    
    return [];
  }, [routeMapData]);

  // Calculate map center from all route points
  const mapCenter = useMemo(() => {
    const allPoints = routes.flatMap(route => 
      route.path_points?.map(p => [p.latitude, p.longitude]) || 
      route.stops?.map(s => [s.latitude, s.longitude]) || []
    );

    if (allPoints.length === 0) {
      return [10.0, 76.3]; // Default center (Kerala, India)
    }

    const centerLat = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length;
    const centerLng = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;
    
    return [centerLat, centerLng];
  }, [routes]);

  // Pagination calculations
  const totalPages = Math.ceil(routes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoutes = routes.slice(startIndex, endIndex);

  // Reset to page 1 when routes change
  useEffect(() => {
    setCurrentPage(1);
  }, [routes.length]);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevious = () => goToPage(currentPage - 1);
  const goToNext = () => goToPage(currentPage + 1);

  if (routeMapLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <SkeletonLoading />
      </div>
    );
  }

  if (routeMapError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-700 font-medium">Error loading route data: {routeMapError.message}</p>
      </div>
    );
  }

  if (!routeMapData || routes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <MdLocalShipping className="text-4xl text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No route data available. Please select a date and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Routes</p>
            <p className="text-2xl font-bold text-blue-700">{routes.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Date</p>
            <p className="text-lg font-semibold text-green-700">{routeMapFilters.date}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Session</p>
            <p className="text-lg font-semibold text-purple-700">
              {routeMapFilters.session || routeMapData.session || 'All Sessions'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Route Map Visualization</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(sessionColors).map(([session, color]) => {
              const sessionRoutes = routes.filter(r => r.session === session);
              if (sessionRoutes.length === 0) return null;
              return (
                <div key={session} className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-xs font-medium text-gray-700">{session} ({sessionRoutes.length})</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="h-[600px] w-full relative">
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {routes.map((route, routeIndex) => {
              const routeColor = sessionColors[route.session] || '#666';
              const pathPoints = route.path_points?.map(p => [p.latitude, p.longitude]) || [];
              
              return (
                <React.Fragment key={route.route_id || routeIndex}>
                  {/* Route Path Line */}
                  {pathPoints.length > 1 && (
                    <Polyline
                      positions={pathPoints}
                      pathOptions={{
                        color: routeColor,
                        weight: 4,
                        opacity: 0.7
                      }}
                    />
                  )}
                  
                  {/* Stops Markers */}
                  {route.stops?.map((stop, stopIndex) => {
                    const isDelivered = stop.delivery_status === 'delivered';
                    const icon = L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="
                        width: 24px;
                        height: 24px;
                        background-color: ${isDelivered ? '#10B981' : '#EF4444'};
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      "></div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                    });

                    return (
                      <Marker
                        key={`${route.route_id}-${stopIndex}`}
                        position={[stop.latitude, stop.longitude]}
                        icon={icon}
                      >
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <h4 className="font-semibold text-gray-900 mb-2">{stop.delivery_name || `Stop ${stopIndex + 1}`}</h4>
                            <div className="space-y-1 text-xs">
                              <p><strong>Status:</strong> <span className={`font-medium ${isDelivered ? 'text-green-600' : 'text-red-600'}`}>{stop.delivery_status}</span></p>
                              <p><strong>Session:</strong> {route.session}</p>
                              <p><strong>Route ID:</strong> {route.route_id?.slice(-8)}</p>
                              <p><strong>Stop Order:</strong> {stop.stop_order}</p>
                              {stop.actual_arrival_time && (
                                <p><strong>Arrived:</strong> {new Date(stop.actual_arrival_time).toLocaleString()}</p>
                              )}
                              {stop.packages_delivered && (
                                <p><strong>Packages:</strong> {stop.packages_delivered}</p>
                              )}
                              {stop.location && stop.location !== 'Address not available' && (
                                <p className="text-gray-600 mt-2"><strong>Location:</strong> {stop.location}</p>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Routes Details Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Routes Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Executive
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Stops
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivered
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Path Points
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Names
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRoutes.map((route, index) => {
                const actualIndex = startIndex + index;
                const sessionColor = sessionColors[route.session] || '#666';
                const deliveredCount = route.stops?.filter(s => s.delivery_status === 'delivered').length || 0;
                const pendingCount = route.stops?.filter(s => s.delivery_status === 'pending').length || 0;
                const totalStops = route.stops?.length || 0;
                const completionRate = totalStops > 0 ? Math.round((deliveredCount / totalStops) * 100) : 0;
                
                return (
                  <tr key={route.route_id || actualIndex} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sessionColor }}></div>
                        <span className="text-sm font-medium text-gray-900">{route.session}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {route.driver_name || route.driver_id?.slice(-12) || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{totalStops}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-[50px]">
                          {deliveredCount}/{totalStops}
                        </span>
                        <span className="text-xs text-gray-500">({completionRate}%)</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {deliveredCount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {deliveredCount} Delivered
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            {pendingCount} Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{route.path_points?.length || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        {route.stops && route.stops.length > 0 ? (
                          <div>
                            <div className="flex flex-wrap gap-1.5">
                              {(() => {
                                const isExpanded = expandedRoutes.has(route.route_id);
                                const displayCount = isExpanded ? route.stops.length : 5;
                                const stopsToShow = route.stops.slice(0, displayCount);
                                const remainingCount = route.stops.length - displayCount;
                                
                                return (
                                  <>
                                    {stopsToShow.map((stop, stopIdx) => (
                                      <div
                                        key={stopIdx}
                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border"
                                        style={{
                                          backgroundColor: stop.delivery_status === 'delivered' ? '#F0FDF4' : '#FEF2F2',
                                          borderColor: stop.delivery_status === 'delivered' ? '#BBF7D0' : '#FECACA',
                                          color: stop.delivery_status === 'delivered' ? '#166534' : '#991B1B'
                                        }}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                          stop.delivery_status === 'delivered' ? 'bg-green-500' : 'bg-red-500'
                                        }`}></span>
                                        <span className="font-medium">{stop.delivery_name || `Stop ${stopIdx + 1}`}</span>
                                      </div>
                                    ))}
                                    {remainingCount > 0 && (
                                      <button
                                        onClick={() => toggleRouteExpansion(route.route_id)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <MdExpandLess className="w-4 h-4" />
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <MdExpandMore className="w-4 h-4" />
                                            +{remainingCount} more
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            {route.stops.length > 5 && (
                              <div className="mt-2 text-xs text-gray-500">
                                Total: {route.stops.length} deliveries
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No stops</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {routes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No routes found for the selected filters.</p>
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {routes.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-gray-700">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, routes.length)} of {routes.length} routes
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentRoutesView;
