import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple 401 redirects
let isRedirecting = false;

// Add token to requests + anti-cache measures
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // CRITICAL: Add cache-busting to ALL GET requests to prevent proxy/CDN from
  // serving cached responses from other users (causes profile switching bug)
  if (!config.method || config.method.toLowerCase() === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  config.headers['Cache-Control'] = 'no-cache, no-store';
  config.headers['Pragma'] = 'no-cache';
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle responses — auto-redirect on 401 (expired session)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      const path = window.location.pathname;
      // Don't redirect on public pages or login page
      if (path !== '/login' && path !== '/register' && path !== '/' && !path.startsWith('/reset')) {
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const loadingRef = useRef(false); // Prevent duplicate loads

  // Helper: decode JWT payload without verification (for client-side validation only)
  const decodeTokenPayload = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch {
      return null;
    }
  };

  const loadUser = useCallback(async () => {
    // Prevent duplicate simultaneous calls
    if (loadingRef.current) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    // Validate token hasn't expired client-side
    const payload = decodeTokenPayload(token);
    if (!payload || !payload.sub || (payload.exp && payload.exp * 1000 < Date.now())) {
      console.warn('Token expired or invalid, clearing session');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    loadingRef.current = true;
    
    try {
      const response = await api.get('/auth/me');
      if (response.data.ok) {
        const serverUser = response.data.data.user;
        
        // CRITICAL: Verify the server returned the SAME user as our token
        // This catches proxy/cache corruption where another user's data is served
        if (serverUser.id !== payload.sub) {
          console.error('SESSION INTEGRITY VIOLATION: Token user_id does not match server response. Forcing re-login.',
            { tokenUserId: payload.sub, serverUserId: serverUser.id });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setWallets([]);
          setIsAuthenticated(false);
          return;
        }
        
        setUser(serverUser);
        setWallets(response.data.data.wallets || []);
        setIsAuthenticated(true);
      } else {
        // Invalid response - clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // Don't clear storage on network errors - only on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        const detail = error.response?.data?.detail;
        if (detail?.code === 'account_locked') {
          sessionStorage.setItem('account_locked_reason', detail.reason || '');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setWallets([]);
      }
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Heartbeat ping every 30s for non-admin users (online tracking)
  // + Sliding session refresh every 10 minutes
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const sendHeartbeat = () => {
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        api.post('/auth/heartbeat').catch(() => {});
      }
    };
    
    const refreshSession = async () => {
      try {
        const res = await api.post('/auth/refresh-token');
        if (res.data.ok && res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
      } catch (e) {
        // If 401 (expired), the interceptor will handle redirect
      }
    };
    
    // Send heartbeat immediately on login
    sendHeartbeat();
    
    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);
    // Refresh token every 10 minutes to keep session alive
    const refreshInterval = setInterval(refreshSession, 10 * 60 * 1000);
    
    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, user?.id]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.ok) {
      const { token, user, wallets } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setWallets(wallets || []);
      setIsAuthenticated(true);
      // Sync current app language to backend
      const lang = localStorage.getItem('app_language') || ((navigator.language || '').startsWith('it') ? 'it' : 'en');
      try { await api.put(`/auth/language?lang=${lang}`); } catch(e) {}
      return { success: true, user };
    }
    return { success: false, error: response.data.error };
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.ok) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);
      // Sync current app language to backend
      const lang = localStorage.getItem('app_language') || ((navigator.language || '').startsWith('it') ? 'it' : 'en');
      try { await api.put(`/auth/language?lang=${lang}`); } catch(e) {}
      return { success: true };
    }
    return { success: false, error: response.data.error };
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (e) { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setWallets([]);
    setIsAuthenticated(false);
    // Reset redirect flag on logout
    isRedirecting = false;
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallets,
        loading,
        isAuthenticated,
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        login,
        register,
        logout,
        refreshUser,
        api,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { api };
export default AuthContext;
