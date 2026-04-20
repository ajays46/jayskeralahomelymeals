import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { formatKitchenDateTime, useKitchenPurchaseRequestOperatorApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_OPERATOR: approved/rejected requests, approved lines, PDF download. */

const approvedTableFilterClass =
  'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

/**
 * Guide §4.2 — `status` is comma-separated on the API; here one value at a time, or “all” (omit param / every status).
 * Sort: most recent first (submitted_at → updated_at → created_at) in the hook.
 */
const TABLE_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' }
];

/** Guide: NORMAL | MEDIUM | HIGH (optional `urgency` on list). */
const TABLE_URGENCY_OPTIONS = [
  { value: 'all', label: 'All urgency' },
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' }
];

function requestStatusBadgeVariant(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'REJECTED') return 'destructive';
  if (s === 'APPROVED') return 'success';
  if (s === 'SUBMITTED' || s === 'PENDING' || s === 'PENDING_APPROVAL') return 'secondary';
  return 'secondary';
}

const StoreOperatorApprovedRequestsPage = () => {
  const basePath = useCompanyBasePath();
  const {
    bootstrapLoading,
    downloadLoading,
    error,
    approvedRequests,
    approvedLines,
    listApprovedRequests,
    clearApprovedRequestPreview,
    fetchApprovedLines,
    fetchRequestDetail,
    downloadApprovedLinesPdf
  } = useKitchenPurchaseRequestOperatorApi();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [status, setStatus] = useState('');
  const [requestDetail, setRequestDetail] = useState(null);
  const [tableSearch, setTableSearch] = useState('');
  /** `all` = omit `status` on the API (every status). */
  const [statusFilter, setStatusFilter] = useState('all');
  /** Server-side `for_date_from` / `for_date_to` on weekly purchase requests (guide §4.2). */
  const [forDateFrom, setForDateFrom] = useState('');
  const [forDateTo, setForDateTo] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const weeklyListParams = useMemo(
    () => ({
      weekly: true,
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      ...(urgencyFilter !== 'all' ? { urgency: urgencyFilter } : {}),
      ...(forDateFrom ? { for_date_from: forDateFrom } : {}),
      ...(forDateTo ? { for_date_to: forDateTo } : {}),
      mine: true
    }),
    [statusFilter, urgencyFilter, forDateFrom, forDateTo]
  );

  useEffect(() => {
    listApprovedRequests(weeklyListParams);
  }, [listApprovedRequests, weeklyListParams]);

  const filteredApprovedRequestsForTable = useMemo(() => {
    let rows = approvedRequests;
    if (urgencyFilter !== 'all') {
      const want = urgencyFilter.toUpperCase();
      rows = rows.filter((r) => String(r.urgency || '').toUpperCase() === want);
    }
    const q = tableSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((request) => {
      const idStr = String(request.id).toLowerCase();
      const reqNote = (request.requested_note || '').toLowerCase();
      const apprNote = (request.approval_note || '').toLowerCase();
      const op = (request.operator_name || '').toLowerCase();
      const fd = (request.for_date || '').toLowerCase();
      return (
        idStr.includes(q) ||
        reqNote.includes(q) ||
        apprNote.includes(q) ||
        op.includes(q) ||
        fd.includes(q)
      );
    });
  }, [approvedRequests, tableSearch, urgencyFilter]);

  const approvedTableFiltersActive =
    tableSearch.trim() !== '' ||
    statusFilter !== 'all' ||
    urgencyFilter !== 'all' ||
    forDateFrom !== '' ||
    forDateTo !== '';

  const clearApprovedTableFilters = () => {
    setTableSearch('');
    setStatusFilter('all');
    setUrgencyFilter('all');
    setForDateFrom('');
    setForDateTo('');
  };

  useEffect(() => {
    if (bootstrapLoading) return;
    if (!approvedRequests.length) {
      setSelectedRequestId('');
      return;
    }
    if (!filteredApprovedRequestsForTable.length) {
      setSelectedRequestId('');
      return;
    }
    if (!selectedRequestId || !filteredApprovedRequestsForTable.some((r) => r.id === selectedRequestId)) {
      setSelectedRequestId(filteredApprovedRequestsForTable[0].id);
    }
  }, [bootstrapLoading, approvedRequests.length, filteredApprovedRequestsForTable, selectedRequestId]);

  useEffect(() => {
    if (!selectedRequestId) {
      setRequestDetail(null);
      clearApprovedRequestPreview();
      return;
    }
    let cancelled = false;
    (async () => {
      const detail = await fetchRequestDetail(selectedRequestId);
      if (cancelled) return;
      setRequestDetail(detail);
      if (!detail) {
        clearApprovedRequestPreview();
        return;
      }
      const st = String(detail.status || '').toUpperCase();
      if (st === 'APPROVED') {
        if (cancelled) return;
        await fetchApprovedLines(selectedRequestId);
      } else {
        clearApprovedRequestPreview();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    clearApprovedRequestPreview,
    fetchApprovedLines,
    fetchRequestDetail,
    selectedRequestId
  ]);

  const selectedRequest = useMemo(
    () => requestDetail || approvedRequests.find((request) => request.id === selectedRequestId) || null,
    [approvedRequests, requestDetail, selectedRequestId]
  );
  const selectedIsApproved = String(selectedRequest?.status || '').toUpperCase() === 'APPROVED';
  const rejectedLines = useMemo(
    () =>
      (selectedRequest?.lines || []).filter(
        (line) => String(line.status || '').toUpperCase() === 'REJECTED'
      ),
    [selectedRequest]
  );

  const onDownload = async () => {
    if (!selectedRequestId) return;
    setStatus('');
    const result = await downloadApprovedLinesPdf(selectedRequestId);
    if (!result.ok) {
      const msg = result.message || 'Download failed.';
      setStatus(msg);
      showStoreError(msg, 'Download failed');
      return;
    }
    showStoreSuccess('Download started. Check your downloads folder.', 'Download ready');
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Weekly purchase requests"
        description="Weekly requests load with the most recent first. Filter by status (Submitted / Approved / Rejected) or for-date range; open a row for lines or the approved-items PDF."
        actions={[
          <Button key="create" asChild><Link to={`${basePath}/store-operator/purchase-requests`}>Create Request</Link></Button>,
          <Button key="drafts" asChild variant="secondary">
            <Link to={`${basePath}/store-operator/purchase-request-drafts`}>Draft inbox</Link>
          </Button>,
          <Button
            key="refresh"
            type="button"
            variant="outline"
            onClick={() => listApprovedRequests(weeklyListParams)}
            disabled={bootstrapLoading}
          >
            {bootstrapLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        ]}
        tone="emerald"
      />
      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}
      <StoreSection
        title="Request list"
        description={
          approvedTableFiltersActive && approvedRequests.length > 0
            ? `Showing ${filteredApprovedRequestsForTable.length} of ${approvedRequests.length} requests.`
            : undefined
        }
        tone="emerald"
      >
        {approvedRequests.length === 0 ? (
          <StoreNotice tone="amber">
            No weekly purchase requests match the current filters (or none exist for this operator).
          </StoreNotice>
        ) : (
          <>
            <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
                <label htmlFor="op-appr-table-search" className="text-xs font-medium text-slate-600">
                  Search
                </label>
                <input
                  id="op-appr-table-search"
                  type="search"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Request id, operator, or notes…"
                  className={`${approvedTableFilterClass} w-full min-w-0`}
                  autoComplete="off"
                />
              </div>
              <div className="flex min-w-[9rem] flex-col gap-1">
                <label htmlFor="op-appr-table-status" className="text-xs font-medium text-slate-600">
                  Status
                </label>
                <select
                  id="op-appr-table-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`${approvedTableFilterClass} w-full sm:w-auto`}
                >
                  {TABLE_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex min-w-[9rem] flex-col gap-1">
                <label htmlFor="op-appr-table-urgency" className="text-xs font-medium text-slate-600">
                  Urgency
                </label>
                <select
                  id="op-appr-table-urgency"
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className={`${approvedTableFilterClass} w-full sm:w-auto`}
                >
                  {TABLE_URGENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex min-w-[9rem] flex-col gap-1">
                <label htmlFor="op-appr-for-date-from" className="text-xs font-medium text-slate-600">
                  For date from
                </label>
                <input
                  id="op-appr-for-date-from"
                  type="date"
                  value={forDateFrom}
                  onChange={(e) => setForDateFrom(e.target.value)}
                  className={`${approvedTableFilterClass} w-full sm:w-auto`}
                />
              </div>
              <div className="flex min-w-[9rem] flex-col gap-1">
                <label htmlFor="op-appr-for-date-to" className="text-xs font-medium text-slate-600">
                  For date to
                </label>
                <input
                  id="op-appr-for-date-to"
                  type="date"
                  value={forDateTo}
                  onChange={(e) => setForDateTo(e.target.value)}
                  className={`${approvedTableFilterClass} w-full sm:w-auto`}
                />
              </div>
              {approvedTableFiltersActive ? (
                <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearApprovedTableFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
            <div className="max-h-[22rem] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>For date</TableHead>
                    <TableHead>Purchase type</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Submitted at</TableHead>
                    <TableHead>Approved at</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Select</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovedRequestsForTable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">
                        No requests match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApprovedRequestsForTable.map((request) => {
                      const isSelected = selectedRequestId === request.id;
                      return (
                      <TableRow
                        key={request.id}
                        className={
                          isSelected
                            ? 'border-l-4 border-l-emerald-600 bg-emerald-50/90 hover:bg-emerald-50'
                            : 'hover:bg-slate-50/80'
                        }
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {request.for_date || '—'}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {request.purchase_type || '—'}
                        </TableCell>
                        <TableCell className="font-medium">{request.urgency || '—'}</TableCell>
                        <TableCell className="font-medium">
                          {request.submitted_at ? formatKitchenDateTime(request.submitted_at) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {request.approved_at ? formatKitchenDateTime(request.approved_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={requestStatusBadgeVariant(request.status)} className="font-normal">
                            {request.status || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => setSelectedRequestId(request.id)}
                          >
                            {isSelected ? 'Selected' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </StoreSection>
      <StoreSection
        title="Approved"
        description={
          selectedRequest
            ? selectedIsApproved
              ? ''
              : 'This request is rejected. PDF download is only available for approved requests.'
            : 'Select a request from the list'
        }
        tone="sky"
        headerActions={
          <Button
            type="button"
            onClick={onDownload}
            disabled={!selectedRequestId || !selectedIsApproved || downloadLoading}
          >
            {downloadLoading ? 'Downloading...' : 'Download Approved Items PDF'}
          </Button>
        }
      >
        {selectedRequest && (selectedRequest.approval_note || '').trim() ? (
          <div className="mb-4 rounded-xl border border-sky-200/90 bg-sky-50/90 px-3 py-2.5 text-sm shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">Approval note</p>
            <p className="mt-1 text-slate-800">{selectedRequest.approval_note.trim()}</p>
          </div>
        ) : null}
        {!selectedRequestId ? (
          <StoreNotice tone="amber">Choose a request to see approved lines.</StoreNotice>
        ) : approvedLines.length === 0 ? (
          <StoreNotice tone="amber">
            {selectedIsApproved
              ? 'No approved lines returned for this request.'
              : 'This request is rejected, so there are no approved lines to fulfill. See rejected line items below if any.'}
          </StoreNotice>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Requested Qty</TableHead>
                <TableHead>Approved Qty</TableHead>
                <TableHead>Operator Note</TableHead>
                <TableHead>Manager Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.inventory_item_name || line.requested_item_name}</TableCell>
                  <TableCell>{line.requested_quantity} {line.requested_unit}</TableCell>
                  <TableCell>{line.approved_quantity} {line.requested_unit}</TableCell>
                  <TableCell>{line.operator_note || '-'}</TableCell>
                  <TableCell>{line.manager_note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StoreSection>
      {selectedRequest ? (
        <StoreSection title="Rejected Request Items" tone="amber">
          {rejectedLines.length === 0 ? (
            <StoreNotice tone="sky">No rejected lines for this request.</StoreNotice>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Requested Qty</TableHead>
                  <TableHead>Manager Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.requested_item_name || line.inventory_item_name}</TableCell>
                    <TableCell>{line.requested_quantity} {line.requested_unit}</TableCell>
                    <TableCell>{line.manager_note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </StoreSection>
      ) : null}
    </StorePageShell>
  );
};

export default StoreOperatorApprovedRequestsPage;
