/**
 * CXO Dashboard hooks – consume /api/cxo/dashboard/* (proxied to AI app).
 * Send X-Company-ID and X-User-ID via axios. Params: days | period | start_date & end_date | limit | driver_id.
 */
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const CXO_DASHBOARD_KEY = ['cxo-dashboard'];

function buildParams(params) {
  const p = {};
  if (params?.days != null) p.days = params.days;
  if (params?.period) p.period = params.period;
  if (params?.start_date) p.start_date = params.start_date;
  if (params?.end_date) p.end_date = params.end_date;
  if (params?.limit != null) p.limit = params.limit;
  if (params?.driver_id) p.driver_id = params.driver_id;
  return p;
}

/** GET /api/cxo/dashboard/summary */
export function useCxoDashboardSummary(params = {}, options = {}) {
  const queryParams = buildParams(params);
  return useQuery({
    queryKey: [...CXO_DASHBOARD_KEY, 'summary', queryParams],
    queryFn: async () => {
      const { data } = await api.get('/cxo/dashboard/summary', { params: Object.keys(queryParams).length ? queryParams : { days: 30 } });
      return data;
    },
    ...options,
  });
}

/** GET /api/cxo/dashboard/menu-demand */
export function useCxoMenuDemand(params = {}, options = {}) {
  const queryParams = buildParams(params);
  return useQuery({
    queryKey: [...CXO_DASHBOARD_KEY, 'menu-demand', queryParams],
    queryFn: async () => {
      const { data } = await api.get('/cxo/dashboard/menu-demand', { params: Object.keys(queryParams).length ? queryParams : { days: 30, limit: 10 } });
      return data;
    },
    ...options,
  });
}

/** GET /api/cxo/dashboard/order-areas */
export function useCxoOrderAreas(params = {}, options = {}) {
  const queryParams = buildParams(params);
  return useQuery({
    queryKey: [...CXO_DASHBOARD_KEY, 'order-areas', queryParams],
    queryFn: async () => {
      const { data } = await api.get('/cxo/dashboard/order-areas', { params: Object.keys(queryParams).length ? queryParams : { days: 30, limit: 10 } });
      return data;
    },
    ...options,
  });
}

/** GET /api/cxo/dashboard/driver-earnings */
export function useCxoDriverEarnings(params = {}, options = {}) {
  const queryParams = buildParams(params);
  return useQuery({
    queryKey: [...CXO_DASHBOARD_KEY, 'driver-earnings', queryParams],
    queryFn: async () => {
      const { data } = await api.get('/cxo/dashboard/driver-earnings', { params: Object.keys(queryParams).length ? queryParams : { days: 30 } });
      return data;
    },
    ...options,
  });
}

/** GET /api/cxo/dashboard/driver-distance */
export function useCxoDriverDistance(params = {}, options = {}) {
  const queryParams = buildParams(params);
  return useQuery({
    queryKey: [...CXO_DASHBOARD_KEY, 'driver-distance', queryParams],
    queryFn: async () => {
      const { data } = await api.get('/cxo/dashboard/driver-distance', { params: Object.keys(queryParams).length ? queryParams : { days: 30 } });
      return data;
    },
    ...options,
  });
}

/** GET /api/cxo/dashboard/live-drivers */
export function useCxoLiveDrivers(options = {}) {
  return useQuery({
    queryKey: [...CXO_DASHBOARD_KEY, 'live-drivers'],
    queryFn: async () => {
      const { data } = await api.get('/cxo/dashboard/live-drivers');
      return data;
    },
    refetchInterval: 30000,
    ...options,
  });
}

/** GET /api/cxo/dashboard/route-history */
export function useCxoRouteHistory(params = {}, options = {}) {
  const queryParams = buildParams(params);
  return useQuery({
    queryKey: [...CXO_DASHBOARD_KEY, 'route-history', queryParams],
    queryFn: async () => {
      const { data } = await api.get('/cxo/dashboard/route-history', { params: Object.keys(queryParams).length ? queryParams : { days: 30, limit: 20 } });
      return data;
    },
    ...options,
  });
}
