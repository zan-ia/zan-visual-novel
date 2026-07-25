---
description: "Use when: navigating the project structure, adding new files/directories, understanding the tech stack layout, or refactoring folder organization. Covers src/ structure, build conventions, naming, and dependency rules."
applyTo: "src/**"
---

# Project Organization — SvelteKit

## 1. Directory Structure

```
[project-name]/
├── src/                            # 🔧 Source (SvelteKit)
│   ├── app.html                    # HTML template (fonts, meta tags)
│   ├── app.d.ts                    # TypeScript types
│   ├── lib/
│   │   ├── app.css                 # Global CSS (design tokens + reset + utilities)
│   │   ├── index.ts                # Re-exports
│   │   └── components/             # Svelte components (each with scoped <style>)
│   │       ├── Header.svelte
│   │       ├── Hero.svelte
│   │       ├── Authority.svelte
│   │       ├── Solutions.svelte
│   │       ├── Differential.svelte
│   │       ├── Testimonials.svelte
│   │       ├── CTA.svelte
│   │       └── Footer.svelte
│   └── routes/
│       ├── +layout.js              # Config: prerender = true
│       ├── +layout.svelte          # Main layout (Header + Footer)
│       └── +page.svelte            # Home page (assembles all components)
├── static/                         # Static assets (copied to build/)
│   ├── robots.txt
│   └── assets/
│       └── images/                 # Images (reference as /assets/images/...)
├── build/                          # 🚀 Build output (generated, DO NOT version)
│   ├── index.html
│   ├── 404.html
│   └── _app/immutable/...          # Hashed JS/CSS
├── docs/                           # 📄 Institutional documentation
│   └── INSTITUCIONAL.md
├── .github/                        # Agents, skills, instructions, CI/CD
│   ├── agents/
│   ├── instructions/
│   ├── prompts/
│   ├── skills/
│   └── workflows/
│       └── deploy.yml              # Build + Deploy GitHub Pages
├── svelte.config.js                # SvelteKit + adapter-static config
├── vite.config.ts                  # Vite config
├── package.json                    # Dependencies and scripts
├── AGENTS.md                       # AI agent guidelines
└── README.md
```

### Directory Conventions

| Path | Purpose | Edit? |
|---------|-----------|---------|
| `src/lib/components/` | Svelte components (source) | ✅ Yes |
| `src/lib/app.css` | Global CSS (tokens + reset) | ✅ Yes |
| `src/routes/` | SvelteKit routes and layout | ✅ Yes |
| `src/app.html` | HTML template (meta, fonts) | ✅ Yes |
| `static/` | Static assets | ✅ Yes |
| `build/` | Production output (generated) | ❌ No |
| `docs/` | Institutional documentation | ✅ Yes |
| `.github/` | Agent system + CI/CD | ✅ Yes |

## 2. Tech Stack

| Layer | Technology |
|--------|-----------|
| **Framework** | SvelteKit 5 (Runes mode) |
| **Build** | Vite + `@sveltejs/adapter-static` |
| **Markup** | Svelte components with scoped CSS |
| **Styles** | Scoped `<style>` per component + global `app.css` |
| **Icons** | Google Material Symbols Outlined |
| **Typography** | Space Grotesk, Geist, JetBrains Mono (Google Fonts) |
| **Theme** | Dark mode (Material Design 3) |
| **Deploy** | GitHub Pages + GitHub Actions |
| **No Tailwind** | Vanilla CSS with design tokens |

## 3. Scripts

```bash
npm run dev       # Dev server at localhost:5173 (HMR)
npm run build     # Production build → build/
npm run preview   # Build preview (localhost:4173)
npm run check     # Type-check with svelte-check
```

## 4. Code Conventions

### Svelte Components (Runes Mode)
- `$state()` for reactive variables
- `$effect()` for side effects
- `$props()` for component props
- `bind:this={elementRef}` for DOM refs

### CSS
- Scoped `<style>` in each component (no conflicts)
- BEM-like classes: `component__element--modifier`
- Design tokens via `var(--color-*)`, `var(--font-*)`, `var(--spacing-*)`
- Single breakpoint: 768px (`@media (min-width: 768px)`)

### Dependency Rules (Import Direction)

```
src/lib/components/  ──import──▶  src/lib/  (app.css, index.ts)
src/lib/components/  ──import──▶  $lib/components/  (other components)
src/routes/          ──import──▶  $lib/components/  (✅ allowed)
src/lib/components/  ──import──▶  src/routes/       (❌ forbidden)
```

- **Components in `src/lib/components/` NEVER import routes (`src/routes/`)** — dependency is unidirectional
- **Routes import components**, never the reverse
- `app.css` is imported by the layout (`+layout.svelte`), not by individual components
- Components can import other components via `$lib/components/Name.svelte`

### Imports
```typescript
import Header from '$lib/components/Header.svelte';
import type { PageData } from './$types';
```

## 5. Section IDs

| ID | Component |
|----|-----------|
| `#hero` | `Hero.svelte` |
| `#solutions` | `Solutions.svelte` |
| `#authority` | `Authority.svelte` |
| `#differential` | `Differential.svelte` |
| `#testimonials` | `Testimonials.svelte` |
| `#contact` | `CTA.svelte` |

## 6. External Dependencies (CDN)

Only Google Fonts and Material Symbols (loaded via `src/app.html`):

| Resource | CDN | Justification |
|---------|-----|---------------|
| Google Fonts | `fonts.googleapis.com` | Space Grotesk, Geist, JetBrains Mono |
| Material Symbols | `fonts.googleapis.com` | Icons (Outlined) |

### When Adding a New Resource
1. Prefer local assets in `static/`
2. If CDN is unavoidable, add `rel="preconnect"` in `<head>`
3. Document in `AGENTS.md`

## 7. Limits and Constraints

| Aspect | Limit | Reason |
|---------|--------|--------|
| Build size | < 200kB (initial HTML+CSS+JS) | Core Web Vitals |
| Images | < 200kB each | LCP |
| CDN Dependencies | 2 (Google Fonts + Symbols) | Autonomy |
| Breakpoints | 1 (768px) | Simplicity |
| Components | < 300 lines each | Maintainability |
