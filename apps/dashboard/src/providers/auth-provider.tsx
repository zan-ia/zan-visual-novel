import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, AuthTokens } from '@zan-vn/shared';
import { ApiClient } from '@zan-vn/lib';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('access_token', res.data.accessToken);
      localStorage.setItem('refresh_token', res.data.refreshToken);
      setUser(res.data.user);
    } else {
      throw new Error(res.error?.message ?? 'Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}
