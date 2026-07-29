import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Stable callbacks that don't cause re-renders
  const onTokenRefreshedRef = useRef((tokens: AuthTokens) => {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    setUser(tokens.user);
  });
  onTokenRefreshedRef.current = (tokens: AuthTokens) => {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    setUser(tokens.user);
  };

  const onAuthErrorRef = useRef(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  });

  const api = useMemo(() => new ApiClient({
    baseUrl: API_URL,
    getAccessToken: () => localStorage.getItem('access_token'),
    getRefreshToken: () => localStorage.getItem('refresh_token'),
    onTokenRefreshed: (tokens: AuthTokens) => onTokenRefreshedRef.current(tokens),
    onAuthError: () => onAuthErrorRef.current(),
  }), []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    if (result.success && result.data) {
      localStorage.setItem('access_token', result.data.accessToken);
      localStorage.setItem('refresh_token', result.data.refreshToken);
      setUser(result.data.user);
    } else {
      throw new Error(result.error?.message ?? 'Login failed');
    }
  }, [api]);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const result = await api.register({ email, password, displayName });
    if (result.success && result.data) {
      localStorage.setItem('access_token', result.data.accessToken);
      localStorage.setItem('refresh_token', result.data.refreshToken);
      setUser(result.data.user);
    } else {
      throw new Error(result.error?.message ?? 'Registration failed');
    }
  }, [api]);

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
