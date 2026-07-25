---
name: model-providers
description: "Catalog of available models from OpenCode Go and OpenCode Zen providers, with cost analysis and capability mapping for each pipeline role (planner, implementer, reviewer, specialist). Use when: choosing which model to assign to an agent, optimizing cost, or auditing whether model assignments are consistent with task types."
user-invocable: true
disable-model-invocation: false
context: fork
---

# Skill: Provider Models — OpenCode Go / Zen

Operational catalog of available models for project agents, with **cost × capability** analysis and usage mapping by pipeline role.

> **Important:** OpenCode Go is a low-cost paid subscription from OpenCode, not a "free" plan. Truly free models are listed in the "Free Models" section below (all via OpenCode Zen, OpenCode's gateway).
>
> Last updated: 2026-07-05. Source: [opencode.ai/docs/zen](https://opencode.ai/docs/zen/) and [opencode.ai/docs/providers](https://opencode.ai/docs/providers/).

---

## 1. Available Providers

| Provider         | Cost                                                              | How to Access               | When to Use                                                                                            |
| ---------------- | ----------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| **OpenCode Go**  | Low-cost fixed subscription (valor único, sem cobrança por token) | `/connect` → "OpenCode Go"  | Daily code development — modelagem e refatoração                                                       |
| **OpenCode Zen** | Pay-as-you-go per 1M tokens (ver tabela abaixo)                   | `/connect` → "OpenCode Zen" | Quando precisar de modelo específico que não está no Go, ou para avaliar novos modelos antes de migrar |

> **Golden rule:** OpenCode Go é o padrão para todos os agentes durante o desenvolvimento. Só sai do Go se o modelo necessário para a tarefa não estiver disponível nele.

---

## 2. Free Models (via OpenCode Zen)

Cinco modelos **100% free** disponíveis no Zen. Úteis para experimentação e para agentes de baixo risco (ex: geração de títulos de sessão, previews).

| Model                      | Provider           | Limitations                                             | Recommended Use                                  |
| -------------------------- | ------------------ | ------------------------------------------------------- | ------------------------------------------------ |
| **Big Pickle**             | Stealth (em teste) | Data may be used to train the model            | Experimentation, do not use with sensitive data   |
| **DeepSeek V4 Flash Free** | DeepSeek           | Data may be used to train the model            | Tarefas rápidas, experimentação                  |
| **MiMo-V2.5 Free**         | Xiaomi             | Data may be used to train the model            | Tarefas rápidas, experimentação                  |
| **North Mini Code Free**   | Cohere             | **Do not submit personal/confidential data** (ver ToS) | ❌ Não usar para código de produção com clientes |
| **Nemotron 3 Ultra Free**  | NVIDIA             | Trial use only — do not submit sensitive data       | ❌ Não usar para código de produção com clientes |

> **LGPD/Privacy Notice:** Apenas **Big Pickle** e **DeepSeek V4 Flash Free** têm política de privacidade compatível com dados de clientes (com ressalva). **North Mini Code** e **Nemotron 3 Ultra Free** explicitamente proíbem dados pessoais.

---

## 3. Most Relevant Paid Models (Zen) — ordenados por capacidade

Para tarefas que exigem mais capacidade que os modelos do Go. Preços por 1M tokens (input / output / cache hit).

| Model                     | Input $/M | Output $/M | Cache $/M | When to Use                                            | Capabilities                          |
| ------------------------- | --------- | ---------- | --------- | ------------------------------------------------------ | ------------------------------------- |
| **Claude Opus 4.8**       | $5.00     | $25.00     | $0.50     | Análise muito profunda, planos arquiteturais complexos | Top-tier em raciocínio, 200K contexto |
| **Claude Sonnet 5**       | $2.00     | $10.00     | $0.20     | Tarefas balanceadas, código + explicação               | Bom custo-benefício, 200K contexto    |
| **Claude Haiku 4.5**      | $1.00     | $5.00      | $0.10     | Classificação rápida, resumos, títulos                 | Rápido e barato, 200K contexto        |
| **GPT 5.4**               | $2.50     | $15.00     | $0.25     | Coding agent forte, raciocínio estruturado             | 272K contexto                         |
| **GPT 5.4 Mini**          | $0.75     | $4.50      | $0.075    | Cheaper alternative for moderadas  | 272K contexto                         |
| **GPT 5.4 Nano**          | $0.20     | $1.25      | $0.02     | Tarefas triviais, agentes de baixo risco               | Custo mínimo                          |
| **Gemini 3.1 Pro**        | $2.00     | $12.00     | $0.20     | Visão multimodal forte, contexto longo                 | 1M+ contexto, vision nativo           |
| **Gemini 3 Flash**        | $0.50     | $3.00      | $0.05     | Alternativa barata ao Pro para tarefas simples         | Vision nativo                         |
| **DeepSeek V4 Pro**       | $1.74     | $3.48      | $0.145    | Coding agent de excelente custo-benefício              | Forte em code generation              |
| **DeepSeek V4 Flash**     | $0.14     | $0.28      | $0.028    | Tarefas rápidas, coding barato                         | Tão bom quanto Haiku em custo         |
| **Kimi K2.7 Code**        | $0.95     | $4.00      | $0.19     | Coding agent, contexto longo                           | Otimizado para código                 |
| **Qwen3.7 Max**           | $2.50     | $7.50      | $0.50     | Coding + visão                                         | 1M contexto, multimodal               |
| **Qwen3.5 Plus**          | $0.20     | $1.20      | $0.02     | Coding barato                                          | Bom para tarefas simples              |
| **GLM 5.2**               | $1.40     | $4.40      | $0.26     | Coding agent geral                                     | Sonnet alternative                 |
| **MiniMax M3**            | $0.30     | $1.20      | $0.06     | Tarefas gerais, coding balanceado                      | Bom custo-benefício                   |
| **MiniMax M2.7**          | $0.30     | $1.20      | $0.06     | Tarefas gerais, coding balanceado                      | Same price as M3                  |
| **Big Pickle (Zen pago)** | –         | –          | –         | (Ver seção Free)                                       | –                                     |

> **Example calculation:** A typical session do orchestrator (Planner + Implementer + Reviewer) com ~500K tokens totais de input + 100K output:
>
> - GPT 5.4 Mini: ~$0.83 per complete session
> - Claude Haiku 4.5: ~$1.00 per complete session
> - DeepSeek V4 Flash: ~$0.10 per complete session
> - MiniMax M3: ~$0.27 per complete session

---

## 4. Recommended Mapping: papel × modelo

This is the default assignment for project agents. Each role is mapped to the model com **best cost/capability ratio** for the task type.

| Agente (papel)                                                  | Modelo recomendado | Justificativa                                                               | Alternativa mais barata                         |
| --------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------- | ----------------------------------------------- |
| **orchestrator** (Coordena, decisões de HITL, síntese)          | `claude-sonnet-5`  | Raciocínio forte, bom em síntese e julgamento; vale pagar pelo orchestrator | `minimax-m3` (3x mais barato)                   |
| **planner** (Análise de issue, geração de plano)             | `claude-sonnet-5`  | Planos exigem raciocínio estruturado; longo contexto para ler codebase      | `deepseek-v4-pro` (1/3 do custo)                |
| **implementer** (Edição de código, build)                     | `deepseek-v4-pro`  | Coding forte, custo acessível; usa muito token                              | `minimax-m3` (6x mais barato) ou `qwen3.5-plus` |
| **reviewer** (Análise de diff, classificação)                    | `claude-haiku-4-5` | Read-only, tarefa de classificação — Haiku é ideal em custo                 | `deepseek-v4-flash` (5x mais barato)            |
| **harness-engineer** (Auditoria, refatoração de harness)   | `claude-sonnet-5`  | Raciocínio estruturado sobre meta-problemas                                 | `minimax-m3`                                    |
| **content-creator** (Geração de copy)                          | `gpt-5.4-mini`     | Geração criativa barata                                                     | `gemini-3-flash`                                |
| **layout-designer** (Análise visual, auditoria UX)           | `gemini-3.1-pro`   | Vision nativo, pode analisar screenshots                                    | `gemini-3-flash`                                |
| **performance-auditor** (Análise de métricas, code review perf) | `deepseek-v4-pro`  | Forte em code analysis                                                      | `minimax-m3`                                    |
| **refactor-css** (Refatoração de CSS)                           | `qwen3.5-plus`     | Coding barato, foco em estilos                                              | `gemini-3-flash`                                |
| **Agente de títulos de sessão** (auto, não-customizável)        | `gpt-5-nano`       | OpenCode usa por padrão                                                     | N/A                                             |

> **Custo mensal estimado (10 issues/mês):** ~$15-30 com a atribuição recomendada. Pode cair para ~$5 com alternativas baratas (MiniMax M3 em todos os lugares).

---

## 5. Como aplicar no projeto

### Configurar modelo padrão no `opencode.json`

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode-go/default", // ou "opencode/<model-id>" para Zen
  "small_model": "opencode-go/small",
}
```

### Atribuir modelo por agente

```jsonc
{
  "agent": {
    "implementer": { "model": "opencode/deepseek-v4-pro" },
    "reviewer": { "model": "opencode/claude-haiku-4-5" },
  },
}
```

### No `agent.md` (recomendado para explicitar)

Adicione `model:` no frontmatter do agente:

```yaml
---
name: "implementer"
model: "opencode/deepseek-v4-pro"
description: "..."
---
```

---

## 6. Auditoria periódica

Execute esta skill mensalmente para:

1. Verificar se há modelos novos no Go/Zen que justifiquem migração
2. Comparar custo real vs. estimado (use `/stats` se disponível)
3. Identificar agentes que poderiam usar modelo mais barato sem perder qualidade
4. Atualizar esta skill com modelos deprecated e novos

### Checklist de auditoria

- [ ] Há modelo novo no Go mais barato que o atual? Migrar?
- [ ] Há modelo Zen novo com capacidade relevante? Testar?
- [ ] Os modelos free ainda estão disponíveis? (mudam com frequência)
- [ ] Algum modelo que usamos foi deprecated? Ver [tabela de deprecated](https://opencode.ai/docs/zen#pricing)
- [ ] Custo real está dentro do orçamento?

---

## 7. Decisões confirmadas com o usuário (2026-07-05)

| Decisão                | Escolha                                               | Implicação                                                                          |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Orçamento mensal       | **Apenas OpenCode Go** (sem custo extra)              | Custo variável = $0/mês                                                             |
| Modelo do orchestrator | **`opencode-go/default`**                             | Keeps strong reasoning without paying Zen                                               |
| Modelo do reviewer     | **`opencode-go/small`**                               | Mantém classificação rápida sem pagar Zen                                           |
| Forma de atribuição    | **Ambos: `opencode.json` + `model:` nos `.agent.md`** | Duplicação controlada — `opencode.json` é o global, `.agent.md` explicita a escolha |

> **Mapeamento final aplicado** (configurado em [`opencode.json`](../../../opencode.json) e em cada `.agent.md`):
>
> **Formato do model**: display name `OpenCode Go / [Nome] (opencodego)` (sem aspas)

| Agente                  | Model                                          |
| ----------------------- | ---------------------------------------------- |
| `orchestrator`          | `OpenCode Go / Deepseek V4 Pro (opencodego)`   |
| `planner`            | `OpenCode Go / Deepseek V4 Pro (opencodego)`   |
| `implementer`         | `OpenCode Go / Deepseek V4 Pro (opencodego)`   |
| `reviewer`               | `OpenCode Go / Deepseek V4 Flash (opencodego)` |
| `harness-engineer` | `OpenCode Go / Deepseek V4 Pro (opencodego)`   |
| `content-creator`      | `OpenCode Go / Deepseek V4 Flash (opencodego)` |
| `layout-designer`    | `OpenCode Go / Minimax M3 (opencodego)`        |
| `performance-auditor`   | `OpenCode Go / Deepseek V4 Pro (opencodego)`   |
| `refactor-css`          | `OpenCode Go / Deepseek V4 Flash (opencodego)` |

> **Regra de atribuição (definida pelo usuário):**
>
> - **Deepseek V4 Pro** → raciocínio (default, tarefas que exigem análise profunda)
> - **Deepseek V4 Flash** → tarefas simples (revisão, geração de copy, refatoração)
> - **Minimax M3** → vision/design (análise visual, auditoria de UI)

> **Reavaliar a configuração quando:**
>
> - O usuário aumentar o orçamento mensal
> - A qualidade do Go for insuficiente para alguma classe de tarefa
> - Um modelo novo for adicionado/deprecado (ver [tabela de deprecated](https://opencode.ai/docs/zen#pricing)) |

---

## 8. Referências

- [OpenCode Models](https://opencode.ai/docs/models/) — documentação geral
- [OpenCode Zen](https://opencode.ai/docs/zen/) — modelos curados e preços
- [OpenCode Providers](https://opencode.ai/docs/providers/) — como configurar providers
- [OpenCode Config](https://opencode.ai/docs/config/) — referência de `opencode.json`
- [OpenCode Agents](https://opencode.ai/docs/agents/) — configuração de agentes
- [Models.dev](https://models.dev/) — catálogo global de modelos
