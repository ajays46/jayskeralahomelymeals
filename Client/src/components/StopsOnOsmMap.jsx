import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ensure default marker icons work in React bundlers.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const parseNumber = (v) => {
  const n = typeof v === 'string' ? Number(v.trim()) : Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeStop = (stop) => {
  if (!stop || typeof stop !== 'object') return null;

  const lat = parseNumber(stop.latitude ?? stop.Latitude ?? stop.lat ?? stop.Lat);
  const lng = parseNumber(stop.longitude ?? stop.Longitude ?? stop.lng ?? stop.Lng);

  if (lat == null || lng == null) return null;

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return {
    lat,
    lng,
    name: stop.delivery_name ?? stop.Delivery_Name ?? null,
    stopOrder: stop.stop_order ?? stop.stopOrder ?? stop.Stop_No ?? stop.stopNo ?? stop.stop ?? null,
    location: stop.location ?? stop.Location ?? null,
    status: stop.status ?? stop.delivery_status ?? stop.Delivery_Status ?? null,
    phone: stop.phone_number ?? stop.Phone_Number ?? stop.phone ?? stop.Phone ?? null,
  };
};

const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';

const StopsOnOsmMap = ({
  stops,
  className = '',
  height = 340,
  zoom = 13,
  center = [10.0, 76.3],
  accent = '#E85D04',
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [leafletMap, setLeafletMap] = useState(null);
  const [expanded, setExpanded] = useState(false); // default minimized

  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(max-width: 640px)') : null;
    if (!mq) return;

    const apply = () => setIsMobile(!!mq.matches);
    apply();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }

    // Safari / older browsers fallback
    if (typeof mq.addListener === 'function') {
      mq.addListener(apply);
      return () => mq.removeListener(apply);
    }
  }, []);

  useEffect(() => {
    // Leaflet needs a size recalculation when the container height is responsive.
    if (expanded && leafletMap) leafletMap.invalidateSize();
  }, [leafletMap, isMobile, stops, expanded]);

  const normalizedStops = useMemo(() => {
    const list = Array.isArray(stops) ? stops : [];
    return list.map(normalizeStop).filter(Boolean);
  }, [stops]);

  const computedCenter = useMemo(() => {
    if (normalizedStops.length === 0) return center;
    const sumLat = normalizedStops.reduce((acc, s) => acc + s.lat, 0);
    const sumLng = normalizedStops.reduce((acc, s) => acc + s.lng, 0);
    return [sumLat / normalizedStops.length, sumLng / normalizedStops.length];
  }, [normalizedStops, center]);

  // Simple bounds fit: just use Leaflet fitBounds on load via MapContainer "whenCreated".
  const points = normalizedStops.map((s) => [s.lat, s.lng]);

  const [roadRoutePositions, setRoadRoutePositions] = useState([]);

  useEffect(() => {
    // Need at least start + end to draw a path.
    if (!expanded || normalizedStops.length < 2) {
      setRoadRoutePositions([]);
      return;
    }

    const controller = new AbortController();
    const coordinates = normalizedStops
      .map((s) => `${s.lng},${s.lat}`) // OSRM expects lon,lat
      .join(';');

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

        // Convert OSRM geometry [lng,lat] -> [lat,lng] for Leaflet.
        setRoadRoutePositions(routeCoordinates.map(([lng, lat]) => [lat, lng]));
      } catch (error) {
        if (error?.name !== 'AbortError') setRoadRoutePositions([]);
      }
    };

    loadRoadRoute();
    return () => controller.abort();
  }, [normalizedStops, expanded]);

  const polylinePositions = roadRoutePositions.length > 1 ? roadRoutePositions : points;

  return (
    <div className={`w-full rounded-2xl overflow-hidden bg-white shadow-md ${className}`}>
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-gray-800 truncate">Stops map</span>
          <span className="text-xs text-gray-500 shrink-0">{normalizedStops.length} stop(s)</span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shrink-0"
          title={expanded ? 'Collapse map' : 'Expand map'}
        >
          {expanded ? 'Minimize' : 'Expand'}
        </button>
      </div>
      {expanded ? (
        <div
          style={{
            // Responsive map height so it doesn't become too small on mobile.
            height: `clamp(250px, 42vh, ${height}px)`,
          }}
        >
          <MapContainer
            center={computedCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%', touchAction: 'pan-y' }}
            scrollWheelZoom={false}
            dragging={true}
            touchZoom={true}
            doubleClickZoom={false}
            keyboard={false}
            whenCreated={(map) => {
              setLeafletMap(map);
              if (points.length > 1) map.fitBounds(points, { padding: [24, 24] });
              // Ensure proper sizing after first render.
              setTimeout(() => map.invalidateSize(), 0);
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {polylinePositions.length > 1 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{ color: accent, weight: 4, opacity: 0.8 }}
              />
            )}

            {normalizedStops.map((s, i) => (
              <Marker key={`${s.lat}-${s.lng}-${i}`} position={[s.lat, s.lng]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{s.name || `Stop ${i + 1}`}</p>
                    {s.stopOrder != null && <p className="text-gray-600 text-xs">Order: {s.stopOrder}</p>}
                    {s.location && <p className="text-gray-500 text-xs mt-1 max-w-[260px] truncate">{s.location}</p>}
                    {s.status && <p className="text-gray-500 text-xs mt-1 capitalize">{s.status}</p>}
                    {s.phone && <p className="text-gray-500 text-xs mt-1">{s.phone}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        // Minimized: occupy only the header row (no extra blank space).
        <div className="h-0" />
      )}
    </div>
  );
};

export default StopsOnOsmMap;

