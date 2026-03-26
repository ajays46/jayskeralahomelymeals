import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { useKitchenReceiptsApi } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerPurchaseReceiptsPage = () => {
  const { listReceipts, listReceiptLines } = useKitchenReceiptsApi();
  const [history, setHistory] = useState([]);
  const [selectedLines, setSelectedLines] = useState([]);
  const [activeReceiptId, setActiveReceiptId] = useState('');
  const [status, setStatus] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);

  const loadReceiptHistory = async () => {
    setStatus('');
    setLoadingHistory(true);
    try {
      const out = await listReceipts();
      const rows = Array.isArray(out) ? out : out?.receipts || out?.items || [];
      setHistory(rows);
      if (rows.length === 0) {
        setStatus('No purchase receipts found for the current filters.');
      }
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt register.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadReceiptHistory();
    // initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openReceiptLines = async (receiptId) => {
    if (!receiptId) return;
    setActiveReceiptId(receiptId);
    setStatus('');
    setLoadingLines(true);
    try {
      const rows = await listReceiptLines(receiptId);
      setSelectedLines(rows);
      if (rows.length === 0) {
        setStatus('No lines found for this receipt.');
      }
    } catch (err) {
      setStatus(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to load receipt lines.');
    } finally {
      setLoadingLines(false);
    }
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Receipt Register"
        description="Manager read-only view of purchase receipts and received line details."
        tone="sky"
      />

      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <StoreSection
        title="Purchase Receipts"
        tone="sky"
        headerActions={
          <Button type="button" variant="outline" onClick={loadReceiptHistory} disabled={loadingHistory}>
            {loadingHistory ? 'Refreshing...' : 'Refresh Register'}
          </Button>
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
            {history.map((row) => {
              const receiptId = row.id || row.receipt_id;
              return (
                <TableRow key={receiptId}>
                  <TableCell className="font-medium">{receiptId}</TableCell>
                  <TableCell>{row.reference_invoice || '-'}</TableCell>
                  <TableCell>{row.received_at || row.created_at || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => openReceiptLines(receiptId)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </StoreSection>

      <StoreSection title="Receipt Lines" tone="amber">
        {!activeReceiptId ? <StoreNotice tone="amber">Open a receipt to view line-level details.</StoreNotice> : null}
        {activeReceiptId ? (
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-700">
            <span>Receipt:</span>
            <Badge variant="outline">{activeReceiptId}</Badge>
            {loadingLines ? <span className="text-slate-500">Loading lines...</span> : null}
          </div>
        ) : null}
        {selectedLines.length > 0 ? (
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
                  <TableCell>
                    {row.purchased_qty} {row.purchase_unit}
                  </TableCell>
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
        ) : null}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerPurchaseReceiptsPage;
