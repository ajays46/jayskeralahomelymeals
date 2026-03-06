/**
 * MLMyTripsPage - MaXHub Logistics: list delivery partner trips with filters and map links.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdRestaurant, MdLocationOn, MdOpenInNew, MdFilterList } from 'react-icons/md';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useMlTripsList } from '../../hooks/mlHooks/useMlTripsList';

const PLATFORM_OPTIONS = [
  { id: null, label: 'All' },
  { id: 'swiggy', label: 'Swiggy' },
  { id: 'flipkart', label: 'Flipkart' },
  { id: 'amazon', label: 'Amazon' },
];

const STATUS_OPTIONS = [
  { id: null, label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'picked_up', label: 'Picked up' },
  { id: 'delivered', label: 'Delivered' },
];

const formatStatus = (s) => {
  if (!s) return '—';
  const t = String(s).toLowerCase().replace('_', ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const MLMyTripsPage = () => {
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';
  const [platform, setPlatform] = useState(null);
  const [status, setStatus] = useState(null);

  const { data: trips = [], isLoading, isError, error } = useMlTripsList({ platform, status });

  return (
    <div className="min-h-screen bg-gray-50">
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">My Trips</h1>
            <p className="text-gray-600 text-sm">View and navigate to pickup and delivery addresses.</p>
          </div>

          {/* Filters */}
          <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MdFilterList className="text-lg" style={{ color: accent }} />
              <span className="font-medium text-gray-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
                <select
                  value={platform ?? ''}
                  onChange={(e) => setPlatform(e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-offset-1"
                  style={{ ['--tw-ring-color']: accent }}
                >
                  {PLATFORM_OPTIONS.map((o) => (
                    <option key={o.id ?? 'all'} value={o.id ?? ''}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={status ?? ''}
                  onChange={(e) => setStatus(e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-offset-1"
                  style={{ ['--tw-ring-color']: accent }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.id ?? 'all'} value={o.id ?? ''}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Trip list */}
          {isLoading && (
            <div className="rounded-xl bg-white border border-gray-100 p-8 text-center text-gray-500">
              Loading trips…
            </div>
          )}
          {isError && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-700">
              {error?.message || 'Failed to load trips.'}
            </div>
          )}
          {!isLoading && !isError && trips.length === 0 && (
            <div className="rounded-xl bg-white border border-gray-100 p-8 text-center text-gray-500">
              No trips found. Add trips from the dashboard.
            </div>
          )}
          {!isLoading && !isError && trips.length > 0 && (
            <div className="space-y-3">
              {trips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="font-medium text-gray-900 capitalize">{trip.platform}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: trip.trip_status === 'delivered' ? '#dcfce7' : trip.trip_status === 'picked_up' ? '#fef3c7' : '#e5e7eb',
                        color: trip.trip_status === 'delivered' ? '#166534' : trip.trip_status === 'picked_up' ? '#92400e' : '#374151',
                      }}
                    >
                      {formatStatus(trip.trip_status)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    {trip.pickup_address?.google_maps_url && (
                      <a
                        href={trip.pickup_address.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-inherit hover:underline"
                        style={{ color: accent }}
                      >
                        <MdRestaurant className="flex-shrink-0" /> Navigate to restaurant
                        <MdOpenInNew className="w-3 h-3" />
                      </a>
                    )}
                    {trip.delivery_address?.google_maps_url && (
                      <a
                        href={trip.delivery_address.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-inherit hover:underline"
                        style={{ color: accent }}
                      >
                        <MdLocationOn className="flex-shrink-0" /> Navigate to customer
                        <MdOpenInNew className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <Link
                      to={`${base}/trips/${trip.id}`}
                      className="text-sm font-medium"
                      style={{ color: accent }}
                    >
                      View details →
                    </Link>
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
