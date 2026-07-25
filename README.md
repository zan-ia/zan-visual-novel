# Zan Visual Novel

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3-1C3C3C?logo=langchain)](https://js.langchain.com/)
[![Transformers.js](https://img.shields.io/badge/Transformers.js-3-FAE71E?logo=huggingface)](https://huggingface.co/docs/transformers.js/)

**Zan Visual Novel** é uma plataforma de criação e consumo de visual novels interativas com IA generativa local. Criadores constroem histórias com escolhas, cenas, assets multimídia e árvores de decisão; jogadores experimentam narrativas dinâmicas onde LLMs locais (LFM ONNX) geram continuidade além das ramificações pré-definidas.

---

## ✨ Funcionalidades

### 🎮 Client (Jogador)

| Funcionalidade             | Descrição                                                                 |
| -------------------------- | ------------------------------------------------------------------------- |
| 📚 **Biblioteca de VNs**   | Navegar, buscar e filtrar visual novels disponíveis                       |
| 🎭 **Player de VN**        | Engine de renderização de cenas: texto, imagens, áudio, vídeo, escolhas   |
| 🔀 **Sistema de Escolhas** | Árvore de decisão ramificada com consequências narrativas                 |
| 🧠 **IA Narrativa Local**  | LLM LFM local (ONNX) gerando continuidade além das escolhas pré-definidas |
| 💾 **Progresso e Saves**   | Múltiplos slots, auto-save, sincronização cloud                           |
| 💰 **Sistema de Créditos** | Compra e gasto de créditos para acessar histórias                         |

### 🛠️ Dashboard (Criador)

| Funcionalidade                     | Descrição                                                        |
| ---------------------------------- | ---------------------------------------------------------------- |
| 📝 **Editor de VNs**               | CRUD completo de histórias, capítulos e cenas                    |
| 🖼️ **Asset Manager**               | Upload e gerenciamento de imagens, áudios e vídeos por cena      |
| 🌳 **Editor de Árvore de Decisão** | Interface visual para criar ramificações com condições e efeitos |
| 🤖 **Configuração de IA**          | Definir persona, tom e restrições do LLM por história            |
| 📊 **Analytics**                   | Métricas de consumo, créditos recebidos, feedback dos jogadores  |

---

## 🏗️ Tech Stack

```
┌──────────────────────────────────────────────────┐
│  Monorepo (Turborepo)                             │
│                                                   │
│  ┌─────────────────┐  ┌───────────────────────┐  │
│  │ apps/client      │  │ apps/dashboard         │  │
│  │ React 19 + Vite  │  │ React 19 + Vite 6      │  │
│  │ Transformers.js  │  │ MUI v6                 │  │
│  │ LangChain.js     │  │ React Flow (árvore)    │  │
│  │ MUI v6           │  │ TipTap (editor)        │  │
│  └────────┬────────┘  └───────────┬───────────┘  │
│           │                       │               │
│  ┌────────┴───────────────────────┴───────────┐  │
│  │ packages/                                    │  │
│  │ shared (tipos, schemas)                     │  │
│  │ ui (componentes MUI)                        │  │
│  │ lib (hooks, utilitários)                    │  │
│  │ vn-engine (engine core TS puro)             │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ backend/api                                    │ │
│  │ Node.js + Express  |  PostgreSQL  |  Redis     │ │
│  │ JWT Auth  |  Stripe  |  S3 (Cloudflare R2)     │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## 🧠 Modelos LFM (Inferência)

| Modelo               | Uso                                 | Execução  | Tamanho Q4 |
| -------------------- | ----------------------------------- | --------- | ---------- |
| LFM2.5-230M-ONNX     | Diálogos simples, respostas rápidas | Navegador | ~200 MB    |
| LFM2.5-350M-ONNX     | Narrativa balanceada                | Navegador | ~350 MB    |
| LFM2.5-1.2B-Thinking | Raciocínio complexo, plot twists    | Cloud API | ~1.2 GB    |
| LFM2.5-Audio-1.5B    | Narração por voz                    | Cloud API | ~3 GB      |
| LFM2.5-VL-450M       | Análise de cenas                    | Navegador | ~900 MB    |
| LFM2.5-VL-1.6B       | Geração de assets visuais           | Cloud API | ~3.2 GB    |

---

## 🚀 Começo Rápido

```bash
# Clone o repositório
git clone https://github.com/zan-ia/zan-visual-novel.git
cd zan-visual-novel

# Instale dependências
npm install

# Inicie todos os apps em dev
npm run dev

# Build para produção
npm run build

# Execute testes
npm run test
```

> **Pré-requisitos:** Node.js 20+, npm 10+, PostgreSQL 16+, Redis 7+

---

## 📂 Estrutura do Projeto

```
zan-visual-novel/
├── apps/
│   ├── client/              # Vite + React 19 — Player de VN
│   │   ├── src/
│   │   │   ├── components/  # UI components (library, player, profile)
│   │   │   ├── hooks/       # Custom hooks (useVNEngine, useLLM)
│   │   │   ├── pages/       # Routes (Library, Player, Profile)
│   │   │   ├── stores/      # Zustand stores (auth, credits)
│   │   │   └── workers/     # Web Workers (ONNX inference)
│   │   └── public/
│   │       └── models/      # ONNX models (gitignored, baixados em runtime)
│   │
│   └── dashboard/           # Vite + React 19 — Creator Studio
│       ├── src/
│       │   ├── components/  # Editor components (scene, tree, assets)
│       │   ├── hooks/       # Custom hooks
│       │   ├── pages/       # Routes (Studio, Analytics, Settings)
│       │   └── stores/      # Zustand stores
│       └── public/
│
├── packages/
│   ├── shared/              # Tipos TypeScript, Schemas Zod, Constantes
│   ├── ui/                  # Componentes MUI reutilizáveis
│   ├── lib/                 # Hooks, utilitários, clientes API
│   └── vn-engine/           # Engine core (máquina de estados, parser)
│
├── backend/
│   └── api/                 # Node.js + Express + PostgreSQL
│       ├── src/
│       │   ├── routes/      # REST endpoints
│       │   ├── services/    # Lógica de negócio
│       │   ├── db/          # Drizzle ORM schemas + migrations
│       │   ├── middleware/   # Auth, rate limit, validation
│       │   └── workers/     # Background jobs
│       └── tests/
│
├── .github/                 # CI/CD, harness, agents, skills, instructions
├── docs/                    # Documentação detalhada
└── turbo.json               # Turborepo config
```

---

## 📚 Documentação

| Documento                                                                     | Descrição                                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| [Visão do Produto](.github/artifacts/requirements/product-vision.md)          | Estratégia, personas, escopo, métricas                  |
| [Especificação de Requisitos (SRS)](.github/artifacts/requirements/srs.md)    | RFs, RNFs, RNs, matriz de rastreabilidade               |
| [ADRs de Arquitetura](.github/artifacts/docs/adr-architecture.md)             | Decisões: monorepo, inferência híbrida, engine, backend |
| [Diagrama de Arquitetura (C4)](.github/artifacts/diagrams/architecture-c4.md) | Contexto, Container, Componentes                        |
| [Modelo de Dados (ERD)](.github/artifacts/diagrams/erd.md)                    | Entidades, relacionamentos, índices                     |
| [Diagramas de Sequência](.github/artifacts/diagrams/sequence-flows.md)        | Fluxos: jogo, criação, créditos, auth                   |
| [Roadmap](.github/artifacts/roadmap.md)                                       | Milestones e cronograma                                 |

---

## 🔒 Privacidade

- **Inferência local:** Modelos LFM ONNX rodam no navegador do jogador — textos não saem do dispositivo
- **Cloud fallback:** Apenas quando necessário; dados enviados são efêmeros (não armazenados)
- **Dados pessoais:** Apenas email e perfil; senhas hasheadas com bcrypt
- **Assets:** Armazenados em S3/R2 com acesso controlado
- **Sem rastreamento:** Nenhum analytics de terceiros

## 📄 Licença

MIT © [Zan IA](https://github.com/zan-ia)

---

<sub>Built with ❤️ using React, Vite, Transformers.js, Liquid AI Foundation Models, and LangChain</sub>
