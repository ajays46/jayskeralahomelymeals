import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import {
  formatKitchenStoreApiError,
  purchaseReceiptHasInvoice,
  useKitchenInventoryMock,
  useKitchenPurchaseRequestOperatorApi,
  useKitchenReceiptsApi
} from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_OPERATOR: purchase receipts, lines, invoice upload/view. */

const today = () => new Date().toISOString().slice(0, 10);

/** Renders brand logo + name from a normalized receipt line (null-safe). */
function ReceiptLineBrandCell({ row }) {
  const logoSrc = (row.brand_logo_s3_url || '').trim();
  const brandLabel = (row.brand_name || '').trim();
  if (!brandLabel && !logoSrc) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  return (
    <div className="flex min-w-0 max-w-[12rem] items-center gap-2">
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={brandLabel ? `${brandLabel} logo` : ''}
          className="h-7 w-7 shrink-0 rounded-md border border-slate-200 bg-white object-contain"
        />
      ) : null}
      <span className="min-w-0 truncate text-sm text-slate-800" title={brandLabel || undefined}>
        {brandLabel || '—'}
      </span>
    </div>
  );
}

const previewBaseQtyAndUnitPrice = (purchasedQty, conversionToBase, lineTotal) => {
  const qty = Number(purchasedQty);
  const conv = Number(conversionToBase);
  const total = Number(lineTotal);
  if (!Number.isFinite(qty) || !Number.isFinite(conv) || conv <= 0 || qty <= 0) return null;
  const received = qty * conv;
  if (!Number.isFinite(total) || total <= 0) return { received_qty_in_base_unit: received, unit_price_in_base: null };
  return { received_qty_in_base_unit: received, unit_price_in_base: total / received };
};

const StoreOperatorPurchaseReceiptsPage = () => {
  const [searchParams] = useSearchParams();
  const { items, brands } = useKitchenInventoryMock();
  const {
    approvedRequests,
    approvedLines,
    bootstrapLoading,
    error,
    listApprovedRequests,
    fetchApprovedLines
  } = useKitchenPurchaseRequestOperatorApi();
  const {
    createReceipt,
    uploadReceiptInvoice,
    addReceiptLine,
    uploadReceiptLineImage,
    listReceipts,
    listReceiptLines,
    viewReceiptInvoiceInNewTab
  } = useKitchenReceiptsApi();

  const [selectedRequestId, setSelectedRequestId] = useState(searchParams.get('requestId') || '');
  const [referenceInvoice, setReferenceInvoice] = useState('');
  const [activeReceiptId, setActiveReceiptId] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedLines, setSelectedLines] = useState([]);
  const [status, setStatus] = useState('');
  const [approvedPurchaseForm, setApprovedPurchaseForm] = useState({
    purchase_request_line_id: '',
    purchased_qty: '',
    purchase_unit: '',
    brand_id: '',
    brand: '',
    conversion_to_base: '1',
    line_total: '',
    purchase_date: today(),
    note: ''
  });
  const [offListForm, setOffListForm] = useState({
    inventory_item_id: '',
    purchased_qty: '',
    purchase_unit: 'kg',
    conversion_to_base: '1',
    line_total: '',
    purchase_date: today(),
    off_list_purchase_reason: '',
    note: ''
  });
  const [purchaseProofFile, setPurchaseProofFile] = useState(null);
  const [invoiceUploadLoading, setInvoiceUploadLoading] = useState(false);
  const [invoiceUrlLoadingId, setInvoiceUrlLoadingId] = useState('');
  const purchaseProofInputRef = useRef(null);
  const purchaseProofPreviewUrl = useMemo(
    () => (purchaseProofFile ? URL.createObjectURL(purchaseProofFile) : null),
    [purchaseProofFile]
  );

  const [approvedLineImageFile, setApprovedLineImageFile] = useState(null);
  const approvedLineImageInputRef = useRef(null);
  const approvedLineImagePreviewUrl = useMemo(
    () => (approvedLineImageFile ? URL.createObjectURL(approvedLineImageFile) : null),
    [approvedLineImageFile]
  );

  const [offListImageFile, setOffListImageFile] = useState(null);
  const offListImageInputRef = useRef(null);
  const offListImagePreviewUrl = useMemo(
    () => (offListImageFile ? URL.createObjectURL(offListImageFile) : null),
    [offListImageFile]
  );

  useEffect(() => {
    return () => {
      if (purchaseProofPreviewUrl) URL.revokeObjectURL(purchaseProofPreviewUrl);
    };
  }, [purchaseProofPreviewUrl]);

  useEffect(() => {
    return () => {
      if (approvedLineImagePreviewUrl) URL.revokeObjectURL(approvedLineImagePreviewUrl);
    };
  }, [approvedLineImagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (offListImagePreviewUrl) URL.revokeObjectURL(offListImagePreviewUrl);
    };
  }, [offListImagePreviewUrl]);

  const onPurchaseProofFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setPurchaseProofFile(f);
  };

  const clearPurchaseProof = () => {
    setPurchaseProofFile(null);
    if (purchaseProofInputRef.current) purchaseProofInputRef.current.value = '';
  };

  const clearApprovedLineImage = () => {
    setApprovedLineImageFile(null);
    if (approvedLineImageInputRef.current) approvedLineImageInputRef.current.value = '';
  };

  const clearOffListImage = () => {
    setOffListImageFile(null);
    if (offListImageInputRef.current) offListImageInputRef.current.value = '';
  };

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
    setActiveReceiptId('');
    setApprovedPurchaseForm((prev) => ({
      ...prev,
      purchase_request_line_id: '',
      purchased_qty: '',
      purchase_unit: '',
      brand_id: '',
      brand: '',
      line_total: '',
      purchase_date: today(),
      note: ''
    }));
  }, [fetchApprovedLines, selectedRequestId]);

  useEffect(() => {
    if (!approvedLines.length) return;
    setApprovedPurchaseForm((prev) => {
      if (prev.purchase_request_line_id) return prev;
      const firstLine = approvedLines[0];
      return {
        ...prev,
        purchase_request_line_id: firstLine.id,
        purchased_qty: String(firstLine.approved_quantity || ''),
        purchase_unit: firstLine.requested_unit || '',
        brand_id: firstLine.brand_id || '',
        brand: firstLine.brand || firstLine.brand_name || '',
        conversion_to_base: '1'
      };
    });
  }, [approvedLines]);

  const selectedRequest = useMemo(
    () => approvedRequests.find((request) => request.id === selectedRequestId) || null,
    [approvedRequests, selectedRequestId]
  );
  const selectedApprovedLine = useMemo(
    () => approvedLines.find((line) => line.id === approvedPurchaseForm.purchase_request_line_id) || null,
    [approvedLines, approvedPurchaseForm.purchase_request_line_id]
  );
  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === approvedPurchaseForm.brand_id) || null,
    [brands, approvedPurchaseForm.brand_id]
  );

  const catalogItemIdForApprovedLine = useMemo(() => {
    if (!selectedApprovedLine) return '';
    return String(
      selectedApprovedLine.resolved_inventory_item_id ||
        selectedApprovedLine.inventory_item_id ||
        ''
    );
  }, [selectedApprovedLine]);

  const approvedLinePreview = useMemo(
    () =>
      previewBaseQtyAndUnitPrice(
        approvedPurchaseForm.purchased_qty,
        approvedPurchaseForm.conversion_to_base,
        approvedPurchaseForm.line_total
      ),
    [approvedPurchaseForm.purchased_qty, approvedPurchaseForm.conversion_to_base, approvedPurchaseForm.line_total]
  );

  const offListPreview = useMemo(
    () =>
      previewBaseQtyAndUnitPrice(
        offListForm.purchased_qty,
        offListForm.conversion_to_base,
        offListForm.line_total
      ),
    [offListForm.purchased_qty, offListForm.conversion_to_base, offListForm.line_total]
  );

  const loadReceiptHistory = async () => {
    setStatus('');
    try {
      const out = await listReceipts();
      setHistory(Array.isArray(out) ? out : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt history.';
      setStatus(msg);
      showStoreError(msg, 'Could not load receipts');
    }
  };

  const openReceiptLines = async (receiptId) => {
    setActiveReceiptId(receiptId);
    setStatus('');
    try {
      const rows = await listReceiptLines(receiptId);
      setSelectedLines(rows);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt lines.';
      setStatus(msg);
      showStoreError(msg, 'Could not load receipt lines');
    }
  };

  const addApprovedLineToReceipt = async (receiptId) => {
    if (!selectedApprovedLine) {
      throw new Error('Choose an approved line to add.');
    }
    const catalogItemId = String(
      selectedApprovedLine.resolved_inventory_item_id || selectedApprovedLine.inventory_item_id || ''
    );
    if (!catalogItemId) {
      throw new Error(
        'This approved line has no linked catalog item id. The name must match an item in Item master, or a manager must resolve the line on the purchase request.'
      );
    }
    const pq = Number(approvedPurchaseForm.purchased_qty);
    const conv = Number(approvedPurchaseForm.conversion_to_base);
    const lt = Number(approvedPurchaseForm.line_total);
    if (!pq || pq <= 0 || !conv || conv <= 0 || !lt || lt <= 0) {
      throw new Error('Enter purchased qty, conversion to base, and line total (all must be greater than zero).');
    }
    if (!approvedPurchaseForm.purchase_unit.trim()) {
      throw new Error('Enter the purchase unit (e.g. bag, kg).');
    }
    const bid = String(approvedPurchaseForm.brand_id || '').trim();
    const bname = String(approvedPurchaseForm.brand || '').trim();
    return await addReceiptLine(receiptId, {
      inventory_item_id: catalogItemId,
      purchase_request_line_id: String(selectedApprovedLine.id),
      purchased_qty: pq,
      purchase_unit: approvedPurchaseForm.purchase_unit.trim(),
      conversion_to_base: conv,
      line_total: lt,
      purchase_date: approvedPurchaseForm.purchase_date,
      ...(bid ? { brand_id: bid } : {}),
      ...(bname ? { brand_name: bname } : {}),
      note: approvedPurchaseForm.note.trim() || 'Bought from approved list'
    });
  };

  const onCreateReceipt = async () => {
    if (!selectedRequestId) {
      const msg = 'Choose an approved request before creating a receipt.';
      setStatus(msg);
      showStoreError(msg, 'Missing request');
      return;
    }
    setStatus('');
    setInvoiceUploadLoading(true);
    let createdReceiptId = '';
    try {
      if (purchaseProofFile) {
        const contentType = purchaseProofFile.type || 'application/octet-stream';
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(contentType)) {
          const msg = 'Invoice file must be PDF, JPG, or PNG.';
          setStatus(msg);
          showStoreError(msg, 'Invalid file type');
          return;
        }
      }
      // Create receipt first, then upload invoice via our API (kitchen → S3). Avoids browser → presigned S3 PUT and S3 CORS.
      const out = await createReceipt({
        purchase_request_id: selectedRequestId,
        reference_invoice: referenceInvoice.trim() || undefined,
        ...(purchaseProofFile ? { received_at: new Date().toISOString() } : {})
      });
      const receiptId = String(out?.receipt_id ?? out?.id ?? '');
      if (!receiptId) {
        const msg = 'Receipt created, but the receipt id was not returned.';
        setStatus(msg);
        showStoreError(msg, 'Receipt incomplete');
        return;
      }
      createdReceiptId = receiptId;
      if (purchaseProofFile) {
        await uploadReceiptInvoice(receiptId, purchaseProofFile);
      }
      setActiveReceiptId(receiptId);
      setSelectedLines([]);
      setStatus('Receipt created. Use Add item to record approved lines on this receipt.');
      showStoreSuccess('Receipt created. Add items to record purchased lines.', 'Receipt created');
      clearPurchaseProof();
      await loadReceiptHistory();
      await openReceiptLines(receiptId);
    } catch (err) {
      const msg = formatKitchenStoreApiError(
        err,
        createdReceiptId
          ? 'Receipt was created but the invoice file could not be uploaded.'
          : 'Failed to create receipt.'
      );
      setStatus(msg);
      showStoreError(msg, createdReceiptId ? 'Invoice upload failed' : 'Could not create receipt');
    } finally {
      setInvoiceUploadLoading(false);
    }
  };

  const openReceiptInvoice = async (receiptId) => {
    if (!receiptId) return;
    setInvoiceUrlLoadingId(receiptId);
    try {
      await viewReceiptInvoiceInNewTab(receiptId);
    } catch (err) {
      const status = err?.response?.status;
      const msg = formatKitchenStoreApiError(err, 'Could not open invoice.');
      setStatus(msg);
      showStoreError(msg, status === 404 ? 'No invoice attached' : 'View invoice failed');
    } finally {
      setInvoiceUrlLoadingId('');
    }
  };

  const onAddApprovedPurchaseLine = async () => {
    if (!activeReceiptId) {
      const msg = 'Create a receipt first using Create receipt, then add items.';
      setStatus(msg);
      showStoreError(msg, 'No receipt');
      return;
    }
    if (!approvedLines.length) {
      const msg = 'No approved lines are available for the selected request.';
      setStatus(msg);
      showStoreError(msg, 'Nothing to add');
      return;
    }
    setStatus('');
    try {
      const lineResult = await addApprovedLineToReceipt(activeReceiptId);
      const lineId = String(lineResult?.line_id ?? lineResult?.id ?? '');
      if (approvedLineImageFile && lineId) {
        try {
          await uploadReceiptLineImage(activeReceiptId, lineId, approvedLineImageFile);
        } catch (imgErr) {
          const imgMsg = formatKitchenStoreApiError(imgErr, 'Line added but image upload failed.');
          setStatus(imgMsg);
          showStoreError(imgMsg, 'Image upload failed');
        }
      }
      clearApprovedLineImage();
      setStatus('Approved line added to the receipt.');
      showStoreSuccess('Approved line added to the receipt.', 'Line added');
      await loadReceiptHistory();
      await openReceiptLines(activeReceiptId);
    } catch (err) {
      const msg = err?.message || formatKitchenStoreApiError(err, 'Failed to add line to receipt.');
      setStatus(msg);
      showStoreError(msg, 'Could not add line');
    }
  };

  const onAddOffListLine = async () => {
    if (!activeReceiptId) {
      const msg = 'Create a receipt first before adding off-list items.';
      setStatus(msg);
      showStoreError(msg, 'No receipt');
      return;
    }
    if (!offListForm.off_list_purchase_reason.trim()) {
      const msg = 'Off-list purchase reason is required.';
      setStatus(msg);
      showStoreError(msg, 'Missing reason');
      return;
    }
    if (!offListForm.inventory_item_id) {
      const msg = 'Select an inventory item for the off-list line.';
      setStatus(msg);
      showStoreError(msg, 'Select an item');
      return;
    }
    const pq = Number(offListForm.purchased_qty);
    const conv = Number(offListForm.conversion_to_base);
    const lt = Number(offListForm.line_total);
    if (!pq || pq <= 0 || !conv || conv <= 0 || !lt || lt <= 0) {
      const msg = 'Enter purchased qty, conversion to base, and line total (all must be greater than zero).';
      setStatus(msg);
      showStoreError(msg, 'Check quantities');
      return;
    }
    setStatus('');
    try {
      const lineResult = await addReceiptLine(activeReceiptId, {
        inventory_item_id: offListForm.inventory_item_id,
        purchased_qty: pq,
        purchase_unit: offListForm.purchase_unit.trim() || 'kg',
        conversion_to_base: conv,
        line_total: lt,
        purchase_date: offListForm.purchase_date,
        off_list_purchase_reason: offListForm.off_list_purchase_reason.trim(),
        note: offListForm.note.trim() || 'Bought outside approved list'
      });
      const lineId = String(lineResult?.line_id ?? lineResult?.id ?? '');
      if (offListImageFile && lineId) {
        try {
          await uploadReceiptLineImage(activeReceiptId, lineId, offListImageFile);
        } catch (imgErr) {
          const imgMsg = formatKitchenStoreApiError(imgErr, 'Line added but image upload failed.');
          setStatus(imgMsg);
          showStoreError(imgMsg, 'Image upload failed');
        }
      }
      clearOffListImage();
      setStatus('Off-list purchase line added to receipt.');
      showStoreSuccess('Off-list line added to the receipt.', 'Line added');
      setOffListForm({
        inventory_item_id: '',
        purchased_qty: '',
        purchase_unit: 'kg',
        conversion_to_base: '1',
        line_total: '',
        purchase_date: today(),
        off_list_purchase_reason: '',
        note: ''
      });
      await openReceiptLines(activeReceiptId);
    } catch (err) {
      const msg = formatKitchenStoreApiError(err, 'Failed to add off-list line.');
      setStatus(msg);
      showStoreError(msg, 'Could not add line');
    }
  };

  return (
    <StorePageShell>
      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <StoreNotice tone="amber">
        Inventory quantities do not increase until a store manager reviews each receipt line with KEEP (including
        items that match the approved list).
      </StoreNotice>

      <StoreSection title="Approved Request for Purchase" tone="emerald">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <select
            className="rounded border px-3 py-2"
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(e.target.value)}
          >
            <option value="">Select approved request</option>
            {approvedRequests.map((request) => (
              <option key={request.id} value={request.id}>
                {(request.approval_note || 'Approved request')} - {request.approved_at || request.created_at || request.id}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={listApprovedRequests} disabled={bootstrapLoading}>
            {bootstrapLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        {selectedRequest?.approval_note ? <div className="mt-3 text-sm text-slate-600">Note: {selectedRequest.approval_note}</div> : null}
      </StoreSection>

      <StoreSection title="Receipt Header" tone="sky">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded border px-3 py-2"
            type="date"
            value={approvedPurchaseForm.purchase_date}
            onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
          />
          <input
            className="rounded border px-3 py-2"
            value={referenceInvoice}
            onChange={(e) => setReferenceInvoice(e.target.value)}
            placeholder="Reference invoice"
          />
        </div>
        <div className="mt-3 rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5">
          <div className="text-xs font-medium text-slate-800">Purchase image</div>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              ref={purchaseProofInputRef}
              id="purchase-proof-image"
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              aria-label="Choose purchase receipt image"
              onChange={onPurchaseProofFileChange}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => purchaseProofInputRef.current?.click()}>
                Choose image
              </Button>
              {purchaseProofFile ? (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-600" onClick={clearPurchaseProof}>
                  Remove
                </Button>
              ) : null}
            </div>
            {purchaseProofPreviewUrl ? (
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border border-dashed border-slate-200 bg-white p-1.5 sm:max-w-[11rem]">
                {purchaseProofFile?.type === 'application/pdf' ? (
                  <p className="py-2 text-center text-[11px] text-slate-600">PDF selected</p>
                ) : (
                  <img
                    src={purchaseProofPreviewUrl}
                    alt="Selected purchase receipt preview"
                    className="max-h-24 w-full rounded object-contain"
                  />
                )}
                <span className="truncate text-[10px] text-slate-500" title={purchaseProofFile?.name || ''}>
                  {purchaseProofFile?.name}
                </span>
              </div>
            ) : (
              <div className="flex h-16 min-w-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/80 px-2 text-center text-[11px] text-slate-400 sm:max-w-[11rem]">
                No image
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={onCreateReceipt} disabled={!selectedRequestId || invoiceUploadLoading}>
            {invoiceUploadLoading ? 'Uploading invoice...' : 'Create receipt'}
          </Button>
        </div>

        <div className="mt-4 text-sm font-medium text-slate-700">Add Approved Purchase items</div>
        {approvedLines.length === 0 ? (
          <StoreNotice tone="amber">No approved lines are available for the selected request.</StoreNotice>
        ) : (
          <>
            {selectedApprovedLine && !catalogItemIdForApprovedLine ? (
              <StoreNotice tone="rose">
                This approved line has no catalog item id (and no exact name match in Item master). A manager must
                resolve it on the purchase request, or create the item with the same name in Item master and refresh
                approved lines.
              </StoreNotice>
            ) : null}
            <div className="grid gap-3 md:grid-cols-3">
            <select
              className="rounded border px-3 py-2"
              value={approvedPurchaseForm.purchase_request_line_id}
              onChange={(e) => {
                const nextLine = approvedLines.find((line) => line.id === e.target.value);
                setApprovedPurchaseForm((prev) => ({
                  ...prev,
                  purchase_request_line_id: e.target.value,
                  purchased_qty: nextLine ? String(nextLine.approved_quantity || '') : '',
                  purchase_unit: nextLine?.requested_unit || '',
                  brand_id: nextLine?.brand_id || '',
                  brand: nextLine?.brand || nextLine?.brand_name || ''
                }));
              }}
            >
              <option value="">Select approved item</option>
              {approvedLines.map((line) => {
                const itemLabel = line.inventory_item_name || line.requested_item_name;
                const brandBit = line.brand_name ? ` · ${line.brand_name}` : '';
                return (
                  <option key={line.id} value={line.id}>
                    {itemLabel}
                    {brandBit} — approved {line.approved_quantity} {line.requested_unit}
                  </option>
                );
              })}
            </select>
            <input
              className="rounded border px-3 py-2"
              value={approvedPurchaseForm.purchased_qty}
              onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, purchased_qty: e.target.value }))}
              placeholder="Purchased qty"
              type="number"
              min="0"
              step="0.01"
            />
            <input
              className="rounded border px-3 py-2"
              value={approvedPurchaseForm.purchase_unit}
              onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, purchase_unit: e.target.value }))}
              placeholder="Purchase unit"
            />
            <select
              className="rounded border px-3 py-2"
              value={approvedPurchaseForm.brand_id}
              onChange={(e) => {
                const selectedBrand = brands.find((b) => b.id === e.target.value);
                setApprovedPurchaseForm((prev) => ({
                  ...prev,
                  brand_id: e.target.value,
                  brand: selectedBrand?.name || ''
                }));
              }}
            >
              <option value="">Select brand (optional)</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <input
              className="rounded border px-3 py-2"
              value={approvedPurchaseForm.conversion_to_base}
              onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, conversion_to_base: e.target.value }))}
              placeholder="Conversion to base"
              type="number"
              min="0"
              step="0.01"
            />
            <input
              className="rounded border px-3 py-2"
              value={approvedPurchaseForm.line_total}
              onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, line_total: e.target.value }))}
              placeholder="Line total paid (required)"
              type="number"
              min="0"
              step="0.01"
              aria-label="Line total amount paid for this purchase"
            />
            <input
              className="rounded border px-3 py-2"
              type="date"
              value={approvedPurchaseForm.purchase_date}
              onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
            />
            <textarea
              className="rounded border px-3 py-2 text-sm md:col-span-2"
              value={approvedPurchaseForm.note}
              onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Operator note"
            />
            <div className="rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5 md:col-span-3">
              <div className="text-xs font-medium text-slate-800">Item image (optional)</div>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <input
                  ref={approvedLineImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label="Choose item image for approved purchase"
                  onChange={(e) => setApprovedLineImageFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => approvedLineImageInputRef.current?.click()}>
                    Choose image
                  </Button>
                  {approvedLineImageFile ? (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-600" onClick={clearApprovedLineImage}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                {approvedLineImagePreviewUrl ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border border-dashed border-slate-200 bg-white p-1.5 sm:max-w-[11rem]">
                    <img
                      src={approvedLineImagePreviewUrl}
                      alt="Selected item image preview"
                      className="max-h-24 w-full rounded object-contain"
                    />
                    <span className="truncate text-[10px] text-slate-500" title={approvedLineImageFile?.name || ''}>
                      {approvedLineImageFile?.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-16 min-w-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/80 px-2 text-center text-[11px] text-slate-400 sm:max-w-[11rem]">
                    No image
                  </div>
                )}
              </div>
            </div>
            {(selectedBrand?.name || selectedBrand?.logo_view_url || selectedApprovedLine?.brand_name) ? (
              <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50/90 px-3 py-2 md:col-span-3">
                {selectedBrand?.logo_view_url ? (
                  <img
                    src={selectedBrand.logo_view_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-md border border-slate-200 bg-white object-contain"
                  />
                ) : null}
                <div className="min-w-0 text-sm">
                  <span className="font-medium text-slate-800">Brand</span>
                  {selectedBrand?.name || selectedApprovedLine?.brand_name ? (
                    <span className="ml-2 text-slate-700">{selectedBrand?.name || selectedApprovedLine?.brand_name}</span>
                  ) : (
                    <span className="ml-2 text-slate-500">Logo only (no name)</span>
                  )}
                </div>
              </div>
            ) : null}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={onAddApprovedPurchaseLine}
                disabled={
                  !activeReceiptId ||
                  !approvedLines.length ||
                  !approvedPurchaseForm.purchase_request_line_id ||
                  !catalogItemIdForApprovedLine
                }
              >
                Add item
              </Button>
            </div>
          </>
        )}
        {/* {approvedLinePreview ? (
          <StoreNotice tone="sky">
            Preview (backend uses the same math): received in base unit ≈{' '}
            {approvedLinePreview.received_qty_in_base_unit.toFixed(4)}
            {approvedLinePreview.unit_price_in_base != null
              ? ` · unit price in base ≈ ${approvedLinePreview.unit_price_in_base.toFixed(4)}`
              : null}
          </StoreNotice>
        ) : null} */}
      </StoreSection>

      <StoreSection title="Add Off-List Purchase" tone="amber">
        <details className="rounded border bg-white px-2 py-1.5">
          <summary className="cursor-pointer select-none text-xs font-medium text-slate-700">
            Expand to add off-list purchase
          </summary>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <select
              className="rounded border px-2 py-1.5 text-sm"
              value={offListForm.inventory_item_id}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, inventory_item_id: e.target.value }))}
            >
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </option>
              ))}
            </select>
            <input
              className="rounded border px-2 py-1.5 text-sm"
              value={offListForm.purchased_qty}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, purchased_qty: e.target.value }))}
              placeholder="Purchased qty"
              type="number"
              min="0"
              step="0.01"
            />
            <input
              className="rounded border px-2 py-1.5 text-sm"
              value={offListForm.purchase_unit}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, purchase_unit: e.target.value }))}
              placeholder="Purchase unit"
            />
            <input
              className="rounded border px-2 py-1.5 text-sm"
              value={offListForm.conversion_to_base}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, conversion_to_base: e.target.value }))}
              placeholder="Conversion to base"
              type="number"
              min="0"
              step="0.01"
            />
            <input
              className="rounded border px-2 py-1.5 text-sm"
              value={offListForm.line_total}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, line_total: e.target.value }))}
              placeholder="Total"
              type="number"
              min="0"
              step="0.01"
            />
            <input
              className="rounded border px-2 py-1.5 text-sm"
              type="date"
              value={offListForm.purchase_date}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
            />
            <input
              className="rounded border px-2 py-1.5 text-sm md:col-span-2"
              value={offListForm.off_list_purchase_reason}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, off_list_purchase_reason: e.target.value }))}
              placeholder="Off-list purchase reason"
            />
            <Button type="button" variant="warning" onClick={onAddOffListLine}>
              Add Off-List item
            </Button>
            <textarea
              className="rounded border px-2 py-1.5 text-xs md:col-span-3"
              value={offListForm.note}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Optional note"
            />
            <div className="rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5 md:col-span-3">
              <div className="text-xs font-medium text-slate-800">Item image (optional)</div>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <input
                  ref={offListImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label="Choose item image for off-list purchase"
                  onChange={(e) => setOffListImageFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => offListImageInputRef.current?.click()}>
                    Choose image
                  </Button>
                  {offListImageFile ? (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-600" onClick={clearOffListImage}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                {offListImagePreviewUrl ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border border-dashed border-slate-200 bg-white p-1.5 sm:max-w-[11rem]">
                    <img
                      src={offListImagePreviewUrl}
                      alt="Selected item image preview"
                      className="max-h-24 w-full rounded object-contain"
                    />
                    <span className="truncate text-[10px] text-slate-500" title={offListImageFile?.name || ''}>
                      {offListImageFile?.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex h-16 min-w-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/80 px-2 text-center text-[11px] text-slate-400 sm:max-w-[11rem]">
                    No image
                  </div>
                )}
              </div>
            </div>
          </div>
          {offListPreview ? (
            <StoreNotice tone="sky">
              Preview: received in base unit ≈ {offListPreview.received_qty_in_base_unit.toFixed(4)}
              {offListPreview.unit_price_in_base != null
                ? ` · unit price in base ≈ ${offListPreview.unit_price_in_base.toFixed(4)}`
                : null}
            </StoreNotice>
          ) : null}
        </details>
      </StoreSection>

      <StoreSection
        title="Receipt Register"
        tone="sky"
        headerActions={
          <Button type="button" variant="outline" onClick={loadReceiptHistory}>Refresh Register</Button>
        }
      >
        <div className="max-h-[330px] overflow-y-auto rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Request ID</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Invoice file</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead>Received At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.id || row.receipt_id}>
                  <TableCell className="font-medium">{row.id || row.receipt_id}</TableCell>
                  <TableCell>{row.purchase_request_id || '-'}</TableCell>
                  <TableCell>{row.reference_invoice || '-'}</TableCell>
                  <TableCell className="max-w-44">
                    {purchaseReceiptHasInvoice(row) ? (
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0 text-sky-700"
                        disabled={invoiceUrlLoadingId === (row.id || row.receipt_id)}
                        onClick={() => openReceiptInvoice(row.id || row.receipt_id)}
                      >
                        {invoiceUrlLoadingId === (row.id || row.receipt_id) ? 'Opening…' : 'View invoice'}
                      </Button>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{row.invoice_uploaded_at || '-'}</TableCell>
                  <TableCell>{row.received_at || row.created_at || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => openReceiptLines(row.id || row.receipt_id)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </StoreSection>

      <StoreSection title="Received Item " tone="amber">
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
                <TableHead>Line Total</TableHead>
                <TableHead>Comparison</TableHead>
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
                    <ReceiptLineBrandCell row={row} />
                  </TableCell>
                  <TableCell>{row.purchased_qty} {row.purchase_unit}</TableCell>
                  <TableCell>{row.received_qty_in_base_unit}</TableCell>
                  <TableCell>{row.unit_price_in_base ? row.unit_price_in_base.toFixed(4) : '-'}</TableCell>
                  <TableCell>{row.line_total}</TableCell>
                  <TableCell>{row.comparison_status || '-'}</TableCell>
                  <TableCell>{row.manager_review_status || '-'}</TableCell>
                  <TableCell>{row.manager_action || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={row.stock_applied ? 'success' : 'secondary'}>
                      {row.stock_applied ? 'Applied' : 'Pending mgr'}
                    </Badge>
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

export default StoreOperatorPurchaseReceiptsPage;

