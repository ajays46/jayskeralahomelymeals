/**
 * MLDeliveryPartnerDashboard - MaXHub Logistics Delivery Partner dashboard.
 * Shows trips done (today / this week / total), revenue earned, recent trips. Filter by platform (All, Swiggy, Flipkart, Amazon).
 * Start shift: Swiggy-style swipe button; on complete → navigate to Add Trips.
 */
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useMlPartnerDashboard } from '../../hooks/mlHooks/useMlPartnerDashboard';
import { useStartShift } from '../../hooks/mlHooks/useStartShift';
import { useVehicles } from '../../hooks/mlHooks/useVehicles';
import { useShiftStatus, SHIFT_STATUS_KEY } from '../../hooks/mlHooks/useShiftStatus';
import useMLDeliveryPartnerStore from '../../stores/MLDeliveryPartner.store.js';
import { showSuccessToast, showErrorToast } from '../utils/mlToast';
import { MdPlayArrow, MdLocalShipping, MdToday, MdDateRange, MdTrendingUp, MdCheckCircle } from 'react-icons/md';

const SWIPE_THRESHOLD = 0.85; // 85% to trigger

/** Swiggy-style swipe to confirm: drag thumb right to end to trigger onSwipeComplete. */
const SwipeToStartButton = ({ onSwipeComplete, disabled, accent, isPending }) => {
  const trackRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const startXRef = useRef(0);
  const maxXRef = useRef(0);

  const getMaxX = useCallback(() => {
    if (!trackRef.current) return 0;
    const track = trackRef.current;
    const thumbWidth = 56;
    return Math.max(0, track.offsetWidth - thumbWidth - 8);
  }, []);

  const handleStart = useCallback((clientX) => {
    if (disabled || isPending || triggered) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    startXRef.current = clientX - dragX;
    maxXRef.current = getMaxX();
    setIsDragging(true);
  }, [disabled, isPending, triggered, dragX, getMaxX]);

  const handleMove = useCallback((clientX) => {
    if (!isDragging || disabled || triggered) return;
    let x = clientX - startXRef.current;
    x = Math.max(0, Math.min(x, maxXRef.current));
    setDragX(x);
    if (x >= maxXRef.current * SWIPE_THRESHOLD) {
      setTriggered(true);
      setIsDragging(false);
      onSwipeComplete();
    }
  }, [isDragging, disabled, triggered, onSwipeComplete]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!triggered) setDragX(0);
  }, [isDragging, triggered]);

  React.useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleEnd();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const maxX = getMaxX();
  const isComplete = triggered || isPending;

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        role="button"
        tabIndex={0}
        aria-label="Swipe right to start shift"
        onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX); }}
        onTouchStart={(e) => { e.preventDefault(); handleStart(e.touches[0].clientX); }}
        className="relative w-full min-h-[56px] rounded-full overflow-hidden select-none touch-none flex items-center"
        style={{ backgroundColor: isComplete ? accent : '#e5e7eb' }}
      >
        <motion.div
          className="absolute left-1 top-1 bottom-1 w-14 rounded-full flex items-center justify-center shadow-md z-10"
          style={{
            backgroundColor: isComplete ? '#fff' : '#f9fafb',
            color: accent,
          }}
          animate={{ x: isPending ? maxX : dragX }}
          transition={isDragging ? { type: 'tween', duration: 0 } : { type: 'spring', stiffness: 400, damping: 35 }}
        >
          {isPending ? (
            <span className="text-lg font-bold">…</span>
          ) : (
            <MdPlayArrow className="text-2xl" />
          )}
        </motion.div>
        <div className="flex-1 flex items-center justify-center pointer-events-none min-h-[56px]">
          <span
            className="font-semibold text-base"
            style={{ color: isComplete ? '#fff' : '#6b7280' }}
          >
            {isPending ? 'Starting…' : triggered ? 'Started!' : 'Swipe to start shift'}
          </span>
        </div>
      </div>
    </div>
  );
};

const PLATFORM_FILTERS = [
  { id: null, label: 'All' },
  { id: 'swiggy', label: 'Swiggy' },
  { id: 'flipkart', label: 'Flipkart' },
  { id: 'amazon', label: 'Amazon' },
];

const formatCurrency = (n) => {
  const num = Number(n);
  if (Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const StatCard = ({ title, trips, revenue, icon: Icon, accent }) => (
  <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}20`, color: accent }}>
        <Icon className="text-lg" />
      </div>
      <span className="text-sm font-medium text-gray-600">{title}</span>
    </div>
    <p className="text-xl font-bold text-gray-900">{trips} trip{trips !== 1 ? 's' : ''}</p>
    <p className="text-sm font-semibold mt-1" style={{ color: accent }}>{formatCurrency(revenue)} earned</p>
  </div>
);

const MLDeliveryPartnerDashboard = () => {
  const base = useCompanyBasePath();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setInShift = useMLDeliveryPartnerStore((s) => s.setInShift);
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';
  const [platformFilter, setPlatformFilter] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const { data: stats, isLoading, isError, error } = useMlPartnerDashboard(platformFilter);
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { inShift, isLoading: shiftStatusLoading } = useShiftStatus();
  const startShiftMutation = useStartShift({
    onSuccess: () => {
      setInShift(true);
      queryClient.invalidateQueries({ queryKey: SHIFT_STATUS_KEY });
      showSuccessToast('Shift started. You are now online.', 'Shift started');
      navigate(`${base}/trips/add`);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Failed to start shift.';
      showErrorToast(msg, 'Error');
    },
  });

  const handleStartShift = () => {
    if (startShiftMutation.isPending) return;
    if (!selectedVehicleId?.trim()) {
      showErrorToast('Please select a vehicle before starting your shift.', 'Vehicle required');
      return;
    }
    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const vehicleNumber = selectedVehicle?.registration_number || selectedVehicle?.model || null;
    if (!vehicleNumber?.trim()) {
      showErrorToast('Selected vehicle has no registration number.', 'Vehicle required');
      return;
    }
    const selectedPlatform = platformFilter || 'swiggy';
    const payload = { platform: selectedPlatform, vehicle_number: vehicleNumber.trim() };
    if (!navigator.geolocation) {
      startShiftMutation.mutate(payload);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startShiftMutation.mutate({
          ...payload,
          current_location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      () => {
        startShiftMutation.mutate(payload);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

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
          <div className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
              <p className="text-sm text-gray-600">View stats and start your shift.</p>
            </div>
            {!inShift && (
              <div className="flex-shrink-0">
                <select
                  id="vehicle-select"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  disabled={vehiclesLoading}
                  title="Select vehicle"
                  className="min-h-[34px] w-[120px] sm:w-[130px] pl-2 pr-7 py-1 rounded-lg border border-gray-200 bg-white text-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 truncate"
                  style={{ borderColor: selectedVehicleId ? undefined : '#e5e7eb' }}
                >
                  <option value="">Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number || v.model || v.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Start Shift CTA or You're online - Zustand store + API */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl bg-white shadow-md border border-gray-100 p-5 sm:p-6"
          >
            {shiftStatusLoading ? (
              <p className="text-sm text-gray-500">Checking shift status…</p>
            ) : inShift ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <MdCheckCircle className="text-2xl flex-shrink-0" style={{ color: '#16a34a' }} />
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-0.5">You're online</h2>
                    <p className="text-sm text-gray-600">Go to My Trips to start a route or add trips.</p>
                  </div>
                </div>
                <Link
                  to={`${base}/trips`}
                  className="min-h-[48px] py-3 px-5 rounded-2xl font-semibold text-white shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-base"
                  style={{ backgroundColor: accent }}
                >
                  <MdLocalShipping className="text-xl flex-shrink-0" />
                  Go to My Trips
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-0.5">Start your shift</h2>
                <p className="text-sm text-gray-600">
                  Swipe right to go online, then you’ll be taken to add trips.
                </p>
              </div>
                <SwipeToStartButton
                  onSwipeComplete={handleStartShift}
                  disabled={!selectedVehicleId?.trim()}
                  accent={accent}
                  isPending={startShiftMutation.isPending}
                />
              </div>
            )}
          </motion.div>

          {/* Platform filter */}
          <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">By platform</h2>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORM_FILTERS.map(({ id, label }) => {
                const isActive = platformFilter === id;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPlatformFilter(id)}
                    className={`min-h-[44px] min-w-0 py-2.5 px-2 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 truncate active:scale-[0.98] ${
                      isActive ? 'text-white shadow' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                    }`}
                    style={isActive ? { backgroundColor: accent } : {}}
                    title={label}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          {isLoading && (
            <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center text-gray-500 text-sm">
              Loading…
            </div>
          )}
          {isError && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
              {error?.response?.data?.message || error?.message || 'Failed to load dashboard.'}
            </div>
          )}
          {!isLoading && !isError && stats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  title="Today"
                  trips={stats.tripsToday ?? 0}
                  revenue={stats.revenueToday ?? 0}
                  icon={MdToday}
                  accent={accent}
                />
                <StatCard
                  title="This week"
                  trips={stats.tripsThisWeek ?? 0}
                  revenue={stats.revenueThisWeek ?? 0}
                  icon={MdDateRange}
                  accent={accent}
                />
                <StatCard
                  title="All time"
                  trips={stats.tripsTotal ?? 0}
                  revenue={stats.revenueTotal ?? 0}
                  icon={MdTrendingUp}
                  accent={accent}
                />
              </div>

              {/* Recent trips */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="rounded-2xl bg-white shadow-md border border-gray-100 p-4 sm:p-5"
              >
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MdLocalShipping className="text-gray-500" /> Recent trips
                </h2>
                {stats.recentTrips && stats.recentTrips.length > 0 ? (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.recentTrips.map((trip) => (
                      <li
                        key={trip.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 rounded-xl bg-gray-50 border border-gray-100 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 capitalize">{trip.platform}</span>
                          <span className="text-sm text-gray-500">{formatDateTime(trip.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">Order: {formatCurrency(trip.orderAmount)}</span>
                          <span className="font-semibold" style={{ color: accent }}>Earned: {formatCurrency(trip.partnerPayment)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm py-4">No trips yet. Add your first trip above.</p>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MLDeliveryPartnerDashboard;
