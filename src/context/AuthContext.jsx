import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { setCsrfToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [capabilities, setCapabilities] = useState({});
  const [token, setToken] = useState('cookie');
  const [loading, setLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  // Validate session on mount or token change
  useEffect(() => {
    async function loadUser() {
      let isExplicitlyLoggedOut = false;
      try {
        isExplicitlyLoggedOut = sessionStorage.getItem('worklog_logged_out') === '1';
      } catch {}

      if (!token || isExplicitlyLoggedOut) {
        setCsrfToken(null);
        setUser(null);
        setCapabilities({});
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (isLoggingOutRef.current) return;
        if (res.success && res.data) {
          if (res.data.csrfToken) {
            setCsrfToken(res.data.csrfToken);
          }
          setUser(res.data.user);
          setCapabilities(res.data.capabilities || {});
        } else {
          // Token invalid or expired
          setCsrfToken(null);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session verification failed:', err.message);
        setCsrfToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const handleUnauthorized = () => {
      setCsrfToken(null);
      setToken(null);
      setUser(null);
      setCapabilities({});
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  async function login(email, password) {
    try { sessionStorage.removeItem('worklog_logged_out'); } catch {}
    const res = await api.post('/api/auth/login', { email, password });
    if (res.success && res.data) {
      const { user: newUser, capabilities: newCaps, csrfToken } = res.data;
      if (csrfToken) {
        setCsrfToken(csrfToken);
      }
      setToken('cookie');
      setUser(newUser);
      setCapabilities(newCaps || {});
      return res.data;
    }
    throw new Error('Login failed: Invalid server response');
  }

  async function register(data) {
    try { sessionStorage.removeItem('worklog_logged_out'); } catch {}
    const res = await api.post('/api/auth/register', data);
    if (res.success && res.data) {
      const { user: newUser, capabilities: newCaps, csrfToken } = res.data;
      if (csrfToken) {
        setCsrfToken(csrfToken);
      }
      setToken('cookie');
      setUser(newUser);
      setCapabilities(newCaps || {});
      return res.data;
    }
    throw new Error('Registration failed: Invalid server response');
  }

  async function logout() {
    isLoggingOutRef.current = true;
    try { sessionStorage.setItem('worklog_logged_out', '1'); } catch {}
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      try {
        await api.get('/api/auth/logout');
      } catch {}
      console.warn('Logout API completed with notice:', e?.message);
    } finally {
      setCsrfToken(null);
      setToken(null);
      setUser(null);
      setCapabilities({});

      // Synchronize logout across browser tabs
      try {
        const channel = new BroadcastChannel('worklog_auth_sync');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      } catch {}

      // Keep guard active briefly to avoid in-flight promises resurrecting the session
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 1500);
    }
  }

  const refreshUser = useCallback(async () => {
    if (isLoggingOutRef.current || !token || !user) return null;
    try {
      const res = await api.get('/api/auth/me');
      if (isLoggingOutRef.current || !token) return null;
      if (res.success && res.data) {
        if (res.data.csrfToken) {
          setCsrfToken(res.data.csrfToken);
        }
        setUser(res.data.user);
        setCapabilities(res.data.capabilities || {});
        return res.data;
      }
    } catch (err) {
      console.error('Failed to refresh user capabilities:', err);
    }
    return null;
  }, [token, user]);

  // Real-time permission & capability synchronization via SSE and BroadcastChannel
  useEffect(() => {
    if (!token || !user) return;

    // 1. Cross-tab synchronization via BroadcastChannel
    let channel;
    try {
      channel = new BroadcastChannel('worklog_auth_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          setCsrfToken(null);
          setToken(null);
          setUser(null);
          setCapabilities({});
        } else if (event.data?.type === 'REFRESH_CAPABILITIES') {
          refreshUser();
        }
      };
    } catch {
      // Ignore if BroadcastChannel not supported in environment
    }

    // Sync when a tab becomes active or the window receives focus.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshUser();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', refreshUser);

    // 4. API 403 / permission-denied event listener
    const handlePermissionDenied = () => {
      if (!isLoggingOutRef.current) {
        refreshUser();
      }
    };
    window.addEventListener('auth:permission-denied', handlePermissionDenied);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', refreshUser);
      window.removeEventListener('auth:permission-denied', handlePermissionDenied);
    };
  }, [token, user?.id, refreshUser]);

  const value = {
    user,
    token,
    capabilities,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.accountType === 'ADMIN',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
