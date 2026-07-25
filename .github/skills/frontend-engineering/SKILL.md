---
name: frontend-engineering
description: "Reference knowledge for frontend engineering — UI architecture, state management, accessibility, performance, and modern web best practices. Use when: designing UI components, managing application state, optimizing frontend performance, ensuring accessibility, or reviewing frontend code. Activates for: ui, ux, frontend, component, state management, accessibility, a11y, performance, spa, ssr, web."
user-invocable: true
disable-model-invocation: false
context: fork
---

# Frontend Engineering — Reference Knowledge

Reference for building modern, accessible, performant user interfaces. This is a **knowledge skill** — it provides reference, not a workflow.

---

## 1. UI Architecture

### Component design

- **Single responsibility**: one component, one job
- **Composition over inheritance**: small components composed together
- **Props down, events up**: unidirectional data flow
- **Container vs Presentational**: container handles data, presentational handles UI
- **Slots/children**: for content injection

### State management

| State type            | Where it lives                                 | Examples                    |
| --------------------- | ---------------------------------------------- | --------------------------- |
| **Local**             | Component state                                | Form field value, toggle    |
| **Shared (siblings)** | Parent or store                                | Modal open/close, theme     |
| **Route**             | Router                                         | Current page, params        |
| **Server cache**      | Cache library (TanStack Query, SWR, RTK Query) | API responses               |
| **Global app**        | Global store (Redux, Zustand, Pinia)           | User session, feature flags |
| **URL**               | Query string / path                            | Search query, filter        |

### State management libraries

| Library            | Style                  | Best for                       |
| ------------------ | ---------------------- | ------------------------------ |
| **Redux / RTK**    | Centralized, immutable | Large apps, strict patterns    |
| **Zustand**        | Lightweight, mutable   | Medium apps, less boilerplate  |
| **Jotai**          | Atomic (per-key)       | Fine-grained reactivity        |
| **MobX**           | Observable             | OOP-style, minimal boilerplate |
| **Pinia**          | Composition API        | Vue.js apps                    |
| **TanStack Query** | Server cache only      | API data fetching/caching      |
| **Svelte stores**  | Built-in, simple       | Svelte apps                    |

### Render strategies

- **CSR** (Client-Side Rendering): render in browser (SPA default)
- **SSR** (Server-Side Rendering): render on server, hydrate in browser
- **SSG** (Static Site Generation): pre-render at build time
- **ISR** (Incremental Static Regeneration): pre-render, revalidate on demand
- **PPR** (Partial Prerendering): hybrid (React 19+)
- **RSC** (React Server Components): render on server, ship minimal JS

## 2. Accessibility (a11y)

### WCAG principles (POUR)

- **Perceivable**: content is presented in ways users can perceive
- **Operable**: interface is operable (keyboard, mouse, touch, voice)
- **Understandable**: content and operation are understandable
- **Robust**: works with assistive technologies

### Key practices

- **Semantic HTML**: use the right element (`<button>`, `<nav>`, `<main>`, `<article>`)
- **Headings hierarchy**: h1 → h2 → h3, no skipping
- **Alt text**: describe content images, `alt=""` for decorative
- **Labels**: every form control has a visible label
- **Focus management**: visible focus indicator, logical tab order
- **Keyboard**: everything works without a mouse
- **Color contrast**: WCAG AA = 4.5:1 normal text, 3:1 large text
- **ARIA**: only when HTML can't express the semantics
- **Live regions**: `aria-live="polite"` for status updates
- **Skip links**: "skip to main content" for screen reader users

### Testing a11y

- **Automated**: axe-core, Lighthouse, Pa11y
- **Manual**: keyboard navigation, screen reader (NVDA, VoiceOver)
- **User testing**: people with disabilities

## 3. Performance

### Core Web Vitals

| Metric                              | Target | What it measures    |
| ----------------------------------- | ------ | ------------------- |
| **LCP** (Largest Contentful Paint)  | <2.5s  | Loading performance |
| **INP** (Interaction to Next Paint) | <200ms | Interactivity       |
| **CLS** (Cumulative Layout Shift)   | <0.1   | Visual stability    |

### Optimization techniques

**Loading:**

- `loading="lazy"` on below-fold images
- `fetchpriority="high"` on hero/above-fold
- `<link rel="preload">` for critical resources
- `font-display: swap` for web fonts
- Code splitting / route-based lazy loading
- Defer non-critical JS

**Runtime:**

- `transform` and `opacity` for animations (compositor-only)
- `will-change` only during active interaction
- `contain: layout style paint` on isolated regions
- Virtualize long lists (react-window, vue-virtual-scroller)
- Memoize expensive components
- `requestAnimationFrame` for visual updates

**Assets:**

- WebP/AVIF for images
- SVG for icons
- Inline critical CSS
- Tree-shake unused code
- Compress (gzip, brotli)

## 4. Styling

### Methodologies

| Approach          | Pros                      | Cons                        |
| ----------------- | ------------------------- | --------------------------- |
| **CSS Modules**   | Local, no global          | File-per-component overhead |
| **Tailwind**      | Fast to write, consistent | Verbose, learning curve     |
| **CSS-in-JS**     | Scoped, dynamic           | Runtime cost, complex setup |
| **BEM**           | Simple, no build step     | Verbose, no scoping         |
| **Design tokens** | Centralized theming       | Requires discipline         |

### Design tokens

Store as CSS custom properties for theming:

```css
:root {
  --color-primary: #0066cc;
  --spacing-md: 16px;
  --radius-md: 8px;
  --font-body: system-ui, sans-serif;
}

[data-theme="dark"] {
  --color-primary: #66aaff;
}
```

## 5. Forms

- **Labels above inputs** (or beside, but always visible)
- **Validation on blur** (not on every keystroke)
- **Show errors near the field**, with `aria-describedby`
- **Disable submit while pending** (no double-submit)
- **Preserve user input on error** (don't clear the form)
- **Use native validation first** (`type="email"`, `required`, `pattern`)
- **Use `autocomplete`** for common fields

## 6. Forms Validation Patterns

- **Optimistic updates**: assume success, rollback on error
- **Pessimistic**: wait for server response
- **Debounced validation**: wait for user to stop typing
- **Server-side validation**: always required (client is for UX only)

## 7. State Synchronization

When client state and server state diverge:

- **Source of truth**: server is authoritative
- **Optimistic updates**: update UI, rollback on conflict
- **Conflict resolution**: last-write-wins, or merge with user input
- **Background sync**: when online, sync offline changes

## 8. Security

- **XSS prevention**: never `innerHTML` untrusted content; use framework escaping
- **CSRF**: tokens for state-changing requests
- **CSP** (Content Security Policy): restrict script sources
- **HTTPS only**: no mixed content
- **Don't store secrets in JS**: use backend or environment
- **Subresource Integrity**: `integrity` attribute on `<script>`/`<link>`

## 9. Common Frontend Anti-Patterns

| Anti-pattern             | Symptom                         | Fix                                  |
| ------------------------ | ------------------------------- | ------------------------------------ |
| Prop drilling            | Passing props through 5+ levels | Use context, store, or slots         |
| God component            | One component does everything   | Split by responsibility              |
| Inline styles everywhere | Unmaintainable CSS              | Use CSS files, modules, or tokens    |
| No error boundaries      | One error crashes the app       | Add error boundaries                 |
| Fetch in render          | Infinite re-renders             | Use effects or data fetching library |
| Memory leaks             | Event listeners not removed     | Clean up in useEffect return         |
| Layout shift             | Content jumps while loading     | Reserve space, set dimensions        |
| No loading state         | Blank screen during fetch       | Show skeletons/spinners              |

## 10. When to Apply This Skill

Load this skill when:

- Designing UI components
- Choosing state management approach
- Optimizing page load or runtime performance
- Auditing accessibility
- Reviewing frontend code
- Planning component architecture
- Debugging layout or rendering issues

For project-specific styling and component conventions, consult `.github/instructions/`.
