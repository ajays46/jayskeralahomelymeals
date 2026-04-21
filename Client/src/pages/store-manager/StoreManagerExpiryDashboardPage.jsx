import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** Human labels for `summary` keys from `GET /inventory/expiry/dashboard`. */
const SUMMARY_KEY_ORDER = [
  ['expired', 'Expired batches'],
  ['expiring_within_1_day', 'Expiring within 1 day'],
  ['expiring_within_3_days', 'Expiring within 3 days'],
  ['expiring_within_7_days', 'Expiring within 7 days'],
  ['safe', 'Safe (beyond 7 days)'],
  ['no_expiry_set', 'No expiry date set']
];

const formatDaysUntil = (raw) => {
  const n = raw != null && raw !== '' ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return '—';
  if (n < 0) return `${Math.abs(n)} day(s) overdue`;
  if (n === 0) return 'Today';
  return `${n} day(s)`;
};

const formatBlocked = (raw) => {
  if (raw === true || String(raw).toLowerCase() === 'true') return 'Yes';
  if (raw === false || String(raw).toLowerCase() === 'false') return 'No';
  return '—';
};

const shortId = (id) => {
  const s = String(id || '').trim();
  if (!s) return '—';
  if (s.length <= 12) return s;
  return `${s.slice(0, 8)}…`;
};

/**
 * @param {{ rows: unknown[]; showBatchColumns?: boolean }} props
 */
const ExpiryBatchTable = ({ rows, showBatchColumns = true }) => {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) {
    return <p className="text-sm text-slate-500">No batches in this bucket.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="whitespace-nowrap">Remaining qty</TableHead>
            <TableHead className="whitespace-nowrap">Expiry date</TableHead>
            <TableHead className="whitespace-nowrap">Timeline</TableHead>
            <TableHead className="whitespace-nowrap">Blocked</TableHead>
            {showBatchColumns ? (
              <>
                <TableHead className="hidden font-mono text-xs md:table-cell">Batch</TableHead>
                <TableHead className="hidden font-mono text-xs lg:table-cell">Inventory item</TableHead>
              </>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((row, idx) => {
            const batchId = String(row?.batch_id ?? '').trim();
            const invId = String(row?.inventory_item_id ?? '').trim();
            const key = batchId || invId || `row-${idx}`;
            return (
              <TableRow key={key}>
                <TableCell className="max-w-[14rem] font-medium text-slate-900">
                  <span className="line-clamp-2" title={String(row?.item_name ?? '')}>
                    {String(row?.item_name ?? '').trim() || '—'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-700">
                  {row?.remaining_quantity != null && String(row.remaining_quantity).trim() !== ''
                    ? String(row.remaining_quantity)
                    : '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-700">
                  {row?.expiry_date != null && String(row.expiry_date).trim() !== '' ? String(row.expiry_date) : '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-700">{formatDaysUntil(row?.days_until_expiry)}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-700">{formatBlocked(row?.is_blocked)}</TableCell>
                {showBatchColumns ? (
                  <>
                    <TableCell className="hidden font-mono text-xs text-slate-600 md:table-cell" title={batchId || undefined}>
                      {shortId(batchId)}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-slate-600 lg:table-cell" title={invId || undefined}>
                      {shortId(invId)}
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const sectionToneClass = (tone) => {
  if (tone === 'rose') return 'border-rose-200/80 bg-rose-50/40';
  if (tone === 'amber') return 'border-amber-200/80 bg-amber-50/35';
  if (tone === 'sky') return 'border-sky-200/80 bg-sky-50/35';
  return 'border-slate-200 bg-slate-50/50';
};

/** @param {{ title: string; tone: 'rose'|'amber'|'sky'|'slate'; rows: unknown[]; showBatchColumns?: boolean }} props */
const ExpiryBatchSection = ({ title, tone, rows, showBatchColumns = true }) => (
  <div className={`rounded-xl border p-4 ${sectionToneClass(tone)}`}>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <div className="mt-3">
      <ExpiryBatchTable rows={rows} showBatchColumns={showBatchColumns} />
    </div>
  </div>
);

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

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    const used = new Set();
    const ordered = SUMMARY_KEY_ORDER.map(([key, label]) => {
      if (!(key in summary)) return null;
      used.add(key);
      return { key, label, value: summary[key] };
    }).filter(Boolean);
    const extras = Object.entries(summary)
      .filter(([k]) => !used.has(k))
      .map(([key, value]) => ({
        key,
        label: key.replace(/_/g, ' '),
        value
      }));
    return [...ordered, ...extras];
  }, [summary]);

  const asOf =
    dashboard?.as_of_date != null && String(dashboard.as_of_date).trim() !== ''
      ? String(dashboard.as_of_date).trim()
      : '';

  const expiredBatches = dashboard?.expired_batches;
  const expiringToday = dashboard?.expiring_today;
  const expiring3 = dashboard?.expiring_3_days;
  const expiring7 = dashboard?.expiring_7_days;

  return (
    <StorePageShell className="max-w-6xl">
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
          <div className="space-y-6">
            {asOf ? (
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">As of</span> {asOf}
              </p>
            ) : null}

            {summaryCards.length > 0 ? (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-slate-800">Summary</h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {summaryCards.map(({ key, label, value }) => (
                    <div key={key} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                      <div className="text-xs font-medium text-slate-500">{label}</div>
                      <div className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">Batch detail</h2>
              <ExpiryBatchSection title="Expired" tone="rose" rows={expiredBatches} showBatchColumns={false} />
              <ExpiryBatchSection title="Expiring today" tone="amber" rows={expiringToday} />
              <ExpiryBatchSection title="Expiring within 3 days" tone="amber" rows={expiring3} />
              <ExpiryBatchSection title="Expiring within 7 days" tone="sky" rows={expiring7} />
            </div>
          </div>
        )}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerExpiryDashboardPage;
