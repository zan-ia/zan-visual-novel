---
name: "Svelte 5 Runes"
description: "Svelte 5 Runes mode conventions for .svelte files. Use when: writing or editing Svelte components, using reactivity, props, effects, or derived values."
applyTo: "src/**/*.svelte"
---

# Svelte 5 Runes — Conventions

All Svelte components use **Runes mode** (Svelte 5). Do not use Svelte 4 patterns (`export let`, `onMount`, `onDestroy`, reactive `$:`).

## Required Runes

### `$props()` — Component Props

```svelte
<!-- ✅ Correct -->
<script lang="ts">
  let { title, items = [], variant = "default" } = $props();
</script>

<!-- ❌ Wrong (Svelte 4 legacy) -->
<script lang="ts">
  export let title: string;
  export let items: any[] = [];
</script>
```

### `$state()` — Reactive State

```svelte
<!-- ✅ Correct -->
<script lang="ts">
  let isOpen = $state(false);
  let activeIndex = $state(0);
</script>

<!-- ❌ Wrong -->
<script lang="ts">
  let isOpen = false;  // not reactive without $state
</script>
```

### `$derived()` — Computed Values

```svelte
<!-- ✅ Correct -->
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<!-- ❌ Wrong -->
<script lang="ts">
  let count = 0;
  $: doubled = count * 2;  // Svelte 4 legacy
</script>
```

### `$effect()` — Side Effects

```svelte
<!-- ✅ Correct — always with cleanup when needed -->
<script lang="ts">
  $effect(() => {
    const handler = () => console.log('scroll');
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  });
</script>

<!-- ❌ Wrong (Svelte 4 legacy) -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  onMount(() => {
    window.addEventListener('scroll', handler);
  });
  onDestroy(() => {
    window.removeEventListener('scroll', handler);
  });
</script>
```

## Golden Rules

1. **NEVER** use `export let` — always `$props()`
2. **NEVER** use `onMount` / `onDestroy` — use `$effect()` with cleanup return
3. **NEVER** use `$:` reactive statements — use `$derived()` or `$effect()`
4. **ALWAYS** return the cleanup function in `$effect()` when registering listeners, timers, or subscriptions
5. **ALWAYS** use `<script lang="ts">` — TypeScript is mandatory in components
6. **ALWAYS** use `{base}` from `$app/paths` for asset references: `src="{base}/assets/images/..."`

## Imports

```svelte
<script lang="ts">
  import { base } from '$app/paths';           // for assets
  import { page } from '$app/stores';           // for route data (if needed)
</script>
```

## Scoped CSS

Each component has its own `<style>` with Svelte's automatic scoping. Use:
- Design tokens: `var(--color-*)`, `var(--font-*)`, `var(--spacing-*)`
- BEM-like naming: `component__element--modifier`
- Media queries for responsiveness (768px breakpoint)
