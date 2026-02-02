import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdLocalShipping, MdExpandMore, MdExpandLess, MdPerson } from 'react-icons/md';
import { SkeletonLoading } from './Skeleton';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Normalize executive from active-executives API (id, name)
const normalizeExecutive = (e) => {
  const id = e.id ?? e.driver_id ?? e.userId;
  const name = e.name ?? e.driver_name ?? (e.firstName || e.lastName ? [e.firstName, e.lastName].filter(Boolean).join(' ') : null) ?? 'Unknown';
  return { id, name };
};

/**
 * RecentRoutesView - CXO workflow: show delivery executives from route map response, then click one to view route details.
 * - Executives list comes only from the route map API response (who had routes on the selected date/session).
 * - No DB list: select date (and optional session) to load route data; executives shown are those in that response.
 * - Click executive: show map + table for that executive's routes only.
 */
const RecentRoutesView = ({
  allExecutives = [],
  allExecutivesLoading = false,
  routeMapData,
  routeMapLoading,
  routeMapError,
  routeMapFilters,
  setRouteMapFilters,
  appliedRouteMapFilters,
  refetchRouteMap,
  hideSidebar = false,
  selectedExecutiveId: selectedExecutiveIdProp,
  setSelectedExecutiveId: setSelectedExecutiveIdProp
}) => {
  const applied = appliedRouteMapFilters ?? routeMapFilters;
  const [expandedRoutes, setExpandedRoutes] = useState(new Set());
  const [selectedExecutiveIdInternal, setSelectedExecutiveIdInternal] = useState(null);
  const isControlled = selectedExecutiveIdProp !== undefined && setSelectedExecutiveIdProp != null;
  const selectedExecutiveId = isControlled ? selectedExecutiveIdProp : selectedExecutiveIdInternal;
  const setSelectedExecutiveId = isControlled ? setSelectedExecutiveIdProp : setSelectedExecutiveIdInternal;
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [tableStatusFilter, setTableStatusFilter] = useState('all'); // applied filters (used for table)
  const [tableDeliveryNameFilter, setTableDeliveryNameFilter] = useState('');
  const [pendingStatusFilter, setPendingStatusFilter] = useState('all'); // input values, apply on Go
  const [pendingDeliveryNameFilter, setPendingDeliveryNameFilter] = useState('');
  const [showMap, setShowMap] = useState(false); // Map closed by default; Open/Close toggle

  const sessionColors = {
    BREAKFAST: '#FF6B6B',
    LUNCH: '#4ECDC4',
    DINNER: '#45B7D1'
  };

  const toggleRouteExpansion = (routeId) => {
    setExpandedRoutes(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  };

  // All routes from API (route map response)
  const routes = useMemo(() => {
    if (!routeMapData) return [];
    if (Array.isArray(routeMapData.routes)) return routeMapData.routes;
    if (routeMapData.data?.routes) {
      const r = routeMapData.data.routes;
      return Array.isArray(r) ? r : r?.routes || [];
    }
    return [];
  }, [routeMapData]);

  // Delivery executives from route map (who had routes on the selected date/session)
  const executivesFromRoutes = useMemo(() => {
    const seen = new Set();
    return routes
      .filter((r) => {
        const id = r.driver_id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((r) => normalizeExecutive({ driver_id: r.driver_id, driver_name: r.driver_name }));
  }, [routes]);

  // Exclude dummy names (e.g. driver1, driver2, Driver 1, Driver 2) from UI
  const isDummyDriverName = (name) => /^driver\s*\d+$/i.test((name || '').trim());

  // Sidebar list: show ALL delivery executives (from allExecutives) when available, else those from route map
  const executivesToShow = useMemo(() => {
    const fromAll = (allExecutives || [])
      .filter((e) => e && (e.id ?? e.driver_id ?? e.userId))
      .map(normalizeExecutive)
      .filter((e) => !isDummyDriverName(e.name));
    if (fromAll.length > 0) return fromAll;
    return executivesFromRoutes.filter((e) => !isDummyDriverName(e.name));
  }, [allExecutives, executivesFromRoutes]);

  const executiveIdsWithRoutes = useMemo(() => new Set(executivesFromRoutes.map((e) => e.id)), [executivesFromRoutes]);

  // Routes to display: when an executive is selected, filter to that executive only
  const routesToDisplay = useMemo(() => {
    if (!selectedExecutiveId) return [];
    return routes.filter(r => r.driver_id === selectedExecutiveId);
  }, [routes, selectedExecutiveId]);

  const mapCenter = useMemo(() => {
    const allPoints = routesToDisplay.flatMap(route =>
      route.path_points?.map(p => [p.latitude, p.longitude]) ||
      route.stops?.map(s => [s.latitude, s.longitude]) || []
    );
    if (allPoints.length === 0) return [10.0, 76.3];
    const centerLat = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length;
    const centerLng = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;
    return [centerLat, centerLng];
  }, [routesToDisplay]);

  // Filter routes by Status and Delivery Name for the table
  const filteredRoutesForTable = useMemo(() => {
    const nameTerm = (tableDeliveryNameFilter || '').trim().toLowerCase();
    if (tableStatusFilter === 'all' && !nameTerm) return routesToDisplay;
    return routesToDisplay.filter((route) => {
      const totalStops = route.stops?.length || 0;
      const deliveredCount = route.stops?.filter(s => s.delivery_status === 'delivered').length || 0;
      const pendingCount = route.stops?.filter(s => s.delivery_status === 'pending').length || 0;
      const statusMatch =
        tableStatusFilter === 'all' ||
        (tableStatusFilter === 'delivered' && deliveredCount === totalStops && totalStops > 0) ||
        (tableStatusFilter === 'pending' && pendingCount === totalStops && totalStops > 0) ||
        (tableStatusFilter === 'partial' && deliveredCount > 0 && pendingCount > 0);
      const nameMatch =
        !nameTerm ||
        (route.stops || []).some((s) => (s.delivery_name || '').toLowerCase().includes(nameTerm));
      return statusMatch && nameMatch;
    });
  }, [routesToDisplay, tableStatusFilter, tableDeliveryNameFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutesForTable.length / itemsPerPage));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoutes = filteredRoutesForTable.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRoutesForTable.length, selectedExecutiveId]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const goToPrevious = () => goToPage(currentPage - 1);
  const goToNext = () => goToPage(currentPage + 1);

  const hasDriver = !!routeMapFilters?.driver_name;
  const hasAppliedDate = !!applied?.date;
  const showFilteredExecutives = hasAppliedDate && routeMapData?.routes?.length > 0;

  // Clear selected executive when applied date or session changes
  useEffect(() => {
    setSelectedExecutiveId(null);
  }, [applied?.date, applied?.session]);

  // Sync pending filters when executive changes (reset so user sees all routes until they click Go)
  useEffect(() => {
    setPendingStatusFilter('all');
    setPendingDeliveryNameFilter('');
    setTableStatusFilter('all');
    setTableDeliveryNameFilter('');
  }, [selectedExecutiveId]);

  const applyFilters = () => {
    setTableStatusFilter(pendingStatusFilter);
    setTableDeliveryNameFilter(pendingDeliveryNameFilter);
    setCurrentPage(1);
  };

  // Initials for avatar (e.g. "John Doe" -> "JD")
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name[0] || '?').toUpperCase();
  };

  const rightContent = (
      <div className={`${hideSidebar ? '' : 'flex-1 min-w-0'} space-y-5 bg-gray-50 rounded-lg p-4 lg:p-5`}>
        {/* Route error */}
        {routeMapError && hasDriver && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-700">Error loading route data: {routeMapError.message}</p>
          </div>
        )}

        {/* Route details — only when an executive is selected */}
        {!selectedExecutiveId ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
          <MdLocalShipping className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            {hasDriver && !hasAppliedDate
              ? 'Select date and session above, then click Go to view route details.'
              : hasDriver && hasAppliedDate && !showFilteredExecutives
                ? 'No routes for the selected date/session. Try another date or session and click Go.'
                : 'Select a delivery executive from the sidebar to load their available dates and sessions.'}
          </p>
        </div>
      ) : hasDriver && !hasAppliedDate ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
          <MdLocalShipping className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Select date and session above, then click Go to view route details.</p>
        </div>
      ) : routeMapLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <SkeletonLoading />
        </div>
      ) : routesToDisplay.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
          <MdLocalShipping className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No routes for this executive on the selected date/session.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary for selected executive */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Route summary — {executivesToShow.find(e => e.id === selectedExecutiveId)?.name ?? 'Executive'}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedExecutiveId(null)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                Clear selection
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Routes</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{routesToDisplay.length}</p>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Date</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{applied.date}</p>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Session</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {applied.session || routeMapData?.session || 'All Sessions'}
                </p>
              </div>
            </div>
          </div>

          {/* Map – collapsible, closed by default */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Route Map</h2>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(sessionColors).map(([session, color]) => {
                  const sessionRoutes = routesToDisplay.filter(r => r.session === session);
                  if (sessionRoutes.length === 0) return null;
                  return (
                    <span key={session} className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      {session} ({sessionRoutes.length})
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowMap((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 focus:outline-none"
                >
                  {showMap ? <MdExpandLess className="text-lg" /> : <MdExpandMore className="text-lg" />}
                  {showMap ? 'Close map' : 'Open map'}
                </button>
              </div>
            </div>
            {showMap && (
            <div className="h-[600px] w-full">
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
                {routesToDisplay.map((route, routeIndex) => {
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
            )}
      </div>

      {/* Routes Details Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Routes Details</h2>
          {/* Filters above table — apply only when Go is clicked */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="table-status-filter" className="text-sm font-medium text-gray-700">Status</label>
              <select
                id="table-status-filter"
                value={pendingStatusFilter}
                onChange={(e) => setPendingStatusFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-w-[140px]"
              >
                <option value="all">All</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="table-delivery-name-filter" className="text-sm font-medium text-gray-700">Delivery Name</label>
              <input
                id="table-delivery-name-filter"
                type="text"
                value={pendingDeliveryNameFilter}
                onChange={(e) => setPendingDeliveryNameFilter(e.target.value)}
                placeholder="Search by delivery name"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-w-[180px]"
              />
            </div>
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Go
            </button>
            {(tableStatusFilter !== 'all' || (tableDeliveryNameFilter || '').trim()) && (
              <button
                type="button"
                onClick={() => { setPendingStatusFilter('all'); setPendingDeliveryNameFilter(''); setTableStatusFilter('all'); setTableDeliveryNameFilter(''); setCurrentPage(1); }}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                Clear filters
              </button>
            )}
            <span className="text-sm text-gray-500 ml-auto">
              Showing {filteredRoutesForTable.length} of {routesToDisplay.length} route{routesToDisplay.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Session</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Delivery Executive</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Stops</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Delivered</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Path Points</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Delivery Names</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedRoutes.map((route, index) => {
                const actualIndex = startIndex + index;
                const sessionColor = sessionColors[route.session] || '#666';
                const deliveredCount = route.stops?.filter(s => s.delivery_status === 'delivered').length || 0;
                const pendingCount = route.stops?.filter(s => s.delivery_status === 'pending').length || 0;
                const totalStops = route.stops?.length || 0;
                const completionRate = totalStops > 0 ? Math.round((deliveredCount / totalStops) * 100) : 0;
                
                return (
                  <tr key={route.route_id || actualIndex} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sessionColor }} />
                        <span className="text-sm font-medium text-gray-900">{route.session}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {route.driver_name || route.driver_id?.slice(-12) || 'Unknown'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{totalStops}</td>
                    <td className="whitespace-nowrap px-4 py-3">
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
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{route.path_points?.length || 0}</td>
                    <td className="px-4 py-3">
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
          {filteredRoutesForTable.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {routesToDisplay.length === 0
                  ? 'No routes for this executive.'
                  : 'No routes match the current filters. Try changing Status or Delivery Name.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredRoutesForTable.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-gray-700">entries</span>
            </div>
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredRoutesForTable.length)} of {filteredRoutesForTable.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={effectivePage === 1}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  effectivePage === 1
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
                
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= effectivePage - 1 && page <= effectivePage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`min-w-[2.25rem] rounded-md border px-2.5 py-1.5 text-sm font-medium ${
                          effectivePage === page
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === effectivePage - 2 || page === effectivePage + 2) {
                    return <span key={page} className="px-2 text-sm text-gray-500">…</span>;
                  }
                  return null;
                })}
              </div>
              <button
                type="button"
                onClick={goToNext}
                disabled={effectivePage === totalPages}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  effectivePage === totalPages
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
        </div>
      )}
      </div>
  );

  if (hideSidebar) return rightContent;

  return (
    <div className="flex flex-col lg:flex-row gap-0">
      <aside className="lg:w-64 xl:w-72 shrink-0 lg:min-h-[calc(100vh-8rem)] lg:sticky lg:top-6 flex flex-col rounded-lg overflow-hidden shadow-lg" style={{ backgroundColor: '#2A3F54' }}>
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">General</p>
          <h2 className="mt-1 text-base font-semibold text-white">Delivery Executives</h2>
          {hasAppliedDate && applied?.date && (
            <p className="mt-1 text-xs text-white/70">
              Routes for {applied.date}{applied.session ? ` · ${applied.session}` : ''}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 max-h-[70vh] lg:max-h-[calc(100vh-14rem)]">
          {allExecutivesLoading && executivesToShow.length === 0 ? (
            <div className="flex items-center gap-2 text-white/70 py-6 px-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : executivesToShow.length === 0 ? (
            <p className="py-6 px-3 text-sm text-white/70">No delivery executives found.</p>
          ) : (
            <ul className="space-y-0.5">
              {executivesToShow.map((ex) => {
                const isSelected = selectedExecutiveId === ex.id;
                const hasRoutesToday = executiveIdsWithRoutes.has(ex.id);
                return (
                  <li key={ex.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedExecutiveId(isSelected ? null : ex.id)}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        isSelected ? 'bg-teal-500/90 text-white' : 'text-white/90 hover:bg-white/10'
                      }`}
                      title={hasRoutesToday ? 'View route details' : 'Select date above for route data'}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold bg-white/20" aria-hidden>
                        {getInitials(ex.name)}
                      </span>
                      <span className="truncate flex-1">{ex.name}</span>
                      {hasRoutesToday && !isSelected && (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-400" title="Has routes" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
      <div className="hidden lg:block w-1 shrink-0" aria-hidden />
      {rightContent}
    </div>
  );
};

export default RecentRoutesView;
