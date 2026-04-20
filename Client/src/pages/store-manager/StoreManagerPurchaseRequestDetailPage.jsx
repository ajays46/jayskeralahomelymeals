import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { useCompanyBasePath } from '../../context/TenantContext';
import { cn } from '@/lib/utils';
import { formatKitchenDateTime, useKitchenPurchaseRequestManagerApi } from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_MANAGER: purchase request review, resolve lines, approve/reject. */
const StoreManagerPurchaseRequestDetailPage = () => {
  const { requestId } = useParams();
  const basePath = useCompanyBasePath();
  const {
    detailLoading,
    actionLoading,
    error,
    activeRequest,
    getPurchaseRequestDetail,
    updateRequestLineManager,
    approveRequest,
    rejectRequest
  } = useKitchenPurchaseRequestManagerApi();

  const [approvalNote, setApprovalNote] = useState('');
  const [status, setStatus] = useState('');
  const [lineDecisions, setLineDecisions] = useState({});
  const [lineManagerNotes, setLineManagerNotes] = useState({});
  const [lineApprovedQuantities, setLineApprovedQuantities] = useState({});

  useEffect(() => {
    if (!requestId) return;
    getPurchaseRequestDetail(requestId);
  }, [getPurchaseRequestDetail, requestId]);

  useEffect(() => {
    if (!activeRequest) return;
    setApprovalNote(activeRequest.approval_note || '');
    setLineDecisions(
      activeRequest.lines.reduce((acc, line) => {
        acc[line.id] = line.status === 'REJECTED' ? 'REJECT' : 'APPROVE';
        return acc;
      }, {})
    );
    setLineManagerNotes(
      activeRequest.lines.reduce((acc, line) => {
        acc[line.id] = line.manager_note || '';
        return acc;
      }, {})
    );
    setLineApprovedQuantities(
      activeRequest.lines.reduce((acc, line) => {
        acc[line.id] = String(line.approved_quantity ?? line.requested_quantity ?? '');
        return acc;
      }, {})
    );
  }, [activeRequest]);

  const setLineDecision = (lineId, decision) => {
    setLineDecisions((prev) => ({ ...prev, [lineId]: decision }));
  };

  const updateLineManagerNote = (lineId, value) => {
    setLineManagerNotes((prev) => ({ ...prev, [lineId]: value }));
  };

  const updateLineApprovedQuantity = (lineId, value) => {
    setLineApprovedQuantities((prev) => ({ ...prev, [lineId]: value }));
  };

  const reloadDetail = async () => {
    if (!requestId) return;
    await getPurchaseRequestDetail(requestId);
  };

  const onApprove = async () => {
    if (!requestId) return;
    setStatus('');
    const linesToUpdate = (activeRequest?.lines || []).filter((line) => {
      if (lineDecisions[line.id] === 'REJECT') return false;
      const nextQty = Number(lineApprovedQuantities[line.id]);
      return Number.isFinite(nextQty) && nextQty > 0 && nextQty !== Number(line.approved_quantity ?? line.requested_quantity ?? 0);
    });

    for (const line of linesToUpdate) {
      const updateResult = await updateRequestLineManager(requestId, line.id, {
        approved_quantity: Number(lineApprovedQuantities[line.id]),
        manager_note: String(lineManagerNotes[line.id] || '').trim() || undefined
      });
      if (!updateResult.ok) {
        const msg = updateResult.message || 'Failed to update approved quantity before approval.';
        setStatus(msg);
        showStoreError(msg, 'Could not update line');
        return;
      }
    }

    const rejectLineIds = Object.entries(lineDecisions)
      .filter(([, decision]) => decision === 'REJECT')
      .map(([lineId]) => lineId);
    const filteredLineManagerNotes = Object.entries(lineManagerNotes).reduce((acc, [lineId, note]) => {
      const trimmed = String(note || '').trim();
      if (trimmed) acc[lineId] = trimmed;
      return acc;
    }, {});
    const result = await approveRequest(requestId, {
      approval_note: approvalNote.trim(),
      reject_line_ids: rejectLineIds,
      line_manager_notes: filteredLineManagerNotes
    });
    if (!result.ok) {
      const msg = result.message || 'Approval failed.';
      setStatus(msg);
      showStoreError(msg, 'Approval failed');
      return;
    }
    setStatus('Purchase request approved.');
    showStoreSuccess('Purchase request approved.', 'Approved');
    await reloadDetail();
  };

  const onReject = async () => {
    if (!requestId) return;
    setStatus('');
    const result = await rejectRequest(requestId, {
      approval_note: approvalNote.trim()
    });
    if (!result.ok) {
      const msg = result.message || 'Rejection failed.';
      setStatus(msg);
      showStoreError(msg, 'Rejection failed');
      return;
    }
    setStatus('Purchase request rejected.');
    showStoreSuccess('Purchase request rejected.', 'Rejected');
    await reloadDetail();
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Purchase Request Detail"
        description="Review each line, set approved quantity, and approve or reject before final approval."
        actions={
          <Button asChild variant="outline">
            <Link to={`${basePath}/store-manager/purchase-requests`}>Back to Inbox</Link>
          </Button>
        }
        tone="violet"
      />

      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      {detailLoading && !activeRequest ? (
        <StoreSection title="Purchase Request" tone="violet">
          <StoreNotice tone="sky">Loading request detail...</StoreNotice>
        </StoreSection>
      ) : activeRequest ? (
        <>
          <StoreSection title="Request timeline" tone="sky" compact>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {activeRequest.submitted_at ? (
                <Badge variant="secondary" className="h-6 px-2 py-0 text-xs font-normal">
                  Submitted: {formatKitchenDateTime(activeRequest.submitted_at)}
                </Badge>
              ) : null}
              {activeRequest.approved_at ? (
                <Badge variant="secondary" className="h-6 px-2 py-0 text-xs font-normal">
                  Approved: {formatKitchenDateTime(activeRequest.approved_at)}
                </Badge>
              ) : null}
              {!activeRequest.submitted_at && !activeRequest.approved_at ? (
                <span className="text-muted-foreground">No submit/approval timestamps on this record yet.</span>
              ) : null}
            </div>
          </StoreSection>

          <StoreSection
            title="Request Items"
            description="Set approved quantity and optional manager note per row, then Approve or Reject."
            tone="sky"
          >
            <Table
              wrapperClassName={cn(
                'relative w-full overflow-auto',
                activeRequest.lines.length > 6 &&
                  'max-h-[min(28rem,calc(100vh-14rem))] rounded-md border border-slate-200/80'
              )}
            >
              <TableHeader
                className={cn(
                  '[&_tr]:border-b',
                  activeRequest.lines.length > 6 &&
                    'sticky top-0 z-10 bg-slate-100/95 shadow-sm backdrop-blur-sm [&_th]:bg-slate-100/95'
                )}
              >
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Requested Qty</TableHead>
                  <TableHead>Approved Qty</TableHead>
                  <TableHead className="min-w-[14rem]">Manager note</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRequest.lines.map((line) => {
                  const decision = lineDecisions[line.id] || 'APPROVE';
                  return (
                    <TableRow key={line.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div>{line.requested_item_name || line.inventory_item_name || 'Unnamed line'}</div>
                            {line.operator_note ? (
                              <div className="text-xs text-muted-foreground">{line.operator_note}</div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {line.requested_quantity} {line.requested_unit}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-1 py-1">
                            <input
                              className="w-24 rounded border px-2 py-1.5 text-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              value={lineApprovedQuantities[line.id] ?? ''}
                              onChange={(e) => updateLineApprovedQuantity(line.id, e.target.value)}
                              aria-label={`Approved quantity for ${line.requested_item_name || line.inventory_item_name || 'line'}`}
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{line.requested_unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <textarea
                            className="min-h-[2.75rem] w-full max-w-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                            rows={2}
                            value={lineManagerNotes[line.id] ?? ''}
                            onChange={(e) => updateLineManagerNote(line.id, e.target.value)}
                            placeholder="Manager note (optional)"
                            aria-label={`Manager note for ${line.requested_item_name || line.inventory_item_name || 'line'}`}
                          />
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <div className="flex flex-wrap justify-end gap-2 py-1">
                            <Button
                              type="button"
                              variant={decision === 'APPROVE' ? 'default' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLineDecision(line.id, 'APPROVE');
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant={decision === 'REJECT' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLineDecision(line.id, 'REJECT');
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </StoreSection>

          <StoreSection
            title="Approval Note"
            description={
              activeRequest.requested_note ? `Operator note: ${activeRequest.requested_note}` : 'No operator note'
            }
            tone="amber"
            compact
          >
            <textarea
              className="min-h-[3rem] w-full rounded-md border px-2 py-1.5 text-xs"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Approval or rejection note"
            />
          </StoreSection>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="destructive" size="sm" onClick={onReject} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Reject Full Request'}
            </Button>
            <Button type="button" size="sm" onClick={onApprove} disabled={actionLoading}>
              {Object.values(lineDecisions).some((decision) => decision === 'REJECT')
                ? 'Approve Remaining Lines'
                : 'Approve Full Request'}
            </Button>
          </div>
        </>
      ) : (
        <StoreSection title="Purchase Request" tone="violet">
          <StoreNotice tone="amber">No purchase request detail was returned.</StoreNotice>
        </StoreSection>
      )}
    </StorePageShell>
  );
};

export default StoreManagerPurchaseRequestDetailPage;
