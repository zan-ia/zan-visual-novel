import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, AuthTokens } from '@zan-vn/shared';
import { ApiClient } from '@zan-vn/lib';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  api: ApiClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getTokens() {
  return {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const api = new ApiClient({
    baseUrl: API_URL,
    getAccessToken: () => localStorage.getItem('access_token'),
    getRefreshToken: () => localStorage.getItem('refresh_token'),
    onTokenRefreshed: (tokens: AuthTokens) => {
      localStorage.setItem('access_token', tokens.accessToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);
      setUser(tokens.user);
    },
    onAuthError: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    },
  });

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    if (result.success && result.data) {
      localStorage.setItem('access_token', result.data.accessToken);
      localStorage.setItem('refresh_token', result.data.refreshToken);
      setUser(result.data.user);
    } else {
      throw new Error(result.error?.message ?? 'Login failed');
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await api.register({ email, password, displayName });
    if (result.success && result.data) {
      localStorage.setItem('access_token', result.data.accessToken);
      localStorage.setItem('refresh_token', result.data.refreshToken);
      setUser(result.data.user);
    } else {
      throw new Error(result.error?.message ?? 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}
