import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenPurchaseRequestOperatorApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreNotice, StorePageHeader, StoreSection } from '@/components/store/StorePageShell';
import { CreateInventoryItemSection } from '@/components/store/CreateInventoryItemSection';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';
import {
  PURCHASE_KIND,
  PURCHASE_KIND_META,
  PurchaseSourceItemCell,
  SOURCE_SECTIONS,
  SOURCE_TABLE_SCROLLABLE_KEYS,
  SOURCE_TABLE_SCROLL_MAX_HEIGHT,
  createLocalLineId,
  emptyKindBucket,
  formatRequestReference,
  purchaseTypeApi,
  toDisplayQuantity
} from '@/components/store/purchaseRequestShared';

/**
 * @feature kitchen-store — Weekly/daily purchase request composer (low stock + shopping list + submit).
 * @param {{ showOperatorHeader?: boolean; singleKind?: 'weekly'|'daily'|null; onSubmitted?: () => void }} props
 */
const PurchaseRequestCreateTabs = ({ showOperatorHeader = false, singleKind = null, onSubmitted }) => {
  const basePath = useCompanyBasePath();
  const {
    bootstrapLoading,
    submitLoading,
    error,
    lowStockItems,
    shoppingList,
    loadRequestSources,
    createAndSubmitPurchaseRequest
  } = useKitchenPurchaseRequestOperatorApi();

  const [buckets, setBuckets] = useState({
    [PURCHASE_KIND.WEEKLY]: emptyKindBucket(),
    [PURCHASE_KIND.DAILY]: emptyKindBucket()
  });

  const [status, setStatus] = useState('');
  const [submitPopup, setSubmitPopup] = useState(null);
  /** `${kind}:${sectionKey}` → search string for low stock / shopping list tables */
  const [sourceFilters, setSourceFilters] = useState({});

  const sourceFilterKey = (k, sectionKey) => `${k}:${sectionKey}`;
  const getSourceFilter = (k, sectionKey) => sourceFilters[sourceFilterKey(k, sectionKey)] ?? '';
  const setSourceFilter = (k, sectionKey, value) => {
    const key = sourceFilterKey(k, sectionKey);
    setSourceFilters((prev) => ({ ...prev, [key]: value }));
  };

  const patchBucket = useCallback((kind, updater) => {
    setBuckets((prev) => ({
      ...prev,
      [kind]: typeof updater === 'function' ? updater(prev[kind]) : { ...prev[kind], ...updater }
    }));
  }, []);

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
      shoppingList
    }),
    [lowStockItems, shoppingList]
  );

  const addExistingItem = (kind, item) => {
    if (!item.inventory_item_id) {
      const msg =
        'Could not match this row to a catalog item (name lookup failed). Refresh sources, or add it as a new item line.';
      setStatus(msg);
      showStoreError(msg, 'Cannot add this row');
      return;
    }

    setStatus('');
    patchBucket(kind, (bucket) => {
      const prev = bucket.selectedLines;
      const existingIndex = prev.findIndex(
        (line) => line.inventory_item_id === item.inventory_item_id && !line.is_new_item
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          requested_quantity: toDisplayQuantity(item.suggested_quantity) || next[existingIndex].requested_quantity,
          operator_note: next[existingIndex].operator_note || item.note || `${item.source} source`,
          brand_name: next[existingIndex].brand_name || item.brand_name || '',
          brand_logo_s3_url: next[existingIndex].brand_logo_s3_url || item.brand_logo_s3_url || '',
          freshness_priority:
            kind === PURCHASE_KIND.DAILY
              ? next[existingIndex].freshness_priority || 'NORMAL'
              : next[existingIndex].freshness_priority || ''
        };
        return { ...bucket, selectedLines: next };
      }

      return {
        ...bucket,
        selectedLines: [
          ...prev,
          {
            local_id: createLocalLineId(),
            inventory_item_id: item.inventory_item_id,
            requested_item_name: item.name,
            requested_unit: item.unit || 'pcs',
            requested_quantity: toDisplayQuantity(item.suggested_quantity),
            is_new_item: false,
            operator_note: item.note || `${item.source} source`,
            brand_name: item.brand_name || '',
            brand_logo_s3_url: item.brand_logo_s3_url || '',
            freshness_priority: kind === PURCHASE_KIND.DAILY ? 'NORMAL' : ''
          }
        ]
      };
    });
  };

  const onInventoryItemCreated = (kind, { itemId, name, unit }) => {
    setStatus('');
    if (!itemId) {
      const msg =
        'Item was created but the catalog id was not returned. Refresh sources and add the item from the list.';
      setStatus(msg);
      showStoreError(msg, 'Missing item id');
      return;
    }

    patchBucket(kind, (bucket) => {
      const prev = bucket.selectedLines;
      const existingIndex = prev.findIndex((line) => line.inventory_item_id === itemId && !line.is_new_item);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          requested_item_name: name || next[existingIndex].requested_item_name,
          requested_unit: unit || next[existingIndex].requested_unit,
          requested_quantity: next[existingIndex].requested_quantity || '1',
          operator_note: next[existingIndex].operator_note?.trim()
            ? next[existingIndex].operator_note
            : 'Added after creating catalog item',
          freshness_priority:
            kind === PURCHASE_KIND.DAILY
              ? next[existingIndex].freshness_priority || 'NORMAL'
              : next[existingIndex].freshness_priority || ''
        };
        return { ...bucket, selectedLines: next };
      }
      return {
        ...bucket,
        selectedLines: [
          ...prev,
          {
            local_id: createLocalLineId(),
            inventory_item_id: itemId,
            requested_item_name: name,
            requested_unit: unit || 'pcs',
            requested_quantity: '1',
            is_new_item: false,
            operator_note: 'Added after creating catalog item',
            freshness_priority: kind === PURCHASE_KIND.DAILY ? 'NORMAL' : ''
          }
        ]
      };
    });
    const tabLabel = PURCHASE_KIND_META[kind]?.label || 'This request';
    showStoreSuccess(
      `New catalog item added to ${tabLabel.toLowerCase()} (qty 1 — adjust if needed).`,
      'Added to request'
    );
    loadRequestSources();
  };

  const updateLine = (kind, localId, field, value) => {
    patchBucket(kind, (bucket) => ({
      ...bucket,
      selectedLines: bucket.selectedLines.map((line) =>
        line.local_id === localId ? { ...line, [field]: value } : line
      )
    }));
  };

  const removeLine = (kind, localId) => {
    patchBucket(kind, (bucket) => ({
      ...bucket,
      selectedLines: bucket.selectedLines.filter((line) => line.local_id !== localId),
      expandedLineNotes: (() => {
        const next = { ...bucket.expandedLineNotes };
        delete next[localId];
        return next;
      })()
    }));
  };

  const toggleLineNote = (kind, localId) => {
    patchBucket(kind, (bucket) => ({
      ...bucket,
      expandedLineNotes: {
        ...bucket.expandedLineNotes,
        [localId]: !bucket.expandedLineNotes[localId]
      }
    }));
  };

  const onSubmit = async (e, kind) => {
    e.preventDefault();
    setStatus('');
    setSubmitPopup(null);

    const { requestedNote, selectedLines, forDate, urgency } = buckets[kind];

    if (!selectedLines.length) {
      const msg = 'Add at least one request line before submitting.';
      setStatus(msg);
      showStoreError(msg, 'Nothing to submit');
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
      const msg =
        'Every request line needs item name, unit, quantity, and an inventory id for existing items.';
      setStatus(msg);
      showStoreError(msg, 'Fix your lines');
      return;
    }

    const requested_note =
      requestedNote.trim() ||
      (kind === PURCHASE_KIND.WEEKLY ? 'Weekly purchase request' : 'Daily purchase request');

    const result = await createAndSubmitPurchaseRequest({
      requested_note,
      purchase_type: purchaseTypeApi(kind),
      for_date: forDate,
      urgency,
      lines: selectedLines.map((line) => ({
        inventory_item_id: line.inventory_item_id || undefined,
        requested_item_name: line.requested_item_name.trim(),
        requested_unit: line.requested_unit.trim(),
        requested_quantity: Number(line.requested_quantity),
        is_new_item: line.is_new_item,
        operator_note: line.operator_note.trim(),
        ...(kind === PURCHASE_KIND.DAILY ? { freshness_priority: line.freshness_priority || 'NORMAL' } : {})
      }))
    });

    if (result.ok) {
      const submittedRequestId = String(result.requestId || result.id || result.request_id || '');
      setSubmitPopup({
        requestId: submittedRequestId,
        requestedNote,
        kindLabel: PURCHASE_KIND_META[kind].label
      });
      showStoreSuccess(
        `${PURCHASE_KIND_META[kind].label}: reference ${formatRequestReference(submittedRequestId)} submitted for manager review.`,
        'Request submitted'
      );
      patchBucket(kind, () => emptyKindBucket());
      await loadRequestSources();
      try {
        await onSubmitted?.();
      } catch {
        /* optional parent refresh */
      }
      return;
    }

    const failMsg = result.message || 'Failed to submit stock request.';
    setStatus(failMsg);
    showStoreError(failMsg, 'Submit failed');
  };

  const renderSourceGrid = (kind) => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {SOURCE_SECTIONS.map((section) => {
        const allRows = sectionData[section.key];
        const q = getSourceFilter(kind, section.key).trim().toLowerCase();
        const rows =
          !q || !allRows.length
            ? allRows
            : allRows.filter((item) => {
                const name = String(item.name || '').toLowerCase();
                const brand = String(item.brand_name || '').toLowerCase();
                return name.includes(q) || brand.includes(q);
              });
        const scrollableTable = SOURCE_TABLE_SCROLLABLE_KEYS.has(section.key);
        const tableEl = (
          <Table
            wrapperClassName={
              scrollableTable ? 'relative w-full overflow-x-auto overflow-y-visible' : undefined
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
                <TableRow key={`${kind}-${section.key}-${item.id}`}>
                  <TableCell>
                    <PurchaseSourceItemCell
                      name={item.name}
                      brandName={item.brand_name}
                      logoUrl={item.brand_logo_s3_url}
                    />
                  </TableCell>
                  <TableCell>
                    {item.suggested_quantity || 0} {item.unit || '-'}
                  </TableCell>
                  <TableCell>
                    {item.current_quantity || 0} / {item.min_quantity || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addExistingItem(kind, item)}
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
            key={`${kind}-${section.key}`}
            title={section.title}
            tone={section.key === 'shoppingList' ? 'amber' : 'emerald'}
            headerActions={[
              <input
                key="filter"
                type="search"
                className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm sm:max-w-[11rem]"
                placeholder="Search by name…"
                value={getSourceFilter(kind, section.key)}
                onChange={(e) => setSourceFilter(kind, section.key, e.target.value)}
                aria-label={`Filter ${section.title} by item or brand name`}
              />,
              <Button
                key="refresh"
                type="button"
                variant="outline"
                size="sm"
                onClick={loadRequestSources}
                disabled={bootstrapLoading}
              >
                {bootstrapLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            ]}
          >
            {allRows.length === 0 ? (
              <StoreNotice tone="amber">{section.empty}</StoreNotice>
            ) : rows.length === 0 ? (
              <StoreNotice tone="amber">No items match this search.</StoreNotice>
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
  );

  const renderKindPanel = (kind) => {
    const meta = PURCHASE_KIND_META[kind];
    const bucket = buckets[kind];
    const { requestedNote, selectedLines, expandedLineNotes, forDate, urgency } = bucket;

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{meta.blurb}</p>
        {renderSourceGrid(kind)}
        <details className="rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-800">
            Create inventory item
          </summary>
          <div className="mt-3 border-t border-slate-200/70 pt-3">
            <CreateInventoryItemSection
              embedded
              idPrefix={`purchase-request-${kind}`}
              description="Create the catalog item here first, then it is added to the active tab's purchase request with quantity 1 (edit qty in the table below)."
              onItemCreated={(payload) => onInventoryItemCreated(kind, payload)}
              showPrimaryImage={false}
            />
          </div>
        </details>
        <StoreSection title="" tone={meta.formSectionTone}>
          <form onSubmit={(e) => onSubmit(e, kind)} className="space-y-4">
            <div>
              <textarea
                className="min-h-12 w-full rounded border px-3 py-2 text-sm"
                value={requestedNote}
                onChange={(e) => patchBucket(kind, { requestedNote: e.target.value })}
                placeholder={`Note for manager (${meta.label.toLowerCase()})`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-700">For date</span>
                <input
                  type="date"
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={forDate}
                  onChange={(e) => patchBucket(kind, { forDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Urgency</span>
                <select
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={urgency}
                  onChange={(e) => patchBucket(kind, { urgency: e.target.value })}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="URGENT">URGENT</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Selected request lines</h2>
                <span className="text-sm text-gray-500">{selectedLines.length} line(s)</span>
              </div>
              {selectedLines.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  Add lines from the lists above for this tab, or create a catalog item and it will appear here.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Qty</TableHead>
                      {kind === PURCHASE_KIND.DAILY ? <TableHead>Freshness</TableHead> : null}
                      <TableHead>Type</TableHead>
                      <TableHead>Operator Note</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedLines.map((line) => (
                      <TableRow key={line.local_id} className="align-top">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              {line.brand_logo_s3_url ? (
                                <img
                                  src={line.brand_logo_s3_url}
                                  alt=""
                                  className="mt-0.5 h-8 w-8 shrink-0 rounded border border-slate-200 bg-white object-contain"
                                />
                              ) : null}
                              <input
                                className="min-w-0 flex-1 rounded border px-2 py-1"
                                value={line.requested_item_name}
                                onChange={(e) =>
                                  updateLine(kind, line.local_id, 'requested_item_name', e.target.value)
                                }
                              />
                            </div>
                            {line.brand_name ? (
                              <div className="text-xs text-slate-500">{line.brand_name}</div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <input
                            className="w-24 rounded border px-2 py-1"
                            value={line.requested_unit}
                            onChange={(e) =>
                              updateLine(kind, line.local_id, 'requested_unit', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            className="w-24 rounded border px-2 py-1"
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.requested_quantity}
                            onChange={(e) =>
                              updateLine(kind, line.local_id, 'requested_quantity', e.target.value)
                            }
                          />
                        </TableCell>
                        {kind === PURCHASE_KIND.DAILY ? (
                          <TableCell>
                            <select
                              className="w-full min-w-[7rem] rounded border px-2 py-1 text-sm"
                              value={line.freshness_priority || 'NORMAL'}
                              onChange={(e) =>
                                updateLine(kind, line.local_id, 'freshness_priority', e.target.value)
                              }
                            >
                              <option value="NORMAL">NORMAL</option>
                              <option value="URGENT">URGENT</option>
                              <option value="CRITICAL">CRITICAL</option>
                            </select>
                          </TableCell>
                        ) : null}
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
                              onClick={() => toggleLineNote(kind, line.local_id)}
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
                                onChange={(e) =>
                                  updateLine(kind, line.local_id, 'operator_note', e.target.value)
                                }
                                placeholder="Operator note"
                              />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="link" onClick={() => removeLine(kind, line.local_id)}>
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
                {submitLoading ? 'Submitting...' : `Submit ${meta.label}`}
              </Button>
            </div>
          </form>
        </StoreSection>
      </div>
    );
  };

  const locked =
    singleKind === PURCHASE_KIND.WEEKLY || singleKind === PURCHASE_KIND.DAILY ? singleKind : null;

  return (
    <>
      {submitPopup ? (
        <div className="fixed right-6 top-6 z-50 w-full max-w-md rounded-xl border border-emerald-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-emerald-700">Purchase request submitted</p>
              {submitPopup.kindLabel ? (
                <p className="text-xs font-medium text-slate-600">{submitPopup.kindLabel}</p>
              ) : null}
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
      {showOperatorHeader ? (
        <StorePageHeader
          title="Create Purchase Request"
          description="Weekly vs daily requests send purchase type, for date, and urgency to the API. Daily lines can set freshness priority."
          actions={[
            <Button key="approved" asChild>
              <Link to={`${basePath}/store-operator/approved-requests`}>Approved Requests</Link>
            </Button>,
            <Button key="receipts" asChild variant="outline">
              <Link to={`${basePath}/store-operator/purchases`}>Purchase Receipts</Link>
            </Button>
          ]}
          tone="emerald"
        />
      ) : null}
      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      {locked ? (
        <div className="w-full">{renderKindPanel(locked)}</div>
      ) : (
        <Tabs defaultValue={PURCHASE_KIND.WEEKLY} className="w-full">
          <div
            className="mb-6 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 via-white to-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:p-5"
            role="group"
            aria-labelledby="purchase-type-heading"
          >
            <div className="mb-4 max-w-2xl">
              <h2
                id="purchase-type-heading"
                className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
              >
                Purchase type
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Choose weekly or daily before adding items. Each type is a separate request for manager review.
              </p>
            </div>
            <TabsList className="grid h-auto w-full grid-cols-1 gap-3 rounded-none bg-transparent p-0 sm:grid-cols-2">
              <TabsTrigger
                value={PURCHASE_KIND.WEEKLY}
                className="flex h-auto min-h-[5.25rem] flex-col items-start justify-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-left text-sm font-medium shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50/90 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 data-[state=active]:border-emerald-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-950 data-[state=active]:shadow-md data-[state=active]:hover:bg-emerald-50 sm:min-h-[4.75rem] sm:px-5 sm:py-4"
              >
                <span className="text-base font-semibold sm:text-[1.0625rem]">
                  {PURCHASE_KIND_META[PURCHASE_KIND.WEEKLY].label}
                </span>
                <span className="text-xs font-normal leading-snug text-slate-600">
                  Planned or bulk replenishment for the week.
                </span>
              </TabsTrigger>
              <TabsTrigger
                value={PURCHASE_KIND.DAILY}
                className="flex h-auto min-h-[5.25rem] flex-col items-start justify-center gap-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-left text-sm font-medium shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50/90 focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-950 data-[state=active]:shadow-md data-[state=active]:hover:bg-violet-50 sm:min-h-[4.75rem] sm:px-5 sm:py-4"
              >
                <span className="text-base font-semibold sm:text-[1.0625rem]">
                  {PURCHASE_KIND_META[PURCHASE_KIND.DAILY].label}
                </span>
                <span className="text-xs font-normal leading-snug text-slate-600">
                  Same-day or short-cycle needs; freshness can be set per line.
                </span>
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={PURCHASE_KIND.WEEKLY} className="mt-3 space-y-4 focus-visible:ring-offset-0">
            {renderKindPanel(PURCHASE_KIND.WEEKLY)}
          </TabsContent>
          <TabsContent value={PURCHASE_KIND.DAILY} className="mt-3 space-y-4 focus-visible:ring-offset-0">
            {renderKindPanel(PURCHASE_KIND.DAILY)}
          </TabsContent>
        </Tabs>
      )}
    </>
  );
};

export default PurchaseRequestCreateTabs;
