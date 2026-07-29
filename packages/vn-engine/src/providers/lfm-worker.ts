/**
 * Web Worker for local LLM inference using Transformers.js.
 * Runs text generation off the main thread to keep the UI responsive.
 *
 * Strategy:
 * 1. Prefer WebGPU for performance when available.
 * 2. Fall back to WASM/CPU if WebGPU fails (e.g. Electron/Chromium quirks).
 * 3. Cache the pipeline singleton per model to avoid redundant downloads.
 *
 * @worker
 */

import { pipeline, env } from '@huggingface/transformers';

// Use the Hugging Face Hub; disable browser cache to avoid Cache API errors
// in Electron/VS Code's embedded browser. Models are re-downloaded each session.
env.allowLocalModels = false;
env.useBrowserCache = false;

// Single-threaded, non-SIMD WASM avoids COOP/COEP header requirements and
// loads the smaller ort-wasm.asyncify.wasm binary in constrained browsers.
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.simd = false;
}

type WorkerMessage =
  | { type: 'init'; model: string }
  | { type: 'generate'; id: string; prompt: string; maxTokens: number };

type WorkerResponse =
  | { type: 'ready'; model: string; device: string }
  | { type: 'result'; id: string; text: string; duration: number }
  | { type: 'error'; id: string; message: string }
  | { type: 'progress'; status: string; progress?: number };

interface PipelineInstance {
  generator: Awaited<ReturnType<typeof pipeline<'text-generation' | 'text2text-generation'>>>;
  model: string;
  device: string;
  task: 'text-generation' | 'text2text-generation';
}

let pipelineInstance: PipelineInstance | null = null;

function reportProgress(info: { status: string; progress?: number; file?: string }): void {
  postMessage({
    type: 'progress',
    status: info.file ? `${info.status}: ${info.file}` : info.status,
    progress: info.progress ?? undefined,
  } satisfies WorkerResponse);
}

/** Infer the Transformers.js task from the model id. */
function detectTask(model: string): 'text-generation' | 'text2text-generation' {
  const lower = model.toLowerCase();
  if (lower.includes('t5') || lower.includes('flan') || lower.includes('bart')) {
    return 'text2text-generation';
  }
  return 'text-generation';
}

async function loadPipeline(model: string): Promise<PipelineInstance> {
  if (pipelineInstance && pipelineInstance.model === model) {
    return pipelineInstance;
  }

  reportProgress({ status: 'loading', progress: 0 });

  const task = detectTask(model);

  // Try WebGPU first; fall back to WASM/CPU if it fails.
  const devices: Array<{ device: 'webgpu' | 'wasm'; label: string }> = [
    { device: 'webgpu', label: 'webgpu' },
    { device: 'wasm', label: 'wasm' },
  ];

  let lastError: Error | null = null;
  for (const { device, label } of devices) {
    try {
      const generator = await pipeline(task, model, {
        device,
        progress_callback: reportProgress,
      });

      pipelineInstance = { generator, model, device: label, task };
      return pipelineInstance;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[lfm-worker] Failed to load pipeline on ${label}: ${message}`, err);
      lastError = err instanceof Error ? err : new Error(message);
      reportProgress({
        status: `fallback-${label}: ${message}`,
        progress: undefined,
      });
    }
  }

  throw lastError ?? new Error('Falha ao carregar modelo local');
}

async function handleInit(model: string): Promise<void> {
  try {
    const instance = await loadPipeline(model);
    postMessage({
      type: 'ready',
      model: instance.model,
      device: instance.device,
    } satisfies WorkerResponse);
  } catch (err: unknown) {
    pipelineInstance = null;
    postMessage({
      type: 'error',
      id: 'init',
      message: err instanceof Error ? err.message : 'Falha ao carregar modelo local',
    } satisfies WorkerResponse);
  }
}

async function handleGenerate(id: string, prompt: string, maxTokens: number): Promise<void> {
  try {
    const instance = await loadPipeline(pipelineInstance?.model ?? 'Xenova/LaMini-Flan-T5-77M');
    const startTime = performance.now();

    const result = await instance.generator(prompt, {
      max_new_tokens: maxTokens,
      temperature: 0.8,
      top_p: 0.9,
      do_sample: true,
    });

    // result is an array of { generated_text: string } objects
    const generatedText = Array.isArray(result)
      ? (result[0]?.generated_text ?? '')
      : (result as { generated_text: string }).generated_text;

    // For decoder-only models (text-generation) the output includes the prompt.
    // For encoder-decoder models (text2text-generation) the output is only the target text.
    const continuation =
      instance.task === 'text-generation' && generatedText.startsWith(prompt)
        ? generatedText.slice(prompt.length).trim()
        : generatedText.trim();

    const duration = Math.round(performance.now() - startTime);

    postMessage({
      type: 'result',
      id,
      text: continuation || generatedText,
      duration,
    } satisfies WorkerResponse);
  } catch (err: unknown) {
    postMessage({
      type: 'error',
      id,
      message: err instanceof Error ? err.message : 'Falha na geração local',
    } satisfies WorkerResponse);
  }
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'init':
      handleInit(msg.model);
      break;
    case 'generate':
      handleGenerate(msg.id, msg.prompt, msg.maxTokens);
      break;
    default:
      postMessage({
        type: 'error',
        id: 'unknown',
        message: `Tipo de mensagem desconhecido: ${(msg as { type: string }).type}`,
      } satisfies WorkerResponse);
  }
};
