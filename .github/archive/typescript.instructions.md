---
name: "TypeScript"
description: "TypeScript conventions for the SvelteKit landing page project. Use when: writing or editing .ts files, adding type definitions, or working with SvelteKit TypeScript configuration."
applyTo: "src/**/*.ts"
---

# TypeScript — SvelteKit Conventions

## Project Configuration

- `tsconfig.json` extends `./.svelte-kit/tsconfig.json`
- `strict: true` — all strict checks active
- `moduleResolution: "bundler"` — modern module resolution
- `rewriteRelativeImportExtensions: true` — imports without `.ts` extension
- `esModuleInterop: true` — CommonJS module compatibility

## Import Rules

```typescript
// ✅ Correct — no file extension
import { base } from '$app/paths';
import type { PageData } from './$types';

// ✅ Correct — $lib alias maps to src/lib/
import { something } from '$lib/index';

// ❌ Wrong — .ts extensions in import
import { something } from '$lib/index.ts';
```

## Types and Interfaces

```typescript
// ✅ Prefer interface for public objects, type for unions/utilities
interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

type ServiceCategory = 'web' | 'ai' | 'media' | 'automation';

// ✅ Always type function props and returns
function buildServiceUrl(category: ServiceCategory, id: string): string {
  return `/services/${category}/${id}`;
}

// ❌ Wrong — explicit any (avoid)
function process(data: any): any { ... }
```

## Declaration Files

- `src/app.d.ts` — global SvelteKit app declarations
- Keep domain-specific types close to the code that uses them
- Use `declare global` only in `app.d.ts`

## General Conventions

1. **ALWAYS** use `strict` types — no unnecessary `any`
2. **ALWAYS** define return types on exported functions
3. **NEVER** add `// @ts-ignore` or `// @ts-nocheck` without explicit justification
4. **ALWAYS** use `import type` for type-only imports
5. **ALWAYS** use optional chaining (`?.`) and nullish coalescing (`??`) for potentially null values
