# Implementation Plan — Issue #5

**Issue:** [#5](https://github.com/zan-ia/zan-visual-novel/issues/5) — Player mostra erro genérico ao carregar VN sem capítulos publicados
**Type:** bug
**Complexity:** medium
**Date:** 2026-07-25

## Summary

Four-part fix for the empty-chapters UX gap. The root cause is a chain: (1) the player has no pre-flight validation before calling `VNEngine.start()`; (2) the engine throws a generic `Error` so callers cannot distinguish "empty VN" from other failures; (3) the test VN `9ce3813e-...` was inserted manually without chapters, exposing the data invariant violation; (4) the library never signals the empty state, so users keep clicking dead cards. The fix introduces a pre-flight check in the player, a typed `EmptyStoryError` in the engine, a proper seed script that demonstrates the correct shape (and an API guard to prevent re-introducing the bug), and a "Em breve" badge in the library.

## Files to Modify/Create

### Step 1 — Player: pre-flight empty-chapters check (AC1)

| File                                    | Action | Description                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/client/src/pages/player-page.tsx` | MODIFY | In the `useEffect` (lines ~40-70) that loads the VN, after the success branch where `vnRes.data` is available, add a guard: `if (!vn.chapters?.length) { setError('Esta visual novel ainda não tem capítulos publicados.'); return; }` BEFORE calling `startGame(vn)`. Also defensively wrap `startGame(vn)` in a `try/catch` and convert `EmptyStoryError` (from engine) into the same specific message — defense in depth. |

**Why this works:** the existing `useVNEngine.startGame` callback in `packages/lib/src/hooks/use-vn-engine.ts:31-35` does NOT catch errors thrown by `engine.start()`. The thrown `Error` propagates out of the `.then` callback and lands in the existing `.catch` (line ~67) which sets the generic `'Erro ao carregar a história.'` message. By validating `vn.chapters?.length` _before_ `startGame`, the generic path is bypassed entirely.

### Step 2 — Engine: typed `EmptyStoryError` (AC2)

| File                                              | Action | Description                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/vn-engine/src/engine.ts`                | MODIFY | At the top of the file (after imports), declare and export a new class `EmptyStoryError extends Error` with fields: `code: 'EMPTY_STORY'`, `storyId: string`, `reason: 'no_chapters' \| 'no_scenes'`, and an optional `chapterId?: string`. The constructor sets `this.name = 'EmptyStoryError'`.                                                 |
| `packages/vn-engine/src/engine.ts`                | MODIFY | In `start()` (line ~53), replace `throw new Error('Story has no chapters');` with `throw new EmptyStoryError(story.id, 'no_chapters');`. Also wrap the `'Chapter has no scenes'` throw (line ~55) with the same class using `reason: 'no_scenes'` and pass the `firstChapter.id` as `chapterId`.                                                  |
| `packages/vn-engine/src/index.ts`                 | MODIFY | Add `export { EmptyStoryError } from './engine.js';` so consumers can do `instanceof` checks.                                                                                                                                                                                                                                                     |
| `packages/vn-engine/src/__tests__/engine.test.ts` | MODIFY | Update the existing test `'should throw when starting with no chapters'` (lines ~24-49) to: `expect(() => engine.start(emptyStory)).toThrow(EmptyStoryError);` and add a new assertion `expect(() => engine.start(emptyStory)).toThrow(EmptyStoryError); // also assert .code === 'EMPTY_STORY'`. Add a parallel test for the "no scenes" branch. |

**Why this works:** a typed error class enables `instanceof EmptyStoryError` checks in any consumer (current player fix in Step 1, future dashboard, server-side rendering, automated tests). The `code` field also makes error matching feasible without relying on the human-readable message.

### Step 3 — Seed: a real, complete story (AC3)

> **Discovery:** the `Aventura de Teste` VN (id `9ce3813e-...`) was inserted manually — no seed file currently exists. The `backend/api/drizzle` directory referenced by `docker-compose.yml:23` (`./backend/api/drizzle:/docker-entrypoint-initdb.d`) does not exist on disk, so no auto-migration is happening either. The fix has two parts: (a) add a proper seed so a fresh `docker compose up` lands you in a working state, and (b) add a server-side guard so creators cannot publish a chapter-less VN.

| File                                     | Action | Description                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/api/src/db/seed.ts`             | CREATE | New Drizzle-based seed script. Idempotent (`INSERT ... ON CONFLICT DO NOTHING` via `where(sql\`...\`)` lookups). Creates: 1 admin user (`seed@zan-vn.com`/`Seed1234!`), 1 creator (`creator@zan-vn.com`), 1 published VN "O Mistério do Farol" with 1 chapter "Capítulo 1 — A Chegada" containing 1 narration scene + 1 choice scene. Uses `crypto.randomUUID()` and stores IDs as constants for test stability. |
| `backend/api/package.json`               | MODIFY | Add `"db:seed": "tsx src/db/seed.ts"` script. Document in README.                                                                                                                                                                                                                                                                                                                                                |
| `backend/api/src/routes/vn.routes.ts`    | MODIFY | In the `POST /` handler (line ~138), after creating the VN, leave it as `draft` — never auto-publish from create. Already correct. In `PATCH /:id` (line ~191), add validation: when `data.status === 'published'`, the update must be rejected with 422 unless at least one published chapter exists. This prevents the exact bug from being re-introduced via API.                                             |
| `backend/api/drizzle/0002_seed_data.sql` | CREATE | A SQL seed file at the same path the existing migration directory is expected to live (consistent with `drizzle.config.ts:6` `out: './drizzle'`). Provides the same data as `seed.ts` but in raw SQL so it can be auto-applied via the docker-compose initdb mount once the `drizzle/` directory exists. SQL is generated from the same fixtures.                                                                |
| `backend/api/drizzle/.gitkeep`           | CREATE | Empty marker so the directory tracks in git (docker-compose mounts this path).                                                                                                                                                                                                                                                                                                                                   |
| `README.md`                              | MODIFY | Add a short section under "🚀 Começo Rápido" documenting `npm run db:seed -w @zan-vn/api` and explaining that `docker compose up` auto-applies migrations + seed.                                                                                                                                                                                                                                                |

**Why a guard in the PATCH handler:** a UI-level validation can be bypassed. The bug was caused by hand-inserted data; the API is the single chokepoint that should refuse to publish a story with zero chapters. The error response: `400 { code: 'NO_PUBLISHED_CHAPTERS', message: 'VN precisa de ao menos 1 capítulo publicado para ser publicado.' }`.

**Why both seed.ts AND seed.sql:** the TypeScript seed is the maintainable source of truth (typed, re-runnable); the SQL seed is for first-boot developer ergonomics via docker-compose initdb. Keep them in sync via a comment.

### Step 4 — Library: "Em breve" badge for empty VNs (AC4)

| File                                     | Action | Description                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/ui/src/vn-card.tsx`            | MODIFY | Add a new optional `empty?: boolean` prop. When `empty === true`, render a `<Chip>` overlay in the top-right of the cover image: `label="Em breve"`, `color="warning"`, with `aria-label` "Em breve — sem capítulos publicados". The card keeps the same click target — but the parent (`library-page.tsx`) decides whether to allow the click. Also add a CSS class `vn-card--empty` that reduces cover opacity to 0.6. |
| `packages/ui/src/index.ts`               | MODIFY | No change needed — `VNCard` props are already exported.                                                                                                                                                                                                                                                                                                                                                                  |
| `packages/ui/src/vn-card.css`            | CREATE | Styles for the new `.vn-card--empty` and `.vn-card__empty-badge` classes. The existing VNCard uses unstyled class names (`vn-card`, `vn-card__cover`, etc.) but no CSS file is checked in — this is a pre-existing tech-debt item, not introduced here. The new CSS file adds only the rules needed for the empty state.                                                                                                 |
| `apps/client/src/pages/library-page.tsx` | MODIFY | Pass `empty={vn.totalChapters === 0}` to each `<VNCard>`. When the user clicks an empty card, `navigate(\`/play/${vn.id}\`)`is intercepted: show a`Snackbar` (already imported pattern from player-page) with the same specific message ("Esta visual novel ainda não tem capítulos publicados.") for 4 seconds instead of navigating. Keep the click target for discoverability — just block the side-effect.           |

**Why this works:** the `VisualNovel` type (in `packages/shared/src/types/index.ts:42`) already has `totalChapters: number`, so the library has the data to know emptiness without an extra fetch. The backend's GET `/vns` already returns it. The badge makes the state visible; the snackbar prevents the silent failure when a user clicks anyway.

### Step 5 — Optional: wire `EmptyStoryError` into the player catch (defense in depth)

| File                                    | Action | Description                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/client/src/pages/player-page.tsx` | MODIFY | Inside the existing `.then` (line ~52), wrap `startGame(vn)` in `try { startGame(vn); loadSaves(); } catch (err) { if (err instanceof EmptyStoryError) { setError('Esta visual novel ainda não tem capítulos publicados.'); } else { throw err; } }`. Import `EmptyStoryError` from `@zan-vn/vn-engine` (now exported per Step 2). |

**Why this is optional but recommended:** the pre-flight check in Step 1 is the primary fix. This catch is defense in depth for race conditions (e.g., VN gets emptied between the API fetch and engine start) and makes the player resilient to the engine throwing for any reason related to emptiness.

## Patterns to Follow

- **Typed error pattern:** follow the existing `Error` subclass convention used in `packages/vn-engine/src/llm-provider.ts:14` (`No LLM provider available`) — but upgrade to a class with `name` and `code` fields so `instanceof` works across module boundaries.
- **Pre-flight validation in player:** follow the pattern at `apps/client/src/pages/login-page.tsx` (analogous structure: validate before calling API). For React error states, follow `player-page.tsx:117-133` (`<Alert severity="error">` + "Back to Library" button).
- **Snackbar UX:** follow the `Snackbar` usage at `player-page.tsx:266-274` — same autoHideDuration, anchorOrigin, and message prop pattern.
- **Chip badge for state:** follow the `Chip` usage at `apps/dashboard/src/pages/vn-list-page.tsx:48-53` (status chips with color mapping).
- **Idempotent seed:** follow the `getDb().insert(...).values(...).onConflictDoNothing()` pattern that Drizzle supports (similar to the unique-index pattern in `backend/api/src/db/schema.ts:188-198` `idx_saves_slot`).
- **Vitest assertions on custom errors:** use `expect(() => fn()).toThrow(MyErrorClass)` — Vitest's matcher checks `instanceof` and the class must extend `Error`.
- **Conventional Commits:** `fix(player):` for Step 1+5, `feat(engine):` or `fix(engine):` for Step 2, `feat(api):` for Step 3+guard, `feat(ui):` for Step 4.

## Implementation Order

1. **Step 2 first** (engine error class) — unblocks Step 1's `instanceof` check and Step 5's import. Smallest change, lowest risk.
   - Add `EmptyStoryError` class to `engine.ts`
   - Replace both throws in `start()`
   - Export from `index.ts`
   - Update existing test, add new test
   - **Verify:** `npx turbo run test -F @zan-vn/vn-engine` — all green
2. **Step 1** (player pre-flight) — primary UX fix.
   - Add the `vn.chapters?.length === 0` guard in `player-page.tsx`
   - Import nothing new (no `EmptyStoryError` needed yet)
   - **Verify:** `npx turbo run build` exits 0
3. **Step 5** (player defense-in-depth catch) — wraps `startGame` with `instanceof EmptyStoryError` check.
   - Depends on Step 2 (export) and Step 1 (file already touched)
   - **Verify:** `npx turbo run build typecheck` exits 0
4. **Step 3** (seed + API guard) — independent of the others; do it now while the build is green.
   - Create `backend/api/src/db/seed.ts`
   - Add `db:seed` script to `backend/api/package.json`
   - Add the PATCH guard in `vn.routes.ts`
   - Create `backend/api/drizzle/0002_seed_data.sql` + `.gitkeep`
   - **Verify:** `npx turbo run build -F @zan-vn/api` exits 0; `npx turbo run test -F @zan-vn/api` — health test still green
5. **Step 4** (library badge) — last, builds on the API + types from previous steps.
   - Add `empty` prop + chip to `VNCard`
   - Create `vn-card.css`
   - Wire badge + click-blocker in `library-page.tsx`
   - **Verify:** `npx turbo run build` exits 0; manual test: navigate to `/library`, see badge on `Aventura de Teste`
6. **Final verification:** `npx turbo run build typecheck lint test` — all green

## Identified Risks

| Risk                                                                                          | Impact | Mitigation                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EmptyStoryError` is a new top-level export — could break consumers that re-export everything | low    | Only `index.ts` re-exports engine types. No app imports the engine class itself by `instanceof` today (confirmed via grep). The change is additive.                                                                                                                                     |
| Replacing `throw new Error('Story has no chapters')` breaks the existing engine test          | low    | Test update is in the same step (Step 2). Use `.toThrow(EmptyStoryError)` not just `.toThrow('Story has no chapters')` — class-based assertion is stricter and survives message changes.                                                                                                |
| `db:seed` script runs against a populated database and creates duplicate VNs                  | medium | Make the script idempotent: look up by `email` (users) and `title` (VNs) before inserting. Use `onConflictDoNothing()` for the chapter/scene inserts keyed on a stable `slug` field if added, or query-then-insert pattern. Document the expected behavior in the script's top comment. |
| PATCH guard blocks legitimate "save as draft" workflows                                       | low    | Guard only triggers when transitioning TO `published` AND `totalChapters === 0`. Re-saving a published VN that already has chapters is unaffected. The error response uses 400 (not 422) for consistency with existing validation errors.                                               |
| Library `empty` prop is `boolean` but VNCard is in `packages/ui` — type sharing required      | low    | `empty?: boolean` is a primitive; no shared type needed. `VNCardProps` is already exported from `packages/ui/src/index.ts:7`. No changes required there.                                                                                                                                |
| CSS file (`vn-card.css`) has no existing style file — adding one is a new pattern             | low    | Acceptable; follow the file naming convention of the existing class names. If the team prefers, a follow-up commit can move all `vn-card*` styles into one file. Document in the CSS file header.                                                                                       |
| Race: VN gets emptied between API fetch and engine start                                      | low    | Step 5's defense-in-depth `instanceof EmptyStoryError` catch handles this. Document in the catch block why it exists.                                                                                                                                                                   |
| Snackbar on every empty-card click feels annoying                                             | low    | The Snackbar only fires on click, not on hover/render. Users who see the badge won't click. The 4-second auto-hide is the same duration convention used elsewhere.                                                                                                                      |
| Existing data (`Aventura de Teste` with no chapters) is still broken in the live DB           | medium | The seed.ts script does NOT delete or modify this VN (no stable id known). Mitigation: the library badge immediately signals the broken state. Long-term: a one-shot `data-fix.ts` script can backfill or mark-as-draft this VN by ID. Out of scope for this issue but noted.           |
| Docker-compose mount `./backend/api/drizzle:/docker-entrypoint-initdb.d` was failing silently | low    | The new `.gitkeep` makes the directory exist. Document in README that `docker compose up` now does a one-time init. Re-runs are safe (Postgres initdb only runs on a fresh volume).                                                                                                     |

## Post-Implementation Verification

- [ ] `npx turbo run build typecheck lint test` exits 0 across all 7 packages
- [ ] `packages/vn-engine` test suite passes with the new `EmptyStoryError` assertions
- [ ] `backend/api` test suite still green (health test)
- [ ] Manual: open `http://localhost:5173/play/9ce3813e-6689-4b61-88f3-03c149038a01` — see "Esta visual novel ainda não tem capítulos publicados." (not the generic error)
- [ ] Manual: open `http://localhost:5173/library` — see "Em breve" badge on `Aventura de Teste`; clicking shows Snackbar with the same message instead of navigating
- [ ] Manual: run `npm run db:seed -w @zan-vn/api` on a fresh DB — `O Mistério do Farol` is created with 1 chapter + 2 scenes; opening its `/play/:id` works end-to-end
- [ ] Manual: try `PATCH /vns/:id` with `{"status": "published"}` on a chapter-less VN — receives 400 with `code: 'NO_PUBLISHED_CHAPTERS'`
- [ ] All four acceptance criteria from issue #5 (AC1–AC4) are demonstrably met
