# Handoff — Roadmap v2: Análise de Gaps e Próximos Passos

**Data:** 2026-07-26  
**De:** Análise de Roadmap  
**Para:** Pipeline de Desenvolvimento (Orchestrator → Planner → Implementer → Reviewer)  
**Propósito:** Documentar o estado atual vs roadmap, identificar gaps críticos, e definir a ordem de execução para a POC.

---

## Resumo Executivo

O projeto implementou **~70% do roadmap original**, mas com distribuição muito desigual:

| Milestone                 | Progresso | Status            |
| ------------------------- | --------- | ----------------- |
| **M0 — Organizacional**   | 0%        | ❌ Nada feito     |
| **M1 — Fundação**         | 90%       | ✅ Quase completo |
| **M2 — Player MVP**       | 100%      | ✅ Completo       |
| **M3 — IA Integration**   | ~20%      | 🔴 Crítico        |
| **M4 — Economy & Polish** | ~15%      | 🟡 Pendente       |

A **ordem recomendada** para a POC é: **M0 → M1 → M3 → M4**, pois:

1. M0 desbloqueia organização do trabalho (milestones, labels)
2. M1 fecha débitos técnicos (Redis, S3)
3. M3 é o diferencial competitivo do produto (IA local)
4. M4 é necessário só quando houver conteúdo e usuários

---

## 0. M0 — Organizacional (Setup Inicial)

**Estado atual:** Nada criado no GitHub.

| Item                   | Descrição                                                                                                                                                                                                   | Prioridade |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 🏷️ **Milestones**      | Criar M1, M2, M3, M4 como milestones no GitHub                                                                                                                                                              | Must       |
| 📌 **Project Board**   | Criar GitHub Project com colunas: Backlog, To Do, In Progress, Done                                                                                                                                         | Should     |
| 🏷️ **Labels**          | Criar labels customizadas: `area:infra`, `area:backend`, `area:client`, `area:dashboard`, `area:engine`, `area:ia`, `area:economy`, `priority:critical`, `priority:high`, `priority:medium`, `priority:low` | Should     |
| 📦 **Release**         | Criar release `v0.1.0-poc` ao finalizar todos os itens abaixo                                                                                                                                               | Could      |
| 📋 **Issue templates** | Atualizar templates para usar milestones e labels do projeto                                                                                                                                                | Should     |

### Ação Imediata

```bash
# Criar milestones
gh api repos/zan-ia/zan-visual-novel/milestones -f title="M1 — Fundação" -f description="Infraestrutura base: Redis, S3, débitos" -f due_on="2026-08-15T00:00:00Z"
gh api repos/zan-ia/zan-visual-novel/milestones -f title="M2 — Player MVP" -f description="Completo — manter para referência" -f due_on="2026-08-01T00:00:00Z" -f state=closed
gh api repos/zan-ia/zan-visual-novel/milestones -f title="M3 — IA Integration" -f description="IA narrativa local + cloud fallback" -f due_on="2026-09-15T00:00:00Z"
gh api repos/zan-ia/zan-visual-novel/milestones -f title="M4 — Economy & Polish" -f description="Créditos, Stripe, Admin, PWA, testes" -f due_on="2026-10-30T00:00:00Z"
```

> **Nota:** M2 já está completo — o milestone pode ser criado como `closed` para referência histórica.

---

## 1. M1 — Fundação (Débitos Técnicos)

**Estado atual:** Monorepo, shared, DB schema, auth, CI/CD completos. ESLint PR #13 foi merged recentemente.

### 1.1 🔴 Redis para Sessões (#7)

**O que existe:**

- `docker-compose.yml` — serviço `redis:7-alpine` com healthcheck
- `REDIS_URL` configurado no container `api`
- Sessões armazenadas em PostgreSQL (`userSessions` table)

**O que falta:**

- Instalar `ioredis` e `connect-redis` no backend
- Configurar Redis como store de sessões (com fallback para PostgreSQL)
- Cache de refresh tokens em Redis com TTL
- Opcional: rate limiter usar Redis (atualmente em memória)

**Arquivos impactados:**

- `backend/api/package.json` — adicionar `ioredis`, `connect-redis`
- `backend/api/src/server.ts` — configurar Redis client e session store
- `backend/api/src/middleware/auth.ts` — usar Redis para refresh token cache
- `backend/api/src/middleware/rate-limiter.ts` — migrar para Redis
- `.env.example` — documentar `REDIS_URL`

### 1.2 🔴 S3/R2 para Assets (#8)

**O que existe:**

- Upload de assets via `multer` com armazenamento local em `backend/api/uploads/`
- API `POST /api/v1/assets` funcional
- Tabelas `assets` e `scene_assets` no DB schema

**O que falta:**

- Instalar `@aws-sdk/client-s3` (compatível com R2 da Cloudflare)
- Criar `storage.ts` com provider local + S3/R2 (Strategy pattern)
- Migrar `assets.routes.ts` para usar o storage provider
- Servir arquivos estáticos do S3/R2 em vez de `uploads/`
- Configurar bucket no docker-compose (MinIO para dev local)

**Arquivos impactados:**

- `backend/api/package.json` — adicionar `@aws-sdk/client-s3`
- `backend/api/src/lib/storage.ts` — novo arquivo com interface + providers
- `backend/api/src/routes/assets.routes.ts` — usar storage provider
- `docker-compose.yml` — adicionar MinIO service
- `backend/api/src/server.ts` — adicionar sirvam estática condicional
- `.env.example` — documentar `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`

### 1.3 ⚠️ ESLint + Prettier (pós #13)

**O que existe:**

- `eslint.config.mjs` na raiz (flat config)
- PR #13 merged — substituiu placebos nos 4 pacotes
- `backend/api` — usa ESLint real desde o início

**O que pode faltar:**

- Verificar se `turbo run lint` passa limpo após o merge do PR #13
- Prettier não está integrado no CI — 112 arquivos com formatação incorreta (relatado no issue #3)
- Adicionar `prettier` script e `lint:format` no CI

---

## 2. M3 — IA Integration (Gap Crítico)

**Estado atual:** A arquitetura existe (interfaces, tipos, rota), mas **nenhum provider real foi implementado**. O editor visual de árvore (#25) é a única feature concluída.

### 2.1 🔴 Provider LLM Local — Transformers.js + LFM ONNX (#20, #21)

**O que existe:**

- `ILLMProvider` interface em `packages/vn-engine/src/llm-provider.ts`
- `createDefaultLLMProvider()` — retorna placeholder `'...'`
- `createCompositeLLMProvider()` — Chain of Responsibility
- `VNEngine.generateContinuation()` — método que chama o provider
- `LLMGenerateRequest` e `LLMGenerateResponse` types em `packages/shared`

**O que falta:**

- Instalar `@xenova/transformers` (Transformers.js) no `vn-engine`
- Criar `LFMOnnxProvider` que implementa `ILLMProvider`:
  - Carregar modelo ONNX (LFM 230M ou 350M) via Web Worker
  - Tokenizer e pipeline de inferência
  - Suporte a Q4 quantização para performance
  - Fallback automático para CPU se WebGPU indisponível
- O Web Worker deve rodar no **client** (navegador), não no Node.js
- O `vn-engine` precisa ser separado em camadas: core puro + providers

**Arquivos impactados:**

- `packages/vn-engine/package.json` — adicionar `@xenova/transformers`
- `packages/vn-engine/src/providers/lfm-onnx-provider.ts` — novo
- `packages/vn-engine/src/providers/lfm-onnx.worker.ts` — Web Worker
- `apps/client/src/workers/` — workers hospedados no client
- `packages/vn-engine/src/index.ts` — exportar novo provider

### 2.2 🟡 Provider LLM Cloud — Fallback (#22)

**O que existe:**

- `llm.routes.ts` — rota `POST /api/v1/llm/generate` com placeholder
- `ApiClient.generateLLM()` — método no client

**O que falta:**

- Implementar `CloudLLMProvider` no backend usando LangChain.js (já está no stack)
- Conectar com Liquid AI API (LFM) ou OpenAI como fallback
- Rate limiting e cache de respostas
- Streaming de resposta para o client

**Arquivos impactados:**

- `backend/api/package.json` — adicionar `langchain` (já deve estar)
- `backend/api/src/lib/llm/cloud-provider.ts` — novo
- `backend/api/src/routes/llm.routes.ts` — implementar de fato
- `packages/lib/src/api-client.ts` — método já existe

### 2.3 🟡 Integrar IA na VN Engine + Player (#23, #28)

**O que existe:**

- `VNEngine.generateContinuation()` — já chama `this.llmProvider.generate()`
- Engine emite eventos `llm:requested` e `llm:response`
- Player `player-page.tsx` já gerencia `isLLMScene`

**O que falta:**

- Conectar o provider real ao engine no player
- UI de "Gerando..." com indicador visual (skeleton/spinner)
- Indicador de conteúdo gerado por IA (badge/ícone) (#28)
- Controle de temperatura e maxTokens por VN

### 2.4 🟡 Dashboard: Configuração de Persona/Instruções LLM (#24)

**O que existe:**

- Schema DB: `visualNovels.iaEnabled`, `iaSystemPrompt`, `iaPersona`, `iaMaxTokens`
- Editor de VN (`vn-editor-page.tsx`) — ainda não tem UI para IA config

**O que falta:**

- Adicionar aba "IA Configuration" no editor
- Campos: Enable/disable IA, System prompt textarea, Persona description, Max tokens slider
- Salvar configuração via `PATCH /api/v1/vns/:id`

### 2.5 🟡 Dashboard: Asset Manager (#27)

**O que existe:**

- Upload de assets funcional via API
- Tabelas `assets` e `scene_assets` no DB

**O que falta:**

- UI no dashboard para gerenciar assets (upload, preview, organizar por tipo)
- Associar assets a cenas (background, sprite, music, sfx)
- Preview de imagem/áudio no editor

### 2.6 ⚠️ Condições e Efeitos nas Escolhas (#26)

**O que existe:**

- Engine avalia condições e aplica efeitos
- Editor tem `newChoiceTarget` e lista de choices

**O que pode faltar:**

- UI para definir condições (e.g., "flag X == true") no editor
- UI para definir efeitos (e.g., "set flag Y = value")
- Validação de condições no frontend antes de salvar

---

## 3. M4 — Economy & Polish

**Estado atual:** A base de dados está pronta (tabelas `creditTransactions`, `creatorEarnings`, `userVNAccess`), rota de créditos existe mas Stripe é mockado. Admin e analytics são placeholders.

### 3.1 🔴 Stripe Integration (#31)

**O que existe:**

- `credits.routes.ts` — `POST /checkout` com comentário "In production, this would create a Stripe Checkout Session"
- Schema DB: `creditTransactions` com `stripeSessionId`
- `CREDIT_PACKAGES` e `CREATOR_REVENUE_SHARE` em `packages/shared`

**O que falta:**

- Instalar `stripe` SDK no backend
- Implementar criação real de Stripe Checkout Session
- Webhook `POST /api/v1/stripe/webhook` para confirmar pagamentos
- Tratar eventos `checkout.session.completed`, `payment_intent.succeeded`
- Testes com Stripe CLI (local) ou modo test

### 3.2 🟡 Credits API — Finalizar (#30, #32, #33, #34)

**O que existe:**

- `POST /credits/packages` ✅
- `POST /credits/checkout` ⚠️ (sem Stripe real)
- `POST /credits/spend` ✅ (com revenue share e acesso)
- `GET /credits/transactions` ✅
- Schema DB: completo

**O que falta:**

- Client: UI de saldo e compra de créditos (#33)
- Client: Confirmação de gasto antes de iniciar capítulo pago (#34)
- Testar fluxo completo de revenue share (creator earnings)
- Criador receber créditos automaticamente quando usuário gasta

### 3.3 🟡 Admin Dashboard (#37, #38)

**O que existe:**

- Nada — `analytics-page.tsx` é placeholder com "Métricas serão exibidas aqui"

**O que falta:**

- Rota `GET /api/v1/admin/users` — listar usuários com role filter
- Rota `PATCH /api/v1/admin/users/:id/role` — mudar role
- Rota `GET /api/v1/admin/credits/config` — política de créditos
- UI admin no dashboard (protegida por role `admin`)
- Moderação de VNs (archive, under_review)

### 3.4 🟡 Creator Analytics (#35, #36)

**O que existe:**

- `analytics-page.tsx` — placeholder vazio

**O que falta:**

- API `GET /api/v1/analytics/creator` — views por VN, ganhos, gráficos
- API `GET /api/v1/credits/earnings` — extrato do criador
- Gráficos no dashboard (biblioteca de charts — recharts ou chart.js)
- Filtro por período (7d, 30d, all)

### 3.5 ⚠️ PWA + Offline (#39)

**O que existe:**

- Nada

**O que falta:**

- Gerar `manifest.json` com Vite PWA plugin (`vite-plugin-pwa`)
- Service Worker para cache de VNs já carregadas
- Cache de assets (imagens, áudio) para replay offline
- Estratégia: Network First com fallback para cache

### 3.6 ⚠️ Testes (#15, #40, #41)

**O que existe:**

- Issue #15 aberta — testes unitários do VN Engine (10+ testes)
- `packages/vn-engine/src/__tests__/engine.test.ts` — arquivo existe mas vazio
- `backend/api/src/__tests__/health.test.ts` — 1 teste de health check

**O que falta:**

- Implementar testes do VN Engine (#15) — **item mais quente para qualidade**
- Configurar Playwright para E2E (#40) — pelo menos 3 fluxos críticos
- Considerar k6/Artillery para carga (#41) — opcional para POC

### 3.7 ⚠️ API Docs (#42)

**O que existe:**

- Nada

**O que falta:**

- Gerar OpenAPI/Swagger spec (pode usar `zod-to-openapi` ou manual)
- Servir Swagger UI em `GET /api/v1/docs`
- Documentar endpoints de auth, VNs, saves, créditos

---

## Ordem de Execução Recomendada (POC)

```
Fase 0: Organizacional (1-2h)
  ├── Criar milestones M1-M4
  ├── Criar Project Board
  └── Criar labels

Fase 1: M1 Débitos (2-3 dias)
  ├── Redis para sessões
  ├── S3/R2 para assets
  └── Verificar ESLint + Prettier CI

Fase 2: M3 IA Integration (2-3 semanas) ← MAIOR PRIORIDADE
  ├── Provider LLM local (Transformers.js + LFM ONNX)
  ├── Provider LLM cloud (fallback)
  ├── Integrar IA na engine + player
  ├── Config de persona no dashboard
  ├── Asset Manager UI
  └── Condições/efeitos no editor

Fase 3: M4 Economy & Polish (2-3 semanas)
  ├── Stripe real
  ├── Credits UI (player)
  ├── Admin dashboard
  ├── Creator analytics
  ├── Testes (#15 + E2E)
  ├── PWA
  └── API docs

Fase 4: Release
  └── Criar release v0.1.0-poc
```

---

## Riscos e Pontos de Atenção

1. **Performance LLM local:** Testar em GPU integrada (laptop) e GPU discreta desde o início — LFM 350M Q4 pode ser pesado para dispositivos médios
2. **Stripe:** Usar modo test com webhooks locais (Stripe CLI) antes de produzir
3. **S3 em dev:** Usar MinIO no docker-compose para evitar dependência de cloud durante desenvolvimento
4. **Threading:** Web Workers para LLM local exigem separação clara entre core (pure TS) e providers (browser APIs)
5. **Segurança:** Filtro de toxicidade deve ser implementado antes do M3 ser liberado para usuários reais
6. **Dados de seed:** VNs de teste precisam de capítulos e cenas reais para validar o fluxo completo

---

## Issues a Criar no GitHub

| #   | Título                                                               | Milestone | Prioridade |
| --- | -------------------------------------------------------------------- | --------- | ---------- |
| —   | `feat: setup GitHub milestones, project board, and custom labels`    | M0        | Must       |
| —   | `feat: implement Redis session store and refresh token cache`        | M1        | Must       |
| —   | `feat: migrate asset storage from local disk to S3/R2`               | M1        | Must       |
| —   | `fix: ensure Prettier format check passes in CI`                     | M1        | Should     |
| —   | `feat: implement local LLM provider with Transformers.js + LFM ONNX` | M3        | Must       |
| —   | `feat: implement cloud LLM fallback provider`                        | M3        | Must       |
| —   | `feat: connect LLM provider to VN Engine and player UI`              | M3        | Must       |
| —   | `feat: add LLM persona configuration UI in dashboard editor`         | M3        | Must       |
| —   | `feat: build Asset Manager UI in dashboard`                          | M3        | Must       |
| —   | `feat: add conditions and effects editor for choices`                | M3        | Should     |
| —   | `feat: integrate Stripe for real credit purchases`                   | M4        | Must       |
| —   | `feat: build credits UI in player (balance, buy, spend confirm)`     | M4        | Must       |
| —   | `feat: build admin dashboard with user management and credit policy` | M4        | Must       |
| —   | `feat: build creator analytics with charts`                          | M4        | Must       |
| —   | `feat: add PWA support with offline cache`                           | M4        | Should     |
| —   | `test: implement VN Engine unit tests`                               | M4        | Must       |
| —   | `test: configure Playwright E2E tests for critical flows`            | M4        | Should     |
| —   | `docs: generate OpenAPI/Swagger documentation`                       | M4        | Should     |
