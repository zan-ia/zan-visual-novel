# Implementation Plan — Issue #21

**Issue:** [#21](https://github.com/zan-ia/zan-visual-novel/issues/21) — VNCard sem estilos CSS e grid da biblioteca quebrada
**Type:** bug
**Complexity:** medium
**Date:** 2026-07-27

## Summary

Two-part fix for unstyled VNCard and broken grid layout. The root cause is: (1) the `VNCard` component in `packages/ui/src/vn-card.tsx` renders a full BEM class structure (`.vn-card`, `.vn-card__cover`, `.vn-card__info`, etc.) but **no CSS exists** for any of these classes — cards appear as invisible text on dark background; (2) `library-page.tsx` and `vn-list-page.tsx` use `<Box sx={{ gridColumn }}>` inside `<Grid container>`, but MUI `Grid` is **flexbox-based**, not CSS Grid — `gridColumn` has no effect, breaking the responsive layout at all breakpoints.

The fix introduces complete CSS for VNCard using the existing design tokens, replaces the flexbox-breaking `gridColumn` pattern with MUI v6 `Grid2`'s native `size` prop, and replaces the emoji placeholder with a Material Symbols icon.

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `packages/ui/src/vn-card.tsx` | MODIFY | Replace 📖 emoji placeholder with MUI `BookIcon`; add `@mui/icons-material` as peer dependency; fix `meta` div rendering when tags and price are both absent |
| `packages/ui/package.json` | MODIFY | Add `@mui/material` and `@mui/icons-material` as peer dependencies (currently undeclared but used at runtime via hoisting) |
| `apps/client/src/styles/global.css` | MODIFY | Add complete `.vn-card` CSS block with all BEM classes, hover/focus states, and responsive image handling |
| `apps/client/src/pages/library-page.tsx` | MODIFY | Fix 2 occurrences of `<Box sx={{ gridColumn }}>` inside `<Grid>` — replace with `<Grid size={{...}}>` using `Grid2` API; update Grid import |
| `apps/dashboard/src/pages/vn-list-page.tsx` | ⏭️ SCOPE | **Deferido para #26** — mesma correção de grid, PR separado |

## CSS Specification for VNCard

The following CSS must be added to `apps/client/src/styles/global.css` (after the existing `.vn-text` block):

```css
/* ── VN Card ──────────────────────────────────────────── */

.vn-card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.vn-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(124, 77, 255, 0.15);
  border-color: rgba(124, 77, 255, 0.3);
}

.vn-card:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.3);
}

.vn-card__cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.vn-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vn-card__cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--color-text-dim);
  background: rgba(124, 77, 255, 0.08);
}

.vn-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px 16px;
  flex: 1;
}

.vn-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.vn-card__author {
  font-size: 0.8125rem;
  color: var(--color-text-dim);
  margin: 0;
}

.vn-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
}

.vn-card__tags {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vn-card__price {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-secondary);
  white-space: nowrap;
}

.vn-card__price--free {
  color: #4caf50;
}
```

**Why these values:**
- `--color-surface` for card background — matches MUI `paper` token and existing design system
- `border-radius: 12px` — matches MUI `shape.borderRadius` from `theme.ts` (line ~25)
- `rgba(255, 255, 255, 0.06)` border — subtle card separation on dark surface, not harsh
- `translateY(-4px)` + `rgba(124, 77, 255, 0.15)` shadow on hover — elevation feedback using primary color
- `:focus-visible` ring using `var(--color-primary)` — keyboard accessibility per WCAG 2.1
- `aspect-ratio: 16/9` — consistent cover frame regardless of image dimensions
- `-webkit-line-clamp: 2` on title — prevents long titles from breaking layout
- `margin-top: auto` on `.vn-card__meta` — pushes metadata to bottom of info area, ensuring consistent card heights in a row

## Grid Fix Specification

### Problem
Both `library-page.tsx` and `vn-list-page.tsx` use this anti-pattern:
```tsx
<Grid container spacing={3}>
  {items.map(item => (
    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}>
      {/* content */}
    </Box>
  ))}
</Grid>
```

MUI `Grid` (classic) is **flexbox-based**. The `gridColumn` CSS property is ignored by flexbox — it only works in CSS Grid layouts. The items collapse into a single row or wrap unpredictably.

### Fix
Replace with MUI `Grid2` (available as `@mui/material/Grid2` in MUI v6+), which is CSS Grid-based and supports the `size` prop:

**Library page (2 occurrences):**
- Loading skeleton: `<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>`
- VN list: `<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>`

**Dashboard page (2 occurrences) — ⏭️ Deferido para #26:**
- Loading skeleton: `<Grid size={{ xs: 12, sm: 6, md: 4 }}>`
- VN list: `<Grid size={{ xs: 12, sm: 6, md: 4 }}>`

**Import change (both files):**
- Remove `Grid` from `import { ... } from '@mui/material'`
- Add `import Grid from '@mui/material/Grid2';`

**Remove unnecessary wrapper:** Each item should be `<Grid>` directly (no `<Box>` wrapper). The content becomes the `children` of `<Grid>`.

### Before → After comparison

**Before (library-page.tsx):**
```tsx
<Grid container spacing={3}>
  {filtered.map((vn) => (
    <Box key={vn.id} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' } }}>
      <VNCard vn={vn} empty={vn.totalChapters === 0} onClick={handleCardClick} />
    </Box>
  ))}
</Grid>
```

**After:**
```tsx
<Grid container spacing={3}>
  {filtered.map((vn) => (
    <Grid key={vn.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <VNCard vn={vn} empty={vn.totalChapters === 0} onClick={handleCardClick} />
    </Grid>
  ))}
</Grid>
```

**Same pattern for loading skeletons** — both pages.

## Patterns to Follow

- **BEM CSS naming:** follow the existing `.vn-scene`, `.vn-text` block naming convention in `global.css`. VNCard already uses BEM classes — the CSS just needs to be written.
- **Design tokens:** use `var(--color-*)` CSS variables defined in `:root` of `global.css` — do NOT hardcode hex values for colors that have a token.
- **CSS transitions:** follow the same `0.2s ease` timing used in other hover effects in the project.
- **Grid2 API:** MUI v6 `Grid2` uses `size` instead of `xs/sm/md/lg` props. The `container` prop is the same. The `spacing` prop works identically.
- **Icon import:** follow the existing `BookIcon` import pattern in `library-page.tsx:5` (`import BookIcon from '@mui/icons-material/MenuBook'`).
- **Dependency hoisting:** `@mui/material` and `@mui/icons-material` are currently used by `@zan-vn/ui` without being declared — this is already the case for `Chip` (from `@mui/material`). We formalize this by adding them as `peerDependencies`.

## Implementation Order

1. **`packages/ui/package.json`** — Add `@mui/material` and `@mui/icons-material` as peerDependencies (formalizes existing implicit dependency)
2. **`packages/ui/src/vn-card.tsx`** — Replace 📖 emoji with `<BookIcon sx={{ fontSize: 48 }} />`, add import, wrap in a styled container
3. **`apps/client/src/styles/global.css`** — Add complete `.vn-card` CSS block (see specification above)
4. **`apps/client/src/pages/library-page.tsx`** — Fix Grid import and both gridColumn occurrences
5. **Build verification** — Run `npm run build` (or equivalent) to ensure no type errors

## Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `Grid2` might not be available in the installed MUI v6.x version | Medium — could break dev server | Verify `@mui/material` version is ^6.0.0. Grid2 is available since MUI v6 beta. If using MUI v5, fall back to classic Grid with `item` + `xs/sm/md/lg` props |
| `@mui/icons-material` not hoisted correctly in monorepo | Medium — could cause module-not-found at runtime | Adding as peerDependency ensures proper resolution. Also run `npm install` after package.json change |
| Dashboard grid fix **deferido para #26** — mesma correção estrutural do Grid2/size | Low — risco gerenciado via escopo separado | Issue #26 já documenta o mesmo padrão de correção |
| VNCard `Chip` import from `@mui/material` already works via hoisting — adding formal peerDep is a no-op for the app | Low — no functional change, just explicit declaration | Verify `@mui/material` is already a dep of `@zan-vn/client` (it is, per `package.json`) |

## Post-Implementation Verification

- [ ] Project build/lint passes without errors
- [ ] VNCard renders with visible card background, border, shadow, and border-radius
- [ ] Cover image maintains 16:9 aspect ratio; placeholder icon is centered when no coverUrl
- [ ] Card hover shows translateY elevation + primary-colored shadow
- [ ] Card focus-visible shows primary-colored ring
- [ ] Card title is clamped to 2 lines; meta row is pushed to bottom of info area
- [ ] Library grid shows 1 column on xs, 2 on sm, 3 on md, 4 on lg (no horizontal overflow)
- [ ] ~~Dashboard grid shows 1 column on xs, 2 on sm, 3 on md~~ (deferido para #26)
- [ ] Loading skeletons match the same grid layout
- [ ] No `gridColumn` or `span` leftovers in either page file
- [ ] Console is free of MUI Grid deprecation warnings
