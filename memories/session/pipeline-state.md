# Pipeline State — #40 Prettier CI

**Issue:** #40 — fix: ensure Prettier format check passes in CI for all packages  
**Branch:** `fix/prettier-ci`  
**Plan:** `.github/plans/issue-40-prettier-ci.md`  
**Complexity:** Low  
**Status:** Planning complete, ready for implementation

## Files to modify (10)

1. `apps/client/package.json` — add format/format:fix scripts
2. `apps/dashboard/package.json` — add format/format:fix scripts
3. `backend/api/package.json` — add format/format:fix scripts
4. `packages/lib/package.json` — add format/format:fix scripts
5. `packages/shared/package.json` — add format/format:fix scripts
6. `packages/ui/package.json` — add format/format:fix scripts
7. `packages/vn-engine/package.json` — add format/format:fix scripts
8. `turbo.json` — add format task
9. `.github/workflows/ci.yml` — add format job
10. `.prettierignore` — add build/, .next/, coverage/
