export type EngineEventType =
  | 'scene:enter'
  | 'scene:exit'
  | 'choice:made'
  | 'choice:available'
  | 'flag:changed'
  | 'autosave'
  | 'llm:requested'
  | 'llm:response'
  | 'llm:completed'
  | 'engine:start'
  | 'engine:end'
  | 'error';

export interface EngineEvent {
  type: EngineEventType;
  timestamp: number;
  sceneId?: string;
  choiceId?: string;
  name?: string;
  value?: unknown;
  error?: Error;
}

export interface EngineConfig {
  /** Enable LLM narrative generation when reaching end of pre-defined branch */
  enableLLM: boolean;
  /** Maximum number of choices to keep in history */
  maxHistory: number;
  /** Auto-save after each scene transition */
  autoSave: boolean;
}

/** Type of LLM provider currently active. */
export type ProviderType = 'local' | 'cloud' | 'composite' | 'none';

/** Device hardware capabilities used for provider selection. */
export interface DeviceCapabilities {
  /** Whether WebGPU is available for hardware-accelerated inference. */
  webgpu: boolean;
  /** Approximate device RAM in GB (via `navigator.deviceMemory`), or null if unavailable. */
  memoryGB: number | null;
  /** Number of logical CPU cores (via `navigator.hardwareConcurrency`). */
  cores: number;
  /** Recommended provider strategy based on detected capabilities. */
  recommendedProvider: ProviderType;
}
