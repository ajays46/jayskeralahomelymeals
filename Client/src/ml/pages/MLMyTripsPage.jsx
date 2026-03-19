/**
 * MLMyTripsPage - MaXHub Logistics: Start route, show route response and stop cards, end shift.
 * Stop cards: Mark stop reached (POST /api/journey/mark-stop) and Picked up/Delivered (PATCH /api/ml-trips/:trip_id).
 * Live vehicle map: GET /api/vehicle-tracking/live (polled here; JWT driver when no vehicle_number).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPlayArrow, MdRestaurant, MdLocationOn, MdCheckCircle, MdPowerSettingsNew, MdSearch } from 'react-icons/md';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useStartRoute } from '../../hooks/mlHooks/useStartRoute';
import { useEndShift } from '../../hooks/mlHooks/useEndShift';
import { useMarkStop } from '../../hooks/mlHooks/useMarkStop';
import { useUpdateMlTripStatus } from '../../hooks/mlHooks/useUpdateMlTripStatus';
import { useUpdateDeliveryAddress } from '../../hooks/mlHooks/useUpdateDeliveryAddress';
import { useMlTripsByOrderId } from '../../hooks/mlHooks/useMlTripsByOrderId';
import { useMlTripsList } from '../../hooks/mlHooks/useMlTripsList';
import { useLiveVehiclePosition } from '../../hooks/mlHooks/useVehicleTracking';
import useMLDeliveryPartnerStore from '../../stores/MLDeliveryPartner.store.js';
import { showSuccessToast, showErrorToast } from '../utils/mlToast';
import RouteStopsMap from '../components/RouteStopsMap';
import MapLocationPickerModal from '../components/MapLocationPickerModal';

const LS_ROUTE_ID = 'ml_route_id';
const LS_ROUTE_STOPS = 'ml_route_stops';
const LIVE_VEHICLE_POLL_MS = 5000;

const initialDeliveryAddressForm = {
  googleMapsUrl: '',
  street: '',
  housename: '',
  city: '',
  pincode: '',
  geoLocation: '',
};

const parseCoordinatePair = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.match(/(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return { latitude, longitude };
};

const extractCoordsFromMapUrl = (mapUrl) => {
  const raw = String(mapUrl || '').trim();
  if (!raw) return null;

  try {
    const parsedUrl = new URL(raw);
    const queryValue =
      parsedUrl.searchParams.get('q') ||
      parsedUrl.searchParams.get('query') ||
      parsedUrl.searchParams.get('ll');
    const fromQuery = parseCoordinatePair(queryValue || '');
    if (fromQuery) return fromQuery;
  } catch {
    // Ignore URL parse failures; continue with regex strategies.
  }

  const decoded = decodeURIComponent(raw);

  const fromAtMarker = decoded.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (fromAtMarker) {
    return {
      latitude: Number(fromAtMarker[1]),
      longitude: Number(fromAtMarker[2]),
    };
  }

  const from3d4d = decoded.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
  if (from3d4d) {
    return {
      latitude: Number(from3d4d[1]),
      longitude: Number(from3d4d[2]),
    };
  }

  const fromPair = parseCoordinatePair(decoded);
  return fromPair || null;
};

const getCoordsFromTripAddress = (address) => {
  if (!address || typeof address !== 'object') return null;

  const fromGeoLocation = parseCoordinatePair(address.geo_location || address.geoLocation || '');
  if (fromGeoLocation) return fromGeoLocation;

  const mapUrl = String(address.google_maps_url || address.googleMapsUrl || '').trim();
  if (!mapUrl) return null;

  try {
    const parsedUrl = new URL(mapUrl);
    const queryValue = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query');
    const fromQuery = parseCoordinatePair(queryValue || '');
    if (fromQuery) return fromQuery;
  } catch {
    // Ignore URL parsing failures and fall back to regex parsing below.
  }

  return extractCoordsFromMapUrl(mapUrl);
};

const getStopCoordinateKey = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
};

const MLMyTripsPage = () => {
  const base = useCompanyBasePath();
  const navigate = useNavigate();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [routeResponse, setRouteResponse] = useState(null);

  const storeRouteId = useMLDeliveryPartnerStore((s) => s.routeId);
  const storeStops = useMLDeliveryPartnerStore((s) => s.stops);
  const storePlatform = useMLDeliveryPartnerStore((s) => s.platform);
  const setStorePlatform = useMLDeliveryPartnerStore((s) => s.setPlatform);
  const setActiveRoute = useMLDeliveryPartnerStore((s) => s.setActiveRoute);
  const clearAll = useMLDeliveryPartnerStore((s) => s.clearAll);
  const setTripStatus = useMLDeliveryPartnerStore((s) => s.setTripStatus);
  const tripStatusByTripId = useMLDeliveryPartnerStore((s) => s.tripStatusByTripId);

  const savedRouteId = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem(LS_ROUTE_ID) : null) || '', []);
  const initialRouteId = storeRouteId || savedRouteId || '';
  const [routeId, setRouteId] = useState(initialRouteId);
  const effectiveRouteId = storeRouteId || routeId;

  const [actioningStopKey, setActioningStopKey] = useState(null);
  const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);
  /** Current location when route was started (for map: current → pickup/delivery). */
  const [startRouteCurrentLocation, setStartRouteCurrentLocation] = useState(null);
  /** Trip ID for which the delivery-location map picker modal is open (null = closed). */
  const [deliveryMapPickerTripId, setDeliveryMapPickerTripId] = useState(null);
  const [orderSearchInput, setOrderSearchInput] = useState('');
  const [editingDeliveryStopKey, setEditingDeliveryStopKey] = useState(null);
  const [deliveryAddressForm, setDeliveryAddressForm] = useState(initialDeliveryAddressForm);
  const [deliveryAddressAddedForTripIds, setDeliveryAddressAddedForTripIds] = useState(() => new Set());
  const [updatedTripsById, setUpdatedTripsById] = useState({});

  const markStopMutation = useMarkStop();
  const byOrderIdMutation = useMlTripsByOrderId({
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'No trips found for this order ID.';
      showErrorToast(String(msg), 'Search');
    },
  });
  const updateTripStatusMutation = useUpdateMlTripStatus();
  const { data: tripsFromList = [] } = useMlTripsList(
    {},
    { enabled: !!effectiveRouteId }
  );

  /** GET /api/vehicle-tracking/live — same route as Server/mlVehicleTracking.routes.js; no vehicle_number = JWT driver */
  const liveVehicleQuery = useLiveVehiclePosition(null, {
    enabled: !!effectiveRouteId,
    refetchInterval: effectiveRouteId ? LIVE_VEHICLE_POLL_MS : false,
  });

  const startRouteMutation = useStartRoute({
    onSuccess: (data) => {
      const rid = data?.route_id;
      const stops = data?.stops;
      if (rid) {
        localStorage.setItem(LS_ROUTE_ID, String(rid));
        setRouteId(String(rid));
        setTrackingEnabled(true);
        setActiveRoute(String(rid), Array.isArray(stops) ? stops : []);
      }
      if (Array.isArray(stops)) {
        localStorage.setItem(LS_ROUTE_STOPS, JSON.stringify(stops));
      }
      setRouteResponse(data ?? null);
      showSuccessToast('Route created. GPS tracking started automatically.', 'Route started');
    },
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to start route.';
      showErrorToast(msg, 'Error');
    },
  });

  const endShiftMutation = useEndShift({
    onSuccess: () => {
      clearAll();
      setTrackingEnabled(false);
      setRouteId('');
      setRouteResponse(null);
      setIsRouteMapMinimized(false);
      setStartRouteCurrentLocation(null);
      localStorage.removeItem(LS_ROUTE_ID);
      localStorage.removeItem(LS_ROUTE_STOPS);
      showSuccessToast('Shift ended. You are now offline.', 'Shift ended');
      navigate(`${base}/dashboard`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to end shift.';
      showErrorToast(msg, 'Error');
    },
  });

  const updateDeliveryAddressMutation = useUpdateDeliveryAddress({
    onSuccess: async (data, { tripId }) => {
      const updatedTripId = data?.id || tripId;
      if (updatedTripId && data) {
        setUpdatedTripsById((prev) => ({ ...prev, [updatedTripId]: data }));
      }
      if (tripId) setDeliveryAddressAddedForTripIds((prev) => new Set(prev).add(tripId));
      showSuccessToast('Delivery address saved. Refreshing route…', 'Saved');
      setEditingDeliveryStopKey(null);
      setDeliveryAddressForm(initialDeliveryAddressForm);
      const platform = (useMLDeliveryPartnerStore.getState().platform || 'swiggy').toUpperCase();
      try {
        const loc = await getCurrentLocation();
        setStartRouteCurrentLocation(loc);
        startRouteMutation.mutate({ platform, current_location: loc });
      } catch {
        setStartRouteCurrentLocation(null);
        startRouteMutation.mutate({ platform });
      }
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save delivery address.';
      showErrorToast(msg, 'Error');
    },
  });

  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });

  const handleStartRoute = async () => {
    if (startRouteMutation.isPending) return;
    const platform = (useMLDeliveryPartnerStore.getState().platform || 'swiggy').toUpperCase();
    try {
      const loc = await getCurrentLocation();
      setStartRouteCurrentLocation(loc);
      startRouteMutation.mutate({ platform, current_location: loc });
    } catch {
      setStartRouteCurrentLocation(null);
      startRouteMutation.mutate({ platform });
    }
  };

  const handleEndShiftClick = () => setShowEndShiftConfirm(true);

  const handleEndShiftConfirm = () => {
    if (endShiftMutation.isPending) return;
    setShowEndShiftConfirm(false);
    const platform = (useMLDeliveryPartnerStore.getState().platform || 'swiggy').toUpperCase();
    endShiftMutation.mutate({ platform });
  };

  const handleOrderIdSearch = () => {
    const value = (orderSearchInput ?? '').toString().trim();
    if (!value) {
      showErrorToast('Enter an order ID (full or last 4/5 digits).', 'Search');
      return;
    }
    byOrderIdMutation.mutate({ orderId: value });
  };

  const orderFilter = (orderSearchInput ?? '').toString().trim();

  const routeStopsForMap = useMemo(() => {
    const fromResponse = routeResponse?.stops;
    if (Array.isArray(fromResponse) && fromResponse.length > 0) return fromResponse;
    if (Array.isArray(storeStops) && storeStops.length > 0) return storeStops;
    if (typeof window !== 'undefined') {
      try {
        const s = JSON.parse(localStorage.getItem(LS_ROUTE_STOPS) || '[]');
        if (Array.isArray(s) && s.length > 0) return s;
      } catch {
        // ignore
      }
    }
    return [];
  }, [routeResponse?.stops, storeStops]);

  const tripsForMap = useMemo(() => {
    const merged = new Map();
    (Array.isArray(tripsFromList) ? tripsFromList : []).forEach((trip) => {
      if (trip?.id) merged.set(trip.id, trip);
    });
    Object.values(updatedTripsById).forEach((trip) => {
      if (trip?.id) merged.set(trip.id, trip);
    });
    return Array.from(merged.values());
  }, [tripsFromList, updatedTripsById]);

  const stopsWithCoordsForMap = useMemo(() => {
    const mapStops = Array.isArray(routeStopsForMap) ? [...routeStopsForMap] : [];
    const existingPickupTripIds = new Set(
      mapStops
        .filter((stop) => stop?.stop_type === 'pickup' && stop?.trip_id)
        .map((stop) => stop.trip_id)
    );
    const existingDeliveryTripIds = new Set(
      mapStops
        .filter((stop) => stop?.stop_type === 'delivery' && stop?.trip_id)
        .map((stop) => stop.trip_id)
    );
    const existingCoordinateKeys = new Set(
      mapStops
        .map((stop) => getStopCoordinateKey(stop?.latitude, stop?.longitude))
        .filter(Boolean)
    );
    const fallbackPickupStops = [];
    const fallbackDeliveryStops = [];

    tripsForMap.forEach((trip) => {
      const persistedStatus = (tripStatusByTripId[trip.id] || trip.trip_status || '').toLowerCase();
      if (!trip?.id) return;

      if (!existingPickupTripIds.has(trip.id)) {
        const pickupCoords = getCoordsFromTripAddress(trip.pickup_address);
        const pickupCoordKey = getStopCoordinateKey(pickupCoords?.latitude, pickupCoords?.longitude);
        if (pickupCoords && (!pickupCoordKey || !existingCoordinateKeys.has(pickupCoordKey))) {
          fallbackPickupStops.push({
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
            order_id: trip.order_id ?? trip.orderId,
            trip_id: trip.id,
            stop_type: 'pickup',
          });
          existingPickupTripIds.add(trip.id);
          if (pickupCoordKey) existingCoordinateKeys.add(pickupCoordKey);
        }
      }

      if (existingDeliveryTripIds.has(trip.id)) return;

      const shouldShowDelivery =
        persistedStatus === 'picked_up' ||
        persistedStatus === 'delivered' ||
        deliveryAddressAddedForTripIds.has(trip.id);
      if (!shouldShowDelivery) return;

      const deliveryCoords = getCoordsFromTripAddress(trip.delivery_address);
      if (!deliveryCoords) return;
      const deliveryCoordKey = getStopCoordinateKey(deliveryCoords.latitude, deliveryCoords.longitude);
      if (deliveryCoordKey && existingCoordinateKeys.has(deliveryCoordKey)) {
        existingDeliveryTripIds.add(trip.id);
        return;
      }

      fallbackDeliveryStops.push({
        latitude: deliveryCoords.latitude,
        longitude: deliveryCoords.longitude,
        order_id: trip.order_id ?? trip.orderId,
        trip_id: trip.id,
        stop_type: 'delivery',
      });
      existingDeliveryTripIds.add(trip.id);
      if (deliveryCoordKey) existingCoordinateKeys.add(deliveryCoordKey);
    });

    return [...fallbackPickupStops, ...mapStops, ...fallbackDeliveryStops].map((stop, index) => ({
      ...stop,
      stop: index + 1,
      step: index + 1,
    }));
  }, [routeStopsForMap, tripsForMap, tripStatusByTripId, deliveryAddressAddedForTripIds]);

  const stopsListRaw = useMemo(() => {
    const fromResponse = routeResponse?.stops;
    if (Array.isArray(fromResponse) && fromResponse.length > 0) return fromResponse;
    if (Array.isArray(storeStops) && storeStops.length > 0) return storeStops;
    if (typeof window !== 'undefined') {
      try {
        const s = JSON.parse(localStorage.getItem(LS_ROUTE_STOPS) || '[]');
        if (Array.isArray(s) && s.length > 0) return s;
      } catch {
        // ignore
      }
    }
    // Fallback: when route has 0 stops from API (e.g. 5004 only returns stops for 3+ trips), show partner's trips as stops so 1–2 show
    if (effectiveRouteId && Array.isArray(tripsFromList) && tripsFromList.length > 0) {
      return tripsFromList.map((trip, i) => ({
        trip_id: trip.id,
        order_id: trip.order_id ?? trip.orderId,
        stop_type: 'delivery',
        step: i + 1,
        stop: i + 1,
      }));
    }
    return [];
  }, [effectiveRouteId, routeResponse, storeStops, tripsFromList]);

  const stopsList = useMemo(() => {
    const raw = stopsListRaw;
    const filter = orderFilter.toLowerCase();
    if (!filter) return raw;
    return raw.filter((stop) => {
      const oid = (stop.order_id ?? '').toString().toLowerCase();
      return oid === filter || oid.endsWith(filter) || oid.includes(filter);
    });
  }, [stopsListRaw, orderFilter]);

  const handleStopAction = async (stop) => {
    const key = stop.planned_stop_id;
    if (!effectiveRouteId || !key) return;
    const tripStatus = stop.stop_type === 'pickup' ? 'picked_up' : 'delivered';
    const label = stop.stop_type === 'pickup' ? 'Picked up' : 'Delivered';
    setActioningStopKey(key);
    try {
      await markStopMutation.mutateAsync({ route_id: effectiveRouteId, planned_stop_id: key });
      if (stop.trip_id) {
        await updateTripStatusMutation.mutateAsync({ tripId: stop.trip_id, trip_status: tripStatus });
        setTripStatus(stop.trip_id, tripStatus);
      }
      showSuccessToast(`${label} recorded.`, label);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || `Failed to record ${label.toLowerCase()}.`;
      showErrorToast(msg, 'Error');
    } finally {
      setActioningStopKey(null);
    }
  };

  const handleDeliveryOnlyAction = async (tripId) => {
    if (!tripId) return;
    setActioningStopKey(`delivery-only-${tripId}`);
    try {
      await updateTripStatusMutation.mutateAsync({ tripId, trip_status: 'delivered' });
      setTripStatus(tripId, 'delivered');
      showSuccessToast('Delivered recorded.', 'Delivered');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to record delivered.';
      showErrorToast(msg, 'Error');
    } finally {
      setActioningStopKey(null);
    }
  };

  const tripIdsWithDeliveryStop = useMemo(
    () => new Set(stopsList.filter((s) => s.stop_type === 'delivery' && s.trip_id).map((s) => s.trip_id)),
    [stopsList]
  );

  useEffect(() => {
    if (effectiveRouteId && !trackingEnabled) setTrackingEnabled(true);
  }, [effectiveRouteId]);

  useEffect(() => {
    if (stopsListRaw.length < 3 && orderSearchInput) setOrderSearchInput('');
  }, [stopsListRaw.length, orderSearchInput]);

  return (
    <div className="min-h-screen bg-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-20 sm:pt-24 pb-24 px-4 max-w-md sm:max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-0.5">My Trips</h1>
            <p className="text-sm text-gray-600">Start route to begin tracking. Response data appears below.</p>
          </div>

          {/* Start route / End shift */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleStartRoute}
                disabled={startRouteMutation.isPending}
                className="min-h-[48px] flex-1 min-w-[120px] px-4 py-3 rounded-2xl text-base font-semibold text-white disabled:opacity-70 shadow-md active:scale-[0.98] transition-transform"
                style={{ backgroundColor: accent }}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <MdPlayArrow className="text-lg" /> {startRouteMutation.isPending ? 'Starting…' : 'Start route'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleEndShiftClick}
                disabled={endShiftMutation.isPending}
                className="min-h-[48px] flex-1 min-w-[100px] px-4 py-3 rounded-2xl text-base font-semibold border disabled:opacity-70 active:scale-[0.98] transition-transform"
                style={{ borderColor: '#ef4444', color: '#b91c1c' }}
              >
                {endShiftMutation.isPending ? 'Ending…' : 'End shift'}
              </button>
            </div>
          </div>

          {!effectiveRouteId && !routeResponse && (
            <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center text-gray-500 text-sm">
              Tap &quot;Start route&quot; to create a route and see stops here.
            </div>
          )}

          {/* Route map + live vehicle: GET /api/vehicle-tracking/live polled in this page */}
          {!!effectiveRouteId && (
            <RouteStopsMap
              stops={stopsWithCoordsForMap}
              currentLocation={startRouteCurrentLocation}
              accent={accent}
              className="w-full"
              liveVehicleFromParent
              liveVehicleData={liveVehicleQuery.data}
            />
          )}

          {/* Find trip by Order ID — only when 3+ stops (filter is useful for longer lists) */}
          {stopsListRaw.length >= 3 && effectiveRouteId && (
            <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Find trip by Order ID</h2>
              <p className="text-xs text-gray-500 mb-3">Enter full order ID or last 4/5 digits to look up a trip or filter stops below.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={orderSearchInput}
                  onChange={(e) => setOrderSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOrderIdSearch()}
                  placeholder="e.g. ORD-2024-12345 or 1234"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={handleOrderIdSearch}
                  disabled={byOrderIdMutation.isPending}
                  className="px-4 py-3 rounded-xl font-semibold text-white disabled:opacity-70 active:scale-[0.98] transition-transform flex items-center gap-1.5 shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  <MdSearch className="w-5 h-5" />
                  {byOrderIdMutation.isPending ? '…' : 'Search'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {orderFilter
                  ? `Showing ${stopsList.length} of ${stopsListRaw.length} stop(s)`
                  : `${stopsListRaw.length} stop(s) in this route`}
              </p>
              {byOrderIdMutation.data && (
                <div className="mt-3 space-y-2">
                  {byOrderIdMutation.data.trips?.length > 0 ? (
                    byOrderIdMutation.data.trips.map((trip) => (
                      <Link
                        key={trip.id}
                        to={`${base}/trips/${trip.id}`}
                        className="block p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className="font-medium text-gray-900">Order #{trip.order_id ?? trip.id}</span>
                        <span className="ml-2 text-xs capitalize text-gray-500">({trip.trip_status ?? '—'})</span>
                        <span className="block text-xs mt-1" style={{ color: accent }}>View trip details →</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">{byOrderIdMutation.data.message || 'No order found for this order ID.'}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stop cards: Picked up / Delivered (persisted in store). Under each pickup without a delivery stop, show a Delivery card to add address. */}
          {stopsList.length > 0 && effectiveRouteId && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Stops</p>
              {stopsList
                .slice()
                .sort((a, b) => (a.step ?? a.stop ?? 0) - (b.step ?? b.stop ?? 0))
                .map((stop, i) => {
                  const persistedStatus = stop.trip_id ? (tripStatusByTripId[stop.trip_id] || '').toLowerCase() : '';
                  const isPickup = stop.stop_type === 'pickup';
                  const isPickedUp = isPickup && (persistedStatus === 'picked_up' || persistedStatus === 'delivered');
                  const isDelivered = !isPickup && persistedStatus === 'delivered';
                  const alreadyDone = isPickedUp || isDelivered;
                  const label = isPickedUp ? 'Picked up' : isDelivered ? 'Delivered' : isPickup ? 'Picked up' : 'Delivered';
                  const buttonLabel = isPickup ? 'Picked up' : 'Deliver';
                  const stopNumber = stop.step ?? stop.stop ?? i + 1;
                  const showDeliveryCardUnderPickup = isPickup && stop.trip_id && !tripIdsWithDeliveryStop.has(stop.trip_id);
                  const deliveryCardKey = `delivery-card-${stop.trip_id}`;

                  const renderDeliveryAddressBlock = (tripId) => {
                    if (deliveryAddressAddedForTripIds.has(tripId)) {
                      return (
                        <div className="mb-3 border-t border-gray-100 pt-3">
                          <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#059669' }}>
                            <MdCheckCircle className="w-4 h-4" /> Delivery address added
                          </p>
                        </div>
                      );
                    }
                    return (
                    <div className="mb-3 border-t border-gray-100 pt-3">
                      {editingDeliveryStopKey !== deliveryCardKey ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDeliveryStopKey(deliveryCardKey);
                            setDeliveryAddressForm(initialDeliveryAddressForm);
                          }}
                          className="text-sm font-medium flex items-center gap-1.5"
                          style={{ color: accent }}
                        >
                          <MdLocationOn className="w-4 h-4" /> Add delivery location
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3"
                        >
                          <p className="text-xs font-medium text-gray-600">Delivery address</p>
                          <input
                            type="url"
                            placeholder="Paste Google Maps link"
                            value={deliveryAddressForm.googleMapsUrl}
                            onChange={(e) => setDeliveryAddressForm((f) => ({ ...f, googleMapsUrl: e.target.value }))}
                            className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-gray-200 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setDeliveryMapPickerTripId(tripId)}
                            className="w-full min-h-[40px] py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2"
                            style={{ borderColor: accent, color: accent }}
                          >
                            <MdLocationOn className="w-5 h-5" /> Pick on map
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDeliveryStopKey(null);
                                setDeliveryAddressForm(initialDeliveryAddressForm);
                              }}
                              className="flex-1 min-h-[40px] py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={updateDeliveryAddressMutation.isPending || !deliveryAddressForm.googleMapsUrl?.trim()}
                              onClick={() => {
                                const mapLink = deliveryAddressForm.googleMapsUrl?.trim();
                                if (!mapLink) {
                                  showErrorToast('Paste a Google Maps link.', 'Validation');
                                  return;
                                }
                                const coords = extractCoordsFromMapUrl(mapLink);
                                // Allow saving map link even when coords are not directly parsable
                                // (some short/share links hide lat/lng). If coords exist, include geoLocation
                                // so map routing is reliable.
                                updateDeliveryAddressMutation.mutate(
                                  coords
                                    ? {
                                        tripId,
                                        googleMapsUrl: mapLink,
                                        geoLocation: `${coords.latitude},${coords.longitude}`,
                                      }
                                    : {
                                        tripId,
                                        googleMapsUrl: mapLink,
                                      }
                                );
                              }}
                              className="flex-1 min-h-[40px] py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                              style={{ backgroundColor: accent }}
                            >
                              {updateDeliveryAddressMutation.isPending ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                  };

                  return (
                    <React.Fragment key={stop.planned_stop_id || `${stop.trip_id}-${stopNumber}-${i}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-gray-500 text-sm">Stop {stopNumber}</span>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                            style={{
                              backgroundColor: stop.stop_type === 'delivery' ? '#dbeafe' : '#fef3c7',
                              color: stop.stop_type === 'delivery' ? '#1e40af' : '#92400e',
                            }}
                          >
                            {stop.stop_type === 'delivery' ? (
                              <span className="inline-flex items-center gap-1"><MdLocationOn className="w-3.5 h-3.5" /> Delivery</span>
                            ) : (
                              <span className="inline-flex items-center gap-1"><MdRestaurant className="w-3.5 h-3.5" /> Pickup</span>
                            )}
                          </span>
                        </div>
                        {stop.order_id && (
                          <p className="text-sm font-medium text-gray-800 mb-2">Order #{stop.order_id}</p>
                        )}
                        {stop.trip_id && (
                          <p className="text-xs text-gray-500 mb-2">
                            <Link to={`${base}/trips/${stop.trip_id}`} className="font-medium underline" style={{ color: accent }}>Trip details</Link>
                          </p>
                        )}
                        {stop.stop_type === 'delivery' && stop.trip_id && renderDeliveryAddressBlock(stop.trip_id)}
                        <div className="mt-3">
                          {alreadyDone ? (
                            <div
                              className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                              style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                            >
                              <MdCheckCircle className="w-5 h-5" /> {label} ✓
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStopAction(stop)}
                              disabled={!stop.planned_stop_id || actioningStopKey != null}
                              className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50 transition-transform"
                              style={{
                                backgroundColor: stop.stop_type === 'pickup' ? '#d97706' : accent,
                              }}
                            >
                              {actioningStopKey === stop.planned_stop_id ? '…' : buttonLabel}
                            </button>
                          )}
                        </div>
                      </motion.div>
                      {showDeliveryCardUnderPickup && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: (i + 1) * 0.03 }}
                          className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md border-l-4"
                          style={{ borderLeftColor: accent }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className="text-gray-500 text-sm">Delivery (same order)</span>
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                            >
                              <span className="inline-flex items-center gap-1"><MdLocationOn className="w-3.5 h-3.5" /> Delivery</span>
                            </span>
                          </div>
                          {stop.order_id && (
                            <p className="text-sm font-medium text-gray-800 mb-2">Order #{stop.order_id}</p>
                          )}
                          {stop.trip_id && (
                            <p className="text-xs text-gray-500 mb-2">
                              <Link to={`${base}/trips/${stop.trip_id}`} className="font-medium underline" style={{ color: accent }}>Trip details</Link>
                            </p>
                          )}
                          {renderDeliveryAddressBlock(stop.trip_id)}
                          <div className="mt-3">
                            {persistedStatus === 'delivered' ? (
                              <div
                                className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                                style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
                              >
                                <MdCheckCircle className="w-5 h-5" /> Delivered ✓
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeliveryOnlyAction(stop.trip_id)}
                                disabled={actioningStopKey != null}
                                className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50 transition-transform"
                                style={{ backgroundColor: accent }}
                              >
                                {actioningStopKey === `delivery-only-${stop.trip_id}` ? '…' : 'Deliver'}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
            </div>
          )}
        </motion.div>
      </main>

      {/* Delivery location map picker - visual map selection when adding delivery address */}
      <MapLocationPickerModal
        isOpen={!!deliveryMapPickerTripId}
        onClose={() => setDeliveryMapPickerTripId(null)}
        accent={accent}
        onSelect={(locationResult) => {
          const tripId = deliveryMapPickerTripId;
          if (!tripId) return;
          updateDeliveryAddressMutation.mutate({
            tripId,
            googleMapsUrl: locationResult.googleMapsUrl,
            street: locationResult.street,
            housename: locationResult.housename,
            city: locationResult.city,
            pincode: locationResult.pincode,
            geoLocation: locationResult.geoLocation,
          });
          setDeliveryMapPickerTripId(null);
          setEditingDeliveryStopKey(null);
        }}
      />

      {/* End shift confirmation - above map (high z-index so it shows on top of live map) */}
      <AnimatePresence>
        {showEndShiftConfirm && (
          <motion.div
            key="endShiftConfirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => !endShiftMutation.isPending && setShowEndShiftConfirm(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white shadow-xl overflow-hidden"
            >
              <div className="p-6 pt-7 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fef2f2' }}>
                  <MdPowerSettingsNew className="text-3xl" style={{ color: '#dc2626' }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">End shift?</h3>
                <p className="text-sm text-gray-600 mb-6">You will go offline. Your active route will be cleared. Are you sure?</p>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => !endShiftMutation.isPending && setShowEndShiftConfirm(false)}
                    disabled={endShiftMutation.isPending}
                    className="min-h-[48px] flex-1 rounded-2xl font-semibold text-gray-700 bg-gray-100 active:bg-gray-200 disabled:opacity-60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEndShiftConfirm}
                    disabled={endShiftMutation.isPending}
                    className="min-h-[48px] flex-1 rounded-2xl font-semibold text-white active:opacity-90 disabled:opacity-60 transition-opacity"
                    style={{ backgroundColor: '#dc2626' }}
                  >
                    {endShiftMutation.isPending ? 'Ending…' : 'End shift'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MLMyTripsPage;
