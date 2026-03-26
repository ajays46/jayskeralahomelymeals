import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenPurchaseRequestOperatorApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

const createLocalLineId = () => `pr-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatRequestReference = (requestId) => {
  const rawId = String(requestId || '').trim();
  if (!rawId) return 'Not returned by API';
  if (rawId.length <= 8) return rawId.toUpperCase();
  return `PR-${rawId.slice(0, 8).toUpperCase()}`;
};

const SOURCE_SECTIONS = [
  { key: 'lowStockItems', title: 'Low Stock Alerts', empty: 'No low-stock items returned.' },
  { key: 'shoppingList', title: 'Shopping List Items', empty: 'No shopping list items were returned.' },
  { key: 'recommendations', title: 'Suggested Reorders', empty: 'No reorder suggestions were returned.' }
];

/** Low stock + shopping list: show ~4 rows in view, scroll for the rest */
const SOURCE_TABLE_SCROLLABLE_KEYS = new Set(['lowStockItems', 'shoppingList']);
const SOURCE_TABLE_VISIBLE_BODY_ROWS = 4;
const SOURCE_TABLE_SCROLL_MAX_HEIGHT = `calc(2.5rem + ${SOURCE_TABLE_VISIBLE_BODY_ROWS} * 3.25rem)`;

const StoreOperatorPurchaseRequestPage = () => {
  const basePath = useCompanyBasePath();
  const {
    bootstrapLoading,
    submitLoading,
    error,
    lowStockItems,
    shoppingList,
    recommendations,
    loadRequestSources,
    createAndSubmitPurchaseRequest
  } = useKitchenPurchaseRequestOperatorApi();

  const [requestedNote, setRequestedNote] = useState('');
  const [status, setStatus] = useState('');
  const [submitPopup, setSubmitPopup] = useState(null);
  const [selectedLines, setSelectedLines] = useState([]);
  const [showNewItemNote, setShowNewItemNote] = useState(false);
  const [expandedLineNotes, setExpandedLineNotes] = useState({});
  const [newItem, setNewItem] = useState({
    requested_item_name: '',
    requested_unit: 'pcs',
    requested_quantity: '',
    operator_note: ''
  });

  useEffect(() => {
    loadRequestSources();
  }, [loadRequestSources]);

  useEffect(() => {
    if (!submitPopup) return undefined;

    const timer = window.setTimeout(() => {
      setSubmitPopup(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [submitPopup]);

  const sectionData = useMemo(
    () => ({
      lowStockItems,
      shoppingList,
      recommendations
    }),
    [lowStockItems, shoppingList, recommendations]
  );

  const addExistingItem = (item) => {
    if (!item.inventory_item_id) {
      setStatus('This row cannot be added because the API did not return an inventory item id.');
      return;
    }

    setStatus('');
    setSelectedLines((prev) => {
      const existingIndex = prev.findIndex((line) => line.inventory_item_id === item.inventory_item_id && !line.is_new_item);
      if (existingIndex >= 0) {
            const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          requested_quantity: toDisplayQuantity(item.suggested_quantity) || next[existingIndex].requested_quantity,
          operator_note: next[existingIndex].operator_note || item.note || `${item.source} source`
        };
        return next;
      }

      return [
        ...prev,
        {
          local_id: createLocalLineId(),
          inventory_item_id: item.inventory_item_id,
          requested_item_name: item.name,
          requested_unit: item.unit || 'pcs',
          requested_quantity: toDisplayQuantity(item.suggested_quantity),
          is_new_item: false,
          operator_note: item.note || `${item.source} source`
        }
      ];
    });
  };

  const addNewItemLine = () => {
    if (!newItem.requested_item_name.trim() || !newItem.requested_unit.trim() || Number(newItem.requested_quantity) <= 0) {
      setStatus('Enter a valid new item name, unit, and quantity.');
      return;
    }

    setStatus('');
    setSelectedLines((prev) => [
      ...prev,
      {
        local_id: createLocalLineId(),
        inventory_item_id: '',
        requested_item_name: newItem.requested_item_name.trim(),
        requested_unit: newItem.requested_unit.trim(),
        requested_quantity: String(Number(newItem.requested_quantity)),
        is_new_item: true,
        operator_note: newItem.operator_note.trim()
      }
    ]);
    setNewItem({
      requested_item_name: '',
      requested_unit: 'pcs',
      requested_quantity: '',
      operator_note: ''
    });
    setShowNewItemNote(false);
  };

  const updateLine = (localId, field, value) => {
    setSelectedLines((prev) =>
      prev.map((line) => (line.local_id === localId ? { ...line, [field]: value } : line))
    );
  };

  const removeLine = (localId) => {
    setSelectedLines((prev) => prev.filter((line) => line.local_id !== localId));
    setExpandedLineNotes((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
  };

  const toggleLineNote = (localId) => {
    setExpandedLineNotes((prev) => ({
      ...prev,
      [localId]: !prev[localId]
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setSubmitPopup(null);

    if (!selectedLines.length) {
      setStatus('Add at least one request line before submitting.');
      return;
    }

    const invalidLine = selectedLines.find(
      (line) =>
        !line.requested_item_name.trim() ||
        !line.requested_unit.trim() ||
        Number(line.requested_quantity) <= 0 ||
        (!line.is_new_item && !line.inventory_item_id)
    );

    if (invalidLine) {
      setStatus('Every request line needs item name, unit, quantity, and an inventory id for existing items.');
      return;
    }

    const result = await createAndSubmitPurchaseRequest({
      requested_note: requestedNote.trim(),
      lines: selectedLines.map((line) => ({
        inventory_item_id: line.inventory_item_id || undefined,
        requested_item_name: line.requested_item_name.trim(),
        requested_unit: line.requested_unit.trim(),
        requested_quantity: Number(line.requested_quantity),
        is_new_item: line.is_new_item,
        operator_note: line.operator_note.trim()
      }))
    });

    if (result.ok) {
      const submittedNote = requestedNote.trim();
      const submittedRequestId = String(result.requestId || result.id || result.request_id || '');
      setSubmitPopup({
        requestId: submittedRequestId,
        requestedNote: submittedNote
      });
      setRequestedNote('');
      setSelectedLines([]);
      setExpandedLineNotes({});
      await loadRequestSources();
      return;
    }

    setStatus(result.message || 'Failed to submit stock request.');
  };

  return (
    <StorePageShell className="max-w-7xl">
      {submitPopup ? (
        <div className="fixed right-6 top-6 z-50 w-full max-w-md rounded-xl border border-emerald-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-emerald-700">Purchase request submitted</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Request Ref:</span>{' '}
                <span className="font-semibold text-slate-900">
                  {formatRequestReference(submitPopup.requestId)}
                </span>
              </div>
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Purchase request note:</span>{' '}
                {submitPopup.requestedNote || 'No note added'}
              </div>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
              onClick={() => setSubmitPopup(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      <StorePageHeader
        title="Create Purchase Request"
        description="Build the operator request from low-stock alerts, shopping list items, recommendations, and new items."
        actions={[
          <Button key="approved" asChild><Link to={`${basePath}/store-operator/approved-requests`}>Approved Requests</Link></Button>,
          <Button key="receipts" asChild variant="outline"><Link to={`${basePath}/store-operator/purchases`}>Purchase Receipts</Link></Button>
        ]}
        tone="emerald"
      />
      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {SOURCE_SECTIONS.map((section) => {
            const rows = sectionData[section.key];
            const scrollableTable = SOURCE_TABLE_SCROLLABLE_KEYS.has(section.key);
            const tableEl = (
              <Table
                wrapperClassName={
                  scrollableTable
                    ? 'relative w-full overflow-x-auto overflow-y-visible'
                    : undefined
                }
              >
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Suggested</TableHead>
                    <TableHead>Current / Min</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={`${section.key}-${item.id}`}>
                      <TableCell className="font-medium">{item.name || 'Unnamed item'}</TableCell>
                      <TableCell>{item.suggested_quantity || 0} {item.unit || '-'}</TableCell>
                      <TableCell>{item.current_quantity || 0} / {item.min_quantity || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addExistingItem(item)}
                          disabled={!item.inventory_item_id}
                        >
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
            return (
              <StoreSection
                key={section.key}
                title={section.title}
                tone={section.key === 'recommendations' ? 'violet' : section.key === 'shoppingList' ? 'amber' : 'emerald'}
                headerActions={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadRequestSources}
                    disabled={bootstrapLoading}
                  >
                    {bootstrapLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                }
              >
                {rows.length === 0 ? (
                  <StoreNotice tone="amber">{section.empty}</StoreNotice>
                ) : scrollableTable ? (
                  <div
                    className="overflow-y-auto overscroll-y-contain rounded-md border border-slate-200"
                    style={{ maxHeight: SOURCE_TABLE_SCROLL_MAX_HEIGHT }}
                  >
                    {tableEl}
                  </div>
                ) : (
                  tableEl
                )}
              </StoreSection>
            );
          })}
        </div>

        <StoreSection title="" tone="sky">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Add New Item</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                className="border rounded px-3 py-2"
                value={newItem.requested_item_name}
                onChange={(e) => setNewItem((prev) => ({ ...prev, requested_item_name: e.target.value }))}
                placeholder="Item name"
              />
              <input
                className="border rounded px-3 py-2"
                value={newItem.requested_unit}
                onChange={(e) => setNewItem((prev) => ({ ...prev, requested_unit: e.target.value }))}
                placeholder="Unit"
              />
              <input
                className="border rounded px-3 py-2"
                type="number"
                min="0"
                step="0.01"
                value={newItem.requested_quantity}
                onChange={(e) => setNewItem((prev) => ({ ...prev, requested_quantity: e.target.value }))}
                placeholder="Quantity"
              />
              <Button type="button" onClick={addNewItemLine}>
                Add New Item
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewItemNote((prev) => !prev)}
                >
                  {showNewItemNote ? 'Hide Note' : 'Add Note'}
                </Button>
              </div>
              {showNewItemNote ? (
                <textarea
                  className="min-h-16 w-full rounded border px-3 py-2 text-sm"
                  value={newItem.operator_note}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, operator_note: e.target.value }))}
                  placeholder="Operator note for the new item"
                />
              ) : null}
            </div>
          </div>

          <div>
            <textarea
              className="min-h-12 w-full rounded border px-3 py-2 text-sm"
              value={requestedNote}
              onChange={(e) => setRequestedNote(e.target.value)}
              placeholder="Requested note for this purchase request"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Selected Request Item</h2>
              <span className="text-sm text-gray-500">{selectedLines.length} line(s)</span>
            </div>
            {selectedLines.length === 0 ? (
              <p className="text-sm text-gray-500 mt-3">Add items from the source lists or the new-item form.</p>
            ) : (
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Operator Note</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedLines.map((line) => (
                      <TableRow key={line.local_id} className="align-top">
                        <TableCell>
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={line.requested_item_name}
                            onChange={(e) => updateLine(line.local_id, 'requested_item_name', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            className="border rounded px-2 py-1 w-24"
                            value={line.requested_unit}
                            onChange={(e) => updateLine(line.local_id, 'requested_unit', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            className="border rounded px-2 py-1 w-24"
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.requested_quantity}
                            onChange={(e) => updateLine(line.local_id, 'requested_quantity', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={line.is_new_item ? 'warning' : 'secondary'}>
                            {line.is_new_item ? 'New item' : 'Existing item'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => toggleLineNote(line.local_id)}
                            >
                              {expandedLineNotes[line.local_id]
                                ? 'Hide Note'
                                : line.operator_note?.trim()
                                  ? 'Edit Note'
                                  : 'Add Note'}
                            </Button>
                            {expandedLineNotes[line.local_id] ? (
                              <textarea
                                className="min-h-16 w-full rounded border px-2 py-1 text-sm"
                                value={line.operator_note}
                                onChange={(e) => updateLine(line.local_id, 'operator_note', e.target.value)}
                                placeholder="Operator note"
                              />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="link" onClick={() => removeLine(line.local_id)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? 'Submitting...' : 'Submit Purchase Request'}
            </Button>
          </div>
        </form>
        </StoreSection>
    </StorePageShell>
  );
};

const toDisplayQuantity = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
  return String(Number(value));
};

export default StoreOperatorPurchaseRequestPage;
