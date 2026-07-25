---
description: "Use when: writing or reviewing CSS in Svelte components, creating new components with scoped styles, or modifying src/lib/app.css. Covers design tokens, scoped CSS conventions, BEM naming, responsive breakpoints, and animation best practices."
applyTo: "src/**/*.svelte, src/lib/app.css"
---

# CSS Rules and Patterns — SvelteKit

## 1. Design Tokens (CSS Variables)

Always use the CSS variables defined in `src/lib/app.css`. Never use hard-coded values for colors, fonts, or spacing.

```css
/* ✅ Correct */
color: var(--color-on-surface);
background: var(--color-surface-container);
font-family: var(--font-body);

/* ❌ Wrong */
color: #e0e0e0;
background: #1e1e2e;
font-family: 'Geist', sans-serif;
```

### Available Tokens (Material Design 3 — Dark Mode)

| Category | Tokens |
|-----------|--------|
| **Primary Colors** | `--color-primary`, `--color-primary-container`, `--color-on-primary`, `--color-on-primary-container` |
| **Surface Colors** | `--color-surface`, `--color-surface-dim`, `--color-surface-container`, `--color-surface-container-lowest`, `--color-background`, `--color-on-surface` |
| **Secondary Colors** | `--color-secondary`, `--color-secondary-container`, `--color-on-secondary` |
| **Tertiary Colors** | `--color-tertiary`, `--color-tertiary-container`, `--color-on-tertiary-container` |
| **Error Colors** | `--color-error`, `--color-on-error` |
| **Border Colors** | `--color-outline`, `--color-outline-variant` |
| **Typography** | `--font-display` (Space Grotesk), `--font-body` (Geist), `--font-code` (JetBrains Mono) |
| **Font Sizes** | `--font-size-display-lg`, `--font-size-headline-lg`, `--font-size-headline-md`, `--font-size-body-lg`, `--font-size-body-md`, `--font-size-label-sm`, `--font-size-code-md` |
| **Line Heights** | `--line-height-display-lg`, `--line-height-headline-lg`, `--line-height-body-md` |
| **Spacing** | `--spacing-xs` (4px), `--spacing-sm` (8px), `--spacing-md` (16px), `--spacing-lg` (24px), `--spacing-xl` (32px), `--spacing-2xl` (48px), `--spacing-gutter` (24px), `--spacing-margin-mobile` (16px), `--spacing-margin-desktop` (64px) |
| **Borders** | `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (16px), `--radius-xl` (24px), `--radius-full` (9999px) |
| **Shadows** | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-glow-primary`, `--shadow-glow-primary-hover`, `--shadow-whatsapp` |

## 2. Scoped CSS (Style per Component)

Each Svelte component has its own `<style>` with automatic scoping. **Do not** put styles from one component in another component's file.

```svelte
<!-- ✅ Correct — styles inside the component itself -->
<script lang="ts">
  // component logic
</script>

<div class="hero">
  <h1 class="hero__title">Title</h1>
</div>

<style>
  .hero {
    padding: 96px var(--spacing-margin-mobile);
  }
  .hero__title {
    font-family: var(--font-display);
    font-size: var(--font-size-display-lg);
    color: var(--color-on-surface);
  }
</style>
```

### What goes in `src/lib/app.css` (global)
- Design tokens (`:root { ... }`)
- Basic reset (`*`, `html`, `body`)
- Reusable utility classes (`.glass-panel`, `@keyframes` animations)

### What goes in the component `<style>`
- Component-specific styles
- Layout, colors, typography for that component
- Component-exclusive animations

## 3. Class Naming (BEM-like)

Use the **component__element--modifier** pattern with kebab-case.

```css
/* ✅ Correct */
.testimonials__carousel { }
.testimonial__card { }
.testimonial__star { }
.testimonials__dot--active { }
.hero__title { }
.solutions__grid { }

/* ❌ Wrong */
.testimonialsCarousel { }
.testimonial-card { }
.heroTitle { }
```

### Prefixes by Component

| Component | Prefix | Example |
|-----------|---------|---------|
| **Header** | `.header__*` | `.header__nav`, `.header__logo` |
| **Hero** | `.hero__*` | `.hero__title`, `.hero__cta` |
| **Solutions** | `.solutions__*` | `.solutions__grid`, `.solutions__card` |
| **Authority** | `.authority__*` | `.authority__counter` |
| **Differential** | `.differential__*` | `.differential__item` |
| **Testimonials** | `.testimonials__*` / `.testimonial__*` | `.testimonial__card` |
| **CTA** | `.cta__*` | `.cta__button` |
| **Footer** | `.footer__*` | `.footer__link` |

## 4. Glass Panel (Global Component)

Defined in `src/lib/app.css`:

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(186, 242, 255, 0.1);
  border-radius: var(--radius-lg);
}
```

Use the `.glass-panel` class in Svelte components:

```svelte
<div class="testimonial__card glass-panel">
  <!-- content -->
</div>
```

## 5. Media Queries and Responsiveness

Single breakpoint at **768px** (mobile). Mobile-first: write for mobile and use `@media (min-width: 768px)` for desktop.

```css
/* Mobile (default) */
.solutions__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-gutter);
}

/* Desktop */
@media (min-width: 768px) {
  .solutions__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 6. Animations

Define global `@keyframes` in `src/lib/app.css`. Component-specific animations in the component `<style>`.

```css
/* In app.css — global animations */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
```

### Guidelines
- Duration: 300ms (micro), 500ms (entrance), 2-6s (loops)
- Timing: `ease-out` for entrances, `ease-in-out` for loops
- **Always** respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- Animate only `transform` and `opacity` (composited properties)
- `will-change` use sparingly, only during active interaction
- `contain` to isolate visual subtrees in grids/cards: `contain: layout style paint` (optimizes rendering)
- `content-visibility: auto` for below-the-fold sections (speeds up initial paint)

## 7. Specificity

Keep specificity low. Svelte's scoped CSS already adds a unique hash, preventing conflicts.

```css
/* ✅ Correct — direct class */
.hero__cta { }

/* ❌ Avoid — unnecessary nesting */
section .hero .hero__container .hero__cta { }
```

### Prohibitions

| ❌ Practice | Reason | Alternative |
|-----------|--------|-------------|
| **Tailwind CSS** | The project uses vanilla CSS with design tokens | Use BEM classes + `var(--color-*)`, `var(--spacing-*)` |
| **`!important`** | Violates the cascade and hinders maintenance | Increase specificity with class selectors. Only exception: `prefers-reduced-motion` |
| **Hex hardcoded** | Misaligns with MD3 theme and breaks dark mode | Always use `var(--color-*)`. Exception: `rgba()` for opacity in glass/overlays |

## 8. Icons (Material Symbols)

```svelte
<span class="material-symbols-outlined">star</span>
```

Use `font-variation-settings` to control weight/fill:
```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

## 9. Validation

- [ ] No hard-coded color values (always use `var(--color-*)`)
- [ ] No `!important` (except in utility overrides)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Images with explicit `width`/`height`
- [ ] Fonts with `font-display: swap`
- [ ] Styles in the correct component (no leaking between components)
- [ ] Global `@keyframes` only in `app.css`
