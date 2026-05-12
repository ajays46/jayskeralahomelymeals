/**
 * API base URL for HTTP clients. Vite sets import.meta.env.MODE (development | production).
 */
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_NODE_ENV === 'development'
    ? import.meta.env.VITE_DEV_API_URL
    : import.meta.env.VITE_PROD_API_URL) ||
  'http://localhost:5000';
