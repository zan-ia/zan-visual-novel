import type { ILLMProvider } from '../llm-provider.js';
import type { LLMGenerateRequest, LLMGenerateResponse } from '@zan-vn/shared';

/** Configuration for the cloud API-backed LLM provider. */
export interface CloudProviderConfig {
  /** Base URL of the Zan API (e.g. 'http://localhost:3001'). */
  apiBaseUrl: string;
  /** Optional JWT access token for authenticated requests. */
  accessToken?: string;
}

/**
 * Creates a cloud LLM provider that delegates generation to the
 * backend `/api/v1/llm/generate` endpoint.
 *
 * Design: Strategy pattern — implements `ILLMProvider` so the engine
 * can use it interchangeably with local or composite providers.
 *
 * @param config Provider configuration.
 * @returns An `ILLMProvider` instance.
 */
export function createCloudLLMProvider(config: CloudProviderConfig): ILLMProvider {
  return {
    async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
      const startTime = Date.now();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.accessToken) {
        headers['Authorization'] = `Bearer ${config.accessToken}`;
      }

      const res = await fetch(`${config.apiBaseUrl}/api/v1/llm/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        let detail = '';
        try {
          const errBody = await res.json().catch(() => null);
          detail = errBody?.error?.message ?? errBody?.message ?? '';
        } catch {
          /* ignore */
        }
        const reason = detail ? `: ${detail}` : ` (HTTP ${res.status})`;
        throw new Error(`Falha na geração por IA${reason}`);
      }

      const data = (await res.json()) as LLMGenerateResponse;

      return {
        ...data,
        isLocal: false,
        duration: Date.now() - startTime,
      };
    },

    isAvailable(): boolean {
      // Cloud requires authentication to work
      return !!config.accessToken;
    },

    getModelType(): string {
      return 'cloud';
    },
  };
}
