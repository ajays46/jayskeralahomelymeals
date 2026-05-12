/**
 * API base URL for HTTP clients. Vite sets import.meta.env.MODE (development | production).
 */
export const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_PROD_API_URL
    : import.meta.env.VITE_API_URL;
