import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import {
  createLocalLLMProvider,
  createDefaultLFMWorker,
  createCloudLLMProvider,
  createCompositeLLMProvider,
} from '@zan-vn/vn-engine';
import type { ILLMProvider, DeviceCapabilities, ProviderType } from '@zan-vn/vn-engine';
import type { ModelStatus } from '../components/model-loading-screen.js';

interface ModelContextValue {
  /** The composite LLM provider (local → cloud fallback). null while initializing. */
  llmProvider: ILLMProvider | null;
  /** Current model loading status. */
  modelStatus: ModelStatus;
  /** Download/load progress 0–100. */
  modelProgress: number;
  /** Human-readable status message from the worker. */
  modelStatusText: string;
  /** Device label (e.g. 'webgpu', 'wasm'). */
  modelDevice: string;
  /** Error message when status === 'error'. */
  modelError: string;
  /** Re-initialise the provider (e.g. after a failure or config change). */
  retryLoad: () => void;
  /** Whether the model is ready for inference. */
  isModelReady: boolean;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModel must be used within ModelProvider');
  return ctx;
}

export interface ModelProviderProps {
  children: ReactNode;
  apiBaseUrl: string;
}

/**
 * Application-level provider that creates and manages the LLM inference
 * worker lifecycle. Persists the worker across page navigations so the
 * model is only downloaded/loaded once per session.
 *
 * Design: Singleton context — wraps the entire app so all pages share
 * the same ILLMProvider instance. Reads the access token from localStorage
 * dynamically so it naturally reacts to login/logout events.
 */
export function ModelProvider({ children, apiBaseUrl }: ModelProviderProps) {
  const [llmProvider, setLLMProvider] = useState<ILLMProvider | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('detecting');
  const [modelProgress, setModelProgress] = useState(0);
  const [modelStatusText, setModelStatusText] = useState('Detectando capacidades do dispositivo...');
  const [modelDevice, setModelDevice] = useState('');
  const [modelError, setModelError] = useState('');

  // Force re-mount key — increment to destroy/recreate provider
  const [mountKey, setMountKey] = useState(0);

  // Hold the composite provider in a ref so we can terminate the worker on cleanup
  const compositeRef = useRef<ILLMProvider | null>(null);

  const isModelReady = modelStatus === 'ready';

  useEffect(() => {
    const caps = detectDeviceCapabilities();
    const providers: ILLMProvider[] = [];
    const token = localStorage.getItem('access_token') ?? undefined;

    const onProgress = (status: string, progress?: number) => {
      setModelStatusText(status);
      if (progress !== undefined) setModelProgress(progress);

      // Infer device
      if (status.toLowerCase().includes('webgpu')) setModelDevice('webgpu');
      if (status.toLowerCase().includes('wasm') || status.toLowerCase().includes('cpu'))
        setModelDevice('wasm');

      // Infer status
      if (status.toLowerCase().includes('baixando')) setModelStatus('downloading');
      else if (status.toLowerCase().includes('carregando')) setModelStatus('loading');
      else if (status.toLowerCase().includes('pronto') || status.toLowerCase().includes('ready'))
        setModelStatus('ready');
    };

    if (caps.recommendedProvider === 'local' || caps.webgpu) {
      providers.push(
        createLocalLLMProvider({
          modelType: 'lfm-350m',
          workerFactory: createDefaultLFMWorker,
          onProgress,
        }),
      );
      setModelStatus(caps.webgpu ? 'detecting' : 'fallback');
      setModelDevice(caps.webgpu ? 'webgpu' : 'wasm');
    } else {
      setModelStatusText('WebGPU indisponível. Usando nuvem para geração.');
      setModelStatus('ready'); // Cloud doesn't need preloading
    }

    providers.push(
      createCloudLLMProvider({
        apiBaseUrl,
        accessToken: token,
      }),
    );

    const composite = createCompositeLLMProvider(providers);
    compositeRef.current = composite;
    setLLMProvider(composite);

    // If local provider is in the composite, trigger preloading
    // by calling generate with a minimal prompt to kickstart the worker
    if (caps.recommendedProvider === 'local' || caps.webgpu) {
      // Fire-and-forget: preload the model in background
      composite
        .generate({
          config: {
            modelType: 'lfm-350m',
            maxTokens: 1,
            temperature: 0.1,
            topP: 0.9,
            systemPrompt: '',
            persona: '',
          },
          prompt: '.',
          context: {
            storyTitle: '',
            currentScene: '',
            characterNames: [],
            recentHistory: [],
            flags: {},
          },
        })
        .then(() => {
          setModelStatus('ready');
          setModelStatusText('Modelo carregado!');
          setModelProgress(100);
        })
        .catch((err: Error) => {
          setModelStatus('error');
          setModelError(err.message);
        });
    }

    return () => {
      // Cleanup: the composite provider will be GC'd, worker terminates
      compositeRef.current = null;
    };
  }, [apiBaseUrl, mountKey]);

  const retryLoad = useCallback(() => {
    setModelStatus('detecting');
    setModelProgress(0);
    setModelError('');
    setModelStatusText('Detectando capacidades do dispositivo...');
    // Increment key to force re-mount of the effect
    setMountKey((k) => k + 1);
  }, []);

  return (
    <ModelContext.Provider
      value={{
        llmProvider,
        modelStatus,
        modelProgress,
        modelStatusText,
        modelDevice,
        modelError,
        retryLoad,
        isModelReady,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

/**
 * Probes browser APIs to determine the device's hardware capabilities
 * and recommend the most appropriate provider strategy.
 */
function detectDeviceCapabilities(): DeviceCapabilities {
  let webgpu = false;
  try {
    webgpu =
      'gpu' in navigator &&
      typeof (navigator as unknown as { gpu?: { requestAdapter?: unknown } }).gpu
        ?.requestAdapter === 'function';
  } catch {
    /* browser may not expose navigator.gpu */
  }

  let memoryGB: number | null = null;
  try {
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    if (typeof mem === 'number') memoryGB = mem;
  } catch {
    /* deviceMemory not available in all browsers */
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const recommendedProvider: ProviderType =
    webgpu && memoryGB !== null && memoryGB >= 4 ? 'local' : 'cloud';

  return { webgpu, memoryGB, cores, recommendedProvider };
}
