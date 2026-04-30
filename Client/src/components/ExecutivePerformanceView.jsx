import React, { useState, useMemo } from 'react';
import { MdTrendingUp, MdTrendingDown, MdRemove, MdLocalShipping, MdPerson } from 'react-icons/md';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { SkeletonLoading } from './Skeleton';
import { useExecutivePerformance } from '../hooks/deliverymanager/useAIRouteOptimization';

const CHART_COLORS = ['#0d9488', '#f97316', '#6366f1', '#ec4899', '#14b8a6', '#f59e0b'];

const DAYS_OPTIONS = [
  { value: '', label: 'Custom date range' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' }
];

const SESSION_OPTIONS = [
  { value: '', label: 'All Sessions' },
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' }
];

/**
 * ExecutivePerformanceView - CXO view of all delivery executives' performance
 * Uses /api/executive/performance with optional filters: start_date, end_date, days, session, min_routes, driver_name
 */
const ExecutivePerformanceView = ({ enabled = true, onSelectExecutiveDrillDown, onViewRoutesFromSummary }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [filterForm, setFilterForm] = useState({
    start_date: '',
    end_date: '',
    days: '30',
    session: '',
    min_routes: '1',
    driver_name: ''
  });
  const [appliedFilters, setAppliedFilters] = useState(() => ({}));

  const filtersForApi = useMemo(() => {
    const f = { ...appliedFilters };
    if (f.days !== undefined && f.days !== null && f.days !== '') f.days = Number(f.days);
    if (f.min_routes !== undefined && f.min_routes !== null && f.min_routes !== '') f.min_routes = Number(f.min_routes);
    return f;
  }, [appliedFilters]);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useExecutivePerformance({
    filters: filtersForApi,
    enabled
  });

  const executives = data?.executives ?? [];
  const barChartData = useMemo(() => {
    return executives.map((ex) => {
      const perf = ex.performance ?? {};
      const metrics = ex.metrics ?? {};
      const shortName = (ex.driver_name || '—').length > 12 ? `${(ex.driver_name || '').slice(0, 10)}…` : (ex.driver_name || '—');
      return {
        name: shortName,
        fullName: ex.driver_name ?? '—',
        efficiency: perf.average_efficiency_score != null ? Number(perf.average_efficiency_score) : 0,
        onTimePct: perf.on_time_percentage != null ? Number(perf.on_time_percentage) : 0,
        deliveries: ex.total_deliveries ?? 0,
        routes: ex.total_routes ?? 0,
        distanceKm: metrics.actual_total_distance_km != null ? Number(metrics.actual_total_distance_km) : 0,
        timeSavedHrs: metrics.time_saved_hours != null ? Number(metrics.time_saved_hours) : 0
      };
    });
  }, [executives]);

  const pieChartData = useMemo(() => {
    const total = executives.reduce((acc, ex) => acc + (ex.total_deliveries ?? 0), 0);
    if (total === 0) return [];
    return executives.map((ex, i) => ({
      name: (ex.driver_name || '—').length > 10 ? `${(ex.driver_name || '').slice(0, 8)}…` : (ex.driver_name || '—'),
      value: ex.total_deliveries ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length]
    })).filter((d) => d.value > 0);
  }, [executives]);

  const handleGo = () => {
    const next = {};
    if (filterForm.start_date) next.start_date = filterForm.start_date;
    if (filterForm.end_date) next.end_date = filterForm.end_date;
    if (filterForm.days !== '' && filterForm.days != null) next.days = filterForm.days;
    if (filterForm.session) next.session = filterForm.session;
    if (filterForm.min_routes !== '' && filterForm.min_routes != null) next.min_routes = filterForm.min_routes;
    if (filterForm.driver_name?.trim()) next.driver_name = filterForm.driver_name.trim();
    setAppliedFilters(next);
  };

  const handleClear = () => {
    setFilterForm({
      start_date: '',
      end_date: '',
      days: '30',
      session: '',
      min_routes: '1',
      driver_name: ''
    });
    setAppliedFilters({});
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <SkeletonLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-6">
        <p className="text-sm font-medium text-red-700">Error loading performance data: {error.message}</p>
        {refetch && (
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-sm font-medium text-red-800 underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const summary = data?.summary ?? {};
  const period = data?.period ?? {};

  const getTrendIcon = (trend) => {
    if (!trend) return <MdRemove className="h-4 w-4 text-gray-400" />;
    const t = (trend.efficiency_trend || '').toLowerCase();
    if (t === 'up' || t === 'improving') return <MdTrendingUp className="h-4 w-4 text-green-600" />;
    if (t === 'down' || t === 'declining') return <MdTrendingDown className="h-4 w-4 text-red-600" />;
    return <MdRemove className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>
          <p className="mt-1 text-xs text-gray-500">Filter by date range, session, or minimum routes. Click Go to apply.</p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last N days</label>
              <select
                value={filterForm.days}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, days: e.target.value, start_date: '', end_date: '' }))}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                {DAYS_OPTIONS.map((o) => (
                  <option key={o.value || 'none'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                value={filterForm.start_date}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, start_date: e.target.value }))}
                disabled={filterForm.days !== ''}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                value={filterForm.end_date}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, end_date: e.target.value }))}
                disabled={filterForm.days !== ''}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <select
                value={filterForm.session}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, session: e.target.value }))}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                {SESSION_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min routes</label>
              <input
                type="number"
                min={1}
                value={filterForm.min_routes}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, min_routes: e.target.value }))}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="min-w-[160px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Adharsh"
                value={filterForm.driver_name}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, driver_name: e.target.value }))}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={handleGo}
              className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Go
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {executives.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
          <MdLocalShipping className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No executive performance data for the selected filters.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Average efficiency</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {summary.average_efficiency_score != null ? `${Number(summary.average_efficiency_score).toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total deliveries</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.total_deliveries ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total routes</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.total_routes ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Period</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {period.start_date && period.end_date
                  ? `${period.start_date} to ${period.end_date}`
                  : period.days
                    ? `Last ${period.days} days`
                    : '—'}
              </p>
            </div>
          </div>

          {/* Performance charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Efficiency score by executive</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Efficiency']}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ''}
                    />
                    <Bar dataKey="efficiency" name="Efficiency %" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Deliveries & routes by executive</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} yAxisId="left" />
                    <YAxis orientation="right" tick={{ fontSize: 11 }} yAxisId="right" hide />
                    <Tooltip
                      formatter={(value, name) => [value, name === 'deliveries' ? 'Deliveries' : 'Routes']}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ''}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="deliveries" name="Deliveries" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="routes" name="Routes" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {pieChartData.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Delivery share by executive</h3>
              <div className="h-[280px] max-w-md mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Deliveries']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Executives table */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">All executives performance</h2>
              <p className="mt-1 text-xs text-gray-500">{data?.total_executives ?? executives.length} executives</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Executive</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Routes</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Deliveries</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Avg efficiency</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">On time %</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Distance (km)</th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Time saved (h)</th>
                    <th scope="col" className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Trend</th>
                    <th scope="col" className="relative px-5 py-3"><span className="sr-only">Expand</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {executives.map((ex) => {
                    const perf = ex.performance ?? {};
                    const metrics = ex.metrics ?? {};
                    const sessions = ex.sessions ?? {};
                    const isExpanded = expandedId === ex.driver_id;
                    return (
                      <React.Fragment key={ex.driver_id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                                <MdPerson className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{ex.driver_name ?? '—'}</p>
                                {ex.vehicle_number && <p className="text-xs text-gray-500">{ex.vehicle_number}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm text-gray-900">{ex.total_routes ?? '—'}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {onSelectExecutiveDrillDown ? (
                              <button
                                type="button"
                                onClick={() => onSelectExecutiveDrillDown(ex)}
                                className="font-medium text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline"
                                title="View routes for this executive"
                              >
                                {ex.total_deliveries ?? '—'}
                              </button>
                            ) : (
                              ex.total_deliveries ?? '—'
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            {perf.average_efficiency_score != null ? `${Number(perf.average_efficiency_score).toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {perf.on_time_percentage != null ? `${Number(perf.on_time_percentage).toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {metrics.actual_total_distance_km != null ? Number(metrics.actual_total_distance_km).toFixed(1) : '—'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {metrics.time_saved_hours != null ? Number(metrics.time_saved_hours).toFixed(1) : '—'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-center">{getTrendIcon(ex.trend)}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : ex.driver_id)}
                              className="text-sm font-medium text-teal-600 hover:text-teal-800"
                            >
                              {isExpanded ? 'Less' : 'Sessions'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && sessions && Object.keys(sessions).length > 0 && (
                          <tr>
                            <td colSpan={9} className="px-5 py-4 bg-gray-50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(sessions).map(([sessionName, sessionData]) => (
                                  <div key={sessionName} className="rounded-md border border-gray-200 bg-white px-4 py-3">
                                    <p className="text-xs font-medium uppercase text-gray-500">{sessionName}</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                      Routes: {sessionData?.routes ?? 0} · Avg efficiency: {sessionData?.avg_efficiency != null ? `${Number(sessionData.avg_efficiency).toFixed(1)}%` : '—'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExecutivePerformanceView;
