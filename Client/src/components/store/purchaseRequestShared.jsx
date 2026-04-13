import React from 'react';

/** @feature kitchen-store — shared constants + cells for operator/manager purchase request UIs. */

export const PURCHASE_KIND = {
  WEEKLY: 'weekly',
  DAILY: 'daily'
};

export const purchaseTypeApi = (kind) => (kind === PURCHASE_KIND.WEEKLY ? 'WEEKLY' : 'DAILY');

export const defaultLocalISODate = () => new Date().toISOString().slice(0, 10);

export const PURCHASE_KIND_META = {
  [PURCHASE_KIND.WEEKLY]: {
    label: 'Weekly purchase',
    notePrefix: '[Weekly purchase]',
    blurb:
      'Use this for planned or bulk replenishment for the week. Request lines and notes are kept separate from the daily tab.',
    formSectionTone: 'emerald'
  },
  [PURCHASE_KIND.DAILY]: {
    label: 'Daily purchase',
    notePrefix: '[Daily purchase]',
    blurb:
      'Use this for same-day or short-cycle needs. Request lines and notes are kept separate from the weekly tab.',
    formSectionTone: 'violet'
  }
};

export const createLocalLineId = () => `pr-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const formatRequestReference = (requestId) => {
  const rawId = String(requestId || '').trim();
  if (!rawId) return 'Not returned by API';
  if (rawId.length <= 8) return rawId.toUpperCase();
  return `PR-${rawId.slice(0, 8).toUpperCase()}`;
};

export const emptyKindBucket = () => ({
  requestedNote: '',
  forDate: defaultLocalISODate(),
  urgency: 'NORMAL',
  selectedLines: [],
  expandedLineNotes: {}
});

export const SOURCE_SECTIONS = [
  { key: 'lowStockItems', title: 'Low Stock Alerts', empty: 'No low-stock items returned.' },
  { key: 'shoppingList', title: 'Shopping List Items', empty: 'No shopping list items were returned.' }
];

export const SOURCE_TABLE_SCROLLABLE_KEYS = new Set(['lowStockItems', 'shoppingList']);
export const SOURCE_TABLE_VISIBLE_BODY_ROWS = 4;
export const SOURCE_TABLE_SCROLL_MAX_HEIGHT = `calc(2.5rem + ${SOURCE_TABLE_VISIBLE_BODY_ROWS} * 3.25rem)`;

export const PurchaseSourceItemCell = ({ name, brandName, logoUrl }) => (
  <div className="flex min-w-0 items-center gap-2">
    {logoUrl ? (
      <img
        src={logoUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded-md border border-slate-200 bg-white object-contain"
      />
    ) : null}
    <div className="min-w-0">
      <div className="truncate font-medium">{name || 'Unnamed item'}</div>
      {brandName ? <div className="truncate text-xs text-slate-500">{brandName}</div> : null}
    </div>
  </div>
);

export const toDisplayQuantity = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
  return String(Number(value));
};
