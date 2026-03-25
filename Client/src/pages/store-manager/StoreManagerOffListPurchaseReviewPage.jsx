import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenPurchaseExceptionManagerApi } from '../../hooks/adminHook/kitchenStoreHook';

const ACTION_OPTIONS = ['RETURN', 'KEEP', 'INVESTIGATE', 'REJECT'];

const StoreManagerOffListPurchaseReviewPage = () => {
  const basePath = useCompanyBasePath();
  const {
    listLoading,
    actionLoading,
    error,
    pendingExceptions,
    listPendingExceptions,
    submitManagerReview
  } = useKitchenPurchaseExceptionManagerApi();
  const [selectedLineId, setSelectedLineId] = useState('');
  const [managerAction, setManagerAction] = useState('RETURN');
  const [managerActionNote, setManagerActionNote] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    listPendingExceptions();
  }, [listPendingExceptions]);

  useEffect(() => {
    if (!pendingExceptions.length) return;
    if (selectedLineId) return;
    setSelectedLineId(pendingExceptions[0].id);
  }, [pendingExceptions, selectedLineId]);

  const selectedException = useMemo(
    () => pendingExceptions.find((row) => row.id === selectedLineId) || null,
    [pendingExceptions, selectedLineId]
  );

  const onSubmitReview = async () => {
    if (!selectedException) return;
    setStatus('');
    const result = await submitManagerReview(selectedException.receipt_id, selectedException.id, {
      manager_action: managerAction,
      manager_action_note: managerActionNote.trim()
    });
    if (!result.ok) {
      setStatus(result.message || 'Failed to submit manager review.');
      return;
    }
    setStatus('Purchase exception review saved.');
    setManagerAction('RETURN');
    setManagerActionNote('');
    await listPendingExceptions();
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Purchase Exception Review"
        description="Review off-list or over-approved purchases and record the manager decision."
        actions={[
          <Button key="inbox" asChild><Link to={`${basePath}/store-manager/purchase-requests`}>Purchase Request Inbox</Link></Button>,
          <Button key="refresh" type="button" variant="outline" onClick={() => listPendingExceptions()} disabled={listLoading}>
            {listLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        ]}
        tone="violet"
      />
      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <StoreSection title="Pending Exception Items" tone="amber">
          {pendingExceptions.length === 0 ? (
            <StoreNotice tone="sky">No pending purchase exceptions found.</StoreNotice>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingExceptions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.inventory_item_name}</TableCell>
                    <TableCell>{row.purchased_qty} {row.purchase_unit}</TableCell>
                    <TableCell>
                      <Badge variant="warning">{row.comparison_status || row.manager_review_status || 'PENDING'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedLineId === row.id ? 'default' : 'outline'}
                        onClick={() => setSelectedLineId(row.id)}
                      >
                        {selectedLineId === row.id ? 'Selected' : 'Review'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </StoreSection>

        <StoreSection title="Review Item" tone="violet">
          {!selectedException ? (
            <StoreNotice tone="amber">Select an exception row to review it.</StoreNotice>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <p><span className="font-medium">Item:</span> {selectedException.inventory_item_name}</p>
                <p><span className="font-medium">Purchased:</span> {selectedException.purchased_qty} {selectedException.purchase_unit}</p>
                <p><span className="font-medium">Reason:</span> {selectedException.off_list_purchase_reason || '-'}</p>
                <p><span className="font-medium">Receipt ID:</span> {selectedException.receipt_id || '-'}</p>
                <p><span className="font-medium">Note:</span> {selectedException.note || '-'}</p>
              </div>

              <select
                className="w-full rounded border px-3 py-2"
                value={managerAction}
                onChange={(e) => setManagerAction(e.target.value)}
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <textarea
                className="min-h-24 w-full rounded border px-3 py-2 text-sm"
                value={managerActionNote}
                onChange={(e) => setManagerActionNote(e.target.value)}
                placeholder="Manager action note"
              />

              <Button type="button" onClick={onSubmitReview} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Submit Review'}
              </Button>
            </div>
          )}
        </StoreSection>
      </div>
    </StorePageShell>
  );
};

export default StoreManagerOffListPurchaseReviewPage;
