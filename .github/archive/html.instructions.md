---
description: "Use when: creating or editing Svelte components, writing markup in .svelte files, adding ARIA attributes, ensuring semantic HTML5 structure, or updating src/app.html meta tags. Covers accessibility, headings hierarchy, images, and links."
applyTo: "src/**/*.svelte, src/app.html"
---

# HTML Rules and Patterns — SvelteKit

## 1. Semantic Structure

Use semantic HTML5 elements in Svelte components. Avoid `<div>` when a semantic element exists.

```svelte
<!-- ✅ Correct — +layout.svelte -->
<header>
  <nav aria-label="Main navigation">...</nav>
</header>
<main>
  <slot />
</main>
<footer>...</footer>

<!-- ✅ Correct — +page.svelte -->
<section id="hero" aria-label="Main hero">...</section>
<section id="solutions" aria-labelledby="solutions-title">...</section>

<!-- ❌ Wrong -->
<div class="header">...</div>
<div class="main">...</div>
```

### Element Hierarchy

| Element | When to Use | Component |
|----------|-------------|------------|
| `<header>` | Top of page | `Header.svelte` |
| `<nav>` | Main navigation | `Header.svelte` |
| `<main>` | Unique content (1 per page) | `+layout.svelte` |
| `<section>` | Groups thematic content | Each component |
| `<article>` | Independent content | Testimonial cards |
| `<footer>` | Footer | `Footer.svelte` |

## 2. Headings

- **A single `<h1>`** per page (in `Hero.svelte`)
- Headings in hierarchical order, without skipping levels

```svelte
<!-- ✅ Correct -->
<!-- Hero.svelte -->
<h1 class="hero__title">Company Name — Slogan</h1>

<!-- Solutions.svelte -->
<h2 class="solutions__title">Our Solutions</h2>

<!-- Solution card -->
<h3 class="solutions__card-title">AI Agents</h3>
```

## 3. Accessibility (ARIA)

```svelte
<!-- ✅ Navigation with role and label -->
<nav aria-label="Main navigation">
  <a href="/#hero" aria-current="page">Home</a>
  <a href="/#solutions">Solutions</a>
</nav>

<!-- ✅ Button with aria-label (no visible text) -->
<button aria-label="Open menu" class="header__menu-btn">
  <span class="material-symbols-outlined">menu</span>
</button>

<!-- ✅ Carousel with ARIA -->
<div
  class="testimonials__carousel"
  role="group"
  aria-roledescription="carousel"
  aria-label="Testimonials"
  tabindex="0"
>
  <div
    class="testimonial__card"
    role="group"
    aria-roledescription="slide"
    aria-label="Testimonial 1 of 6"
  >
    ...
  </div>
</div>

<!-- ✅ aria-live region for dynamic announcements -->
<div class="sr-only" aria-live="polite" aria-atomic="true">
  {liveRegionText}
</div>
```

### Accessibility Checklist

- [ ] `<html lang="pt-BR">` in `src/app.html`
- [ ] Interactive elements focusable via keyboard
- [ ] Images with descriptive `alt` (`alt=""` for decorative)
- [ ] Minimum contrast 4.5:1 (text) / 3:1 (large text)
- [ ] `aria-label` on buttons without visible text
- [ ] `aria-current="page"` on active link
- [ ] Carousel with `aria-roledescription`, `aria-label` per slide
- [ ] `aria-live` for dynamically changing content

## 4. Meta Tags (src/app.html)

Mandatory order in `<head>`:

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>[COMPANY NAME] | [Slogan]</title>
<meta name="description" content="[Company description]">

<!-- Open Graph -->
<meta property="og:title" content="[COMPANY NAME]">
<meta property="og:description" content="[Description]">
<meta property="og:image" content="/assets/images/og-image.jpg">
<meta property="og:url" content="[SITE URL]">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">

<!-- Icons -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Preconnects for CDNs -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- SvelteKit head placeholder -->
%sveltekit.head%
```

## 5. Images

```svelte
<!-- ✅ Decorative image with lazy loading -->
<img
  src="/assets/images/solucoes.webp"
  alt=""
  loading="lazy"
  width="800"
  height="600"
  decoding="async"
>

<!-- ✅ Hero (above the fold) with fetchpriority -->
<img
  src="/assets/images/hero.webp"
  alt="[Company Name] — [Slogan]"
  fetchpriority="high"
  width="1200"
  height="630"
  decoding="async"
>
```

### Rules
- `width` + `height` always explicit (prevents CLS)
- `loading="lazy"` for below-the-fold images
- `fetchpriority="high"` only on hero (1 per page)
- Descriptive `alt` for functional images, `alt=""` for decorative
- Assets in `static/assets/images/`, referenced as `/assets/images/...`
- `srcset` + `sizes` for art-direction or multiple resolutions (when applicable):

```svelte
<img
  src="/assets/images/solucoes.webp"
  srcset="/assets/images/solucoes-400.webp 400w,
          /assets/images/solucoes-800.webp 800w,
          /assets/images/solucoes-1200.webp 1200w"
  sizes="(max-width: 768px) 100vw, 800px"
  alt=""
  loading="lazy"
  width="800"
  height="600"
  decoding="async"
>
```
- Modern formats: WebP (default), AVIF (when available, with `<picture>` and fallback)

## 6. Links and Navigation

```svelte
<!-- ✅ Internal link with anchor -->
<a href="/#solutions">Solutions</a>

<!-- ✅ External link with security attributes -->
<a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
  Contact Us
</a>

<!-- ✅ CTA como link, não como div clicável -->
<a href="https://wa.me/5511999999999" class="cta__button glass-panel">
  Iniciar Projeto
</a>
```

### Regras
- Links externos `target="_blank"` **devem** ter `rel="noopener noreferrer"`
- CTA principal deve ser `<a>` com `href`, não `<button>` ou `<div>`
- Nav links usam `href` para seções (`/#id`), não `javascript:void(0)`

## 7. Svelte Templates Específicos

### Componente com slot (layout)
```svelte
<!-- +layout.svelte -->
<script>
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<Header />
<main>
  <slot />
</main>
<Footer />
```

### Página que monta componentes
```svelte
<!-- +page.svelte -->
<script>
  import Hero from '$lib/components/Hero.svelte';
  import Solutions from '$lib/components/Solutions.svelte';
</script>

<Hero />
<Solutions />
```

### bind:this para refs
```svelte
<script lang="ts">
  let carouselEl = $state<HTMLElement>();
</script>

<div bind:this={carouselEl}>
  <!-- conteúdo -->
</div>
```

### Each com itens
```svelte
{#each testimonials as t, i}
  <div class="testimonial__card glass-panel"
       role="group"
       aria-roledescription="slide"
       aria-label={`Depoimento ${i + 1} de ${total}`}
  >
    <p>{t.text}</p>
  </div>
{/each}
```

## 8. Comentários e Organização

```svelte
<!-- ════════════════════════════════════════════ -->
<!-- NOME_DA_SEÇÃO — Descrição breve -->
<!-- ════════════════════════════════════════════ -->
<section class="nome-secao" aria-label="...">
  ...
</section>
```
    placeholder="seu@email.com"
  >

  <button type="submit">Enviar</button>
</form>
```

### Regras
- Todo `<input>` precisa de `<label>` associado (via `for`/`id`)
- Use `autocomplete` para campos comuns (name, email, tel)
- `required` para campos obrigatórios
- `type="email"`, `type="tel"`, `type="url"` para validação nativa
- `novalidate` no form + validação JS customizada (se aplicável)

## 8. Injeção de CSS e JS no HTML

```html
<!-- ✅ CSS: tags <style> no <head> -->
<style>
  /* estilos */
</style>

<!-- ✅ Fontes e CDNs no <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- ✅ JS: scripts no final do <body> -->
<script>
  /* JavaScript */
</script>
```

### Regras
- `<style>` no `<head>` (performance)
- `<script>` no final do `<body>` (não bloqueia renderização)
- `preconnect` para origins de terceiros (Google Fonts, CDNs)
- `display=swap` em Google Fonts
- Evite CSS inline em elementos (`style="..."`) — prefira classes ou `<style>`

## 9. Estrutura de Página (Ordem)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>...</title>
  <meta name="description" content="...">
  <!-- Open Graph -->
  <!-- Twitter Card -->
  <!-- Preconnects -->
  <!-- Google Fonts / CDN CSS -->
  <link rel="stylesheet" href="...">
  <!-- Estilos inline -->
  <style>/* ... */</style>
</head>
<body>
  <header><!-- Nav --></header>
  <main>
    <section id="hero"><!-- ... --></section>
    <section id="solutions"><!-- ... --></section>
    <section id="testimonials"><!-- ... --></section>
  </main>
  <footer><!-- ... --></footer>
  <script>/* JS */</script>
</body>
</html>
```
