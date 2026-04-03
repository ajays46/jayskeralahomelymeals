import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { useCompanyBasePath } from '../../context/TenantContext';
import {
  formatKitchenDateTime,
  useKitchenPurchaseRequestOperatorApi,
  useKitchenReceiptsApi
} from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_MANAGER: requested vs purchased comparison per request. */
const StoreManagerPurchaseComparisonPage = () => {
  const basePath = useCompanyBasePath();
  const { approvedRequests, bootstrapLoading, error, listApprovedRequests } = useKitchenPurchaseRequestOperatorApi();
  const { getPurchaseComparison } = useKitchenReceiptsApi();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [comparisonRows, setComparisonRows] = useState([]);
  const [comparisonSummary, setComparisonSummary] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    listApprovedRequests({ mine: false });
  }, [listApprovedRequests]);

  useEffect(() => {
    if (!approvedRequests.length) return;
    if (selectedRequestId) return;
    setSelectedRequestId(approvedRequests[0].id);
  }, [approvedRequests, selectedRequestId]);

  useEffect(() => {
    if (!selectedRequestId) return;
    setStatus('');
    getPurchaseComparison(selectedRequestId)
      .then((data) => {
        setComparisonRows(data?.lines || []);
        setComparisonSummary(data?.summary || {});
      })
      .catch((err) => {
        setComparisonRows([]);
        setComparisonSummary({});
        const msg =
          err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load purchase comparison.';
        setStatus(msg);
        showStoreError(msg, 'Could not load comparison');
      });
  }, [getPurchaseComparison, selectedRequestId]);

  const selectedRequest = useMemo(
    () => approvedRequests.find((request) => request.id === selectedRequestId) || null,
    [approvedRequests, selectedRequestId]
  );

  const submittedLabel = useMemo(() => {
    const raw = comparisonSummary.submitted_at || selectedRequest?.submitted_at;
    return raw ? formatKitchenDateTime(raw) : '';
  }, [comparisonSummary.submitted_at, selectedRequest?.submitted_at]);

  const approvedLabel = useMemo(() => {
    const raw = comparisonSummary.approved_at || selectedRequest?.approved_at;
    return raw ? formatKitchenDateTime(raw) : '';
  }, [comparisonSummary.approved_at, selectedRequest?.approved_at]);

  return (
    <StorePageShell>
      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <StoreSection
        title="Purchase Comparison"
        description="Compare approved request quantities with actual purchased quantities."
        tone="emerald"
        headerActions={[
          <Button key="inbox" asChild><Link to={`${basePath}/store-manager/purchase-requests`}>Purchase Request Inbox</Link></Button>,
          <Button key="receipts" asChild variant="outline"><Link to={`${basePath}/store-manager/purchase-receipts`}>Purchase Receipts</Link></Button>
        ]}
      >
        {approvedRequests.length === 0 ? (
          <StoreNotice tone="amber">No approved requests available for comparison.</StoreNotice>
        ) : (
          <div className="max-h-[calc(2.75rem+6*3.25rem)] overflow-y-auto rounded-md border">
            <Table wrapperClassName="relative w-full">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Badge variant={request.status === 'APPROVED' ? 'success' : 'secondary'}>
                        {request.status || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatKitchenDateTime(request.submitted_at) || request.submitted_at || '-'}
                    </TableCell>
                    <TableCell className="font-medium">{request.operator_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedRequestId === request.id ? 'default' : 'outline'}
                        onClick={() => setSelectedRequestId(request.id)}
                        disabled={bootstrapLoading}
                      >
                        {selectedRequestId === request.id ? 'Selected' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StoreSection>

      <StoreSection
        title="Comparison Details"
        description={selectedRequest ? 'Approved quantity versus actual purchase quantity.' : 'Select an approved request'}
        tone="sky"
      >
        {selectedRequest ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="success">{selectedRequest.status}</Badge>
            {submittedLabel ? <Badge variant="secondary">Submitted: {submittedLabel}</Badge> : null}
            {approvedLabel ? <Badge variant="secondary">Approved: {approvedLabel}</Badge> : null}
          </div>
        ) : null}
        {!selectedRequestId ? (
          <StoreNotice tone="amber">Choose an approved request to see comparison rows.</StoreNotice>
        ) : comparisonRows.length === 0 ? (
          <StoreNotice tone="amber">No comparison rows returned for this request.</StoreNotice>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Exception</TableHead>
                <TableHead>Manager review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row, idx) => (
                <TableRow key={`${row.id}-${idx}`}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div>{row.inventory_item_name}</div>
                      {row.operator_note ? <div className="text-xs text-muted-foreground">Op: {row.operator_note}</div> : null}
                      {row.manager_note ? <div className="text-xs text-muted-foreground">Mgr: {row.manager_note}</div> : null}
                    </div>
                  </TableCell>
                  <TableCell>{row.requested_quantity} {row.requested_unit}</TableCell>
                  <TableCell>{row.approved_quantity} {row.requested_unit}</TableCell>
                  <TableCell>{row.purchased_quantity} {row.requested_unit}</TableCell>
                  <TableCell>{row.remaining_quantity} {row.requested_unit}</TableCell>
                  <TableCell>{row.fulfillment_status || '-'}</TableCell>
                  <TableCell>{row.comparison_status || '-'}</TableCell>
                  <TableCell>{row.manager_review_status || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerPurchaseComparisonPage;
