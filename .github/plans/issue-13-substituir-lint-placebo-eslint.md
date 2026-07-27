# Implementation Plan — Issue #13

**Issue:** [#13](https://github.com/zan-ia/zan-visual-novel/issues/13) — improve: substituir lint placebo por ESLint real em todos os pacotes
**Type:** improvement
**Complexity:** low
**Date:** 2026-07-26

## Summary

Replace the `echo 'lint ok'` placebo lint scripts in 4 packages with real `eslint src/` calls, leveraging the existing root flat config (`eslint.config.mjs`). Fix the `no-namespace` error in `auth.ts` by allowing declarations in the ESLint rule config (the Express `declare global { namespace Express {...} }` is a standard pattern). Fix `no-explicit-any` warnings in `assets.routes.ts` by changing the catch clause from `err: any` to `err: unknown` with proper type narrowing. After these changes, `turbo run lint` should pass for all 7 packages.

## Files to Modify/Create

| File                                      | Action | Description                                                                                       |
| ----------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `apps/client/package.json`                | MODIFY | Change lint script from `echo 'lint ok'` to `eslint src/`                                         |
| `apps/dashboard/package.json`             | MODIFY | Change lint script from `echo 'lint ok'` to `eslint src/`                                         |
| `packages/shared/package.json`            | MODIFY | Change lint script from `echo 'lint ok'` to `eslint src/`                                         |
| `packages/ui/package.json`                | MODIFY | Change lint script from `echo 'lint ok'` to `eslint src/`                                         |
| `eslint.config.mjs`                       | MODIFY | Add `allowDeclarations: true` to `no-namespace` rule to fix the Express augmentation pattern      |
| `backend/api/src/routes/assets.routes.ts` | MODIFY | Replace `catch (err: any)` with `catch (err: unknown)` and add proper type guard for error access |

## Patterns to Follow

- **Existing ESLint packages** — `packages/lib`, `packages/vn-engine`, `backend/api` already use `"lint": "eslint src/"` successfully.
- **No local eslint configs** — all packages share the root `eslint.config.mjs` flat config (ESLint v10 finds it automatically). No per-package eslint configs are needed.
- **Hoisted eslint** — all packages rely on `eslint` + `typescript-eslint` hoisted from root `package.json` devDependencies.
- **Turbo pipeline** — the `lint` task in `turbo.json` already has `"dependsOn": ["^build"]`, so dependencies will be built before linting each package.

## Implementation Order

1. **Update `eslint.config.mjs`** — add `allowDeclarations: true` to the `no-namespace` rule configuration. This allows `declare namespace` blocks (needed for Express type augmentation) while still forbidding regular namespaces.
2. **Fix `assets.routes.ts`** — change `catch (err: any)` to `catch (err: unknown)` with proper type narrowing for `err.code` and `err.message` access.
3. **Replace placebo lint in 4 packages** — update each `package.json`:
   - `apps/client/package.json`
   - `apps/dashboard/package.json`
   - `packages/shared/package.json`
   - `packages/ui/package.json`
4. **Run `turbo run lint`** — verify all 7 packages pass cleanly.

## Identified Risks

| Risk                                                                                         | Impact | Mitigation                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New lint errors found in the 4 placebo packages                                              | Low    | Errors will be surfaced by `turbo run lint`. The root config uses `warn` for `no-explicit-any` and `no-unused-vars`, so only real errors (from recommended ruleset) will fail the pipeline.                                            |
| `packages/shared` has compiled `.d.ts` files alongside `.ts` source — eslint might lint them | Low    | The root eslint config already ignores `**/dist/**` and `**/node_modules/**`. The `.d.ts` files are in `src/` so they may be linted — but they are declaration files and should pass. If issues arise, add them to the ignore pattern. |
| `packages/ui` uses `@xyflow/react` which may have complex types triggering warnings          | Low    | Warnings won't fail the pipeline. Only errors from the recommended ruleset (e.g., `no-namespace`, `no-unsafe-*`) would block.                                                                                                          |

## Post-Implementation Verification

- [ ] `turbo run lint` passes for all 7 packages (exit code 0)
- [ ] `apps/client` lint runs `eslint src/` (not `echo`)
- [ ] `apps/dashboard` lint runs `eslint src/` (not `echo`)
- [ ] `packages/shared` lint runs `eslint src/` (not `echo`)
- [ ] `packages/ui` lint runs `eslint src/` (not `echo`)
- [ ] `backend/api/src/middleware/auth.ts` has no `no-namespace` error
- [ ] `backend/api/src/routes/assets.routes.ts` has no `no-explicit-any` warnings
