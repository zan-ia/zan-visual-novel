import { describe, it, expect } from 'vitest';
import { VNEngine, EmptyStoryError } from '../engine.js';
import type { StoryData } from '@zan-vn/shared';

describe('VNEngine', () => {
  it('should construct with default config', () => {
    const engine = new VNEngine();
    expect(engine).toBeDefined();
  });

  it('should construct with custom config', () => {
    const engine = new VNEngine({ enableLLM: false, maxHistory: 5 });
    expect(engine).toBeDefined();
  });

  it('should throw EmptyStoryError when starting with no chapters', () => {
    const engine = new VNEngine();
    const emptyStory: StoryData = {
      id: 'test-vn',
      creatorId: 'user-1',
      title: 'Test',
      synopsis: 'A test VN',
      coverUrl: null,
      status: 'draft',
      ageRating: 'general',
      totalChapters: 0,
      priceCredits: 0,
      iaEnabled: false,
      iaSystemPrompt: null,
      iaPersona: null,
      iaMaxTokens: 1024,
      metadata: null,
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [],
    };
    expect(() => engine.start(emptyStory)).toThrow(EmptyStoryError);
    try {
      engine.start(emptyStory);
    } catch (err) {
      expect(err).toBeInstanceOf(EmptyStoryError);
      expect((err as EmptyStoryError).code).toBe('EMPTY_STORY');
      expect((err as EmptyStoryError).reason).toBe('no_chapters');
      expect((err as EmptyStoryError).storyId).toBe('test-vn');
    }
  });

  it('should throw EmptyStoryError when the first chapter has no scenes', () => {
    const engine = new VNEngine();
    const storyNoScenes: StoryData = {
      id: 'test-vn-empty',
      creatorId: 'user-1',
      title: 'Test',
      synopsis: 'A test VN',
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-1',
          vnId: 'test-vn-empty',
          title: 'Chapter 1',
          orderIndex: 0,
          status: 'published',
          priceCredits: 0,
          startSceneId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          scenes: [],
        },
      ],
    };
    expect(() => engine.start(storyNoScenes)).toThrow(EmptyStoryError);
    try {
      engine.start(storyNoScenes);
    } catch (err) {
      expect(err).toBeInstanceOf(EmptyStoryError);
      expect((err as EmptyStoryError).code).toBe('EMPTY_STORY');
      expect((err as EmptyStoryError).reason).toBe('no_scenes');
      expect((err as EmptyStoryError).storyId).toBe('test-vn-empty');
    }
  });

  it('should start with a valid story and return the first scene', () => {
    const engine = new VNEngine();
    const story: StoryData = {
      id: 'test-vn',
      creatorId: 'user-1',
      title: 'Test',
      synopsis: 'A test VN',
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-1',
          vnId: 'test-vn',
          title: 'Chapter 1',
          orderIndex: 0,
          status: 'published',
          priceCredits: 0,
          startSceneId: 'scene-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          scenes: [
            {
              id: 'scene-1',
              chapterId: 'ch-1',
              title: 'Opening',
              type: 'narration',
              content: [
                {
                  type: 'narration',
                  text: 'Once upon a time...',
                },
              ],
              nextSceneId: null,
              metadata: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    };
    const scene = engine.start(story);
    expect(scene).toBeDefined();
    expect(scene.id).toBe('scene-1');
    expect(scene.title).toBe('Opening');
  });
});
