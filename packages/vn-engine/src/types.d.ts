export type EngineEventType =
  | 'scene:enter'
  | 'scene:exit'
  | 'choice:made'
  | 'choice:available'
  | 'flag:changed'
  | 'autosave'
  | 'llm:requested'
  | 'llm:response'
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
//# sourceMappingURL=types.d.ts.map
