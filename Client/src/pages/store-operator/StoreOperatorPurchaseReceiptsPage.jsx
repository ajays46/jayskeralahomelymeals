import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OperatorReceiptRegisterSections } from '@/components/store/OperatorReceiptRegisterSections';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import {
  fetchInventoryUnitsList,
  formatKitchenStoreApiError,
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

/** Off-list brand `<select>` value when the operator types a name not chosen from the catalog list. */
const OFFLIST_BRAND_OTHER = '__offlist_brand_other__';

const newDraftLineKey = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `dr-${crypto.randomUUID()}`
    : `dr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const EXPLICIT_TZ_REGEX = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;

/**
 * Parse API timestamps so they display as India time for every user.
 * - Values with Z or a numeric offset are parsed as absolute instants (unchanged semantics).
 * - Timezone-naive `YYYY-MM-DD[ T]HH:mm…` strings are treated as IST wall clock (+05:30),
 *   matching typical backend payloads like `2026-04-21T03:44:31` without a zone.
 */
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

/**
 * API datetime → display in India Standard Time using Indian conventions:
 * day-first numeric date (dd/MM/yyyy), 12-hour clock.
 */
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
    loadOperatorReceivingView
  } = useKitchenPurchaseRequestOperatorApi();
  const {
    createReceipt,
    uploadReceiptInvoice,
    uploadReceiptItemsPhoto,
    addReceiptLine,
    addReceiptLinesBulk,
    uploadReceiptLineImage,
  } = useKitchenReceiptsApi();

  const [selectedRequestId, setSelectedRequestId] = useState(searchParams.get('requestId') || '');
  const [referenceInvoice, setReferenceInvoice] = useState('');
  const [activeReceiptId, setActiveReceiptId] = useState('');
  const receiptRegisterRef = useRef(null);
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
    off_list_purchase_reason: ''
  });
  const [purchaseProofFile, setPurchaseProofFile] = useState(null);
  const [itemsPhotoFile, setItemsPhotoFile] = useState(null);
  const [invoiceUploadLoading, setInvoiceUploadLoading] = useState(false);
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

  const [catalogUnits, setCatalogUnits] = useState([]);
  const [offListImageFile, setOffListImageFile] = useState(null);
  const [receiptDraftLines, setReceiptDraftLines] = useState([]);
  const [draftSubmitLoading, setDraftSubmitLoading] = useState(false);
  const [offListBrandMenuOpen, setOffListBrandMenuOpen] = useState(false);
  const offListBrandDropdownRef = useRef(null);
  const [approvedLineMenuOpen, setApprovedLineMenuOpen] = useState(false);
  const approvedLineDropdownRef = useRef(null);
  const [approvedBrandMenuOpen, setApprovedBrandMenuOpen] = useState(false);
  const approvedBrandDropdownRef = useRef(null);
  const offListImageInputRef = useRef(null);
  const offListImagePreviewUrl = useMemo(
    () => (offListImageFile ? URL.createObjectURL(offListImageFile) : null),
    [offListImageFile]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await fetchInventoryUnitsList();
      if (!cancelled) setCatalogUnits(Array.isArray(list) ? list : []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    let cancelled = false;
    void (async () => {
      if (!selectedRequestId) {
        await loadOperatorReceivingView('');
        if (cancelled) return;
        setActiveReceiptId('');
        return;
      }
      await loadOperatorReceivingView(selectedRequestId);
      if (cancelled) return;
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
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOperatorReceivingView, selectedRequestId]);

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

  const offListBrandSelectValue = useMemo(() => {
    const id = String(offListForm.brand_id || '').trim();
    if (id) return id;
    if (String(offListForm.brand || '').trim() !== '') return OFFLIST_BRAND_OTHER;
    return '';
  }, [offListForm.brand_id, offListForm.brand]);

  const offListBrandButtonLabel = useMemo(() => {
    const id = String(offListForm.brand_id || '').trim();
    if (id) {
      const b = brands.find((x) => String(x.id) === id);
      return b?.name ? String(b.name) : offListForm.brand || 'Brand (optional)';
    }
    if (offListBrandSelectValue === OFFLIST_BRAND_OTHER) {
      const q = String(offListForm.brand || '').trim();
      return q || 'Other…';
    }
    return 'Brand (optional)';
  }, [offListForm.brand_id, offListForm.brand, offListBrandSelectValue, brands]);

  useEffect(() => {
    if (!offListBrandMenuOpen) return;
    const close = (e) => {
      if (offListBrandDropdownRef.current && !offListBrandDropdownRef.current.contains(e.target)) {
        setOffListBrandMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [offListBrandMenuOpen]);

  const applyOffListBrandChoice = (v) => {
    if (v === '') {
      setOffListForm((prev) => ({ ...prev, brand_id: '', brand: '' }));
    } else if (v === OFFLIST_BRAND_OTHER) {
      setOffListForm((prev) => ({
        ...prev,
        brand_id: '',
        brand: prev.brand
      }));
    } else {
      const b = brands.find((x) => String(x.id) === v);
      setOffListForm((prev) => ({
        ...prev,
        brand_id: v,
        brand: b?.name ? String(b.name) : ''
      }));
    }
    setOffListBrandMenuOpen(false);
  };

  const approvedLineButtonLabel = useMemo(() => {
    const id = approvedPurchaseForm.purchase_request_line_id;
    if (!id) return 'Select approved line…';
    const line = approvedLines.find((l) => l.id === id);
    if (!line) return 'Select approved line…';
    const itemLabel = line.inventory_item_name || line.requested_item_name;
    return itemLabel ? String(itemLabel).trim() || '—' : '—';
  }, [approvedPurchaseForm.purchase_request_line_id, approvedLines]);

  /** Full line detail on hover only (qty / unit differ between lines with the same name). */
  const approvedLineButtonTitle = useMemo(() => {
    const id = approvedPurchaseForm.purchase_request_line_id;
    if (!id) return undefined;
    const line = approvedLines.find((l) => l.id === id);
    if (!line) return undefined;
    const itemLabel = line.inventory_item_name || line.requested_item_name || '';
    const brandBit = line.brand_name ? ` · ${line.brand_name}` : '';
    return `${itemLabel}${brandBit} — approved ${line.approved_quantity} ${line.requested_unit}`;
  }, [approvedPurchaseForm.purchase_request_line_id, approvedLines]);

  const approvedBrandButtonLabel = useMemo(() => {
    const id = String(approvedPurchaseForm.brand_id || '').trim();
    if (!id) return 'Brand (optional)';
    const b = brands.find((x) => String(x.id) === id);
    return b?.name ? String(b.name) : approvedPurchaseForm.brand || 'Brand (optional)';
  }, [approvedPurchaseForm.brand_id, approvedPurchaseForm.brand, brands]);

  useEffect(() => {
    if (!approvedLineMenuOpen) return;
    const close = (e) => {
      if (approvedLineDropdownRef.current && !approvedLineDropdownRef.current.contains(e.target)) {
        setApprovedLineMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [approvedLineMenuOpen]);

  useEffect(() => {
    if (!approvedBrandMenuOpen) return;
    const close = (e) => {
      if (approvedBrandDropdownRef.current && !approvedBrandDropdownRef.current.contains(e.target)) {
        setApprovedBrandMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [approvedBrandMenuOpen]);

  const applyApprovedLineChoice = (lineId) => {
    const nextLine = approvedLines.find((line) => line.id === lineId);
    setApprovedPurchaseForm((prev) => ({
      ...prev,
      purchase_request_line_id: lineId,
      purchased_qty: nextLine ? String(nextLine.approved_quantity || '') : '',
      purchase_unit: nextLine?.requested_unit || '',
      brand_id: nextLine?.brand_id || '',
      brand: nextLine?.brand || nextLine?.brand_name || ''
    }));
    setApprovedLineMenuOpen(false);
    setApprovedBrandMenuOpen(false);
  };

  const applyApprovedBrandChoice = (brandId) => {
    const selectedBrand = brands.find((b) => b.id === brandId);
    setApprovedPurchaseForm((prev) => ({
      ...prev,
      brand_id: brandId,
      brand: selectedBrand?.name || ''
    }));
    setApprovedBrandMenuOpen(false);
  };

  /** Builds the API body for one approved line (used for draft + bulk submit). */
  const buildApprovedPurchaseLinePayload = () => {
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
      throw new Error('Select or enter the purchase unit (e.g. kg, ml).');
    }
    const bid = String(approvedPurchaseForm.brand_id || '').trim();
    const bname = String(approvedPurchaseForm.brand || '').trim();
    const mfg = optionalLineDate(approvedPurchaseForm.manufacturing_date);
    const exp = optionalLineDate(approvedPurchaseForm.expiry_date);
    return {
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
    };
  };

  const buildOffListLinePayload = () => {
    if (!offListForm.off_list_purchase_reason.trim()) {
      throw new Error('Off-list purchase reason is required.');
    }
    if (!offListForm.inventory_item_id) {
      throw new Error('Select an inventory item for the off-list line.');
    }
    const pq = Number(offListForm.purchased_qty);
    const conv = Number(offListForm.conversion_to_base);
    const lt = Number(offListForm.line_total);
    if (!pq || pq <= 0 || !conv || conv <= 0 || !lt || lt <= 0) {
      throw new Error('Enter purchased qty, conversion to base, and line total (all must be greater than zero).');
    }
    const mfg = optionalLineDate(offListForm.manufacturing_date);
    const exp = optionalLineDate(offListForm.expiry_date);
    const obid = String(offListForm.brand_id || '').trim();
    const obname = String(offListForm.brand || '').trim();
    return {
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
      note: 'Bought outside approved list'
    };
  };

  const extractLineIdsFromBulkResponse = (data, expectedCount) => {
    const empty = () => Array.from({ length: expectedCount }, () => '');
    if (!data || typeof data !== 'object') return empty();
    const raw = data.lines ?? data.created_lines ?? data.receipt_lines ?? data.items;
    if (!Array.isArray(raw) || raw.length === 0) return empty();
    return raw.map((row) => String(row?.line_id ?? row?.id ?? row?.receipt_line_id ?? ''));
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
      setStatus(
        'Receipt created. Add lines to the draft (approved or off-list), then use Submit all draft lines.'
      );
      showStoreSuccess('Receipt created. Add draft lines, then submit in one step.', 'Receipt created');
      clearPurchaseProof();
      clearItemsPhoto();
      await receiptRegisterRef.current?.reloadHistory();
      await receiptRegisterRef.current?.openReceiptLines(receiptId);
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

  const onAddApprovedToDraft = () => {
    if (!activeReceiptId) {
      const msg = 'Create a receipt first using Create receipt, then add lines to the draft.';
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
      const payload = buildApprovedPurchaseLinePayload();
      const itemLabel = selectedApprovedLine?.inventory_item_name || selectedApprovedLine?.requested_item_name || 'Item';
      setReceiptDraftLines((prev) => [
        ...prev,
        {
          key: newDraftLineKey(),
          kind: 'approved',
          label: `Approved · ${String(itemLabel).trim() || '—'}`,
          imageFile: approvedLineImageFile,
          payload
        }
      ]);
      clearApprovedLineImage();
      showStoreSuccess('Line added to draft. Submit all lines when ready.', 'Draft updated');
    } catch (err) {
      const msg = err?.message || formatKitchenStoreApiError(err, 'Could not add to draft.');
      setStatus(msg);
      showStoreError(msg, 'Draft add failed');
    }
  };

  const onAddOffListToDraft = () => {
    if (!activeReceiptId) {
      const msg = 'Create a receipt first, then add off-list lines to the draft.';
      setStatus(msg);
      showStoreError(msg, 'No receipt');
      return;
    }
    setStatus('');
    try {
      const payload = buildOffListLinePayload();
      const item = items.find((it) => String(it.id) === String(offListForm.inventory_item_id));
      const itemLabel = item?.name || 'Off-list item';
      setReceiptDraftLines((prev) => [
        ...prev,
        {
          key: newDraftLineKey(),
          kind: 'off_list',
          label: `Off-list · ${String(itemLabel).trim() || '—'}`,
          imageFile: offListImageFile,
          payload
        }
      ]);
      clearOffListImage();
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
        off_list_purchase_reason: ''
      });
      showStoreSuccess('Off-list line added to draft. Submit all lines when ready.', 'Draft updated');
    } catch (err) {
      const msg = err?.message || formatKitchenStoreApiError(err, 'Could not add to draft.');
      setStatus(msg);
      showStoreError(msg, 'Draft add failed');
    }
  };

  const removeDraftLine = (key) => {
    setReceiptDraftLines((prev) => prev.filter((row) => row.key !== key));
  };

  const onSubmitDraftLines = async () => {
    if (!activeReceiptId) {
      const msg = 'Create or select a receipt before submitting lines.';
      setStatus(msg);
      showStoreError(msg, 'No receipt');
      return;
    }
    if (!receiptDraftLines.length) {
      const msg = 'Add at least one line to the draft (approved or off-list).';
      setStatus(msg);
      showStoreError(msg, 'Draft empty');
      return;
    }
    setDraftSubmitLoading(true);
    setStatus('');
    const payloads = receiptDraftLines.map((d) => d.payload);
    try {
      let lineIds = [];
      try {
        const bulkResult = await addReceiptLinesBulk(activeReceiptId, payloads);
        lineIds = extractLineIdsFromBulkResponse(bulkResult, payloads.length);
      } catch (err) {
        if (err?.response?.status !== 404) throw err;
        lineIds = [];
        for (const row of receiptDraftLines) {
          const r = await addReceiptLine(activeReceiptId, row.payload);
          lineIds.push(String(r?.line_id ?? r?.id ?? ''));
        }
      }
      for (let i = 0; i < receiptDraftLines.length; i++) {
        const row = receiptDraftLines[i];
        const lineId = lineIds[i];
        if (row.imageFile && lineId) {
          try {
            await uploadReceiptLineImage(activeReceiptId, lineId, row.imageFile);
          } catch (imgErr) {
            const imgMsg = formatKitchenStoreApiError(imgErr, 'Lines saved but an image upload failed.');
            setStatus(imgMsg);
            showStoreError(imgMsg, 'Image upload failed');
          }
        }
      }
      setReceiptDraftLines([]);
      setStatus('Draft lines submitted to the receipt.');
      showStoreSuccess('Receipt lines saved.', 'Lines submitted');
      await receiptRegisterRef.current?.reloadHistory();
      await receiptRegisterRef.current?.openReceiptLines(activeReceiptId);
    } catch (err) {
      const msg = formatKitchenStoreApiError(err, 'Failed to submit receipt lines.');
      setStatus(msg);
      showStoreError(msg, 'Submit failed');
    } finally {
      setDraftSubmitLoading(false);
    }
  };

  useEffect(() => {
    setReceiptDraftLines([]);
  }, [activeReceiptId]);

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
            {approvedRequests.map((request) => {
              const ts = request.approved_at || request.created_at;
              const when = ts ? formatDateTimeIST(ts) : request.id;
              return (
                <option key={request.id} value={request.id}>
                  {(request.approval_note || 'Approved request')} - {when}
                </option>
              );
            })}
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
            <div className="text-xs font-medium text-slate-800">Purchased-items photo</div>
            {/* <p className="mt-0.5 text-[11px] text-slate-500">
              One image of all bought goods together (JPEG or PNG). Uploads after the receipt is created.
            </p> */}
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
            <div className="space-y-1">
              <span id="approved-line-label" className="block text-sm font-medium text-slate-800">
                  Item
              </span>
              <div className="relative" ref={approvedLineDropdownRef}>
                <button
                  type="button"
                  id="approved-line-trigger"
                  aria-labelledby="approved-line-label"
                  aria-expanded={approvedLineMenuOpen}
                  aria-haspopup="listbox"
                  disabled={!approvedLines.length}
                  title={approvedLineButtonTitle ?? approvedLineButtonLabel}
                  className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                  onClick={() => {
                    if (!approvedLines.length) return;
                    setApprovedBrandMenuOpen(false);
                    setApprovedLineMenuOpen((o) => !o);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setApprovedLineMenuOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{approvedLineButtonLabel}</span>
                  <span className="shrink-0 text-[10px] text-slate-400" aria-hidden>
                    ▾
                  </span>
                </button>
                {approvedLineMenuOpen && approvedLines.length > 0 ? (
                  <ul
                    className="absolute left-0 right-0 top-full z-[100] mt-0.5 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
                    role="listbox"
                    aria-labelledby="approved-line-label"
                  >
                    <li role="none">
                      <button
                        type="button"
                        role="option"
                        className="flex w-full px-3 py-2 text-left text-slate-800 hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyApprovedLineChoice('')}
                      >
                        Select approved line…
                      </button>
                    </li>
                    {approvedLines.map((line) => {
                      const itemLabel = line.inventory_item_name || line.requested_item_name || '—';
                      const detailHint = `${itemLabel}${line.brand_name ? ` · ${line.brand_name}` : ''} — approved ${line.approved_quantity} ${line.requested_unit}`;
                      return (
                        <li key={line.id} role="none">
                          <button
                            type="button"
                            role="option"
                            title={detailHint}
                            className="flex w-full px-3 py-2 text-left text-slate-800 hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyApprovedLineChoice(line.id)}
                          >
                            <span className="min-w-0 truncate">{String(itemLabel).trim()}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="approved-purchased-qty" className="text-sm font-medium text-slate-800">
                Purchased quantity
              </label>
              <input
                id="approved-purchased-qty"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={approvedPurchaseForm.purchased_qty}
                onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, purchased_qty: e.target.value }))}
                placeholder="e.g. 10"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="approved-purchase-unit" className="text-sm font-medium text-slate-800">
                Purchase unit
              </label>
              {catalogUnits.length > 0 ? (
                <select
                  id="approved-purchase-unit"
                  className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                  value={approvedPurchaseForm.purchase_unit}
                  onChange={(e) =>
                    setApprovedPurchaseForm((prev) => ({ ...prev, purchase_unit: e.target.value }))
                  }
                  title="Defaults to the approved line unit; pick kg, ml, nos, etc. from the catalog if the shop pack differs."
                >
                  <option value="">Select unit…</option>
                  {!catalogUnits.some((u) => u.abbreviation === approvedPurchaseForm.purchase_unit) &&
                  String(approvedPurchaseForm.purchase_unit || '').trim() !== '' ? (
                    <option value={approvedPurchaseForm.purchase_unit}>
                      {approvedPurchaseForm.purchase_unit}
                    </option>
                  ) : null}
                  {catalogUnits.map((u) => (
                    <option key={u.id || u.abbreviation} value={u.abbreviation}>
                      {u.abbreviation}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="approved-purchase-unit"
                  value={approvedPurchaseForm.purchase_unit}
                  onChange={(e) =>
                    setApprovedPurchaseForm((prev) => ({ ...prev, purchase_unit: e.target.value }))
                  }
                  placeholder="e.g. kg (units list unavailable)"
                  title="Standard units list could not be loaded; enter abbreviation manually. Approved line still pre-fills when you pick a line."
                />
              )}
            </div>
            <div className="space-y-1">
              <span id="approved-brand-label" className="block text-sm font-medium text-slate-800">
                Brand
              </span>
              <div className="relative" ref={approvedBrandDropdownRef}>
                <button
                  type="button"
                  id="approved-brand-trigger"
                  aria-labelledby="approved-brand-label"
                  aria-expanded={approvedBrandMenuOpen}
                  aria-haspopup="listbox"
                  className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                  onClick={() => {
                    setApprovedLineMenuOpen(false);
                    setApprovedBrandMenuOpen((o) => !o);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setApprovedBrandMenuOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{approvedBrandButtonLabel}</span>
                  <span className="shrink-0 text-[10px] text-slate-400" aria-hidden>
                    ▾
                  </span>
                </button>
                {approvedBrandMenuOpen ? (
                  <ul
                    className="absolute left-0 right-0 top-full z-[100] mt-0.5 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
                    role="listbox"
                    aria-labelledby="approved-brand-label"
                  >
                    <li role="none">
                      <button
                        type="button"
                        role="option"
                        className="flex w-full px-3 py-2 text-left text-slate-800 hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyApprovedBrandChoice('')}
                      >
                        Brand (optional)
                      </button>
                    </li>
                    {brands.map((brand) => (
                      <li key={brand.id} role="none">
                        <button
                          type="button"
                          role="option"
                          className="flex w-full px-3 py-2 text-left text-slate-800 hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyApprovedBrandChoice(brand.id)}
                        >
                          {brand.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="approved-conversion-base" className="text-sm font-medium text-slate-800">
                Conversion to base
              </label>
              <input
                id="approved-conversion-base"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={approvedPurchaseForm.conversion_to_base}
                onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, conversion_to_base: e.target.value }))}
                placeholder="e.g. 1"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="approved-line-total" className="text-sm font-medium text-slate-800">
                Total paid
              </label>
              <input
                id="approved-line-total"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={approvedPurchaseForm.line_total}
                onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, line_total: e.target.value }))}
                placeholder="Amount paid for this line"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="approved-line-purchase-date" className="text-sm font-medium text-slate-800">
                Purchase date
              </label>
              <input
                id="approved-line-purchase-date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                type="date"
                value={approvedPurchaseForm.purchase_date}
                onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="approved-manufacturing-date" className="text-sm font-medium text-slate-800">
                Manufacturing date <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="approved-manufacturing-date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                type="date"
                value={approvedPurchaseForm.manufacturing_date}
                onChange={(e) =>
                  setApprovedPurchaseForm((prev) => ({ ...prev, manufacturing_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="approved-expiry-date" className="text-sm font-medium text-slate-800">
                Expiry date <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="approved-expiry-date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                type="date"
                value={approvedPurchaseForm.expiry_date}
                onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1 md:col-span-3">
              <label htmlFor="approved-operator-note" className="text-sm font-medium text-slate-800">
                Operator note <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                id="approved-operator-note"
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
                value={approvedPurchaseForm.note}
                onChange={(e) => setApprovedPurchaseForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Notes for this line"
              />
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5 md:col-span-3">
              <div className="text-sm font-medium text-slate-800">
                Item image <span className="font-normal text-slate-500">(optional)</span>
              </div>
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
                onClick={onAddApprovedToDraft}
                disabled={
                  !activeReceiptId ||
                  !approvedLines.length ||
                  !approvedPurchaseForm.purchase_request_line_id ||
                  !catalogItemIdForApprovedLine
                }
              >
                Add to draft
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
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="offlist-item-select" className="block text-sm font-medium text-slate-800">
                Item
              </label>
              <select
                id="offlist-item-select"
                className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                value={offListForm.inventory_item_id}
                onChange={(e) => {
                  const nextId = e.target.value;
                  const item = items.find((it) => it.id === nextId);
                  setOffListForm((prev) => ({
                    ...prev,
                    inventory_item_id: nextId,
                    brand_id: item?.brand_id ? String(item.brand_id) : '',
                    brand: item?.brand_name ? String(item.brand_name) : '',
                    purchase_unit: item ? String(item.unit || '').trim() || prev.purchase_unit : 'kg'
                  }));
                }}
              >
                <option value="">Select item…</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id} title={item.unit ? `Unit: ${item.unit}` : undefined}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0 space-y-1.5">
              <span id="offlist-brand-label" className="block text-sm font-medium text-slate-800">
                Brand
              </span>
              <div className="relative min-w-0" ref={offListBrandDropdownRef}>
                <button
                  type="button"
                  id="offlist-brand-trigger"
                  aria-labelledby="offlist-brand-label"
                  aria-expanded={offListBrandMenuOpen}
                  aria-haspopup="listbox"
                  className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                  onClick={() => setOffListBrandMenuOpen((o) => !o)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setOffListBrandMenuOpen(false);
                  }}
                >
                  <span className="min-w-0 truncate">{offListBrandButtonLabel}</span>
                  <span className="shrink-0 text-[10px] text-slate-400" aria-hidden>
                    ▾
                  </span>
                </button>
                {offListBrandMenuOpen ? (
                  <ul
                    className="absolute left-0 right-0 top-full z-[100] mt-0.5 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
                    role="listbox"
                    aria-labelledby="offlist-brand-label"
                  >
                    <li role="none">
                      <button
                        type="button"
                        role="option"
                        className="flex w-full px-3 py-2 text-left text-slate-800 hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyOffListBrandChoice('')}
                      >
                        Brand (optional)
                      </button>
                    </li>
                    {brands.map((brand) => (
                      <li key={brand.id} role="none">
                        <button
                          type="button"
                          role="option"
                          className="flex w-full px-3 py-2 text-left text-slate-800 hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyOffListBrandChoice(String(brand.id))}
                        >
                          {brand.name}
                        </button>
                      </li>
                    ))}
                    <li role="none">
                      <button
                        type="button"
                        role="option"
                        className="flex w-full px-3 py-2 text-left text-slate-800 hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyOffListBrandChoice(OFFLIST_BRAND_OTHER)}
                      >
                        Other…
                      </button>
                    </li>
                  </ul>
                ) : null}
              </div>
              {offListBrandSelectValue === OFFLIST_BRAND_OTHER ? (
                <input
                  id="offlist-brand-other"
                  className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                  value={offListForm.brand}
                  onChange={(e) =>
                    setOffListForm((prev) => ({
                      ...prev,
                      brand: e.target.value,
                      brand_id: ''
                    }))
                  }
                  placeholder="Enter brand name"
                  autoComplete="off"
                  aria-label="Custom brand name"
                />
              ) : null}
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="offlist-purchased-qty" className="block text-sm font-medium text-slate-800">
                Purchased quantity
              </label>
              <input
                id="offlist-purchased-qty"
                className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                value={offListForm.purchased_qty}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, purchased_qty: e.target.value }))}
                placeholder="e.g. 10"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="offlist-purchase-unit" className="block text-sm font-medium text-slate-800">
                Purchase unit
              </label>
              {catalogUnits.length > 0 ? (
                <select
                  id="offlist-purchase-unit"
                  className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                  value={offListForm.purchase_unit}
                  onChange={(e) =>
                    setOffListForm((prev) => ({ ...prev, purchase_unit: e.target.value }))
                  }
                  title="Defaults from the selected item’s base unit; change if this purchase was in a different pack unit."
                >
                  <option value="">Select unit…</option>
                  {!catalogUnits.some((u) => u.abbreviation === offListForm.purchase_unit) &&
                  String(offListForm.purchase_unit || '').trim() !== '' ? (
                    <option value={offListForm.purchase_unit}>{offListForm.purchase_unit}</option>
                  ) : null}
                  {catalogUnits.map((u) => (
                    <option key={u.id || u.abbreviation} value={u.abbreviation}>
                      {u.abbreviation}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="offlist-purchase-unit"
                  value={offListForm.purchase_unit}
                  onChange={(e) => setOffListForm((prev) => ({ ...prev, purchase_unit: e.target.value }))}
                  placeholder="e.g. kg (units list unavailable)"
                  title="Standard units list could not be loaded; enter abbreviation manually."
                />
              )}
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="offlist-conversion-base" className="block text-sm font-medium text-slate-800">
                Conversion to base
              </label>
              <input
                id="offlist-conversion-base"
                className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                value={offListForm.conversion_to_base}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, conversion_to_base: e.target.value }))}
                placeholder="e.g. 1"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="offlist-line-total" className="block text-sm font-medium text-slate-800">
                Total paid
              </label>
              <input
                id="offlist-line-total"
                className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                value={offListForm.line_total}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, line_total: e.target.value }))}
                placeholder="Amount"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="offlist-purchase-date" className="block text-sm font-medium text-slate-800">
                Purchase date
              </label>
              <input
                id="offlist-purchase-date"
                className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                type="date"
                value={offListForm.purchase_date}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="offlist-mfg-date" className="block text-sm font-medium text-slate-800">
                Manufacturing date <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="offlist-mfg-date"
                className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                type="date"
                value={offListForm.manufacturing_date}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, manufacturing_date: e.target.value }))}
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <label htmlFor="offlist-expiry-date" className="block text-sm font-medium text-slate-800">
                Expiry date <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                id="offlist-expiry-date"
                className="w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                type="date"
                value={offListForm.expiry_date}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
            <div className="min-w-0 sm:col-span-2 lg:col-span-3">
              <label htmlFor="offlist-reason" className="block text-sm font-medium text-slate-800">
                Off-list reason
              </label>
              <textarea
                id="offlist-reason"
                rows={3}
                className="mt-1.5 w-full min-w-0 resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-500"
                value={offListForm.off_list_purchase_reason}
                onChange={(e) => setOffListForm((prev) => ({ ...prev, off_list_purchase_reason: e.target.value }))}
                placeholder="Why this item is off the approved list"
              />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:col-span-2 lg:col-span-3 lg:grid-cols-2 lg:items-start lg:gap-x-8">
              <div className="min-w-0 rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5">
                <div className="text-sm font-medium text-slate-800">
                  Item image <span className="font-normal text-slate-500">(optional)</span>
                </div>
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
              <div className="flex justify-end self-start justify-self-end pt-0.5">
                <Button type="button" variant="warning" onClick={onAddOffListToDraft}>
                  Add off-list to draft
                </Button>
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

      <StoreSection title="Submit items" tone="slate">
        <p className="mb-3 text-sm text-slate-600">
          Add lines to the draft, then submit them in one transaction. Optional line photos upload after lines are
          created.
        </p>
        {receiptDraftLines.length === 0 ? (
          <p className="text-sm text-slate-500">No draft lines yet. Use &quot;Add to draft&quot; above.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Type</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-[100px] text-right">Photo</TableHead>
                  <TableHead className="w-[90px] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptDraftLines.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="text-sm capitalize">{row.kind === 'off_list' ? 'Off-list' : 'Approved'}</TableCell>
                    <TableCell className="text-sm">{row.label}</TableCell>
                    <TableCell className="text-right text-xs text-slate-600">
                      {row.imageFile ? row.imageFile.name : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => removeDraftLine(row.key)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={onSubmitDraftLines}
            disabled={!activeReceiptId || receiptDraftLines.length === 0 || draftSubmitLoading}
          >
            {draftSubmitLoading ? 'Submitting…' : 'Submit all '}
          </Button>
        </div>
      </StoreSection>

      <OperatorReceiptRegisterSections
        ref={receiptRegisterRef}
        purchaseRequestId={selectedRequestId}
        onActiveReceiptChange={setActiveReceiptId}
      />
    </StorePageShell>
  );
};

export default StoreOperatorPurchaseReceiptsPage;

