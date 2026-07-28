# Implementation Plan — Issue #46

**Issue:** [#46](https://github.com/zan-ia/zan-visual-novel/issues/46) — feat: build Asset Manager UI in dashboard
**Type:** feature
**Complexity:** medium
**Date:** 2026-07-27
**Branch:** `feat/asset-manager-ui`

## Summary

Build a full Asset Manager page in the dashboard with upload (drag & drop + button), grid view with thumbnails/metadata, preview modal, delete with confirmation, and asset-to-scene association in the VN editor.

## Files to Modify/Create

| File                                              | Action | Description               |
| ------------------------------------------------- | ------ | ------------------------- |
| `apps/dashboard/src/pages/assets-page.tsx`        | CREATE | Main asset manager page   |
| `apps/dashboard/src/App.tsx`                      | MODIFY | Add /assets route         |
| `apps/dashboard/src/components/studio-layout.tsx` | MODIFY | Add "Assets" sidebar link |
| `packages/lib/src/api-client.ts`                  | MODIFY | Add asset API methods     |
| `apps/dashboard/src/styles/global.css`            | MODIFY | Asset grid/preview styles |

## Implementation Order

### Step 1: API Client Methods (`packages/lib/src/api-client.ts`)

Add typed methods:

- `getAssets(type?: string): Promise<ApiResponse<Asset[]>>` — list user's assets
- `uploadAsset(file: File, onProgress?: (pct: number) => void): Promise<ApiResponse<Asset>>` — upload with progress
- `deleteAsset(id: string): Promise<ApiResponse<void>>` — delete asset
- `getAssetUrl(id: string): string` — get public URL for asset

### Step 2: Assets Page (`apps/dashboard/src/pages/assets-page.tsx`)

Create full page with:

- **Upload zone:** drag & drop area + "Upload" button, progress bar, file type/size validation (50MB, image/audio/video)
- **Filter bar:** type filter (Todos/Imagens/Áudio/Vídeo), sort by date/name
- **Asset grid:** thumbnail for images, icon for audio/video, name, type badge, size, date
- **Preview modal:** full-size image or audio player
- **Actions:** copy URL, delete with confirmation dialog
- **Empty state:** illustration + "Nenhum asset ainda" message

### Step 3: Route & Navigation

- Add `<Route path="/assets" element={<AssetsPage />} />` in App.tsx
- Add "Assets" sidebar link (FolderIcon) in studio-layout.tsx

### Step 4: CSS Styles

- Asset grid layout (CSS Grid, responsive)
- Upload zone (dashed border, hover state)
- Preview modal overlay

### Step 5: Build Verification

Run `npx turbo build --filter=@zan-vn/lib --filter=@zan-vn/dashboard`
