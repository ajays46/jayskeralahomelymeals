/**
 * Production base company path. Set VITE_DEFAULT_COMPANY_PATH in .env for production (e.g. jkhm).
 * When user opens site root (/) they are redirected to /{DEFAULT_COMPANY_PATH}.
 */
export const DEFAULT_COMPANY_PATH =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_COMPANY_PATH) || 'jkhm';

/**
 * Returns default base path (e.g. /jkhm). Use in utils when TenantContext is not available.
 */
export function getCompanyBasePathFallback() {
  return `/${DEFAULT_COMPANY_PATH}`;
}
