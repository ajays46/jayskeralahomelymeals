import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdClose, MdExpandMore, MdExpandLess, MdLocalShipping } from 'react-icons/md';
import { SkeletonLoading } from './Skeleton';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SESSION_COLORS = { BREAKFAST: '#FF6B6B', LUNCH: '#4ECDC4', DINNER: '#45B7D1', ANY: '#9CA3AF' };

/**
 * CXORouteMapPreview - Modal to show route map data on CXO Delivery Managers page
 * Displays routes, map, and stops without navigating to Delivery Executive page.
 * Props: isOpen, onClose, routeMapData (API response), isLoading, error, appliedFilters (optional)
 */
const CXORouteMapPreview = ({ isOpen, onClose, routeMapData, isLoading, error, appliedFilters = {} }) => {
  const [showMap, setShowMap] = useState(true);
  const [expandedRoutes, setExpandedRoutes] = useState(new Set());

  const routes = useMemo(() => {
    if (!routeMapData || !Array.isArray(routeMapData.routes)) return [];
    return routeMapData.routes;
  }, [routeMapData]);

  const mapCenter = useMemo(() => {
    const allPoints = routes.flatMap((route) =>
      route.path_points?.map((p) => [p.latitude, p.longitude]) ||
      route.stops?.map((s) => [s.latitude, s.longitude]) ||
      []
    );
    if (allPoints.length === 0) return [10.0, 76.3];
    const centerLat = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length;
    const centerLng = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;
    return [centerLat, centerLng];
  }, [routes]);

  const toggleRouteExpansion = (routeId) => {
    setExpandedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 w-full max-w-4xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Route map preview</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <MdClose className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm font-medium text-red-700">{error.message}</p>
            </div>
          )}
          {isLoading && (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <SkeletonLoading />
            </div>
          )}
          {!isLoading && !error && routes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-16 text-center">
              <MdLocalShipping className="mb-3 h-12 w-12 text-gray-400" />
              <p className="text-sm font-medium text-gray-500">No routes to display.</p>
            </div>
          )}
          {!isLoading && !error && routes.length > 0 && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total routes</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{routes.length}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Drivers</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {routeMapData.total_drivers ?? new Set(routes.map((r) => r.driver_id)).size}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Date range</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {appliedFilters.start_date && appliedFilters.end_date
                      ? `${appliedFilters.start_date} to ${appliedFilters.end_date}`
                      : routeMapData.start_date && routeMapData.end_date
                        ? `${routeMapData.start_date} to ${routeMapData.end_date}`
                        : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Session</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {appliedFilters.session || routeMapData.session || 'All'}
                  </p>
                </div>
              </div>

              {/* Map */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowMap((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 border-b border-gray-200 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-base font-semibold text-gray-900">Route map</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700">
                    {showMap ? <MdExpandLess className="text-lg" /> : <MdExpandMore className="text-lg" />}
                    {showMap ? 'Close map' : 'Open map'}
                  </span>
                </button>
                {showMap && (
                  <div className="h-[400px] w-full">
                    <MapContainer
                      center={mapCenter}
                      zoom={12}
                      style={{ height: '100%', width: '100%', zIndex: 1 }}
                      scrollWheelZoom
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {routes.map((route, routeIndex) => {
                        const routeColor = SESSION_COLORS[route.session] || '#666';
                        const pathPoints =
                          route.path_points?.map((p) => [p.latitude, p.longitude]) || [];
                        return (
                          <React.Fragment key={route.route_id || routeIndex}>
                            {pathPoints.length > 1 && (
                              <Polyline
                                positions={pathPoints}
                                pathOptions={{ color: routeColor, weight: 4, opacity: 0.7 }}
                              />
                            )}
                            {route.stops?.map((stop, stopIndex) => {
                              const isDelivered = stop.delivery_status === 'delivered';
                              const icon = L.divIcon({
                                className: 'custom-marker',
                                html: `<div style="width:24px;height:24px;background:${isDelivered ? '#10B981' : '#EF4444'};border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
                                iconSize: [24, 24],
                                iconAnchor: [12, 12],
                              });
                              return (
                                <Marker
                                  key={`${route.route_id}-${stopIndex}`}
                                  position={[stop.latitude, stop.longitude]}
                                  icon={icon}
                                >
                                  <Popup>
                                    <div className="p-2 min-w-[200px]">
                                      <h4 className="font-semibold text-gray-900 mb-2">
                                        {stop.delivery_name || `Stop ${stopIndex + 1}`}
                                      </h4>
                                      <div className="space-y-1 text-xs">
                                        <p>
                                          <strong>Status:</strong>{' '}
                                          <span className={isDelivered ? 'text-green-600' : 'text-red-600'}>
                                            {stop.delivery_status || '—'}
                                          </span>
                                        </p>
                                        <p><strong>Stop order:</strong> {stop.stop_order}</p>
                                        {stop.actual_arrival_time && (
                                          <p><strong>Arrived:</strong> {new Date(stop.actual_arrival_time).toLocaleString()}</p>
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

              {/* Routes table */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h3 className="text-base font-semibold text-gray-900">Routes & stops</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Session</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Driver</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stops</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Delivery names</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {routes.map((route, index) => {
                        const sessionColor = SESSION_COLORS[route.session] || '#666';
                        const totalStops = route.stops?.length || 0;
                        const isExpanded = expandedRoutes.has(route.route_id);
                        const stopsToShow = isExpanded ? (route.stops || []) : (route.stops || []).slice(0, 5);
                        const remainingCount = totalStops - stopsToShow.length;
                        return (
                          <tr key={route.route_id || index} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full mr-2"
                                style={{ backgroundColor: sessionColor }}
                              />
                              <span className="text-sm font-medium text-gray-900">{route.session || '—'}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                              {route.driver_name || '—'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{route.date || '—'}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{totalStops}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {stopsToShow.map((stop, stopIdx) => (
                                  <span
                                    key={stopIdx}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border"
                                    style={{
                                      backgroundColor: stop.delivery_status === 'delivered' ? '#F0FDF4' : '#FEF2F2',
                                      borderColor: stop.delivery_status === 'delivered' ? '#BBF7D0' : '#FECACA',
                                      color: stop.delivery_status === 'delivered' ? '#166534' : '#991B1B',
                                    }}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${stop.delivery_status === 'delivered' ? 'bg-green-500' : 'bg-red-500'}`}
                                    />
                                    {stop.delivery_name || `Stop ${stopIdx + 1}`}
                                  </span>
                                ))}
                                {remainingCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleRouteExpansion(route.route_id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                  >
                                    {isExpanded ? (
                                      <><MdExpandLess className="w-4 h-4" /> Show less</>
                                    ) : (
                                      <><MdExpandMore className="w-4 h-4" /> +{remainingCount} more</>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CXORouteMapPreview;
