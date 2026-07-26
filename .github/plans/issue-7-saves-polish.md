# Implementation Plan — Issue #7

**Issue:** [#7](https://github.com/zan-ia/zan-visual-novel/issues/7) — feat: Sistema de Saves — polimento UX
**Type:** feature
**Complexity:** medium
**Date:** 2026-07-25
**Branch:** `feat/saves-polish`

## Summary

Polish the save system UX with 5 improvements: real chapter-based progress bar, optimized load (reuse StoryData in memory), delete save with confirmation dialog, last-save time indicator, and robust auto-save that skips during scene transitions. Touches 5 files across backend, shared packages, and the client app. No new dependencies required — all changes use existing MUI v6 and React 19 primitives.

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `backend/api/src/routes/saves.routes.ts` | MODIFY | Add `DELETE /saves/:id` endpoint |
| `packages/lib/src/api-client.ts` | MODIFY | Add `deleteSave(id)` + private `del()` HTTP method |
| `packages/vn-engine/src/engine.ts` | MODIFY | Add `getCurrentChapterIndex()` for progress calculation |
| `packages/vn-engine/src/types.ts` | MODIFY | (No changes needed from initial analysis — engine internals suffice) |
| `apps/client/src/pages/player-page.tsx` | MODIFY | Main UX changes: progress bar, load optimization, delete UI, last-save indicator, robust auto-save |

## Patterns to Follow

- **API Routes**: Follow existing CRUD pattern in `backend/api/src/routes/saves.routes.ts` — `uuidSchema.parse()`, ownership check via `eq(schema.saves.userId, req.user!.userId)`, `.returning()` for Drizzle
- **ApiClient**: Follow existing method structure — public typed method → private HTTP method. Consistent `ApiResponse<T>` return type
- **VN Engine Public API**: Follow existing convention — pure TypeScript methods with clear return types, no side effects on getters
- **React Components**: Follow MUI v6 patterns already used in `player-page.tsx` — `Box`, `IconButton`, `Drawer`, `ListItemButton`, `Snackbar`. New Dialog follows MUI Dialog API
- **State Management**: Follow existing `useState` + `useCallback` + `useRef` patterns in player page. No external state library
- **Hooks**: `useVNEngine` already exposes `isLoading` from engine transitions — leverage this

## Implementation Order

### Step 1: Backend — DELETE Save Endpoint

**File:** `backend/api/src/routes/saves.routes.ts`

Add after the `PUT /:id` route (line ~150):

```typescript
// DELETE /api/v1/saves/:id — Delete save
savesRouter.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const [existing] = await getDb()
      .select()
      .from(schema.saves)
      .where(and(eq(schema.saves.id, id), eq(schema.saves.userId, req.user!.userId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Save não encontrado', code: 'NOT_FOUND' },
      });
      return;
    }
    await getDb().delete(schema.saves).where(eq(schema.saves.id, id));
    res.json({ success: true, data: { deleted: true } });
  } catch {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});
```

- Follows the exact same pattern as PUT (UUID validation, ownership check, error handling)
- Uses existing `uuidSchema`, `authenticate`, `getDb`, `schema`

### Step 2: ApiClient — Add deleteSave

**File:** `packages/lib/src/api-client.ts`

**2a.** Add private `del()` HTTP method (after `patch()`, before `request()`):

```typescript
private async del<T>(
  path: string,
  opts?: { auth?: boolean },
): Promise<ApiResponse<T>> {
  return this.request<T>(
    `${this.config.baseUrl}/api/v1${path}`,
    { method: 'DELETE' },
    opts,
  );
}
```

**2b.** Add public `deleteSave()` method (after `updateSave()`):

```typescript
async deleteSave(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return this.del(`/saves/${id}`);
}
```

### Step 3: VN Engine — Expose Chapter Progress

**File:** `packages/vn-engine/src/engine.ts`

Add public method after `getCurrentScene()`:

```typescript
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
```

**File:** `packages/lib/src/hooks/use-vn-engine.ts`

Optionally expose via the hook (or compute in the player page directly via `engine` ref):

Add to the `UseVNEngineReturn` interface and return value:

```typescript
getChapterProgress: () => ({ current: number; total: number });
```

```typescript
const getChapterProgress = useCallback(() => {
  return {
    current: engineRef.current.getCurrentChapterIndex(),
    total: engineRef.current.getTotalChapters(),
  };
}, []);
```

### Step 4: Player Page — All UX Changes

**File:** `apps/client/src/pages/player-page.tsx`

This is the largest change. All modifications are within this single file.

#### 4a. State Additions (add new state variables)

```typescript
// New state
const [storyData, setStoryData] = useState<StoryData | null>(null);
const [progress, setProgress] = useState(0);
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
const [saveToDelete, setSaveToDelete] = useState<string | null>(null);
const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
const [lastSaveLabel, setLastSaveLabel] = useState<string>('');
const isTransitioningRef = useRef(false);
```

#### 4b. StoryData Caching (modify initial load effect)

Inside the `api.getVN(vnId).then(...)` success callback, after `setStoryTitle(vn.title)`, add:

```typescript
setStoryData(vn as StoryData);
```

#### 4c. Progress Bar Calculation (new effect)

Add a `useEffect` that recalculates progress whenever `currentScene` changes:

```typescript
useEffect(() => {
  if (!currentScene || !storyData) return;
  const currentChapter = storyData.chapters.find((c) => c.id === currentScene.chapterId);
  const chapterIndex = currentChapter?.orderIndex ?? 0;
  const total = storyData.chapters.length;
  setProgress(total > 0 ? ((chapterIndex + 1) / total) * 100 : 0);
}, [currentScene, storyData]);
```

Replace the hardcoded `width: '30%'` in the progress bar with:

```tsx
width: `${progress}%`,
```

#### 4d. Optimized Load (modify `handleLoadSave`)

Replace the call to `api.getVN(vnId)` with the cached `storyData`:

```typescript
const handleLoadSave = useCallback(
  async (save: SaveData) => {
    if (!vnId || !storyData) return;
    startGame(storyData, save);
    setToast('Save carregado!');
    setSaveDrawerOpen(false);
  },
  [startGame, vnId, storyData],
);
```

#### 4e. Last Save Indicator (new effect + state update)

Add a `useEffect` that updates a relative time string every second:

```typescript
const [relativeTime, setRelativeTime] = useState('');

useEffect(() => {
  if (lastSaveTime === null) return;
  const update = () => {
    const diff = Math.floor((Date.now() - lastSaveTime) / 1000);
    if (diff < 60) setRelativeTime(`Salvo há ${diff}s`);
    else {
      setRelativeTime(
        `${lastSaveLabel}: ${new Date(lastSaveTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      );
    }
  };
  update();
  const interval = setInterval(update, 5000);
  return () => clearInterval(interval);
}, [lastSaveTime, lastSaveLabel]);
```

Update `handleQuickSave` and `handleSaveToSlot` to set last save time:

```typescript
setLastSaveTime(Date.now());
setLastSaveLabel(save.label);
```

Display in the top bar, next to the save icons:

```tsx
{relativeTime && (
  <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontSize: '0.7rem' }}>
    {relativeTime}
  </Typography>
)}
```

#### 4f. Delete Save UI (in drawer list items)

Add a delete icon button to each `ListItemButton` in the save list:

```tsx
<ListItemButton key={save.id} onClick={() => handleLoadSave(save)}>
  <ListItemText
    primary={save.label}
    secondary={new Date(save.updatedAt).toLocaleString('pt-BR')}
  />
  <IconButton
    size="small"
    onClick={(e) => {
      e.stopPropagation();
      setSaveToDelete(save.id);
      setDeleteConfirmOpen(true);
    }}
    aria-label={`Deletar ${save.label}`}
  >
    <DeleteIcon fontSize="small" />
  </IconButton>
</ListItemButton>
```

Add the confirmation dialog (MUI Dialog) before the closing `</Box>` of the drawer or at the bottom of the component:

```tsx
<Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
  <DialogTitle>Deletar Save</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Tem certeza que deseja deletar este save? Esta ação não pode ser desfeita.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
    <Button
      color="error"
      onClick={async () => {
        if (saveToDelete) {
          await api.deleteSave(saveToDelete);
          setDeleteConfirmOpen(false);
          setSaveToDelete(null);
          loadSaves();
        }
      }}
    >
      Deletar
    </Button>
  </DialogActions>
</Dialog>
```

New MUI imports to add:
- `DeleteIcon` from `@mui/icons-material/Delete`
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogContentText`, `DialogActions` from `@mui/material`

#### 4g. Robust Auto-Save (modify auto-save effect)

Replace the current auto-save effect:

```typescript
useEffect(() => {
  autoSaveTimer.current = setInterval(() => {
    if (currentScene && !isLoading && !isTransitioningRef.current) {
      handleQuickSave();
    }
  }, 60_000);
  return () => clearInterval(autoSaveTimer.current);
}, [currentScene, isLoading]);
```

Set `isTransitioningRef` in `continueGame` and `makeChoice` callbacks:

The player page doesn't directly call `continueGame` and `makeChoice` from the engine — it calls the hook versions. We can use a wrapper:

```typescript
const handleContinue = () => {
  isTransitioningRef.current = true;
  continueGame();
};
const handleMakeChoice = (choiceId: string) => {
  isTransitioningRef.current = true;
  makeChoice(choiceId);
};
```

Reset `isTransitioningRef` when scene updates:

```typescript
useEffect(() => {
  isTransitioningRef.current = false;
}, [currentScene]);
```

Update the JSX to use the wrapped callbacks:
- Replace `continueGame()` with `handleContinue()`
- Replace `makeChoice` with `handleMakeChoice`

## Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Engine `getCurrentChapterIndex()` assumes `chapter.orderIndex` is zero-based and sequential | Low | The `orderIndex` field in Drizzle schema defaults to 0 and is set by the creator. Use `findIndex` as fallback if `orderIndex` is unreliable |
| `storyData` ref may be stale on navigation away/back | Low | `storyData` is set on initial load and only used for load/restore within same session. A page remount resets state |
| Auto-save skipped during very long LLM generation (>60s) | Low | LLM generation sets `isLLMScene` + `isLoading`; acceptable UX trade-off vs interrupting generation |
| Delete endpoint not idempotent on repeated calls | Low | 404 is returned if already deleted; client handles this gracefully (snackbar + reload list) |
| MUI Dialog may need `disablePortal` or specific z-index in player fullscreen layout | Low | Player page uses `position: relative` + `z-index` order; MUI Dialog renders in portal by default — test in browser |

## Post-Implementation Verification

- [ ] `DELETE /api/v1/saves/:id` returns 200 for own save, 404 for non-existent, 401 without auth
- [ ] `api.deleteSave(id)` returns `ApiResponse<{ deleted: boolean }>`
- [ ] Progress bar updates correctly when navigating between chapters
- [ ] Load save reuses cached `storyData` — no redundant `GET /vns/:id` call
- [ ] Delete button appears in save drawer; confirmation dialog opens; delete works
- [ ] Last-save indicator shows "Salvo há Xs" / "Auto Save: HH:MM"
- [ ] Auto-save does NOT fire during scene transitions (isLoading or isTransitioning)
- [ ] Auto-save correctly fires when idle for 60s
- [ ] `tsc --noEmit` passes on all packages
- [ ] Existing tests pass (if any)
- [ ] No new TypeScript errors or lint violations
