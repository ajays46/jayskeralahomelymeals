import React, { useState, useMemo } from 'react';
import { FiUserPlus, FiRepeat } from 'react-icons/fi';
import { showSuccessToast, showErrorToast } from '../../../utils/toastConfig.jsx';

const getDriverName = (route, index) => {
  if (route.executive?.name) return route.executive.name;
  if (route.driver_name) return route.driver_name;
  if (route.driver_id && route.driver_id !== `driver_${index + 1}`) {
    const formatted = route.driver_id
      .replace('driver_', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    if (formatted && formatted !== `${index + 1}`) return formatted;
  }
  return `Driver ${index + 1}`;
};

/**
 * ReassignDriverTab - Reassign a route to a new driver or exchange drivers between two routes.
 * Uses route plan data (route_id, driver names). Replaces the unused Delivery Data tab.
 */
const ReassignDriverTab = ({ routePlan, reassignMutation }) => {
  const [mode, setMode] = useState('reassign'); // 'reassign' | 'exchange'
  const [routeId, setRouteId] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [routeId1, setRouteId1] = useState('');
  const [routeId2, setRouteId2] = useState('');

  const routes = routePlan?.routes?.routes ?? [];

  const routeOptions = useMemo(() => {
    return routes.map((r, i) => ({
      route_id: r.route_id,
      label: `${getDriverName(r, i)} (${r.route_id?.slice(0, 8) || '—'}…)`,
      driverName: getDriverName(r, i)
    }));
  }, [routes]);

  const driverNamesFromPlan = useMemo(() => {
    const names = new Set();
    routes.forEach((r, i) => names.add(getDriverName(r, i)));
    return Array.from(names).filter(Boolean).sort();
  }, [routes]);

  const handleReassign = async () => {
    if (mode === 'reassign') {
      if (!routeId || !newDriverName?.trim()) {
        showErrorToast('Select a route and enter the new driver name');
        return;
      }
      try {
        const result = await reassignMutation.mutateAsync({
          route_id: routeId,
          new_driver_name: newDriverName.trim()
        });
        showSuccessToast(result.message || 'Driver reassigned successfully');
        setRouteId('');
        setNewDriverName('');
      } catch (err) {
        showErrorToast(err.message || 'Reassign failed');
      }
    } else {
      if (!routeId1 || !routeId2 || routeId1 === routeId2) {
        showErrorToast('Select two different routes to exchange');
        return;
      }
      try {
        const result = await reassignMutation.mutateAsync({
          exchange: true,
          route_id_1: routeId1,
          route_id_2: routeId2
        });
        showSuccessToast(result.message || 'Drivers exchanged successfully');
        setRouteId1('');
        setRouteId2('');
      } catch (err) {
        showErrorToast(err.message || 'Exchange failed');
      }
    }
  };

  const isLoading = reassignMutation?.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FiUserPlus className="text-teal-400 text-xl" />
        <h2 className="text-xl font-bold text-white">Reassign Driver</h2>
      </div>
      <p className="text-gray-400 text-sm">
        Reassign a route to a new driver or exchange drivers between two routes. Plan a route first to see available routes.
      </p>

      {routes.length === 0 ? (
        <div className="rounded-lg border border-gray-600 bg-gray-700/30 p-6 text-center">
          <p className="text-gray-400">No routes available. Plan a route in the Route Planning tab first.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode('reassign')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'reassign' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FiUserPlus className="w-4 h-4" />
              Reassign route
            </button>
            <button
              type="button"
              onClick={() => setMode('exchange')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'exchange' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FiRepeat className="w-4 h-4" />
              Exchange drivers
            </button>
          </div>

          {mode === 'reassign' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Route to reassign</label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select route</option>
                  {routeOptions.map((opt) => (
                    <option key={opt.route_id} value={opt.route_id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New driver name</label>
                <select
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select or type below</option>
                  {driverNamesFromPlan.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="Or type driver name"
                  className="mt-2 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Route 1</label>
                <select
                  value={routeId1}
                  onChange={(e) => setRouteId1(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select route</option>
                  {routeOptions.map((opt) => (
                    <option key={opt.route_id} value={opt.route_id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Route 2</label>
                <select
                  value={routeId2}
                  onChange={(e) => setRouteId2(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select route</option>
                  {routeOptions.map((opt) => (
                    <option key={opt.route_id} value={opt.route_id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleReassign}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>{mode === 'reassign' ? 'Reassigning...' : 'Exchanging...'}</span>
                </>
              ) : (
                <span>{mode === 'reassign' ? 'Reassign driver' : 'Exchange drivers'}</span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReassignDriverTab;
