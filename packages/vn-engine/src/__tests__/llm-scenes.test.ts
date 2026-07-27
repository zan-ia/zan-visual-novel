import { describe, it, expect } from 'vitest';
import { VNEngine } from '../engine.js';
import type { ILLMProvider } from '../llm-provider.js';
import type { StoryData, Chapter, Scene, Choice, LLMGenerateResponse } from '@zan-vn/shared';

// ── Helpers ─────────────────────────────────────────────

const now = () => new Date().toISOString();

function createScene(overrides: Partial<Scene> & { id: string }): Scene {
  return {
    chapterId: 'ch-1',
    title: 'Scene',
    type: 'narration',
    content: [{ type: 'narration', text: '...' }],
    nextSceneId: null,
    metadata: null,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

function createChoice(overrides: Partial<Choice> & { id: string; targetSceneId: string }): Choice {
  return {
    sceneId: 'scene-1',
    text: 'Go',
    orderIndex: 0,
    isDefault: false,
    ...overrides,
  };
}

function createChapter(overrides: Partial<Chapter> & { id: string; scenes: Scene[] }): Chapter {
  return {
    vnId: 'test-vn',
    title: 'Chapter',
    orderIndex: 0,
    status: 'published',
    priceCredits: 0,
    startSceneId: null,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

function createStory(overrides?: Partial<StoryData>): StoryData {
  return {
    id: 'test-vn',
    creatorId: 'user-1',
    title: 'Test VN',
    synopsis: 'A test',
    coverUrl: null,
    status: 'draft',
    ageRating: 'general',
    totalChapters: 1,
    priceCredits: 0,
    iaEnabled: false,
    iaSystemPrompt: null,
    iaPersona: null,
    iaMaxTokens: 1024,
    metadata: null,
    publishedAt: null,
    createdAt: now(),
    updatedAt: now(),
    chapters: [
      createChapter({
        id: 'ch-1',
        startSceneId: 'scene-1',
        scenes: [createScene({ id: 'scene-1', title: 'Opening' })],
      }),
    ],
    ...overrides,
  };
}

function createMockLLMProvider(response?: Partial<LLMGenerateResponse>): ILLMProvider {
  return {
    async generate(): Promise<LLMGenerateResponse> {
      return {
        text: response?.text ?? 'Generated text',
        modelUsed: response?.modelUsed ?? 'lfm-230m',
        isLocal: response?.isLocal ?? false,
        tokensUsed: response?.tokensUsed ?? 10,
        duration: response?.duration ?? 100,
      };
    },
    isAvailable(): boolean {
      return true;
    },
    getModelType(): string {
      return 'lfm-230m';
    },
  };
}

function createFailingLLMProvider(): ILLMProvider {
  return {
    async generate(): Promise<LLMGenerateResponse> {
      throw new Error('LLM failed');
    },
    isAvailable(): boolean {
      return true;
    },
    getModelType(): string {
      return 'lfm-230m';
    },
  };
}

// ── Tests ────────────────────────────────────────────────

describe('LLM Scenes — Placeholder to Completion', () => {
  it('should create a placeholder, store it in llmScenes, and resolve via findScene fallback', () => {
    const engine = new VNEngine({ enableLLM: true });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [
            createScene({ id: 'scene-1', title: 'Opening', nextSceneId: 'scene-2' }),
            createScene({ id: 'scene-2', title: 'Middle', nextSceneId: null }),
          ],
        }),
      ],
    });

    const mockProvider = createMockLLMProvider();
    engine.setLLMProvider(mockProvider);
    engine.start(story);

    // Navigate to the last pre-defined scene (end of branch)
    engine.continue(); // → scene-2

    // continue() should trigger LLM generation and return a placeholder
    const placeholder = engine.continue();
    expect(placeholder.metadata).toBeDefined();
    expect((placeholder.metadata as Record<string, unknown>).generatedByLLM).toBe(true);
    expect((placeholder.metadata as Record<string, unknown>).status).toBe('generating');

    // The placeholder should be resolvable via getCurrentScene() (findScene fallback)
    const current = engine.getCurrentScene();
    expect(current.id).toBe(placeholder.id);
    expect((current.metadata as Record<string, unknown>).generatedByLLM).toBe(true);
  });

  it('should complete the placeholder scene after async generation (simulated)', async () => {
    const engine = new VNEngine({ enableLLM: true });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [createScene({ id: 'scene-1', title: 'Opening', nextSceneId: null })],
        }),
      ],
    });

    const mockProvider = createMockLLMProvider({ text: 'The story continues...' });
    engine.setLLMProvider(mockProvider);
    engine.start(story);

    // Trigger generation at end of branch
    const placeholder = engine.continue();
    expect((placeholder.metadata as Record<string, unknown>).status).toBe('generating');

    // Manually call generateLLMSceneAsync to simulate async completion
    const scene = engine.getCurrentScene();
    const finalScene = await engine.generateLLMSceneAsync(scene);

    expect(finalScene.content[0]?.text).toBe('The story continues...');
    expect((finalScene.metadata as Record<string, unknown>).status).toBe('completed');
    expect((finalScene.metadata as Record<string, unknown>).generatedByLLM).toBe(true);
  });
});

describe('LLM Scenes — Error Path', () => {
  it('should set error metadata when LLM generation fails', async () => {
    const engine = new VNEngine({ enableLLM: true });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [createScene({ id: 'scene-1', title: 'Opening', nextSceneId: null })],
        }),
      ],
    });

    engine.setLLMProvider(createFailingLLMProvider());
    engine.start(story);

    // Trigger generation
    const placeholder = engine.continue();
    expect((placeholder.metadata as Record<string, unknown>).status).toBe('generating');
    const scene = engine.getCurrentScene();

    // Simulate completion (will fail)
    const finalScene = await engine.generateLLMSceneAsync(scene);

    expect((finalScene.metadata as Record<string, unknown>).status).toBe('error');
    expect((finalScene.metadata as Record<string, unknown>).generatedByLLM).toBe(true);
    expect((finalScene.metadata as Record<string, unknown>).error).toBeDefined();
    expect(finalScene.content[0]?.text).toContain('Falha ao gerar');
  });
});

describe('LLM Scenes — __llm_generate__ Choice', () => {
  it('should start LLM generation via __llm_generate__ target choice', () => {
    const engine = new VNEngine({ enableLLM: true });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-choice',
          scenes: [
            createScene({
              id: 'scene-choice',
              title: 'Crossroads',
              type: 'choice',
              choices: [
                createChoice({
                  id: 'choice-llm',
                  text: 'Let the AI continue',
                  targetSceneId: '__llm_generate__',
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const mockProvider = createMockLLMProvider();
    engine.setLLMProvider(mockProvider);
    engine.start(story);

    const placeholder = engine.choose('choice-llm');
    expect((placeholder.metadata as Record<string, unknown>).generatedByLLM).toBe(true);
    expect((placeholder.metadata as Record<string, unknown>).status).toBe('generating');
  });
});

describe('LLM Scenes — findScene Fallback', () => {
  it('should find LLM-generated scenes via llmScenes map fallback', () => {
    const engine = new VNEngine({ enableLLM: true });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [createScene({ id: 'scene-1', title: 'Opening', nextSceneId: null })],
        }),
      ],
    });

    engine.setLLMProvider(createMockLLMProvider());
    engine.start(story);

    const placeholder = engine.continue();
    // The placeholder id should be resolvable via getCurrentScene()
    const found = engine.getCurrentScene();
    expect(found).toBeDefined();
    expect(found.id).toBe(placeholder.id);
  });
});

describe('LLM Scenes — Anti-Recursion Guard', () => {
  it('should NOT generate again when scene was already generated by LLM (status=completed)', async () => {
    const engine = new VNEngine({ enableLLM: true });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [createScene({ id: 'scene-1', title: 'Opening', nextSceneId: null })],
        }),
      ],
    });

    engine.setLLMProvider(createMockLLMProvider());
    engine.start(story);

    // First continue triggers generation
    const placeholder = engine.continue();
    expect((placeholder.metadata as Record<string, unknown>).status).toBe('generating');

    // Simulate completion
    const scene = engine.getCurrentScene();
    await engine.generateLLMSceneAsync(scene);

    // Second continue should return the same scene (no new generation)
    const sameScene = engine.continue();
    expect(sameScene.id).toBe(placeholder.id);
    expect((sameScene.metadata as Record<string, unknown>).status).toBe('completed');
  });
});

describe('LLM Scenes — llm:completed Event', () => {
  it('should emit llm:completed after successful generation', async () => {
    const engine = new VNEngine({ enableLLM: true });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [createScene({ id: 'scene-1', title: 'Opening', nextSceneId: null })],
        }),
      ],
    });

    engine.setLLMProvider(createMockLLMProvider());
    engine.start(story);

    const events: string[] = [];
    engine.on('llm:completed', (evt) => {
      events.push(evt.type);
    });

    // Trigger generation
    engine.continue();
    const scene = engine.getCurrentScene();
    await engine.generateLLMSceneAsync(scene);

    expect(events).toContain('llm:completed');
  });
});
