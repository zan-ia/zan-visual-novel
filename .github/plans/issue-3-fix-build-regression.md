# Implementation Plan — Issue #3

**Issue:** [#3](https://github.com/zan-ia/zan-visual-novel/issues/3) — Corrigir regressão de build: tsconfig inválidos, erros de tipo Drizzle, lint placebo e zero cobertura de testes
**Type:** improvement (build regression fix)
**Complexity:** medium
**Date:** 2026-07-25

## Summary

Six-part fix for build regression discovered on 2026-07-25. The core issue is a monorepo tsconfig misconfiguration: all 7 packages have `rootDir: "./src"` + `composite: true` and inherit `paths` from the root tsconfig that resolve to sibling packages' source files — files outside each package's `rootDir`. This causes ~30 TS6059/TS6307 errors. The fix uses TypeScript Project References: only `shared` (the leaf package) retains `composite: true`; all dependent packages remove `composite: true`, add `references` to their dependencies, and keep `paths` for IDE/bundler resolution. Additional fixes address Drizzle ORM type errors (4), minor unused-import errors (3), placeholder lint scripts, missing test files, and unformatted code.

## Files to Modify/Create

### Step 1 — Tsconfig fixes (~30 errors)

| File                               | Action | Description                                                                                                                                                                                     |
| ---------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsconfig.json` (root)             | MODIFY | Remove `paths` for workspace packages (keep if needed for Vite's `vite resolve.alias`; verify apps don't break). The `references` array already exists and stays.                               |
| `packages/shared/tsconfig.json`    | MODIFY | Keep `composite: true` (already present — this is the leaf package, referenced by all others). No references needed (depends on zero workspace packages).                                       |
| `packages/vn-engine/tsconfig.json` | MODIFY | Remove `composite: true`. Add `"references": [{ "path": "../shared" }]`.                                                                                                                        |
| `packages/lib/tsconfig.json`       | MODIFY | Remove `composite: true`. Add `"references": [{ "path": "../shared" }, { "path": "../vn-engine" }]`. Add `"types": ["vite/client"]` (see Step 3 for `import.meta.env` fix).                     |
| `packages/ui/tsconfig.json`        | MODIFY | Remove `composite: true`. Add `"references": [{ "path": "../shared" }]`.                                                                                                                        |
| `backend/api/tsconfig.json`        | MODIFY | Remove `composite: true`. Add `"references": [{ "path": "../../packages/shared" }]`.                                                                                                            |
| `apps/client/tsconfig.json`        | MODIFY | Remove `composite: true`. Add `"references": [{ "path": "../../packages/shared" }, { "path": "../../packages/ui" }, { "path": "../../packages/lib" }, { "path": "../../packages/vn-engine" }]`. |
| `apps/dashboard/tsconfig.json`     | MODIFY | Remove `composite: true`. Add `"references": [{ "path": "../../packages/shared" }, { "path": "../../packages/ui" }, { "path": "../../packages/lib" }]`.                                         |
| `apps/client/package.json`         | MODIFY | Change build script from `"tsc -b && vite build"` to `"tsc && vite build"` (plain `tsc` since composite is removed).                                                                            |
| `apps/dashboard/package.json`      | MODIFY | Same change: `"tsc -b && vite build"` → `"tsc && vite build"`.                                                                                                                                  |
| `packages/lib/package.json`        | MODIFY | Add `"@zan-vn/vn-engine": "*"` to dependencies (lib imports from vn-engine in `use-vn-engine.ts` but package.json doesn't declare it).                                                          |

**Dependency graph for reference:**

```
shared (leaf, composite: true)
  ↑
  ├── vn-engine  → references shared
  ├── ui         → references shared
  ├── api        → references shared
  ├── lib        → references shared + vn-engine
  ├── client     → references shared + ui + lib + vn-engine
  └── dashboard  → references shared + ui + lib
```

### Step 2 — Drizzle ORM type errors (4 errors)

| File                                     | Action | Description                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/api/src/routes/saves.routes.ts` | MODIFY | PUT `/:id` handler (line ~99): Add `const id = uuidSchema.parse(req.params.id)` at top of try block. Replace both `req.params.id` usages (lines ~102, ~114) with validated `id`. Need to import `z` and define `uuidSchema` — copy pattern from `vn.routes.ts:10`. |
| `backend/api/src/routes/vn.routes.ts`    | MODIFY | PATCH `/:id` handler (line ~201): Add `const id = uuidSchema.parse(req.params.id)` at top of try block. Replace both `req.params.id` usages (lines ~207, ~227) with validated `id`. Note: `uuidSchema` already defined at line 10.                                 |

**Root cause:** Express types `req.params.id` as `string | undefined`, but Drizzle's `eq()` expects `string`. The GET `/:id` handler in `vn.routes.ts` (line ~92) already uses `uuidSchema.safeParse()` — the fix applies the same pattern to PUT/PATCH handlers using `.parse()` (throw on invalid).

### Step 3 — Minor type errors (3 errors)

| File                                  | Action | Description                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/lib/src/hooks/use-api.ts`   | MODIFY | Line 1: Remove `useCallback` from React import (unused — TS6133).                                                                                                                                                                                                                                                                |
| `packages/lib/src/hooks/use-api.ts`   | MODIFY | Line 5: Fix `import.meta.env` not recognized (TS2339). **Chosen fix:** Add `/// <reference types="vite/client" />` as first line OR add `"types": ["vite/client"]` to `packages/lib/tsconfig.json`. The tsconfig approach is cleaner since `lib` is consumed by Vite apps and `import.meta.env` is legitimately used at runtime. |
| `backend/api/src/routes/vn.routes.ts` | MODIFY | Line 5: Remove `and` from the drizzle-orm import (unused — TS6133). Change `import { eq, and, desc, inArray, sql }` to `import { eq, desc, inArray, sql }`.                                                                                                                                                                      |

### Step 4 — Real ESLint configuration

| File                              | Action | Description                                                                                                                                                                                                                                                |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/api/package.json`        | MODIFY | Change `"lint": "echo 'lint ok'"` to `"lint": "eslint src/"`.                                                                                                                                                                                              |
| `packages/vn-engine/package.json` | MODIFY | Change `"lint": "echo 'lint ok'"` to `"lint": "eslint src/"`.                                                                                                                                                                                              |
| `packages/lib/package.json`       | MODIFY | Change `"lint": "echo 'lint ok'"` to `"lint": "eslint src/"`.                                                                                                                                                                                              |
| `eslint.config.mjs` (root)        | CREATE | Root flat ESLint config using `@eslint/js` + `typescript-eslint`. Extend recommended rules. Apply to `backend/api`, `packages/vn-engine`, `packages/lib`. (Other packages — `shared`, `ui`, `client`, `dashboard` — can keep placeholder for now per AC3.) |
| Root `package.json`               | MODIFY | Add ESLint devDependencies: `eslint`, `@eslint/js`, `typescript-eslint`, `@typescript-eslint/parser`.                                                                                                                                                      |

### Step 5 — Initial unit tests

| File                                              | Action | Description                                                                                                                                                                                      |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/api/src/__tests__/health.test.ts`        | CREATE | Simple health check test: import `server.ts` (or create a minimal Express app), GET `/health`, assert 200. Use `vitest` (already in devDependencies).                                            |
| `packages/vn-engine/src/__tests__/engine.test.ts` | CREATE | Test `VNEngine` instantiation: construct with default config, verify initial state. Optionally test `loadStory()` with a minimal `StoryData` fixture. Use `vitest` (already in devDependencies). |

### Step 6 — Code formatting

| File                     | Action | Description                                                                                                                                             |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.prettierignore` (root) | CREATE | Exclude compiled output: `*.d.ts`, `*.js` (in `dist/` paths and alongside source where compiled), `dist/`, `node_modules/`, `.turbo/`, `*.tsbuildinfo`. |
| All source files         | AUTO   | Run `npx prettier --write .` (prettier v3.3.0 already in root devDependencies).                                                                         |

## Patterns to Follow

- **Tsconfig project references:** Follow [TypeScript Project References docs](https://www.typescriptlang.org/docs/handbook/project-references.html). The root `tsconfig.json` already uses solution-style references — this plan extends the pattern to child packages.
- **Zod validation before Drizzle queries:** Follow the existing pattern in `vn.routes.ts` GET `/:id` handler (line ~92): `const id = uuidSchema.safeParse(req.params.id)` — but use `.parse()` (throws) instead of `.safeParse()` for PUT/PATCH to match the error-handling style already in place (generic catch returns 500).
- **ESLint flat config:** Use modern `eslint.config.mjs` format (ESLint v9+ flat config), not legacy `.eslintrc`.
- **Vitest test structure:** Tests go in `__tests__/` directories alongside source. Use `describe`/`it` blocks. No need for `@jest/globals` — vitest provides compatible globals.
- **Prettierignore:** Standard monorepo exclusions — compiled output, dependencies, build artifacts.
- **Conventional Commits:** Each step should be its own commit with prefix: `fix:` for tsconfig/drizzle/type errors, `improve:` for lint/tests/formatting.

## Implementation Order

1. **Step 1: Tsconfig fixes** — Must be done FIRST. All other steps depend on a clean build.
   - Start with `packages/shared/tsconfig.json` (leaf, least dependencies)
   - Then `packages/vn-engine/tsconfig.json` (depends on shared)
   - Then `packages/lib/tsconfig.json` (depends on shared + vn-engine)
   - Then `packages/ui/tsconfig.json` (depends on shared)
   - Then `backend/api/tsconfig.json` (depends on shared)
   - Then `apps/client/tsconfig.json` and `apps/dashboard/tsconfig.json`
   - Update `apps/client/package.json` and `apps/dashboard/package.json` build scripts
   - Update `packages/lib/package.json` to add missing `@zan-vn/vn-engine` dependency
   - **Verify:** `npx turbo run build` exits 0
2. **Step 2: Drizzle type errors** — Can be done in parallel with Step 3, but after Step 1.
   - Fix `saves.routes.ts` PUT handler
   - Fix `vn.routes.ts` PATCH handler
   - **Verify:** `npx turbo run typecheck` exits 0
3. **Step 3: Minor type errors** — Can be done in parallel with Step 2.
   - Fix `use-api.ts` (remove `useCallback`, add vite/client types)
   - Fix `vn.routes.ts` (remove `and` import)
   - **Verify:** `npx turbo run typecheck` exits 0
4. **Step 4: ESLint setup** — After Steps 1-3 (clean build required).
   - Install ESLint dependencies
   - Create `eslint.config.mjs`
   - Update package.json scripts
   - **Verify:** `npx turbo run lint` reports real results
5. **Step 5: Unit tests** — After Step 1 (need working build).
   - Create test files
   - **Verify:** `npx turbo run test` passes
6. **Step 6: Formatting** — Last step, after all code changes.
   - Create `.prettierignore`
   - Run `npx prettier --write .`
   - **Verify:** `npx prettier --check .` reports 0 issues
7. **Final verification:** `npx turbo run build typecheck lint test` — all green

## Identified Risks

| Risk                                                                          | Impact | Mitigation                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Removing `composite: true` from apps breaks `tsc -b`                          | medium | Change build script from `tsc -b && vite build` to `tsc && vite build`. The `tsc` (no `-b`) step is only for type-checking before Vite builds; Vite doesn't use TS for bundling.                                                                                                                  |
| Missing `references` cause "not listed within the file list" errors           | medium | Double-check dependency graph. Each package must reference ALL workspace packages it imports from. The `lib` package imports `@zan-vn/vn-engine` but doesn't declare it in `package.json` — must add both reference and dependency.                                                               |
| `import.meta.env` fix with vite/client types pollutes lib types               | low    | Adding `"types": ["vite/client"]` to lib's tsconfig adds Vite-specific types. Acceptable because `lib` is only used in Vite apps (client, dashboard). Alternative: use `/// <reference types="vite/client" />` in the file itself.                                                                |
| ESLint may surface pre-existing warnings beyond build errors                  | low    | Run `eslint --fix` and commit auto-fixes. Configure rules to `"warn"` initially to avoid blocking CI.                                                                                                                                                                                             |
| `uuidSchema.parse()` throws on invalid UUID, breaking existing error handling | low    | The catch block already returns 500 for unhandled errors. If we want 400 for invalid UUIDs specifically, wrap with try/catch and return 400. However, Express's 500 fallback is acceptable for now — the key fix is making TypeScript happy. Consider wrapping in a try/catch for UX improvement. |
| Prettier reformats 112+ files, causing large diff                             | low    | Run prettier as a separate final commit to keep the diff reviewable per step.                                                                                                                                                                                                                     |
| Root paths removal may break IDE navigation                                   | low    | Keep `paths` in root tsconfig for now (Vite needs them for `resolve.alias`). The `references` field is what fixes TS6059/TS6307. Remove paths only if they cause conflicts.                                                                                                                       |

## Post-Implementation Verification

- [ ] `npx turbo run build` exits 0 with zero TS6059/TS6307/TS2769/TS6133/TS2339 errors
- [ ] `npx turbo run typecheck` exits 0 across all 7 packages
- [ ] `npx turbo run lint` runs real ESLint (not placeholder echo)
- [ ] `npx turbo run test` passes with at least 2 test files
- [ ] `npx prettier --check .` reports 0 formatting issues
- [ ] Changes are consistent with monorepo conventions (project references, ESLint flat config)
- [ ] All acceptance criteria from issue #3 are met
