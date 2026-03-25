import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { useCompanyBasePath } from '../../context/TenantContext';
import {
  useKitchenInventoryMock,
  useKitchenPurchaseRequestOperatorApi,
  useKitchenReceiptsApi
} from '../../hooks/adminHook/kitchenStoreHook';

const today = () => new Date().toISOString().slice(0, 10);

const StoreOperatorPurchaseReceiptsPage = () => {
  const basePath = useCompanyBasePath();
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
  const { createReceipt, addReceiptLine, listReceipts, listReceiptLines } = useKitchenReceiptsApi();

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

  const loadReceiptHistory = async () => {
    setStatus('');
    try {
      const out = await listReceipts();
      const rows = Array.isArray(out) ? out : out?.receipts || out?.items || [];
      setHistory(rows);
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

  const createLinkedReceipt = async () => {
    if (!selectedRequestId) {
      setStatus('Choose an approved request before creating a receipt.');
      return;
    }
    setStatus('');
    try {
      const out = await createReceipt({
        purchase_request_id: selectedRequestId,
        reference_invoice: referenceInvoice.trim() || undefined
      });
      const receiptId = String(out?.receipt_id ?? out?.id ?? '');
      if (!receiptId) {
        setStatus('Receipt created, but the receipt id was not returned.');
        return;
      }
      setActiveReceiptId(receiptId);
      setSelectedLines([]);
      setStatus(`Linked receipt created for the approved request.`);
      await loadReceiptHistory();
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create linked receipt.');
    }
  };

  const onAddApprovedLine = async () => {
    if (!activeReceiptId) {
      setStatus('Create a receipt first before adding approved items.');
      return;
    }
    if (!selectedApprovedLine) {
      setStatus('Choose an approved line to add.');
      return;
    }
    setStatus('');
    try {
      await addReceiptLine(activeReceiptId, {
        inventory_item_id: selectedApprovedLine.inventory_item_id,
        purchase_request_line_id: selectedApprovedLine.id,
        purchased_qty: Number(approvedPurchaseForm.purchased_qty),
        purchase_unit: approvedPurchaseForm.purchase_unit,
        conversion_to_base: Number(approvedPurchaseForm.conversion_to_base),
        line_total: Number(approvedPurchaseForm.line_total),
        purchase_date: approvedPurchaseForm.purchase_date,
        note: approvedPurchaseForm.note.trim() || 'Bought from approved list'
      });
      setStatus('Approved purchase line added to receipt.');
      await openReceiptLines(activeReceiptId);
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to add approved line.');
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
    setStatus('');
    try {
      await addReceiptLine(activeReceiptId, {
        inventory_item_id: offListForm.inventory_item_id,
        purchased_qty: Number(offListForm.purchased_qty),
        purchase_unit: offListForm.purchase_unit,
        conversion_to_base: Number(offListForm.conversion_to_base),
        line_total: Number(offListForm.line_total),
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
      <StorePageHeader
        title="Purchase Receipts"
        description="Create a receipt linked to an approved request, add approved items, and record off-list purchases when needed."
        actions={[
          <Button key="approved" asChild><Link to={`${basePath}/store-operator/approved-requests`}>Approved Requests</Link></Button>,
          <Button key="comparison" asChild variant="outline"><Link to={`${basePath}/store-operator/purchase-comparison`}>Purchase Comparison</Link></Button>
        ]}
        tone="emerald"
      />
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
        {selectedRequest ? (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Badge variant="success">{selectedRequest.status}</Badge>
            {selectedRequest.approval_note ? <Badge variant="info">Approval note: {selectedRequest.approval_note}</Badge> : null}
            {selectedRequest.approved_at ? <Badge variant="secondary">Approved: {selectedRequest.approved_at}</Badge> : null}
          </div>
        ) : null}
      </StoreSection>

      <StoreSection title="Receipt Header" tone="sky">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            className="rounded border px-3 py-2"
            value={referenceInvoice}
            onChange={(e) => setReferenceInvoice(e.target.value)}
            placeholder="Reference invoice"
          />
          <Button type="button" onClick={createLinkedReceipt}>
            Create Linked Receipt
          </Button>
        </div>
        {activeReceiptId ? <Badge variant="info">Active receipt: {activeReceiptId}</Badge> : null}
      </StoreSection>

      <StoreSection title="Add Approved Purchase Line" tone="emerald">
        {approvedLines.length === 0 ? (
          <StoreNotice tone="amber">No approved lines are available for the selected request.</StoreNotice>
        ) : (
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
              placeholder="Line total"
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
              placeholder="Optional note"
            />
            <Button type="button" onClick={onAddApprovedLine}>
              Add Approved Line
            </Button>
          </div>
        )}
        {selectedApprovedLine ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">Requested: {selectedApprovedLine.requested_quantity} {selectedApprovedLine.requested_unit}</Badge>
            <Badge variant="success">Approved: {selectedApprovedLine.approved_quantity} {selectedApprovedLine.requested_unit}</Badge>
          </div>
        ) : null}
      </StoreSection>

      <StoreSection title="Add Off-List Purchase" tone="amber">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded border px-3 py-2"
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
            className="rounded border px-3 py-2"
            value={offListForm.purchased_qty}
            onChange={(e) => setOffListForm((prev) => ({ ...prev, purchased_qty: e.target.value }))}
            placeholder="Purchased qty"
            type="number"
            min="0"
            step="0.01"
          />
          <input
            className="rounded border px-3 py-2"
            value={offListForm.purchase_unit}
            onChange={(e) => setOffListForm((prev) => ({ ...prev, purchase_unit: e.target.value }))}
            placeholder="Purchase unit"
          />
          <input
            className="rounded border px-3 py-2"
            value={offListForm.conversion_to_base}
            onChange={(e) => setOffListForm((prev) => ({ ...prev, conversion_to_base: e.target.value }))}
            placeholder="Conversion to base"
            type="number"
            min="0"
            step="0.01"
          />
          <input
            className="rounded border px-3 py-2"
            value={offListForm.line_total}
            onChange={(e) => setOffListForm((prev) => ({ ...prev, line_total: e.target.value }))}
            placeholder="Line total"
            type="number"
            min="0"
            step="0.01"
          />
          <input
            className="rounded border px-3 py-2"
            type="date"
            value={offListForm.purchase_date}
            onChange={(e) => setOffListForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
          />
          <input
            className="rounded border px-3 py-2 md:col-span-2"
            value={offListForm.off_list_purchase_reason}
            onChange={(e) => setOffListForm((prev) => ({ ...prev, off_list_purchase_reason: e.target.value }))}
            placeholder="Off-list purchase reason"
          />
          <Button type="button" variant="warning" onClick={onAddOffListLine}>
            Add Off-List Line
          </Button>
          <textarea
            className="rounded border px-3 py-2 text-sm md:col-span-3"
            value={offListForm.note}
            onChange={(e) => setOffListForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Optional note"
          />
        </div>
      </StoreSection>

      <StoreSection
        title="Receipt Register"
        tone="sky"
        headerActions={
          <Button type="button" variant="outline" onClick={loadReceiptHistory}>Refresh Register</Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt ID</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Received At</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((row) => (
              <TableRow key={row.id || row.receipt_id}>
                <TableCell className="font-medium">{row.id || row.receipt_id}</TableCell>
                <TableCell>{row.reference_invoice || '-'}</TableCell>
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
      </StoreSection>

      <StoreSection title="Received Item Lines" tone="amber">
        {selectedLines.length === 0 ? (
          <StoreNotice tone="amber">Open a receipt to view received item lines.</StoreNotice>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Purchased Qty</TableHead>
                <TableHead>Base Qty</TableHead>
                <TableHead>Line Total</TableHead>
                <TableHead>Comparison</TableHead>
                <TableHead>Manager Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedLines.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.inventory_item_name || row.inventory_item_id}</TableCell>
                  <TableCell>{row.purchased_qty} {row.purchase_unit}</TableCell>
                  <TableCell>{row.received_qty_in_base_unit}</TableCell>
                  <TableCell>{row.line_total}</TableCell>
                  <TableCell>{row.comparison_status || '-'}</TableCell>
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

