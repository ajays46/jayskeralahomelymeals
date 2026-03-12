/**
 * MLTripDetailPage - MaXHub Logistics: single trip detail with map links.
 */
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdRestaurant, MdLocationOn, MdOpenInNew, MdArrowBack } from 'react-icons/md';
import { Spin } from 'antd';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useMlTripDetail } from '../../hooks/mlHooks/useMlTripDetail';

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
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';

  const { data: trip, isLoading, isError, error } = useMlTripDetail(tripId);

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
          <Link
            to={`${base}/trips`}
            className="inline-flex items-center gap-2 min-h-[44px] text-sm font-medium rounded-xl px-3 -ml-1 active:bg-gray-200/50 transition-colors"
            style={{ color: accent }}
          >
            <MdArrowBack className="text-lg" /> Back to My Trips
          </Link>

          {isLoading && (
            <div className="rounded-2xl bg-white border border-gray-100 p-12 flex justify-center shadow-md">
              <Spin size="large" />
            </div>
          )}
          {isError && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
              {error?.response?.data?.error?.message || error?.message || 'Trip not found.'}
            </div>
          )}
          {!isLoading && !isError && trip && (
            <>
              <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h1 className="text-lg font-bold text-gray-900 capitalize">{trip.platform} Trip</h1>
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
                    <p className="font-semibold text-gray-900">{formatCurrency(trip.order_amount ?? trip.orderAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Your payment</span>
                    <p className="font-semibold" style={{ color: accent }}>{formatCurrency(trip.partner_payment ?? trip.partnerPayment)}</p>
                  </div>
                </div>
              </div>

              {/* Pickup */}
              <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md">
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
              <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-md">
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
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MLTripDetailPage;
