# Implementation Plan — Issue #9

**Issue:** [#9](https://github.com/zan-ia/zan-visual-novel/issues/9) — feat: Persistir capítulos, cenas e escolhas — API + conectar editor do dashboard
**Type:** feature
**Complexity:** high
**Date:** 2026-07-25
**Branch:** `feat/chapter-scene-persistence`

## Summary

The dashboard editor currently creates chapters, scenes, text blocks, and choices only in local React state with temporary IDs (`ch-${Date.now()}`). Reloading the page loses all data. This plan adds the missing POST/PUT/DELETE API endpoints for chapters, scenes, and choices in `vn.routes.ts`, exposes them in the `ApiClient`, updates the Zod schemas with partial-update variants, and refactors the editor to persist all mutations to the database. Also fixes the disabled Preview tab and adds a scene save action.

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `packages/shared/src/schemas/index.ts` | MODIFY | Add `updateChapterSchema`, `updateSceneSchema` Zod schemas for PUT endpoints |
| `backend/api/src/routes/vn.routes.ts` | MODIFY | Add 8 new endpoints: POST/PUT/DELETE chapters, POST/PUT/DELETE scenes, POST/DELETE choices |
| `packages/lib/src/api-client.ts` | MODIFY | Add 8 public methods: `createChapter`, `updateChapter`, `deleteChapter`, `createScene`, `updateScene`, `deleteScene`, `createChoice`, `deleteChoice` |
| `apps/dashboard/src/pages/vn-editor-page.tsx` | MODIFY | Refactor all handlers to call API, add scene save, fix tab disabled logic, enable Preview |

## Patterns to Follow

- **API Routes**: Exact match of existing pattern in `vn.routes.ts` lines 200-268 (PATCH `/vns/:id`):
  - `uuidSchema.parse(req.params.id)` for validation
  - `getDb().select().from(table).where(eq(...)).limit(1)` for existence checks
  - `vn.creatorId !== req.user!.userId` → 403 FORBIDDEN
  - `try { ... } catch (err: any) { if (err.name === 'ZodError') { ... } res.status(500) ... }`
  - Consistent response shape: `{ success: true, data }` / `{ success: false, error: { statusCode, message, code } }`
  - Use `.returning()` on INSERT to get back the created row
- **DELETE cascade**: Since foreign keys use `onDelete: 'cascade'` in the DB schema, deleting a chapter automatically cascades to scenes → choices → conditions/effects. **No manual cascade needed.**
- **ApiClient**: Follow existing method structure — public typed method delegates to private HTTP method (`get`, `post`, `put`, `del`). `patch` already exists. Consistent `Promise<ApiResponse<T>>` return type. Private `del()` already exists (line ~175).
- **Zod schemas**: Follow existing `createVNSchema` / `updateVNSchema` pattern — `create.partial().extend({ ... })` for PUT schemas
- **MUI v6**: Follow existing patterns in `vn-editor-page.tsx` — `Box`, `TextField`, `Button`, `Paper`, `Tabs`, `Dialog`, `Snackbar`, etc.
- **React state**: Continue with `useState` + `useEffect` + `useCallback`. Use `setLoading(true)` around async API calls.

## Implementation Order

### Step 1: Shared Package — Add Partial-Update Schemas

**File:** `packages/shared/src/schemas/index.ts`

Add after the existing `createChapterSchema`, `createSceneSchema`, `createChoiceSchema` block (after line ~92):

```typescript
// ── Update Schemas (PUT) ────────────────────────────────

export const updateChapterSchema = createChapterSchema.partial().extend({
  status: chapterStatusSchema.optional(),
  startSceneId: z.string().uuid().nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateSceneSchema = createSceneSchema.partial().extend({
  metadata: z.record(z.unknown()).nullable().optional(),
});
```

And add the type exports:

```typescript
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>;
```

**Note:** `createSceneSchema` already requires `content: z.array(textBlockSchema).min(1)`. For partial updates (`updateSceneSchema`), since it's `.partial()`, `content` becomes optional — which is correct for a PUT that updates only changed fields.

### Step 2: API Routes — Chapter CRUD Endpoints

**File:** `backend/api/src/routes/vn.routes.ts`

Add 3 new endpoints after the PATCH `/vns/:id` route (after line ~268). Follow the exact error-handling and ownership-check pattern from the PATCH route.

#### 2a. POST `/vns/:vnId/chapters` — Create Chapter

```typescript
vnRouter.post('/:vnId/chapters', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const data = createChapterSchema.parse(req.body);
    const [chapter] = await getDb()
      .insert(schema.chapters)
      .values({
        vnId,
        title: data.title,
        priceCredits: data.priceCredits,
        orderIndex: await getChapterCount(vnId),
      })
      .returning();

    res.status(201).json({ success: true, data: chapter });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});
```

**Import needed:** `import { createChapterSchema, updateChapterSchema } from '@zan-vn/shared';` at top of file (add to the existing import from `@zan-vn/shared`).

**Helper function** (add before the router, or inline):

```typescript
async function getChapterCount(vnId: string): Promise<number> {
  const [result] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.chapters)
    .where(eq(schema.chapters.vnId, vnId));
  return result?.count ?? 0;
}
```

#### 2b. PUT `/vns/:vnId/chapters/:chapterId` — Update Chapter

```typescript
vnRouter.put('/:vnId/chapters/:chapterId', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);
    const data = updateChapterSchema.parse(req.body);

    // Ownership check via VN
    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const [existing] = await getDb()
      .select()
      .from(schema.chapters)
      .where(and(eq(schema.chapters.id, chapterId), eq(schema.chapters.vnId, vnId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Capítulo não encontrado', code: 'NOT_FOUND' } });
      return;
    }

    await getDb()
      .update(schema.chapters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.chapters.id, chapterId));

    res.json({ success: true, data: { ...existing, ...data, updatedAt: new Date().toISOString() } });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});
```

#### 2c. DELETE `/vns/:vnId/chapters/:chapterId` — Delete Chapter (Cascade)

```typescript
vnRouter.delete('/:vnId/chapters/:chapterId', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);

    // Ownership check via VN
    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const [existing] = await getDb()
      .select()
      .from(schema.chapters)
      .where(and(eq(schema.chapters.id, chapterId), eq(schema.chapters.vnId, vnId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Capítulo não encontrado', code: 'NOT_FOUND' } });
      return;
    }

    // FK onDelete: 'cascade' handles scenes → choices → conditions/effects
    await getDb().delete(schema.chapters).where(eq(schema.chapters.id, chapterId));

    res.json({ success: true, data: { deleted: true } });
  } catch {
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});
```

### Step 3: API Routes — Scene CRUD Endpoints

**File:** `backend/api/src/routes/vn.routes.ts`

Add 3 new endpoints. **Import:** add `createSceneSchema, updateSceneSchema` to the shared import.

#### 3a. POST `/vns/:vnId/chapters/:chapterId/scenes` — Create Scene

Ownership verified by looking up the VN via chapterId → chapters.vnId. Same try/catch/ZodError pattern.

Key details:
- Validate `createSceneSchema.parse(req.body)` — includes `content: TextBlock[]` min 1
- Insert with `.returning()` to get the DB-generated UUID

#### 3b. PUT `/vns/:vnId/chapters/:chapterId/scenes/:sceneId` — Update Scene

- Validate `updateSceneSchema.parse(req.body)`
- Check scene exists before updating
- Fields updatable: `title`, `type`, `content`, `nextSceneId`, `metadata`

#### 3c. DELETE `/vns/:vnId/chapters/:chapterId/scenes/:sceneId` — Delete Scene

- Cascade via FK handles choices → conditions/effects
- Return `{ deleted: true }`

### Step 4: API Routes — Choice Endpoints

**File:** `backend/api/src/routes/vn.routes.ts`

Add 2 endpoints. **Import:** add `createChoiceSchema` to the shared import.

#### 4a. POST `/vns/:vnId/chapters/:chapterId/scenes/:sceneId/choices` — Create Choice

- Validate `createChoiceSchema.parse(req.body)`
- Insert choice with `.returning()`
- Optional: if `conditions` or `effects` are included in body, insert them separately (note: `createChoiceSchema` does NOT include conditions/effects currently — they'd need to be extra fields or separate calls)

#### 4b. DELETE `/vns/:vnId/chapters/:chapterId/scenes/:sceneId/choices/:choiceId` — Delete Choice

- Cascade via FK handles conditions/effects
- Return `{ deleted: true }`

### Step 5: ApiClient — Add Chapter/Scene/Choice Methods

**File:** `packages/lib/src/api-client.ts`

Add 8 new public methods. The `del()` private method already exists. Need `put()` — which already exists. All infrastructure is in place.

**Add after `updateVN` (`line ~65`):**

```typescript
// ── Chapters ───────────────────────────────────────────

async createChapter(vnId: string, data: unknown): Promise<ApiResponse<unknown>> {
  return this.post(`/vns/${vnId}/chapters`, data);
}

async updateChapter(vnId: string, chapterId: string, data: unknown): Promise<ApiResponse<unknown>> {
  return this.put(`/vns/${vnId}/chapters/${chapterId}`, data);
}

async deleteChapter(vnId: string, chapterId: string): Promise<ApiResponse<unknown>> {
  return this.del(`/vns/${vnId}/chapters/${chapterId}`);
}

// ── Scenes ─────────────────────────────────────────────

async createScene(vnId: string, chapterId: string, data: unknown): Promise<ApiResponse<unknown>> {
  return this.post(`/vns/${vnId}/chapters/${chapterId}/scenes`, data);
}

async updateScene(vnId: string, chapterId: string, sceneId: string, data: unknown): Promise<ApiResponse<unknown>> {
  return this.put(`/vns/${vnId}/chapters/${chapterId}/scenes/${sceneId}`, data);
}

async deleteScene(vnId: string, chapterId: string, sceneId: string): Promise<ApiResponse<unknown>> {
  return this.del(`/vns/${vnId}/chapters/${chapterId}/scenes/${sceneId}`);
}

// ── Choices ─────────────────────────────────────────────

async createChoice(vnId: string, chapterId: string, sceneId: string, data: unknown): Promise<ApiResponse<unknown>> {
  return this.post(`/vns/${vnId}/chapters/${chapterId}/scenes/${sceneId}/choices`, data);
}

async deleteChoice(vnId: string, chapterId: string, sceneId: string, choiceId: string): Promise<ApiResponse<unknown>> {
  return this.del(`/vns/${vnId}/chapters/${chapterId}/scenes/${sceneId}/choices/${choiceId}`);
}
```

### Step 6: Dashboard Editor — Connect to API

**File:** `apps/dashboard/src/pages/vn-editor-page.tsx`

This is the largest change. The editor currently manages all state locally. We need to:

#### 6a. Refactor `handleAddChapter` (lines ~150-168)

Replace local state mutation with API call:

```typescript
const handleAddChapter = async () => {
  if (!chapterTitle.trim() || !vnId) return;
  setLoading(true);
  try {
    const res = await api.createChapter(vnId, { title: chapterTitle, priceCredits: 0 });
    if (res.success && res.data) {
      setChapters([...chapters, res.data as Chapter]);
      setSelectedChapterId((res.data as Chapter).id);
      setChapterDialogOpen(false);
      setChapterTitle('');
      setToast('Capítulo criado!');
    }
  } catch {
    setToast('Erro ao criar capítulo');
  } finally {
    setLoading(false);
  }
};
```

#### 6b. Add `handleDeleteChapter` that calls API

Currently just filters state. Replace with:

```typescript
const handleDeleteChapter = async (id: string) => {
  if (!vnId) return;
  setLoading(true);
  try {
    const res = await api.deleteChapter(vnId, id);
    if (res.success) {
      setChapters(chapters.filter((c) => c.id !== id));
      if (selectedChapterId === id) {
        setSelectedChapterId(null);
        setScenes([]);
      }
      setToast('Capítulo removido');
    }
  } catch {
    setToast('Erro ao remover capítulo');
  } finally {
    setLoading(false);
  }
};
```

#### 6c. Refactor `handleAddScene` (lines ~175-192)

Replace local state mutation with API call. Initial scene needs at least 1 text block (`min(1)` on `createSceneSchema`), so create with a placeholder:

```typescript
const handleAddScene = async () => {
  if (!selectedChapterId || !vnId) return;
  setLoading(true);
  try {
    const res = await api.createScene(vnId, selectedChapterId, {
      title: `Cena ${scenes.length + 1}`,
      type: 'narration',
      content: [{ type: 'narration', text: 'Nova cena...', style: 'normal' }],
    });
    if (res.success && res.data) {
      const updated = [...scenes, res.data as Scene];
      setScenes(updated);
      setSelectedSceneId((res.data as Scene).id);
      setToast('Cena criada!');
    }
  } catch {
    setToast('Erro ao criar cena');
  } finally {
    setLoading(false);
  }
};
```

#### 6d. Add `handleSaveScene` — PUT scene with current content

New function that saves the current scene's text blocks, type, title, and nextSceneId:

```typescript
const handleSaveScene = async () => {
  if (!selectedSceneId || !selectedChapterId || !vnId) return;
  setLoading(true);
  try {
    await api.updateScene(vnId, selectedChapterId, selectedSceneId, {
      title: sceneTitle,
      type: sceneType,
      content: sceneContent,
    });
    setToast('Cena salva!');
  } catch {
    setToast('Erro ao salvar cena');
  } finally {
    setLoading(false);
  }
};
```

Add a "Salvar Cena" button in the scene editor UI (inside the first Paper of the scenes editor, next to the title/type fields).

#### 6e. Add auto-save on text block changes

After `handleAddTextBlock` and `handleRemoveTextBlock`, call `handleSaveScene()` to persist. Alternatively, add a debounced auto-save using `useEffect` + `useRef` on `sceneContent` changes. For simplicity, call `handleSaveScene` explicitly after each block mutation. Consider using `onBlur` on the text field for a better UX.

#### 6f. Refactor `handleAddChoice` (lines ~220-230)

Replace with API call:

```typescript
const handleAddChoice = async () => {
  if (!newChoiceText.trim() || !selectedSceneId || !selectedChapterId || !vnId) return;
  setLoading(true);
  try {
    const res = await api.createChoice(vnId, selectedChapterId, selectedSceneId, {
      text: newChoiceText,
      targetSceneId: newChoiceTarget || selectedSceneId,
      orderIndex: choices.length,
    });
    if (res.success && res.data) {
      setChoices([...choices, res.data as Choice]);
      setNewChoiceText('');
      setNewChoiceTarget('');
      setToast('Escolha adicionada!');
    }
  } catch {
    setToast('Erro ao adicionar escolha');
  } finally {
    setLoading(false);
  }
};
```

Also add `handleDeleteChoice` that calls `api.deleteChoice`.

#### 6g. Update the "loaded from API" effect to pull scene data from chapter objects

The existing code at lines 86-94 loads chapters and scenes from the `getVN` response. The API GET `/vns/:id` returns `chapters` with nested `scenes` containing `choices`. The current effect correctly extracts them. **No change needed** — the parent chapter objects are already being read.

However, when a scene is created via API, it's added to local `scenes` state. After reload, the full tree is re-fetched. To keep local state in sync without full reload, we can optionally re-fetch the VN after mutations, or simply merge the API response into local state.

### Step 7: Preview Tab — Fix and Enable

**File:** `apps/dashboard/src/pages/vn-editor-page.tsx`

#### 7a. Fix disabled logic (line ~245)

Currently:
```tsx
<Tab label="Cenas" value="scenes" disabled={!selectedChapterId} />
<Tab label="Preview" value="preview" disabled={!selectedSceneId} />
```

The Preview tab's disabled state is `!selectedSceneId`, so it only enables when a scene is selected. This is correct behavior. The issue says "mesmo selecionada fica disabled" — this may be because `selectedSceneId` isn't being set properly or the scene's content array is null. Verify by checking:
- The `selectedSceneId` is set when clicking a scene in the list (line ~370)
- The `selectedScene` is correctly resolved from `scenes` array

If the bug persists, add a fallback: `disabled={!selectedSceneId || scenes.length === 0}`.

#### 7b. Enhance Preview content (lines ~530-580)

The current Preview renders scene content inline. Add a "Open in Player" button that opens the player in a new tab:

```tsx
<Button
  variant="contained"
  startIcon={<PlayArrowIcon />}
  onClick={() => window.open(`/play/${vnId}`, '_blank')}
  sx={{ mb: 2 }}
>
  Abrir no Player
</Button>
```

This requires the player route (`/play/:vnId`) to exist in the client app (`apps/client`), which it does based on the project structure (`apps/client/src/pages/player-page.tsx`). Alternatively, embed an iframe:

```tsx
<Box sx={{ width: '100%', height: '70vh', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
  <iframe src={`http://localhost:5173/play/${vnId}`} width="100%" height="100%" style={{ border: 'none' }} />
</Box>
```

Use `window.location.origin` for the player URL to work across environments.

## Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `createSceneSchema` requires `content` min 1 — breaking for scenes created via "Add Scene" button with no text yet | Medium | Create scenes with a placeholder text block `[{ type: 'narration', text: 'Nova cena...' }]` |
| Race condition: reloading VN data after mutation may overwrite unsaved local state | Low | Use optimistic updates: append API response to local state immediately, only re-fetch on mount |
| DELETE cascade may delete more than expected if DB FK constraints are misconfigured | Low | Verify `onDelete: 'cascade'` on all FK columns in schema.ts (already confirmed in all relevant tables) |
| `updateSceneSchema.partial()` makes `content` optional — but type system may still expect `TextBlock[]` in the editor state | Low | Only send changed fields in PUT body; keep local state as source of truth |
| Preview tab still disabled after fix — root cause may be in state synchronization | Medium | Add logging/debug in `useEffect` for `selectedSceneId` changes; verify scene list renders correctly after API create |
| CORS issues when embedding player iframe from different port (dashboard :5174 → client :5173) | Low | Use relative URLs in production (same origin); for dev, configure Vite proxy or open in new tab |

## Post-Implementation Verification

- [ ] `npm run build` passes across all packages (backend, shared, lib, dashboard)
- [ ] `npm run lint` passes without new errors
- [ ] Create a chapter via dashboard → verify it appears in DB (`SELECT * FROM chapters`)
- [ ] Add scenes + text blocks to chapter → verify in DB (`SELECT * FROM scenes`)
- [ ] Add choices to scene → verify in DB (`SELECT * FROM choices`)
- [ ] Delete a chapter → verify cascade deletes scenes and choices
- [ ] Reload the editor → all data persists
- [ ] Ownership guard: attempt to edit another user's VN chapters → 403
- [ ] Preview tab enables when a scene is selected
- [ ] Player opens and shows scene content
- [ ] All acceptance criteria (AC1-AC6) met
