import React, { useState } from 'react';
import { MdTrendingUp, MdTrendingDown, MdRemove, MdPerson, MdLocalShipping } from 'react-icons/md';
import { SkeletonLoading } from './Skeleton';

/**
 * ExecutivePerformanceSingle - CXO view of one delivery executive's performance
 * Fetches and displays data from /api/executive/performance?driver_name=...
 */
const ExecutivePerformanceSingle = ({
  data,
  isLoading,
  error,
  refetch,
  driverName,
  onNavigateToRoutes
}) => {
  const [sessionsExpanded, setSessionsExpanded] = useState(false);

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
        <p className="text-sm font-medium text-red-700">Error loading performance: {error.message}</p>
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

  const executives = data?.executives ?? [];
  const ex = executives[0] ?? executives.find((e) => (e.driver_name || '').toLowerCase() === (driverName || '').toLowerCase());
  const period = data?.period ?? {};

  if (!ex) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
        <MdLocalShipping className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No performance data for this executive.</p>
      </div>
    );
  }

  const perf = ex.performance ?? {};
  const metrics = ex.metrics ?? {};
  const sessions = ex.sessions ?? {};

  const getTrendIcon = (trend) => {
    if (!trend) return <MdRemove className="h-4 w-4 text-gray-400" />;
    const t = (trend.efficiency_trend || '').toLowerCase();
    if (t === 'up' || t === 'improving') return <MdTrendingUp className="h-4 w-4 text-green-600" />;
    if (t === 'down' || t === 'declining') return <MdTrendingDown className="h-4 w-4 text-red-600" />;
    return <MdRemove className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <MdPerson className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{ex.driver_name ?? '—'}</h2>
              {ex.vehicle_number && (
                <p className="text-sm text-gray-500">{ex.vehicle_number}</p>
              )}
            </div>
          </div>
          <div>{getTrendIcon(ex.trend)}</div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total routes</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{ex.total_routes ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total deliveries</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{ex.total_deliveries ?? '—'}</p>
          <button
            type="button"
            onClick={() => onNavigateToRoutes?.()}
            className="mt-3 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Routes
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Avg efficiency</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {perf.average_efficiency_score != null ? `${Number(perf.average_efficiency_score).toFixed(1)}%` : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">On time %</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {perf.on_time_percentage != null ? `${Number(perf.on_time_percentage).toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Metrics detail */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Metrics</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Distance (km)</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {metrics.actual_total_distance_km != null ? Number(metrics.actual_total_distance_km).toFixed(1) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Time (hours)</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {metrics.actual_total_time_hours != null ? Number(metrics.actual_total_time_hours).toFixed(2) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Time saved (h)</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {metrics.time_saved_hours != null ? Number(metrics.time_saved_hours).toFixed(1) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Period</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {period.start_date && period.end_date
                ? `${period.start_date} to ${period.end_date}`
                : period.days
                  ? `Last ${period.days} days`
                  : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Sessions */}
      {sessions && Object.keys(sessions).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setSessionsExpanded((prev) => !prev)}
            className="w-full px-5 py-4 border-b border-gray-200 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <h3 className="text-base font-semibold text-gray-900">Sessions</h3>
            <span className="text-sm text-teal-600 font-medium">{sessionsExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
          {sessionsExpanded && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(sessions).map(([sessionName, sessionData]) => (
                <div
                  key={sessionName}
                  className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <p className="text-xs font-medium uppercase text-gray-500">{sessionName}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    Routes: {sessionData?.routes ?? 0} · Avg efficiency: {sessionData?.avg_efficiency != null ? `${Number(sessionData.avg_efficiency).toFixed(1)}%` : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutivePerformanceSingle;
