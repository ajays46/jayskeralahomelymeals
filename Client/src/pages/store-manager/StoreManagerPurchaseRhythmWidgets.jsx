import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StoreSection } from '@/components/store/StorePageShell';

/** @feature kitchen-store — Shared tables + shortage/receipt panels for purchase rhythm UIs. */

function collectRowKeys(rows, maxCols) {
  const keys = [];
  const seen = new Set();
  const cap = maxCols ?? 8;
  for (const row of rows.slice(0, 40)) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    for (const k of Object.keys(row)) {
      if (seen.has(k)) continue;
      seen.add(k);
      keys.push(k);
      if (keys.length >= cap) return keys;
    }
  }
  return keys;
}

function stringifyCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && !Number.isFinite(value)) return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** Approximate thead + N tbody row heights for a compact scroll viewport. */
function maxHeightRemForVisibleDataRows(n) {
  const headerRem = 2.875;
  const rowRem = 2.625;
  return headerRem + Math.max(0, n) * rowRem;
}

/** @param {{ rows: unknown[], emptyMessage?: string, maxVisibleDataRows?: number }} props */
export const DynamicObjectTable = ({ rows, emptyMessage, maxVisibleDataRows }) => {
  const keys = useMemo(() => collectRowKeys(rows || [], 10), [rows]);
  const list = Array.isArray(rows) ? rows : [];

  if (!list.length) {
    return <StoreNotice tone="amber">{emptyMessage || 'No rows returned.'}</StoreNotice>;
  }

  const scrollMax =
    maxVisibleDataRows != null && Number.isFinite(maxVisibleDataRows) && maxVisibleDataRows > 0
      ? { maxHeight: `${maxHeightRemForVisibleDataRows(maxVisibleDataRows)}rem` }
      : undefined;
  const scrollClass =
    scrollMax != null
      ? 'overflow-auto rounded-md border'
      : 'max-h-[20rem] overflow-auto rounded-md border';

  return (
    <div className={scrollClass} style={scrollMax}>
      <Table>
        <TableHeader>
          <TableRow>
            {keys.map((k) => (
              <TableHead key={k} className="whitespace-nowrap">
                {k}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((row, idx) => (
            <TableRow key={idx}>
              {keys.map((k) => (
                <TableCell key={k} className="max-w-[14rem] truncate text-sm" title={stringifyCell(row?.[k])}>
                  {stringifyCell(row?.[k])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

function extractPurchaseRhythmListLocal(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const keys = ['items', 'requests', 'results', 'queue', 'rows', 'lines', 'receipts'];
  for (const k of keys) {
    const arr = raw[k];
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

/** @param {{ loadingDaily: boolean, dailyShortage: unknown, dailyReceiptsToday: unknown }} props */
export const StoreManagerShortageReceiptPanels = ({ loadingDaily, dailyShortage, dailyReceiptsToday }) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <StoreSection title="Shortage detection" tone="rose">
      {loadingDaily ? (
        <StoreNotice tone="sky">Loading…</StoreNotice>
      ) : Array.isArray(dailyShortage) ? (
        <DynamicObjectTable rows={dailyShortage} emptyMessage="No shortage rows returned." />
      ) : dailyShortage && typeof dailyShortage === 'object' ? (
        <DynamicObjectTable rows={extractPurchaseRhythmListLocal(dailyShortage)} emptyMessage="No shortage rows returned." />
      ) : (
        <StoreNotice tone="amber">No shortage data returned.</StoreNotice>
      )}
    </StoreSection>
    <StoreSection title="Stock receipt today" tone="sky">
      {loadingDaily ? (
        <StoreNotice tone="sky">Loading…</StoreNotice>
      ) : Array.isArray(dailyReceiptsToday) ? (
        <DynamicObjectTable
          rows={dailyReceiptsToday}
          emptyMessage="No receipt rows for today."
          maxVisibleDataRows={3}
        />
      ) : dailyReceiptsToday && typeof dailyReceiptsToday === 'object' ? (
        <DynamicObjectTable
          rows={extractPurchaseRhythmListLocal(dailyReceiptsToday)}
          emptyMessage="No receipt rows for today."
          maxVisibleDataRows={3}
        />
      ) : (
        <StoreNotice tone="amber">No stock receipt data returned.</StoreNotice>
      )}
    </StoreSection>
  </div>
);
