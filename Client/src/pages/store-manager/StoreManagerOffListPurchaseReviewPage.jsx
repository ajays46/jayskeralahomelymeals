import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { PurchaseReceiptLineImages } from '@/components/store/PurchaseReceiptLineImages';
import { ReceiptLineBrandCell } from '@/components/store/ReceiptLineBrandCell';
import { cn } from '@/lib/utils';
import { useCompanyBasePath } from '../../context/TenantContext';
import {
  purchaseReceiptHasInvoice,
  purchaseReceiptHasItemsPhoto,
  useKitchenPurchaseExceptionManagerApi,
  useKitchenReceiptsApi
} from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_MANAGER: off-list purchase exceptions / bulk review. */

const ACTION_OPTIONS = ['KEEP', 'RETURN', 'INVESTIGATE', 'REJECT'];

/** Columns without Off-list reason: Image, Item, Brand, Receipt, Qty, Price, Status, Action, Note, Approve. */
const BASE_PENDING_TABLE_COLS = 10;

function shortId(id) {
  const s = String(id || '');
  if (s.length <= 12) return s || '—';
  return `${s.slice(0, 8)}…`;
}

function formatPrice(value) {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Group lines by receipt; preserve receipt order as first seen in the list. */
function groupPendingByReceipt(rows) {
  const byReceipt = new Map();
  const order = [];
  for (const row of rows) {
    const rid = row.receipt_id || '';
    if (!byReceipt.has(rid)) {
      byReceipt.set(rid, []);
      order.push(rid);
    }
    byReceipt.get(rid).push(row);
  }
  return order.map((receiptId) => ({ receiptId, rows: byReceipt.get(receiptId) }));
}

/** One item row: action, note, Save line only. */
function PendingReviewRow({
  row,
  showOffListReasonColumn,
  actionLoading,
  busyKey,
  setBusyKey,
  submitManagerReview,
  onRefreshed,
  getBrandLogoViewUrl
}) {
  const [action, setAction] = useState('KEEP');
  const [note, setNote] = useState('');
  const lineKey = `line:${row.id}`;

  const saveLine = async (e) => {
    e?.stopPropagation?.();
    setBusyKey(lineKey);
    const result = await submitManagerReview(row.receipt_id, row.id, {
      manager_action: action,
      manager_action_note: note.trim() || undefined
    });
    setBusyKey('');
    if (!result.ok) {
      const msg = result.message || 'Save failed.';
      showStoreError(msg, 'Save failed');
      await onRefreshed(msg);
      return;
    }
    setNote('');
    showStoreSuccess('Line review saved.', 'Saved');
    await onRefreshed();
  };

  const lineBusy = actionLoading && busyKey === lineKey;

  return (
    <TableRow className="align-top">
      <TableCell className="w-[1%] align-middle">
        <PurchaseReceiptLineImages
          catalogUrl={row.item_primary_image_url}
          dockUrl={row.image_s3_url}
          dockUploadedAt={row.image_uploaded_at}
          size="sm"
        />
      </TableCell>
      <TableCell className="max-w-[14rem] font-medium">{row.inventory_item_name || '—'}</TableCell>
      <TableCell>
        <ReceiptLineBrandCell row={row} getBrandLogoViewUrl={getBrandLogoViewUrl} />
      </TableCell>
      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600" title={row.receipt_id}>
        {shortId(row.receipt_id)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {row.purchased_qty} {row.purchase_unit || ''}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right text-sm tabular-nums">
        {formatPrice(row.line_total)}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-normal">
          {row.comparison_status || row.manager_review_status || 'PENDING'}
        </Badge>
      </TableCell>
      {showOffListReasonColumn ? (
        <TableCell className="max-w-[14rem] text-sm text-slate-700" title={row.off_list_purchase_reason || undefined}>
          {row.off_list_purchase_reason?.trim() ? (
            <span className="line-clamp-2">{row.off_list_purchase_reason}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </TableCell>
      ) : null}
      <TableCell className="min-w-[7.5rem]">
        <select
          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          aria-label={`Action for ${row.inventory_item_name || 'line'}`}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCell className="min-w-[8rem] max-w-[12rem]">
        <input
          type="text"
          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button type="button" size="sm" disabled={actionLoading} onClick={saveLine}>
          {lineBusy ? '…' : 'Approve'}
        </Button>
      </TableCell>
    </TableRow>
  );
}

/** Single bulk row after all lines for a receipt (only when 2+ lines). */
function ReceiptBulkRow({
  receiptId,
  lineCount,
  tableColCount,
  actionLoading,
  busyKey,
  setBusyKey,
  submitManagerReviewBulk,
  onRefreshed
}) {
  const [action, setAction] = useState('KEEP');
  const [note, setNote] = useState('');
  const receiptKey = `receipt:${receiptId}`;

  const saveWholeReceipt = async () => {
    if (!receiptId || lineCount <= 1) return;
    setBusyKey(receiptKey);
    const result = await submitManagerReviewBulk(receiptId, {
      manager_action: action,
      manager_action_note: note.trim() || undefined
    });
    setBusyKey('');
    if (!result.ok) {
      const msg = result.message || 'Bulk save failed.';
      showStoreError(msg, 'Bulk save failed');
      await onRefreshed(msg);
      return;
    }
    setNote('');
    showStoreSuccess('All lines on this receipt were updated.', 'Saved');
    await onRefreshed();
  };

  const receiptBusy = actionLoading && busyKey === receiptKey;

  return (
    <TableRow className="border-t border-slate-200 bg-slate-50/80">
      <TableCell colSpan={tableColCount} className="py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <p className="min-w-0 flex-1 text-sm text-slate-700">
            <span className="font-medium">Receipt</span>{' '}
            <span className="font-mono text-xs text-slate-600" title={receiptId}>
              {shortId(receiptId)}
            </span>
            <span className="text-slate-500"> — Approve all {lineCount} pending list</span>
          </p>
          <select
            className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm sm:w-40"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            aria-label={`Bulk action for receipt ${receiptId}`}
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="min-w-[10rem] flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm sm:max-w-xs"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
          />
          <Button type="button" size="sm" variant="outline" disabled={actionLoading} onClick={saveWholeReceipt}>
            {receiptBusy ? '…' : 'Approve all'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

const StoreManagerOffListPurchaseReviewPage = () => {
  const basePath = useCompanyBasePath();
  const {
    listLoading,
    actionLoading,
    error,
    pendingExceptions,
    listPendingExceptions,
    submitManagerReview,
    submitManagerReviewBulk
  } = useKitchenPurchaseExceptionManagerApi();
  const { viewReceiptInvoiceInNewTab, openReceiptItemsPhotoInNewTab, getBrandLogoViewUrl } = useKitchenReceiptsApi();
  const [status, setStatus] = useState('');
  const [pendingScope, setPendingScope] = useState('all');
  const [busyKey, setBusyKey] = useState('');
  const [invoiceUrlLoadingId, setInvoiceUrlLoadingId] = useState('');
  const [itemsPhotoUrlLoadingId, setItemsPhotoUrlLoadingId] = useState('');

  useEffect(() => {
    listPendingExceptions({ pending_scope: pendingScope });
  }, [listPendingExceptions, pendingScope]);

  const segments = useMemo(() => groupPendingByReceipt(pendingExceptions), [pendingExceptions]);
  const showOffListReasonColumn = useMemo(
    () => pendingExceptions.some((row) => String(row.off_list_purchase_reason || '').trim().length > 0),
    [pendingExceptions]
  );
  const pendingTableColCount = BASE_PENDING_TABLE_COLS + (showOffListReasonColumn ? 1 : 0);
  const scrollPendingTable = pendingExceptions.length > 6;

  const refresh = async (errorMessage) => {
    if (errorMessage) {
      setStatus(errorMessage);
      return;
    }
    setStatus('');
    await listPendingExceptions({ pending_scope: pendingScope });
  };

  const openReceiptInvoice = async (receiptId) => {
    if (!receiptId) return;
    setInvoiceUrlLoadingId(receiptId);
    try {
      await viewReceiptInvoiceInNewTab(receiptId);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Could not open invoice.';
      setStatus(msg);
      showStoreError(msg, status === 404 ? 'No invoice attached' : 'View invoice failed');
    } finally {
      setInvoiceUrlLoadingId('');
    }
  };

  const openReceiptItemsPhoto = async (receiptId) => {
    if (!receiptId) return;
    setItemsPhotoUrlLoadingId(receiptId);
    try {
      await openReceiptItemsPhotoInNewTab(receiptId);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Could not open purchased-items photo.';
      setStatus(msg);
      showStoreError(msg, status === 404 ? 'No items photo' : 'View items photo failed');
    } finally {
      setItemsPhotoUrlLoadingId('');
    }
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Purchase Manager Review"
        description="Each line has Save line. When a receipt has several pending lines, one Save receipt row appears below those lines to update them all at once."
        actions={[
          <Button key="inbox" asChild>
            <Link to={`${basePath}/store-manager/purchase-requests`}>Purchase Request Inbox</Link>
          </Button>,
          <Button
            key="refresh"
            type="button"
            variant="outline"
            onClick={() => refresh()}
            disabled={listLoading}
          >
            {listLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        ]}
        tone="violet"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-600">Show:</span>
        <select
          className="rounded border border-slate-200 bg-white px-3 py-2 text-sm"
          value={pendingScope}
          onChange={(e) => setPendingScope(e.target.value)}
          aria-label="Queue filter"
        >
          <option value="all">All pending</option>
          <option value="exceptions">Exceptions only</option>
        </select>
      </div>

      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="rose">{status}</StoreNotice> : null}

      <StoreSection title="Pending List" tone="amber">
        {pendingExceptions.length === 0 ? (
          <StoreNotice tone="sky">Nothing waiting for review.</StoreNotice>
        ) : (
          <div
            className={cn(
              'overflow-x-auto',
              scrollPendingTable &&
                'max-h-[min(72vh,26rem)] overflow-y-auto rounded-md border border-slate-200/90'
            )}
          >
            <Table wrapperClassName={scrollPendingTable ? 'relative w-full' : undefined}>
              <TableHeader
                className={cn(
                  scrollPendingTable &&
                    'sticky top-0 z-[1] border-b bg-background/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-background/80'
                )}
              >
                <TableRow>
                  <TableHead className="w-[1%] whitespace-nowrap">Image</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  {showOffListReasonColumn ? <TableHead>Off-list reason</TableHead> : null}
                  <TableHead>Action</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Approve individually</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map(({ receiptId, rows }) => (
                  <React.Fragment key={receiptId || 'no-receipt'}>
                    {receiptId &&
                    (rows.some((r) => purchaseReceiptHasInvoice(r)) ||
                      rows.some((r) => purchaseReceiptHasItemsPhoto(r))) ? (
                      <TableRow className="bg-slate-50/90">
                        <TableCell colSpan={pendingTableColCount} className="py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-600">
                              Receipt{' '}
                              <span className="font-mono text-xs text-slate-800" title={receiptId}>
                                {shortId(receiptId)}
                              </span>
                            </span>
                            {rows.some((r) => purchaseReceiptHasInvoice(r)) ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={invoiceUrlLoadingId === receiptId}
                                onClick={() => openReceiptInvoice(receiptId)}
                              >
                                {invoiceUrlLoadingId === receiptId ? 'Opening…' : 'View invoice'}
                              </Button>
                            ) : null}
                            {rows.some((r) => purchaseReceiptHasItemsPhoto(r)) ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={itemsPhotoUrlLoadingId === receiptId}
                                onClick={() => openReceiptItemsPhoto(receiptId)}
                              >
                                {itemsPhotoUrlLoadingId === receiptId ? 'Opening…' : 'View items photo'}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {rows.map((row) => (
                      <PendingReviewRow
                        key={row.id}
                        row={row}
                        showOffListReasonColumn={showOffListReasonColumn}
                        actionLoading={actionLoading}
                        busyKey={busyKey}
                        setBusyKey={setBusyKey}
                        submitManagerReview={submitManagerReview}
                        onRefreshed={refresh}
                        getBrandLogoViewUrl={getBrandLogoViewUrl}
                      />
                    ))}
                    {receiptId && rows.length > 1 ? (
                      <ReceiptBulkRow
                        receiptId={receiptId}
                        lineCount={rows.length}
                        tableColCount={pendingTableColCount}
                        actionLoading={actionLoading}
                        busyKey={busyKey}
                        setBusyKey={setBusyKey}
                        submitManagerReviewBulk={submitManagerReviewBulk}
                        onRefreshed={refresh}
                      />
                    ) : null}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerOffListPurchaseReviewPage;
