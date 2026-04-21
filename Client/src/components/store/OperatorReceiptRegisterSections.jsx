import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StoreSection } from '@/components/store/StorePageShell';
import { ReceiptLineBrandCell } from '@/components/store/ReceiptLineBrandCell';
import {
  formatKitchenStoreApiError,
  purchaseReceiptHasInvoice,
  purchaseReceiptHasItemsPhoto,
  useKitchenReceiptsApi
} from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — Receipt register table + received lines (operator). */

const EXPLICIT_TZ_REGEX = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

function parseKitchenTimestampForIST(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  if (EXPLICIT_TZ_REGEX.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  let normalized = s;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    normalized = s.replace(' ', 'T');
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
    const d = new Date(`${normalized}+05:30`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T12:00:00+05:30`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTimeIST(iso) {
  const d = parseKitchenTimestampForIST(iso);
  if (!d) return '—';
  const datePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart}, ${timePart}`;
}

/**
 * @param {string} [purchaseRequestId] — When set, receipts are scoped to this request (matches purchase receipts page).
 * @param {(receiptId: string) => void} [onActiveReceiptChange] — Called when the operator opens a receipt’s lines.
 */
export const OperatorReceiptRegisterSections = forwardRef(function OperatorReceiptRegisterSections(
  { purchaseRequestId = '', onActiveReceiptChange, emptyHistoryHint },
  ref
) {
  const {
    listReceipts,
    listReceiptLines,
    viewReceiptInvoiceInNewTab,
    openReceiptItemsPhotoInNewTab,
    getBrandLogoViewUrl
  } = useKitchenReceiptsApi();

  const [history, setHistory] = useState([]);
  const [receiptRegisterQuery, setReceiptRegisterQuery] = useState('');
  const [receiptRegisterAttachFilter, setReceiptRegisterAttachFilter] = useState('all');
  const [selectedLines, setSelectedLines] = useState([]);
  const [invoiceUrlLoadingId, setInvoiceUrlLoadingId] = useState('');
  const [itemsPhotoUrlLoadingId, setItemsPhotoUrlLoadingId] = useState('');

  const loadReceiptHistory = useCallback(async () => {
    try {
      const out = purchaseRequestId
        ? await listReceipts({ purchase_request_id: purchaseRequestId })
        : await listReceipts();
      setHistory(Array.isArray(out) ? out : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt history.';
      showStoreError(msg, 'Could not load receipts');
    }
  }, [listReceipts, purchaseRequestId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const out = purchaseRequestId
          ? await listReceipts({ purchase_request_id: purchaseRequestId })
          : await listReceipts();
        if (!cancelled) setHistory(Array.isArray(out) ? out : []);
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt history.';
          showStoreError(msg, 'Could not load receipts');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listReceipts, purchaseRequestId]);

  const filteredReceiptRegister = useMemo(() => {
    const q = receiptRegisterQuery.trim().toLowerCase();
    return history.filter((row) => {
      const refStr = String(row.reference_invoice || '').toLowerCase();
      const rid = String(row.id || row.receipt_id || '').toLowerCase();
      const reqId = String(row.purchase_request_id || '').toLowerCase();
      if (q && !refStr.includes(q) && !rid.includes(q) && !reqId.includes(q)) return false;
      const hasInv = purchaseReceiptHasInvoice(row);
      const hasPhoto = purchaseReceiptHasItemsPhoto(row);
      switch (receiptRegisterAttachFilter) {
        case 'invoice_yes':
          if (!hasInv) return false;
          break;
        case 'invoice_no':
          if (hasInv) return false;
          break;
        case 'photo_yes':
          if (!hasPhoto) return false;
          break;
        case 'photo_no':
          if (hasPhoto) return false;
          break;
        case 'both':
          if (!hasInv || !hasPhoto) return false;
          break;
        default:
          break;
      }
      return true;
    });
  }, [history, receiptRegisterQuery, receiptRegisterAttachFilter]);

  const receiptRegisterFiltersActive =
    receiptRegisterQuery.trim() !== '' || receiptRegisterAttachFilter !== 'all';

  const openReceiptLines = useCallback(
    async (receiptId) => {
      if (!receiptId) return;
      onActiveReceiptChange?.(receiptId);
      try {
        const rows = await listReceiptLines(receiptId);
        setSelectedLines(rows);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt lines.';
        showStoreError(msg, 'Could not load receipt lines');
      }
    },
    [listReceiptLines, onActiveReceiptChange]
  );

  const openReceiptInvoice = async (receiptId) => {
    if (!receiptId) return;
    setInvoiceUrlLoadingId(receiptId);
    try {
      await viewReceiptInvoiceInNewTab(receiptId);
    } catch (err) {
      const status = err?.response?.status;
      const msg = formatKitchenStoreApiError(err, 'Could not open invoice.');
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
      const msg = formatKitchenStoreApiError(err, 'Could not open purchased-items photo.');
      showStoreError(msg, status === 404 ? 'No items photo' : 'View items photo failed');
    } finally {
      setItemsPhotoUrlLoadingId('');
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      reloadHistory: loadReceiptHistory,
      openReceiptLines,
    }),
    [loadReceiptHistory, openReceiptLines]
  );

  return (
    <>
      <StoreSection
        title="Receipt Register"
        tone="sky"
        headerActions={
          <Button type="button" variant="outline" onClick={loadReceiptHistory}>
            Refresh Register
          </Button>
        }
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 space-y-1 sm:max-w-xs">
            <label htmlFor="receipt-register-search" className="block text-xs font-medium text-slate-700">
              Search
            </label>
            <Input
              id="receipt-register-search"
              value={receiptRegisterQuery}
              onChange={(e) => setReceiptRegisterQuery(e.target.value)}
              placeholder="Invoice ref, receipt id, request id…"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="receipt-register-attach" className="block text-xs font-medium text-slate-700">
              Attachments
            </label>
            <select
              id="receipt-register-attach"
              className="flex h-9 w-full min-w-[11rem] rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500 sm:w-auto"
              value={receiptRegisterAttachFilter}
              onChange={(e) => setReceiptRegisterAttachFilter(e.target.value)}
            >
              <option value="all">All receipts</option>
              <option value="invoice_yes">Has invoice</option>
              <option value="invoice_no">Missing invoice</option>
              <option value="photo_yes">Has items photo</option>
              <option value="photo_no">Missing items photo</option>
              <option value="both">Invoice & items photo</option>
            </select>
          </div>
          {receiptRegisterFiltersActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 text-slate-600"
              onClick={() => {
                setReceiptRegisterQuery('');
                setReceiptRegisterAttachFilter('all');
              }}
            >
              Clear filters
            </Button>
          ) : null}
          <p className="text-xs text-slate-500 sm:ml-auto sm:self-end">
            Showing {filteredReceiptRegister.length} of {history.length}
          </p>
        </div>
        <div className="max-h-[330px] overflow-y-auto rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ref</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Items photo</TableHead>
                <TableHead>Invoice uploaded</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceiptRegister.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                    {history.length === 0
                      ? emptyHistoryHint ?? 'No receipts yet. Create a receipt above.'
                      : 'No receipts match your filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceiptRegister.map((row) => (
                  <TableRow key={row.id || row.receipt_id}>
                    <TableCell>{row.reference_invoice || '-'}</TableCell>
                    <TableCell className="max-w-36">
                      {purchaseReceiptHasInvoice(row) ? (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto px-0 text-sky-700"
                          disabled={invoiceUrlLoadingId === (row.id || row.receipt_id)}
                          onClick={() => openReceiptInvoice(row.id || row.receipt_id)}
                        >
                          {invoiceUrlLoadingId === (row.id || row.receipt_id) ? 'Opening…' : 'View'}
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="max-w-36">
                      {purchaseReceiptHasItemsPhoto(row) ? (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto px-0 text-teal-700"
                          disabled={itemsPhotoUrlLoadingId === (row.id || row.receipt_id)}
                          onClick={() => openReceiptItemsPhoto(row.id || row.receipt_id)}
                        >
                          {itemsPhotoUrlLoadingId === (row.id || row.receipt_id) ? 'Opening…' : 'View'}
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{formatDateTimeIST(row.invoice_uploaded_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openReceiptLines(row.id || row.receipt_id)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </StoreSection>

      <StoreSection title="Received Item" tone="amber">
        {selectedLines.length === 0 ? (
          <StoreNotice tone="amber">Open a receipt to view received item lines.</StoreNotice>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Purchased Qty</TableHead>
                <TableHead>Base Qty</TableHead>
                <TableHead>Unit price (base)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Mfg date</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Manager Review</TableHead>
                <TableHead>Manager action</TableHead>
                <TableHead>Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedLines.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.inventory_item_name || '—'}</TableCell>
                  <TableCell>
                    <ReceiptLineBrandCell row={row} getBrandLogoViewUrl={getBrandLogoViewUrl} />
                  </TableCell>
                  <TableCell>
                    {row.purchased_qty} {row.purchase_unit}
                  </TableCell>
                  <TableCell>{row.received_qty_in_base_unit}</TableCell>
                  <TableCell>{row.unit_price_in_base ? row.unit_price_in_base.toFixed(4) : '-'}</TableCell>
                  <TableCell>{row.line_total}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{(row.manufacturing_date || '').trim() || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{(row.expiry_date || '').trim() || '—'}</TableCell>
                  <TableCell>{row.manager_review_status || '-'}</TableCell>
                  <TableCell>{row.manager_action || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={row.stock_applied ? 'success' : 'secondary'}>
                      {row.stock_applied ? 'Applied' : 'Pending'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StoreSection>
    </>
  );
});

OperatorReceiptRegisterSections.displayName = 'OperatorReceiptRegisterSections';
