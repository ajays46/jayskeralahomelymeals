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
  // Don't set Content-Type in default headers - it will be set conditionally in interceptor
});

axiosInstance.interceptors.request.use(
  config => {
    const store = useAuthStore.getState();
    const accessToken = store.accessToken; // Adjust this based on your store structure

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Set Content-Type only for non-FormData requests
    // For FormData, axios will automatically set multipart/form-data with boundary
    // This prevents CORS issues and ensures FormData is sent correctly
    if (!(config.data instanceof FormData)) {
      // Only set if not already set and if there's data
      if (!config.headers['Content-Type'] && config.data !== undefined) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    // For FormData, don't set Content-Type - let axios handle it automatically
    
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

    // Handle token expiration (401)
    if (error.response?.status === 401) {
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