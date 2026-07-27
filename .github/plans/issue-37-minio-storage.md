# Implementation Plan — Issue #37

**Issue:** [#37](https://github.com/zan-ia/zan-visual-novel/issues/37) — feat: migrate asset storage from local disk to S3/R2 with MinIO for dev
**Type:** feature
**Complexity:** medium
**Date:** 2026-07-27

## Summary

The branch `feat/minio-storage` already contains the core S3-compatible storage service (`StorageService` in `storage.ts`), MinIO service in `docker-compose.yml`, and updated `assets.routes.ts` using `multer.memoryStorage()`. Three refinements remain: (1) refactor `storage.ts` to use a Strategy Pattern with `IStorageProvider` interface, `S3StorageProvider`, and `LocalStorageProvider` — controlled by `STORAGE_PROVIDER=local|s3` env var; (2) wire MinIO into the API container via `depends_on` and environment variables in `docker-compose.yml`; (3) update Vite dev proxy configs to serve assets through MinIO instead of local `/uploads`.

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `backend/api/src/lib/storage.ts` | MODIFY | Refactor to Strategy Pattern: add `IStorageProvider` interface, rename `StorageService` → `S3StorageProvider`, add `LocalStorageProvider`, add `STORAGE_PROVIDER` env var switch in `getStorage()` |
| `backend/api/src/routes/assets.routes.ts` | MODIFY | Update `storage.upload()` call to work with new `IStorageProvider` interface (signature change: `upload(file, filename, mimeType)` → returns `{ url: string }`) |
| `backend/api/src/server.ts` | MODIFY | Simplify startup: remove try/catch wrapping `ensureBucket()` (only S3 provider needs it); keep `express.static('/uploads')` only for `local` provider |
| `docker-compose.yml` | MODIFY | Add `minio` to API service's `depends_on`; pass `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL` env vars to API container |
| `apps/client/vite.config.ts` | MODIFY | Change `/uploads` proxy to point to MinIO URL (`http://localhost:9000`) instead of API server |
| `apps/dashboard/vite.config.ts` | MODIFY | Same proxy change as client |
| `.env.docker` | MODIFY | Add MinIO/S3 variables: `MINIO_PORT`, `MINIO_CONSOLE_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL`, `STORAGE_PROVIDER` |
| `backend/api/src/__tests__/storage.test.ts` | CREATE | Unit tests for `LocalStorageProvider` and `S3StorageProvider` |

## Patterns to Follow

- **Strategy Pattern** — Current `storage.ts` uses a singleton `StorageService`. Refactor to:
  - `IStorageProvider` interface with `{ upload(file, filename, mimeType): Promise<{ url: string }> }` and `{ delete(url): Promise<void> }`
  - `S3StorageProvider` implements `IStorageProvider` (rename existing `StorageService`)
  - `LocalStorageProvider` implements `IStorageProvider` (writes to `backend/api/uploads/`)
  - `getStorage()` factory reads `STORAGE_PROVIDER` env var and returns the correct implementation
- **Existing code reference** — The current `StorageService` class structure (constructor, upload, delete, getPublicUrl, ensureBucket) should be preserved in `S3StorageProvider`
- **Env var convention** — Follow existing `.env.example` pattern (already documents S3 vars). Add `STORAGE_PROVIDER=local|s3` with default `s3`
- **Docker compose pattern** — Follow existing services pattern (environment, depends_on, networks)

## Implementation Order

1. **Refactor `backend/api/src/lib/storage.ts`**
   - Add `IStorageProvider` interface
   - Rename existing `StorageService` → `S3StorageProvider`, implement `IStorageProvider`
   - Create `LocalStorageProvider` implementing `IStorageProvider`
   - Update `getStorage()` to switch on `STORAGE_PROVIDER` env var
   - Keep `resetStorage()` for tests

2. **Update `backend/api/src/routes/assets.routes.ts`**
   - Adjust `storage.upload()` call to match new interface (may need to adapt if signature changed)

3. **Update `backend/api/src/server.ts`**
   - Keep `ensureBucket()` call only for S3 provider path; the factory already handles this
   - Keep `express.static('/uploads')` as fallback for local provider

4. **Update `docker-compose.yml`**
   - Add `minio` to API service `depends_on`
   - Pass S3 env vars to API service environment
   - Add `STORAGE_PROVIDER=s3` to API service environment (default for docker)

5. **Update `apps/client/vite.config.ts` and `apps/dashboard/vite.config.ts`**
   - Change `/uploads` proxy target from `http://localhost:3001` to `http://localhost:9000` (MinIO API port)

6. **Update `.env.docker`**
   - Add MinIO and S3 environment variables

7. **Create `backend/api/src/__tests__/storage.test.ts`**
   - Test `LocalStorageProvider` (write file, read back, delete)
   - Test `S3StorageProvider` with mocked S3Client (vi.spy/mock)
   - Test `getStorage()` factory with different `STORAGE_PROVIDER` values

8. **Run project build/lint to verify**

## Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Backwards compatibility** | Medium — Existing code in `assets.routes.ts` calls `storage.upload(key, buffer, mimeType)` returning `string`; new interface may change signature | Keep `upload()` return as `string` key but also provide `getPublicUrl()` method; adapt `assets.routes.ts` to construct URL using `getPublicUrl()` |
| **MinIO bucket auto-creation** | Low — `ensureBucket()` already implemented and called on startup | Verify MinIO healthcheck passes before API starts (`depends_on` with condition) |
| **Local provider untested** | Medium — No existing local storage fallback | Create `LocalStorageProvider` with full test coverage |
| **Vite proxy change breaks local dev without Docker** | Medium — If developer runs without Docker, `/uploads` won't work | Keep `STORAGE_PROVIDER=local` as option; proxy stays unchanged when using local provider |

## Post-Implementation Verification

- [ ] `npm run dev` starts without errors (both with Docker and without)
- [ ] `docker compose up -d` starts MinIO, bucket is auto-created
- [ ] Upload asset via API → file appears in MinIO console (`http://localhost:9001`)
- [ ] `storageUrl` in DB points to `http://localhost:9000/zan-vn-assets/assets/<uuid>.<ext>`
- [ ] Asset preview loads in browser (image loads from MinIO URL)
- [ ] `STORAGE_PROVIDER=local` — upload saves to `backend/api/uploads/` and serves via Express static
- [ ] Project build/lint passes without errors
