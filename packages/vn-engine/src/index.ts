export { VNEngine } from './engine.js';
export { EmptyStoryError } from './engine.js';
export { createDefaultLLMProvider } from './llm-provider.js';
export { createCompositeLLMProvider } from './llm-provider.js';
export type { ILLMProvider } from './llm-provider.js';
export { createLocalLLMProvider } from './providers/local-provider.js';
export { LocalProviderUnavailableError } from './providers/local-provider.js';
export type { LocalProviderConfig } from './providers/local-provider.js';
export { createDefaultLFMWorker } from './providers/local-provider.js';
export { createCloudLLMProvider } from './providers/cloud-provider.js';
export type { CloudProviderConfig } from './providers/cloud-provider.js';
export type { EngineConfig, EngineEvent, EngineEventType } from './types.js';
export type { ProviderType, DeviceCapabilities } from './types.js';

/** Relative path to the LFM ONNX Web Worker script (for Vite's new Worker URL pattern). */
export const LFM_WORKER_PATH = './providers/lfm-worker.js';
