import type {
  StoryData,
  Scene,
  Choice,
  VNState,
  ChoiceRecord,
  SaveData,
  LLMGenerateResponse,
} from '@zan-vn/shared';
import type { ILLMProvider } from './llm-provider.js';
import type { EngineConfig, EngineEvent, EngineEventType } from './types.js';

/**
 * Thrown when the engine cannot start a story because it has no chapters
 * or a chapter has no scenes. Callers can use `instanceof EmptyStoryError`
 * and the `code` field to render a specific UX message instead of a
 * generic failure.
 */
export class EmptyStoryError extends Error {
  readonly code = 'EMPTY_STORY' as const;
  constructor(
    public readonly storyId: string,
    public readonly reason: 'no_chapters' | 'no_scenes',
    public readonly chapterId?: string,
  ) {
    super(reason === 'no_chapters' ? 'Story has no chapters' : 'Chapter has no scenes');
    this.name = 'EmptyStoryError';
  }
}

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
export class VNEngine {
  private state: VNState;
  private story: StoryData | null = null;
  private config: EngineConfig;
  private llmProvider: ILLMProvider | null = null;
  /** LLM-generated scenes not part of any chapter's `scenes` array. */
  private llmScenes: Map<string, Scene> = new Map();
  private eventListeners: Map<EngineEventType, Set<(event: EngineEvent) => void>> = new Map();

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      enableLLM: true,
      maxHistory: 10,
      autoSave: true,
      ...config,
    };
    this.state = this.createInitialState();
  }

  // ── Public API ──────────────────────────────────────────

  /** Start a new game or load an existing story */
  start(story: StoryData, saveData?: SaveData): Scene {
    this.story = story;
    if (saveData) {
      this.loadState(saveData);
    } else {
      this.state = this.createInitialState();
      const firstChapter = story.chapters[0];
      if (!firstChapter) throw new EmptyStoryError(story.id, 'no_chapters');
      const firstScene =
        firstChapter.scenes?.find((s) => s.id === firstChapter.startSceneId) ??
        firstChapter.scenes?.[0];
      if (!firstScene) throw new EmptyStoryError(story.id, 'no_scenes', firstChapter.id);
      this.state.currentSceneId = firstScene.id;
    }
    this.emit('scene:enter', { sceneId: this.state.currentSceneId });
    return this.getCurrentScene();
  }

  /** Get the current scene */
  getCurrentScene(): Scene {
    const scene = this.findScene(this.state.currentSceneId);
    if (!scene) throw new Error(`Scene not found: ${this.state.currentSceneId}`);
    return scene;
  }

  /** Get the 0-based index of the current chapter in the story */
  getCurrentChapterIndex(): number {
    const scene = this.getCurrentScene();
    if (!this.story) return 0;
    const chapter = this.story.chapters.find((c) => c.id === scene.chapterId);
    return chapter?.orderIndex ?? 0;
  }

  /** Get total chapter count */
  getTotalChapters(): number {
    return this.story?.chapters.length ?? 0;
  }

  /** Get all available choices for the current scene (evaluates conditions) */
  getAvailableChoices(): Choice[] {
    const scene = this.getCurrentScene();
    if (!scene.choices) return [];
    return scene.choices.filter((choice) => this.evaluateConditions(choice));
  }

  /** Make a choice and navigate to the target scene */
  choose(choiceId: string): Scene {
    const scene = this.getCurrentScene();
    const choice = scene.choices?.find((c) => c.id === choiceId);
    if (!choice) throw new Error(`Choice not found: ${choiceId}`);

    // Check conditions
    if (!this.evaluateConditions(choice)) {
      throw new Error('Choice conditions not met');
    }

    // Apply effects
    this.applyEffects(choice);

    // Record in history
    const record: ChoiceRecord = {
      sceneId: scene.id,
      choiceId: choice.id,
      timestamp: new Date().toISOString(),
    };
    this.state.history.push(record);

    // Trim history
    if (this.state.history.length > this.config.maxHistory) {
      this.state.history = this.state.history.slice(-this.config.maxHistory);
    }

    this.emit('choice:made', { sceneId: scene.id, choiceId });

    // Navigate to target (or generate with LLM if target is "llm")
    if (choice.targetSceneId === '__llm_generate__') {
      const placeholder = this.generateLLMScenePlaceholder(scene);
      this.emit('scene:enter', { sceneId: placeholder.id });
      // Fire-and-forget async generation — updates scene in-place
      this.generateLLMSceneAsync(scene)
        .then((finalScene) => {
          this.emit('scene:enter', { sceneId: finalScene.id });
        })
        .catch((err: unknown) => {
          this.emit('error', { error: err instanceof Error ? err : new Error(String(err)) });
        });
      return placeholder;
    }

    return this.navigateToScene(choice.targetSceneId);
  }

  /** Continue to next scene linearly */
  continue(): Scene {
    const scene = this.getCurrentScene();

    // Guard: if this scene was already generated by LLM (any status), don't
    // generate again. The UI should show a "Voltar à Biblioteca" exit instead.
    const metadata = scene.metadata as Record<string, unknown> | undefined;
    if (metadata?.generatedByLLM === true) {
      return scene;
    }

    if (scene.nextSceneId) {
      return this.navigateToScene(scene.nextSceneId);
    }
    // End of pre-defined branch — try async LLM generation
    if (this.config.enableLLM && this.llmProvider) {
      const placeholder = this.generateLLMScenePlaceholder(scene);
      this.emit('scene:enter', { sceneId: placeholder.id });
      // Fire-and-forget async generation — updates scene in-place
      this.generateLLMSceneAsync(scene)
        .then((finalScene) => {
          this.emit('scene:enter', { sceneId: finalScene.id });
        })
        .catch((err: unknown) => {
          this.emit('error', { error: err instanceof Error ? err : new Error(String(err)) });
        });
      return placeholder;
    }
    throw new Error('End of story reached');
  }

  /** Generate narrative continuation using LLM */
  async generateContinuation(): Promise<LLMGenerateResponse | null> {
    if (!this.llmProvider || !this.story) return null;

    const scene = this.getCurrentScene();
    const historyText = this.state.history.map((r) => {
      const s = this.findScene(r.sceneId);
      return s?.content.map((b) => b.text).join(' ') ?? '';
    });

    return this.llmProvider.generate({
      prompt: `Continue a história a partir desta cena. Gere o próximo parágrafo narrativo.`,
      context: {
        storyTitle: this.story.title,
        currentScene: scene.content.map((b) => b.text).join('\n'),
        characterNames: this.extractCharacterNames(),
        recentHistory: historyText.slice(-5),
        flags: Object.fromEntries(this.state.flags),
      },
      config: {
        modelType: 'lfm-350m',
        temperature: 0.7,
        maxTokens: 500,
        topP: 0.9,
        systemPrompt: this.story.iaSystemPrompt ?? '',
        persona: this.story.iaPersona ?? '',
      },
    });
  }

  /** Get the current engine state */
  getState(): VNState {
    return {
      ...this.state,
      flags: new Map(this.state.flags),
      variables: new Map(this.state.variables),
    };
  }

  /** Get the loaded story */
  getStory(): StoryData | null {
    return this.story;
  }

  /** Create save data from current state */
  createSave(slotNumber: number, label = 'Save'): SaveData {
    return {
      id: crypto.randomUUID(),
      userId: '',
      vnId: this.story?.id ?? '',
      slotNumber,
      label,
      currentSceneId: this.state.currentSceneId,
      flags: Object.fromEntries(this.state.flags),
      choiceHistory: [...this.state.history],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /** Set a variable/flag */
  setFlag(name: string, value: unknown): void {
    this.state.flags.set(name, value);
    this.emit('flag:changed', { name, value });
  }

  /** Get a variable/flag */
  getFlag(name: string): unknown {
    return this.state.flags.get(name);
  }

  /** Set the LLM provider */
  setLLMProvider(provider: ILLMProvider): void {
    this.llmProvider = provider;
  }

  /** Subscribe to engine events */
  on(event: EngineEventType, callback: (event: EngineEvent) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => this.eventListeners.get(event)?.delete(callback);
  }

  // ── Private Methods ─────────────────────────────────────

  private createInitialState(): VNState {
    return {
      currentSceneId: '',
      flags: new Map(),
      history: [],
      variables: new Map(),
    };
  }

  private loadState(save: SaveData): void {
    this.state = {
      currentSceneId: save.currentSceneId,
      flags: new Map(Object.entries(save.flags)),
      history: save.choiceHistory,
      variables: new Map(),
    };
  }

  private findScene(sceneId: string): Scene | undefined {
    if (!this.story) return undefined;
    for (const chapter of this.story.chapters) {
      const scene = chapter.scenes?.find((s) => s.id === sceneId);
      if (scene) return scene;
    }
    // Fallback: check LLM-generated scenes (not part of story.chapters)
    return this.llmScenes.get(sceneId);
  }

  private navigateToScene(sceneId: string): Scene {
    this.state.currentSceneId = sceneId;
    const scene = this.getCurrentScene();
    this.emit('scene:enter', { sceneId });
    if (this.config.autoSave) {
      this.emit('autosave', {});
    }
    return scene;
  }

  private evaluateConditions(choice: Choice): boolean {
    if (!choice.conditions || choice.conditions.length === 0) return true;

    return choice.conditions.every((cond) => {
      const currentValue = this.state.flags.get(cond.variableName);
      const expectedValue = cond.value;

      switch (cond.operator) {
        case 'eq':
          return currentValue === expectedValue;
        case 'neq':
          return currentValue !== expectedValue;
        case 'gt':
          return Number(currentValue) > Number(expectedValue);
        case 'lt':
          return Number(currentValue) < Number(expectedValue);
        case 'gte':
          return Number(currentValue) >= Number(expectedValue);
        case 'lte':
          return Number(currentValue) <= Number(expectedValue);
        case 'in':
          return Array.isArray(expectedValue) && expectedValue.includes(currentValue);
        case 'not_in':
          return Array.isArray(expectedValue) && !expectedValue.includes(currentValue);
        case 'exists':
          return currentValue !== undefined && currentValue !== null;
        default:
          return false;
      }
    });
  }

  private applyEffects(choice: Choice): void {
    if (!choice.effects) return;

    for (const effect of choice.effects) {
      const currentValue = this.state.flags.get(effect.variableName);

      switch (effect.action) {
        case 'set':
          this.state.flags.set(effect.variableName, effect.value);
          break;
        case 'add':
          this.state.flags.set(
            effect.variableName,
            Number(currentValue ?? 0) + Number(effect.value),
          );
          break;
        case 'toggle':
          this.state.flags.set(effect.variableName, !currentValue);
          break;
        case 'push': {
          const arr = Array.isArray(currentValue) ? [...currentValue] : [];
          arr.push(effect.value);
          this.state.flags.set(effect.variableName, arr);
          break;
        }
      }
      this.emit('flag:changed', {
        name: effect.variableName,
        value: this.state.flags.get(effect.variableName),
      });
    }
  }

  /**
   * Creates a placeholder scene for immediate UI feedback while LLM
   * generation runs in the background. The scene will be updated
   * asynchronously by `generateLLMSceneAsync`.
   */
  private generateLLMScenePlaceholder(currentScene: Scene): Scene {
    const placeholder: Scene = {
      id: `llm-${crypto.randomUUID()}`,
      chapterId: currentScene.chapterId,
      title: 'Continuação (IA)',
      type: 'narration',
      content: [{ type: 'narration', text: '[...]' }],
      nextSceneId: null,
      metadata: { generatedByLLM: true, status: 'generating' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store so findScene() can locate it (placeholder is NOT part of story.chapters)
    this.llmScenes.set(placeholder.id, placeholder);
    this.state.currentSceneId = placeholder.id;
    this.emit('llm:requested', { sceneId: placeholder.id });

    return placeholder;
  }

  /**
   * Generate an LLM-authored scene asynchronously.
   *
   * Uses the `_currentScene` parameter (the scene the player was on when
   * generation was triggered) to build context. Looks up the placeholder
   * from `llmScenes` — avoids a redundant `getCurrentScene()` call that
   * would fail on the placeholder before it was stored in the map.
   *
   * On success, fills the placeholder content and emits `llm:completed`.
   * On failure, fills with error text and emits `error`.
   */
  async generateLLMSceneAsync(_currentScene: Scene): Promise<Scene> {
    // Use the placeholder already stored in llmScenes
    const placeholder = this.llmScenes.get(this.state.currentSceneId);
    if (!placeholder) throw new Error('LLM placeholder not found');

    try {
      const response = await this.generateContinuation();
      if (response) {
        placeholder.content = [{ type: 'narration', text: response.text }];
        placeholder.metadata = {
          generatedByLLM: true,
          status: 'completed',
          modelUsed: response.modelUsed,
          isLocal: response.isLocal,
          tokensUsed: response.tokensUsed,
          durationMs: response.duration,
        };
        this.emit('llm:response', { sceneId: placeholder.id, text: response.text });
        this.emit('llm:completed', { sceneId: placeholder.id });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      placeholder.content = [{ type: 'narration', text: `⚠️ ${errorMessage}` }];
      placeholder.metadata = { generatedByLLM: true, status: 'error', error: errorMessage };
      const error = err instanceof Error ? err : new Error(String(err));
      this.emit('error', { error });
    }

    return placeholder;
  }

  private extractCharacterNames(): string[] {
    const names = new Set<string>();
    if (!this.story) return [];
    for (const chapter of this.story.chapters) {
      for (const scene of chapter.scenes ?? []) {
        for (const block of scene.content) {
          if (block.speaker) names.add(block.speaker);
        }
      }
    }
    return [...names];
  }

  private emit(type: EngineEventType, data: Record<string, unknown> = {}): void {
    const event: EngineEvent = { type, timestamp: Date.now(), ...data } as EngineEvent;
    this.eventListeners.get(type)?.forEach((cb) => cb(event));
  }
}

// Re-export types used by engine consumers
// NOTE: StoryData, Chapter, Scene, etc. are imported from @zan-vn/shared — see top of file.
