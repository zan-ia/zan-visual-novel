import type { LLMGenerateRequest, LLMGenerateResponse } from '@zan-vn/shared';

/**
 * Interface for LLM providers that the VN Engine can use.
 *
 * Design: Strategy pattern — the engine delegates narrative generation
 * to any provider that implements this interface (local ONNX, cloud API, mock).
 */
export interface ILLMProvider {
  /** Generate text continuation */
  generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse>;

  /** Check if this provider is currently available */
  isAvailable(): boolean;

  /** Get the model type this provider uses */
  getModelType(): string;
}

/**
 * Creates a default no-op LLM provider (for when no model is available).
 * Returns pre-defined fallback text instead of generating.
 */
export function createDefaultLLMProvider(): ILLMProvider {
  return {
    async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
      return {
        text: '...',
        modelUsed: request.config.modelType,
        isLocal: false,
        tokensUsed: 0,
        duration: 0,
      };
    },
    isAvailable(): boolean {
      return false;
    },
    getModelType(): string {
      return 'none';
    },
  };
}

/**
 * Creates a composite LLM provider that tries local first, falls back to cloud.
 *
 * Design: Chain of Responsibility — tries providers in order until one succeeds.
 */
export function createCompositeLLMProvider(providers: ILLMProvider[]): ILLMProvider {
  return {
    async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
      for (const provider of providers) {
        if (provider.isAvailable()) {
          try {
            return await provider.generate(request);
          } catch {
            // Try next provider
            continue;
          }
        }
      }
      throw new Error('No LLM provider available');
    },

    isAvailable(): boolean {
      return providers.some((p) => p.isAvailable());
    },

    getModelType(): string {
      const available = providers.find((p) => p.isAvailable());
      return available?.getModelType() ?? 'none';
    },
  };
}
