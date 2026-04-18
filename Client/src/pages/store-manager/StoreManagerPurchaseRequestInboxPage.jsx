import React, { useEffect, useMemo, useState } from 'react';
import useAuthStore from '../../stores/Zustand.store';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useCompanyBasePath } from '../../context/TenantContext';
import {
  formatKitchenDateTime,
  useKitchenPurchaseRequestManagerApi,
  useKitchenPurchaseRhythmApi
} from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  StoreNotice,
  StorePageHeader,
  StorePageShell,
  StoreSection,
  StoreStatCard,
  StoreStatGrid
} from '@/components/store/StorePageShell';
import { PURCHASE_KIND, PURCHASE_KIND_META } from '@/components/store/purchaseRequestShared';
import { StoreManagerShortageReceiptPanels } from './StoreManagerPurchaseRhythmWidgets';

/** @feature kitchen-store — STORE_MANAGER: submitted purchase request inbox + daily shortage/receipt snapshot. */

function submittedDayKey(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  const dayPart = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) return dayPart;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function operatorDisplayLabel(request) {
  if (request.operator_name?.trim()) return request.operator_name;
  if (request.requested_by_id) return '—';
  return '-';
}

/** @returns {'WEEKLY'|'DAILY'|''} */
function normalizedPurchaseTypeKey(request) {
  const t = (request.purchase_type || '').trim().toUpperCase();
  if (t === 'WEEKLY' || t === 'DAILY') return t;
  return '';
}

function purchaseTypeLabel(request) {
  const key = normalizedPurchaseTypeKey(request);
  if (key === 'WEEKLY') return PURCHASE_KIND_META[PURCHASE_KIND.WEEKLY].label;
  if (key === 'DAILY') return PURCHASE_KIND_META[PURCHASE_KIND.DAILY].label;
  const raw = (request.purchase_type || '').trim();
  return raw || '-';
}

const inboxControlClass =
  'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

/** Set to `true` to show “Bulk approve daily purchase requests” again. */
const SHOW_BULK_APPROVE_DAILY_PURCHASE_REQUESTS = false;

const StoreManagerPurchaseRequestInboxPage = () => {
  const basePath = useCompanyBasePath();
  const { user } = useAuthStore();
  const roleString = String(user?.role || '').toUpperCase();
  const roles = (Array.isArray(user?.roles) ? user.roles : roleString ? [roleString] : []).map((r) => String(r).toUpperCase());
  const isStoreManager = roles.includes('STORE_MANAGER') || roleString === 'STORE_MANAGER';

  const {
    listLoading,
    error: listError,
    submittedRequests,
    listSubmittedRequests,
    actionLoading: managerActionLoading,
    quickApproveDailySubmitted
  } = useKitchenPurchaseRequestManagerApi();
  const [quickForDate, setQuickForDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [quickMax, setQuickMax] = useState(20);
  const [quickMessage, setQuickMessage] = useState('');
  const {
    loadingDaily,
    error: rhythmError,
    dailyShortage,
    dailyReceiptsToday,
    refreshDaily
  } = useKitchenPurchaseRhythmApi();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notePresence, setNotePresence] = useState('all');

  useEffect(() => {
    listSubmittedRequests();
  }, [listSubmittedRequests]);

  useEffect(() => {
    refreshDaily();
  }, [refreshDaily]);

  const statusOptions = useMemo(() => {
    const set = new Set(submittedRequests.map((r) => (r.status || '').trim()).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [submittedRequests]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submittedRequests.filter((request) => {
      if (statusFilter !== 'all' && (request.status || '') !== statusFilter) return false;
      if (purchaseTypeFilter !== 'all') {
        const pt = normalizedPurchaseTypeKey(request);
        if (pt !== purchaseTypeFilter) return false;
      }
      const note = (request.requested_note || '').trim();
      if (notePresence === 'with' && !note) return false;
      if (notePresence === 'without' && note) return false;
      const day = submittedDayKey(request.submitted_at || request.created_at);
      if (dateFrom && (!day || day < dateFrom)) return false;
      if (dateTo && (!day || day > dateTo)) return false;
      if (q) {
        const idStr = String(request.id).toLowerCase();
        const op = operatorDisplayLabel(request).toLowerCase();
        const noteLc = (request.requested_note || '').toLowerCase();
        if (!idStr.includes(q) && !op.includes(q) && !noteLc.includes(q)) return false;
      }
      return true;
    });
  }, [submittedRequests, search, statusFilter, purchaseTypeFilter, dateFrom, dateTo, notePresence]);

  const inboxFiltersActive =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    purchaseTypeFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    notePresence !== 'all';

  const clearInboxFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPurchaseTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setNotePresence('all');
  };

  return (
    <StorePageShell className="max-w-7xl">
      <StorePageHeader
        title="Purchase requests"
        description="Review submitted requests, filter by weekly or daily purchase type, and monitor today’s shortage signal and stock receipts."
        actions={[
          <Button key="receipts" asChild variant="outline">
            <Link to={`${basePath}/store-manager/purchase-receipts`}>Purchase Receipts</Link>
          </Button>
        ]}
        tone="violet"
      />

      {isStoreManager && SHOW_BULK_APPROVE_DAILY_PURCHASE_REQUESTS ? (
        <StoreSection
          title="Bulk approve daily purchase requests"
          description="Approves up to N submitted DAILY requests for a calendar date (same rules as single-line approve)."
          tone="violet"
        >
          <div className="flex flex-wrap gap-3 items-end mb-3">
            <label className="text-sm font-medium text-slate-700">
              For date
              <input
                type="date"
                className={`${inboxControlClass} mt-1 block`}
                value={quickForDate}
                onChange={(e) => setQuickForDate(e.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Max requests
              <input
                type="number"
                min={1}
                max={100}
                className={`${inboxControlClass} mt-1 block w-24`}
                value={quickMax}
                onChange={(e) => setQuickMax(Number(e.target.value) || 20)}
              />
            </label>
            <Button
              type="button"
              disabled={managerActionLoading}
              onClick={async () => {
                setQuickMessage('');
                const out = await quickApproveDailySubmitted({
                  for_date: quickForDate || undefined,
                  max_requests: quickMax
                });
                if (!out.ok) {
                  setQuickMessage(out.message || 'Quick approve failed.');
                  return;
                }
                const d = out.data || {};
                setQuickMessage(
                  `Approved: ${d.approved_count ?? (d.approved || []).length ?? 0}, skipped: ${d.skipped_count ?? (d.skipped || []).length ?? 0}.`
                );
                void listSubmittedRequests();
              }}
            >
              {managerActionLoading ? 'Running…' : 'Quick-approve submitted daily'}
            </Button>
          </div>
          {quickMessage ? <p className="text-sm text-slate-700">{quickMessage}</p> : null}
        </StoreSection>
      ) : null}

      <div className="space-y-4">
        <StoreManagerShortageReceiptPanels
          loadingDaily={loadingDaily}
          dailyShortage={dailyShortage}
          dailyReceiptsToday={dailyReceiptsToday}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => refreshDaily()} disabled={loadingDaily}>
              {loadingDaily ? 'Refreshing snapshot…' : 'Refresh shortage & receipts'}
            </Button>
            <Button type="button" variant="outline" onClick={listSubmittedRequests} disabled={listLoading}>
              {listLoading ? 'Refreshing...' : 'Refresh inbox'}
            </Button>
          </div>
          {listError ? <StoreNotice tone="rose">{listError}</StoreNotice> : null}
          {rhythmError ? <StoreNotice tone="rose">{rhythmError}</StoreNotice> : null}
          <StoreStatGrid className="xl:grid-cols-3">
            <StoreStatCard label="Submitted Requests" value={submittedRequests.length} tone="violet" />
            <StoreStatCard
              label="Total Submitted Lines"
              value={submittedRequests.reduce((sum, request) => sum + request.total_lines, 0)}
              tone="sky"
            />
            <StoreStatCard
              label="Requests With Notes"
              value={submittedRequests.filter((request) => request.requested_note).length}
              tone="amber"
            />
          </StoreStatGrid>
        </div>

        <StoreSection
          title="Submitted Request List"
          description={
            inboxFiltersActive
              ? `Showing ${filteredRequests.length} of ${submittedRequests.length} requests.`
              : undefined
          }
          tone="violet"
        >
          {submittedRequests.length === 0 ? (
            <StoreNotice tone="amber">No submitted purchase requests are waiting for manager action.</StoreNotice>
          ) : (
            <>
              <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
                  <label htmlFor="inbox-search" className="text-xs font-medium text-slate-600">
                    Search
                  </label>
                  <input
                    id="inbox-search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Operator, note, or request id…"
                    className={`${inboxControlClass} w-full min-w-0`}
                    autoComplete="off"
                  />
                </div>
                <div className="flex min-w-[9rem] flex-col gap-1">
                  <label htmlFor="inbox-purchase-type" className="text-xs font-medium text-slate-600">
                    Purchase type
                  </label>
                  <select
                    id="inbox-purchase-type"
                    value={purchaseTypeFilter}
                    onChange={(e) => setPurchaseTypeFilter(e.target.value)}
                    className={`${inboxControlClass} w-full sm:w-auto`}
                  >
                    <option value="all">All types</option>
                    <option value="WEEKLY">{PURCHASE_KIND_META[PURCHASE_KIND.WEEKLY].label}</option>
                    <option value="DAILY">{PURCHASE_KIND_META[PURCHASE_KIND.DAILY].label}</option>
                  </select>
                </div>
                <div className="flex min-w-[9rem] flex-col gap-1">
                  <label htmlFor="inbox-status" className="text-xs font-medium text-slate-600">
                    Status
                  </label>
                  <select
                    id="inbox-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`${inboxControlClass} w-full sm:w-auto`}
                  >
                    <option value="all">All statuses</option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex min-w-[9rem] flex-col gap-1">
                  <label htmlFor="inbox-note" className="text-xs font-medium text-slate-600">
                    Request note
                  </label>
                  <select
                    id="inbox-note"
                    value={notePresence}
                    onChange={(e) => setNotePresence(e.target.value)}
                    className={`${inboxControlClass} w-full sm:w-auto`}
                  >
                    <option value="all">Any</option>
                    <option value="with">Has note</option>
                    <option value="without">No note</option>
                  </select>
                </div>
                <div className="flex min-w-[9rem] flex-col gap-1">
                  <label htmlFor="inbox-from" className="text-xs font-medium text-slate-600">
                    Submitted from
                  </label>
                  <input
                    id="inbox-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`${inboxControlClass} w-full sm:w-auto`}
                  />
                </div>
                <div className="flex min-w-[9rem] flex-col gap-1">
                  <label htmlFor="inbox-to" className="text-xs font-medium text-slate-600">
                    Submitted to
                  </label>
                  <input
                    id="inbox-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`${inboxControlClass} w-full sm:w-auto`}
                  />
                </div>
                {inboxFiltersActive ? (
                  <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearInboxFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
              <div className="max-h-[22rem] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14"> </TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Purchase type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Requested Note</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                          No requests match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="w-14 align-middle">
                            {request.preview_item_primary_image_url ? (
                              <img
                                src={request.preview_item_primary_image_url}
                                alt=""
                                className="h-10 w-10 rounded-md object-cover border border-slate-200"
                              />
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell
                            className="font-medium"
                            title={request.requested_by_id ? `User id: ${request.requested_by_id}` : undefined}
                          >
                            {operatorDisplayLabel(request)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">{purchaseTypeLabel(request)}</TableCell>
                          <TableCell>
                            <Badge variant={request.status === 'SUBMITTED' ? 'warning' : 'secondary'}>
                              {request.status || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatKitchenDateTime(request.submitted_at || request.created_at) ||
                              request.submitted_at ||
                              request.created_at ||
                              '-'}
                          </TableCell>
                          <TableCell>{request.requested_note || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`${basePath}/store-manager/purchase-requests/${request.id}`}>Open Detail</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </StoreSection>
      </div>
    </StorePageShell>
  );
};

export default StoreManagerPurchaseRequestInboxPage;
