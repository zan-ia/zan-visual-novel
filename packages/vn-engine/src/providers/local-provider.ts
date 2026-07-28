import type { ILLMProvider } from '../llm-provider.js';
import type { LLMGenerateRequest, LLMGenerateResponse, LLMModelType } from '@zan-vn/shared';

/**
 * Thrown by the local provider when WebGPU / WebLLM is unavailable,
 * so the composite provider can fall through to the next provider.
 */
export class LocalProviderUnavailableError extends Error {
  constructor(message = 'Local LLM indisponível') {
    super(message);
    this.name = 'LocalProviderUnavailableError';
  }
}

/** Configuration for the local WebLLM/ONNX provider. */
export interface LocalProviderConfig {
  /** Model type to use (e.g. 'lfm-230m'). */
  modelType: LLMModelType;
  /** Optional URL to the Web Worker bundle for inference. */
  workerUrl?: string;
}

/**
 * Creates a local LLM provider that runs inference in-browser
 * via WebLLM / ONNX Runtime Web / Transformers.js.
 *
 * Design: Strategy pattern — implements `ILLMProvider` so the engine
 * can use it interchangeably with cloud or composite providers.
 *
 * @param config Provider configuration.
 * @returns An `ILLMProvider` instance.
 */
export function createLocalLLMProvider(config: LocalProviderConfig): ILLMProvider {
  // TODO(#41): Replace with actual WebLLM worker
  // let worker: Worker | null = null;
  let available = false;
  let initializing = false;

  /** Detect WebGPU support for hardware-accelerated inference. */
  function detectWebGPU(): boolean {
    try {
      return (
        'gpu' in navigator &&
        typeof (navigator as unknown as { gpu?: { requestAdapter?: unknown } }).gpu
          ?.requestAdapter === 'function'
      );
    } catch {
      return false;
    }
  }

  /** Lazily initialise the inference worker (stub — pending #41, #42). */
  async function initWorker(): Promise<void> {
    if (initializing || available) return;
    initializing = true;
    try {
      // TODO(#41): Replace with actual WebLLM worker initialisation
      // worker = new Worker(config.workerUrl ?? '/workers/llm-worker.js');
      // await worker.postMessage({ type: 'init', model: config.modelType });
      available = true;
    } catch {
      available = false;
    } finally {
      initializing = false;
    }
  }

  return {
    async generate(_request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
      await initWorker();
      if (!available) throw new LocalProviderUnavailableError('Local LLM indisponível');

      const startTime = Date.now();

      // TODO(#41): Call worker for generation
      // const result = await callWorker(worker, request);

      return {
        text: '[texto gerado localmente]',
        modelUsed: config.modelType,
        isLocal: true,
        tokensUsed: 0,
        duration: Date.now() - startTime,
      };
    },

    isAvailable(): boolean {
      return detectWebGPU() && available;
    },

    getModelType(): string {
      return config.modelType;
    },
  };
}
