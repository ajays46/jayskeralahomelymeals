import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection, StoreTableFrame } from '@/components/store/StorePageShell';
import { useKitchenReceiptsApi } from '../../hooks/adminHook/kitchenStoreHook';

function formatReceiptDateOnly(value) {
  if (value == null || value === '') return '-';
  const s = String(value);
  const dayPart = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) return dayPart;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().slice(0, 10);
}

function receiptDayKey(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  const dayPart = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) return dayPart;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const receiptControlClass =
  'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

const StoreManagerPurchaseReceiptsPage = () => {
  const { listReceipts, listReceiptLines } = useKitchenReceiptsApi();
  const [history, setHistory] = useState([]);
  const [selectedLines, setSelectedLines] = useState([]);
  const [activeReceiptId, setActiveReceiptId] = useState('');
  const [status, setStatus] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadReceiptHistory = async () => {
    setStatus('');
    setLoadingHistory(true);
    try {
      const out = await listReceipts();
      const rows = Array.isArray(out) ? out : [];
      setHistory(rows);
      if (rows.length === 0) {
        setStatus('No purchase receipts returned for this register.');
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

  const filteredHistory = useMemo(() => {
    const invQ = invoiceSearch.trim().toLowerCase();
    return history.filter((row) => {
      const inv = (row.reference_invoice || '').toLowerCase();
      if (invQ && !inv.includes(invQ)) return false;
      const day = receiptDayKey(row.received_at || row.created_at);
      if (dateFrom && (!day || day < dateFrom)) return false;
      if (dateTo && (!day || day > dateTo)) return false;
      return true;
    });
  }, [history, invoiceSearch, dateFrom, dateTo]);

  const receiptFiltersActive = invoiceSearch.trim() !== '' || dateFrom !== '' || dateTo !== '';

  const clearReceiptFilters = () => {
    setInvoiceSearch('');
    setDateFrom('');
    setDateTo('');
  };

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
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <StoreSection
        title="Purchase Receipts"
        description={
          receiptFiltersActive
            ? `Showing ${filteredHistory.length} of ${history.length} receipts in the loaded register.`
            : undefined
        }
        tone="sky"
        headerActions={
          <Button type="button" variant="outline" onClick={loadReceiptHistory} disabled={loadingHistory}>
            {loadingHistory ? 'Refreshing...' : 'Refresh Register'}
          </Button>
        }
      >
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
            <label htmlFor="mgr-rcpt-invoice" className="text-xs font-medium text-slate-600">
              Invoice contains
            </label>
            <input
              id="mgr-rcpt-invoice"
              type="search"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder="Reference invoice…"
              className={`${receiptControlClass} w-full min-w-0`}
              autoComplete="off"
            />
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="mgr-rcpt-from" className="text-xs font-medium text-slate-600">
              From date
            </label>
            <input
              id="mgr-rcpt-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${receiptControlClass} w-full sm:w-auto`}
            />
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="mgr-rcpt-to" className="text-xs font-medium text-slate-600">
              To date
            </label>
            <input
              id="mgr-rcpt-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${receiptControlClass} w-full sm:w-auto`}
            />
          </div>
          {receiptFiltersActive ? (
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearReceiptFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
        <StoreTableFrame className="max-h-[330px] overflow-y-auto">
          <Table wrapperClassName="relative w-full overflow-visible">
            <TableHeader>
              <TableRow>
                <TableHead>Receipt date</TableHead>
                <TableHead>Request ID</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Invoice URL</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-slate-500">
                    {history.length === 0
                      ? 'No receipts loaded. Refresh the register.'
                      : 'No receipts match the current filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((row) => {
                  const receiptId = row.id || row.receipt_id;
                  const receiptDateRaw = row.received_at || row.created_at;
                  return (
                    <TableRow key={receiptId}>
                      <TableCell className="font-medium">{formatReceiptDateOnly(receiptDateRaw)}</TableCell>
                      <TableCell>{row.purchase_request_id || '-'}</TableCell>
                      <TableCell>{row.reference_invoice || '-'}</TableCell>
                      <TableCell className="max-w-40 truncate">
                        {row.invoice_s3_url ? (
                          <a href={row.invoice_s3_url} target="_blank" rel="noreferrer" className="text-sky-700 underline">
                            Open
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{row.invoice_uploaded_at || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => openReceiptLines(receiptId)}>
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </StoreTableFrame>
      </StoreSection>

      <StoreSection title="Receipt Detials" tone="amber">
        {!activeReceiptId ? <StoreNotice tone="amber">Open a receipt to view receipt details.</StoreNotice> : null}
        {activeReceiptId ? (
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-700">
            <span>Receipt:</span>
            <Badge variant="outline">{activeReceiptId}</Badge>
            {loadingLines ? <span className="text-slate-500">Loading lines...</span> : null}
          </div>
        ) : null}
        {selectedLines.length > 0 ? (
          <StoreTableFrame className="overflow-x-auto">
            <Table wrapperClassName="relative w-full overflow-visible">
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
          </StoreTableFrame>
        ) : null}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerPurchaseReceiptsPage;
