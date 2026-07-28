/**
 * Web Worker for local LLM inference using Transformers.js.
 * Runs text generation off the main thread to keep the UI responsive.
 *
 * @worker
 */

import { pipeline, env } from '@huggingface/transformers';

// Configure Transformers.js to use local cache and prefer WebGPU
env.allowLocalModels = false;
env.useBrowserCache = true;

type WorkerMessage =
  | { type: 'init'; model: string }
  | { type: 'generate'; id: string; prompt: string; maxTokens: number };

type WorkerResponse =
  | { type: 'ready'; model: string }
  | { type: 'result'; id: string; text: string; duration: number }
  | { type: 'error'; id: string; message: string }
  | { type: 'progress'; status: string; progress?: number };

let generator: Awaited<ReturnType<typeof pipeline<'text-generation'>>> | null = null;
let currentModel: string | null = null;

async function handleInit(model: string): Promise<void> {
  if (generator && currentModel === model) {
    postMessage({ type: 'ready', model } satisfies WorkerResponse);
    return;
  }

  try {
    postMessage({ type: 'progress', status: 'loading', progress: 0 } satisfies WorkerResponse);

    // Use text-generation pipeline with the specified model
    generator = await pipeline('text-generation', model, {
      progress_callback: (info: { status: string; progress?: number }) => {
        postMessage({
          type: 'progress',
          status: info.status,
          progress: info.progress ?? undefined,
        } satisfies WorkerResponse);
      },
    });

    currentModel = model;
    postMessage({ type: 'ready', model } satisfies WorkerResponse);
  } catch (err: unknown) {
    postMessage({
      type: 'error',
      id: 'init',
      message: err instanceof Error ? err.message : 'Failed to load model',
    } satisfies WorkerResponse);
  }
}

async function handleGenerate(id: string, prompt: string, maxTokens: number): Promise<void> {
  if (!generator) {
    postMessage({
      type: 'error',
      id,
      message: 'Model not loaded. Call init first.',
    } satisfies WorkerResponse);
    return;
  }

  try {
    const startTime = performance.now();
    const result = await generator(prompt, {
      max_new_tokens: maxTokens,
      temperature: 0.8,
      top_p: 0.9,
      do_sample: true,
    });

    // result is an array of { generated_text: string } objects
    const generatedText = Array.isArray(result)
      ? result[0]?.generated_text ?? ''
      : (result as { generated_text: string }).generated_text;

    // Strip the original prompt from the output
    const continuation = generatedText.startsWith(prompt)
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
      message: err instanceof Error ? err.message : 'Generation failed',
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
        message: `Unknown message type: ${(msg as { type: string }).type}`,
      } satisfies WorkerResponse);
  }
};
