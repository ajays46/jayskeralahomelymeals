import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenPurchaseRequestOperatorApi, useKitchenReceiptsApi } from '../../hooks/adminHook/kitchenStoreHook';

const StoreOperatorPurchaseComparisonPage = () => {
  const basePath = useCompanyBasePath();
  const { approvedRequests, bootstrapLoading, error, listApprovedRequests } = useKitchenPurchaseRequestOperatorApi();
  const { getPurchaseComparison } = useKitchenReceiptsApi();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [comparisonRows, setComparisonRows] = useState([]);
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
      .then((rows) => setComparisonRows(rows))
      .catch((err) => {
        setComparisonRows([]);
        setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load purchase comparison.');
      });
  }, [getPurchaseComparison, selectedRequestId]);

  const selectedRequest = useMemo(
    () => approvedRequests.find((request) => request.id === selectedRequestId) || null,
    [approvedRequests, selectedRequestId]
  );

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
                  <TableCell>{request.approved_at || request.created_at || '-'}</TableCell>
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
            {selectedRequest.submitted_at ? <Badge variant="secondary">Submitted: {selectedRequest.submitted_at}</Badge> : null}
            {selectedRequest.approved_at ? <Badge variant="secondary">Approved: {selectedRequest.approved_at}</Badge> : null}
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
                <TableHead>Comparison</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.inventory_item_name}</TableCell>
                  <TableCell>{row.requested_quantity} {row.requested_unit}</TableCell>
                  <TableCell>{row.approved_quantity} {row.requested_unit}</TableCell>
                  <TableCell>{row.purchased_quantity} {row.requested_unit}</TableCell>
                  <TableCell>{row.remaining_quantity} {row.requested_unit}</TableCell>
                  <TableCell>{row.fulfillment_status || '-'}</TableCell>
                  <TableCell>{row.comparison_status || '-'}</TableCell>
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
