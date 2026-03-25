import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenPurchaseRequestManagerApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

const StoreManagerPurchaseRequestInboxPage = () => {
  const basePath = useCompanyBasePath();
  const { listLoading, error, submittedRequests, listSubmittedRequests } = useKitchenPurchaseRequestManagerApi();

  useEffect(() => {
    listSubmittedRequests();
  }, [listSubmittedRequests]);

  return (
    <StorePageShell>
      <StorePageHeader
        title="Purchase Request Inbox"
        description="Review submitted operator requests and open them for approval or rejection."
        actions={
          <Button type="button" variant="outline" onClick={listSubmittedRequests} disabled={listLoading}>
            {listLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
        tone="violet"
      />
      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      <StoreStatGrid>
        <StoreStatCard label="Submitted Requests" value={submittedRequests.length} tone="violet" />
        <StoreStatCard label="Total Submitted Lines" value={submittedRequests.reduce((sum, request) => sum + request.total_lines, 0)} tone="sky" />
        <StoreStatCard label="Requests With Notes" value={submittedRequests.filter((request) => request.requested_note).length} tone="amber" />
      </StoreStatGrid>
      <StoreSection title="Submitted Request List" tone="violet">
        {submittedRequests.length === 0 ? (
          <StoreNotice tone="amber">No submitted purchase requests are waiting for manager action.</StoreNotice>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Requested Note</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submittedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.operator_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'SUBMITTED' ? 'warning' : 'secondary'}>
                      {request.status || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.submitted_at || request.created_at || '-'}</TableCell>
                  <TableCell>{request.requested_note || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`${basePath}/store-manager/purchase-requests/${request.id}`}>Open Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerPurchaseRequestInboxPage;
