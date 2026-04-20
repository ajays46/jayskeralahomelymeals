import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { ReceiptLineBrandCell } from '@/components/store/ReceiptLineBrandCell';
import {
  formatKitchenStoreApiError,
  purchaseReceiptHasInvoice,
  purchaseReceiptHasItemsPhoto,
  useKitchenInventoryMock,
  useKitchenPurchaseRequestOperatorApi,
  useKitchenReceiptsApi
} from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_OPERATOR: purchase receipts, lines, invoice upload/view. */

const today = () => new Date().toISOString().slice(0, 10);

/** Non-empty YYYY-MM-DD from date input → API field; omit when blank. */
const optionalLineDate = (value) => {
  const s = String(value || '').trim();
  return s || undefined;
};

/**
 * API datetime → display in India Standard Time using Indian conventions:
 * day-first numeric date (dd/MM/yyyy), 12-hour clock.
 */
function formatDateTimeIST(iso) {
  if (iso == null || iso === '') return '—';
  const raw = String(iso).trim();
  if (!raw) return '—';
  let d = new Date(raw);
  // Space-separated "YYYY-MM-DD HH:mm:ss" from some APIs parses inconsistently; normalize to ISO-local.
  if (Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)) {
    d = new Date(raw.replace(' ', 'T'));
  }
  if (Number.isNaN(d.getTime())) return '—';
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
    uploadReceiptItemsPhoto,
    addReceiptLine,
    uploadReceiptLineImage,
    listReceipts,
    listReceiptLines,
    viewReceiptInvoiceInNewTab,
    openReceiptItemsPhotoInNewTab,
    getBrandLogoViewUrl
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
    manufacturing_date: '',
    expiry_date: '',
    note: ''
  });
  const [addApprovedPurchaseLinesOpen, setAddApprovedPurchaseLinesOpen] = useState(true);
  const [offListForm, setOffListForm] = useState({
    inventory_item_id: '',
    brand_id: '',
    brand: '',
    purchased_qty: '',
    purchase_unit: 'kg',
    conversion_to_base: '1',
    line_total: '',
    purchase_date: today(),
    manufacturing_date: '',
    expiry_date: '',
    off_list_purchase_reason: '',
    note: ''
  });
  const [purchaseProofFile, setPurchaseProofFile] = useState(null);
  const [itemsPhotoFile, setItemsPhotoFile] = useState(null);
  const [invoiceUploadLoading, setInvoiceUploadLoading] = useState(false);
  const [invoiceUrlLoadingId, setInvoiceUrlLoadingId] = useState('');
  const [itemsPhotoUrlLoadingId, setItemsPhotoUrlLoadingId] = useState('');
  const purchaseProofInputRef = useRef(null);
  const itemsPhotoInputRef = useRef(null);
  const purchaseProofPreviewUrl = useMemo(
    () => (purchaseProofFile ? URL.createObjectURL(purchaseProofFile) : null),
    [purchaseProofFile]
  );
  const itemsPhotoPreviewUrl = useMemo(
    () => (itemsPhotoFile ? URL.createObjectURL(itemsPhotoFile) : null),
    [itemsPhotoFile]
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
      if (itemsPhotoPreviewUrl) URL.revokeObjectURL(itemsPhotoPreviewUrl);
    };
  }, [itemsPhotoPreviewUrl]);

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

  const onItemsPhotoFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setItemsPhotoFile(f);
  };

  const clearItemsPhoto = () => {
    setItemsPhotoFile(null);
    if (itemsPhotoInputRef.current) itemsPhotoInputRef.current.value = '';
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
      manufacturing_date: '',
      expiry_date: '',
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
    const mfg = optionalLineDate(approvedPurchaseForm.manufacturing_date);
    const exp = optionalLineDate(approvedPurchaseForm.expiry_date);
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
      ...(mfg ? { manufacturing_date: mfg } : {}),
      ...(exp ? { expiry_date: exp } : {}),
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
      if (itemsPhotoFile) {
        const ct = itemsPhotoFile.type || 'application/octet-stream';
        if (!['image/jpeg', 'image/png'].includes(ct)) {
          const msg = 'Purchased-items photo must be JPG or PNG.';
          setStatus(msg);
          showStoreError(msg, 'Invalid file type');
          return;
        }
      }
      // Create receipt first, then upload invoice via our API (kitchen → S3). Avoids browser → presigned S3 PUT and S3 CORS.
      const out = await createReceipt({
        purchase_request_id: selectedRequestId,
        reference_invoice: referenceInvoice.trim() || undefined,
        ...(purchaseProofFile || itemsPhotoFile ? { received_at: new Date().toISOString() } : {})
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
      if (itemsPhotoFile) {
        await uploadReceiptItemsPhoto(receiptId, itemsPhotoFile);
      }
      setActiveReceiptId(receiptId);
      setSelectedLines([]);
      setStatus(
        'Receipt created. Add approved purchase lines or off-list items, then continue with this receipt.'
      );
      showStoreSuccess('Receipt created. Add receipt lines when ready.', 'Receipt created');
      clearPurchaseProof();
      clearItemsPhoto();
      await loadReceiptHistory();
      await openReceiptLines(receiptId);
    } catch (err) {
      const msg = formatKitchenStoreApiError(
        err,
        createdReceiptId
          ? 'Receipt was created but a file upload did not complete.'
          : 'Failed to create receipt.'
      );
      setStatus(msg);
      showStoreError(msg, createdReceiptId ? 'Upload failed' : 'Could not create receipt');
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

  const openReceiptItemsPhoto = async (receiptId) => {
    if (!receiptId) return;
    setItemsPhotoUrlLoadingId(receiptId);
    try {
      await openReceiptItemsPhotoInNewTab(receiptId);
    } catch (err) {
      const status = err?.response?.status;
      const msg = formatKitchenStoreApiError(err, 'Could not open purchased-items photo.');
      setStatus(msg);
      showStoreError(msg, status === 404 ? 'No items photo' : 'View items photo failed');
    } finally {
      setItemsPhotoUrlLoadingId('');
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
      const mfg = optionalLineDate(offListForm.manufacturing_date);
      const exp = optionalLineDate(offListForm.expiry_date);
      const obid = String(offListForm.brand_id || '').trim();
      const obname = String(offListForm.brand || '').trim();
      const lineResult = await addReceiptLine(activeReceiptId, {
        inventory_item_id: offListForm.inventory_item_id,
        purchased_qty: pq,
        purchase_unit: offListForm.purchase_unit.trim() || 'kg',
        conversion_to_base: conv,
        line_total: lt,
        purchase_date: offListForm.purchase_date,
        off_list_purchase_reason: offListForm.off_list_purchase_reason.trim(),
        ...(obid ? { brand_id: obid } : {}),
        ...(obname ? { brand_name: obname } : {}),
        ...(mfg ? { manufacturing_date: mfg } : {}),
        ...(exp ? { expiry_date: exp } : {}),
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
        brand_id: '',
        brand: '',
        purchased_qty: '',
        purchase_unit: 'kg',
        conversion_to_base: '1',
        line_total: '',
        purchase_date: today(),
        manufacturing_date: '',
        expiry_date: '',
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
        <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5">
            <div className="text-xs font-medium text-slate-800">Upload invoice</div>
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
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border border-dashed border-slate-200 bg-white p-1.5 sm:max-w-[11rem] md:max-w-none">
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
                <div className="flex h-16 min-w-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/80 px-2 text-center text-[11px] text-slate-400 sm:max-w-[11rem] md:max-w-none">
                  No image
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5">
            <div className="text-xs font-medium text-slate-800">Purchased-items photo (optional)</div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              One image of all bought goods together (JPEG or PNG). Uploads after the receipt is created.
            </p>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <input
                ref={itemsPhotoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                aria-label="Choose purchased-items photo"
                onChange={onItemsPhotoFileChange}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => itemsPhotoInputRef.current?.click()}
                >
                  Choose photo
                </Button>
                {itemsPhotoFile ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-slate-600"
                    onClick={clearItemsPhoto}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              {itemsPhotoPreviewUrl ? (
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border border-dashed border-slate-200 bg-white p-1.5 sm:max-w-[11rem] md:max-w-none">
                  <img
                    src={itemsPhotoPreviewUrl}
                    alt="Purchased items preview"
                    className="max-h-24 w-full rounded object-contain"
                  />
                  <span className="truncate text-[10px] text-slate-500" title={itemsPhotoFile?.name || ''}>
                    {itemsPhotoFile?.name}
                  </span>
                </div>
              ) : (
                <div className="flex h-16 min-w-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white/80 px-2 text-center text-[11px] text-slate-400 sm:max-w-[11rem] md:max-w-none">
                  No photo
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={onCreateReceipt} disabled={!selectedRequestId || invoiceUploadLoading}>
            {invoiceUploadLoading ? 'Saving receipt…' : 'Create receipt'}
          </Button>
        </div>

        <details
          className="mt-4 rounded-lg border border-slate-200/80 bg-slate-50/40 px-3 py-2"
          open={addApprovedPurchaseLinesOpen}
          onToggle={(e) => setAddApprovedPurchaseLinesOpen(e.currentTarget.open)}
        >
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-800">
            Add approved purchase lines
          </summary>
          <div className="mt-3 space-y-3">
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
            <div className="flex flex-col gap-1">
              <label htmlFor="approved-line-purchase-date" className="text-xs font-medium text-slate-600">
                Purchase date
              </label>
              <input
                id="approved-line-purchase-date"
                className="rounded border px-3 py-2"
                type="date"
                value={approvedPurchaseForm.purchase_date}
                onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="approved-manufacturing-date" className="text-xs font-medium text-slate-600">
                Manufacturing date (optional)
              </label>
              <input
                id="approved-manufacturing-date"
                className="rounded border px-3 py-2"
                type="date"
                value={approvedPurchaseForm.manufacturing_date}
                onChange={(e) =>
                  setApprovedPurchaseForm((prev) => ({ ...prev, manufacturing_date: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="approved-expiry-date" className="text-xs font-medium text-slate-600">
                Expiry date (optional)
              </label>
              <input
                id="approved-expiry-date"
                className="rounded border px-3 py-2"
                type="date"
                value={approvedPurchaseForm.expiry_date}
                onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
            <textarea
              className="rounded border px-3 py-2 text-sm md:col-span-3"
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
          </div>
        </details>
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
              onChange={(e) => {
                const nextId = e.target.value;
                const item = items.find((it) => it.id === nextId);
                setOffListForm((prev) => ({
                  ...prev,
                  inventory_item_id: nextId,
                  brand_id: item?.brand_id ? String(item.brand_id) : '',
                  brand: item?.brand_name ? String(item.brand_name) : ''
                }));
              }}
            >
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </option>
              ))}
            </select>
            <select
              className="rounded border px-2 py-1.5 text-sm"
              value={offListForm.brand_id}
              onChange={(e) => {
                const b = brands.find((x) => x.id === e.target.value);
                setOffListForm((prev) => ({
                  ...prev,
                  brand_id: e.target.value,
                  brand: b?.name || ''
                }));
              }}
            >
              <option value="">Brand (optional)</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <input
              className="rounded border px-2 py-1.5 text-sm"
              value={offListForm.brand}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, brand: e.target.value }))}
              placeholder="Brand name (optional)"
              aria-label="Off-list brand name"
            />
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
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-slate-600">Purchase date</span>
              <input
                className="rounded border px-2 py-1.5 text-sm"
                type="date"
                value={offListForm.purchase_date}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-slate-600">Mfg date (opt.)</span>
              <input
                className="rounded border px-2 py-1.5 text-sm"
                type="date"
                value={offListForm.manufacturing_date}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, manufacturing_date: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-slate-600">Expiry (opt.)</span>
              <input
                className="rounded border px-2 py-1.5 text-sm"
                type="date"
                value={offListForm.expiry_date}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
            <input
              className="rounded border px-2 py-1.5 text-sm md:col-span-3"
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
                <TableHead>Invoice ref</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Items photo</TableHead>
                <TableHead>Invoice uploaded</TableHead>
                <TableHead>Received At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row) => (
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
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTimeIST(row.received_at || row.created_at)}
                  </TableCell>
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
                <TableHead>Mfg date</TableHead>
                <TableHead>Expiry</TableHead>
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
                    <ReceiptLineBrandCell row={row} getBrandLogoViewUrl={getBrandLogoViewUrl} />
                  </TableCell>
                  <TableCell>{row.purchased_qty} {row.purchase_unit}</TableCell>
                  <TableCell>{row.received_qty_in_base_unit}</TableCell>
                  <TableCell>{row.unit_price_in_base ? row.unit_price_in_base.toFixed(4) : '-'}</TableCell>
                  <TableCell>{row.line_total}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {(row.manufacturing_date || '').trim() || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {(row.expiry_date || '').trim() || '—'}
                  </TableCell>
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

