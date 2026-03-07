/**
 * MLCXODashboard - MaXHub Logistics CXO (CEO/CFO/ADMIN) dashboard.
 * Web-first layout with responsive breakpoints; mobile-friendly (touch, scroll, readable).
 * Uses CXO dashboard APIs: summary, menu-demand, order-areas, driver-earnings, driver-distance, live-drivers, route-history.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MLNavbar from '../components/MLNavbar';
import { useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import {
  useCxoDashboardSummary,
  useCxoMenuDemand,
  useCxoOrderAreas,
  useCxoDriverEarnings,
  useCxoDriverDistance,
  useCxoLiveDrivers,
  useCxoRouteHistory,
} from '../../hooks/mlHooks/useCxoDashboard';
import {
  MdTrendingUp,
  MdLocalShipping,
  MdRestaurant,
  MdMap,
  MdAttachMoney,
  MdStraighten,
  MdDirectionsCar,
  MdHistory,
  MdExpandMore,
  MdExpandLess,
} from 'react-icons/md';
import { Spin } from 'antd';
import CxoMenuDemand from '../components/CxoMenuDemand';

const PERIOD_OPTIONS = [
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
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
  const [expandedSections, setExpandedSections] = useState({ summary: true, menu: true, areas: true, earnings: true, distance: true, live: true, routes: true });

  const params = { days };
  const summaryQuery = useCxoDashboardSummary(params);
  const menuQuery = useCxoMenuDemand({ ...params, limit: 10 });
  const areasQuery = useCxoOrderAreas({ ...params, limit: 10 });
  const earningsQuery = useCxoDriverEarnings(params);
  const distanceQuery = useCxoDriverDistance(params);
  const liveQuery = useCxoLiveDrivers();
  const routeHistoryQuery = useCxoRouteHistory({ ...params, limit: 20 });

  const toggleSection = (key) => setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

  const summary = summaryQuery.data?.summary || {};
  const growth = summaryQuery.data?.growth || {};
  const period = summaryQuery.data?.period || {};

  return (
    <div className="min-h-screen bg-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-20 sm:pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl sm:max-w-5xl lg:max-w-7xl xl:max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
          {/* Header: web-first title, mobile-friendly period toggle */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">CXO Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5">Executive overview: earnings, orders, drivers, routes.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
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
          </div>

          {/* Summary cards — full width, web: more columns */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection('summary')} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdTrendingUp style={{ color: accent }} /> Summary
              </h2>
              {expandedSections.summary ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
            </button>
            {expandedSections.summary && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100">
                {summaryQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                {summaryQuery.isError && <p className="py-4 text-sm text-red-600">{summaryQuery.error?.response?.data?.message || summaryQuery.error?.message || 'Failed to load summary.'}</p>}
                {!summaryQuery.isLoading && !summaryQuery.isError && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 pt-4">
                    <div className="rounded-xl bg-gray-50 p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500">Total earnings</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mt-0.5">{formatCurrency(summary.total_earnings)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500">Delivered orders</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mt-0.5">{summary.delivered_orders ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500">Total orders</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mt-0.5">{summary.total_orders ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500">Active drivers</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mt-0.5">{summary.active_drivers ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500">Total km</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mt-0.5">{summary.total_kilometers ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 sm:p-4 col-span-2 sm:col-span-1">
                      <p className="text-xs sm:text-sm text-gray-500">Avg earnings/day</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mt-0.5">{formatCurrency(summary.average_earnings_per_day)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Two-column grid on desktop: Menu demand + Order areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button type="button" onClick={() => toggleSection('menu')} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MdRestaurant style={{ color: accent }} /> Menu demand
                </h2>
                {expandedSections.menu ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
              </button>
              {expandedSections.menu && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 max-h-[320px] sm:max-h-[400px] overflow-y-auto">
                  {menuQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {menuQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load menu demand.</p>}
                  {!menuQuery.isLoading && !menuQuery.isError && (
                    <ul className="space-y-2 pt-4">
                      {(menuQuery.data?.items || []).slice(0, 10).map((item, i) => (
                        <li key={item.menu_item_id || i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 gap-2">
                          <span className="font-medium text-gray-800 truncate min-w-0">{item.menu_item_name || '—'}</span>
                          <span className="text-sm text-gray-600 flex-shrink-0">{item.total_quantity ?? 0} qty · {item.total_orders ?? 0} orders</span>
                        </li>
                      ))}
                      {(!menuQuery.data?.items || menuQuery.data.items.length === 0) && <p className="text-sm text-gray-500 py-4">No data for selected period.</p>}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button type="button" onClick={() => toggleSection('areas')} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MdMap style={{ color: accent }} /> Order areas
                </h2>
                {expandedSections.areas ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
              </button>
              {expandedSections.areas && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 max-h-[320px] sm:max-h-[400px] overflow-y-auto">
                  {areasQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {areasQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load order areas.</p>}
                  {!areasQuery.isLoading && !areasQuery.isError && (
                    <ul className="space-y-2 pt-4">
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
            </section>
          </div>

          {/* Two-column grid on desktop: Driver earnings + Driver distance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button type="button" onClick={() => toggleSection('earnings')} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MdAttachMoney style={{ color: accent }} /> Driver earnings
                </h2>
                {expandedSections.earnings ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
              </button>
              {expandedSections.earnings && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 max-h-[320px] sm:max-h-[400px] overflow-y-auto">
                  {earningsQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {earningsQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load driver earnings.</p>}
                  {!earningsQuery.isLoading && !earningsQuery.isError && (
                    <div className="pt-4 space-y-4">
                      {earningsQuery.data?.summary && (
                        <div className="flex flex-wrap gap-3 text-sm">
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
            </section>

            <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button type="button" onClick={() => toggleSection('distance')} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MdStraighten style={{ color: accent }} /> Driver distance
                </h2>
                {expandedSections.distance ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
              </button>
              {expandedSections.distance && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 max-h-[320px] sm:max-h-[400px] overflow-y-auto">
                  {distanceQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                  {distanceQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load driver distance.</p>}
                  {!distanceQuery.isLoading && !distanceQuery.isError && (
                    <div className="pt-4 space-y-4">
                      {distanceQuery.data?.summary && (
                        <div className="flex flex-wrap gap-3 text-sm">
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
            </section>
          </div>

          {/* Live drivers — full width */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection('live')} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdDirectionsCar style={{ color: accent }} /> Live drivers
              </h2>
              {expandedSections.live ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
            </button>
            {expandedSections.live && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100">
                {liveQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                {liveQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load live drivers.</p>}
                {!liveQuery.isLoading && !liveQuery.isError && (
                  <ul className="space-y-3 pt-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
                    {(liveQuery.data?.drivers || []).map((d) => (
                      <li key={d.driver_id} className="flex flex-wrap items-center justify-between gap-2 py-2 sm:py-3 px-3 sm:px-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{d.driver_name || '—'}</p>
                          <p className="text-xs text-gray-500 truncate">{d.vehicle_number || '—'} · {d.route_id ? 'Route active' : '—'}</p>
                        </div>
                        {d.location && (
                          <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
                            {d.location.latitude?.toFixed(4)}, {d.location.longitude?.toFixed(4)}
                          </span>
                        )}
                      </li>
                    ))}
                    {(!liveQuery.data?.drivers || liveQuery.data.drivers.length === 0) && <li className="col-span-full"><p className="text-sm text-gray-500 py-4">No live drivers.</p></li>}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Route history — full width, horizontal scroll on small screens */}
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => toggleSection('routes')} className="w-full flex items-center justify-between p-4 sm:p-5 text-left">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdHistory style={{ color: accent }} /> Route history
              </h2>
              {expandedSections.routes ? <MdExpandLess className="text-gray-500" /> : <MdExpandMore className="text-gray-500" />}
            </button>
            {expandedSections.routes && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 overflow-x-auto">
                {routeHistoryQuery.isLoading && <div className="py-8 flex justify-center"><Spin /></div>}
                {routeHistoryQuery.isError && <p className="py-4 text-sm text-red-600">Failed to load route history.</p>}
                {!routeHistoryQuery.isLoading && !routeHistoryQuery.isError && (
                  <div className="pt-4 min-w-[320px] sm:min-w-0">
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
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default MLCXODashboard;
