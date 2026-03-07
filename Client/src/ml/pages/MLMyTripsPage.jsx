/**
 * MLMyTripsPage - MaXHub Logistics: Start route, show route response and stop cards, GPS tracking, end shift.
 * Stop cards: Mark stop reached (POST /api/journey/mark-stop) and Picked up/Delivered (PATCH /api/ml-trips/:trip_id).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPlayArrow, MdRestaurant, MdLocationOn, MdCheckCircle, MdPowerSettingsNew } from 'react-icons/md';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useStartRoute } from '../../hooks/mlHooks/useStartRoute';
import { useVehicleTracking } from '../../hooks/mlHooks/useVehicleTracking';
import { useEndShift } from '../../hooks/mlHooks/useEndShift';
import { useMarkStop } from '../../hooks/mlHooks/useMarkStop';
import { useUpdateMlTripStatus } from '../../hooks/mlHooks/useUpdateMlTripStatus';
import useMLDeliveryPartnerStore from '../../stores/MLDeliveryPartner.store.js';
import { showSuccessToast, showErrorToast } from '../utils/mlToast';

const LS_ROUTE_ID = 'ml_route_id';
const LS_ROUTE_STOPS = 'ml_route_stops';

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

  const vehicleTrackingMutation = useVehicleTracking({
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to send GPS.';
      showErrorToast(msg, 'Tracking error');
    },
  });

  const endShiftMutation = useEndShift({
    onSuccess: () => {
      clearAll();
      setTrackingEnabled(false);
      setRouteId('');
      setRouteResponse(null);
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

  const handleEndShiftClick = () => setShowEndShiftConfirm(true);

  const handleEndShiftConfirm = () => {
    if (endShiftMutation.isPending) return;
    setShowEndShiftConfirm(false);
    endShiftMutation.mutate({ platform: 'swiggy' });
  };

  const stopsList = useMemo(() => {
    const fromResponse = routeResponse?.stops;
    if (Array.isArray(fromResponse) && fromResponse.length > 0) return fromResponse;
    if (Array.isArray(storeStops) && storeStops.length > 0) return storeStops;
    if (typeof window === 'undefined') return [];
    try {
      const s = JSON.parse(localStorage.getItem(LS_ROUTE_STOPS) || '[]');
      return Array.isArray(s) ? s : [];
    } catch {
      return [];
    }
  }, [effectiveRouteId, routeResponse, storeStops]);

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

  const sendTrackingPoint = async () => {
    try {
      const loc = await getCurrentLocation();
      const point = {
        latitude: loc.lat,
        longitude: loc.lng,
        timestamp: new Date().toISOString(),
      };
      vehicleTrackingMutation.mutate({
        route_id: effectiveRouteId,
        tracking_points: [point],
      });
    } catch {
      // ignore if GPS not available
    }
  };

  useEffect(() => {
    if (effectiveRouteId && !trackingEnabled) setTrackingEnabled(true);
  }, [effectiveRouteId]);

  useEffect(() => {
    if (!trackingEnabled) return undefined;
    if (!effectiveRouteId) return undefined;

    sendTrackingPoint();
    const interval = setInterval(sendTrackingPoint, 90 * 1000); // every 1.5 min

    return () => clearInterval(interval);
  }, [trackingEnabled, effectiveRouteId]);

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

          {/* Route started - visible when route is active (persisted in store) */}
          {effectiveRouteId && (
            <div
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}
            >
              <MdCheckCircle className="text-2xl flex-shrink-0" style={{ color: '#059669' }} />
              <div>
                <p className="font-semibold text-gray-900">Route started</p>
                <p className="text-sm text-gray-600">GPS tracking is active. Mark stops below as Picked up or Delivered.</p>
              </div>
            </div>
          )}

          {!effectiveRouteId && !routeResponse && (
            <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center text-gray-500 text-sm">
              Tap &quot;Start route&quot; to create a route and see stops here.
            </div>
          )}

          {/* Stop cards: Picked up / Delivered (persisted in store) */}
          {stopsList.length > 0 && effectiveRouteId && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-800">Stops</p>
              {stopsList
                .slice()
                .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
                .map((stop, i) => {
                  const persistedStatus = stop.trip_id ? (tripStatusByTripId[stop.trip_id] || '').toLowerCase() : '';
                  const isPickup = stop.stop_type === 'pickup';
                  // Trip has one status; delivered implies pickup was done. So pickup stop is done when picked_up OR delivered.
                  const isPickedUp = isPickup && (persistedStatus === 'picked_up' || persistedStatus === 'delivered');
                  const isDelivered = !isPickup && persistedStatus === 'delivered';
                  const alreadyDone = isPickedUp || isDelivered;
                  const label = isPickedUp ? 'Picked up' : isDelivered ? 'Delivered' : isPickup ? 'Picked up' : 'Delivered';
                  return (
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
                            {actioningStopKey === stop.planned_stop_id ? '…' : label}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </motion.div>
      </main>

      {/* End shift confirmation - mobile-style popup */}
      <AnimatePresence>
        {showEndShiftConfirm && (
          <motion.div
            key="endShiftConfirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
