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
  selectedLines: []
});

/** @feature kitchen-store — browser draft for operator purchase request composer (localStorage). */
export const PURCHASE_REQUEST_DRAFT_VERSION = 1;

export const getPurchaseRequestDraftStorageKey = (companyPath) => {
  const p = String(companyPath || 'default').replace(/^\/+|\/+$/g, '') || 'default';
  return `jks:kitchen:purchase-request-draft:v${PURCHASE_REQUEST_DRAFT_VERSION}:${p}`;
};

const serializeKindBucketForDraft = (bucket) => ({
  requestedNote: bucket?.requestedNote ?? '',
  forDate: bucket?.forDate ?? '',
  urgency: bucket?.urgency ?? 'NORMAL',
  selectedLines: (bucket?.selectedLines || []).map((line) => ({
    local_id: line.local_id,
    inventory_item_id: line.inventory_item_id ?? '',
    requested_item_name: String(line.requested_item_name ?? ''),
    requested_unit: String(line.requested_unit ?? ''),
    requested_quantity: String(line.requested_quantity ?? ''),
    is_new_item: Boolean(line.is_new_item),
    operator_note: String(line.operator_note ?? ''),
    brand_name: String(line.brand_name ?? ''),
    brand_logo_s3_url: String(line.brand_logo_s3_url ?? ''),
    item_primary_image_url: String(line.item_primary_image_url ?? ''),
    freshness_priority: String(line.freshness_priority ?? '')
  }))
});

/** @param {{ buckets?: Record<string, unknown> }} payload */
export const draftPayloadHasContent = (payload) => {
  if (!payload?.buckets || typeof payload.buckets !== 'object') return false;
  for (const k of [PURCHASE_KIND.WEEKLY, PURCHASE_KIND.DAILY]) {
    const b = payload.buckets[k];
    if (!b) continue;
    if (Array.isArray(b.selectedLines) && b.selectedLines.length > 0) return true;
    if (String(b.requestedNote || '').trim()) return true;
  }
  return false;
};

/** @param {{ [key: string]: { requestedNote?: string; selectedLines?: unknown[] } }} buckets */
export const currentBucketsHaveDraftableContent = (buckets) => {
  if (!buckets || typeof buckets !== 'object') return false;
  return draftPayloadHasContent({ buckets: { [PURCHASE_KIND.WEEKLY]: buckets[PURCHASE_KIND.WEEKLY], [PURCHASE_KIND.DAILY]: buckets[PURCHASE_KIND.DAILY] } });
};

export const hydrateKindBucketFromDraft = (raw) => {
  const base = emptyKindBucket();
  if (!raw || typeof raw !== 'object') return base;
  const lines = Array.isArray(raw.selectedLines) ? raw.selectedLines : [];
  const urgencyFromDraft = (() => {
    const u = typeof raw.urgency === 'string' && raw.urgency ? String(raw.urgency).toUpperCase() : base.urgency;
    if (u === 'URGENT') return 'MEDIUM';
    if (u === 'CRITICAL') return 'HIGH';
    if (u === 'NORMAL' || u === 'MEDIUM' || u === 'HIGH') return u;
    return base.urgency;
  })();

  return {
    ...base,
    requestedNote: typeof raw.requestedNote === 'string' ? raw.requestedNote : '',
    forDate: typeof raw.forDate === 'string' && raw.forDate ? raw.forDate : base.forDate,
    urgency: urgencyFromDraft,
    selectedLines: lines.map((line) => ({
      local_id: line.local_id || createLocalLineId(),
      inventory_item_id: line.inventory_item_id ? String(line.inventory_item_id) : '',
      requested_item_name: String(line.requested_item_name || ''),
      requested_unit: String(line.requested_unit || ''),
      requested_quantity: String(line.requested_quantity ?? ''),
      is_new_item: Boolean(line.is_new_item),
      operator_note: String(line.operator_note || ''),
      brand_name: String(line.brand_name || ''),
      brand_logo_s3_url: String(line.brand_logo_s3_url || ''),
      item_primary_image_url: String(line.item_primary_image_url || ''),
      freshness_priority: String(line.freshness_priority || '')
    }))
  };
};

export const hydrateBucketsFromDraftPayload = (payload) => ({
  [PURCHASE_KIND.WEEKLY]: hydrateKindBucketFromDraft(payload?.buckets?.[PURCHASE_KIND.WEEKLY]),
  [PURCHASE_KIND.DAILY]: hydrateKindBucketFromDraft(payload?.buckets?.[PURCHASE_KIND.DAILY])
});

export const readPurchaseRequestDraftPayload = (companyPath) => {
  try {
    const raw = localStorage.getItem(getPurchaseRequestDraftStorageKey(companyPath));
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || o.v !== PURCHASE_REQUEST_DRAFT_VERSION || !o.buckets || typeof o.buckets !== 'object') return null;
    return { savedAt: o.savedAt || null, buckets: o.buckets };
  } catch {
    return null;
  }
};

export const writePurchaseRequestDraftToStorage = (companyPath, buckets) => {
  const payload = {
    v: PURCHASE_REQUEST_DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    buckets: {
      [PURCHASE_KIND.WEEKLY]: serializeKindBucketForDraft(buckets[PURCHASE_KIND.WEEKLY]),
      [PURCHASE_KIND.DAILY]: serializeKindBucketForDraft(buckets[PURCHASE_KIND.DAILY])
    }
  };
  localStorage.setItem(getPurchaseRequestDraftStorageKey(companyPath), JSON.stringify(payload));
};

export const clearPurchaseRequestDraftFromStorage = (companyPath) => {
  try {
    localStorage.removeItem(getPurchaseRequestDraftStorageKey(companyPath));
  } catch {
    /* ignore */
  }
};

/** After a successful submit for one purchase kind, drop that slice from the saved draft (or remove file if empty). */
export const stripPurchaseRequestDraftKindFromStorage = (companyPath, submittedKind) => {
  const prev = readPurchaseRequestDraftPayload(companyPath);
  if (!prev?.buckets) return;
  const next = {
    v: PURCHASE_REQUEST_DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    buckets: {
      ...prev.buckets,
      [submittedKind]: serializeKindBucketForDraft(emptyKindBucket())
    }
  };
  if (!draftPayloadHasContent(next)) clearPurchaseRequestDraftFromStorage(companyPath);
  else localStorage.setItem(getPurchaseRequestDraftStorageKey(companyPath), JSON.stringify(next));
};

/**
 * Summarize one purchase kind from serialized localStorage draft (`buckets[kind]`).
 * @param {string} kind `PURCHASE_KIND.WEEKLY` | `PURCHASE_KIND.DAILY`
 * @param {unknown} serializedBucket
 */
export const summarizePurchaseRequestDraftKind = (kind, serializedBucket) => {
  if (!serializedBucket || typeof serializedBucket !== 'object') {
    return {
      kind,
      lineCount: 0,
      forDate: '',
      urgency: 'NORMAL',
      notePreview: '',
      hasContent: false,
      previewItemNames: []
    };
  }
  const lines = Array.isArray(serializedBucket.selectedLines) ? serializedBucket.selectedLines : [];
  const lineCount = lines.length;
  const note = String(serializedBucket.requestedNote || '').trim();
  const hasContent = lineCount > 0 || Boolean(note);
  const previewItemNames = lines
    .map((line) => (line && typeof line === 'object' ? String(line.requested_item_name || '').trim() : ''))
    .filter(Boolean)
    .slice(0, 6);
  const notePreview = note.length > 140 ? `${note.slice(0, 137)}…` : note;
  return {
    kind,
    lineCount,
    forDate: String(serializedBucket.forDate || ''),
    urgency: String(serializedBucket.urgency || 'NORMAL'),
    notePreview,
    hasContent,
    previewItemNames
  };
};

/** Read local draft for draft-inbox UI (same device / browser as composer). */
export const readPurchaseRequestDraftInboxView = (companyPath) => {
  const payload = readPurchaseRequestDraftPayload(companyPath);
  if (!payload?.buckets) {
    return {
      exists: false,
      savedAt: null,
      weekly: summarizePurchaseRequestDraftKind(PURCHASE_KIND.WEEKLY, null),
      daily: summarizePurchaseRequestDraftKind(PURCHASE_KIND.DAILY, null),
      hasAny: false
    };
  }
  const weekly = summarizePurchaseRequestDraftKind(PURCHASE_KIND.WEEKLY, payload.buckets[PURCHASE_KIND.WEEKLY]);
  const daily = summarizePurchaseRequestDraftKind(PURCHASE_KIND.DAILY, payload.buckets[PURCHASE_KIND.DAILY]);
  return {
    exists: true,
    savedAt: payload.savedAt || null,
    weekly,
    daily,
    hasAny: weekly.hasContent || daily.hasContent
  };
};

export const SOURCE_SECTIONS = [
  { key: 'lowStockItems', title: 'Low Stock Alerts', empty: 'No low-stock items returned.' },
  { key: 'shoppingList', title: 'Shopping List Items', empty: 'No shopping list items were returned.' }
];

export const SOURCE_TABLE_SCROLLABLE_KEYS = new Set(['lowStockItems', 'shoppingList']);
export const SOURCE_TABLE_VISIBLE_BODY_ROWS = 4;
export const SOURCE_TABLE_SCROLL_MAX_HEIGHT = `calc(2.5rem + ${SOURCE_TABLE_VISIBLE_BODY_ROWS} * 3.25rem)`;

export const PurchaseSourceItemCell = ({ name, brandName, catalogImageUrl, logoUrl }) => {
  const thumb =
    (typeof catalogImageUrl === 'string' && catalogImageUrl.trim()) ||
    (typeof logoUrl === 'string' && logoUrl.trim()) ||
    '';
  return (
    <div className="flex min-w-0 items-center gap-2">
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="h-9 w-9 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
        />
      ) : null}
      <div className="min-w-0">
        <div className="truncate font-medium">{name || 'Unnamed item'}</div>
        {brandName ? <div className="truncate text-xs text-slate-500">{brandName}</div> : null}
      </div>
    </div>
  );
};

export const toDisplayQuantity = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
  return String(Number(value));
};
