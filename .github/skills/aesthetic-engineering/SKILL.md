---
name: aesthetic-engineering
description: "Reference knowledge for visual design and aesthetic engineering — design systems, color theory, typography, layout principles, motion design, and brand consistency. Use when: creating or reviewing visual designs, choosing colors and typography, designing layouts, defining motion, or establishing design systems. Activates for: design, visual, ui design, ux design, typography, color, layout, motion, animation, brand, design system, style guide."
user-invocable: true
disable-model-invocation: false
context: fork
---

# Aesthetic Engineering — Reference Knowledge

Reference for visual design quality and consistency. This is a **knowledge skill** — it provides reference, not a workflow.

---

## 1. Design Systems

A design system is a collection of reusable components, guided by clear standards, that can be assembled to build any number of applications.

### Token hierarchy

```
Primitive tokens: --color-blue-500, --font-size-16
       ↓
Semantic tokens: --color-primary, --font-body
       ↓
Component tokens: --button-bg (uses --color-primary)
       ↓
Component styles: .button { background: var(--button-bg) }
```

### What to include

- **Colors**: palette, semantic roles (primary, success, warning, error), dark mode
- **Typography**: font families, scale (display, heading, body, code), weights, line heights
- **Spacing**: scale (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- **Sizing**: component heights, max widths
- **Radii**: none, sm, md, lg, full
- **Shadows**: elevation levels (1-5)
- **Motion**: durations, easings
- **Breakpoints**: sm, md, lg, xl
- **Z-index scale**: layering system

## 2. Color Theory

### Color systems

- **HEX**: `#0066cc` — common, no alpha
- **RGB**: `rgb(0, 102, 204)`
- **RGBA**: `rgba(0, 102, 204, 0.8)` — for transparency
- **HSL/HSLA**: `hsl(210, 100%, 40%)` — intuitive for variation
- **OKLCH**: perceptually uniform, modern (CSS Color Level 4)
- **Color-mix()**: blend two colors (`color-mix(in oklch, blue 50%, white)`)

### Color schemes

- **Monochromatic**: single hue, vary lightness/saturation
- **Analogous**: adjacent hues on the color wheel
- **Complementary**: opposite hues
- **Triadic**: three evenly-spaced hues
- **Tetradic**: four hues forming a rectangle
- **Split-complementary**: base + two adjacent to complement

### Accessibility (WCAG contrast)

- **AA normal text**: 4.5:1
- **AA large text** (18pt+ or 14pt bold): 3:1
- **AAA normal text**: 7:1
- **AAA large text**: 4.5:1
- **UI components**: 3:1 (icons, form borders)

Tools: WebAIM Contrast Checker, Stark, Polypane

### Color in code

```css
:root {
  /* Primitive palette */
  --blue-500: #0066cc;
  --gray-900: #111827;

  /* Semantic roles */
  --color-primary: var(--blue-500);
  --color-text: var(--gray-900);

  /* Dark mode */
  [data-theme="dark"] {
    --color-primary: #66aaff;
    --color-text: #f3f4f6;
  }
}
```

## 3. Typography

### Type scale

Use a modular scale (e.g., 1.125, 1.25, 1.333, 1.5) to derive sizes:

```css
--font-size-xs: 0.75rem; /* 12px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem; /* 36px */
```

### Line height

- **Body text**: 1.5–1.7
- **Headings**: 1.1–1.3
- **Tight UI**: 1.2

### Font weight

- **Body**: 400 (regular)
- **Emphasis**: 600 (semibold)
- **Headings**: 600–700
- **Avoid**: weights below 400 for body text (hard to read)

### Font families

- **System fonts**: `system-ui, sans-serif` (fastest, native feel)
- **Web fonts**: Google Fonts, self-hosted
- **Variable fonts**: one file, many weights (smaller payload)
- **Pairings**: serif heading + sans body, or display + neutral

### Web font loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=..." />
```

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.woff2") format("woff2");
  font-display: swap;
}
```

## 4. Layout

### Composition principles

- **Rule of thirds**: divide into 3x3, place key elements on intersections
- **Golden ratio** (~1.618): aesthetically pleasing proportions
- **Visual hierarchy**: most important = most prominent
- **White space** (negative space): empty areas that frame content
- **F-pattern** (text-heavy): users scan horizontally then vertically
- **Z-pattern** (visual): users scan in a Z shape

### Grids

- **12-column grid**: most flexible for responsive
- **16-column grid**: finer control
- **8pt grid**: everything aligns to 8px increments
- **Container max-widths**: sm 640, md 768, lg 1024, xl 1280, 2xl 1536

### Common layout patterns

- **F-pattern layouts**: blog, docs
- **Z-pattern layouts**: landing pages, marketing
- **Card-based**: content, dashboards
- **Masonry**: variable-height content (Pinterest-style)
- **Magazine**: asymmetric, image-heavy
- **Holy grail**: header + sidebar + main + sidebar + footer

## 5. Spacing & Rhythm

- **8pt grid**: all spacing is a multiple of 8
- **Half-step (4pt)**: for fine adjustments
- **Consistent padding**: 16, 24, 32px for cards
- **Vertical rhythm**: consistent line height + vertical margins

## 6. Elevation & Depth

- **Flat**: no shadow (modern, minimal)
- **Subtle**: small shadow for cards
- **Material**: layered shadows for depth
- **Neumorphism**: soft inner/outer shadows (controversial)

Shadow example (Material-style):

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
```

## 7. Motion Design

### Principles

- **Purposeful**: motion should communicate, not decorate
- **Quick**: 100-300ms for most UI
- **Easing**: ease-out for entry, ease-in for exit, ease-in-out for state change
- **Natural**: mimic physics (spring, bounce, deceleration)
- **Respect accessibility**: `prefers-reduced-motion`

### Easing

- `ease-in`: slow start, fast end (acceleration)
- `ease-out`: fast start, slow end (deceleration) — most UI entry
- `ease-in-out`: slow both ends
- `cubic-bezier(0.4, 0, 0.2, 1)`: Material standard
- Spring: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`

### Properties to animate

- **Compositor-only** (fast): `transform`, `opacity`, `filter`
- **Avoid animating**: `width`, `height`, `top`, `left`, `margin` (causes layout)

### Transitions

```css
.button {
  transition:
    transform 150ms ease-out,
    background-color 200ms ease-out;
}
```

## 8. Iconography

- **Consistent style**: outline, filled, duotone, etc. — pick one
- **Consistent size**: 16, 20, 24, 32px
- **Pixel grid**: align to pixels at 1x
- **Optical alignment**: visually centered, not mathematically
- **Source**: Heroicons, Lucide, Phosphor, Material Symbols

## 9. Imagery

- **Format**: WebP/AVIF for photos, SVG for icons/logos
- **Responsive**: serve different sizes for different screens
- **Lazy loading**: `loading="lazy"` for below-fold
- **Aspect ratio**: always set to prevent CLS
- **Alt text**: describe content, empty for decorative

## 10. Common Visual Anti-Patterns

| Anti-pattern               | Fix                                            |
| -------------------------- | ---------------------------------------------- |
| **Inconsistent spacing**   | Use 4pt/8pt grid; use spacing tokens           |
| **Too many colors**        | Limit to 5-7 in palette; use semantic roles    |
| **Wall of text**           | Use hierarchy, subheadings, lists, white space |
| **Inconsistent alignment** | Use grid; align to common baseline             |
| **Unreadable text**        | Check contrast (WCAG AA)                       |
| **Jarring transitions**    | Use consistent easing, duration                |
| **Cluttered layout**       | Group related items; use white space           |
| **Color as only signal**   | Add icon, text, or pattern (accessibility)     |

## 11. When to Apply This Skill

Load this skill when:

- Reviewing visual design
- Choosing colors, fonts, spacing
- Building a design system
- Establishing design tokens
- Reviewing component consistency
- Deciding on motion / interaction
- Diagnosing visual issues

For project-specific style, consult `.github/instructions/`.
