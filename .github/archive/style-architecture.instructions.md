---
description: "Use when: designing new visual components, defining CSS patterns, choosing design tokens, or ensuring visual consistency across Svelte components. Covers glass-panel, gradients, grid layouts, badges, section headers, and typography patterns."
applyTo: "src/**"
---

# Style Architecture — SvelteKit Patterns

## 1. Design Token System

Defined in `src/lib/app.css`. Based on **Material Design 3** (dark mode).

### Color Palette

> **Single source:** `src/lib/app.css` — all tokens are defined there. Do not duplicate values.

See `src/lib/app.css` for the full list. Key tokens:

| Token | Typical Use |
|-------|-----------|
| `--color-primary` / `--color-primary-container` | Highlights, icons, badges |
| `--color-surface` / `--color-surface-container` | Card/section backgrounds |
| `--color-surface-container-lowest` | Page background (`html`, `body`) |
| `--color-background` | Alternative background |
| `--color-on-surface` | Main text |
| `--color-outline` / `--color-outline-variant` | Borders |

### How to Use in Components

```svelte
<style>
  .solutions__card {
    background: var(--color-surface-container);
    border: 1px solid var(--color-outline-variant);
  }
  .solutions__card-title {
    color: var(--color-on-surface);
    font-family: var(--font-display);
  }
  .solutions__card-desc {
    color: var(--color-on-surface);
    opacity: 0.7;
  }
</style>
```

### Standard Opacities

| Use | Opacity | CSS |
|-----|-----------|-----|
| Main text | 100% | `color: var(--color-on-surface)` |
| Secondary text | 70% | `opacity: 0.7` |
| Tertiary text | 50% | `opacity: 0.5` |
| Subtle border | 10% | `border-color: rgba(186,242,255,0.1)` |
| Badge bg | 10-20% | `background: rgba(186,242,255,0.2)` |

## 2. Glass Panel Pattern

Globally defined in `src/lib/app.css`:

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(186, 242, 255, 0.1);
  border-radius: var(--radius-lg);
}
```

### Usage in components

```svelte
<!-- Service card -->
<div class="solutions__card glass-panel">
  <span class="material-symbols-outlined solutions__icon">smart_toy</span>
  <h3 class="solutions__card-title">Title</h3>
  <p class="solutions__card-desc">Description</p>
</div>

<!-- Testimonial card -->
<div class="testimonial__card glass-panel">
  <div class="testimonial__stars">...</div>
  <p class="testimonial__text">...</p>
</div>
```

## 3. Gradient Pattern

```css
/* Primary gradient (icons, badges) */
background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));

/* Surface gradient (section backgrounds) */
background: linear-gradient(
  to bottom,
  var(--color-surface),
  var(--color-surface-container),
  var(--color-surface)
);

/* Glow gradient (hero, highlights) */
background: radial-gradient(
  ellipse at 50% 0%,
  rgba(186, 242, 255, 0.15) 0%,
  transparent 60%
);
```

## 4. Grid Layout Pattern (Scoped CSS)

```css
/* Mobile-first: 1 column */
.solutions__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-gutter);
}

/* Desktop: 3 columns */
@media (min-width: 768px) {
  .solutions__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Grids by Component

| Component | Mobile | Desktop |
|-----------|--------|---------|
| Solutions | 1 col | 3 cols |
| Authority | 1 col | 3 cols |
| Differential | 1 col | 2 cols |
| Testimonials | horizontal scroll | horizontal scroll |

## 5. Badge / Tag Pattern

```svelte
<span class="solutions__badge">
  AI Agents
</span>

<style>
  .solutions__badge {
    display: inline-block;
    padding: 4px 16px;
    border-radius: var(--radius-full);
    background: rgba(186, 242, 255, 0.1);
    color: var(--color-primary);
    font-size: var(--font-size-label-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid rgba(186, 242, 255, 0.2);
  }
</style>
```

## 6. Section Header Pattern

```svelte
<div class="testimonials__header">
  <h2 class="testimonials__title">What our partners say</h2>
  <p class="testimonials__subtitle">Stories of digital transformation.</p>
</div>

<style>
  .testimonials__header {
    text-align: center;
    margin-bottom: 64px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .testimonials__title {
    font-family: var(--font-display);
    font-size: var(--font-size-headline-lg);
    color: var(--color-on-surface);
  }
  .testimonials__subtitle {
    font-family: var(--font-body);
    font-size: var(--font-size-body-md);
    color: var(--color-on-surface);
    opacity: 0.7;
  }
</style>
```

## 7. Typography Pattern

| Element | Font Token | Size Token | Weight |
|----------|-------------|---------------|------|
| Hero title (h1) | `--font-display` | `--font-size-display-lg` | 700 |
| Section title (h2) | `--font-display` | `--font-size-headline-lg` | 600 |
| Subtitle | `--font-body` | `--font-size-body-md` | 400 |
| Card title (h3) | `--font-display` | `--font-size-headline-md` | 500 |
| Body | `--font-body` | `--font-size-body-md` | 400 |
| Code/data | `--font-code` | `--font-size-code-md` | 400 |
| Badge | `--font-code` | `--font-size-label-sm` | 500 |

## 8. Icon Pattern (Material Symbols)

```svelte
<span class="material-symbols-outlined">star</span>

<style>
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
</style>
```

<!-- Ícone em wrapper com gradiente -->
<div class="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center">
  <span class="material-symbols-outlined text-3xl text-[var(--color-on-primary)]">icon_name</span>
</div>

<!-- Ícone como link social -->
<a href="..." target="_blank" rel="noopener noreferrer" class="glass-panel rounded-xl p-3 hover:scale-110 transition-transform">
  <span class="material-symbols-outlined text-2xl">lang</span>
</a>
```

### Icon Sizes

| Class | Size | Use |
|--------|---------|-----|
| `text-xl` | 20px | Inline with text |
| `text-2xl` | 24px | Icon wrapper |
| `text-3xl` | 30px | Large wrapper (services) |
| `text-4xl` | 40px | Hero / highlight |

## 9. Section Composition (Template)

```
┌─────────────────────────────────────────┐
│  Gradient/Glow Background (absolute)    │
├─────────────────────────────────────────┤
│  ┌─ max-w-6xl mx-auto ──────────────┐  │
│  │  ┌─ text-center ──────────────┐   │  │
│  │  │  Badge                      │   │  │
│  │  │  H2 Title                   │   │  │
│  │  │  P subtitle                 │   │  │
│  │  └─────────────────────────────┘   │  │
│  │                                     │  │
│  │  ┌─ grid grid-cols-1 md:grid-* ─┐  │  │
│  │  │  ┌─── glass-panel ───┐       │  │  │
│  │  │  │  Icon             │       │  │  │
│  │  │  │  H3 Title         │       │  │  │
│  │  │  │  P description    │       │  │  │
│  │  │  └───────────────────┘       │  │  │
│  │  │  ... (more cards)            │  │  │
│  │  └───────────────────────────────┘  │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 10. Visual Consistency Checklist

- [ ] `glass-panel` used for cards and containers
- [ ] Colors use `var(--color-*)` — no hard-coded values
- [ ] Typography follows the font/weight/size table
- [ ] Badges follow the `bg-primary/10` + `border-primary/20` pattern
- [ ] Material Symbols icons with gradient wrapper (services) or glass (social)
- [ ] Responsive grids: `grid-cols-1 md:grid-cols-N`
- [ ] Section header with badge + h2 + p, centered, `max-w-3xl`
- [ ] Hover animations: `scale-[1.02]` + `shadow` on cards
- [ ] Vertical padding: `py-24` on sections
- [ ] Centered content with `max-w-6xl mx-auto`
