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

// ── Worker IPC types (mirrors lfm-worker.ts) ──────────────

type WorkerRequest =
  | { type: 'init'; model: string }
  | { type: 'generate'; id: string; prompt: string; maxTokens: number };

type WorkerResponse =
  | { type: 'ready'; model: string }
  | { type: 'result'; id: string; text: string; duration: number }
  | { type: 'error'; id: string; message: string }
  | { type: 'progress'; status: string; progress?: number };

/** Configuration for the local LLM provider. */
export interface LocalProviderConfig {
  /** Model type / HF model ID (e.g. 'Xenova/gpt2' or 'lfm-230m'). */
  modelType: LLMModelType;
  /** Factory that creates a Worker running the lfm-worker script. */
  workerFactory: () => Worker;
}

/**
 * Creates a default Web Worker that loads the LFM worker script.
 * Uses Vite's `new URL()` pattern for bundler compatibility.
 */
export function createDefaultLFMWorker(): Worker {
  return new Worker(new URL('./lfm-worker.js', import.meta.url), { type: 'module' });
}

/**
 * Creates a local LLM provider that runs inference in-browser
 * using Transformers.js via a Web Worker.
 *
 * Design: Strategy pattern — implements `ILLMProvider` so the engine
 * can use it interchangeably with cloud or composite providers.
 * The actual inference happens in a Web Worker (lfm-worker.ts) to
 * keep the main thread responsive.
 *
 * @param config Provider configuration including a worker factory.
 * @returns An `ILLMProvider` instance.
 */
export function createLocalLLMProvider(config: LocalProviderConfig): ILLMProvider {
  let worker: Worker | null = null;
  let ready = false;
  let initializing = false;
  let initError: string | null = null;

  // Pending generation promises keyed by request id
  const pending = new Map<
    string,
    { resolve: (r: LLMGenerateResponse) => void; reject: (e: Error) => void }
  >();
  let nextId = 0;

  /** Lazily initialise the inference worker. */
  async function initWorker(): Promise<void> {
    if (ready) return;
    if (initializing) {
      // Wait a bit and retry (simple spin-wait for concurrent calls)
      for (let i = 0; i < 50 && !ready && !initError; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!ready && initError) throw new LocalProviderUnavailableError(initError);
      if (ready) return;
      throw new LocalProviderUnavailableError('Local LLM indisponível');
    }

    initializing = true;
    try {
      worker = config.workerFactory();

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        switch (msg.type) {
          case 'ready':
            ready = true;
            initializing = false;
            break;
          case 'result': {
            const prom = pending.get(msg.id);
            if (prom) {
              pending.delete(msg.id);
              prom.resolve({
                text: msg.text,
                modelUsed: config.modelType,
                isLocal: true,
                tokensUsed: 0,
                duration: msg.duration,
              });
            }
            break;
          }
          case 'error': {
            const prom = pending.get(msg.id);
            if (prom) {
              pending.delete(msg.id);
              if (msg.id === 'init') {
                initError = msg.message;
                ready = false;
                initializing = false;
              }
              prom.reject(new Error(msg.message));
            }
            break;
          }
          case 'progress':
            // Progress updates can be used for UI feedback
            break;
        }
      };

      worker.onerror = () => {
        initError = 'Worker crashed';
        ready = false;
        initializing = false;
      };

      // Send init message — model maps to HF model IDs
      const hfModel = MODEL_MAP[config.modelType] ?? config.modelType;
      worker.postMessage({ type: 'init', model: hfModel } satisfies WorkerRequest);

      // Wait for ready with timeout. First model download can take minutes,
      // so allow a generous window while still reporting progress.
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!ready) reject(new LocalProviderUnavailableError('Model load timeout (5 min)'));
        }, 300_000);

        const check = setInterval(() => {
          if (ready) {
            clearTimeout(timeout);
            clearInterval(check);
            resolve();
          }
          if (initError) {
            clearTimeout(timeout);
            clearInterval(check);
            reject(new LocalProviderUnavailableError(initError));
          }
        }, 200);
      });
    } catch (err) {
      initializing = false;
      throw err instanceof LocalProviderUnavailableError
        ? err
        : new LocalProviderUnavailableError((err as Error).message);
    }
  }

  return {
    async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
      await initWorker();
      if (!worker || !ready) throw new LocalProviderUnavailableError('Local LLM indisponível');

      const id = `gen-${++nextId}`;
      const prompt = `${request.config.systemPrompt ?? ''}\n\n${request.prompt}`.trim();
      const maxTokens = request.config.maxTokens ?? 200;

      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });

        // Timeout after 30s
        const timeout = setTimeout(() => {
          pending.delete(id);
          reject(new LocalProviderUnavailableError('Generation timeout (30s)'));
        }, 30_000);

        // Override resolve/reject to clear timeout
        const origResolve = resolve;
        const origReject = reject;
        pending.set(id, {
          resolve: (r) => {
            clearTimeout(timeout);
            origResolve(r);
          },
          reject: (e) => {
            clearTimeout(timeout);
            origReject(e);
          },
        });

        worker!.postMessage({ type: 'generate', id, prompt, maxTokens } satisfies WorkerRequest);
      });
    },

    isAvailable(): boolean {
      // Local inference is available as long as the worker has not hard-failed.
      // WebGPU is preferred, but the worker will fall back to WASM/CPU.
      return !initError;
    },

    getModelType(): string {
      return config.modelType;
    },
  };
}

/** Map of LFM model types to HuggingFace model IDs.
 *
 * Models are chosen to be small enough to run in a browser, with ONNX
 * runtimes available on both WebGPU and WASM backends.
 */
const MODEL_MAP: Record<string, string> = {
  'lfm-230m': 'Xenova/LaMini-Flan-T5-77M',
  'lfm-350m': 'Xenova/gpt2',
};
