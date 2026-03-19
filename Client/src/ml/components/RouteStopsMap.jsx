/**
 * RouteStopsMap - Shows route stops (with lat/lng) on a Leaflet map.
 * Live vehicle: pass liveVehicleFromParent + liveVehicleData from MLMyTripsPage (GET /api/vehicle-tracking/live),
 * or pass vehicleNumber to fetch inside this component only.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdMap } from 'react-icons/md';
import { useLiveVehiclePosition } from '../../hooks/mlHooks/useVehicleTracking';

const parseCoord = (v) => {
  const n = typeof v === 'string' ? Number(v.trim()) : Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const extractLiveLatLngFromPayload = (liveData) => {
  if (!liveData || typeof liveData !== 'object') return null;
  const loc = liveData.location && typeof liveData.location === 'object' ? liveData.location : liveData;
  const lat = parseCoord(loc.latitude ?? loc.lat);
  const lng = parseCoord(loc.longitude ?? loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [10.0, 76.3];
const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';

/** Bike icon for live vehicle marker (DivIcon with inline SVG). */
const createBikeVehicleIcon = (accent = '#E85D04') =>
  L.divIcon({
    className: 'vehicle-bike-marker',
    html: `
      <div style="
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        background: ${accent}; border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        border: 2px solid #fff;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="17" r="3.5"/>
          <circle cx="18" cy="17" r="3.5"/>
          <path d="M6 17 L12 5 L18 17 M12 5 L12 9 M9 17 L15 17"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const FitMapToGeometry = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(points) || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }

    map.fitBounds(points, { padding: [24, 24] });
  }, [map, points]);

  return null;
};

/** "You are here" / current location marker icon (blue dot). */
const createCurrentLocationIcon = () =>
  L.divIcon({
    className: 'current-location-marker',
    html: `
      <div style="
        width: 24px; height: 24px;
        background: #2563eb;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const currentLocationIcon = createCurrentLocationIcon();

/**
 * @param {{ stops: Array<...>; currentLocation?: { lat: number, lng: number } | null; vehicleNumber?: string; liveVehicleFromParent?: boolean; liveVehicleData?: object; accent?: string; className?: string }} props
 */
const RouteStopsMap = ({
  stops,
  currentLocation = null,
  vehicleNumber,
  liveVehicleFromParent = false,
  liveVehicleData,
  accent = '#E85D04',
  className = '',
}) => {
  const internalLive = useLiveVehiclePosition(vehicleNumber || '', {
    enabled: !liveVehicleFromParent && !!vehicleNumber && String(vehicleNumber).trim().length > 0,
    refetchInterval: !liveVehicleFromParent && vehicleNumber ? 15000 : false,
  });
  const liveData = liveVehicleFromParent ? liveVehicleData : internalLive.data;
  const livePosition = useMemo(() => extractLiveLatLngFromPayload(liveData), [liveData]);
  const vehicleMarkerIcon = useMemo(() => createBikeVehicleIcon(accent), [accent]);
  const currentLocationPoint = useMemo(() => {
    if (!currentLocation || !Number.isFinite(currentLocation.lat) || !Number.isFinite(currentLocation.lng)) return null;
    return [currentLocation.lat, currentLocation.lng];
  }, [currentLocation]);
  // If vehicle GPS is available, prefer it and hide mobile-location dot.
  const useMobileCurrentOnMap = !livePosition && currentLocationPoint != null;

  const stopsWithCoords = useMemo(() => {
    const list = Array.isArray(stops) ? stops : [];
    return list
      .filter((s) => s != null && typeof s.latitude === 'number' && typeof s.longitude === 'number')
      .map((s) => ({
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        stop: s.stop ?? 0,
        stop_type: s.stop_type || 'delivery',
        order_id: s.order_id,
      }));
  }, [stops]);

  const stopPositions = useMemo(
    () => stopsWithCoords.map((s) => [s.lat, s.lng]),
    [stopsWithCoords]
  );

  /** For OSRM: current → first stop only when live vehicle GPS is unavailable. */
  const positionsForRoute = useMemo(() => {
    if (useMobileCurrentOnMap && stopPositions.length > 0) return [currentLocationPoint, ...stopPositions];
    return stopPositions;
  }, [useMobileCurrentOnMap, currentLocationPoint, stopPositions]);

  const [roadRoutePositions, setRoadRoutePositions] = useState([]);

  useEffect(() => {
    if (positionsForRoute.length < 2) {
      setRoadRoutePositions([]);
      return undefined;
    }

    const controller = new AbortController();
    const coordinates = positionsForRoute.map(([lat, lng]) => `${lng},${lat}`).join(';');

    const loadRoadRoute = async () => {
      try {
        const response = await fetch(
          `${OSRM_ROUTE_URL}/${coordinates}?overview=full&geometries=geojson`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`OSRM request failed with ${response.status}`);

        const data = await response.json();
        const routeCoordinates = data?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
          setRoadRoutePositions([]);
          return;
        }

        setRoadRoutePositions(routeCoordinates.map(([lng, lat]) => [lat, lng]));
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setRoadRoutePositions([]);
        }
      }
    };

    loadRoadRoute();
    return () => controller.abort();
  }, [positionsForRoute]);

  const polylinePositions = roadRoutePositions.length > 1 ? roadRoutePositions : positionsForRoute;
  const positions = stopPositions;

  const center = useMemo(() => {
    const basePoints = polylinePositions.length > 0 ? polylinePositions : positions;
    let points = [...basePoints];
    if (useMobileCurrentOnMap) points = [currentLocationPoint, ...points];
    if (livePosition) points = [...points, livePosition];
    if (points.length === 0) return DEFAULT_CENTER;
    const sumLat = points.reduce((a, p) => a + p[0], 0);
    const sumLng = points.reduce((a, p) => a + p[1], 0);
    return [sumLat / points.length, sumLng / points.length];
  }, [polylinePositions, positions, livePosition, useMobileCurrentOnMap, currentLocationPoint]);

  const fitPoints = useMemo(() => {
    const basePoints = polylinePositions.length > 0 ? polylinePositions : positions;
    let points = [...basePoints];
    if (useMobileCurrentOnMap) points = [currentLocationPoint, ...points];
    if (livePosition) points = [...points, livePosition];
    return points;
  }, [polylinePositions, positions, livePosition, useMobileCurrentOnMap, currentLocationPoint]);

  const hasStops = stopsWithCoords.length > 0;
  const hasCurrentLocation = useMobileCurrentOnMap;
  const showMap = hasStops || hasCurrentLocation || liveVehicleFromParent || !!vehicleNumber;
  if (!showMap) return null;

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md ${className}`}>
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <MdMap className="w-5 h-5" style={{ color: accent }} />
        <span className="text-sm font-semibold text-gray-800">Route map</span>
        <span className="text-xs text-gray-500 ml-1">
          {hasCurrentLocation && 'Current → '}{stopsWithCoords.length} stop(s)
        </span>
        {(liveVehicleFromParent || vehicleNumber) && (
          <span className="text-xs text-gray-500 ml-1">• Live: {livePosition ? 'on' : '…'}</span>
        )}
      </div>
      <div className="h-[280px] w-full relative">
        <MapContainer
          center={center}
          zoom={13}
          className="w-full h-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapToGeometry points={fitPoints} />
          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{ color: accent, weight: 4, opacity: 0.8 }}
            />
          )}
          {useMobileCurrentOnMap && (
            <Marker key="current-location" position={currentLocationPoint} zIndexOffset={400} icon={currentLocationIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-blue-600">You are here</p>
                  <p className="text-gray-500">Current location → pickup/delivery</p>
                </div>
              </Popup>
            </Marker>
          )}
          {stopsWithCoords.map((s, i) => (
            <Marker key={`stop-${s.lat}-${s.lng}-${i}`} position={[s.lat, s.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Stop {s.stop}</p>
                  <p className="capitalize text-gray-600">{s.stop_type}</p>
                  {s.order_id && <p className="text-gray-500">Order #{s.order_id}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
          {livePosition && (
            <Marker key="live-vehicle" position={livePosition} zIndexOffset={500} icon={vehicleMarkerIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Live position</p>
                  <p className="text-gray-600">
                    {liveData?.device_details?.registration_number || liveData?.vehicle_number || vehicleNumber || '—'}
                  </p>
                  {liveData?.location?.address && (
                    <p className="text-gray-500 text-xs mt-1 max-w-[200px] truncate" title={liveData.location.address}>
                      {liveData.location.address}
                    </p>
                  )}
                  {liveData?.status && (
                    <p className="capitalize text-gray-500">{liveData.status}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteStopsMap;
