import { useRef, useState, useCallback, useEffect } from 'react';
import { VNEngine } from '@zan-vn/vn-engine';
import type { Scene, Choice, SaveData, StoryData } from '@zan-vn/shared';
import type { ILLMProvider } from '@zan-vn/vn-engine';

export interface UseVNEngineReturn {
  engine: VNEngine;
  currentScene: Scene | null;
  availableChoices: Choice[];
  isLLMScene: boolean;
  isLoading: boolean;
  isGeneratingLLM: boolean;
  startGame: (story: StoryData, saveData?: SaveData) => void;
  continueGame: () => void;
  makeChoice: (choiceId: string) => void;
  createSave: (slot: number, label?: string) => SaveData;
  setLLMProvider: (provider: ILLMProvider) => void;
  getChapterProgress: () => { current: number; total: number };
}

/**
 * React hook wrapping the VN Engine.
 * Manages engine lifecycle, scene state, and LLM integration.
 *
 * Design: Adapter — connects the pure TS engine to React's reactive state.
 */
export function useVNEngine(): UseVNEngineReturn {
  const engineRef = useRef<VNEngine>(new VNEngine());
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [availableChoices, setAvailableChoices] = useState<Choice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingLLM, setIsGeneratingLLM] = useState(false);

  const updateScene = useCallback(() => {
    try {
      const scene = engineRef.current.getCurrentScene();
      setCurrentScene(scene);
      setAvailableChoices(engineRef.current.getAvailableChoices());
    } catch {
      setCurrentScene(null);
      setAvailableChoices([]);
    }
  }, []);

  const startGame = useCallback((story: StoryData, saveData?: SaveData) => {
    const scene = engineRef.current.start(story, saveData);
    setCurrentScene(scene);
    setAvailableChoices(engineRef.current.getAvailableChoices());
  }, []);

  const continueGame = useCallback(() => {
    setIsLoading(true);
    try {
      const scene = engineRef.current.continue();
      setCurrentScene(scene);
      setAvailableChoices(engineRef.current.getAvailableChoices());
    } catch (err) {
      console.error('Failed to continue:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const makeChoice = useCallback((choiceId: string) => {
    setIsLoading(true);
    try {
      const scene = engineRef.current.choose(choiceId);
      setCurrentScene(scene);
      setAvailableChoices(engineRef.current.getAvailableChoices());
    } catch (err) {
      console.error('Failed to make choice:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSave = useCallback((slot: number, label?: string) => {
    return engineRef.current.createSave(slot, label);
  }, []);

  const setLLMProvider = useCallback((provider: ILLMProvider) => {
    engineRef.current.setLLMProvider(provider);
  }, []);

  const getChapterProgress = useCallback(() => {
    return {
      current: engineRef.current.getCurrentChapterIndex(),
      total: engineRef.current.getTotalChapters(),
    };
  }, []);

  // Subscribe to engine events (scene transitions + LLM state)
  useEffect(() => {
    const engine = engineRef.current;
    const unsubScene = engine.on('scene:enter', () => updateScene());

    const unsubLLMRequested = engine.on('llm:requested', () => {
      setIsGeneratingLLM(true);
      setIsLoading(false);
    });
    const unsubLLMResponse = engine.on('llm:response', () => {
      setIsGeneratingLLM(false);
      updateScene();
    });
    const unsubError = engine.on('error', () => {
      setIsGeneratingLLM(false);
      updateScene();
    });

    return () => {
      unsubScene();
      unsubLLMRequested();
      unsubLLMResponse();
      unsubError();
    };
  }, [updateScene]);

  const isLLMScene = (currentScene?.metadata as Record<string, unknown>)?.generatedByLLM === true;

  // Also treat scenes with `status: 'generating'` as still being generated
  const isLLMGenerating =
    (currentScene?.metadata as Record<string, unknown>)?.status === 'generating';

  return {
    engine: engineRef.current,
    currentScene,
    availableChoices,
    isLLMScene,
    isLoading,
    isGeneratingLLM: isGeneratingLLM || isLLMGenerating,
    startGame,
    continueGame,
    makeChoice,
    createSave,
    setLLMProvider,
    getChapterProgress,
  };
}
