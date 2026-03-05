import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMap } from 'react-icons/fi';
import { MdLocalShipping, MdPerson, MdClose } from 'react-icons/md';
import useAuthStore from '../stores/Zustand.store';
import { useCompanyBasePath, useTenant } from '../context/TenantContext';
import { useAllDeliveryManagersFromDb } from '../hooks/deliverymanager/useAllDeliveryManagersFromDb';
import { useManagerExecutiveHierarchy } from '../hooks/deliverymanager/useManagerExecutiveHierarchy';
import { useRouteMapDataByManager } from '../hooks/deliverymanager/useAIRouteOptimization';
import { Modal } from 'antd';
import CXORouteMapPreview from '../components/CXORouteMapPreview';
import AssistantChat from '../components/deliveryManager/AssistantChat';

const DAYS_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' }
];

/**
 * CXODeliveryManagersPage - CXO (CEO/CFO/ADMIN) view for Delivery Manager dashboard
 * Lists delivery managers; on row click fetches manager-executive hierarchy and shows
 * that manager's executives and performance (per FRONTEND_DELIVERY_MANAGER_ISOLATION_GUIDE §3b).
 */
const CXODeliveryManagersPage = () => {
  const navigate = useNavigate();
  const basePath = useCompanyBasePath() || '/jkhm';
  const tenant = useTenant();
  const { user, logout } = useAuthStore();
  const companyId = tenant?.companyId ?? user?.companyId ?? user?.company_id ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') : null);

  const [selectedManager, setSelectedManager] = useState(null);
  const [hierarchyFilters, setHierarchyFilters] = useState({
    days: '30',
    start_date: '',
    end_date: ''
  });
  // Route map filters per guide §3c: GET /api/route/map-data?start_date=&end_date=&manager_id=&session=&driver_name=
  const [routeMapFilters, setRouteMapFilters] = useState({
    start_date: '',
    end_date: '',
    session: '',
    driver_name: ''
  });
  const [routeMapApplied, setRouteMapApplied] = useState(null);
  const [showRouteMapPreview, setShowRouteMapPreview] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const {
    data: managersResponse,
    isLoading: managersLoading,
    error: managersError,
    refetch: refetchManagers
  } = useAllDeliveryManagersFromDb({ enabled: true });

  const hierarchyQueryParams = useMemo(() => {
    const p = {};
    if (hierarchyFilters.days) p.days = hierarchyFilters.days;
    if (hierarchyFilters.start_date) p.start_date = hierarchyFilters.start_date;
    if (hierarchyFilters.end_date) p.end_date = hierarchyFilters.end_date;
    return p;
  }, [hierarchyFilters]);

  const {
    data: hierarchyData,
    isLoading: hierarchyLoading,
    error: hierarchyError,
    refetch: refetchHierarchy
  } = useManagerExecutiveHierarchy({
    ...hierarchyQueryParams,
    enabled: !!selectedManager
  });

  // Route map by manager (Delivery Manager side): GET .../cxo/route/map-data-by-manager
  const routeMapParams = useMemo(() => {
    if (!selectedManager?.id || !routeMapApplied) return null;
    return {
      manager_id: selectedManager.id,
      start_date: routeMapApplied.start_date || undefined,
      end_date: routeMapApplied.end_date || undefined,
      session: routeMapApplied.session || undefined,
      driver_name: routeMapApplied.driver_name?.trim() || undefined
    };
  }, [selectedManager?.id, routeMapApplied]);

  const {
    data: routeMapData,
    isLoading: routeMapLoading,
    error: routeMapError,
    refetch: refetchRouteMap
  } = useRouteMapDataByManager(routeMapParams || {}, {
    enabled: !!(routeMapParams && routeMapParams.manager_id && routeMapParams.start_date && routeMapParams.end_date)
  });

  const managers = managersResponse?.data ?? [];
  const hierarchyManagers = hierarchyData?.managers ?? [];
  const period = hierarchyData?.period ?? {};

  const selectedManagerData = useMemo(() => {
    if (!selectedManager) return null;
    const matchById = hierarchyManagers.find(
      (m) => m.manager_id && String(m.manager_id) === String(selectedManager.id)
    );
    if (matchById) return matchById;
    const nameLower = (selectedManager.name ?? '').toLowerCase().trim();
    return hierarchyManagers.find((m) => (m.manager_name ?? '').toLowerCase().trim() === nameLower) || null;
  }, [selectedManager, hierarchyManagers]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const handleLogout = () => {
    logout();
    navigate(basePath);
  };

  const showLogoutConfirm = () => setShowLogoutModal(true);

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  const handleApplyFilters = (next) => {
    setHierarchyFilters((prev) => ({ ...prev, ...next }));
  };

  // Clear route map applied filters when switching manager
  React.useEffect(() => {
    setRouteMapApplied(null);
  }, [selectedManager?.id]);

  return (
    <>
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 sm:h-20 lg:h-24 bg-gray-800 border-b border-gray-700 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-8 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[calc(100%-2rem)]">
          <button
            onClick={() => navigate(basePath)}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            aria-label="Go back to home"
          >
            <FiArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <MdLocalShipping className="text-xl sm:text-2xl text-blue-500 flex-shrink-0" />
            <h1 className="text-sm sm:text-lg lg:text-xl font-bold truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
              Delivery Managers
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            onClick={showLogoutConfirm}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Left sidebar: fixed on md+; hidden on mobile (list shown in main instead) */}
      <aside className="hidden md:flex fixed left-0 top-16 sm:top-20 lg:top-24 bottom-0 z-30 w-72 lg:w-80 border-r border-gray-700 bg-gray-800 flex-col">
        <div className="px-4 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-sm font-semibold text-white">Delivery Managers</h2>
          <p className="text-gray-400 text-xs mt-0.5">Select a manager to view data</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
            {managersLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-blue-500" />
              </div>
            ) : managersError ? (
              <div className="py-6 text-center px-2">
                <p className="text-xs text-red-400">{managersError?.message || 'Failed to load.'}</p>
                <button
                  type="button"
                  onClick={() => refetchManagers()}
                  className="mt-2 inline-flex items-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-medium"
                >
                  Retry
                </button>
              </div>
            ) : !managers.length ? (
              <div className="text-center py-8 px-2">
                <MdPerson className="mx-auto h-10 w-10 text-gray-500" />
                <p className="mt-2 text-xs text-gray-400">No delivery managers</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {managers.map((mgr) => (
                  <li key={mgr.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedManager(mgr)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors ${selectedManager?.id === mgr.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-200'}`}
                    >
                      <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${selectedManager?.id === mgr.id ? 'bg-blue-500' : 'bg-gray-600'}`}>
                        <MdPerson className={selectedManager?.id === mgr.id ? 'text-white text-sm' : 'text-gray-300 text-sm'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{mgr.name ?? '—'}</div>
                        <div className={`text-xs truncate ${selectedManager?.id === mgr.id ? 'text-blue-100' : 'text-gray-400'}`}>{mgr.email ?? '—'}</div>
                        <span className={`inline-flex mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${(mgr.status || '').toUpperCase() === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {mgr.status ?? '—'}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
      </aside>

      {/* Main: full width on mobile (ml-0), offset by sidebar on md+ */}
      <main className="pt-16 sm:pt-20 lg:pt-24 ml-0 md:ml-72 lg:ml-80 min-h-screen overflow-auto">
          {!selectedManager ? (
            <>
              {/* Mobile: show managers list inline */}
              <div className="md:hidden px-3 py-4">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-white">Delivery Managers</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Select a manager to view data</p>
                </div>
                {managersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-blue-500" />
                  </div>
                ) : managersError ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-red-400">{managersError?.message || 'Failed to load.'}</p>
                    <button type="button" onClick={() => refetchManagers()} className="mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-medium">Retry</button>
                  </div>
                ) : !managers.length ? (
                  <div className="text-center py-8">
                    <MdPerson className="mx-auto h-10 w-10 text-gray-500" />
                    <p className="mt-2 text-xs text-gray-400">No delivery managers</p>
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {managers.map((mgr) => (
                      <li key={mgr.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedManager(mgr)}
                          className={`w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors ${selectedManager?.id === mgr.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-200'}`}
                        >
                          <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${selectedManager?.id === mgr.id ? 'bg-blue-500' : 'bg-gray-600'}`}>
                            <MdPerson className={selectedManager?.id === mgr.id ? 'text-white text-sm' : 'text-gray-300 text-sm'} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{mgr.name ?? '—'}</div>
                            <div className={`text-xs truncate ${selectedManager?.id === mgr.id ? 'text-blue-100' : 'text-gray-400'}`}>{mgr.email ?? '—'}</div>
                            <span className={`inline-flex mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded ${(mgr.status || '').toUpperCase() === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{mgr.status ?? '—'}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Desktop: empty state when sidebar is visible */}
              <div className="hidden md:flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
                <MdLocalShipping className="h-16 w-16 text-gray-600 mb-4" />
                <p className="text-gray-400 font-medium">Select a delivery manager</p>
                <p className="text-gray-500 text-sm mt-1">Choose a manager from the list to view performance and route data</p>
              </div>
            </>
          ) : (
            <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full">
              {/* Detail panel: selected manager's executives & performance (from hierarchy API) */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-700 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Mobile: Back to list button */}
                    <button
                      type="button"
                      onClick={() => setSelectedManager(null)}
                      className="md:hidden flex-shrink-0 p-2 -ml-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                      aria-label="Back to list"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                      Performance: {selectedManager.name ?? '—'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedManager(null)}
                    className="hidden md:block p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <MdClose className="w-5 h-5" />
                  </button>
                </div>

              {/* Filters: days or start_date / end_date (per guide §3b) */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-700 bg-gray-750/50">
                <p className="text-xs text-gray-400 mb-3">Period for performance data</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-full sm:min-w-[140px] sm:w-auto">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Last N days</label>
                    <select
                      value={hierarchyFilters.days}
                      onChange={(e) => handleApplyFilters({ days: e.target.value, start_date: '', end_date: '' })}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {DAYS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:min-w-[130px] sm:w-auto">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Start date</label>
                    <input
                      type="date"
                      value={hierarchyFilters.start_date}
                      onChange={(e) => handleApplyFilters({ start_date: e.target.value, days: '' })}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="w-full sm:min-w-[130px] sm:w-auto">
                    <label className="block text-xs font-medium text-gray-400 mb-1">End date</label>
                    <input
                      type="date"
                      value={hierarchyFilters.end_date}
                      onChange={(e) => handleApplyFilters({ end_date: e.target.value, days: '' })}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => refetchHierarchy()}
                    className="w-full sm:w-auto rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                {(period.start_date || period.days) && (
                  <p className="mt-2 text-xs text-gray-500">
                    Period: {period.start_date && period.end_date
                      ? `${period.start_date} – ${period.end_date}`
                      : period.days
                        ? `Last ${period.days} days`
                        : '—'}
                  </p>
                )}
              </div>

              <div className="p-4 sm:p-6">
                {hierarchyLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-600 border-t-blue-500" />
                  </div>
                ) : hierarchyError ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-red-400">{hierarchyError?.message || 'Failed to load performance data.'}</p>
                    <button
                      type="button"
                      onClick={() => refetchHierarchy()}
                      className="mt-3 inline-flex items-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : hierarchyData?.message && !selectedManagerData ? (
                  <p className="text-sm text-gray-400 py-6 text-center">{hierarchyData.message}</p>
                ) : selectedManagerData ? (
                  <div className="space-y-6">
                    {selectedManagerData.summary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg bg-gray-700 px-4 py-3">
                          <p className="text-xs text-gray-400">Total routes</p>
                          <p className="text-lg font-semibold text-white">{selectedManagerData.summary.total_routes ?? '—'}</p>
                        </div>
                        <div className="rounded-lg bg-gray-700 px-4 py-3">
                          <p className="text-xs text-gray-400">Avg efficiency</p>
                          <p className="text-lg font-semibold text-white">
                            {selectedManagerData.summary.average_efficiency_score != null
                              ? `${Number(selectedManagerData.summary.average_efficiency_score).toFixed(1)}%`
                              : '—'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-700 px-4 py-3">
                          <p className="text-xs text-gray-400">Executives</p>
                          <p className="text-lg font-semibold text-white">{selectedManagerData.total_executives ?? (selectedManagerData.executives?.length ?? 0)}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">Delivery executives</h3>
                      {selectedManagerData.executives?.length ? (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[320px]">
                            <thead className="bg-gray-700">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Driver</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Vehicle</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Routes</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Deliveries</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Efficiency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {selectedManagerData.executives.map((ex, idx) => {
                                const perf = ex.performance ?? {};
                                return (
                                  <tr key={ex.driver_id ?? idx} className="text-sm">
                                    <td className="px-3 py-3 text-white font-medium">{ex.driver_name ?? '—'}</td>
                                    <td className="px-3 py-3 text-gray-300">{ex.vehicle_number ?? '—'}</td>
                                    <td className="px-3 py-3 text-right text-gray-300">{ex.total_routes ?? '—'}</td>
                                    <td className="px-3 py-3 text-right text-gray-300">{ex.total_deliveries ?? '—'}</td>
                                    <td className="px-3 py-3 text-right text-white">
                                      {perf.average_efficiency_score != null
                                        ? `${Number(perf.average_efficiency_score).toFixed(1)}%`
                                        : '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-4">No executives in hierarchy for this period.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-6 text-center">No performance data for this manager in the selected period.</p>
                )}
              </div>

              {/* Route map (guide §3c): last section — view routes by date/session/driver */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-700 bg-gray-750/30">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                  <FiMap className="text-blue-400" />
                  Route map
                </h3>
                <p className="text-xs text-gray-400 mb-3">View routes created by this manager. Set date range and click Fetch routes.</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-full sm:min-w-[130px] sm:w-auto">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Start date</label>
                    <input
                      type="date"
                      value={routeMapFilters.start_date}
                      onChange={(e) => setRouteMapFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="w-full sm:min-w-[130px] sm:w-auto">
                    <label className="block text-xs font-medium text-gray-400 mb-1">End date</label>
                    <input
                      type="date"
                      value={routeMapFilters.end_date}
                      onChange={(e) => setRouteMapFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="w-full sm:min-w-[120px] sm:w-auto">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Session</label>
                    <select
                      value={routeMapFilters.session}
                      onChange={(e) => setRouteMapFilters((prev) => ({ ...prev, session: e.target.value }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      <option value="BREAKFAST">Breakfast</option>
                      <option value="LUNCH">Lunch</option>
                      <option value="DINNER">Dinner</option>
                    </select>
                  </div>
                  <div className="w-full sm:min-w-[140px] sm:w-auto">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Driver name (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Adharsh"
                      value={routeMapFilters.driver_name}
                      onChange={(e) => setRouteMapFilters((prev) => ({ ...prev, driver_name: e.target.value }))}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRouteMapApplied({ ...routeMapFilters })}
                    disabled={!routeMapFilters.start_date || !routeMapFilters.end_date}
                    className="w-full sm:w-auto rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition-colors"
                  >
                    Fetch routes
                  </button>
                </div>
                {routeMapApplied && routeMapFilters.start_date && routeMapFilters.end_date && (
                  <div className="mt-3">
                    {routeMapLoading && (
                      <p className="text-xs text-gray-400">Loading routes…</p>
                    )}
                    {routeMapError && (
                      <p className="text-xs text-red-400">{routeMapError.message}</p>
                    )}
                    {routeMapData && !routeMapLoading && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 text-xs sm:text-sm text-gray-300">
                        <span>Routes found: {Array.isArray(routeMapData.routes) ? routeMapData.routes.length : 0}</span>
                        <span className="hidden sm:inline">·</span>
                        <button
                          type="button"
                          onClick={() => setShowRouteMapPreview(true)}
                          className="text-teal-400 hover:text-teal-300 underline font-medium text-left sm:text-inherit"
                        >
                          View routes here
                        </button>
                        {selectedManager?.id && (
                          <>
                            <span className="hidden sm:inline">·</span>
                            <button
                              type="button"
                              onClick={() => {
                                const routes = Array.isArray(routeMapData.routes) ? routeMapData.routes : [];
                                const firstRoute = routes[0];
                                const date = firstRoute?.date || routeMapApplied?.start_date || routeMapApplied?.end_date || '';
                                const session = firstRoute?.session || routeMapApplied?.session || '';
                                const q = new URLSearchParams();
                                q.set('driver_name', routeMapApplied?.driver_name || '');
                                if (date) q.set('date', date);
                                if (session) q.set('session', session);
                                navigate(`${basePath}/delivery-executive?${q.toString()}`);
                              }}
                              className="text-teal-400 hover:text-teal-300 underline text-left sm:text-inherit"
                            >
                              Open in Delivery Executive
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
          )}
        </main>
    </div>

    <CXORouteMapPreview
      isOpen={showRouteMapPreview}
      onClose={() => setShowRouteMapPreview(false)}
      routeMapData={routeMapData}
      isLoading={routeMapLoading}
      error={routeMapError}
      appliedFilters={routeMapApplied || {}}
    />

    <Modal
      title="Logout"
      open={showLogoutModal}
      onOk={handleLogoutConfirm}
      onCancel={() => setShowLogoutModal(false)}
      okText="Yes, Logout"
      okType="danger"
      cancelText="Cancel"
      closable
      maskClosable
      zIndex={10000}
    >
      <p>Are you sure you want to logout? You will need to sign in again to access the dashboard.</p>
    </Modal>

    {companyId && user?.id && (
      <AssistantChat companyId={companyId} userId={user.id} />
    )}
    </>
  );
};

export default CXODeliveryManagersPage;
