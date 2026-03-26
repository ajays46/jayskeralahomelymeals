import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { useCompanyBasePath } from '../../context/TenantContext';
import {
  formatKitchenDateTime,
  useKitchenPurchaseRequestOperatorApi,
  useKitchenReceiptsApi
} from '../../hooks/adminHook/kitchenStoreHook';

const StoreOperatorPurchaseComparisonPage = () => {
  const basePath = useCompanyBasePath();
  const { approvedRequests, bootstrapLoading, error, listApprovedRequests } = useKitchenPurchaseRequestOperatorApi();
  const { getPurchaseComparison } = useKitchenReceiptsApi();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [comparisonRows, setComparisonRows] = useState([]);
  const [comparisonSummary, setComparisonSummary] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    listApprovedRequests();
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
        setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load purchase comparison.');
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
      <StorePageHeader
        title="Purchase Comparison"
        description="Compare approved request quantities with the actual purchased quantities."
        actions={[
          <Button key="approved" asChild><Link to={`${basePath}/store-operator/approved-requests`}>Approved Requests</Link></Button>,
          <Button key="receipts" asChild variant="outline"><Link to={`${basePath}/store-operator/purchases`}>Purchase Receipts</Link></Button>
        ]}
        tone="emerald"
      />
      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <StoreSection title="Approved Requests" tone="emerald">
        {approvedRequests.length === 0 ? (
          <StoreNotice tone="amber">No approved requests available for comparison.</StoreNotice>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Approval Note</TableHead>
                <TableHead>Approved At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.approval_note || '-'}</TableCell>
                  <TableCell>
                    {formatKitchenDateTime(request.approved_at || request.created_at) ||
                      request.approved_at ||
                      request.created_at ||
                      '-'}
                  </TableCell>
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
              {comparisonRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div>{row.inventory_item_name}</div>
                      {row.operator_note ? (
                        <div className="text-xs text-muted-foreground">Op: {row.operator_note}</div>
                      ) : null}
                      {row.manager_note ? (
                        <div className="text-xs text-muted-foreground">Mgr: {row.manager_note}</div>
                      ) : null}
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

export default StoreOperatorPurchaseComparisonPage;
