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
    const store = useAuthStore.getState();
    const accessToken = store.accessToken; // Adjust this based on your store structure

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Add API Key if available (for AI Route Optimization API)
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
    
    // If the data is FormData, remove Content-Type to let axios set it automatically with boundary
    // This is critical for file uploads to work correctly in production
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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