/**
 * MLCXODashboard - MaXHub Logistics CXO (CEO/CFO/ADMIN) dashboard.
 * Web-first layout with responsive breakpoints; mobile-friendly (touch, scroll, readable).
 * Uses CXO dashboard APIs: summary (Overview cards), order-areas, driver-earnings, driver-distance, route-history.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MLNavbar from '../components/MLNavbar';
import { useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import {
  useCxoDashboardSummary,
  useCxoOrderAreas,
  useCxoDriverEarnings,
  useCxoDriverDistance,
  useCxoRouteHistory,
} from '../../hooks/mlHooks/useCxoDashboard';
import {
  MdAssessment,
  MdMap,
  MdAttachMoney,
  MdStraighten,
  MdHistory,
} from 'react-icons/md';
import { Spin } from 'antd';

const PERIOD_OPTIONS = [
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
];

const SIDEBAR_OPTIONS = [
  { id: 'overview', label: 'Overview', icon: MdAssessment },
  { id: 'areas', label: 'Order areas', icon: MdMap },
  { id: 'earnings', label: 'Driver earnings', icon: MdAttachMoney },
  { id: 'distance', label: 'Driver distance', icon: MdStraighten },
  { id: 'routes', label: 'Route history', icon: MdHistory },
];

const formatCurrency = (n) => {
  const num = Number(n);
  if (Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const MLCXODashboard = () => {
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';
  const [days, setDays] = useState(30);
  const [selectedSection, setSelectedSection] = useState('overview');

  const params = { days };
  const summaryQuery = useCxoDashboardSummary(params);
  const areasQuery = useCxoOrderAreas({ ...params, limit: 10 });
  const earningsQuery = useCxoDriverEarnings(params);
  const distanceQuery = useCxoDriverDistance(params);
  const routeHistoryQuery = useCxoRouteHistory({ ...params, limit: 20 });

  const sidebarNav = (
    <ul className="space-y-0.5 p-2">
      {SIDEBAR_OPTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = selectedSection === id;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => setSelectedSection(id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors ${
                isActive ? 'text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={isActive ? { backgroundColor: accent } : {}}
            >
              <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
              </div>
              <span className="text-sm font-medium truncate">{label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <MLNavbar onSignInClick={() => {}} />
      {/* Fixed left sidebar — same layout as delivery executive CXO, light theme */}
      <aside className="hidden md:flex fixed left-0 top-14 sm:top-16 md:top-20 bottom-0 z-20 w-72 lg:w-80 flex-col bg-white border-r border-gray-200 shadow-sm">
        <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">Reports</h2>
          <p className="text-gray-500 text-xs mt-0.5">Select a report to view data</p>
        </div>
        <div className="flex-1 overflow-y-auto">{sidebarNav}</div>
      </aside>

      {/* Main content — offset by sidebar on desktop */}
      <main className="pt-20 sm:pt-24 md:pt-24 ml-0 md:ml-72 lg:ml-80 min-h-screen overflow-auto pb-24">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
            {/* Period selector only — no global title */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {PERIOD_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDays(Number(id))}
                  className={`min-h-[40px] sm:min-h-[44px] px-4 sm:px-5 rounded-xl text-sm sm:text-base font-medium transition-all ${days === Number(id) ? 'text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
                  style={days === Number(id) ? { backgroundColor: accent } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile: horizontal nav for section selection */}
            <div className="md:hidden overflow-x-auto pb-2 -mx-1">
              <div className="flex gap-2 min-w-max px-1">
                {SIDEBAR_OPTIONS.map(({ id, label, icon: Icon }) => {
                  const isActive = selectedSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedSection(id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${isActive ? 'text-white shadow' : 'bg-white text-gray-700 border border-gray-200'}`}
                      style={isActive ? { backgroundColor: accent } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content panel — selected section data */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              {selectedSection === 'overview' && (
                <div className="p-4 sm:p-5">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MdAssessment style={{ color: accent }} /> Overview
                  </h2>
                  {summaryQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {summaryQuery.isError && <p className="py-4 text-sm text-red-600">{summaryQuery.error?.response?.data?.message || summaryQuery.error?.message || 'Failed to load overview.'}</p>}
                  {!summaryQuery.isLoading && !summaryQuery.isError && (() => {
                    const s = summaryQuery.data?.summary ?? summaryQuery.data ?? {};
                    const cards = [
                      { label: 'Total earnings', value: formatCurrency(s.total_earnings) },
                      { label: 'Delivered orders', value: s.delivered_orders ?? 0 },
                      { label: 'Total orders', value: s.total_orders ?? 0 },
                      { label: 'Active drivers', value: s.active_drivers ?? 0 },
                      { label: 'Total km', value: s.total_kilometers ?? 0 },
                      { label: 'Avg earnings/day', value: formatCurrency(s.average_earnings_per_day) },
                    ];
                    return (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {cards.map(({ label, value }) => (
                          <div key={label} className="rounded-lg border border-gray-200 bg-gray-50/50 p-5 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
                            <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {selectedSection === 'areas' && (
                <div className="p-4 sm:p-5">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MdMap style={{ color: accent }} /> Order areas
                  </h2>
                  {areasQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {areasQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load order areas.</p>}
                  {!areasQuery.isLoading && !areasQuery.isError && (
                    <ul className="space-y-2">
                      {(areasQuery.data?.areas || []).slice(0, 10).map((area, i) => (
                        <li key={area.area_name || i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 gap-2">
                          <span className="font-medium text-gray-800 truncate min-w-0">{area.area_name || '—'}</span>
                          <span className="text-sm text-gray-600 flex-shrink-0">{area.total_orders ?? 0} orders · {area.unique_customers ?? 0} customers</span>
                        </li>
                      ))}
                      {(!areasQuery.data?.areas || areasQuery.data.areas.length === 0) && <p className="text-sm text-gray-500 py-4">No data for selected period.</p>}
                    </ul>
                  )}
                </div>
              )}

              {selectedSection === 'earnings' && (
                <div className="p-4 sm:p-5">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MdAttachMoney style={{ color: accent }} /> Driver earnings
                  </h2>
                  {earningsQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {earningsQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load driver earnings.</p>}
                  {!earningsQuery.isLoading && !earningsQuery.isError && (
                    <div className="space-y-4">
                      {earningsQuery.data?.summary && (
                        <div className="flex flex-wrap gap-3 text-sm pb-3 border-b border-gray-100">
                          <span className="font-semibold">Total: {formatCurrency(earningsQuery.data.summary.total_earnings)}</span>
                          <span className="text-gray-600">Trips: {earningsQuery.data.summary.total_trips ?? 0}</span>
                          {earningsQuery.data.summary.growth_pct != null && (
                            <span className="text-green-600">Growth: {Number(earningsQuery.data.summary.growth_pct).toFixed(1)}%</span>
                          )}
                        </div>
                      )}
                      <ul className="space-y-2">
                        {(earningsQuery.data?.drivers || []).map((d) => (
                          <li key={d.driver_id} className="flex justify-between items-center py-2 border-b border-gray-100 gap-2">
                            <span className="font-medium text-gray-800 truncate min-w-0">{d.driver_name || '—'}</span>
                            <span className="text-sm font-semibold flex-shrink-0" style={{ color: accent }}>{formatCurrency(d.total_earnings)} · {d.total_trips ?? 0} trips</span>
                          </li>
                        ))}
                      </ul>
                      {(!earningsQuery.data?.drivers || earningsQuery.data.drivers.length === 0) && !earningsQuery.data?.summary?.total_earnings && <p className="text-sm text-gray-500 py-4">No data for selected period.</p>}
                    </div>
                  )}
                </div>
              )}

              {selectedSection === 'distance' && (
                <div className="p-4 sm:p-5">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MdStraighten style={{ color: accent }} /> Driver distance
                  </h2>
                  {distanceQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {distanceQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load driver distance.</p>}
                  {!distanceQuery.isLoading && !distanceQuery.isError && (
                    <div className="space-y-4">
                      {distanceQuery.data?.summary && (
                        <div className="flex flex-wrap gap-3 text-sm pb-3 border-b border-gray-100">
                          <span className="font-semibold">Total: {distanceQuery.data.summary.total_kilometers ?? 0} km</span>
                          <span className="text-gray-600">Routes: {distanceQuery.data.summary.total_routes ?? 0}</span>
                        </div>
                      )}
                      <ul className="space-y-2">
                        {(distanceQuery.data?.drivers || []).map((d) => (
                          <li key={d.driver_id} className="flex justify-between items-center py-2 border-b border-gray-100 gap-2">
                            <span className="font-medium text-gray-800 truncate min-w-0">{d.driver_name || '—'}</span>
                            <span className="text-sm text-gray-600 flex-shrink-0">{d.total_kilometers ?? 0} km · {d.total_routes ?? 0} routes</span>
                          </li>
                        ))}
                      </ul>
                      {(!distanceQuery.data?.drivers || distanceQuery.data.drivers.length === 0) && !distanceQuery.data?.summary?.total_kilometers && <p className="text-sm text-gray-500 py-4">No data for selected period.</p>}
                    </div>
                  )}
                </div>
              )}

              {selectedSection === 'routes' && (
                <div className="p-4 sm:p-5 overflow-x-auto">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <MdHistory style={{ color: accent }} /> Route history
                  </h2>
                  {routeHistoryQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {routeHistoryQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load route history.</p>}
                  {!routeHistoryQuery.isLoading && !routeHistoryQuery.isError && (
                    <div className="min-w-[320px] sm:min-w-0">
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">
                        <span className="col-span-3">Driver</span>
                        <span className="col-span-2">Date</span>
                        <span className="col-span-1">Session</span>
                        <span className="col-span-1">Stops</span>
                        <span className="col-span-2">Distance</span>
                        <span className="col-span-2">Time</span>
                        <span className="col-span-1">Efficiency</span>
                      </div>
                      {(routeHistoryQuery.data?.routes || []).map((r) => (
                        <div key={r.route_id} className="flex flex-wrap sm:grid sm:grid-cols-12 items-center gap-2 sm:gap-2 py-3 border-b border-gray-100 last:border-0">
                          <div className="w-full sm:col-span-3 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{r.driver_name || '—'}</p>
                            <p className="text-xs text-gray-500 sm:hidden">{r.date} · {r.session || '—'} · {r.total_stops ?? 0} stops</p>
                          </div>
                          <div className="hidden sm:block sm:col-span-2 text-sm text-gray-700">{r.date}</div>
                          <div className="hidden sm:block sm:col-span-1 text-sm text-gray-700">{r.session || '—'}</div>
                          <div className="hidden sm:block sm:col-span-1 text-sm text-gray-700">{r.total_stops ?? 0}</div>
                          <div className="sm:col-span-2 text-sm sm:text-right">
                            <p className="font-medium text-gray-800">{r.actual_distance_km ?? 0} km</p>
                            <p className="text-xs text-gray-500 sm:hidden">{r.actual_time_hours != null ? `${r.actual_time_hours}h` : ''} {r.efficiency_score != null ? `· ${r.efficiency_score}%` : ''}</p>
                          </div>
                          <div className="hidden sm:block sm:col-span-2 text-sm text-gray-700">{r.actual_time_hours != null ? `${r.actual_time_hours}h` : '—'}</div>
                          <div className="hidden sm:block sm:col-span-1 text-sm text-gray-700">{r.efficiency_score != null ? `${r.efficiency_score}%` : '—'}</div>
                        </div>
                      ))}
                      {(!routeHistoryQuery.data?.routes || routeHistoryQuery.data.routes.length === 0) && <p className="text-sm text-gray-500 py-4">No routes for selected period.</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
        </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MLCXODashboard;
