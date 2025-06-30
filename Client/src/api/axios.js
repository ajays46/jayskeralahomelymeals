import axios from 'axios';
import useAuthStore from '../stores/Zustand.store';

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
    return config;
  },
  error => Promise.reject(error)
);

// IMPROVED RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Only retry once and avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry && error.response?.data?.expired) {
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

    return Promise.reject(error);
  }
);

export default axiosInstance; 