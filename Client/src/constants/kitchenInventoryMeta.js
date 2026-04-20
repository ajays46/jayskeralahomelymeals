/** @feature kitchen-store — purchase line options (Tasks 5–6). Items use `category` only (no per-item freshness enum). */

/** Daily purchase request line `freshness_priority` (API examples use URGENT). */
export const LINE_FRESHNESS_PRIORITY_OPTIONS = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgent' }
];
