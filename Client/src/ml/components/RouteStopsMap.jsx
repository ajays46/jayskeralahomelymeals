/**
 * RouteStopsMap - Shows route stops (with lat/lng) on a Leaflet map.
 * Optional: pass vehicleNumber to show live vehicle position from 5004 vehicle-tracking/live API.
 */
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdMap } from 'react-icons/md';
import { useLiveVehiclePosition } from '../../hooks/mlHooks/useVehicleTracking';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [10.0, 76.3];

/**
 * @param {{ stops: Array<{ latitude: number; longitude: number; stop?: number; stop_type?: string; order_id?: string }>; vehicleNumber?: string; accent?: string; className?: string }} props
 */
const RouteStopsMap = ({ stops, vehicleNumber, accent = '#E85D04', className = '' }) => {
  const { data: liveData } = useLiveVehiclePosition(vehicleNumber || '', {
    refetchInterval: vehicleNumber ? 15000 : false,
  });
  const livePosition = useMemo(() => {
    const loc = liveData?.location;
    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return null;
    return [Number(loc.latitude), Number(loc.longitude)];
  }, [liveData?.location]);

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

  const positions = useMemo(
    () => stopsWithCoords.map((s) => [s.lat, s.lng]),
    [stopsWithCoords]
  );

  const center = useMemo(() => {
    const points = livePosition ? [...positions, livePosition] : positions;
    if (points.length === 0) return DEFAULT_CENTER;
    const sumLat = points.reduce((a, p) => a + p[0], 0);
    const sumLng = points.reduce((a, p) => a + p[1], 0);
    return [sumLat / points.length, sumLng / points.length];
  }, [positions, livePosition]);

  const hasStops = stopsWithCoords.length > 0;
  const showMap = hasStops || vehicleNumber;
  if (!showMap) return null;

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md ${className}`}>
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <MdMap className="w-5 h-5" style={{ color: accent }} />
        <span className="text-sm font-semibold text-gray-800">Route map</span>
        <span className="text-xs text-gray-500 ml-1">{stopsWithCoords.length} stop(s)</span>
        {vehicleNumber && (
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
          {positions.length > 1 && (
            <Polyline
              positions={positions}
              pathOptions={{ color: accent, weight: 4, opacity: 0.8 }}
            />
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
            <Marker key="live-vehicle" position={livePosition} zIndexOffset={500}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Live position</p>
                  <p className="text-gray-600">{liveData?.device_details?.registration_number || vehicleNumber}</p>
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
