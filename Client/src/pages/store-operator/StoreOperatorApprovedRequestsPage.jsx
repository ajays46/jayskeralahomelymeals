import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { formatKitchenDateTime, useKitchenPurchaseRequestOperatorApi } from '../../hooks/adminHook/kitchenStoreHook';
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
    downloadApprovedLinesPdf
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
    const result = await downloadApprovedLinesPdf(selectedRequestId);
    if (!result.ok) {
      setStatus(result.message || 'Download failed.');
    }
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Approved Purchase Requests"
        description="Review approved lines and download the PDF file for purchase action."
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
                {approvedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.submitted_at ? formatKitchenDateTime(request.submitted_at) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.approved_at ? formatKitchenDateTime(request.approved_at) : '-'}
                    </TableCell>
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
          </div>
        )}
      </StoreSection>
      <StoreSection
        title="Approved"
        description={selectedRequest ? '' : 'Select an approved request'}
        tone="sky"
        headerActions={
          <Button type="button" onClick={onDownload} disabled={!selectedRequestId || downloadLoading}>
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
