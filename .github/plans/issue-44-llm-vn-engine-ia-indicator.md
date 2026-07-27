# Implementation Plan — Issue #44

**Issue:** [#44](https://github.com/zan-ia/zan-visual-novel/issues/44) — feat: connect LLM providers to VN Engine and add IA indicator in player UI
**Type:** feature
**Complexity:** high
**Date:** 2026-07-27
**Branch:** `feat/llm-vn-engine-ia-indicator`

## Summary

Connect real LLM providers (local WebLLM + cloud API) to the VN Engine, which currently has the wiring (`setLLMProvider`, `generateContinuation`, `generateLLMScene`) but uses a static no-op provider. The engine's `generateLLMScene()` must be refactored from synchronous placeholder creation to an async flow that calls `generateContinuation()`, builds a proper scene with the LLM response, and emits `llm:response`. A new `useLLM()` hook detects device capabilities and auto-selects the best provider. The player UI gains a loading state during generation with fade-in transition and a polished AI-content badge with tooltip.

## Files to Modify/Create

| File                                               | Action | Description                                                            |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `packages/vn-engine/src/providers/local-provider.ts` | CREATE | WebLLM/ONNX local provider implementing `ILLMProvider`                 |
| `packages/vn-engine/src/providers/cloud-provider.ts` | CREATE | Cloud API provider implementing `ILLMProvider` (calls backend `/llm`) |
| `packages/vn-engine/src/index.ts`                  | MODIFY | Export new provider factories + `createCompositeLLMProvider`          |
| `packages/vn-engine/src/engine.ts`                 | MODIFY | Refactor `generateLLMScene` to async; add `generateLLMSceneAsync`     |
| `packages/vn-engine/src/llm-provider.ts`           | MODIFY | Export `createCompositeLLMProvider` (already exists, verify export)   |
| `packages/vn-engine/src/engine.ts`                 | MODIFY | Wire `continue()` and `choose()` to use async LLM path when needed    |
| `packages/lib/src/hooks/use-vn-engine.ts`          | MODIFY | Add `isGeneratingLLM` state; make `continue/choose` async-aware       |
| `packages/lib/src/hooks/use-llm.ts`                | CREATE | Device detection + provider selection + engine injection hook         |
| `packages/lib/src/index.ts`                        | MODIFY | Export `useLLM` hook                                                  |
| `packages/ui/src/scene-renderer.tsx`               | MODIFY | Add Tooltip to IA badge; add `data-llm-generated` attribute           |
| `apps/client/src/styles/global.css`                | MODIFY | Add `.vn-scene--llm` tint, text fade-in animation                     |
| `apps/client/src/pages/player-page.tsx`            | MODIFY | Wire `useLLM()`; generation loading state + fade-in + Continue button |
| `apps/client/src/theme.ts`                         | MODIFY | (Optional) Add LLM-specific theme palette tokens                      |
| `packages/vn-engine/src/types.ts`                  | MODIFY | Add `ProviderType`, `DeviceCapabilities` types; add `llm:completed` event |
| `packages/shared/src/types/index.ts`               | MODIFY | Add `llm:completed` to `EngineEventType` union if needed             |
| `packages/vn-engine/src/__tests__/llm-scenes.test.ts` | CREATE | Unit tests: placeholder→completion, error path, `__llm_generate__` choice, `llmScenes` fallback |

## Patterns to Follow

- **VN Engine Public API**: Follow existing convention — pure TypeScript methods with clear return types. Public methods are synchronous getters; mutations stay private. New async methods follow `generateContinuation()` pattern (returns `Promise<LLMGenerateResponse | null>`).
- **Provider Interface**: Follow `ILLMProvider` Strategy pattern — each provider implements `generate()`, `isAvailable()`, `getModelType()`. Reference `createDefaultLLMProvider()` as template.
- **Composite Provider**: Already implemented as `createCompositeLLMProvider()` — Chain of Responsibility pattern. Reuse as-is, just create concrete providers to pass to it.
- **React Hooks**: Follow `useVNEngine()` pattern in `packages/lib/src/hooks/use-vn-engine.ts` — `useRef` for engine instance, `useState` for reactive state, `useCallback` for stable handlers.
- **CSS**: Follow BEM conventions from `global.css` — classes prefixed with `vn-`, modifiers with `--`. Reference `.vn-scene__llm-badge` as the existing AI indicator pattern.
- **MUI Components**: Follow existing patterns in `player-page.tsx` — `Box`, `CircularProgress`, `Skeleton`, `Tooltip`, `Chip`, `Button`. Use MUI `sx` prop for styling.
- **API Client**: Follow `ApiClient` pattern in `packages/lib/src/api-client.ts` — typed public method → private HTTP method.

## Implementation Order

### Step 1: LLM Provider Implementations

**New files:** `packages/vn-engine/src/providers/local-provider.ts`, `packages/vn-engine/src/providers/cloud-provider.ts`

#### 1a. Local WebLLM Provider (`local-provider.ts`)

Create a provider using WebLLM (ONNX Runtime Web or Transformers.js) that implements `ILLMProvider`:

```typescript
import type { ILLMProvider } from '../llm-provider.js';
import type { LLMGenerateRequest, LLMGenerateResponse, LLMModelType } from '@zan-vn/shared';

export interface LocalProviderConfig {
  modelType: LLMModelType;
  workerUrl?: string;
}

export function createLocalLLMProvider(config: LocalProviderConfig): ILLMProvider {
  let worker: Worker | null = null;
  let available = false;
  let initializing = false;

  // Detect WebGPU support
  function detectWebGPU(): boolean {
    try {
      return 'gpu' in navigator && typeof (navigator as any).gpu?.requestAdapter === 'function';
    } catch {
      return false;
    }
  }

  // Initialize WebLLM worker
  async function initWorker(): Promise<void> {
    if (initializing || available) return;
    initializing = true;
    try {
      // TODO: Replace with actual WebLLM worker initialization
      // worker = new Worker(config.workerUrl ?? '/workers/llm-worker.js');
      // await worker.postMessage({ type: 'init', model: config.modelType });
      available = true;
    } catch {
      available = false;
    } finally {
      initializing = false;
    }
  }

  return {
    /**
     * MAJOR FIX: Return graceful "Indisponível" result instead of throwing.
     * The composite provider will fall through to the next provider in the chain.
     */
    async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
      await initWorker();
      if (!available) {
        // Return typed unavailable result — composite provider skips to next
        throw new LocalProviderUnavailableError('Local LLM indisponível');
      }
      const startTime = Date.now();
      // TODO: Call worker for generation
      const duration = Date.now() - startTime;
      return {
        text: '[texto gerado localmente]',
        modelUsed: config.modelType,
        isLocal: true,
        tokensUsed: 0,
        duration,
      };
    },

    isAvailable(): boolean {
      return detectWebGPU() && available;
    },

    getModelType(): string {
      return config.modelType;
    },
  };
}
```

- Reference: `createDefaultLLMProvider()` for interface compliance
- WebGPU check follows browser API conventions
- Worker architecture follows Web Worker pattern (off-main-thread inference)
- Uses `LLMModelType` from shared types (`lfm-230m`, etc.)

#### 1b. Cloud API Provider (`cloud-provider.ts`)

Create a provider that calls the backend LLM endpoint. Depends on the `ApiClient` for HTTP calls:

```typescript
import type { ILLMProvider } from '../llm-provider.js';
import type { LLMGenerateRequest, LLMGenerateResponse } from '@zan-vn/shared';

export interface CloudProviderConfig {
  apiBaseUrl: string;
  accessToken?: string;
}

export function createCloudLLMProvider(config: CloudProviderConfig): ILLMProvider {
  return {
    async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
      const startTime = Date.now();
      const res = await fetch(`${config.apiBaseUrl}/api/v1/llm/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.accessToken ? { Authorization: `Bearer ${config.accessToken}` } : {}),
        },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`Cloud LLM failed: ${res.status}`);
      const data = await res.json();
      return {
        ...data,
        isLocal: false,
        duration: Date.now() - startTime,
      };
    },

    isAvailable(): boolean {
      return true; // Always available (will fail at generate time if down)
    },

    getModelType(): string {
      return 'cloud';
    },
  };
}
```

- Follows `fetch`-based API call pattern consistent with `ApiClient`
- `isAvailable()` returns `true` — cloud is always reachable (failures happen at `generate()` time)
- Auth via Bearer token from existing auth provider

### Step 2: Export Providers from Engine

**File:** `packages/vn-engine/src/index.ts`

Add exports for the new provider factories:

```typescript
export { createLocalLLMProvider } from './providers/local-provider.js';
export type { LocalProviderConfig } from './providers/local-provider.js';
export { createCloudLLMProvider } from './providers/cloud-provider.js';
export type { CloudProviderConfig } from './providers/cloud-provider.js';
```

Already exported (verify): `createCompositeLLMProvider`, `createDefaultLLMProvider`, `ILLMProvider`.

### Step 3: Add Engine Types

**File:** `packages/vn-engine/src/types.ts`

Add device capability types and provider types:

```typescript
export type ProviderType = 'local' | 'cloud' | 'composite' | 'none';

export interface DeviceCapabilities {
  webgpu: boolean;
  memoryGB: number | null;
  cores: number;
  recommendedProvider: ProviderType;
}
```

- Add `llm:completed` to `EngineEventType` if needed (currently `llm:requested` exists; `llm:response` exists but may not be emitted)
- `DeviceCapabilities` used by the `useLLM()` hook to select the best provider

### Step 4: Refactor Engine — Async LLM Scene Generation

**File:** `packages/vn-engine/src/engine.ts`

#### 4a. Refactor `generateLLMScene` → `generateLLMSceneAsync`

The current `generateLLMScene` creates a placeholder and returns synchronously. It needs to become async.

**⚠️ CRITICAL FIX:** The placeholder scene has ID `llm-${crypto.randomUUID()}` and is **never inserted** into any chapter's `scenes` array. `findScene()` only iterates `this.story.chapters[i].scenes[]`, so `getCurrentScene()` → `findScene(placeholder.id)` → `undefined` → throws `Scene not found`. The LLM-generated scene is therefore unreachable after generation.

**Solution:** Add a `private llmScenes: Map<string, Scene>` to the engine. `findScene()` falls back to this map. Never mutate `story.chapters` (treat story as immutable). The `generateLLMSceneAsync` uses the `_currentScene` parameter directly instead of calling `getCurrentScene()` redundantly.

```typescript
/**
 * Generate an LLM-authored scene asynchronously.
 *
 * Uses the `_currentScene` parameter (the scene the player was on when
 * generation was triggered) to build context. The placeholder has already
 * been created and stored in `llmScenes` by `generateLLMScenePlaceholder()`.
 *
 * On success, fills the placeholder content and emits `llm:completed`.
 * On failure, fills with error text and emits `error`.
 */
async generateLLMSceneAsync(_currentScene: Scene): Promise<Scene> {
  // Use the placeholder already stored in llmScenes (avoids redundant getCurrentScene())
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
    placeholder.content = [
      { type: 'narration', text: '[Falha ao gerar continuação. Tente novamente.]' },
    ];
    placeholder.metadata = { generatedByLLM: true, status: 'error', error: String(err) };
    const error = err instanceof Error ? err : new Error(String(err));
    this.emit('error', { error });
  }

  return placeholder;
}
```

#### 4b. Update `continue()` to use async path (with anti-recursion guard)

The `continue()` method currently calls `generateLLMScene()` (sync) when reaching end of branch. Update it:

**⚠️ MAJOR FIX:** Add a `wasGeneratedByLLM` check on the current scene's metadata to prevent unbounded recursive LLM generation. After the first LLM scene, `continue()` should NOT auto-trigger another generation — instead show a "Voltar à Biblioteca" or similar exit option. The UI layer should detect this state and render the exit button.

```typescript
continue(): Scene {
  const scene = this.getCurrentScene();
  if (scene.nextSceneId) {
    return this.navigateToScene(scene.nextSceneId);
  }

  // Guard: if this scene was already generated by LLM, don't generate again.
  // The UI should show a "Voltar à Biblioteca" exit instead.
  const metadata = scene.metadata as Record<string, unknown> | undefined;
  if (metadata?.generatedByLLM === true && metadata?.status === 'completed') {
    // Don't throw — let the caller detect this state via isLLMCompleted flag
    return scene;
  }

  // End of pre-defined branch — start async LLM generation
  if (this.config.enableLLM && this.llmProvider) {
    const placeholder = this.generateLLMScenePlaceholder(scene);
    this.emit('scene:enter', { sceneId: placeholder.id });
    this.generateLLMSceneAsync(scene).then((finalScene) => {
      this.emit('scene:enter', { sceneId: finalScene.id });
    });
    return placeholder;
  }
  throw new Error('End of story reached');
}
```

#### 4c. Add `generateLLMScenePlaceholder` (private helper) + `llmScenes` map

**⚠️ CRITICAL FIX:** The placeholder must be stored in a `private llmScenes: Map<string, Scene>` on the engine. `findScene()` must fall back to this map so `getCurrentScene()` works after generation. Do NOT mutate `story.chapters`.

```typescript
// New private field on VNEngine:
private llmScenes: Map<string, Scene> = new Map();

// Updated findScene with llmScenes fallback:
private findScene(sceneId: string): Scene | undefined {
  if (!this.story) return undefined;
  for (const chapter of this.story.chapters) {
    const scene = chapter.scenes?.find((s) => s.id === sceneId);
    if (scene) return scene;
  }
  // Fallback: check LLM-generated scenes (not part of story.chapters)
  return this.llmScenes.get(sceneId);
}

// Placeholder helper — stores in llmScenes:
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

  // Store so findScene() can locate it
  this.llmScenes.set(placeholder.id, placeholder);
  this.state.currentSceneId = placeholder.id;
  this.emit('llm:requested', { sceneId: placeholder.id });

  return placeholder;
}
```

#### 4d. Update `choose()` flow

When a choice has `targetSceneId === '__llm_generate__'`, the current `choose()` calls `this.generateLLMScene(scene)`. Update to use the async flow similarly.

### Step 5: `useLLM()` Hook — Device Detection + Provider Injection

**New file:** `apps/client/src/hooks/use-llm.ts`

```typescript
import { useEffect, useRef } from 'react';
import {
  createLocalLLMProvider,
  createCloudLLMProvider,
  createCompositeLLMProvider,
} from '@zan-vn/vn-engine';
import type { ILLMProvider } from '@zan-vn/vn-engine';
import type { DeviceCapabilities, ProviderType } from '@zan-vn/vn-engine';

interface UseLLMOptions {
  apiBaseUrl: string;
  accessToken?: string;
  onProviderReady?: (provider: ILLMProvider) => void;
}

/**
 * Detects device capabilities, selects the best LLM provider strategy,
 * creates a composite provider (local → cloud fallback), and returns it.
 *
 * Strategy:
 * - WebGPU + >4GB RAM → local primary, cloud fallback
 * - Otherwise → cloud only
 */
export function useLLM(options: UseLLMOptions): ILLMProvider | null {
  const providerRef = useRef<ILLMProvider | null>(null);
  // MAJOR FIX: Use useRef for callback to avoid re-creation in dep array
  const onProviderReadyRef = useRef(options.onProviderReady);
  onProviderReadyRef.current = options.onProviderReady;

  useEffect(() => {
    const caps = detectDeviceCapabilities();
    const providers: ILLMProvider[] = [];

    if (caps.recommendedProvider === 'local' || caps.webgpu) {
      providers.push(createLocalLLMProvider({ modelType: 'lfm-230m' }));
    }
    providers.push(
      createCloudLLMProvider({
        apiBaseUrl: options.apiBaseUrl,
        accessToken: options.accessToken,
      }),
    );

    const composite = createCompositeLLMProvider(providers);
    providerRef.current = composite;
    onProviderReadyRef.current?.(composite);
  }, []); // stable dep array — callback accessed via ref

  return providerRef.current;
}

function detectDeviceCapabilities(): DeviceCapabilities {
  let webgpu = false;
  try {
    webgpu = 'gpu' in navigator && typeof (navigator as any).gpu?.requestAdapter === 'function';
  } catch { /* ignore */ }

  let memoryGB: number | null = null;
  try {
    memoryGB = ((navigator as any).deviceMemory as number) ?? null;
  } catch { /* ignore */ }

  const cores = navigator.hardwareConcurrency ?? 4;
  const recommendedProvider: ProviderType =
    webgpu && memoryGB !== null && memoryGB >= 4 ? 'local' : 'cloud';

  return { webgpu, memoryGB, cores, recommendedProvider };
}
```

- Follows React hook patterns: `useRef` for stable reference, `useEffect` for initialization
- Uses browser APIs: `navigator.gpu`, `navigator.deviceMemory`, `navigator.hardwareConcurrency`
- Creates Composite provider once on mount

### Step 6: Update `useVNEngine` — LLM-Aware States

**File:** `packages/lib/src/hooks/use-vn-engine.ts`

Add `isGeneratingLLM` state and handle `llm:requested`/`llm:response`/`llm:completed` events:

```typescript
// New state
const [isGeneratingLLM, setIsGeneratingLLM] = useState(false);

// Subscribe to LLM events
useEffect(() => {
  const engine = engineRef.current;
  const unsubRequest = engine.on('llm:requested', () => {
    setIsGeneratingLLM(true);
    setIsLoading(false);
  });
  const unsubResponse = engine.on('llm:response', () => {
    setIsGeneratingLLM(false);
    updateScene();
  });
  const unsubError = engine.on('error', () => {
    setIsGeneratingLLM(false);
    updateScene();
  });
  return () => {
    unsubRequest();
    unsubResponse();
    unsubError();
  };
}, [updateScene]);

// Updated isLLMScene detection — also check metadata.status
const isLLMScene =
  (currentScene?.metadata as Record<string, unknown>)?.generatedByLLM === true;
const isLLMGenerating =
  (currentScene?.metadata as Record<string, unknown>)?.status === 'generating';

// Add to return
return {
  // ...existing...
  isGeneratingLLM: isGeneratingLLM || isLLMGenerating,
};
```

- `isGeneratingLLM` is `true` during generation (placeholder scene with `status: 'generating'`)
- `isLLMScene` already exists and works for completed LLM scenes

### Step 7: UI — Generation Loading State + Fade-In

**File:** `apps/client/src/pages/player-page.tsx`

#### 7a. Wire `useLLM()` in PlayerPage

```typescript
import { useLLM } from '@zan-vn/lib';
import { useMemo } from 'react';

// Inside PlayerPage component:
const { api } = useAuth();
// MINOR FIX: Wrap accessToken in useMemo to avoid reading localStorage every render
const accessToken = useMemo(() => api.getAccessToken(), [api]);

const llmProvider = useLLM({
  apiBaseUrl: import.meta.env.VITE_API_URL ?? '',
  accessToken,
});

// Inject provider into engine on mount
const { setLLMProvider, isGeneratingLLM } = useVNEngine();

useEffect(() => {
  if (llmProvider) {
    setLLMProvider(llmProvider);
  }
}, [llmProvider, setLLMProvider]);
```

#### 7b. Generation Loading UI

Replace the current `isLoading` section with LLM-aware rendering:

```tsx
{/* Generation loading state */}
{isGeneratingLLM ? (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress size={48} sx={{ color: 'var(--color-secondary)' }} />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography variant="caption" sx={{ color: 'var(--color-secondary)', fontSize: '0.65rem' }}>
          IA
        </Typography>
      </Box>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ animation: 'vn-pulse 1.5s ease-in-out infinite' }}>
      Gerando continuação com IA...
    </Typography>
  </Box>
) : /* existing choice/continue/ending UI */}
```

#### 7c. Fade-In Animation

**File:** `apps/client/src/styles/global.css`

Add CSS keyframes and class:

```css
/* ── LLM Generation Transitions ────────────────────────── */

@keyframes vn-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes vn-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.vn-scene--llm .vn-text {
  animation: vn-fade-in-up 0.5s ease-out;
  animation-fill-mode: both; /* MINOR FIX: prevent flash before animation starts */
}

.vn-scene--llm .vn-text:nth-child(1) { animation-delay: 0.1s; }
.vn-scene--llm .vn-text:nth-child(2) { animation-delay: 0.2s; }
.vn-scene--llm .vn-text:nth-child(3) { animation-delay: 0.3s; }

/* Subtle LLM scene tint */
.vn-scene--llm {
  box-shadow: inset 0 0 60px rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.08);
}
```

#### 7d. Post-LLM Exit Button

**MAJOR FIX:** After an LLM-generated scene completes, `continue()` returns the same scene without triggering another generation (guarded by `wasGeneratedByLLM`). The UI must detect this and show a "Voltar à Biblioteca" exit button instead of a "Continuar" button:

```tsx
{/* LLM-generated scene completed — show exit, not another continuation */}
{isLLMScene && !isGeneratingLLM && availableChoices.length === 0 && (
  <Button
    variant="outlined"
    onClick={() => navigate('/library')}
    fullWidth
    sx={{
      py: 1.5,
      fontSize: '1.1rem',
      borderRadius: 3,
      borderColor: 'var(--color-secondary)',
      color: 'var(--color-secondary)',
      animation: 'vn-fade-in-up 0.5s ease-out',
      '&:hover': {
        borderColor: 'var(--color-primary)',
        color: 'var(--color-primary)',
      },
    }}
  >
    Voltar à Biblioteca
  </Button>
)}
```

### Step 8: AI Content Indicator — Polish

**File:** `packages/ui/src/scene-renderer.tsx`

The existing badge already renders. Add a MUI Tooltip and a data attribute:

```tsx
{/* MINOR FIX: Use MUI Tooltip instead of HTML title attribute */}
{isLLMGenerated && (
  <Tooltip title="Este conteúdo foi gerado por Inteligência Artificial" arrow placement="top">
    <div
      className="vn-scene__llm-badge"
      aria-label="Conteúdo gerado por IA"
      data-llm-generated="true"
    >
      ✦ IA
    </div>
  </Tooltip>
)}
```

Also add `data-llm-generated` to the scene wrapper when `isLLMGenerated`:

```tsx
<div
  className={`vn-scene ${isLLMGenerated ? 'vn-scene--llm' : ''} ${className ?? ''}`}
  data-scene-type={scene.type}
  data-llm-generated={isLLMGenerated ? 'true' : undefined}
>
```

**File:** `apps/client/src/pages/player-page.tsx`

The existing Chip "IA" in the top bar location already works. Add a Tooltip to it:

```tsx
{isLLMScene && (
  <Tooltip title="Este conteúdo foi gerado por IA" arrow>
    <Chip label="IA" size="small" color="secondary" variant="outlined" sx={{ mr: 1 }} />
  </Tooltip>
)}
```

### Step 9: Build Verification

Run the full project build to catch any type errors or import issues early:

```bash
cd packages/shared && npm run typecheck
cd packages/vn-engine && npm run typecheck && npm test
cd packages/lib && npm run typecheck
cd packages/ui && npm run typecheck
cd apps/client && npm run build
```

Alternatively, run the Turborepo-level build: `npm run build` from root.

## Identified Risks

| Risk                                                    | Impact | Mitigation                                                                          |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| WebLLM worker not yet implemented (#41, #42)            | High   | Scaffold worker with TODO comments; cloud provider works independently as fallback   |
| Async scene replacement may cause UI flicker            | Medium | Placeholder scene shown immediately; CSS fade-in smooths content update              |
| `navigator.gpu` / `navigator.deviceMemory` not in TS lib| Low    | Use `(navigator as any)` casts; add type declarations if needed                     |
| Engine `continue()` fire-and-forget may miss errors     | Medium | Emit `error` event on failure; hook listens and updates UI accordingly              |
| Composite provider fallback to cloud on every call      | Low    | Cache `isAvailable()` result per-session with TTL; fine for initial implementation   |
- Placeholder scene ID collision with saved scenes        | Low    | Use `llm-` prefix + `crypto.randomUUID()` for guaranteed uniqueness                 |

---

## Reviewer Feedback Amendments

Review identified **1 CRITICAL**, **4 MAJOR**, and **4 MINOR** issues. The plan steps above have been updated inline. This section summarizes all amendments for traceability.

### 🔴 CRITICAL: LLM-generated scenes unreachable after generation

**Root cause:** `findScene()` only iterates `this.story.chapters[i].scenes[]`. The placeholder created in `generateLLMScenePlaceholder` has ID `llm-${crypto.randomUUID()}` and is **never inserted** into any chapter's `scenes` array. `getCurrentScene()` → `findScene(placeholder.id)` → `undefined` → throws `Scene not found`.

**Resolution (amended in Step 4c):**
- Add `private llmScenes: Map<string, Scene>` to `VNEngine`
- `findScene()` falls back to `this.llmScenes.get(sceneId)` after checking chapters
- `generateLLMScenePlaceholder()` stores the placeholder via `this.llmScenes.set(placeholder.id, placeholder)`
- **Never mutate `story.chapters`** — treat story data as immutable

### 🟠 MAJOR #1: Use `_currentScene` parameter directly

**Resolution (amended in Step 4a):** `generateLLMSceneAsync` now retrieves the placeholder from `this.llmScenes.get(this.state.currentSceneId)` instead of calling the redundant `getCurrentScene()`. The `_currentScene` parameter is preserved for context building.

### 🟠 MAJOR #2: Emit `llm:completed` event

**Resolution (amended in Steps 4a, 3):** After successful generation and `llm:response` emission, also emit `llm:completed` with `{ sceneId }`. Added to `EngineEventType` union in `types.ts`.

### 🟠 MAJOR #3: Add unit tests

**Resolution (new Step 10 below):** Create `packages/vn-engine/src/__tests__/llm-scenes.test.ts` covering:
- Placeholder → completion lifecycle
- Error path (provider throws → error text + `error` event)
- `__llm_generate__` choice target triggers generation
- `findScene()` fallback to `llmScenes`
- `wasGeneratedByLLM` guard prevents recursive generation

### 🟠 MAJOR #4: Prevent unbounded recursive LLM generation

**Resolution (amended in Step 4b):** `continue()` checks `scene.metadata.generatedByLLM === true && scene.metadata.status === 'completed'`. If the current scene was already LLM-generated, `continue()` returns the same scene without triggering another generation. The UI layer should detect this and show a "Voltar à Biblioteca" exit button via a new `isLLMCompleted` flag exposed from `useVNEngine()`.

### 🟠 MAJOR #5: Local provider graceful "Indisponível"

**Resolution (amended in Step 1a):** Instead of throwing a generic `Error`, the local provider throws a typed `LocalProviderUnavailableError`. The composite provider (Chain of Responsibility) catches this and falls through to the cloud provider. The UI should display "Indisponível" status for local-only failure cases.

### 🟡 MINOR #1: MUI Tooltip on IA badge

**Resolution (amended in Step 8):** Wrap the `vn-scene__llm-badge` `<div>` in a MUI `<Tooltip>` component instead of using the HTML `title` attribute. Import `Tooltip` from `@mui/material`.

### 🟡 MINOR #2: `animation-fill-mode: both` on LLM text

**Resolution (amended in Step 7c):** Added `animation-fill-mode: both;` to `.vn-scene--llm .vn-text` to prevent content flash before the animation starts.

### 🟡 MINOR #3: `useMemo` for `accessToken`

**Resolution (amended in Step 7a):** Wrapped `api.getAccessToken()` in `useMemo(() => api.getAccessToken(), [api])` to avoid reading `localStorage` on every render.

### 🟡 MINOR #4: `useRef` for `onProviderReady` callback

**Resolution (amended in Step 5):** Used a `useRef` for the `onProviderReady` callback. The ref's `.current` is updated on every render but the `useEffect` dep array remains stable (`[]`), preventing unnecessary provider re-creation.

---

### Step 10: Unit Tests (NEW)

**New file:** `packages/vn-engine/src/__tests__/llm-scenes.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VNEngine } from '../engine.js';
import type { StoryData, Scene, Choice, LLMGenerateResponse } from '@zan-vn/shared';
import type { ILLMProvider } from '../llm-provider.js';

function makeMockProvider(response?: LLMGenerateResponse): ILLMProvider {
  return {
    generate: vi.fn().mockResolvedValue(
      response ?? {
        text: 'Cena gerada por IA.',
        modelUsed: 'test-model',
        isLocal: false,
        tokensUsed: 42,
        duration: 100,
      },
    ),
    isAvailable: () => true,
    getModelType: () => 'test-model',
  };
}

function makeMockStory(): StoryData {
  return {
    id: 'story-1',
    title: 'Test Story',
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1',
        orderIndex: 0,
        startSceneId: 'scene-1',
        scenes: [
          {
            id: 'scene-1',
            chapterId: 'ch-1',
            title: 'Cena 1',
            type: 'narration',
            content: [{ type: 'narration', text: 'Era uma vez...' }],
            nextSceneId: null, // end of branch → triggers LLM
            choices: [
              {
                id: 'choice-llm',
                text: 'Continuar com IA',
                targetSceneId: '__llm_generate__',
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    ],
  };
}

describe('LLM Scene Generation', () => {
  let engine: VNEngine;
  let provider: ILLMProvider;

  beforeEach(() => {
    provider = makeMockProvider();
    engine = new VNEngine({ enableLLM: true });
    engine.setLLMProvider(provider);
  });

  describe('findScene fallback to llmScenes', () => {
    it('finds scenes from story.chapters', () => {
      engine.start(makeMockStory());
      const scene = engine.getCurrentScene();
      expect(scene.id).toBe('scene-1');
    });

    it('finds LLM-generated scenes via llmScenes fallback', () => {
      engine.start(makeMockStory());
      const placeholder = engine.continue(); // triggers generation, returns placeholder
      // Placeholder should be findable even though it's not in any chapter
      expect(placeholder.id).toMatch(/^llm-/);
      const found = engine.getCurrentScene(); // should not throw
      expect(found.id).toBe(placeholder.id);
    });
  });

  describe('placeholder → completion lifecycle', () => {
    it('creates placeholder with generating status on continue()', () => {
      engine.start(makeMockStory());
      const scene = engine.continue();
      expect(scene.content[0].text).toBe('[...]');
      expect((scene.metadata as any).generatedByLLM).toBe(true);
      expect((scene.metadata as any).status).toBe('generating');
    });

    it('fills placeholder content after async generation completes', async () => {
      engine.start(makeMockStory());
      // continue() returns placeholder and kicks off async generation
      const placeholder = engine.continue();
      // Wait for the async generation to settle
      await vi.waitFor(() => {
        const scene = engine.getCurrentScene();
        return (scene.metadata as any).status === 'completed';
      });
      const scene = engine.getCurrentScene();
      expect(scene.content[0].text).toBe('Cena gerada por IA.');
      expect((scene.metadata as any).status).toBe('completed');
    });

    it('emits llm:requested → llm:response → llm:completed events', async () => {
      const events: string[] = [];
      engine.start(makeMockStory());
      engine.on('llm:requested', () => events.push('requested'));
      engine.on('llm:response', () => events.push('response'));
      engine.on('llm:completed', () => events.push('completed'));
      engine.continue();
      await vi.waitFor(() => events.includes('completed'));
      expect(events).toEqual(['requested', 'response', 'completed']);
    });
  });

  describe('error path', () => {
    it('fills scene with error text on provider failure', async () => {
      const failingProvider: ILLMProvider = {
        generate: vi.fn().mockRejectedValue(new Error('API down')),
        isAvailable: () => true,
        getModelType: () => 'test',
      };
      engine.setLLMProvider(failingProvider);
      engine.start(makeMockStory());
      const placeholder = engine.continue();
      await vi.waitFor(() => {
        const s = engine.getCurrentScene();
        return (s.metadata as any).status === 'error';
      });
      const scene = engine.getCurrentScene();
      expect(scene.content[0].text).toContain('Falha ao gerar');
      expect((scene.metadata as any).status).toBe('error');
    });

    it('emits error event on provider failure', async () => {
      const failingProvider: ILLMProvider = {
        generate: vi.fn().mockRejectedValue(new Error('timeout')),
        isAvailable: () => true,
        getModelType: () => 'test',
      };
      engine.setLLMProvider(failingProvider);
      engine.start(makeMockStory());
      const onError = vi.fn();
      engine.on('error', onError);
      engine.continue();
      await vi.waitFor(() => onError.mock.calls.length > 0);
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('__llm_generate__ choice target', () => {
    it('triggers LLM generation when choice target is __llm_generate__', () => {
      engine.start(makeMockStory());
      const placeholder = engine.choose('choice-llm');
      expect(placeholder.id).toMatch(/^llm-/);
      // Engine should point to the LLM placeholder
      expect(engine.getCurrentScene().id).toBe(placeholder.id);
    });
  });

  describe('wasGeneratedByLLM guard', () => {
    it('prevents recursive LLM generation on subsequent continue()', async () => {
      engine.start(makeMockStory());
      engine.continue(); // first LLM generation
      await vi.waitFor(() => {
        const s = engine.getCurrentScene();
        return (s.metadata as any).status === 'completed';
      });
      // Second continue() should NOT trigger another generation
      const sameScene = engine.continue();
      expect(sameScene.id).toBe(engine.getCurrentScene().id);
      // Provider should have been called exactly once
      expect(provider.generate).toHaveBeenCalledTimes(1);
    });
  });
});
```

---

## Post-Implementation Verification

- [ ] `npm run build` (Turborepo) passes without errors
- [ ] `npm test` in `packages/vn-engine` passes (existing + new `llm-scenes.test.ts`)
- [ ] `npm run lint` across all modified packages passes
- [ ] Cloud provider returns real text from backend `/api/v1/llm/generate`
- [ ] Local provider shows "Indisponível" gracefully when WebGPU absent (no throw)
- [ ] Player shows "Gerando continuação com IA..." spinner during generation
- [ ] AI-generated scenes show `✦ IA` badge with MUI Tooltip (not HTML `title`)
- [ ] AI-generated scenes have `vn-scene--llm` tinted border with `animation-fill-mode: both`
- [ ] Text fades in smoothly after generation completes (no flash)
- [ ] "Voltar à Biblioteca" exit appears after LLM-generated scene (not another generation)
- [ ] Top bar Chip "IA" has tooltip
- [ ] `accessToken` wrapped in `useMemo` — no localStorage read on every render
- [ ] `useLLM` effect runs once with stable dep array (`useRef` for callback)
- [ ] `llm:completed` event emitted after successful generation
- [ ] Changes consistent with existing patterns (MUI v6, BEM CSS, hook conventions)
