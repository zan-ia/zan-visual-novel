/**
 * Web Worker for LFM 2.5 ONNX inference via ONNX Runtime Web + WebGPU.
 * Runs text generation off the main thread to keep the UI responsive.
 *
 * Strategy:
 * 1. Load LFM2.5-350M-ONNX (Q4, ~276MB) via WebGPU for real-time local inference.
 * 2. Fall back to WASM/CPU if WebGPU fails.
 * 3. Manage KV cache (past_key_values + past_conv) manually between steps.
 * 4. Use @huggingface/transformers AutoTokenizer for ChatML tokenization only.
 *
 * @worker
 */

import * as ort from 'onnxruntime-web/webgpu';
import { AutoTokenizer } from '@huggingface/transformers';
import type { PreTrainedTokenizer } from '@huggingface/transformers';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

type WorkerMessage =
  | { type: 'init'; model: string }
  | { type: 'generate'; id: string; prompt: string; maxTokens: number };

type WorkerResponse =
  | { type: 'ready'; model: string; device: string }
  | { type: 'result'; id: string; text: string; duration: number }
  | { type: 'error'; id: string; message: string }
  | { type: 'progress'; status: string; progress?: number };

// ═══════════════════════════════════════════════════════════
// Model Configuration
// ═══════════════════════════════════════════════════════════

/** Map of internal model IDs to HuggingFace repo IDs. */
const MODEL_REPO_MAP: Record<string, string> = {
  'lfm-350m': 'LiquidAI/LFM2.5-350M-ONNX',
  'lfm-1.2b-thinking': 'LiquidAI/LFM2.5-1.2B-Thinking-ONNX',
  'lfm-vl-450m': 'LiquidAI/LFM2.5-VL-450M-ONNX',
};

/** Default generation parameters (from LFM2.5 docs). */
const DEFAULTS = {
  temperature: 0.1,
  topK: 50,
  repetitionPenalty: 1.05,
  maxTokens: 512,
} as const;

// ═══════════════════════════════════════════════════════════
// Inference State
// ═══════════════════════════════════════════════════════════

interface PipelineState {
  session: ort.InferenceSession;
  tokenizer: PreTrainedTokenizer;
  modelRepo: string;
  modelId: string;
  device: string;
}

let state: PipelineState | null = null;

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function reportProgress(info: { status: string; progress?: number }): void {
  postMessage({
    type: 'progress',
    status: info.status,
    progress: info.progress ?? undefined,
  } satisfies WorkerResponse);
}

// ═══════════════════════════════════════════════════════════
// OPFS Cache (Origin Private File System)
// ═══════════════════════════════════════════════════════════

const OPFS_ROOT = 'zan-vn/models';
/** Bump this when model files change to invalidate the cache. */
const CACHE_VERSION = 1;

/** Ensure a directory path exists in OPFS, creating intermediate dirs as needed. */
async function ensureOPFSDir(path: string): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  const parts = path.split('/').filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  return current;
}

/** Read a file from OPFS as an ArrayBuffer. Returns null if not found. */
async function getOPFSFile(fullPath: string): Promise<ArrayBuffer | null> {
  try {
    const parts = fullPath.split('/');
    const fileName = parts.pop()!;
    const dirPath = parts.join('/');

    const dir = await ensureOPFSDir(dirPath);
    const fileHandle = await dir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  } catch {
    return null;
  }
}

/** Write data to a file in OPFS, creating parent directories as needed. */
async function saveOPFSFile(fullPath: string, data: ArrayBuffer): Promise<void> {
  const parts = fullPath.split('/');
  const fileName = parts.pop()!;
  const dirPath = parts.join('/');

  const dir = await ensureOPFSDir(dirPath);
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

/** Create an object URL from OPFS data for use with InferenceSession. */
async function opfsBlobUrl(opfsPath: string, mimeType = 'application/octet-stream'): Promise<string> {
  const data = await getOPFSFile(opfsPath);
  if (!data) throw new Error(`OPFS cache miss: ${opfsPath}`);
  const blob = new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
}

/** Download a file with progress reporting and optional OPFS caching. */
async function downloadWithProgress(
  url: string,
  opfsCachePath: string,
  statusPrefix: string,
  progressStart: number,
  progressEnd: number,
): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  const reader = response.body?.getReader();
  if (!reader) {
    // Fallback: no streaming support
    const buffer = await response.arrayBuffer();
    reportProgress({ status: `${statusPrefix}`, progress: progressEnd });
    // Save to OPFS in background
    saveOPFSFile(opfsCachePath, buffer).catch(() => {});
    return buffer;
  }

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total > 0) {
      const pct = Math.round(progressStart + ((progressEnd - progressStart) * received) / total);
      const mb = (received / (1024 * 1024)).toFixed(0);
      const totalMb = (total / (1024 * 1024)).toFixed(0);
      reportProgress({ status: `${statusPrefix} · ${mb}/${totalMb}MB`, progress: pct });
    }
  }

  // Concat all chunks
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  // Save to OPFS asynchronously — don't block model loading
  saveOPFSFile(opfsCachePath, buffer.buffer.slice(0)).catch(() => {});

  reportProgress({ status: statusPrefix, progress: progressEnd });
  return buffer.buffer;
}

function isWebGPUSupported(): boolean {
  try {
    return (
      'gpu' in self &&
      typeof (self as unknown as { gpu?: { requestAdapter?: unknown } }).gpu?.requestAdapter ===
        'function'
    );
  } catch {
    return false;
  }
}

/** Build the raw URL to download a file from a HuggingFace repo. */
function hfRawUrl(repoId: string, filePath: string): string {
  return `https://huggingface.co/${repoId}/resolve/main/${filePath}`;
}

// ═══════════════════════════════════════════════════════════
// Token Sampling (temperature, top-k, repetition penalty)
// ═══════════════════════════════════════════════════════════

function sampleToken(
  logitsData: Float32Array,
  vocabSize: number,
  generatedTokens: number[],
  temperature: number,
  topK: number,
  repetitionPenalty: number,
): number {
  const logits = new Float32Array(logitsData);

  // Apply repetition penalty to previously generated tokens
  const seen = new Set(generatedTokens);
  for (const tokenId of seen) {
    const val = logits[tokenId]!;
    if (val > 0) {
      logits[tokenId] = val / repetitionPenalty;
    } else {
      logits[tokenId] = val * repetitionPenalty;
    }
  }

  // Apply temperature
  for (let i = 0; i < vocabSize; i++) {
    logits[i] = logits[i]! / temperature;
  }

  // Top-k: find top K indices and values
  const indexed = Array.from(logits.slice(0, vocabSize), (v, i) => [v!, i] as [number, number]);
  indexed.sort((a, b) => b[0] - a[0]);
  const topKSlice = indexed.slice(0, topK);

  // Softmax over top-k
  const maxLogit = topKSlice[0]![0];
  const exps = topKSlice.map(([v, i]) => [Math.exp(v - maxLogit), i!] as [number, number]);
  const sumExp = exps.reduce((s, [e]) => s + e, 0);
  const probs = exps.map(([e, i]) => [e / sumExp, i!] as [number, number]);

  // Sample from distribution
  let r = Math.random();
  for (const [p, idx] of probs) {
    r -= p;
    if (r <= 0) return idx;
  }
  return probs[probs.length - 1]![1];
}

// ═══════════════════════════════════════════════════════════
// KV Cache Management
// ═══════════════════════════════════════════════════════════

/**
 * Initialize empty KV cache tensors for the first generation step.
 * The LFM2.5 model has two kinds of past states:
 * - past_key_values.* (standard GQA attention KV cache)
 * - past_conv.* (Liquid convolution block state)
 */
function initCache(session: ort.InferenceSession): Record<string, ort.Tensor> {
  const cache: Record<string, ort.Tensor> = {};

  for (const input of session.inputNames) {
    if (input === 'input_ids' || input === 'attention_mask' || input === 'position_ids') {
      continue;
    }
    // Determine shape from model input metadata; default to zero-sized sequence dim
    const inputMeta = (session as unknown as Record<string, unknown>).inputMeta as
      Record<string, { dims?: number[] }> | undefined;
    const meta = inputMeta?.[input];
    const dims = meta?.dims ?? [1, 0, 0];
    const shape = dims.map((d: number) => (d <= 0 ? 0 : d));
    const size = shape.reduce((a: number, b: number) => a * Math.max(b, 1), 1);
    cache[input] = new ort.Tensor('float32', new Float32Array(size), shape);
  }

  return cache;
}

/**
 * Update KV cache from inference outputs.
 * Output names use `present_*` which map to `past_*` inputs for the next step.
 */
function updateCache(cache: Record<string, ort.Tensor>, outputs: Record<string, ort.Tensor>): void {
  for (const name of Object.keys(outputs)) {
    // present_conv.X → past_conv.X
    // present.key_values.X → past_key_values.X
    let cacheKey = name;
    if (name.startsWith('present_conv')) {
      cacheKey = name.replace('present_conv', 'past_conv');
    } else if (name.startsWith('present.')) {
      cacheKey = name.replace('present.', 'past_key_values.');
    }
    if (cacheKey in cache && outputs[name]) {
      cache[cacheKey] = outputs[name]!;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Model Loading
// ═══════════════════════════════════════════════════════════

async function loadModel(internalId: string): Promise<PipelineState> {
  const modelRepo = MODEL_REPO_MAP[internalId];
  if (!modelRepo) {
    throw new Error(
      `Modelo desconhecido: ${internalId}. Use: lfm-350m, lfm-1.2b-thinking, ou lfm-vl-450m`,
    );
  }

  // If already loaded the same model, reuse
  if (state && state.modelId === internalId) {
    return state;
  }

  reportProgress({ status: 'loading', progress: 0 });

  // ── Load tokenizer (Transformers.js has its own HF cache) ──
  reportProgress({ status: 'Carregando tokenizer...', progress: 5 });
  const tokenizer = await AutoTokenizer.from_pretrained(modelRepo);

  // ── Determine device ──
  const useWebGPU = isWebGPUSupported();
  const deviceLabel = useWebGPU ? 'webgpu' : 'wasm';

  // Configure ONNX Runtime
  ort.env.wasm.numThreads = 1;

  // ── OPFS cache paths ──
  const modelDir = `${OPFS_ROOT}/${internalId}`;
  const onnxCachePath = `${modelDir}/model_q4.onnx`;
  const dataCachePath = `${modelDir}/model_q4.onnx_data`;
  const manifestCachePath = `${modelDir}/manifest.json`;

  // Check manifest version to decide cache validity
  let cacheValid = false;
  try {
    const manifestRaw = await getOPFSFile(manifestCachePath);
    if (manifestRaw) {
      const manifest = JSON.parse(new TextDecoder().decode(manifestRaw)) as {
        version: number;
        modelRepo: string;
      };
      cacheValid = manifest.version === CACHE_VERSION && manifest.modelRepo === modelRepo;
    }
  } catch {
    cacheValid = false;
  }

  // ── Load model files: OPFS cache first, then HuggingFace ──
  let onnxUrl = '';
  let dataUrl = '';

  if (cacheValid) {
    reportProgress({ status: 'Carregando modelo do cache...', progress: 10 });
    try {
      onnxUrl = await opfsBlobUrl(onnxCachePath);
      dataUrl = await opfsBlobUrl(dataCachePath);
      reportProgress({ status: 'Modelo carregado do cache', progress: 20 });
    } catch {
      // Cache files corrupted — fall through to download
      reportProgress({ status: 'Cache inválido, baixando novamente...', progress: 10 });
      cacheValid = false;
    }
  }

  if (!cacheValid) {
    // ── Download from HuggingFace with progress ──
    reportProgress({ status: 'Baixando modelo LFM 2.5...', progress: 10 });
    const hfOnnxUrl = hfRawUrl(modelRepo, 'onnx/model_q4.onnx');
    const hfDataUrl = hfRawUrl(modelRepo, 'onnx/model_q4.onnx_data');

    const [onnxBuffer, dataBuffer] = await Promise.all([
      downloadWithProgress(hfOnnxUrl, onnxCachePath, 'ONNX weights', 12, 35),
      downloadWithProgress(hfDataUrl, dataCachePath, 'ONNX data', 35, 50),
    ]);

    // Save manifest
    const manifest = { version: CACHE_VERSION, modelRepo, savedAt: Date.now() };
    saveOPFSFile(manifestCachePath, new TextEncoder().encode(JSON.stringify(manifest)).buffer).catch(
      () => {},
    );

    onnxUrl = URL.createObjectURL(new Blob([onnxBuffer]));
    dataUrl = URL.createObjectURL(new Blob([dataBuffer]));
  }

  reportProgress({ status: `Carregando ONNX (${deviceLabel})...`, progress: 60 });

  const sessionOptions: ort.InferenceSession.SessionOptions = {
    executionProviders: [useWebGPU ? 'webgpu' : 'wasm'],
    externalData: [{ path: 'model_q4.onnx_data', data: dataUrl }],
  };

  let session: ort.InferenceSession;
  try {
    session = await ort.InferenceSession.create(onnxUrl, sessionOptions);
  } catch (webgpuErr) {
    // If WebGPU fails, try WASM fallback
    if (useWebGPU) {
      reportProgress({
        status: `WebGPU falhou. Usando CPU...`,
        progress: 80,
      });
      sessionOptions.executionProviders = ['wasm'];
      session = await ort.InferenceSession.create(onnxUrl, sessionOptions);
    } else {
      throw webgpuErr;
    }
  }

  reportProgress({ status: 'Modelo carregado!', progress: 100 });

  state = { session, tokenizer, modelRepo, modelId: internalId, device: deviceLabel };
  return state;
}

// ═══════════════════════════════════════════════════════════
// Generation
// ═══════════════════════════════════════════════════════════

async function generate(id: string, prompt: string, maxTokens: number): Promise<void> {
  try {
    if (!state) {
      throw new Error('Modelo não carregado. Execute init primeiro.');
    }

    const { session, tokenizer } = state;
    const startTime = performance.now();

    // ── Build ChatML prompt ──
    const messages = [{ role: 'user', content: prompt }];
    const formattedPrompt = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      tokenize: false,
    }) as string;

    // ── Tokenize ──
    const inputIds = tokenizer.encode(formattedPrompt) as number[];
    const eosTokenId = tokenizer.eos_token_id;
    const vocabSize =
      (tokenizer as unknown as { model_max_length?: number }).model_max_length ?? 65536;

    // ── Initialize KV cache ──
    const cache = initCache(session);
    const generatedTokens: number[] = [];
    const maxNewTokens = Math.min(maxTokens, DEFAULTS.maxTokens);
    let curLen = inputIds.length;
    let ids = [...inputIds];

    // Check if model uses position_ids
    const inputNames = new Set(session.inputNames);
    const hasPositionIds = inputNames.has('position_ids');

    // ── Generation loop ──
    for (let step = 0; step < maxNewTokens; step++) {
      // Prepare inputs
      const inputIdsTensor = new ort.Tensor(
        'int64',
        BigInt64Array.from(ids.map((n) => BigInt(n))),
        [1, ids.length],
      );
      const attentionMask = new ort.Tensor('int64', new BigInt64Array(curLen).fill(1n), [
        1,
        curLen,
      ]);

      const feeds: Record<string, ort.Tensor> = {
        input_ids: inputIdsTensor,
        attention_mask: attentionMask,
        ...cache,
      };

      if (hasPositionIds) {
        const pos =
          step === 0
            ? Array.from({ length: inputIds.length }, (_, i) => BigInt(i))
            : [BigInt(curLen - 1)];
        feeds['position_ids'] = new ort.Tensor('int64', BigInt64Array.from(pos), [1, pos.length]);
      }

      // Run inference
      const outputs = await session.run(feeds);

      // Extract logits for the last token
      const logitsTensor = outputs.logits;
      if (!logitsTensor) {
        throw new Error('Model output missing logits tensor');
      }
      const logitsDims = logitsTensor.dims;
      const seqLen = logitsDims[1] ?? 1;
      const vocabDim = logitsDims[2] ?? vocabSize;
      const lastTokenStart = (seqLen - 1) * vocabDim;
      const lastTokenEnd = seqLen * vocabDim;
      const lastLogits = (logitsTensor.data as Float32Array).slice(lastTokenStart, lastTokenEnd);

      // Sample next token
      const nextToken = sampleToken(
        lastLogits,
        vocabDim,
        generatedTokens,
        DEFAULTS.temperature,
        DEFAULTS.topK,
        DEFAULTS.repetitionPenalty,
      );

      // Check stop condition
      if (nextToken === eosTokenId) break;
      generatedTokens.push(nextToken);

      // Update KV cache for next step
      updateCache(cache, outputs);

      // Prepare for next iteration (single token)
      ids = [nextToken];
      curLen++;
    }

    // ── Decode ──
    const generatedText = tokenizer.decode(generatedTokens, {
      skip_special_tokens: true,
    }) as string;

    const duration = Math.round(performance.now() - startTime);

    postMessage({
      type: 'result',
      id,
      text: generatedText,
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

// ═══════════════════════════════════════════════════════════
// Message Handler
// ═══════════════════════════════════════════════════════════

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'init': {
      try {
        const loaded = await loadModel(msg.model);
        postMessage({
          type: 'ready',
          model: loaded.modelId,
          device: loaded.device,
        } satisfies WorkerResponse);
      } catch (err: unknown) {
        state = null;
        postMessage({
          type: 'error',
          id: 'init',
          message: err instanceof Error ? err.message : 'Falha ao carregar modelo',
        } satisfies WorkerResponse);
      }
      break;
    }

    case 'generate':
      await generate(msg.id, msg.prompt, msg.maxTokens);
      break;

    default:
      postMessage({
        type: 'error',
        id: 'unknown',
        message: `Tipo de mensagem desconhecido: ${(msg as { type: string }).type}`,
      } satisfies WorkerResponse);
  }
};
