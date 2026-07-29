---
description: 'Use when: navigating the project structure, adding new files/directories, understanding the tech stack layout, or refactoring folder organization. Covers src/ structure, build conventions, naming, and dependency rules.'
applyTo: 'src/**'
---

# Project Organization — React Monorepo

## 1. Directory Structure

```
zan-visual-novel/
├── apps/                           # 🎯 Application entry points
│   ├── client/                     # Player-facing SPA (React + Vite)
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── App.tsx             # Root component
│   │       ├── main.tsx            # Entry point
│   │       ├── theme.ts            # MUI theme
│   │       ├── components/         # App-specific components (layout.tsx)
│   │       ├── pages/              # Page components (player-page, library-page, login-page, profile-page)
│   │       ├── providers/          # Auth provider
│   │       └── styles/             # Global CSS (global.css)
│   └── dashboard/                  # Creator dashboard SPA (React + Vite)
│       ├── index.html
│       ├── vite.config.ts
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── theme.ts
│           ├── components/         # studio-layout.tsx
│           ├── pages/              # vn-editor-page, vn-list-page, analytics-page, login-page, assets-page
│           ├── providers/          # Auth provider
│           └── styles/             # Global CSS (global.css)
├── backend/
│   └── api/                        # 🖥️ Express API server
│       ├── Dockerfile
│       ├── drizzle.config.ts
│       ├── drizzle/                # Drizzle migrations
│       └── src/
│           ├── server.ts           # Express app setup + entry point
│           ├── db/                 # Schema, seed, DB connection
│           ├── lib/                # Redis, storage, LLM providers
│           ├── middleware/         # Auth, error-handler, rate-limiter
│           ├── routes/             # REST route handlers
│           └── types/              # TypeScript declaration files (express.d.ts)
├── packages/                       # 📦 Shared libraries
│   ├── shared/                     # Types, schemas, constants (no React dependency)
│   │   └── src/
│   │       ├── types.ts
│   │       ├── schemas.ts
│   │       ├── constants.ts
│   │       ├── types/              # Sub-modules
│   │       └── schemas/            # Zod schemas
│   ├── ui/                         # Shared React components
│   │   └── src/
│   │       ├── choice-panel.tsx
│   │       ├── empty-state.tsx
│   │       ├── scene-graph-view.tsx
│   │       ├── scene-renderer.tsx
│   │       ├── vn-card.tsx
│   │       └── styles/
│   ├── lib/                        # Shared React hooks + API client
│   │   └── src/
│   │       ├── api-client.ts
│   │       └── hooks/
│   └── vn-engine/                  # Visual Novel engine (framework-agnostic)
│       └── src/
│           ├── engine.ts
│           ├── llm-provider.ts
│           ├── types.ts
│           ├── providers/          # LLM provider implementations (cloud, local, worker)
│           └── __tests__/
├── scripts/                        # Utility scripts (cleanup, seeding, verification)
├── .github/                        # CI/CD, agents, skills, instructions
├── docker-compose.yml
├── turbo.json                      # Turborepo config
├── package.json                    # Root workspace config
├── tsconfig.json                   # Root TypeScript config
├── eslint.config.mjs               # Root ESLint config
└── README.md
```

### Directory Conventions

| Path                      | Purpose                             | Edit?  |
| ------------------------- | ----------------------------------- | ------ |
| `apps/client/src/`        | Player-facing SPA source            | ✅ Yes |
| `apps/dashboard/src/`     | Creator dashboard SPA source        | ✅ Yes |
| `backend/api/src/`        | Express API source                  | ✅ Yes |
| `packages/shared/src/`    | Shared types, schemas, constants    | ✅ Yes |
| `packages/ui/src/`        | Shared React UI components          | ✅ Yes |
| `packages/lib/src/`       | Shared React hooks + API client     | ✅ Yes |
| `packages/vn-engine/src/` | VN engine core (framework-agnostic) | ✅ Yes |
| `.github/`                | CI/CD, agents, skills, instructions | ✅ Yes |
| `dist/`, `node_modules/`  | Build output (generated)            | ❌ No  |

## 2. Tech Stack

| Layer               | Technology                                |
| ------------------- | ----------------------------------------- |
| **Frontend**        | React 19 + TypeScript + Vite              |
| **UI Library**      | Material UI (MUI) v6                      |
| **Backend**         | Express 5 + TypeScript                    |
| **Database**        | PostgreSQL + Drizzle ORM                  |
| **Cache**           | Redis (optional, graceful fallback)       |
| **Storage**         | Local filesystem or S3-compatible (MinIO) |
| **Auth**            | JWT (access + refresh tokens)             |
| **Build**           | Turborepo + Vite + tsc                    |
| **Testing**         | Vitest + Supertest                        |
| **Linting**         | ESLint 9 + Prettier                       |
| **Package Manager** | npm workspaces                            |
| **Monorepo**        | Turborepo                                 |
| **CSS**             | MUI `sx` prop + global CSS + MUI theme    |
| **Deploy**          | Vercel (frontend), Docker (backend)       |

## 3. Scripts

All scripts run from the project root via Turborepo:

```bash
npm run dev          # Dev servers (client + dashboard)
npm run dev:full     # All dev servers (client + dashboard + api)
npm run build        # Production build (all packages)
npm run test         # Run all tests
npm run lint         # ESLint check (all packages)
npm run format       # Prettier write
npm run format:check # Prettier check (CI gate)
npm run typecheck    # TypeScript check (all packages)
npm run db:seed      # Seed database
npm run clean        # Remove node_modules + build artifacts
```

## 4. Code Conventions

### React Components

- Functional components with hooks (no class components)
- `export function ComponentName()` for page/feature components
- Props typed inline or via interface
- MUI `sx` prop for styling (no separate CSS files at component level)
- Global styles in `styles/global.css`

### TypeScript

- Strict mode enabled (`tsconfig.json`)
- All public APIs typed explicitly
- Zod schemas in `packages/shared/src/schemas/` — single source of truth between frontend and backend
- Types in `packages/shared/src/types/` — shared domain models

### Dependency Rules (Import Direction)

```
apps/               ──import──▶  packages/          (✅ allowed)
packages/           ──import──▶  packages/shared    (✅ allowed)
packages/ui         ──import──▶  packages/shared    (✅ allowed)
packages/lib        ──import──▶  packages/shared    (✅ allowed)
packages/vn-engine  ──import──▶  packages/shared    (✅ allowed)
backend/api         ──import──▶  packages/shared    (✅ allowed)
packages/*          ──import──▶  apps/              (❌ forbidden)
apps/client         ──import──▶  apps/dashboard     (❌ forbidden)
```

- **Apps are leaf nodes** — nothing imports from them
- **shared is the foundation** — everything can import it, it imports nothing
- **UI packages import shared**, never the reverse
- **No circular dependencies**

### Imports

```typescript
// Shared types, schemas, constants
import type { Chapter, Scene, Choice } from '@zan-vn/shared';
import { createVNSchema } from '@zan-vn/shared';

// Shared UI components
import { VNCard, SceneRenderer, ChoicePanel, EmptyState } from '@zan-vn/ui';

// Shared hooks + API client
import { useAuth, useVN } from '@zan-vn/lib';

// VN Engine
import { VNEngine, createLocalLLMProvider } from '@zan-vn/vn-engine';
```

## 5. Package Naming

| Package              | npm Name            | Purpose                    |
| -------------------- | ------------------- | -------------------------- |
| `apps/client`        | `@zan-vn/client`    | Player SPA                 |
| `apps/dashboard`     | `@zan-vn/dashboard` | Creator dashboard          |
| `backend/api`        | `@zan-vn/api`       | Express API server         |
| `packages/shared`    | `@zan-vn/shared`    | Types, schemas, constants  |
| `packages/ui`        | `@zan-vn/ui`        | Shared React UI components |
| `packages/lib`       | `@zan-vn/lib`       | React hooks + API client   |
| `packages/vn-engine` | `@zan-vn/vn-engine` | VN engine core             |

## 6. Limits and Constraints

| Aspect       | Limit                              | Reason              |
| ------------ | ---------------------------------- | ------------------- |
| Build size   | < 500kB per chunk (Vite warns)     | Core Web Vitals     |
| Dependencies | No new packages without discussion | Bundle size control |
| API routes   | REST (OpenAPI planned — see #51)   | Consistency         |
| Auth         | JWT in Authorization header        | Stateless           |
| Environment  | 12-factor: config from env vars    | Portability         |
