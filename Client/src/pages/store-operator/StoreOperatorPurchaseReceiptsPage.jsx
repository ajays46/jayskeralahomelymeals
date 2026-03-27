import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import {
  useKitchenInventoryMock,
  useKitchenPurchaseRequestOperatorApi,
  useKitchenReceiptsApi
} from '../../hooks/adminHook/kitchenStoreHook';

const today = () => new Date().toISOString().slice(0, 10);

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
  const { items } = useKitchenInventoryMock();
  const {
    approvedRequests,
    approvedLines,
    bootstrapLoading,
    error,
    listApprovedRequests,
    fetchApprovedLines
  } = useKitchenPurchaseRequestOperatorApi();
  const { uploadReceiptInvoice, createReceipt, addReceiptLine, listReceipts, listReceiptLines } =
    useKitchenReceiptsApi();

  const [selectedRequestId, setSelectedRequestId] = useState(searchParams.get('requestId') || '');
  const [referenceInvoice, setReferenceInvoice] = useState('');
  const [invoiceS3Key, setInvoiceS3Key] = useState('');
  const [invoiceS3Url, setInvoiceS3Url] = useState('');
  const [activeReceiptId, setActiveReceiptId] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedLines, setSelectedLines] = useState([]);
  const [status, setStatus] = useState('');
  const [approvedPurchaseForm, setApprovedPurchaseForm] = useState({
    purchase_request_line_id: '',
    purchased_qty: '',
    purchase_unit: '',
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
  const purchaseProofInputRef = useRef(null);
  const purchaseProofPreviewUrl = useMemo(
    () => (purchaseProofFile ? URL.createObjectURL(purchaseProofFile) : null),
    [purchaseProofFile]
  );

  useEffect(() => {
    return () => {
      if (purchaseProofPreviewUrl) URL.revokeObjectURL(purchaseProofPreviewUrl);
    };
  }, [purchaseProofPreviewUrl]);

  const onPurchaseProofFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setPurchaseProofFile(f);
  };

  const clearPurchaseProof = () => {
    setPurchaseProofFile(null);
    if (purchaseProofInputRef.current) purchaseProofInputRef.current.value = '';
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
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt history.');
    }
  };

  const openReceiptLines = async (receiptId) => {
    setActiveReceiptId(receiptId);
    setStatus('');
    try {
      const rows = await listReceiptLines(receiptId);
      setSelectedLines(rows);
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt lines.');
    }
  };

  const addApprovedLineToReceipt = async (receiptId) => {
    if (!selectedApprovedLine) {
      throw new Error('Choose an approved line to add.');
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
    await addReceiptLine(receiptId, {
      inventory_item_id: selectedApprovedLine.inventory_item_id,
      purchase_request_line_id: selectedApprovedLine.id,
      purchased_qty: pq,
      purchase_unit: approvedPurchaseForm.purchase_unit.trim(),
      conversion_to_base: conv,
      line_total: lt,
      purchase_date: approvedPurchaseForm.purchase_date,
      note: approvedPurchaseForm.note.trim() || 'Bought from approved list'
    });
  };

  const onCreateReceipt = async () => {
    if (!selectedRequestId) {
      setStatus('Choose an approved request before creating a receipt.');
      return;
    }
    setStatus('');
    try {
      if (purchaseProofFile) {
        const contentType = purchaseProofFile.type || 'application/octet-stream';
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(contentType)) {
          setStatus('Invoice file must be PDF, JPG, or PNG.');
          return;
        }
      }
      const manualInvoiceS3Key = invoiceS3Key.trim() || undefined;
      const manualInvoiceS3Url = invoiceS3Url.trim() || undefined;

      const out = await createReceipt({
        purchase_request_id: selectedRequestId,
        reference_invoice: referenceInvoice.trim() || undefined,
        invoice_s3_key: manualInvoiceS3Key,
        invoice_s3_url: manualInvoiceS3Url
      });
      const receiptId = String(out?.receipt_id ?? out?.id ?? '');
      if (!receiptId) {
        setStatus('Receipt created, but the receipt id was not returned.');
        return;
      }
      if (purchaseProofFile) {
        setInvoiceUploadLoading(true);
        const uploaded = await uploadReceiptInvoice(receiptId, purchaseProofFile);
        setInvoiceS3Key(uploaded?.invoice_s3_key || '');
        setInvoiceS3Url(uploaded?.invoice_s3_url || '');
      }
      setActiveReceiptId(receiptId);
      setSelectedLines([]);
      setStatus('Receipt created. Use Add item to record approved lines on this receipt.');
      clearPurchaseProof();
      await loadReceiptHistory();
      await openReceiptLines(receiptId);
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Failed to create receipt.');
    } finally {
      setInvoiceUploadLoading(false);
    }
  };

  const onAddApprovedPurchaseLine = async () => {
    if (!activeReceiptId) {
      setStatus('Create a receipt first using Create receipt, then add items.');
      return;
    }
    if (!approvedLines.length) {
      setStatus('No approved lines are available for the selected request.');
      return;
    }
    setStatus('');
    try {
      await addApprovedLineToReceipt(activeReceiptId);
      setStatus('Approved line added to the receipt.');
      await loadReceiptHistory();
      await openReceiptLines(activeReceiptId);
    } catch (err) {
      setStatus(
        err?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          'Failed to add line to receipt.'
      );
    }
  };

  const onAddOffListLine = async () => {
    if (!activeReceiptId) {
      setStatus('Create a receipt first before adding off-list items.');
      return;
    }
    if (!offListForm.off_list_purchase_reason.trim()) {
      setStatus('Off-list purchase reason is required.');
      return;
    }
    if (!offListForm.inventory_item_id) {
      setStatus('Select an inventory item for the off-list line.');
      return;
    }
    const pq = Number(offListForm.purchased_qty);
    const conv = Number(offListForm.conversion_to_base);
    const lt = Number(offListForm.line_total);
    if (!pq || pq <= 0 || !conv || conv <= 0 || !lt || lt <= 0) {
      setStatus('Enter purchased qty, conversion to base, and line total (all must be greater than zero).');
      return;
    }
    setStatus('');
    try {
      await addReceiptLine(activeReceiptId, {
        inventory_item_id: offListForm.inventory_item_id,
        purchased_qty: pq,
        purchase_unit: offListForm.purchase_unit.trim() || 'kg',
        conversion_to_base: conv,
        line_total: lt,
        purchase_date: offListForm.purchase_date,
        off_list_purchase_reason: offListForm.off_list_purchase_reason.trim(),
        note: offListForm.note.trim() || 'Bought outside approved list'
      });
      setStatus('Off-list purchase line added to receipt.');
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
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to add off-list line.');
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
          <input
            className="rounded border px-3 py-2"
            value={invoiceS3Key}
            onChange={(e) => setInvoiceS3Key(e.target.value)}
            placeholder="Invoice S3 key (optional)"
          />
          <input
            className="rounded border px-3 py-2 md:col-span-2"
            value={invoiceS3Url}
            onChange={(e) => setInvoiceS3Url(e.target.value)}
            placeholder="Invoice S3 URL (optional)"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={onCreateReceipt} disabled={!selectedRequestId || invoiceUploadLoading}>
            {invoiceUploadLoading ? 'Uploading invoice...' : 'Create receipt'}
          </Button>
        </div>

        <div className="mt-4 text-sm font-medium text-slate-700">Add Approved Purchase Line</div>
        {approvedLines.length === 0 ? (
          <StoreNotice tone="amber">No approved lines are available for the selected request.</StoreNotice>
        ) : (
          <>
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
                  purchase_unit: nextLine?.requested_unit || ''
                }));
              }}
            >
              <option value="">Select approved item</option>
              {approvedLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {(line.inventory_item_name || line.requested_item_name)} - approved {line.approved_quantity} {line.requested_unit}
                </option>
              ))}
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
              placeholder="Total"
              type="number"
              min="0"
              step="0.01"
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
            </div>

            <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
              <div className="text-sm font-medium text-slate-800">Purchase receipt image</div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
                <input
                  ref={purchaseProofInputRef}
                  id="purchase-proof-image"
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  aria-label="Choose purchase receipt image"
                  onChange={onPurchaseProofFileChange}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => purchaseProofInputRef.current?.click()}>
                    Choose image
                  </Button>
                  {purchaseProofFile ? (
                    <Button type="button" variant="ghost" size="sm" className="text-slate-600" onClick={clearPurchaseProof}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                {purchaseProofPreviewUrl ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-dashed border-slate-200 bg-white p-2 sm:max-w-md">
                    <img
                      src={purchaseProofPreviewUrl}
                      alt="Selected purchase receipt preview"
                      className="max-h-48 w-full rounded-md object-contain"
                    />
                    <span className="truncate text-xs text-slate-500" title={purchaseProofFile?.name || ''}>
                      {purchaseProofFile?.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex min-h-[5rem] flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/80 px-4 text-center text-xs text-slate-400 sm:max-w-md">
                    No image selected
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={onAddApprovedPurchaseLine} disabled={!activeReceiptId || !approvedLines.length}>
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
              Add Off-List Line
            </Button>
            <textarea
              className="rounded border px-2 py-1.5 text-xs md:col-span-3"
              value={offListForm.note}
              onChange={(e) => setOffListForm((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Optional note"
            />
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
                <TableHead>Invoice URL</TableHead>
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
                  <TableCell className="max-w-44 truncate">
                    {row.invoice_s3_url ? (
                      <a
                        href={row.invoice_s3_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 underline"
                      >
                        Open
                      </a>
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
                <TableHead>Purchased Qty</TableHead>
                <TableHead>Base Qty</TableHead>
                <TableHead>Unit price (base)</TableHead>
                <TableHead>Line Total</TableHead>
                <TableHead>Comparison</TableHead>
                <TableHead>Off-list reason</TableHead>
                <TableHead>Manager Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedLines.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.inventory_item_name || row.inventory_item_id}</TableCell>
                  <TableCell>{row.purchased_qty} {row.purchase_unit}</TableCell>
                  <TableCell>{row.received_qty_in_base_unit}</TableCell>
                  <TableCell>{row.unit_price_in_base ? row.unit_price_in_base.toFixed(4) : '-'}</TableCell>
                  <TableCell>{row.line_total}</TableCell>
                  <TableCell>{row.comparison_status || '-'}</TableCell>
                  <TableCell className="max-w-48 text-sm">{row.off_list_purchase_reason || '-'}</TableCell>
                  <TableCell>{row.manager_review_status || '-'}</TableCell>
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

