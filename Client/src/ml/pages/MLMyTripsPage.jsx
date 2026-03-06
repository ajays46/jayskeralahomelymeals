/**
 * MLMyTripsPage - MaXHub Logistics: Start route, show route response and stop cards, GPS tracking, end shift.
 * Stop cards: Mark stop reached (POST /api/journey/mark-stop) and Picked up/Delivered (PATCH /api/ml-trips/:trip_id).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdPlayArrow, MdRestaurant, MdLocationOn } from 'react-icons/md';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useStartRoute } from '../../hooks/mlHooks/useStartRoute';
import { useVehicleTracking } from '../../hooks/mlHooks/useVehicleTracking';
import { useEndShift } from '../../hooks/mlHooks/useEndShift';
import { useMarkStop } from '../../hooks/mlHooks/useMarkStop';
import { useUpdateMlTripStatus } from '../../hooks/mlHooks/useUpdateMlTripStatus';
import { showSuccessToast, showErrorToast } from '../utils/mlToast';

const LS_ROUTE_ID = 'ml_route_id';
const LS_ROUTE_STOPS = 'ml_route_stops';

const MLMyTripsPage = () => {
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [routeResponse, setRouteResponse] = useState(null);

  const savedRouteId = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem(LS_ROUTE_ID) : null) || '', []);
  const [routeId, setRouteId] = useState(savedRouteId);

  const [actioningStopKey, setActioningStopKey] = useState(null);

  const markStopMutation = useMarkStop();
  const updateTripStatusMutation = useUpdateMlTripStatus();

  const startRouteMutation = useStartRoute({
    onSuccess: (data) => {
      const rid = data?.route_id;
      const stops = data?.stops;
      if (rid) {
        localStorage.setItem(LS_ROUTE_ID, String(rid));
        setRouteId(String(rid));
        setTrackingEnabled(true);
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

  const vehicleTrackingMutation = useVehicleTracking({
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to send GPS.';
      showErrorToast(msg, 'Tracking error');
    },
  });

  const endShiftMutation = useEndShift({
    onSuccess: () => {
      setTrackingEnabled(false);
      setRouteId('');
      setRouteResponse(null);
      localStorage.removeItem(LS_ROUTE_ID);
      localStorage.removeItem(LS_ROUTE_STOPS);
      showSuccessToast('Shift ended. You are now offline.', 'Shift ended');
    },
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to end shift.';
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
    try {
      const loc = await getCurrentLocation();
      startRouteMutation.mutate({ platform: 'swiggy', current_location: loc });
    } catch {
      startRouteMutation.mutate({ platform: 'swiggy' });
    }
  };

  const handleEndShift = () => {
    if (endShiftMutation.isPending) return;
    endShiftMutation.mutate({ platform: 'swiggy' });
  };

  const stopsList = useMemo(() => {
    const fromResponse = routeResponse?.stops;
    if (Array.isArray(fromResponse) && fromResponse.length > 0) return fromResponse;
    if (typeof window === 'undefined') return [];
    try {
      const s = JSON.parse(localStorage.getItem(LS_ROUTE_STOPS) || '[]');
      return Array.isArray(s) ? s : [];
    } catch {
      return [];
    }
  }, [routeId, routeResponse]);

  const handleStopAction = async (stop) => {
    const key = stop.planned_stop_id;
    if (!routeId || !key) return;
    const tripStatus = stop.stop_type === 'pickup' ? 'picked_up' : 'delivered';
    const label = stop.stop_type === 'pickup' ? 'Picked up' : 'Delivered';
    setActioningStopKey(key);
    try {
      await markStopMutation.mutateAsync({ route_id: routeId, planned_stop_id: key });
      if (stop.trip_id) {
        await updateTripStatusMutation.mutateAsync({ tripId: stop.trip_id, trip_status: tripStatus });
      }
      showSuccessToast(`${label} recorded.`, label);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || `Failed to record ${label.toLowerCase()}.`;
      showErrorToast(msg, 'Error');
    } finally {
      setActioningStopKey(null);
    }
  };

  const sendTrackingPoint = async () => {
    try {
      const loc = await getCurrentLocation();
      const point = {
        latitude: loc.lat,
        longitude: loc.lng,
        timestamp: new Date().toISOString(),
      };
      vehicleTrackingMutation.mutate({
        route_id: routeId,
        tracking_points: [point],
      });
    } catch {
      // ignore if GPS not available
    }
  };

  useEffect(() => {
    if (!trackingEnabled) return undefined;
    if (!routeId) return undefined;

    sendTrackingPoint();
    const interval = setInterval(sendTrackingPoint, 90 * 1000); // every 1.5 min

    return () => clearInterval(interval);
  }, [trackingEnabled, routeId]);

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
                onClick={handleEndShift}
                disabled={endShiftMutation.isPending}
                className="min-h-[48px] flex-1 min-w-[100px] px-4 py-3 rounded-2xl text-base font-semibold border disabled:opacity-70 active:scale-[0.98] transition-transform"
                style={{ borderColor: '#ef4444', color: '#b91c1c' }}
              >
                {endShiftMutation.isPending ? 'Ending…' : 'End shift'}
              </button>
            </div>
          </div>

          {!routeId && !routeResponse && (
            <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center text-gray-500 text-sm">
              Tap &quot;Start route&quot; to create a route and see stops here.
            </div>
          )}

          {/* Stop cards: Picked up / Delivered */}
          {stopsList.length > 0 && routeId && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Stops</p>
              {stopsList
                .slice()
                .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
                .map((stop, i) => (
                  <motion.div
                    key={stop.planned_stop_id || `${stop.trip_id}-${stop.step}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-gray-500 text-sm">Stop {stop.step ?? i + 1}</span>
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
                    {stop.trip_id && (
                      <p className="text-xs text-gray-500 mb-2">
                        <Link to={`${base}/trips/${stop.trip_id}`} className="font-medium underline" style={{ color: accent }}>Trip details</Link>
                      </p>
                    )}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => handleStopAction(stop)}
                        disabled={!stop.planned_stop_id || actioningStopKey != null}
                        className="min-h-[44px] w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50 transition-transform"
                        style={{
                          backgroundColor: stop.stop_type === 'pickup' ? '#d97706' : accent,
                        }}
                      >
                        {actioningStopKey === stop.planned_stop_id ? '…' : stop.stop_type === 'pickup' ? 'Picked up' : 'Delivered'}
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MLMyTripsPage;
