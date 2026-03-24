import React, { useState } from 'react';
import { useKitchenInventoryMock, useKitchenReceiptsApi } from '../../hooks/adminHook/kitchenStoreHook';

const StoreOperatorPurchaseReceiptsPage = () => {
  const { items } = useKitchenInventoryMock();
  const { createReceipt, addReceiptLine, listReceipts, listReceiptLines } = useKitchenReceiptsApi();

  const [referenceInvoice, setReferenceInvoice] = useState('');
  const [activeReceiptId, setActiveReceiptId] = useState('');
  const [line, setLine] = useState({
    inventory_item_id: '',
    purchased_qty: '',
    purchase_unit: 'kg',
    conversion_to_base: '1',
    line_total: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    note: ''
  });
  const [history, setHistory] = useState([]);
  const [selectedLines, setSelectedLines] = useState([]);
  const [status, setStatus] = useState('');

  const onCreateReceipt = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const out = await createReceipt(referenceInvoice || null);
      const receiptId = out?.receipt_id || out?.id;
      if (receiptId) {
        setActiveReceiptId(receiptId);
        setStatus(`Receipt created: ${receiptId}`);
      } else {
        setStatus('Receipt created.');
      }
      setReferenceInvoice('');
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create receipt');
    }
  };

  const onAddLine = async (e) => {
    e.preventDefault();
    if (!activeReceiptId) {
      setStatus('Create/select a receipt first.');
      return;
    }
    try {
      await addReceiptLine(activeReceiptId, {
        inventory_item_id: line.inventory_item_id,
        purchased_qty: Number(line.purchased_qty),
        purchase_unit: line.purchase_unit,
        conversion_to_base: Number(line.conversion_to_base),
        line_total: Number(line.line_total),
        purchase_date: line.purchase_date,
        note: line.note || null
      });
      setStatus('Receipt line added.');
      setLine((prev) => ({ ...prev, purchased_qty: '', line_total: '', note: '' }));
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to add receipt line');
    }
  };

  const onLoadHistory = async () => {
    setStatus('');
    try {
      const out = await listReceipts();
      const rows = Array.isArray(out) ? out : out?.receipts || [];
      setHistory(rows);
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt history');
    }
  };

  const onOpenLines = async (receiptId) => {
    setActiveReceiptId(receiptId);
    setStatus('');
    try {
      const out = await listReceiptLines(receiptId);
      const rows = Array.isArray(out) ? out : out?.lines || [];
      setSelectedLines(rows);
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt lines');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border p-6">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Receipts</h1>
          <p className="text-gray-600 mt-2">
            Operator APIs: `POST /v2/purchases/receipts`, `POST /v2/purchases/receipts/{'{receipt_id}'}/lines`, `GET /v2/purchases/receipts`, `GET /v2/purchases/receipts/{'{receipt_id}'}/lines`
          </p>
          {status ? <p className="text-sm mt-2 text-gray-700">{status}</p> : null}
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900">1) Create Receipt Header</h2>
          <form onSubmit={onCreateReceipt} className="flex flex-wrap gap-3 mt-4">
            <input
              className="border rounded px-3 py-2 min-w-[250px]"
              value={referenceInvoice}
              onChange={(e) => setReferenceInvoice(e.target.value)}
              placeholder="Reference invoice (optional)"
            />
            <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">Create Receipt</button>
          </form>
          {activeReceiptId ? <p className="text-sm mt-3 text-gray-600">Active receipt: {activeReceiptId}</p> : null}
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900">2) Add Purchased Line</h2>
          <form onSubmit={onAddLine} className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <select className="border rounded px-3 py-2" value={line.inventory_item_id} onChange={(e) => setLine((p) => ({ ...p, inventory_item_id: e.target.value }))} required>
              <option value="">Select item</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
            <input className="border rounded px-3 py-2" value={line.purchased_qty} onChange={(e) => setLine((p) => ({ ...p, purchased_qty: e.target.value }))} placeholder="Purchased qty" required />
            <input className="border rounded px-3 py-2" value={line.purchase_unit} onChange={(e) => setLine((p) => ({ ...p, purchase_unit: e.target.value }))} placeholder="Purchase unit" required />
            <input className="border rounded px-3 py-2" value={line.conversion_to_base} onChange={(e) => setLine((p) => ({ ...p, conversion_to_base: e.target.value }))} placeholder="Conversion to base" required />
            <input className="border rounded px-3 py-2" value={line.line_total} onChange={(e) => setLine((p) => ({ ...p, line_total: e.target.value }))} placeholder="Line total" required />
            <input className="border rounded px-3 py-2" value={line.purchase_date} onChange={(e) => setLine((p) => ({ ...p, purchase_date: e.target.value }))} type="date" required />
            <input className="border rounded px-3 py-2 md:col-span-2" value={line.note} onChange={(e) => setLine((p) => ({ ...p, note: e.target.value }))} placeholder="Note" />
            <button type="submit" className="bg-emerald-600 text-white rounded px-4 py-2">Add Line</button>
          </form>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">3) Receipt History</h2>
            <button type="button" className="bg-gray-900 text-white rounded px-4 py-2" onClick={onLoadHistory}>Refresh History</button>
          </div>
          <table className="w-full mt-4 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Receipt ID</th>
                <th className="py-2">Invoice</th>
                <th className="py-2">Received At</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id || row.receipt_id} className="border-b last:border-0">
                  <td className="py-2">{row.id || row.receipt_id}</td>
                  <td className="py-2">{row.reference_invoice || '-'}</td>
                  <td className="py-2">{row.received_at || '-'}</td>
                  <td className="py-2">
                    <button type="button" className="text-blue-600 underline" onClick={() => onOpenLines(row.id || row.receipt_id)}>
                      View Lines
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900">4) Receipt Line Details</h2>
          <table className="w-full mt-4 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Item</th>
                <th className="py-2">Purchased Qty</th>
                <th className="py-2">Base Qty</th>
                <th className="py-2">Unit Price Base</th>
                <th className="py-2">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedLines.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2">{row.inventory_item_name || row.inventory_item_id}</td>
                  <td className="py-2">{row.purchased_qty} {row.purchase_unit}</td>
                  <td className="py-2">{row.received_qty_in_base_unit}</td>
                  <td className="py-2">{row.unit_price_in_base}</td>
                  <td className="py-2">{row.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreOperatorPurchaseReceiptsPage;

