import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StoreNotice, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_MANAGER: expiry risk dashboard + block expired batches. */
const StoreManagerExpiryDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`${API.MAX_KITCHEN_INVENTORY}/expiry/dashboard`);
      setDashboard(res.data?.data ?? res.data ?? null);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e.message || 'Failed to load dashboard.';
      setError(String(msg));
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const onBlockExpired = async () => {
    setBlocking(true);
    setError('');
    try {
      const res = await api.post(`${API.MAX_KITCHEN_INVENTORY}/expiry/block-expired`, {});
      const data = res.data?.data ?? res.data ?? {};
      showStoreSuccess(
        `Blocked ${data.blocked_batch_count ?? '—'} batch(es); total qty ${data.total_quantity_blocked ?? '—'}.`,
        'Expired stock blocked'
      );
      await loadDashboard();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e.message || 'Block expired failed.';
      setError(String(msg));
      showStoreError(String(msg), 'Block expired');
    } finally {
      setBlocking(false);
    }
  };

  const summary = dashboard?.summary && typeof dashboard.summary === 'object' ? dashboard.summary : null;

  return (
    <StorePageShell>
      <StoreSection
        title="Expiry risk dashboard"
        tone="rose"
        headerActions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void loadDashboard()}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button type="button" size="sm" disabled={blocking} onClick={() => void onBlockExpired()}>
              {blocking ? 'Blocking…' : 'Block expired batches'}
            </Button>
          </div>
        }
      >
        {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
        {loading ? (
          <StoreNotice tone="sky">Loading dashboard…</StoreNotice>
        ) : !dashboard ? (
          <StoreNotice tone="amber">No dashboard data returned.</StoreNotice>
        ) : (
          <div className="space-y-4">
            {summary ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(summary).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.replace(/_/g, ' ')}</div>
                    <div className="text-lg font-semibold text-slate-900">{String(v)}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-slate-500">
              Raw payload (for debugging nested lists from the API):
            </p>
            <pre className="max-h-[24rem] overflow-auto rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-800">
              {JSON.stringify(dashboard, null, 2)}
            </pre>
          </div>
        )}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerExpiryDashboardPage;
