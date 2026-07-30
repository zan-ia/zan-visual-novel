// =============================================================================
// Local LLM Service — Transformers.js backend fallback
// =============================================================================
// Runs small Hugging Face models directly on the server using ONNX Runtime.
// This is the fallback used by the browser when in-browser WASM/WebGPU
// inference is unavailable or fails (e.g. Electron/VS Code embedded browser,
// missing GPU, network restrictions downloading model files).
// =============================================================================

import { pipeline, env } from '@huggingface/transformers';
import type { LLMGenerateInput, LLMGenerateResponse, LLMModelType } from '@zan-vn/shared';

// ── Environment configuration ───────────────────────────

// Disable local file models and browser cache; rely on the Hub download.
env.allowLocalModels = false;
env.useBrowserCache = false;

// ── Model mapping ───────────────────────────────────────

/** Maps internal model names to HuggingFace ONNX repo IDs. */
const MODEL_MAP: Record<string, string> = {
  'lfm-350m': 'LiquidAI/LFM2.5-350M-ONNX',
  'lfm-1.2b-thinking': 'LiquidAI/LFM2.5-1.2B-Thinking-ONNX',
  'lfm-vl-450m': 'LiquidAI/LFM2.5-VL-450M-ONNX',
};

// ── Pipeline singleton ──────────────────────────────────

type PipelineTask = 'text-generation' | 'text2text-generation';

interface PipelineInstance {
  generator: Awaited<ReturnType<typeof pipeline<PipelineTask>>>;
  modelType: string;
  task: PipelineTask;
}

let pipelineInstance: PipelineInstance | null = null;

/** Infer the Transformers.js task from the model id. */
function detectTask(model: string): PipelineTask {
  const lower = model.toLowerCase();
  if (lower.includes('t5') || lower.includes('flan') || lower.includes('bart')) {
    return 'text2text-generation';
  }
  return 'text-generation';
}

/** Load (or reuse) a cached Transformers.js pipeline for the model type. */
async function loadPipeline(modelType: LLMModelType): Promise<PipelineInstance> {
  if (pipelineInstance && pipelineInstance.modelType === modelType) {
    return pipelineInstance;
  }

  const model = MODEL_MAP[modelType] ?? modelType;
  const task = detectTask(model);

  console.log(`[local-llm] Loading ${modelType} (${model}) for task ${task}...`);

  const generator = await pipeline(task, model);
  pipelineInstance = { generator, modelType, task };

  console.log(`[local-llm] ${modelType} loaded successfully`);
  return pipelineInstance;
}

// ── Helpers ─────────────────────────────────────────────

function extractGeneratedText(result: unknown): string {
  if (Array.isArray(result)) {
    return (result[0] as { generated_text?: string })?.generated_text ?? '';
  }
  return (result as { generated_text?: string })?.generated_text ?? '';
}

function normalizeContinuation(generatedText: string, prompt: string, task: PipelineTask): string {
  // Decoder-only models include the prompt in the output; strip it.
  if (task === 'text-generation' && generatedText.startsWith(prompt)) {
    return generatedText.slice(prompt.length).trim();
  }
  return generatedText.trim();
}

// ── Main service ────────────────────────────────────────

/**
 * Generate a narrative continuation using a local Transformers.js model.
 *
 * @param request The validated LLM generate request.
 * @returns The generated narrative response.
 * @throws Error on model load or generation failure.
 */
/**
 * Build a context-rich prompt for text2text / text-generation models.
 * Mirrors the cloud LLM's `buildMessages` structure but as a single string
 * For small local models (77M-350M params), we keep prompts SHORT and focused —
 * they can't handle complex multi-paragraph instructions like cloud models.
 */
function buildLocalPrompt(request: LLMGenerateInput): string {
  const { context, config } = request;

  // For tiny models, use a single-line persona prefix (if available)
  const persona = config.persona ? `[${config.persona}] ` : '';

  // Condensed context — only the essentials
  const parts: string[] = [];

  // Brief scene context (truncate to keep prompt short)
  const scene = (context.currentScene ?? '').slice(0, 300);
  if (scene) parts.push(scene);

  // Short history (last 1-2 entries, truncated)
  if (context.recentHistory.length > 0) {
    const last = context.recentHistory.at(-1)?.slice(0, 200) ?? '';
    if (last) parts.push(last);
  }

  const contextStr = parts.join(' ');

  // Assemble: keep under ~500 tokens for small models
  return `${persona}${contextStr} Continue:`.trim();
}

export async function generateLocalLLM(request: LLMGenerateInput): Promise<LLMGenerateResponse> {
  const startTime = Date.now();

  const instance = await loadPipeline(request.config.modelType);

  const prompt = buildLocalPrompt(request);

  console.log(`[local-llm] Prompt (${prompt.length} chars): ${prompt.slice(0, 200)}...`);

  const result = await instance.generator(prompt, {
    max_new_tokens: request.config.maxTokens,
    temperature: request.config.temperature,
    top_p: request.config.topP,
    do_sample: true,
  });

  const generatedText = extractGeneratedText(result);
  const continuation = normalizeContinuation(generatedText, prompt, instance.task);

  return {
    text: continuation || generatedText,
    modelUsed: request.config.modelType,
    isLocal: true,
    tokensUsed: 0,
    duration: Date.now() - startTime,
  };
}
