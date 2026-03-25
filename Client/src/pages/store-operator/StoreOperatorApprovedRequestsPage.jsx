import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenPurchaseRequestOperatorApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

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
    downloadApprovedLinesTxt
  } = useKitchenPurchaseRequestOperatorApi();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [status, setStatus] = useState('');
  const [requestDetail, setRequestDetail] = useState(null);

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
    fetchApprovedLines(selectedRequestId);
    fetchRequestDetail(selectedRequestId).then((detail) => setRequestDetail(detail));
  }, [fetchApprovedLines, fetchRequestDetail, selectedRequestId]);

  const selectedRequest = useMemo(
    () => requestDetail || approvedRequests.find((request) => request.id === selectedRequestId) || null,
    [approvedRequests, requestDetail, selectedRequestId]
  );
  const rejectedLines = useMemo(
    () => (selectedRequest?.lines || []).filter((line) => line.status === 'REJECTED'),
    [selectedRequest]
  );

  const onDownload = async () => {
    if (!selectedRequestId) return;
    setStatus('');
    const result = await downloadApprovedLinesTxt(selectedRequestId);
    if (!result.ok) {
      setStatus(result.message || 'Download failed.');
    }
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Approved Purchase Requests"
        description="Review approved lines and download the TXT file for purchase action."
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
      <StoreSection title="Approved Request" tone="emerald">
        {approvedRequests.length === 0 ? (
          <StoreNotice tone="amber">No approved requests found for this operator.</StoreNotice>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Approval Note</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Select</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.approval_note || '-'}</TableCell>
                  <TableCell><Badge variant="success">{request.status}</Badge></TableCell>
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
              ))}
            </TableBody>
          </Table>
        )}
      </StoreSection>
      <StoreSection
        title="Approved Lines"
        description={selectedRequest ? 'Approved request selected for purchase action' : 'Select an approved request'}
        tone="sky"
        headerActions={
          <Button type="button" onClick={onDownload} disabled={!selectedRequestId || downloadLoading}>
            {downloadLoading ? 'Downloading...' : 'Download Approved Items TXT'}
          </Button>
        }
      >
        {selectedRequest ? (
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="success">{selectedRequest.status}</Badge>
            {selectedRequest.submitted_at ? <Badge variant="secondary">Submitted: {selectedRequest.submitted_at}</Badge> : null}
            {selectedRequest.approved_at ? <Badge variant="secondary">Approved: {selectedRequest.approved_at}</Badge> : null}
            {selectedRequest.requested_note ? <Badge variant="secondary">Operator note: {selectedRequest.requested_note}</Badge> : null}
            {selectedRequest.approval_note ? <Badge variant="info">Approval note: {selectedRequest.approval_note}</Badge> : null}
          </div>
        ) : null}
        {!selectedRequestId ? (
          <StoreNotice tone="amber">Choose a request to see approved lines.</StoreNotice>
        ) : approvedLines.length === 0 ? (
          <StoreNotice tone="amber">No approved lines returned for this request.</StoreNotice>
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
        <StoreSection title="Rejected Request Lines" tone="amber">
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
