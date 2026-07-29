import type { ILLMProvider } from '../llm-provider.js';
import type { LLMGenerateRequest, LLMGenerateResponse } from '@zan-vn/shared';

/** Configuration for the backend Transformers.js LLM provider. */
export interface BackendProviderConfig {
  /** Base URL of the Zan API (e.g. 'http://localhost:3001'). */
  apiBaseUrl: string;
  /** Optional JWT access token for authenticated requests. */
  accessToken?: string;
  /**
   * Timeout in milliseconds for the backend inference request.
   * First model load on the server can take a while.
   * @default 120_000
   */
  timeoutMs?: number;
}

/**
 * Creates a backend LLM provider that delegates generation to the
 * `/api/v1/llm/local` endpoint running Transformers.js on the server.
 *
 * This is the fallback used when the browser cannot run the model locally
 * (no WebGPU/WASM support, network restrictions, etc.).
 *
 * Design: Strategy pattern — implements `ILLMProvider` so the engine
 * can use it interchangeably with local or composite providers.
 *
 * @param config Provider configuration.
 * @returns An `ILLMProvider` instance.
 */
export function createBackendLLMProvider(config: BackendProviderConfig): ILLMProvider {
  const timeoutMs = config.timeoutMs ?? 120_000;

  return {
    async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.accessToken) {
        headers['Authorization'] = `Bearer ${config.accessToken}`;
      }

      try {
        const res = await fetch(`${config.apiBaseUrl}/api/v1/llm/local`, {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        if (!res.ok) {
          let detail = '';
          try {
            const errBody = (await res.json().catch(() => null)) as {
              error?: { message?: string };
              message?: string;
            } | null;
            detail = errBody?.error?.message ?? errBody?.message ?? '';
          } catch {
            /* ignore */
          }
          const reason = detail ? `: ${detail}` : ` (HTTP ${res.status})`;
          throw new Error(`Falha na geração local no servidor${reason}`);
        }

        const data = (await res.json()) as LLMGenerateResponse;
        return {
          ...data,
          isLocal: true,
          duration: Date.now() - startTime,
        };
      } catch (err) {
        clearTimeout(timeout);
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('Tempo limite excedido ao aguardar o modelo local no servidor');
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    },

    isAvailable(): boolean {
      // Available whenever the backend URL is configured (public endpoint).
      return !!config.apiBaseUrl;
    },

    getModelType(): string {
      return 'backend';
    },
  };
}
