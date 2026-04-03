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
  const [managerNoteModalLineId, setManagerNoteModalLineId] = useState(null);

  useEffect(() => {
    if (!requestId) return;
    getPurchaseRequestDetail(requestId);
  }, [getPurchaseRequestDetail, requestId]);

  useEffect(() => {
    setManagerNoteModalLineId(null);
  }, [requestId]);

  useEffect(() => {
    if (!managerNoteModalLineId) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setManagerNoteModalLineId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [managerNoteModalLineId]);

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

  const openManagerNoteModal = (lineId) => {
    setManagerNoteModalLineId(lineId);
  };

  const closeManagerNoteModal = () => {
    setManagerNoteModalLineId(null);
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

  const managerNoteModalLine =
    managerNoteModalLineId && activeRequest
      ? activeRequest.lines.find((l) => l.id === managerNoteModalLineId) ?? null
      : null;

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
            description="Set approved quantity, Approve or Reject per row. Add note / Open for manager notes."
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
                  <TableHead>Type</TableHead>
                  <TableHead className="min-w-[200px]">Manager Note</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRequest.lines.map((line) => {
                  const decision = lineDecisions[line.id] || 'APPROVE';
                  const notePreview = (lineManagerNotes[line.id] || '').trim();
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
                        <TableCell>
                          <Badge variant={line.is_new_item ? 'warning' : 'secondary'}>
                            {line.is_new_item ? 'New item' : 'Existing item'}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-2 py-1">
                            {notePreview ? (
                              <span className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                                {notePreview}
                              </span>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openManagerNoteModal(line.id);
                              }}
                            >
                              {notePreview ? 'Open' : 'Add note'}
                            </Button>
                          </div>
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

      {managerNoteModalLine ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close dialog"
            onClick={closeManagerNoteModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manager-note-dialog-title"
            className="relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg"
          >
            <h2 id="manager-note-dialog-title" className="text-lg font-semibold">
              Manager note
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {managerNoteModalLine.requested_item_name ||
                managerNoteModalLine.inventory_item_name ||
                'Line item'}
            </p>
            <textarea
              className="mt-4 min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
              value={lineManagerNotes[managerNoteModalLineId] || ''}
              onChange={(e) => updateLineManagerNote(managerNoteModalLineId, e.target.value)}
              placeholder="Write a note for this line…"
              aria-label="Manager note"
              autoFocus
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeManagerNoteModal}>
                Cancel
              </Button>
              <Button type="button" onClick={closeManagerNoteModal}>
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </StorePageShell>
  );
};

export default StoreManagerPurchaseRequestDetailPage;
