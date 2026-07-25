import type { ApiResponse, AuthTokens, PaginatedResponse } from '@zan-vn/shared';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokenRefreshed: (tokens: AuthTokens) => void;
  onAuthError: () => void;
}

/**
 * Typed HTTP client for the Zan Visual Novel API.
 * Handles JWT auth, automatic token refresh, and error normalization.
 *
 * Design: Facade — provides a simple interface over fetch with auth logic.
 */
export class ApiClient {
  private config: ApiClientConfig;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  // ── Auth ───────────────────────────────────────────────

  async register(data: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<ApiResponse<AuthTokens>> {
    return this.post('/auth/register', data, { auth: false });
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse<AuthTokens>> {
    return this.post('/auth/login', data, { auth: false });
  }

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const refreshToken = this.config.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    return this.post('/auth/refresh', { refreshToken }, { auth: false });
  }

  async getProfile(): Promise<ApiResponse<AuthTokens['user']>> {
    return this.get('/auth/me');
  }

  // ── Visual Novels ──────────────────────────────────────

  async listVNs(params?: Record<string, string>): Promise<ApiResponse<PaginatedResponse<unknown>>> {
    return this.get('/vns', params);
  }

  async getVN(id: string): Promise<ApiResponse<unknown>> {
    return this.get(`/vns/${id}`);
  }

  async createVN(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post('/vns', data);
  }

  async updateVN(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    return this.patch(`/vns/${id}`, data);
  }

  // ── Saves ──────────────────────────────────────────────

  async getSaves(vnId: string): Promise<ApiResponse<unknown[]>> {
    return this.get(`/saves`, { vnId });
  }

  async createSave(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post('/saves', data);
  }

  async updateSave(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    return this.put(`/saves/${id}`, data);
  }

  // ── Credits ────────────────────────────────────────────

  async getCreditPackages(): Promise<ApiResponse<unknown[]>> {
    return this.get('/credits/packages', undefined, { auth: false });
  }

  async checkout(packageId: string): Promise<ApiResponse<{ url: string }>> {
    return this.post('/credits/checkout', { packageId });
  }

  async getTransactions(): Promise<ApiResponse<unknown[]>> {
    return this.get('/credits/transactions');
  }

  // ── LLM ────────────────────────────────────────────────

  async generateLLM(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post('/llm/generate', data);
  }

  // ── HTTP Core ──────────────────────────────────────────

  private async get<T>(
    path: string,
    params?: Record<string, string>,
    opts?: { auth?: boolean },
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.config.baseUrl}/api/v1${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    return this.request<T>(url.toString(), { method: 'GET' }, opts);
  }

  private async post<T>(
    path: string,
    body: unknown,
    opts?: { auth?: boolean },
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      `${this.config.baseUrl}/api/v1${path}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      opts,
    );
  }

  private async put<T>(
    path: string,
    body: unknown,
    opts?: { auth?: boolean },
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      `${this.config.baseUrl}/api/v1${path}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      opts,
    );
  }

  private async patch<T>(
    path: string,
    body: unknown,
    opts?: { auth?: boolean },
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      `${this.config.baseUrl}/api/v1${path}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      opts,
    );
  }

  private async request<T>(
    url: string,
    init: RequestInit,
    opts?: { auth?: boolean },
  ): Promise<ApiResponse<T>> {
    const needsAuth = opts?.auth !== false;
    const headers = new Headers(init.headers);

    if (needsAuth) {
      const token = this.config.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    let response = await fetch(url, { ...init, headers });

    // Auto-refresh on 401
    if (response.status === 401 && needsAuth) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const newToken = this.config.getAccessToken();
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, { ...init, headers });
      } else {
        this.config.onAuthError();
        return {
          success: false,
          error: { statusCode: 401, message: 'Unauthorized', code: 'UNAUTHORIZED' },
        };
      }
    }

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        error: json?.error ?? {
          statusCode: response.status,
          message: response.statusText,
          code: 'UNKNOWN',
        },
      };
    }

    return json as ApiResponse<T>;
  }

  private async tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const result = await this.refreshToken();
        if (result.success && result.data) {
          this.config.onTokenRefreshed(result.data);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}
