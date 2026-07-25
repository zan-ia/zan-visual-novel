import { useCallback, useMemo } from 'react';
import { ApiClient } from '../api-client.js';
import type { ApiClientConfig } from '../api-client.js';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/**
 * Hook to access the API client with auth token management.
 * Assumes tokens are stored in localStorage (or can be provided via config).
 */
export function useApi(
  getTokens: () => { access: string | null; refresh: string | null },
  onAuthError: () => void,
) {
  const client = useMemo(() => {
    const config: ApiClientConfig = {
      baseUrl: API_BASE_URL,
      getAccessToken: () => getTokens().access,
      getRefreshToken: () => getTokens().refresh,
      onTokenRefreshed: (tokens) => {
        localStorage.setItem('access_token', tokens.accessToken);
        localStorage.setItem('refresh_token', tokens.refreshToken);
      },
      onAuthError,
    };
    return new ApiClient(config);
  }, [getTokens, onAuthError]);

  return client;
}
