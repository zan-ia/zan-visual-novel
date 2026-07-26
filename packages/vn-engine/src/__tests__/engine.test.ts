import { describe, it, expect, beforeEach } from 'vitest';
import { VNEngine, EmptyStoryError } from '../engine.js';
import type { StoryData, Chapter, Scene, Choice } from '@zan-vn/shared';

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
        scenes: [
          createScene({ id: 'scene-1', title: 'Opening' }),
        ],
      }),
    ],
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────

describe('VNEngine — Construction', () => {
  it('should construct with default config', () => {
    const engine = new VNEngine();
    expect(engine).toBeDefined();
  });

  it('should construct with custom config', () => {
    const engine = new VNEngine({ enableLLM: false, maxHistory: 5 });
    expect(engine).toBeDefined();
  });
});

describe('VNEngine — Start / Errors', () => {
  it('should throw EmptyStoryError when starting with no chapters', () => {
    const engine = new VNEngine();
    const story = createStory({ chapters: [] });
    expect(() => engine.start(story)).toThrow(EmptyStoryError);
    try {
      engine.start(story);
    } catch (err) {
      expect(err).toBeInstanceOf(EmptyStoryError);
      expect((err as EmptyStoryError).code).toBe('EMPTY_STORY');
      expect((err as EmptyStoryError).reason).toBe('no_chapters');
      expect((err as EmptyStoryError).storyId).toBe('test-vn');
    }
  });

  it('should throw EmptyStoryError when the first chapter has no scenes', () => {
    const engine = new VNEngine();
    const story = createStory({
      chapters: [createChapter({ id: 'ch-1', scenes: [], startSceneId: null })],
    });
    expect(() => engine.start(story)).toThrow(EmptyStoryError);
    try {
      engine.start(story);
    } catch (err) {
      expect(err).toBeInstanceOf(EmptyStoryError);
      expect((err as EmptyStoryError).reason).toBe('no_scenes');
      expect((err as EmptyStoryError).storyId).toBe('test-vn');
    }
  });

  it('should start with a valid story and return the first scene by startSceneId', () => {
    const engine = new VNEngine();
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [
            createScene({ id: 'scene-1', title: 'Opening' }),
            createScene({ id: 'scene-2', title: 'Chapter 2' }),
          ],
        }),
      ],
    });
    const scene = engine.start(story);
    expect(scene.id).toBe('scene-1');
    expect(scene.title).toBe('Opening');
  });

  it('should fall back to first scene when startSceneId is null', () => {
    const engine = new VNEngine();
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: null,
          scenes: [
            createScene({ id: 'scene-a', title: 'Alpha' }),
            createScene({ id: 'scene-b', title: 'Beta' }),
          ],
        }),
      ],
    });
    const scene = engine.start(story);
    expect(scene.id).toBe('scene-a');
  });

  it('should throw when navigating to a non-existent scene', () => {
    const engine = new VNEngine();
    const story = createStory();
    engine.start(story);
    // Manually set an invalid sceneId (internal, but the error path is tested via choose)
    expect(() => (engine as any).navigateToScene('nonexistent')).toThrow('Scene not found');
  });
});

describe('VNEngine — Linear Navigation (continue)', () => {
  let engine: VNEngine;
  let story: StoryData;

  beforeEach(() => {
    engine = new VNEngine({ enableLLM: false });
    story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [
            createScene({ id: 'scene-1', title: 'Start', nextSceneId: 'scene-2' }),
            createScene({ id: 'scene-2', title: 'Middle', nextSceneId: 'scene-3' }),
            createScene({ id: 'scene-3', title: 'End', type: 'ending', nextSceneId: null }),
          ],
        }),
      ],
    });
    engine.start(story);
  });

  it('should navigate forward via continue()', () => {
    const scene2 = engine.continue();
    expect(scene2.id).toBe('scene-2');
    expect(scene2.title).toBe('Middle');
  });

  it('should continue multiple times following nextSceneId chain', () => {
    engine.continue(); // → scene-2
    const scene3 = engine.continue(); // → scene-3
    expect(scene3.id).toBe('scene-3');
    expect(scene3.title).toBe('End');
  });

  it('should throw when reaching the end of the story (no LLM)', () => {
    engine.continue(); // → scene-2
    engine.continue(); // → scene-3
    expect(() => engine.continue()).toThrow('End of story reached');
  });

  it('should return the correct current scene after navigation', () => {
    engine.continue();
    expect(engine.getCurrentScene().id).toBe('scene-2');
  });
});

describe('VNEngine — Choices', () => {
  let engine: VNEngine;
  let story: StoryData;

  beforeEach(() => {
    engine = new VNEngine({ enableLLM: false });
    story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-choice',
          scenes: [
            createScene({
              id: 'scene-choice',
              title: 'Crossroads',
              type: 'choice',
              content: [{ type: 'narration', text: 'Choose your path.' }],
              choices: [
                createChoice({ id: 'choice-a', text: 'Go left', targetSceneId: 'scene-left' }),
                createChoice({ id: 'choice-b', text: 'Go right', targetSceneId: 'scene-right' }),
              ],
            }),
            createScene({ id: 'scene-left', title: 'Left Path', type: 'narration' }),
            createScene({ id: 'scene-right', title: 'Right Path', type: 'narration' }),
          ],
        }),
      ],
    });
    engine.start(story);
  });

  it('should return all choices for a choice scene', () => {
    const choices = engine.getAvailableChoices();
    expect(choices).toHaveLength(2);
    expect(choices.map((c) => c.text)).toEqual(['Go left', 'Go right']);
  });

  it('should navigate to target scene via choose()', () => {
    const scene = engine.choose('choice-a');
    expect(scene.id).toBe('scene-left');
    expect(scene.title).toBe('Left Path');
  });

  it('should navigate to different target via different choice', () => {
    const scene = engine.choose('choice-b');
    expect(scene.id).toBe('scene-right');
  });

  it('should throw when choosing an invalid choice ID', () => {
    expect(() => engine.choose('nonexistent')).toThrow('Choice not found');
  });

  it('should return empty choices for a non-choice scene', () => {
    engine.choose('choice-a'); // goes to scene-left (narration)
    const choices = engine.getAvailableChoices();
    expect(choices).toHaveLength(0);
  });
});

describe('VNEngine — Choice Conditions', () => {
  let engine: VNEngine;
  let story: StoryData;

  beforeEach(() => {
    engine = new VNEngine({ enableLLM: false });
    story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-choice',
          scenes: [
            createScene({
              id: 'scene-choice',
              title: 'Check',
              type: 'choice',
              choices: [
                createChoice({
                  id: 'c-locked',
                  text: 'Locked path',
                  targetSceneId: 'scene-secret',
                  conditions: [{
                    id: 'cond-1',
                    choiceId: 'c-locked',
                    variableName: 'hasKey',
                    operator: 'eq',
                    value: true,
                  }],
                }),
                createChoice({
                  id: 'c-always',
                  text: 'Always open',
                  targetSceneId: 'scene-open',
                }),
              ],
            }),
            createScene({ id: 'scene-secret', title: 'Secret Room' }),
            createScene({ id: 'scene-open', title: 'Open Path' }),
          ],
        }),
      ],
    });
    engine.start(story);
  });

  it('should hide choices whose conditions are not met', () => {
    const choices = engine.getAvailableChoices();
    expect(choices).toHaveLength(1);
    expect(choices[0]!.id).toBe('c-always');
  });

  it('should show conditioned choices when the flag is set', () => {
    engine.setFlag('hasKey', true);
    const choices = engine.getAvailableChoices();
    expect(choices).toHaveLength(2);
  });

  it('should throw when trying to pick a choice with unmet conditions', () => {
    expect(() => engine.choose('c-locked')).toThrow('Choice conditions not met');
  });

  it('should allow picking conditioned choice after flag is set', () => {
    engine.setFlag('hasKey', true);
    const scene = engine.choose('c-locked');
    expect(scene.id).toBe('scene-secret');
  });

  it('should evaluate comparison operators (eq, neq, gt, lt)', () => {
    const engine2 = new VNEngine({ enableLLM: false });
    const story2 = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-op',
          scenes: [
            createScene({
              id: 'scene-op',
              title: 'Operators',
              type: 'choice',
              choices: [
                createChoice({
                  id: 'c-gt',
                  text: 'Level > 5',
                  targetSceneId: 'scene-high',
                  conditions: [{ id: 'c1', choiceId: 'c-gt', variableName: 'level', operator: 'gt', value: 5 }],
                }),
                createChoice({
                  id: 'c-lte',
                  text: 'Level <= 5',
                  targetSceneId: 'scene-low',
                  conditions: [{ id: 'c2', choiceId: 'c-lte', variableName: 'level', operator: 'lte', value: 5 }],
                }),
                createChoice({
                  id: 'c-neq',
                  text: 'Not banned',
                  targetSceneId: 'scene-ok',
                  conditions: [{ id: 'c3', choiceId: 'c-neq', variableName: 'banned', operator: 'neq', value: true }],
                }),
              ],
            }),
            createScene({ id: 'scene-high', title: 'High Level' }),
            createScene({ id: 'scene-low', title: 'Low Level' }),
            createScene({ id: 'scene-ok', title: 'Not Banned' }),
          ],
        }),
      ],
    });
    engine2.start(story2);

    // No flags set → gt fails (NaN > 5), lte fails (NaN <= 5), neq passes (undefined !== true)
    expect(engine2.getAvailableChoices().map((c) => c.id)).toEqual(['c-neq']);

    engine2.setFlag('level', 10);
    engine2.start(story2);
    engine2.setFlag('level', 10);
    expect(engine2.getAvailableChoices().map((c) => c.id)).toEqual(['c-gt', 'c-neq']);

    engine2.setFlag('banned', true);
    engine2.start(story2);
    engine2.setFlag('level', 10);
    engine2.setFlag('banned', true);
    expect(engine2.getAvailableChoices().map((c) => c.id)).toEqual(['c-gt']);
  });

  it('should evaluate exists operator', () => {
    const engine2 = new VNEngine({ enableLLM: false });
    const story2 = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-ex',
          scenes: [
            createScene({
              id: 'scene-ex',
              title: 'Exists',
              type: 'choice',
              choices: [
                createChoice({
                  id: 'c-exists',
                  text: 'Has flag',
                  targetSceneId: 'scene-yes',
                  conditions: [{ id: 'c1', choiceId: 'c-exists', variableName: 'myFlag', operator: 'exists', value: null }],
                }),
              ],
            }),
            createScene({ id: 'scene-yes', title: 'Flag Present' }),
          ],
        }),
      ],
    });
    engine2.start(story2);
    // Flag doesn't exist yet
    expect(engine2.getAvailableChoices()).toHaveLength(0);

    engine2.setFlag('myFlag', 'yes');
    expect(engine2.getAvailableChoices()).toHaveLength(1);
  });
});

describe('VNEngine — Choice Effects', () => {
  let engine: VNEngine;
  let story: StoryData;

  beforeEach(() => {
    engine = new VNEngine({ enableLLM: false });
    story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-start',
          scenes: [
            createScene({
              id: 'scene-start',
              title: 'Start',
              type: 'choice',
              choices: [
                createChoice({
                  id: 'c-set',
                  text: 'Set flag',
                  targetSceneId: 'scene-end',
                  effects: [{ id: 'e1', choiceId: 'c-set', variableName: 'hero', action: 'set', value: 'Alice' }],
                }),
                createChoice({
                  id: 'c-add',
                  text: 'Add gold',
                  targetSceneId: 'scene-end',
                  effects: [{ id: 'e2', choiceId: 'c-add', variableName: 'gold', action: 'add', value: 10 }],
                }),
                createChoice({
                  id: 'c-toggle',
                  text: 'Toggle',
                  targetSceneId: 'scene-end',
                  effects: [{ id: 'e3', choiceId: 'c-toggle', variableName: 'active', action: 'toggle', value: null }],
                }),
                createChoice({
                  id: 'c-push',
                  text: 'Push item',
                  targetSceneId: 'scene-end',
                  effects: [{ id: 'e4', choiceId: 'c-push', variableName: 'items', action: 'push', value: 'sword' }],
                }),
              ],
            }),
            createScene({ id: 'scene-end', title: 'End', type: 'ending' }),
          ],
        }),
      ],
    });
  });

  it('should apply set effect on flag', () => {
    engine.start(story);
    engine.choose('c-set');
    expect(engine.getFlag('hero')).toBe('Alice');
  });

  it('should apply add effect on numeric flag', () => {
    engine.start(story);
    engine.setFlag('gold', 5);
    engine.choose('c-add');
    expect(engine.getFlag('gold')).toBe(15);
  });

  it('should apply add effect starting from zero', () => {
    engine.start(story);
    engine.choose('c-add');
    expect(engine.getFlag('gold')).toBe(10);
  });

  it('should apply toggle effect (false → true)', () => {
    engine.start(story);
    engine.choose('c-toggle');
    expect(engine.getFlag('active')).toBe(true);
  });

  it('should apply toggle effect (true → false)', () => {
    engine.start(story);
    engine.setFlag('active', true);
    engine.choose('c-toggle');
    expect(engine.getFlag('active')).toBe(false);
  });

  it('should apply push effect to array', () => {
    engine.start(story);
    engine.choose('c-push');
    expect(engine.getFlag('items')).toEqual(['sword']);
  });

  it('should apply push effect to existing array', () => {
    engine.start(story);
    engine.setFlag('items', ['bow']);
    engine.choose('c-push');
    expect(engine.getFlag('items')).toEqual(['bow', 'sword']);
  });
});

describe('VNEngine — History', () => {
  let engine: VNEngine;
  let story: StoryData;

  beforeEach(() => {
    engine = new VNEngine({ enableLLM: false });
    story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [
            createScene({
              id: 'scene-1',
              title: 'First',
              type: 'choice',
              choices: [
                createChoice({ id: 'c-a', text: 'To second', targetSceneId: 'scene-2' }),
                createChoice({ id: 'c-b', text: 'To third', targetSceneId: 'scene-3' }),
              ],
            }),
            createScene({ id: 'scene-2', title: 'Second', type: 'narration' }),
            createScene({ id: 'scene-3', title: 'Third', type: 'narration' }),
          ],
        }),
      ],
    });
    engine.start(story);
  });

  it('should record choices in history', () => {
    engine.choose('c-a');
    expect(engine.getState().history).toHaveLength(1);
    expect(engine.getState().history[0]!.choiceId).toBe('c-a');
    expect(engine.getState().history[0]!.sceneId).toBe('scene-1');
  });

  it('should record multiple choices in order', () => {
    // Create a chain: scene-1 → scene-2 (has no choices, but we can test history persistence)
    engine.choose('c-a');
    engine.start(story);
    engine.choose('c-b');
    expect(engine.getState().history).toHaveLength(1);
    expect(engine.getState().history[0]!.choiceId).toBe('c-b');
  });

  it('should respect maxHistory config', () => {
    const smallEngine = new VNEngine({ enableLLM: false, maxHistory: 2 });
    const multiChoiceStory = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-loop',
          scenes: [
            createScene({
              id: 'scene-loop',
              title: 'Loop',
              type: 'choice',
              choices: [
                createChoice({ id: 'c-1', text: 'Go', targetSceneId: 'scene-loop' }),
              ],
            }),
          ],
        }),
      ],
    });
    smallEngine.start(multiChoiceStory);
    smallEngine.choose('c-1');
    smallEngine.choose('c-1');
    smallEngine.choose('c-1');
    expect(smallEngine.getState().history).toHaveLength(2);
  });
});

describe('VNEngine — Save / Load', () => {
  let engine: VNEngine;
  let story: StoryData;

  beforeEach(() => {
    engine = new VNEngine({ enableLLM: false });
    story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [
            createScene({
              id: 'scene-1',
              title: 'Start',
              type: 'choice',
              choices: [
                createChoice({ id: 'c-save', text: 'Save test', targetSceneId: 'scene-2' }),
              ],
            }),
            createScene({ id: 'scene-2', title: 'After choice', type: 'narration' }),
          ],
        }),
      ],
    });
  });

  it('should create save data from current state', () => {
    engine.start(story);
    engine.setFlag('gold', 100);
    const save = engine.createSave(1, 'Test Save');
    expect(save.slotNumber).toBe(1);
    expect(save.label).toBe('Test Save');
    expect(save.currentSceneId).toBe('scene-1');
    expect(save.flags).toEqual({ gold: 100 });
  });

  it('should restore state from save data', () => {
    engine.start(story);
    engine.setFlag('gold', 100);
    engine.choose('c-save');
    expect(engine.getCurrentScene().id).toBe('scene-2');

    // Save, then start fresh and restore
    const save = engine.createSave(1, 'Restore Test');
    const newEngine = new VNEngine({ enableLLM: false });

    // Modify state before restore to prove it resets
    newEngine.setFlag('trash', true);

    newEngine.start(story, save);
    expect(newEngine.getCurrentScene().id).toBe('scene-2');
    expect(newEngine.getFlag('gold')).toBe(100);
    expect(newEngine.getFlag('trash')).toBeUndefined();
  });

  it('should restore choice history from save data', () => {
    engine.start(story);
    engine.choose('c-save');
    const save = engine.createSave(1);
    const newEngine = new VNEngine({ enableLLM: false });
    newEngine.start(story, save);
    expect(newEngine.getState().history).toHaveLength(1);
    expect(newEngine.getState().history[0]!.choiceId).toBe('c-save');
  });
});

describe('VNEngine — Flags & State', () => {
  let engine: VNEngine;

  beforeEach(() => {
    engine = new VNEngine({ enableLLM: false });
  });

  it('should set and get flags', () => {
    engine.setFlag('health', 80);
    expect(engine.getFlag('health')).toBe(80);
  });

  it('should return undefined for unset flags', () => {
    expect(engine.getFlag('nonexistent')).toBeUndefined();
  });

  it('should return a copy of state via getState()', () => {
    engine.setFlag('key', 'value');
    const state = engine.getState();
    expect(state.flags.get('key')).toBe('value');
    // Mutating returned state should not affect engine
    state.flags.set('key', 'hacked');
    expect(engine.getFlag('key')).toBe('value');
  });
});

describe('VNEngine — Events', () => {
  it('should emit scene:enter event on start', () => {
    const engine = new VNEngine();
    const story = createStory();
    const events: string[] = [];
    engine.on('scene:enter', () => events.push('enter'));
    engine.start(story);
    expect(events).toContain('enter');
  });

  it('should emit scene:enter event on navigate', () => {
    const engine = new VNEngine({ enableLLM: false });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [
            createScene({ id: 'scene-1', title: 'A', nextSceneId: 'scene-2' }),
            createScene({ id: 'scene-2', title: 'B' }),
          ],
        }),
      ],
    });
    const events: string[] = [];
    engine.on('scene:enter', (e) => events.push(e.sceneId!));
    engine.start(story);
    engine.continue();
    expect(events).toEqual(['scene-1', 'scene-2']);
  });

  it('should emit flag:changed event', () => {
    const engine = new VNEngine();
    const events: string[] = [];
    engine.on('flag:changed', (e) => events.push(`${e.name}=${e.value}`));
    engine.setFlag('test', 42);
    expect(events).toEqual(['test=42']);
  });

  it('should emit choice:made event', () => {
    const engine = new VNEngine({ enableLLM: false });
    const story = createStory({
      chapters: [
        createChapter({
          id: 'ch-1',
          startSceneId: 'scene-1',
          scenes: [
            createScene({
              id: 'scene-1',
              title: 'Choice',
              type: 'choice',
              choices: [
                createChoice({ id: 'c-1', text: 'Go', targetSceneId: 'scene-1' }),
              ],
            }),
          ],
        }),
      ],
    });
    const events: string[] = [];
    engine.on('choice:made', (e) => events.push(e.choiceId!));
    engine.start(story);
    engine.choose('c-1');
    expect(events).toEqual(['c-1']);
  });

  it('should allow unsubscribing from events', () => {
    const engine = new VNEngine();
    let count = 0;
    const unsubscribe = engine.on('scene:enter', () => count++);
    unsubscribe();
    const story = createStory();
    engine.start(story);
    expect(count).toBe(0);
  });
});

describe('VNEngine — Chapter Info', () => {
  it('should return current chapter index', () => {
    const engine = new VNEngine();
    const story = createStory();
    engine.start(story);
    expect(engine.getCurrentChapterIndex()).toBe(0);
  });

  it('should return total chapter count', () => {
    const engine = new VNEngine();
    const story = createStory();
    engine.start(story);
    expect(engine.getTotalChapters()).toBe(1);
  });

  it('should return 0 for total chapters when no story loaded', () => {
    const engine = new VNEngine();
    expect(engine.getTotalChapters()).toBe(0);
  });

  it('should throw when getting chapter index without a story', () => {
    const engine = new VNEngine();
    expect(() => engine.getCurrentChapterIndex()).toThrow('Scene not found');
  });

  it('should return the loaded story via getStory()', () => {
    const engine = new VNEngine();
    const story = createStory({ id: 'story-42' });
    engine.start(story);
    expect(engine.getStory()?.id).toBe('story-42');
  });

  it('should return null from getStory() before start', () => {
    const engine = new VNEngine();
    expect(engine.getStory()).toBeNull();
  });
});
