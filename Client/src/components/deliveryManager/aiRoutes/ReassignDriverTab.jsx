import React, { useState, useMemo } from 'react';
import { FiUserPlus, FiRepeat, FiMapPin } from 'react-icons/fi';
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
 * ReassignDriverTab - Reassign route, exchange drivers, or move one stop between routes.
 */
const ReassignDriverTab = ({ routePlan, reassignMutation, moveStopMutation }) => {
  const [mode, setMode] = useState('exchange'); // 'reassign' | 'exchange' | 'move_stop'
  const [routeId, setRouteId] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [routeId1, setRouteId1] = useState('');
  const [routeId2, setRouteId2] = useState('');
  const [fromRouteId, setFromRouteId] = useState('');
  const [toRouteId, setToRouteId] = useState('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [insertAtOrder, setInsertAtOrder] = useState('');

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

  const fromRoute = useMemo(() => routes.find((r) => r.route_id === fromRouteId), [routes, fromRouteId]);
  const stopsFromRoute = useMemo(() => {
    if (!fromRoute?.stops?.length) return [];
    return fromRoute.stops.map((stop, i) => ({
      delivery_id: stop.id,
      stop_order: i + 1,
      label: stop.customer_name || stop.first_name || `Stop ${i + 1}`,
      address: stop.address || stop.customer_address
    }));
  }, [fromRoute]);

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

  const handleMoveStop = async () => {
    if (!fromRouteId || !toRouteId || fromRouteId === toRouteId) {
      showErrorToast('Select different From and To routes');
      return;
    }
    if (!selectedDeliveryId) {
      showErrorToast('Select a stop to move');
      return;
    }
    try {
      const body = {
        from_route_id: fromRouteId,
        to_route_id: toRouteId,
        stop_identifier: { delivery_id: selectedDeliveryId },
        insert_at_order: insertAtOrder ? parseInt(insertAtOrder, 10) : null
      };
      const result = await moveStopMutation.mutateAsync(body);
      showSuccessToast(result.message || 'Stop moved successfully');
      setFromRouteId('');
      setToRouteId('');
      setSelectedDeliveryId('');
      setInsertAtOrder('');
    } catch (err) {
      showErrorToast(err.message || 'Move stop failed');
    }
  };

  const isLoading = reassignMutation?.isPending || moveStopMutation?.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FiUserPlus className="text-teal-400 text-xl" />
        <h2 className="text-xl font-bold text-white">Reassign Driver</h2>
      </div>
      <p className="text-gray-400 text-sm">
        Exchange drivers between two routes or move one delivery stop from one route to another. Plan a route first to see available routes.
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
            <button
              type="button"
              onClick={() => setMode('move_stop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'move_stop' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FiMapPin className="w-4 h-4" />
              Move stop
            </button>
          </div>

          {mode === 'reassign' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Route</label>
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
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="Enter new driver name"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : mode === 'move_stop' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">From route</label>
                  <select
                    value={fromRouteId}
                    onChange={(e) => {
                      setFromRouteId(e.target.value);
                      setSelectedDeliveryId('');
                    }}
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">To route</label>
                  <select
                    value={toRouteId}
                    onChange={(e) => setToRouteId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select route</option>
                    {routeOptions.filter((opt) => opt.route_id !== fromRouteId).map((opt) => (
                      <option key={opt.route_id} value={opt.route_id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {fromRouteId && stopsFromRoute.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop to move</label>
                  <select
                    value={selectedDeliveryId}
                    onChange={(e) => setSelectedDeliveryId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select stop</option>
                    {stopsFromRoute.map((s) => (
                      <option key={s.delivery_id} value={s.delivery_id}>
                        {s.label} {s.address ? `— ${String(s.address).slice(0, 40)}…` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-300 mb-2">Insert at position (optional)</label>
                <input
                  type="number"
                  min={1}
                  value={insertAtOrder}
                  onChange={(e) => setInsertAtOrder(e.target.value)}
                  placeholder="Leave empty to append at end"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {mode === 'move_stop' ? (
              <button
                type="button"
                onClick={handleMoveStop}
                disabled={isLoading || !fromRouteId || !toRouteId || !selectedDeliveryId}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Moving...</span>
                  </>
                ) : (
                  <span>Move stop</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReassign}
                disabled={isLoading || (mode === 'reassign' ? (!routeId || !newDriverName?.trim()) : (!routeId1 || !routeId2 || routeId1 === routeId2))}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>{mode === 'reassign' ? 'Reassigning...' : 'Exchanging...'}</span>
                  </>
                ) : (
                  <span>{mode === 'reassign' ? 'Reassign route' : 'Exchange drivers'}</span>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReassignDriverTab;
