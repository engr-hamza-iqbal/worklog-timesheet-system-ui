import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [capabilities, setCapabilities] = useState({});
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Validate session on mount or token change
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUser(null);
        setCapabilities({});
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (res.success && res.data) {
          setUser(res.data.user);
          setCapabilities(res.data.capabilities || {});
        } else {
          // Token invalid or expired
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session verification failed:', err.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setCapabilities({});
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.success && res.data) {
      const { token: newToken, user: newUser, capabilities: newCaps } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setCapabilities(newCaps || {});
      return res.data;
    }
    throw new Error('Login failed: Invalid server response');
  }

  async function register(data) {
    const res = await api.post('/api/auth/register', data);
    if (res.success && res.data) {
      const { token: newToken, user: newUser, capabilities: newCaps } = res.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setCapabilities(newCaps || {});
      return res.data;
    }
    throw new Error('Registration failed: Invalid server response');
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setCapabilities({});
    }
  }

  async function refreshUser() {
    try {
      const res = await api.get('/api/auth/me');
      if (res.success && res.data) {
        setUser(res.data.user);
        setCapabilities(res.data.capabilities || {});
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }

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
