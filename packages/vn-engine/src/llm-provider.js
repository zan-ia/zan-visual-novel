/**
 * Creates a default no-op LLM provider (for when no model is available).
 * Returns pre-defined fallback text instead of generating.
 */
export function createDefaultLLMProvider() {
  return {
    async generate(request) {
      return {
        text: '...',
        modelUsed: request.config.modelType,
        isLocal: false,
        tokensUsed: 0,
        duration: 0,
      };
    },
    isAvailable() {
      return false;
    },
    getModelType() {
      return 'none';
    },
  };
}
/**
 * Creates a composite LLM provider that tries local first, falls back to cloud.
 *
 * Design: Chain of Responsibility — tries providers in order until one succeeds.
 */
export function createCompositeLLMProvider(providers) {
  return {
    async generate(request) {
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
    isAvailable() {
      return providers.some((p) => p.isAvailable());
    },
    getModelType() {
      const available = providers.find((p) => p.isAvailable());
      return available?.getModelType() ?? 'none';
    },
  };
}
//# sourceMappingURL=llm-provider.js.map
