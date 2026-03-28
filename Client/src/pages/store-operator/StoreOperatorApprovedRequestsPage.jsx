import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { formatKitchenDateTime, useKitchenPurchaseRequestOperatorApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

function requestDayKey(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  const dayPart = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) return dayPart;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const approvedTableFilterClass =
  'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

/** Status values shown in the table filter (data is loaded for both). */
const TABLE_STATUS_FILTERS = ['APPROVED', 'REJECTED'];

const StoreOperatorApprovedRequestsPage = () => {
  const basePath = useCompanyBasePath();
  const {
    bootstrapLoading,
    downloadLoading,
    error,
    approvedRequests,
    approvedLines,
    listApprovedRequests,
    fetchApprovedLines,
    fetchRequestDetail,
    downloadApprovedLinesPdf
  } = useKitchenPurchaseRequestOperatorApi();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [status, setStatus] = useState('');
  const [requestDetail, setRequestDetail] = useState(null);
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submittedFrom, setSubmittedFrom] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [approvedFrom, setApprovedFrom] = useState('');
  const [approvedTo, setApprovedTo] = useState('');

  useEffect(() => {
    listApprovedRequests();
  }, [listApprovedRequests]);

  const filteredApprovedRequestsForTable = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return approvedRequests.filter((request) => {
      const st = String(request.status || '').toUpperCase();
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      const subDay = requestDayKey(request.submitted_at);
      if (submittedFrom && (!subDay || subDay < submittedFrom)) return false;
      if (submittedTo && (!subDay || subDay > submittedTo)) return false;
      const apprDay = requestDayKey(request.approved_at || request.created_at);
      if (approvedFrom && (!apprDay || apprDay < approvedFrom)) return false;
      if (approvedTo && (!apprDay || apprDay > approvedTo)) return false;
      if (q) {
        const idStr = String(request.id).toLowerCase();
        const reqNote = (request.requested_note || '').toLowerCase();
        const apprNote = (request.approval_note || '').toLowerCase();
        const op = (request.operator_name || '').toLowerCase();
        if (!idStr.includes(q) && !reqNote.includes(q) && !apprNote.includes(q) && !op.includes(q)) return false;
      }
      return true;
    });
  }, [
    approvedRequests,
    tableSearch,
    statusFilter,
    submittedFrom,
    submittedTo,
    approvedFrom,
    approvedTo
  ]);

  const approvedTableFiltersActive =
    tableSearch.trim() !== '' ||
    statusFilter !== 'all' ||
    submittedFrom !== '' ||
    submittedTo !== '' ||
    approvedFrom !== '' ||
    approvedTo !== '';

  const clearApprovedTableFilters = () => {
    setTableSearch('');
    setStatusFilter('all');
    setSubmittedFrom('');
    setSubmittedTo('');
    setApprovedFrom('');
    setApprovedTo('');
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
      return;
    }
    fetchApprovedLines(selectedRequestId);
    fetchRequestDetail(selectedRequestId).then((detail) => setRequestDetail(detail));
  }, [fetchApprovedLines, fetchRequestDetail, selectedRequestId]);

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
        title="Purchase requests"
        description="Approved and rejected requests for your account. Filter by status, then open a request to see lines or download the approved-items PDF."
        actions={[
          <Button key="create" asChild><Link to={`${basePath}/store-operator/purchase-requests`}>Create Request</Link></Button>,
          <Button key="refresh" type="button" variant="outline" onClick={listApprovedRequests} disabled={bootstrapLoading}>
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
          <StoreNotice tone="amber">No approved or rejected requests found for this operator.</StoreNotice>
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
                  <option value="all">All statuses</option>
                  {TABLE_STATUS_FILTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex min-w-[9rem] flex-col gap-1">
                <label htmlFor="op-appr-submitted-from" className="text-xs font-medium text-slate-600">
                  Submitted from
                </label>
                <input
                  id="op-appr-submitted-from"
                  type="date"
                  value={submittedFrom}
                  onChange={(e) => setSubmittedFrom(e.target.value)}
                  className={`${approvedTableFilterClass} w-full sm:w-auto`}
                />
              </div>
              <div className="flex min-w-[9rem] flex-col gap-1">
                <label htmlFor="op-appr-submitted-to" className="text-xs font-medium text-slate-600">
                  Submitted to
                </label>
                <input
                  id="op-appr-submitted-to"
                  type="date"
                  value={submittedTo}
                  onChange={(e) => setSubmittedTo(e.target.value)}
                  className={`${approvedTableFilterClass} w-full sm:w-auto`}
                />
              </div>
              <div className="flex min-w-[9rem] flex-col gap-1">
                <label htmlFor="op-appr-approved-from" className="text-xs font-medium text-slate-600">
                  Approved from
                </label>
                <input
                  id="op-appr-approved-from"
                  type="date"
                  value={approvedFrom}
                  onChange={(e) => setApprovedFrom(e.target.value)}
                  className={`${approvedTableFilterClass} w-full sm:w-auto`}
                />
              </div>
              <div className="flex min-w-[9rem] flex-col gap-1">
                <label htmlFor="op-appr-approved-to" className="text-xs font-medium text-slate-600">
                  Approved to
                </label>
                <input
                  id="op-appr-approved-to"
                  type="date"
                  value={approvedTo}
                  onChange={(e) => setApprovedTo(e.target.value)}
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
                    <TableHead>Submitted at</TableHead>
                    <TableHead>Approved at</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Select</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovedRequestsForTable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                        No requests match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApprovedRequestsForTable.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.submitted_at ? formatKitchenDateTime(request.submitted_at) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {request.approved_at ? formatKitchenDateTime(request.approved_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              String(request.status || '').toUpperCase() === 'REJECTED'
                                ? 'destructive'
                                : 'success'
                            }
                            className="font-normal"
                          >
                            {request.status || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant={selectedRequestId === request.id ? 'default' : 'outline'}
                            onClick={() => setSelectedRequestId(request.id)}
                          >
                            {selectedRequestId === request.id ? 'Selected' : 'View'}
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
        {selectedRequest?.requested_note ? (
          <div className="mb-3 flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">Operator note: {selectedRequest.requested_note}</Badge>
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
                <TableHead>Purchased Qty</TableHead>
                <TableHead>Fulfillment</TableHead>
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
                  <TableCell>{line.purchased_quantity} {line.requested_unit}</TableCell>
                  <TableCell>{line.fulfillment_status || line.status || '-'}</TableCell>
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
