/**
 * MLTripDetailPage - MaXHub Logistics: single trip detail with map links and status actions (Picked up / Delivered).
 */
import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdRestaurant, MdLocationOn, MdOpenInNew, MdArrowBack } from 'react-icons/md';
import { Button, Spin } from 'antd';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useMlTripDetail } from '../../hooks/mlHooks/useMlTripDetail';
import { useUpdateMlTripStatus } from '../../hooks/mlHooks/useUpdateMlTripStatus';

const formatStatus = (s) => {
  if (!s) return '—';
  const t = String(s).toLowerCase().replace('_', ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const formatCurrency = (n) => {
  const num = Number(n);
  if (Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MLTripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';

  const { data: trip, isLoading, isError, error, refetch } = useMlTripDetail(tripId);
  const updateStatus = useUpdateMlTripStatus({
    onSuccess: () => refetch(),
  });

  const canMarkPickedUp = trip?.trip_status === 'pending';
  const canMarkDelivered = trip?.trip_status === 'picked_up' || trip?.trip_status === 'pending';

  const handlePickedUp = () => {
    if (!tripId) return;
    updateStatus.mutate({ tripId, trip_status: 'picked_up' });
  };

  const handleDelivered = () => {
    if (!tripId) return;
    updateStatus.mutate({ tripId, trip_status: 'delivered' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Link to={`${base}/trips`} className="inline-flex items-center gap-2 text-sm font-medium mb-2" style={{ color: accent }}>
            <MdArrowBack /> Back to My Trips
          </Link>

          {isLoading && (
            <div className="rounded-xl bg-white border border-gray-100 p-12 flex justify-center">
              <Spin size="large" />
            </div>
          )}
          {isError && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-700">
              {error?.message || 'Trip not found.'}
            </div>
          )}
          {!isLoading && !isError && trip && (
            <>
              <div className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h1 className="text-xl font-bold text-gray-900 capitalize">{trip.platform} Trip</h1>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: trip.trip_status === 'delivered' ? '#dcfce7' : trip.trip_status === 'picked_up' ? '#fef3c7' : '#e5e7eb',
                      color: trip.trip_status === 'delivered' ? '#166534' : trip.trip_status === 'picked_up' ? '#92400e' : '#374151',
                    }}
                  >
                    {formatStatus(trip.trip_status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Order amount</span>
                    <p className="font-semibold text-gray-900">{formatCurrency(trip.orderAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Your payment</span>
                    <p className="font-semibold" style={{ color: accent }}>{formatCurrency(trip.partnerPayment)}</p>
                  </div>
                </div>
              </div>

              {/* Pickup */}
              <div className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MdRestaurant style={{ color: accent }} /> Pickup
                </h2>
                {trip.pickup_address?.google_maps_url ? (
                  <a
                    href={trip.pickup_address.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium"
                    style={{ color: accent }}
                  >
                    Open in Maps <MdOpenInNew className="w-4 h-4" />
                  </a>
                ) : (
                  <p className="text-gray-600 text-sm">
                    {[trip.pickup_address?.street, trip.pickup_address?.city, trip.pickup_address?.pincode].filter(Boolean).join(', ') || 'No address'}
                  </p>
                )}
              </div>

              {/* Delivery */}
              <div className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MdLocationOn style={{ color: accent }} /> Delivery
                </h2>
                {trip.delivery_address?.google_maps_url ? (
                  <a
                    href={trip.delivery_address.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium"
                    style={{ color: accent }}
                  >
                    Open in Maps <MdOpenInNew className="w-4 h-4" />
                  </a>
                ) : (
                  <p className="text-gray-600 text-sm">
                    {[trip.delivery_address?.street, trip.delivery_address?.city, trip.delivery_address?.pincode].filter(Boolean).join(', ') || 'No address'}
                  </p>
                )}
              </div>

              {/* Status actions */}
              <div className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm space-y-3">
                <h2 className="text-sm font-semibold text-gray-700">Update status</h2>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="primary"
                    onClick={handlePickedUp}
                    disabled={!canMarkPickedUp || updateStatus.isPending}
                    loading={updateStatus.isPending}
                    style={{ backgroundColor: canMarkPickedUp ? accent : undefined, borderColor: accent }}
                  >
                    Picked up
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleDelivered}
                    disabled={!canMarkDelivered || updateStatus.isPending}
                    loading={updateStatus.isPending}
                    style={{ backgroundColor: trip?.trip_status === 'delivered' ? undefined : accent, borderColor: accent }}
                  >
                    Delivered
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MLTripDetailPage;
