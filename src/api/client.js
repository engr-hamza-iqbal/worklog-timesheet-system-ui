import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const GET_RETRY_LIMIT = 2;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Request Interceptor: Automatically inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.__retryCount = config.__retryCount || 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize responses & handle 401 session expiration
api.interceptors.response.use(
  (response) => {
    // Backend wraps response in { success: true, data: ..., message: ... }
    return response.data;
  },
  async (error) => {
    const request = error.config;
    const isRetryableGet = request?.method?.toLowerCase() === 'get'
      && (!error.response || error.response.status >= 500);

    if (isRetryableGet && request.__retryCount < GET_RETRY_LIMIT) {
      request.__retryCount += 1;
      await wait(request.__retryCount * 500);
      return api(request);
    }

    if (error.response?.status === 401) {
      // If token expired or invalid, clear stored token
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        // Dispatch custom auth-expired event so AuthContext can update state
        window.dispatchEvent(new Event('auth:unauthorized'));
        window.dispatchEvent(
          new CustomEvent('app:notify', {
            detail: {
              type: 'warn',
              title: 'Session Expired',
              message: 'Your session has expired. Please sign in again.',
            },
          })
        );
      }
    }

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.code = error.response?.data?.error?.code;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

export default api;
