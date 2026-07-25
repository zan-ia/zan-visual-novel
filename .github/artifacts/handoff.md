# Handoff — Pipeline de Desenvolvimento

**Data:** 2026-07-25  
**De:** Software Engineer  
**Para:** Pipeline de Desenvolvimento (Engineer → Orchestrator → Planner → Implementer → Reviewer)

---

## Resumo Executivo

O **Zan Visual Novel** é uma plataforma de criação e consumo de visual novels interativas com IA generativa local. Dois perfis de usuário (jogador e criador) interagem através de um client SPA (player de VN com LLM local ONNX) e um dashboard SPA (editor de VN com árvore de decisão visual), sustentados por um backend Node.js + PostgreSQL + Stripe + S3.

## Artefatos Produzidos

| Artefato | Localização | Status |
|----------|-------------|--------|
| Documento de Visão | `.github/artifacts/requirements/product-vision.md` | ✅ Draft |
| SRS (IEEE 830) | `.github/artifacts/requirements/srs.md` | ✅ Draft |
| ADRs de Arquitetura | `.github/artifacts/docs/adr-architecture.md` | ✅ Proposta |
| C4 — Arquitetura | `.github/artifacts/diagrams/architecture-c4.md` | ✅ |
| ERD — Banco de Dados | `.github/artifacts/diagrams/erd.md` | ✅ |
| Diagramas de Sequência | `.github/artifacts/diagrams/sequence-flows.md` | ✅ |
| Roadmap + Milestones | `.github/artifacts/roadmap.md` | ✅ |
| README do Projeto | `README.md` | ✅ |

## Decisões Críticas de Arquitetura

1. **Monorepo Turborepo** com 2 apps (client, dashboard) + 4 pacotes (shared, ui, lib, vn-engine) + backend
2. **Inferência Híbrida:** LLM local ONNX (230M/350M) como primário, cloud API como fallback
3. **VN Engine** como pacote TypeScript puro (framework-agnostic, testável)
4. **Backend próprio** (Node.js + PostgreSQL + Stripe) — não Google Sheets (transações financeiras exigem ACID)
5. **Stack:** React 19, Vite 6, Transformers.js 3, LangChain.js 0.3, MUI v6 (mesmo stack do Zan IA)

## Ordem de Implementação Recomendada

### Fase 1: Fundação (M1)
- Setup monorepo Turborepo com todos os pacotes e apps vazios
- Backend API com auth (JWT + OAuth2) e schema DB
- CI/CD pipeline
- **Artefato de entrada:** `roadmap.md` → Milestone M1

### Fase 2: Player MVP (M2)  
- VN Engine core (máquina de estados, parser de cenas)
- Client: biblioteca + player de cena + escolhas + saves
- Dashboard: editor de VN + cenas + preview + publicação
- **Dependência:** M1 concluído
- **Artefato de entrada:** `srs.md` seções RF-CL-001 a RF-CL-013 e RF-DS-001 a RF-DS-018

### Fase 3: IA Integration (M3)
- Integração Transformers.js + modelos LFM ONNX
- Provider LLM local (Web Worker) + cloud fallback
- Integração IA na VN Engine
- Dashboard: editor visual de árvore de decisão (React Flow) + asset manager
- **Dependência:** M2 concluído
- **Artefato de entrada:** `srs.md` seções RF-CL-008 a RF-CL-010 e RF-DS-009

### Fase 4: Economy & Polish (M4)
- Sistema de créditos + Stripe
- Admin dashboard + analytics
- PWA + testes
- **Dependência:** M3 concluído
- **Artefato de entrada:** `srs.md` seções RN-CRED-001 a RN-CRED-008

## Issues Prioritárias para Criação Imediata

| # | Título | Épico | Milestone | Prioridade |
|---|--------|-------|-----------|------------|
| 1 | Setup do monorepo com Turborepo | Infra | M1 | Must |
| 2 | Configurar ESLint, Prettier, tsconfig | Infra | M1 | Must |
| 3 | Criar pacote `shared` (tipos, schemas) | Infra | M1 | Must |
| 4 | Schema DB PostgreSQL + Drizzle | Backend | M1 | Must |
| 5 | API de autenticação (JWT + OAuth2) | Backend | M1 | Must |
| 6 | CI/CD — GitHub Actions | Infra | M1 | Must |

## Como Iniciar

```
/start-feature "Setup do monorepo com Turborepo — configurar estrutura apps/, packages/, backend/ com Vite, React 19, TypeScript, ESLint, Prettier e tsconfig compartilhado"
```

Este comando acionará o pipeline: Engineer → Orchestrator → Planner → Implementer → Reviewer, gerando uma branch `feat/setup-monorepo`, implementando a estrutura e abrindo um PR.

## Pontos de Atenção

1. **Performance de LLM local:** Testar cedo com modelos Q4 em dispositivos reais (não apenas desktop)
2. **Segurança de conteúdo IA:** Implementar filtro de toxicidade antes do M3
3. **Transações financeiras:** Todo código de créditos deve ser revisado com atenção a race conditions e integridade (ACID)
4. **Mobile:** Player deve ser testado em mobile desde o M2 (PWA, touch, performance)
5. **Assets:** Definir cedo limites de tamanho e formatos suportados (evitar uploads de 100MB+)

---

## Próximos Passos (Pipeline)

1. **Engineer** revisa artefatos e aciona Orchestrator
2. **Orchestrator** cria issues a partir das especificações e inicia M1
3. **Planner** detalha tasks técnicas para cada issue
4. **Implementer** executa em branches `feat/*`
5. **Reviewer** revisa PRs antes do merge

---

> **Nota:** Este documento é o handoff formal da fase de Engenharia de Software para o Pipeline de Desenvolvimento. Todos os artefatos de requisitos, arquitetura, design e planejamento estão completos e aprovados para início da implementação.
