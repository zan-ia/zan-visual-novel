import type {
  StoryData,
  Chapter,
  Scene,
  Choice,
  VNState,
  SaveData,
  LLMGenerateResponse,
} from '@zan-vn/shared';
import type { ILLMProvider } from './llm-provider.js';
import type { EngineConfig, EngineEvent, EngineEventType } from './types.js';
/**
 * Visual Novel Engine — Core state machine for VN gameplay.
 *
 * Pure TypeScript, framework-agnostic. Manages scene navigation,
 * choice evaluation, variable/flag state, and LLM narrative generation
 * when the player reaches the end of pre-defined branches.
 *
 * Design: State pattern — the engine's behavior changes based on
 * current scene type (narration, dialogue, choice, ending).
 */
export declare class VNEngine {
  private state;
  private story;
  private config;
  private llmProvider;
  private eventListeners;
  constructor(config?: Partial<EngineConfig>);
  /** Start a new game or load an existing story */
  start(story: StoryData, saveData?: SaveData): Scene;
  /** Get the current scene */
  getCurrentScene(): Scene;
  /** Get all available choices for the current scene (evaluates conditions) */
  getAvailableChoices(): Choice[];
  /** Make a choice and navigate to the target scene */
  choose(choiceId: string): Scene;
  /** Continue to next scene linearly */
  continue(): Scene;
  /** Generate narrative continuation using LLM */
  generateContinuation(): Promise<LLMGenerateResponse | null>;
  /** Get the current engine state */
  getState(): VNState;
  /** Get the loaded story */
  getStory(): StoryData | null;
  /** Create save data from current state */
  createSave(slotNumber: number, label?: string): SaveData;
  /** Set a variable/flag */
  setFlag(name: string, value: unknown): void;
  /** Get a variable/flag */
  getFlag(name: string): unknown;
  /** Set the LLM provider */
  setLLMProvider(provider: ILLMProvider): void;
  /** Subscribe to engine events */
  on(event: EngineEventType, callback: (event: EngineEvent) => void): () => void;
  private createInitialState;
  private loadState;
  private findScene;
  private navigateToScene;
  private evaluateConditions;
  private applyEffects;
  private generateLLMScene;
  private extractCharacterNames;
  private emit;
}
export type StoryData = {
  id: string;
  title: string;
  chapters: Chapter[];
  llmConfig?: {
    systemPrompt: string;
    persona: string;
  };
};
//# sourceMappingURL=engine.d.ts.map
