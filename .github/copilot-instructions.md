# Copilot Instructions — Harness Conventions

> **Harness version:** generic (project-agnostic).  
> For project-specific stack, conventions, and architecture, see the project root `README.md` and `.github/instructions/`.

## Universal Rules

### Git & PRs

- **NEVER merge directly to `main`** — ALWAYS create a Pull Request, even if merging immediately after
- PR-only mainline policy: every change lands on `main` through a PR, no exceptions
- Use Conventional Commits: `fix:`, `feat:`, `improve:`, `harness:`, `docs:`
- Branch naming: `{type}/{short-description}` (e.g., `fix/header-colors`, `feat/add-search`)

### Tool Usage

- `vscode/askQuestions` — MANDATORY for any ambiguity; never assume user preferences. NEVER ask questions in plain text
- `manage_todo_list` — Create list BEFORE starting any task with 3+ steps, 1 step in-progress at a time, mark completed immediately
- Subagents — Prefer specialized agents (`planner`, `implementer`, `reviewer`) for pipeline tasks via `runSubagent`
- Memory — Use `/memories/session/` for pipeline state tracking

### Quality

- Run project build/lint commands before committing — CI gate
- **MANDATORY: Use `vscode/askQuestions` tool for ANY user communication — NEVER ask questions in plain text**
- **MANDATORY: Use `manage_todo_list` tool to track sequential execution for any task with 3+ steps**

### Environment & Secrets

- ALL secrets in environment files — NEVER hardcode tokens or API keys
- Document all required environment variables in an example file

## Project-Specific Conventions

Consult these sources for project-specific rules (loaded automatically via `applyTo` patterns):

| Source       | Location                | Purpose                                          |
| ------------ | ----------------------- | ------------------------------------------------ |
| Instructions | `.github/instructions/` | Per-filetype rules (CSS, HTML, TypeScript, etc.) |
| Agents       | `.github/agents/`       | Specialized agent personas                       |
| Skills       | `.github/skills/`       | Reusable workflows                               |
| MCP Servers  | `.vscode/mcp.json`      | External tool connections (Stitch, GitHub, etc.) |
| Prompts      | `.github/prompts/`      | Task-specific slash commands                     |

## MCP Servers

This project uses MCP (Model Context Protocol) servers to connect AI agents to external tools:

| Server     | Purpose                                  | Auth                                | Skill                                        |
| ---------- | ---------------------------------------- | ----------------------------------- | -------------------------------------------- |
| **Stitch** | AI-powered UI design & screen generation | API Key (`${input:stitch-api-key}`) | [`stitch-mcp`](./skills/stitch-mcp/SKILL.md) |

> **Stitch MCP reference:** `.github/skills/stitch-mcp/SKILL.md` — full auth setup, tool reference, and troubleshooting.

## Harness Architecture

This `.github/` harness implements a **Define → Plan → Implement → Review** pipeline with upstream software engineering processes:

```
                    ┌──────────────────────────────────────┐
                    │ SOFTWARE ENGINEER (upstream)          │
                    │ ├─ Product Definition (Vision, PRD)   │
                    │ ├─ Requirements Engineering (SRS)     │
                    │ ├─ Technical Documentation (ADR, API) │
                    │ ├─ Diagrams (ERD, Sequence, C4)       │
                    │ └─ Project Management (Issues, Roadmap)│
                    └──────────────┬───────────────────────┘
                                   │ handoff with artifacts
                                   ▼
User Request → Engineer → Orchestrator → Issue → Branch → Planner → Implementer → Reviewer → PR
```

**Upstream (Software Engineer):** `/define-product`, `/gather-requirements`, `/create-documentation`, `/create-diagram`, `/manage-project`

**Development Pipeline:** `/start-feature`, `/start-bugfix`, `/start-improvement`, `/start-research`
