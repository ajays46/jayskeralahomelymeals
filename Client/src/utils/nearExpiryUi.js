/**
 * Near-expiry display helpers (`GET /inventory/expiry/near-expiry` rows).
 * Guide status: EXPIRED, CRITICAL (≤1d), WARNING (2–3d), APPROACHING (4–7d).
 */

const STATUS_RANK = {
  EXPIRED: 0,
  CRITICAL: 1,
  WARNING: 2,
  APPROACHING: 3
};

const rankOf = (s) => STATUS_RANK[String(s || '').toUpperCase()] ?? 99;

const worseStatus = (a, b) => (rankOf(a) <= rankOf(b) ? String(a || '').toUpperCase() : String(b || '').toUpperCase());

/** Sort worst-first (EXPIRED first), then soonest `days_until_expiry`. */
export function compareNearExpiryInfo(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const ra = rankOf(a.status);
  const rb = rankOf(b.status);
  if (ra !== rb) return ra - rb;
  const da = Number.isFinite(a.days_until_expiry) ? a.days_until_expiry : 9999;
  const db = Number.isFinite(b.days_until_expiry) ? b.days_until_expiry : 9999;
  return da - db;
}

/**
 * Collapse multiple batches per catalog item to one row: worst status + soonest expiry.
 * @param {unknown[]} rows
 * @returns {Record<string, { status: string, days_until_expiry: number|null, expiry_date: string, batch_count: number }>}
 */
/**
 * Normalize API near-expiry batch rows for display (one list entry per batch).
 * Sorted worst-first like the table aggregate.
 * @param {unknown[]} rows
 * @returns {Array<{ batch_id: string, inventory_item_id: string, item_name: string, remaining_quantity: string, days_until_expiry: number|null, status: string, expiry_date: string }>}
 */
export function normalizeNearExpiryBatchRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list
    .map((raw) => {
      const batch_id = String(raw?.batch_id ?? '').trim();
      const inventory_item_id = String(raw?.inventory_item_id ?? raw?.item_id ?? '').trim();
      const status = String(raw?.status || 'APPROACHING').toUpperCase();
      const n = raw?.days_until_expiry != null ? Number(raw.days_until_expiry) : NaN;
      const days_until_expiry = Number.isFinite(n) ? n : null;
      const expiry_date = raw?.expiry_date != null ? String(raw.expiry_date) : '';
      const item_name = String(raw?.item_name ?? '').trim() || 'Unknown item';
      const remaining_quantity =
        raw?.remaining_quantity != null ? String(raw.remaining_quantity).trim() : '';
      return {
        batch_id,
        inventory_item_id,
        item_name,
        remaining_quantity,
        days_until_expiry,
        status,
        expiry_date,
        ui_color_hint: raw?.ui_color_hint != null ? String(raw.ui_color_hint).toLowerCase() : '',
        ui_severity_rank: raw?.ui_severity_rank != null && Number.isFinite(Number(raw.ui_severity_rank)) ? Number(raw.ui_severity_rank) : null
      };
    })
    .filter((r) => r.batch_id || r.inventory_item_id)
    .sort((a, b) => compareNearExpiryInfo(a, b));
}

export function mergeNearExpiryRowsIntoMap(rows) {
  const map = {};
  const list = Array.isArray(rows) ? rows : [];
  for (const raw of list) {
    const itemId = String(raw?.inventory_item_id ?? raw?.item_id ?? '').trim();
    if (!itemId) continue;
    const status = String(raw?.status || 'APPROACHING').toUpperCase();
    const n = raw?.days_until_expiry != null ? Number(raw.days_until_expiry) : NaN;
    const d = Number.isFinite(n) ? n : null;
    const expiry_date = raw?.expiry_date != null ? String(raw.expiry_date) : '';
    const prev = map[itemId];
    if (!prev) {
      map[itemId] = { status, days_until_expiry: d, expiry_date, batch_count: 1 };
      continue;
    }
    const nextStatus = worseStatus(prev.status, status);
    let nextDays = prev.days_until_expiry;
    if (d != null) nextDays = nextDays == null ? d : Math.min(nextDays, d);
    let nextExpiry = prev.expiry_date;
    if (d != null && (prev.days_until_expiry == null || d < prev.days_until_expiry)) {
      if (expiry_date) nextExpiry = expiry_date;
    } else if (!nextExpiry && expiry_date) {
      nextExpiry = expiry_date;
    }
    map[itemId] = {
      status: nextStatus,
      days_until_expiry: nextDays,
      expiry_date: nextExpiry,
      batch_count: prev.batch_count + 1
    };
  }
  return map;
}

/**
 * Table row highlight when the item has an EXPIRE stock movement (manual expiry write-off from adjustments).
 * Stronger visual than near-expiry warnings so teams see “stock removed as expired” at a glance.
 */
export const expireMovementRowClassName =
  'bg-red-50/95 border-l-4 border-l-red-600 hover:bg-red-50/85';

/** Compact badge for the expiry column when an EXPIRE movement exists. */
export const expireMovementChipClassName =
  'bg-red-100 text-red-900 border border-red-200';

/**
 * @param {string} itemId
 * @param {Record<string, unknown>} nearExpiryByItemId
 * @param {boolean} hasExpireMovement — true if movements include EXPIRE for this item
 * @returns {string|undefined}
 */
export function inventoryStockTableRowClassName(itemId, nearExpiryByItemId, hasExpireMovement) {
  if (hasExpireMovement) return expireMovementRowClassName;
  const exp = nearExpiryByItemId[itemId];
  return exp ? nearExpiryRowClassName(exp) : undefined;
}

/** Tailwind classes for table row background + left accent (stock listing). */
export function nearExpiryRowClassName(info) {
  if (!info) return '';
  const hint = String(info.ui_color_hint || '').toLowerCase();
  if (hint === 'danger' || hint === 'critical') return 'bg-red-50/95 border-l-4 border-l-red-600';
  if (hint === 'warning') return 'bg-amber-50/85 border-l-4 border-l-amber-500';
  if (hint === 'caution') return 'bg-yellow-50/80 border-l-4 border-l-yellow-400';
  const s = String(info.status || '').toUpperCase();
  if (s === 'EXPIRED') return 'bg-red-50/95 border-l-4 border-l-red-600';
  if (s === 'CRITICAL') return 'bg-orange-50/90 border-l-4 border-l-orange-500';
  if (s === 'WARNING') return 'bg-amber-50/85 border-l-4 border-l-amber-500';
  if (s === 'APPROACHING') return 'bg-yellow-50/80 border-l-4 border-l-yellow-400';
  return 'bg-amber-50/60 border-l-4 border-l-amber-300';
}

/** Short countdown / label for item cell. */
export function nearExpiryCountdownLabel(info) {
  if (!info) return '';
  const s = String(info.status || '').toUpperCase();
  const d = info.days_until_expiry;
  if (s === 'EXPIRED' || (Number.isFinite(d) && d < 0)) return 'Expired';
  if (!Number.isFinite(d)) return s.replace(/_/g, ' ');
  if (d === 0) return 'Expires today';
  if (d === 1) return '1 day left';
  return `${d} days left`;
}

/** Pill / chip classes for a compact badge next to status. */
export function nearExpiryChipClassName(info) {
  if (!info) return 'bg-slate-100 text-slate-600 border border-slate-200';
  const s = String(info.status || '').toUpperCase();
  if (s === 'EXPIRED') return 'bg-red-100 text-red-900 border border-red-200';
  if (s === 'CRITICAL') return 'bg-orange-100 text-orange-900 border border-orange-200';
  if (s === 'WARNING') return 'bg-amber-100 text-amber-950 border border-amber-300';
  if (s === 'APPROACHING') return 'bg-yellow-100 text-yellow-950 border border-yellow-300';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
}
