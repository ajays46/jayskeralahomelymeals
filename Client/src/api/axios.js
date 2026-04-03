import axios from 'axios';
import useAuthStore from '../stores/Zustand.store';

/**
 * Axios Configuration - HTTP client setup with authentication and error handling
 * Handles API requests with automatic token injection and response/error interceptors
 * Features: Automatic authentication, token refresh, error handling, environment-based URLs
 */

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_NODE_ENV === 'development'  ? import.meta.env.VITE_DEV_API_URL: import.meta.env.VITE_PROD_API_URL,
  withCredentials: true, // This is important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  config => {
    // multipart/form-data must set its own boundary; the default JSON Content-Type breaks file uploads (multer sees no file).
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    const store = useAuthStore.getState();
    const accessToken = store.accessToken;

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Add X-Company-ID for company-scoped APIs (sellers, delivery executives/managers, active executives, ai-routes, driver maps).
    // Do NOT send for /api/admin/delivery-executives (admin list) — only for ai-routes and delivery-executives (exec API).
    // X-User-ID for ai-routes: delivery manager isolation (plan sets created_by). See FRONTEND_DELIVERY_MANAGER_ISOLATION_GUIDE.md
    const url = config.url || '';
    const isAiApi = url.includes('ai-routes');
    const isCxoApi = url.includes('cxo');
    const isDeliveryExecutiveApi = url.includes('delivery-executives') && !url.includes('/api/admin');
    const isDriverMapsApi = url.includes('drivers/next-stop-maps') || url.includes('drivers/route-overview-maps');
    const isMlTripsApi = url.includes('ml-trips');
    const isShiftApi = url.includes('shift');
    const isMlAssistantApi = url.includes('ml-assistant');
    // @feature kitchen-store — attach X-Company-ID / X-User-ID for BFF
    const isKitchenStoreApi = url.includes('kitchen-store');
    const isCompanyScoped = url.includes('sellers-with-orders') || url.includes('delivery-managers') || url.includes('active-executives') || isAiApi || isCxoApi || isDeliveryExecutiveApi || isDriverMapsApi || isMlTripsApi || isShiftApi || isMlAssistantApi || isKitchenStoreApi;
    const needsUserId =
      isAiApi || isCxoApi || isDriverMapsApi || isMlAssistantApi || isKitchenStoreApi;
    if (isCompanyScoped) {
      const companyId = store.user?.companyId || store.user?.company_id || localStorage.getItem('company_id');
      if (companyId) {
        config.headers['X-Company-ID'] = companyId;
      }
    }
    if (needsUserId) {
      const userId = store.user?.id;
      if (userId) {
        config.headers['X-User-ID'] = userId;
      }
    }
    
    // Add API Key if available (for AI Route Optimization API)
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// IMPROVED RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  response => {
    // Extract rate limit headers if present
    if (response.headers['x-ratelimit-limit']) {
      // Rate limit info available - can be used for UI display
      // Store in response for potential use
      response.rateLimitInfo = {
        limit: response.headers['x-ratelimit-limit'],
        remaining: response.headers['x-ratelimit-remaining'],
        reset: response.headers['x-ratelimit-reset']
      };
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Handle rate limiting (429 Too Many Requests)
    if (error.response?.status === 429) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      const errorMessage = error.response?.data?.error || 'Rate limit exceeded. Please try again later.';
      
      // Log rate limit error
      console.warn('Rate limit exceeded', {
        resetTime: resetTime ? new Date(parseInt(resetTime) * 1000).toISOString() : 'Unknown',
        message: errorMessage
      });
      
      // Return error with rate limit info
      return Promise.reject({
        ...error,
        rateLimitInfo: {
          resetTime: resetTime ? parseInt(resetTime) * 1000 : null,
          message: errorMessage
        }
      });
    }

    // Handle API key authentication errors (401)
    if (error.response?.status === 401) {
      // Check if it's an API key error (not token expiration)
      if (error.response?.data?.error?.includes('API key') || error.response?.data?.message?.includes('API key')) {
        console.error('API key authentication failed:', error.response.data);
        return Promise.reject({
          ...error,
          isApiKeyError: true,
          message: error.response?.data?.error || error.response?.data?.message || 'API key authentication failed'
        });
      }
      
      // Only retry once and avoid infinite loops (for token refresh)
      if (!originalRequest._retry && error.response?.data?.expired) {
        originalRequest._retry = true;

        try {
          const res = await axiosInstance.post('/auth/refresh-token');
          const { accessToken } = res.data;

          // ✅ Update Zustand store
          const store = useAuthStore.getState();
          if (store.setAccessToken) {
            store.setAccessToken(accessToken);
          }

          // Set the new token for the failed request
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Clear the store
          const store = useAuthStore.getState();
          if (store.logout) {
            store.logout();
          }

          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 