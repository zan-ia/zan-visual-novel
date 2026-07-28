import { useEffect, useState, useRef } from 'react';
import {
  createLocalLLMProvider,
  createDefaultLFMWorker,
  createCloudLLMProvider,
  createCompositeLLMProvider,
} from '@zan-vn/vn-engine';
import type { ILLMProvider, DeviceCapabilities, ProviderType } from '@zan-vn/vn-engine';

/** Options for the `useLLM` hook. */
export interface UseLLMOptions {
  /** Base URL of the Zan API (e.g. 'http://localhost:3001'). */
  apiBaseUrl: string;
  /** Optional JWT access token for authenticated cloud requests. */
  accessToken?: string;
  /** Callback invoked once the composite provider is ready. */
  onProviderReady?: (provider: ILLMProvider) => void;
}

/**
 * Detects device capabilities, selects the best LLM provider strategy,
 * creates a composite provider (local → cloud fallback), and returns it.
 *
 * Strategy:
 * - WebGPU + ≥ 4 GB RAM → local primary, cloud fallback
 * - Otherwise → cloud only
 *
 * Design: React hook (custom) — encapsulates device detection and
 * provider factory logic, exposing a stable `ILLMProvider` reference
 * via `useState` so consumers re-render when the provider is ready.
 *
 * @param options Configuration for the providers.
 * @returns A composite `ILLMProvider` instance, or `null` before mount.
 */
export function useLLM(options: UseLLMOptions): ILLMProvider | null {
  const [provider, setProvider] = useState<ILLMProvider | null>(null);
  // Use ref for callback to keep effect's dependency array stable
  const onProviderReadyRef = useRef(options.onProviderReady);
  onProviderReadyRef.current = options.onProviderReady;

  useEffect(() => {
    const caps = detectDeviceCapabilities();
    const providers: ILLMProvider[] = [];

    if (caps.recommendedProvider === 'local' || caps.webgpu) {
      providers.push(createLocalLLMProvider({
        modelType: 'lfm-230m',
        workerFactory: createDefaultLFMWorker,
      }));
    }

    providers.push(
      createCloudLLMProvider({
        apiBaseUrl: options.apiBaseUrl,
        accessToken: options.accessToken,
      }),
    );

    const composite = createCompositeLLMProvider(providers);
    setProvider(composite);
    onProviderReadyRef.current?.(composite);
  }, [options.apiBaseUrl, options.accessToken]);

  return provider;
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
    memoryGB = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null;
  } catch {
    /* browser may not expose navigator.deviceMemory */
  }

  const cores = navigator.hardwareConcurrency ?? 4;

  const recommendedProvider: ProviderType =
    webgpu && memoryGB !== null && memoryGB >= 4 ? 'local' : 'cloud';

  return { webgpu, memoryGB, cores, recommendedProvider };
}
