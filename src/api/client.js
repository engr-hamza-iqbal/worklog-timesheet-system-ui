import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 60000,
});

const GET_RETRY_LIMIT = 2;
let lastAuthNotifyTime = 0;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function getCsrfToken() {
  if (typeof window === 'undefined') return null;
  // 1. Check localStorage first (persists across decoupled/cross-domain deployments such as Netlify -> Render)
  try {
    const stored = localStorage.getItem('worklog_csrf_token');
    if (stored) return stored;
  } catch {}
  // 2. Check document.cookie (same-domain environments)
  try {
    const match = document.cookie?.match(/(?:^|;\s*)worklog_csrf_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {}
  return null;
}

export function setCsrfToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem('worklog_csrf_token', token);
    } else {
      localStorage.removeItem('worklog_csrf_token');
    }
  } catch {}
}

// Browser sessions use the HttpOnly worklog_session cookie. Bearer tokens remain supported by the server for API clients.
api.interceptors.request.use(
  (config) => {
    config.__retryCount = config.__retryCount || 0;
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize responses & handle 401 session expiration
api.interceptors.response.use(
  (response) => {
    // If backend returned a CSRF synchronizer token, store it for subsequent mutations
    const payload = response.data;
    const returnedToken = payload?.data?.csrfToken || payload?.csrfToken;
    if (returnedToken) {
      setCsrfToken(returnedToken);
    }
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

    const isLogoutRequest = Boolean(request?.url && String(request.url).includes('/api/auth/logout'));
    const isCsrfError = error.response?.data?.error?.code === 'CSRF_REJECTED';
    const isUnauthorized = error.response?.status === 401;
    const isDeactivated =
      error.response?.status === 403 &&
      (error.response?.data?.error?.code === 'ACCOUNT_DEACTIVATED' ||
        error.response?.data?.message?.toLowerCase().includes('deactivated') ||
        error.response?.data?.error?.message?.toLowerCase().includes('deactivated'));

    if (isUnauthorized || isDeactivated) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        window.dispatchEvent(new Event('auth:unauthorized'));

        // Debounce: ensure only ONE notification is dispatched every 5 seconds
        const now = Date.now();
        if (now - lastAuthNotifyTime > 5000) {
          lastAuthNotifyTime = now;
          window.dispatchEvent(
            new CustomEvent('app:notify', {
              detail: {
                type: 'error',
                title: isDeactivated ? 'Account Deactivated' : 'Session Expired',
                message: isDeactivated
                  ? 'Your account has been deactivated. Please contact an administrator.'
                  : 'Your session has expired. Please sign in again.',
              },
            })
          );
        }
      }
    } else if (error.response?.status === 403 && !isLogoutRequest && !isCsrfError) {
      // Permission denied or capability revoked - dispatch signal to re-sync capabilities in background
      window.dispatchEvent(new Event('auth:permission-denied'));
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
