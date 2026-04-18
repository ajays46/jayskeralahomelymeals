/**
 * Centralized API namespace + version registry.
 * Change a version or namespace here → every hook/page picks it up automatically.
 *
 * Full kitchen-inventory URLs (see FRONTEND_GUIDE_FULL.md §1): `{axios baseURL}/max_kitchen/v1/...`
 * Set `VITE_DEV_API_URL` / `VITE_PROD_API_URL` to the Node API root that ends with `/api`
 * (e.g. `http://127.0.0.1:5005/api`) so requests resolve to `/api/max_kitchen/v1/...`.
 *
 * Namespaces on that prefix: `inventory`, `purchase`, `store`, `recipe`, `kitchen` (guide §9),
 * `kitchen-store` (legacy: Prisma catalog menus, meal-report), plus orders/seller/etc.
 * JSON envelope (guide §2): upstream `{ ok, data }`; Node BFF often `{ success, data }` — use
 * `readMaxKitchenClientEnvelope` when reading axios responses.
 * Auth (guide §3/§6): Bearer + `X-Company-ID` / `X-User-ID` (axios interceptor). Kitchen JWT: `API.MAX_KITCHEN_AUTH/login`.
 *
 * Usage:
 *   import { API, readMaxKitchenClientEnvelope } from '../api/endpoints';
 */

const V1 = 'v1';

// ──── Product namespaces ────
export const API = Object.freeze({
  /** MaX Kitchen — food-delivery SaaS (`/api/max_kitchen/v1` when baseURL ends with `/api`). */
  MAX_KITCHEN:  `/max_kitchen/${V1}`,
  /** Guide §9.2 — `/store/brands`, brand logo upload/view-url. */
  MAX_KITCHEN_STORE_REST: `/max_kitchen/${V1}/store`,
  /** Guide §9.4 — `/recipe/recipes/lines`. */
  MAX_KITCHEN_RECIPE: `/max_kitchen/${V1}/recipe`,
  /** Guide §9.5 — `/kitchen/menus`, `/kitchen/plans`, `/kitchen/reconciliation`. */
  MAX_KITCHEN_KITCHEN: `/max_kitchen/${V1}/kitchen`,
  /**
   * Legacy BFF `/kitchen-store` — Prisma `GET …/v1/catalog/menus`, `GET …/meal-report`, and older v1/v2 duplicates.
   */
  MAX_KITCHEN_STORE: `/max_kitchen/${V1}/kitchen-store`,
  /** Guide paths: `/inventory/items`, movements, alerts, FEFO, expiry (same BFF auth as kitchen-store). */
  MAX_KITCHEN_INVENTORY: `/max_kitchen/${V1}/inventory`,
  /** Guide paths: `/purchase/purchase-requests`, weekly/daily, receipts, traceability, `/purchase/reports/*`. */
  MAX_KITCHEN_PURCHASE: `/max_kitchen/${V1}/purchase`,
  /** Guide §4: `POST /auth/login` (full URL: `/api/max_kitchen/v1/auth/login` when base ends with `/api`). */
  MAX_KITCHEN_AUTH: `/max_kitchen/${V1}/auth`,
  /** Proxied upstream health (smoke test); BFF route on Node — guide §5 / §7 step 1. */
  MAX_KITCHEN_HEALTH: `/max_kitchen/${V1}/kitchen-store/v1/health`,

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

/**
 * Extract the inner JSON payload from a Max Kitchen axios response (guide §2).
 * Supports Node BFF `{ success, data }` and upstream-style `{ ok, data }`.
 * Returns `undefined` when the body explicitly sets `ok` or `success` to `false`.
 * Leaves non-object bodies (e.g. raw blob when caller used responseType blob) unchanged.
 */
export function readMaxKitchenClientEnvelope(response) {
  if (!response || typeof response !== 'object') return undefined;
  const body = response.data;
  if (body == null) return undefined;
  if (typeof body !== 'object') return body;
  if (body instanceof Blob) return body;
  if (Array.isArray(body)) return body;
  if (body.ok === false || body.success === false) return undefined;
  if (Object.prototype.hasOwnProperty.call(body, 'data')) return body.data;
  return body;
}
