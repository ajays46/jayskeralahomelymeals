import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { useCompanyBasePath } from '../../context/TenantContext';
import {
  formatKitchenDateTime,
  useKitchenInventoryMock,
  useKitchenPurchaseRequestManagerApi
} from '../../hooks/adminHook/kitchenStoreHook';

const emptyResolveForm = {
  inventory_item_id: '',
  manager_note: '',
  category: '',
  min_quantity: ''
};

const decisionBadgeVariant = (decision) => (decision === 'REJECT' ? 'destructive' : 'success');

const StoreManagerPurchaseRequestDetailPage = () => {
  const { requestId } = useParams();
  const basePath = useCompanyBasePath();
  const {
    detailLoading,
    actionLoading,
    error,
    activeRequest,
    getPurchaseRequestDetail,
    createInventoryItem,
    resolveRequestLineItem,
    updateRequestLineManager,
    approveRequest,
    rejectRequest
  } = useKitchenPurchaseRequestManagerApi();
  const { items, refreshItems } = useKitchenInventoryMock();

  const [approvalNote, setApprovalNote] = useState('');
  const [status, setStatus] = useState('');
  const [selectedLineId, setSelectedLineId] = useState('');
  const [resolveForms, setResolveForms] = useState({});
  const [lineDecisions, setLineDecisions] = useState({});
  const [lineManagerNotes, setLineManagerNotes] = useState({});
  const [lineApprovedQuantities, setLineApprovedQuantities] = useState({});

  useEffect(() => {
    if (!requestId) return;
    getPurchaseRequestDetail(requestId);
  }, [getPurchaseRequestDetail, requestId]);

  useEffect(() => {
    setSelectedLineId('');
  }, [requestId]);

  useEffect(() => {
    if (!selectedLineId || !activeRequest?.lines?.length) return;
    const stillThere = activeRequest.lines.some((line) => line.id === selectedLineId);
    if (!stillThere) setSelectedLineId('');
  }, [activeRequest, selectedLineId]);

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
    setResolveForms((prev) => {
      const next = { ...prev };
      activeRequest.lines.forEach((line) => {
        next[line.id] = next[line.id] || {
          ...emptyResolveForm,
          inventory_item_id: line.resolved_inventory_item_id || line.inventory_item_id || ''
        };
      });
      return next;
    });
  }, [activeRequest]);

  const unresolvedNewLines = useMemo(() => {
    if (!activeRequest) return [];
    return activeRequest.lines.filter(
      (line) => line.is_new_item && !line.resolved_inventory_item_id && lineDecisions[line.id] !== 'REJECT'
    );
  }, [activeRequest, lineDecisions]);

  const selectedLine = useMemo(
    () => activeRequest?.lines.find((line) => line.id === selectedLineId) || activeRequest?.lines[0] || null,
    [activeRequest, selectedLineId]
  );

  const updateResolveForm = (lineId, patch) => {
    setResolveForms((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || emptyResolveForm),
        ...patch
      }
    }));
  };

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

  const onResolveExisting = async (lineId) => {
    const form = resolveForms[lineId] || emptyResolveForm;
    if (!form.inventory_item_id) {
      setStatus('Choose an inventory item before resolving the line.');
      return;
    }

    setStatus('');
    const mappingNote = String(form.manager_note || '').trim();
    const lineNote = String(lineManagerNotes[lineId] || '').trim();
    const result = await resolveRequestLineItem(requestId, lineId, {
      inventory_item_id: form.inventory_item_id,
      manager_note: mappingNote || lineNote || 'Mapped to inventory item'
    });

    if (!result.ok) {
      setStatus(result.message || 'Failed to resolve line.');
      return;
    }

    setStatus('Line resolved successfully.');
    await reloadDetail();
  };

  const onCreateAndResolve = async (line) => {
    const form = resolveForms[line.id] || emptyResolveForm;
    setStatus('');

    const createResult = await createInventoryItem({
      name: line.requested_item_name,
      unit: line.requested_unit,
      category: form.category.trim() || 'Uncategorized',
      min_quantity: form.min_quantity === '' ? null : Number(form.min_quantity)
    });

    if (!createResult.ok || !createResult.itemId) {
      setStatus(createResult.message || 'Inventory item creation failed.');
      return;
    }

    const mappingNote = String(form.manager_note || '').trim();
    const lineNote = String(lineManagerNotes[line.id] || '').trim();
    const resolveNote = mappingNote || lineNote || 'Created new inventory item';
    const resolveResult = await resolveRequestLineItem(requestId, line.id, {
      inventory_item_id: createResult.itemId,
      manager_note: resolveNote
    });

    if (!resolveResult.ok) {
      setStatus(resolveResult.message || 'The line could not be mapped to the new inventory item.');
      return;
    }

    await refreshItems();
    setStatus('Created a new inventory item and resolved the request line.');
    await reloadDetail();
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
        setStatus(updateResult.message || 'Failed to update approved quantity before approval.');
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
      setStatus(result.message || 'Approval failed.');
      return;
    }
    setStatus('Purchase request approved.');
    await reloadDetail();
  };

  const onReject = async () => {
    if (!requestId) return;
    setStatus('');
    const result = await rejectRequest(requestId, {
      approval_note: approvalNote.trim()
    });
    if (!result.ok) {
      setStatus(result.message || 'Rejection failed.');
      return;
    }
    setStatus('Purchase request rejected.');
    await reloadDetail();
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Purchase Request Detail"
        description="Review lines, select approve or reject, and resolve new items only when needed."
        actions={
          <Button asChild variant="outline">
            <Link to={`${basePath}/store-manager/purchase-requests`}>Back to Inbox</Link>
          </Button>
        }
        tone="violet"
      />

      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      {activeRequest ? (
        <StoreSection title="Request timeline" description="" tone="sky">
          <div className="flex flex-wrap gap-2 text-sm">
            {activeRequest.submitted_at ? (
              <Badge variant="secondary">Submitted: {formatKitchenDateTime(activeRequest.submitted_at)}</Badge>
            ) : null}
            {activeRequest.approved_at ? (
              <Badge variant="secondary">Approved: {formatKitchenDateTime(activeRequest.approved_at)}</Badge>
            ) : null}
            {!activeRequest.submitted_at && !activeRequest.approved_at ? (
              <span className="text-muted-foreground">No submit/approval timestamps on this record yet.</span>
            ) : null}
          </div>
        </StoreSection>
      ) : null}

      {detailLoading && !activeRequest ? (
        <StoreSection title="Purchase Request" tone="violet">
          <StoreNotice tone="sky">Loading request detail...</StoreNotice>
        </StoreSection>
      ) : activeRequest ? (
        <>
          <StoreSection
            title="Approval Note"
            description={activeRequest.requested_note ? `Operator note: ${activeRequest.requested_note}` : 'No operator note'}
            tone="amber"
          >
            <textarea
              className="min-h-20 w-full rounded border px-3 py-2 text-sm"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Approval or rejection note"
            />
            {/* {unresolvedNewLines.length > 0 ? ( */}
              {/* // <StoreNotice tone="amber">
              //   Resolve or reject all new-item lines before approving.
              // </StoreNotice>
            // ) : null} */}
          </StoreSection>

          <StoreSection
            title="Request Items"
            description={
              selectedLineId
                ? 'Use Select on another row to switch the detail panel below.'
                : 'Use Select on a row to open the Selected Item panel: qty, decisions, notes, and mapping.'
            }
            tone="sky"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Requested Qty</TableHead>
                  <TableHead>Approved Qty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Manager Note</TableHead>
                  <TableHead className="text-right w-[1%] whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRequest.lines.map((line) => {
                  const isSelected = selectedLineId === line.id;
                  const decision = lineDecisions[line.id] || 'APPROVE';
                  const notePreview = (lineManagerNotes[line.id] || '').trim();
                  return (
                    <TableRow key={line.id} className={isSelected ? 'bg-muted/40' : ''}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div>{line.requested_item_name || line.inventory_item_name || 'Unnamed line'}</div>
                          {line.operator_note ? (
                            <div className="text-xs text-muted-foreground">{line.operator_note}</div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{line.requested_quantity} {line.requested_unit}</TableCell>
                      <TableCell>{lineApprovedQuantities[line.id] || line.approved_quantity} {line.requested_unit}</TableCell>
                      <TableCell>
                        <Badge variant={line.is_new_item ? 'warning' : 'secondary'}>
                          {line.is_new_item ? 'New item' : 'Existing item'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={decisionBadgeVariant(decision)}>{decision}</Badge>
                      </TableCell>
                      {/* <TableCell>{line.resolved_inventory_item_id || line.inventory_item_id || '-'}</TableCell> */}
                      <TableCell className="max-w-52 truncate">{notePreview || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLineId(line.id);
                          }}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </StoreSection>

          {selectedLineId && selectedLine ? (
            <StoreSection
              title={`Selected Item: ${selectedLine.requested_item_name || selectedLine.inventory_item_name || 'Unnamed line'}`}
              tone="emerald"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead className="w-[200px] align-middle">Field</TableHead> */}
                    {/* <TableHead>Value</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="align-middle font-medium text-muted-foreground">Requested quantity</TableCell>
                    <TableCell className="align-middle">
                      {selectedLine.requested_quantity} {selectedLine.requested_unit}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="align-middle font-medium text-muted-foreground">Approved quantity</TableCell>
                    <TableCell className="align-middle">
                      <input
                        className="w-full max-w-xs rounded border px-3 py-2 text-sm"
                        type="number"
                        min="0"
                        step="0.01"
                        value={lineApprovedQuantities[selectedLine.id] || ''}
                        onChange={(e) => updateLineApprovedQuantity(selectedLine.id, e.target.value)}
                        aria-label="Approved quantity"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="align-middle font-medium text-muted-foreground">Decision</TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={lineDecisions[selectedLine.id] === 'APPROVE' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setLineDecision(selectedLine.id, 'APPROVE')}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant={lineDecisions[selectedLine.id] === 'REJECT' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => setLineDecision(selectedLine.id, 'REJECT')}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="align-top font-medium text-muted-foreground pt-4">Manager comment</TableCell>
                    <TableCell className="align-top pt-4">
                      <textarea
                        className="min-h-20 w-full max-w-2xl rounded border px-3 py-2 text-sm"
                        value={lineManagerNotes[selectedLine.id] || ''}
                        onChange={(e) => updateLineManagerNote(selectedLine.id, e.target.value)}
                        placeholder="Optional manager comment for this line"
                        aria-label="Optional manager comment for this line"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-md border p-4">
                      <p className="text-sm font-medium">Map to Existing Inventory Item</p>
                  <select
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={resolveForms[selectedLine.id]?.inventory_item_id || ''}
                    onChange={(e) => updateResolveForm(selectedLine.id, { inventory_item_id: e.target.value })}
                  >
                        <option value="">Select inventory item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.unit})
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="min-h-20 w-full rounded border px-3 py-2 text-sm"
                    value={resolveForms[selectedLine.id]?.manager_note || ''}
                    onChange={(e) => updateResolveForm(selectedLine.id, { manager_note: e.target.value })}
                        placeholder="Manager note for mapping"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onResolveExisting(selectedLine.id)}
                    disabled={actionLoading}
                  >
                        Map Existing Item
                  </Button>
                </div>

                <div className="space-y-3 rounded-md border p-4">
                  {selectedLine.is_new_item ? (
                    <>
                      <p className="text-sm font-medium">Create Inventory Item </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="rounded border bg-muted px-3 py-2 text-sm" value={selectedLine.requested_item_name} readOnly />
                        <input className="rounded border bg-muted px-3 py-2 text-sm" value={selectedLine.requested_unit} readOnly />
                        <input
                          className="rounded border px-3 py-2 text-sm"
                          value={resolveForms[selectedLine.id]?.category || ''}
                          onChange={(e) => updateResolveForm(selectedLine.id, { category: e.target.value })}
                          placeholder="Category"
                        />
                        <input
                          className="rounded border px-3 py-2 text-sm"
                          type="number"
                          min="0"
                          step="0.01"
                          value={resolveForms[selectedLine.id]?.min_quantity || ''}
                          onChange={(e) => updateResolveForm(selectedLine.id, { min_quantity: e.target.value })}
                          placeholder="Min quantity"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onCreateAndResolve(selectedLine)}
                        disabled={actionLoading}
                      >
                        Create Item 
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Existing Inventory Line</p>
                      <p className="text-sm text-muted-foreground">
                        This line already references inventory. You can remap it if needed or include it as-is.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </StoreSection>
          ) : (
            <StoreSection
              title="Selected Item"
              description="Choose a row in Request Items and click Select to edit quantities, decisions, and inventory mapping."
              tone="emerald"
            >
              <StoreNotice tone="sky">No line selected.</StoreNotice>
            </StoreSection>
          )}

          <StoreSection title="Final Action" tone="rose">
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="destructive" onClick={onReject} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Reject Full Request'}
              </Button>
              <Button type="button" onClick={onApprove} disabled={actionLoading || unresolvedNewLines.length > 0}>
                {Object.values(lineDecisions).some((decision) => decision === 'REJECT')
                  ? 'Approve Remaining Lines'
                  : 'Approve Full Request'}
              </Button>
            </div>
          </StoreSection>
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
