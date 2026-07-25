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
export declare function createDefaultLLMProvider(): ILLMProvider;
/**
 * Creates a composite LLM provider that tries local first, falls back to cloud.
 *
 * Design: Chain of Responsibility — tries providers in order until one succeeds.
 */
export declare function createCompositeLLMProvider(providers: ILLMProvider[]): ILLMProvider;
//# sourceMappingURL=llm-provider.d.ts.map