---
name: pipeline-orchestration
description: 'Orchestrates the complete development pipeline: Software-Engineer→Plan→Implement→Review with HITL. Use when: initiating any development task (bugfix, feature, improvement) that needs to go through the complete quality cycle — the software-engineer agent uses the workflow-analysis skill to create a workflow artifact, then the orchestrator coordinates planning, implementation, review, and PR.'
argument-hint: '[bugfix | feature | improvement] — describe the task...'
user-invocable: true
disable-model-invocation: false
context: inline
---

# Orchestration Pipeline

CI/CD development pipeline orchestration skill managed by Copilot agents.

## Overview

The pipeline implements a **Plan → Implement → Review** cycle with **Human-in-the-Loop (HITL)** at critical points (issue approval, PR review).

```
USER → /start-bugfix|feature|improvement
    │
    ▼
ORCHESTRATOR
    ├─ (Phase 0) User input → classifies type
    ├─ (Phase 1) Creates Issue → 🛑 HITL
    ├─ (Phase 2) Creates Branch (fix|feat|improve/...)
    ├─ (Phase 3) PLANNER (subagent) → Plan in .github/plans/
    ├─ (Phase 4) IMPLEMENTER (subagent) → Code + Build
    ├─ (Phase 5) REVIEWER (subagent) → Quality report
    ├─ (Phase 6) Decision → loop max. 3x if critical/major
    ├─ (Phase 7) Commit (Conventional) + Push + PR (Closes #N) → 🛑 HITL
    └─ (Phase 8) Checkout main
```

**Note:** The above is the **orchestrator-driven flow**. The actual **entry point** is the `engineer` agent, which runs **before** the orchestrator. The engineer analyzes the request, creates `.github/artifacts/workflow-{N}.md`, creates the GitHub issue, and hands off to the orchestrator.

---

## How to Use

### Via Slash Command

Type `/` in chat and select one of the prompts:

- `/start-bugfix` — for bug fixes
- `/start-feature` — for new features
- `/start-improvement` — for improvements and refactoring
- `/start-research` — for research / spike investigations

All entry-point prompts target the **engineer** agent (not the orchestrator directly). The engineer:

1. Analyzes the request
2. Creates a workflow artifact at `.github/artifacts/workflow-{N}.md`
3. Creates the GitHub issue
4. Hands off to the orchestrator with the workflow and issue number

### Via Direct Mention

Mention the task type and description:

- "Fix the header colors bug on mobile"
- "Add a testimonials section to the page"
- "Improve font loading performance"

The skill will be loaded automatically and the pipeline flow will be initiated.

---

## Pipeline Agents

| Agent          | Role                                                                               | Tools                                  |
| -------------- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| `engineer`     | **First-line analyzer** — decomposes task into workflow, identifies domain experts | read, search, web, vscode/askQuestions |
| `orchestrator` | Coordinator — receives workflow, manages the complete flow                         | All + GitHub MCP                       |
| `planner`      | Analyst — explores codebase and creates plan                                       | read, search, web                      |
| `implementer`  | Developer — executes the plan                                                      | read, search, edit, execute            |
| `reviewer`     | QA — analyzes diff and verifies quality                                            | read, search                           |

## Domain Experts

The orchestrator may invoke domain-specific skills/agents based on the workflow. Available domain experts:

| Domain              | When to invoke                             |
| ------------------- | ------------------------------------------ |
| **DevOps**          | CI/CD, deployment, infrastructure          |
| **Design Patterns** | Architectural choices, refactoring         |
| **Backend**         | APIs, server logic, databases              |
| **Agents**          | Harness changes, new agents, prompts       |
| **Product**         | User stories, requirements, prioritization |
| **Frontend**        | UI components, accessibility               |
| **System**          | Scalability, performance, reliability      |
| **Experience**      | UX flows, user research                    |
| **Aesthetic**       | Visual design, typography, branding        |

The **Harness Engineer** runs in **auto-learn mode** between pipeline cycles, observing session data and proposing harness improvements.

---

## Conventions

### Branches

| Type        | Prefix     | Example                    |
| ----------- | ---------- | -------------------------- |
| Bugfix      | `fix/`     | `fix/header-colors`        |
| Feature     | `feat/`    | `feat/add-pricing-section` |
| Improvement | `improve/` | `improve/optimize-fonts`   |

### Commits (Conventional Commits)

```
fix(scope): fix header colors on mobile
feat(scope): add pricing section
improve(scope): optimize font loading

Closes #N
```

### Issues

- Title with prefix: `fix:`, `feat:`, `improve:`
- Type-specific template (bug/feature/improvement)
- `Closes #N` in PR for auto-close

---

## Quality Checklist (Reviewer)

> See `.github/agents/reviewer.agent.md` for the detailed checklist with sub-checks per dimension.

| Dimension       | Verifies                                                      |
| --------------- | ------------------------------------------------------------- |
| Code            | Follows `.github/instructions/` conventions, no anti-patterns |
| Architecture    | Correct file organization, proper imports, patterns preserved |
| Design          | Design system compliance, visual consistency                  |
| Readability     | Descriptive names, clean code, appropriate comments           |
| Performance     | Efficient rendering, lazy loading, compositor-only animations |
| Maintainability | Consistent patterns, no duplication, low coupling             |
| Specificity     | Appropriate scope, no force-overrides                         |
| Dependencies    | No unauthorized additions                                     |
| Tests           | Build/lint pass, acceptance criteria met                      |
| Accessibility   | Semantic structure, ARIA, headings, alt texts, keyboard nav   |

---

## HITL Points (Human-in-the-Loop)

🛑 The pipeline ALWAYS stops and waits for the user at:

1. **After issue creation** — user reviews title, description, and scope
2. **After PR creation** — user reviews diff, reviewer comments, and merges

---

## Review Loop Rules

- **CRITICAL** issues (functional bug, broken build) → re-plan
- **MAJOR** issues (pattern violation, inconsistent design) → re-plan
- **MINOR** issues (style, naming) → document in PR as follow-up
- **Maximum 3 iterations** — if it fails, document risks and force PR with caveats

---

## Plan Files

Plans are saved to `.github/plans/issue-{N}-{slug}.md` with:

- Approach summary
- Files to modify/create
- Patterns to follow
- Implementation order
- Identified risks
- Verification checklist

---

## References

- **Detailed pipeline workflow:** `.github/instructions/pipeline-workflow.instructions.md`
- **Tool usage rules:** `.github/instructions/tool-usage.instructions.md`
- **Code conventions:** `AGENTS.md`
- **Design system:** `src/lib/app.css`
- **Institutional information:** `docs/INSTITUCIONAL.md`

### Entry Prompts

- `/start-bugfix` — `.github/prompts/start-bugfix.prompt.md`
- `/start-feature` — `.github/prompts/start-feature.prompt.md`
- `/start-improvement` — `.github/prompts/start-improvement.prompt.md`

### Pipeline Agents

- `orchestrator` — `.github/agents/orchestrator.agent.md`
- `planner` — `.github/agents/planner.agent.md`
- `implementer` — `.github/agents/implementer.agent.md`
- `reviewer` — `.github/agents/reviewer.agent.md`

### Support Agents

- `content-creator` — `.github/agents/content-creator.agent.md`
- `performance-auditor` — `.github/agents/performance-auditor.agent.md`
- `refactor-css` — `.github/agents/refactor-css.agent.md`

### Related Skills

- `criar-section` — create new sections
- `criar-pagina-institucional` — create institutional pages
- `css-comparison-workflow` — compare DEV vs LIVE
- `otimizar-imagens` — optimize images
- `seo-otimization` — technical SEO knowledge (meta tags, structured data)

### Direct Action Prompts

- `/adicionar-depoimento` — `.github/prompts/adicionar-depoimento.prompt.md`
- `/adicionar-servico` — `.github/prompts/adicionar-servico.prompt.md`
- `/otimizar-seo` — `.github/prompts/otimizar-seo.prompt.md`
- `/revisar` — `.github/prompts/revisar.prompt.md`

---

## Related Documentation

- Detailed pipeline: `.github/instructions/pipeline-workflow.instructions.md`
- Review criteria: `.github/agents/reviewer.agent.md`
- Agent guide: `AGENTS.md` (Agent Orchestration section)
