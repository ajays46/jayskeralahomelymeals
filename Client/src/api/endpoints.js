/**
 * Centralized API namespace + version registry.
 * Change a version or namespace here → every hook/page picks it up automatically.
 *
 * Usage:
 *   import { API } from '../api/endpoints';
 *   api.get(`${API.MAX_KITCHEN}/orders`);
 *   api.post(`${API.JAICE}/assistant/chat`, body);
 */

const V1 = 'v1';

// ──── Product namespaces ────
export const API = Object.freeze({
  /** MaX Kitchen — food-delivery SaaS */
  MAX_KITCHEN:  `/max_kitchen/${V1}`,
  /** Guide paths: `/inventory/items`, movements, alerts, FEFO, expiry (same BFF auth as kitchen-store). */
  MAX_KITCHEN_INVENTORY: `/max_kitchen/${V1}/inventory`,
  /** Guide paths: `/purchase/purchase-requests`, weekly/daily, receipts, traceability. */
  MAX_KITCHEN_PURCHASE: `/max_kitchen/${V1}/purchase`,

  /** MaX Route — last-mile logistics */
  MAX_ROUTE:    `/max_route/${V1}`,

  /** Jaice — AI assistants */
  JAICE:        `/jaice/${V1}`,

  /** Auth — registration, login, token refresh, password */
  AUTH:         `/${V1}/auth`,

  /** Admin — company CRUD, products, menus, users */
  ADMIN:        `/${V1}/admin`,

  /** Addresses — user address CRUD */
  ADDRESSES:    `/${V1}/addresses`,

  /** CXO — CEO/CFO dashboards */
  CXO:          `/${V1}/cxo`,

  /** Delivery Dashboard — CEO delivery analytics */
  DELIVERY_DASH:`/${V1}/delivery-dashboard`,

  /** Financial — CEO/CFO financial summary */
  FINANCIAL:    `/${V1}/financial`,

  /** External — image upload proxy (unversioned) */
  EXTERNAL:     `/external`,

  /** Tenant — company resolution (unversioned) */
  TENANT:       ``,
});

/**
 * Helper: build a full path under a namespace.
 *   buildUrl(API.MAX_KITCHEN, '/orders', orderId)  →  '/max_kitchen/v1/orders/123'
 */
export function buildUrl(namespace, ...segments) {
  const path = segments
    .filter(Boolean)
    .map(s => String(s).replace(/^\//, ''))
    .join('/');
  return `${namespace}/${path}`;
}
