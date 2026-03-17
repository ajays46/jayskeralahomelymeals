/**
 * MapLocationPickerModal - In-app map for delivery partner to pick a location (e.g. pickup).
 * Tap/click on map to set marker; reverse geocode fills address; "Use this location" returns
 * { street, housename, city, pincode, geoLocation, googleMapsUrl } for MLAddTripPage.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdClose, MdMyLocation, MdCheck, MdSearch } from 'react-icons/md';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER = [10.0, 76.3]; // India fallback

function reverseGeocode(lat, lng) {
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    { headers: { Accept: 'application/json' } }
  ).then((r) => r.json());
}

function searchPlaces(query) {
  const q = String(query || '').trim();
  if (!q) return Promise.resolve([]);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=6`;
  return fetch(url, { headers: { Accept: 'application/json' } })
    .then((r) => r.json())
    .then((data) => (Array.isArray(data) ? data : []));
}

function buildLocationFromNominatim(data, lat, lng) {
  const addr = data?.address || {};
  const road = addr.road || '';
  const houseNumber = addr.house_number || '';
  const suburb = addr.suburb || addr.neighbourhood || '';
  const city = addr.city || addr.town || addr.village || addr.state_district || addr.state || '';
  const postcode = (addr.postcode && String(addr.postcode).trim()) || '';
  const street = [houseNumber, road, suburb].filter(Boolean).join(', ') || data?.display_name?.split(',')[0] || '';
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  return {
    street: street.trim() || (data?.display_name || '').split(',')[0] || '',
    housename: '',
    city: city.trim() || '',
    pincode: postcode,
    geoLocation: `${lat},${lng}`,
    googleMapsUrl,
  };
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MapLocationPickerModal = ({ isOpen, onClose, onSelect, accent = '#E85D04' }) => {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationResult, setLocationResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleMapClick = useCallback(async (lat, lng) => {
    setMarker([lat, lng]);
    setError('');
    setLocationResult(null);
    setLoading(true);
    try {
      const data = await reverseGeocode(lat, lng);
      const loc = buildLocationFromNominatim(data, lat, lng);
      setLocationResult(loc);
    } catch (err) {
      setError('Could not get address for this point. You can still use it.');
      setLocationResult({
        street: '',
        housename: '',
        city: '',
        pincode: '',
        geoLocation: `${lat},${lng}`,
        googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUseLocation = useCallback(() => {
    if (locationResult) {
      onSelect(locationResult);
      onClose();
    }
  }, [locationResult, onSelect, onClose]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([latitude, longitude]);
        handleMapClick(latitude, longitude);
      },
      () => {
        setError('Could not get your location.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [handleMapClick]);

  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Reset transient UI when opening
    setSearchError('');
    setSearchResults([]);
  }, [isOpen]);

  const handleSearch = useCallback(async () => {
    const q = String(searchQuery || '').trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const results = await searchPlaces(q);
      setSearchResults(results);
      if (results.length === 0) setSearchError('No results found. Try a different name or pincode.');
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handlePickSearchResult = useCallback(
    (r) => {
      const lat = Number(r?.lat);
      const lng = Number(r?.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      setCenter([lat, lng]);
      // This fills marker + reverse geocode + locationResult
      handleMapClick(lat, lng);
    },
    [handleMapClick]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col sm:items-center sm:justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full h-full sm:h-[85vh] sm:max-h-[600px] sm:max-w-2xl sm:rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pick location on map</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMyLocation}
              disabled={loading}
              className="p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Center on my location"
              aria-label="My location"
            >
              <MdMyLocation className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Search pickup (place name / landmark / pincode)"
                className="w-full pl-10 pr-3 min-h-[44px] rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ borderColor: accent }}
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={searchLoading || !String(searchQuery || '').trim()}
              className="min-h-[44px] px-4 rounded-xl font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: accent }}
            >
              {searchLoading ? 'Searching…' : 'Search'}
            </button>
          </div>

          {searchError && <p className="mt-2 text-sm text-amber-700">{searchError}</p>}
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border border-gray-200 overflow-hidden">
              <ul className="max-h-40 overflow-y-auto divide-y divide-gray-200">
                {searchResults.map((r) => (
                  <li key={`${r.place_id}-${r.lat}-${r.lon}`}>
                    <button
                      type="button"
                      onClick={() => handlePickSearchResult(r)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{r.display_name}</p>
                      <p className="text-xs text-gray-500">
                        {Number(r.lat).toFixed(5)}, {Number(r.lon).toFixed(5)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-[240px] relative">
          <MapContainer
            key={`${center[0].toFixed(4)}-${center[1].toFixed(4)}`}
            center={center}
            zoom={14}
            className="w-full h-full min-h-[240px] rounded-b-2xl"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleMapClick} />
            {marker && <Marker position={marker} />}
          </MapContainer>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2 shrink-0">
          {error && <p className="text-sm text-amber-700">{error}</p>}
          {loading && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Getting address…
            </p>
          )}
          {locationResult && !loading && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 line-clamp-2">
                {locationResult.street && `${locationResult.street}, `}
                {locationResult.city && `${locationResult.city} `}
                {locationResult.pincode && `- ${locationResult.pincode}`}
                {!locationResult.street && !locationResult.city && locationResult.googleMapsUrl && 'Location selected'}
              </p>
              <button
                type="button"
                onClick={handleUseLocation}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: accent }}
              >
                <MdCheck className="w-5 h-5" />
                Use this location
              </button>
            </div>
          )}
          {!marker && !loading && (
            <p className="text-sm text-gray-500">Tap on the map to set the pickup point.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapLocationPickerModal;
