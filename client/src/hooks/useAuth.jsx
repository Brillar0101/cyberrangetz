import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to refresh token on mount
    refresh().finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(res.user);
    setToken(res.accessToken);
    return res;
  }

  async function register(name, email, university, password) {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, university, password }),
    });
    setUser(res.user);
    setToken(res.accessToken);
    return res;
  }

  async function refresh() {
    try {
      const res = await api('/api/auth/refresh', { method: 'POST' });
      setToken(res.accessToken);
      // Decode user from token
      const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
      setUser({ id: payload.id, email: payload.email, name: payload.name });
    } catch {
      setUser(null);
      setToken(null);
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
