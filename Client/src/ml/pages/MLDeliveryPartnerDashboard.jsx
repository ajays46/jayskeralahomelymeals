/**
 * MLDeliveryPartnerDashboard - MaXHub Logistics Delivery Partner dashboard.
 * Shows trips done (today / this week / total), revenue earned, recent trips. Filter by platform (All, Swiggy, Flipkart, Amazon).
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useMlPartnerDashboard } from '../../hooks/mlHooks/useMlPartnerDashboard';
import { MdAddCircle, MdLocalShipping, MdToday, MdDateRange, MdTrendingUp } from 'react-icons/md';

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
  <div className="rounded-xl bg-white border border-gray-100 p-4 sm:p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${accent}18`, color: accent }}>
        <Icon />
      </div>
      <span className="text-sm font-medium text-gray-600">{title}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{trips} trip{trips !== 1 ? 's' : ''}</p>
    <p className="text-sm font-semibold mt-1" style={{ color: accent }}>{formatCurrency(revenue)} earned</p>
  </div>
);

const MLDeliveryPartnerDashboard = () => {
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';
  const [platformFilter, setPlatformFilter] = useState(null);

  const { data: stats, isLoading, isError, error } = useMlPartnerDashboard(platformFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Delivery Partner Dashboard</h1>
            <p className="text-gray-600">Welcome to MaXHub Logistics. View your stats and add delivery trips.</p>
          </div>

          {/* Add Trip CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 sm:p-8 flex items-center justify-center"
          >
            <Link
              to={`${base}/trips/add`}
              className="w-full sm:w-auto py-3 px-6 rounded-xl font-semibold text-white shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300"
              style={{ backgroundColor: accent }}
            >
              <MdAddCircle className="text-xl" /> Add Trip
            </Link>
          </motion.div>

          {/* Platform filter */}
          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Show data by platform</h2>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORM_FILTERS.map(({ id, label }) => {
                const isActive = platformFilter === id;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPlatformFilter(id)}
                    className={`min-w-0 py-2.5 px-2 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 truncate ${
                      isActive ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center text-gray-500">
              Loading your stats…
            </div>
          )}
          {isError && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
              {error?.response?.data?.message || error?.message || 'Failed to load dashboard.'}
            </div>
          )}
          {!isLoading && !isError && stats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 sm:p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MdLocalShipping className="text-gray-500" /> Recent trips
                </h2>
                {stats.recentTrips && stats.recentTrips.length > 0 ? (
                  <ul className="space-y-2 max-h-72 overflow-y-auto">
                    {stats.recentTrips.map((trip) => (
                      <li
                        key={trip.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 rounded-xl bg-gray-50 border border-gray-100"
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
