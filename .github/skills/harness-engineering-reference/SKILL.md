---
name: harness-engineering-reference
description: "Reference knowledge for harness engineering — tool naming conventions, agent creation rules, proactive audit mindset, and improvement embedding strategies. Use when: auditing harness consistency, creating/modifying agents/instructions/prompts/skills, troubleshooting tool rename alerts, fixing agent permission violations, or learning harness engineering best practices."
argument-hint: "[audit | create-agent | fix-tools | learn] — what do you need?"
user-invocable: true
disable-model-invocation: false
---

# Harness Engineering — Reference Knowledge

Complete reference for maintaining and evolving the Zan.IA project harness (agents, instructions, prompts, skills).

## Companion Skills

| Skill                                                    | Purpose                                                                                                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`modelos-provedores`](./../modelos-provedores/SKILL.md) | Catálogo de modelos OpenCode Go / Zen com análise de custo × capacidade para cada papel do pipeline. **Source of truth** para atribuição de modelos. |

---

## 1. Tool Naming Conventions

### Known Renames / Aliases

| Old Name   | New Names                               | Date       |
| ---------- | --------------------------------------- | ---------- |
| `memory`   | `memory/*` + `vscode/memory`            | 2026-06-27 |
| `terminal` | `run_in_terminal` (may vary by context) | —          |

**Rule:** When a tool rename alert appears, scan ALL `.github/` files for the old name. The fix is NEVER isolated to one file.

### Valid Tool Names (as of 2026-06-27)

| Category       | Tool Names                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Read**       | `read`, `search`, `grep_search`, `semantic_search`, `file_search`                                                                                                                                                                                                                                                                                                                                                                    |
| **Edit**       | `edit`, `replace_string_in_file`, `multi_replace_string_in_file`, `create_file`, `create_directory`                                                                                                                                                                                                                                                                                                                                  |
| **Execute**    | `execute` (terminal)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Web**        | `web`, `browser`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Ask**        | `vscode/askQuestions`                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Memory**     | `memory/*`, `vscode/memory`                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Agent**      | `agent` (subagent invocation — `runSubagent`)                                                                                                                                                                                                                                                                                                                                                                                        |
| **Todo**       | `todo` (`manage_todo_list`)                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Chronicle**  | `session_store_sql`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **GitHub MCP** | `github/*` (wildcard) — built-in VS Code MCP server (`github.copilot.chat.githubMcpServer.enabled`). Specific tools: `github/create_issue`, `github/get_issue`, `github/list_issues`, `github/update_issue`, `github/add_issue_comment`, `github/create_pull_request`, `github/get_pull_request`, `github/list_pull_requests`, `github/merge_pull_request`, `github/create_branch`, `github/get_file_contents`, `github/search_code` |

---

## 2. Agent Creation Rules

### Frontmatter Template

```yaml
---
name: "nome-do-agente"
description: "Portuguese description. Use when: ..."
tools:
  - "read"
  - "search"
  - "agent" # ← REQUIRED if agents: is declared
agents:
  - "subagent-1"
user-invocable: true
disable-model-invocation: false
handoffs:
  - label: "🔍 Label"
    agent: target-agent
    prompt: "Instructions for the handoff"
    send: false
---
```

### Critical Rules

1. **`agents:` → `agent` in `tools:`** — When `agents` is specified (even if empty `[]`), the `"agent"` tool MUST be in `tools:`. This enables `runSubagent`.

2. **`handoffs:` agents must be in `agents:` list** — You cannot handoff to an agent you can't invoke.

3. **`agents: []` + `handoffs: [...]` → CONTRADICTION** — Empty agents list means no subagents, but handoffs imply subagent invocation.

4. **Read-only agents** (`planner`, `reviewer`, `content-creator`) must NOT declare `edit` or `execute`.

5. **`description` field** — ALWAYS in Portuguese (user-visible). Body content — ALWAYS in English (internal).

6. **`user-invocable: false`** — Hidden from agent selector, still subagent-invocable.

7. **`disable-model-invocation: true`** — Prevents other agents from using as subagent (overridden by listing in `agents:`).

### Agent Checklist (create/update)

- [ ] `description` is in Portuguese with "Use when:" pattern
- [ ] If `agents:` declared → `"agent"` is in `tools:`
- [ ] All `handoffs:` agents are in `agents:` list
- [ ] No contradictory `agents: []` + `handoffs:`
- [ ] Read-only agents don't have `edit`/`execute`
- [ ] All tool names are valid
- [ ] Body content is in English (except code samples)

---

## 3. Instruction Maintenance Rules

| Rule                | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `applyTo` globs     | Must match actual project file structure                         |
| No contradictions   | Check that no two instructions conflict on the same file         |
| `description` field | Use semantic "Use when:" pattern for discovery                   |
| Update on new files | When new file types are added, check if `applyTo` needs updating |

---

## 4. Proactive Audit Mindset

When a user reports a harness issue (tool rename, missing permission, broken reference), do NOT fix just what they pointed out. Apply these steps exhaustively BEFORE reporting back:

```
1. FULL SCAN → Search ALL .github/ files for the SAME class of issue
2. ANTICIPATE → "If the system flagged THIS, what ELSE will it flag next?"
3. FIX ALL LAYERS →
   ├── The violating file(s)
   ├── Documentation/templates that teach the rule
   ├── Audit checklists that should catch the rule
   └── Summary tables referencing the changed data
4. ASK IF UNSURE → "como você detectou isso?" / "que outras referências você vê?"
5. VERIFY → Re-run full static analysis to confirm no new contradictions
```

### Audit Checklist (full scan)

- [ ] All `handoffs:` agents are in parent's `agents:` list
- [ ] All `agents:` entries correspond to existing `.agent.md` files
- [ ] No `agents: []` with `handoffs:` defined
- [ ] Agents with `agents:` have `"agent"` in `tools:`
- [ ] Read-only agents don't declare `edit` or `execute`
- [ ] All tool names in `tools:` are valid
- [ ] All `applyTo` globs match project structure
- [ ] No contradictory instructions between files
- [ ] Skill `name:` matches directory name
- [ ] Prompt `agent:` field references existing agent

---

## 5. Where to Embed Improvements

This is the MOST IMPORTANT meta-lesson. Not all storage is equal.

| Location                               | Activation              | Best For                                                   | Risk                                     |
| -------------------------------------- | ----------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| **Agent `.agent.md` Constraints**      | 🔴 ALWAYS-ON            | Behavioral rules, critical constraints, mindset            | None — always loaded                     |
| **Instruction `.instructions.md`**     | 🔴 AUTO (via `applyTo`) | Per-file rules, domain conventions                         | Only loads when matching file is touched |
| **Skill `SKILL.md` (no fork)**         | 🟡 ON-DEMAND            | Reference knowledge, procedures, checklists                | Must be invoked                          |
| **Skill `SKILL.md` (`context: fork`)** | 🟡 ON-DEMAND + ISOLATED | Comprehensive scans, audits that read many files           | Result only, no context pollution        |
| **Prompt `.prompt.md`**                | 🟡 SLASH COMMAND        | Single focused task with parameters                        | Must be explicitly invoked via `/`       |
| **Hook `hooks/*.json`**                | 🟢 AUTOMATIC            | Lifecycle automation (PreToolUse, PostToolUse, onFileEdit) | Preview feature, may change              |
| **Memory `/memories/`**                | ⚪ PASSIVE              | Historical record, changelog, lessons learned              | Must remember to consult                 |

**Rule of thumb:**

- If you ALWAYS want the behavior → embed in agent instructions
- If it's domain-specific per file type → create `.instructions.md` with `applyTo`
- If it's reference knowledge → create as skill (no fork)
- If it's a focused audit/scan → create as skill (fork)
- If it's a parameterized task → create `.prompt.md`
- If it's automatic enforcement → use hooks (Preview)
- If it's just a record → use memory

---

## 6. Agent Taxonomy — Classification System

Every agent MUST fit exactly one archetype. This determines tool permissions, invocation patterns, and design constraints.

| Archetype       | Purpose                                                          | Tool Profile           | Invocation                       | Zan.IA Examples                                           |
| --------------- | ---------------------------------------------------------------- | ---------------------- | -------------------------------- | --------------------------------------------------------- |
| **Coordinator** | Orchestrates multi-agent workflows, manages HITL gates           | Full toolkit + `agent` | User-facing + subagent-invocable | `orchestrator`                                            |
| **Worker**      | Executes a pipeline phase — structured input → structured output | Domain-specific        | Subagent-invocable               | `planner`, `implementer`, `reviewer`                  |
| **Specialist**  | Deep domain expertise, operates independently                    | Domain-specific tools  | User-invocable or on-demand      | `content-creator`, `performance-auditor`, `refactor-css` |
| **Auditor**     | Read-only analysis, produces reports — NEVER modifies            | read, search only      | On-demand or post-cycle          | `reviewer` (review mode)                                   |
| **Gatekeeper**  | Enforces quality gates automatically                             | read, search, hooks    | Automatic (hooks)                | _(future)_                                                |

### Archetype-Specific Rules

| Rule                                                                          | Applies To  |
| ----------------------------------------------------------------------------- | ----------- |
| Only Coordinators have `handoffs:` to domain agents                           | Coordinator |
| Workers receive structured context from Coordinator (plan path, issue number) | Worker      |
| Specialists declare `agents: []` unless they orchestrate                      | Specialist  |
| Auditors MUST NOT declare `edit` or `execute`                                 | Auditor     |
| Every agent body follows the 7-point prompt structure                         | All         |

---

## 7. Agent Body Structure — The 7-Point Prompt Engineering Template

Every `.agent.md` body MUST follow this evidence-based structure. Structured prompts produce 40-60% more reliable outputs than prose-style instructions (Anthropic, OpenAI, Google DeepMind research).

### Mandatory Sections (in order)

```markdown
# Agent Name — One-Line Purpose

## Role

[2-4 sentences: identity, domain, primary output]

## Constraints

[NEVER rules first, ALWAYS rules second — bold for emphasis]

## Context Sources

[Prioritized list of files/docs to consult before acting]

## Procedure

[Numbered steps with decision branches and edge cases]

## Patterns & Examples

[✅ Correct / ❌ Wrong pairs — at least 2-3 per critical pattern]

## Output Format

[File path, structure, success criteria: "Done when X is true"]

## Reference Files

[Canonical file list with brief descriptions]
```

### Prompt Engineering Principles

| Principle                 | Application                                    | Example                                                                         |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| **Chain-of-Thought**      | Procedure guides step-by-step reasoning        | "First identify file type → check applicable instructions → verify conventions" |
| **Few-Shot Examples**     | Patterns section shows ✅/❌ pairs             | Correct `$state()` vs incorrect `let` side by side                              |
| **Constraint Framing**    | NEVER before ALWAYS (negatives grab attention) | "NEVER use hardcoded colors. ALWAYS use var(--color-\*)"                        |
| **Output Specification**  | Exact format, path, and "done when" condition  | "Save to .github/plans/issue-{N}-{slug}.md"                                     |
| **Edge Case Enumeration** | Procedure branches for failures                | "If build fails → read errors → fix → retry (max 3x)"                           |
| **Checklist Integration** | Embed ☐ checklists in Procedure                | "☐ Design tokens, ☐ BEM naming, ☐ No hex colors"                                |
| **Persona Consistency**   | Role defines voice used throughout             | SvelteKit specialist → SvelteKit terminology throughout                         |

### Common Agent Body Anti-Patterns

| Anti-Pattern                                   | Why It Fails                                | Fix                                                             |
| ---------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Prose-style instructions (long paragraphs)     | Rules buried in text, model skips them      | Use 7-point template with clear headings                        |
| Missing constraints section                    | Agent invents solutions outside conventions | Add explicit NEVER/ALWAYS rules                                 |
| No output format specified                     | Ambiguous completion, inconsistent results  | Define file path, format, success criteria                      |
| Overloaded agent (3+ responsibilities)         | Context dilution, poor performance          | Split into single-responsibility agents                         |
| Vague role ("you are a developer")             | No domain anchoring, generic output         | Specific: "Svelte 5 specialist for institutional landing pages" |
| Happy path only (no edge cases)                | Silent failure on unexpected inputs         | Add "If X fails → Y" branches in Procedure                      |
| Agent body >300 lines without skill extraction | Context bloat                               | Move reference material to SKILL.md, keep agent lean            |

---

## 8. Context Budget Management

Agent context windows are finite. These rules prevent degradation from context overflow.

| Principle                  | Rule                                                    | Why                                                           |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| **Single Responsibility**  | Each agent does ONE thing                               | Narrow scope = shorter instructions = more room for task data |
| **Fork Heavy Skills**      | Skills reading >5 files → `context: fork`               | Isolated subagent, only result returned                       |
| **Progressive Disclosure** | `AGENTS.md` ≤ 200 lines; `.instructions.md` ≤ 100 lines | Always-on instructions must be lean                           |
| **Subagent Isolation**     | Workers via `runSubagent`, not inline                   | Parent context stays clean                                    |
| **Structured Handoffs**    | Pass plan path + issue number, not full conversation    | Minimal data transfer between agents                          |

### Decision: Split Agent?

```
Agent body > 300 lines?
├── YES → Multiple distinct responsibilities?
│   ├── YES → SPLIT into multiple agents
│   └── NO  → Extract reference material to SKILL.md
└── NO  → Healthy size
```

### Decision: Use `context: fork`?

```
Skill reads >5 files OR produces >100 lines?
├── YES → Add `context: fork` to SKILL.md
└── NO  → `context: inline` (default)
```

---

## 9. Error Recovery Patterns

Multi-agent pipelines fail in predictable ways. Handle these gracefully.

| Failure Mode               | Symptom                                   | Detection                    | Recovery                                                        |
| -------------------------- | ----------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| **Subagent Timeout**       | `runSubagent` returns nothing after 120s  | Missing output               | Retry 1x with simplified prompt; escalate to user if persistent |
| **Subagent Hallucination** | Edits files not in plan, invents features | Reviewer detects scope creep | Revert, re-plan with stricter constraints, re-implement         |
| **Infinite Review Loop**   | Same critical issue 3 times               | Iteration counter            | Hard stop at 3; document risks; proceed with caveats            |
| **Build Break**            | `npm run build` fails                     | Implementer detects          | Fix errors (max 3 attempts); escalate if persistent             |
| **Missing Context**        | Worker returns incomplete result          | Coordinator observes         | Enrich prompt with plan path, issue details, file list          |
| **Stale Plan**             | Plan references changed files             | Implementer detects mismatch | Report to Coordinator → re-plan                                 |
| **Tool Permission Denied** | Agent tries undeclared tool               | System blocks                | Harness engineer adds tool to agent declaration                 |
| **Context Overflow**       | Output truncated mid-response             | Incomplete output            | Split task; use `context: fork`; reduce input size              |

### Recovery Decision Tree

```
Pipeline step fails
├── Current agent can fix? → Fix + retry (max 3x per step)
└── Current agent can't fix? → Escalate to Coordinator
    ├── Coordinator can fix? → Fix + resume pipeline
    └── Coordinator can't fix? → 🛑 HITL: present failure + attempts + recommendation
```

---

## 10. Agent Performance Metrics (KPIs)

Measure harness health with these quantitative and qualitative KPIs.

### Quantitative (from Chronicle)

| KPI                                                               | Healthy Range | Action if Violated                                 |
| ----------------------------------------------------------------- | ------------- | -------------------------------------------------- |
| Pipeline Success Rate (% cycles without critical findings)        | > 80%         | Investigate planner/implementer instructions       |
| First-Pass Quality (% reviews with zero critical issues)          | > 60%         | Improve implementer constraints and patterns       |
| Review Loop Count (avg iterations to PR approval)                 | < 1.5         | If > 2.0, planner missing key patterns             |
| Session Turns per Task (avg per completed issue)                  | < 30          | If > 50, agent instructions vague or missing skill |
| Checkpoint Rate (% sessions with ≥1 checkpoint)                   | > 70%         | Agents not tracking progress                       |
| File Thrash Rate (files with >5 reads in a session)               | 0 files       | Add instruction with `applyTo` for that file       |
| Quality Gate Compliance (% edit sessions running `npm run check`) | 100%          | Add hook or enforce in implementer constraints     |

### Review Cadence

- **Per-cycle:** Pipeline Success Rate, Review Loop Count, Quality Gate Compliance
- **Weekly:** Session Turns per Task, Checkpoint Rate, File Thrash Rate
- **Monthly:** Full KPI review + improvement planning

---

## 11. Harness Versioning & Testing

### Versioning Rules

| Rule             | Practice                                              |
| ---------------- | ----------------------------------------------------- |
| Git-tracked      | All `.github/` files versioned in repository          |
| Branch isolation | Harness changes in `harness/` prefixed branches       |
| PR review        | Harness PRs reviewed by human (not auto-merged)       |
| Changelog        | Every change in `/memories/repo/harness-changelog.md` |
| Rollback         | Revert commit if change degrades performance          |

### Change Impact Levels

| Level             | Scope                                       | Review Required                                 |
| ----------------- | ------------------------------------------- | ----------------------------------------------- |
| **P0 — Critical** | Changes permissions, tools, `handoffs:`     | Full static analysis + Chronicle + human review |
| **P1 — Major**    | Changes agent body instructions/constraints | Static analysis + build verify                  |
| **P2 — Minor**    | Typos, wording, non-semantic changes        | Build verify only                               |
| **P3 — Cosmetic** | Formatting, whitespace                      | None                                            |

### Test Levels

| Level             | What                                               | How                                      | When                              |
| ----------------- | -------------------------------------------------- | ---------------------------------------- | --------------------------------- |
| **L1 — Static**   | Frontmatter validity, tool names, cross-references | Audit checklist                          | Every change                      |
| **L2 — Build**    | `npm run check` + `npm run build`                  | Run both commands                        | Every change touching paths/tools |
| **L3 — Dry-Run**  | Trivial task through full pipeline                 | `/start-improvement` with cosmetic change | P0 and P1 changes                 |
| **L4 — Baseline** | Compare KPIs before/after                          | Chronicle 7-day before/after comparison  | P0 changes, monthly               |

---

## 12. Official VS Code Copilot Primitives — Complete Field Reference

### `.agent.md` All Fields

| Field                      | Type            | Required | Notes                                                                                   |
| -------------------------- | --------------- | -------- | --------------------------------------------------------------------------------------- |
| `name`                     | string          | No       | Default: filename without extension                                                     |
| `description`              | string          | No       | Chat input placeholder. Use "Use when: ..." for semantic discovery                      |
| `argument-hint`            | string          | No       | Hint shown in input field                                                               |
| `tools`                    | string[]        | No       | Available tools. If omitted, inherits defaults                                          |
| `agents`                   | string[]        | No       | Allowed subagents. `*` = all, `[]` = none. When declared, `"agent"` MUST be in `tools:` |
| `model`                    | string/string[] | No       | Model name or priority-ordered array                                                    |
| `user-invocable`           | boolean         | No       | Default `true`. `false` hides from dropdown                                             |
| `disable-model-invocation` | boolean         | No       | Default `false`. `true` blocks auto-invocation as subagent                              |
| `target`                   | string          | No       | `vscode` or `github-copilot`                                                            |
| `handoffs`                 | object[]        | No       | UI-button transitions. Each: `label`, `agent`, `prompt`, `send`                         |
| `hooks`                    | object[]        | No       | **(Preview)** Lifecycle commands: `onFileEdit`, `PreToolUse`, `PostToolUse`, etc.       |

### `.instructions.md` All Fields

| Field         | Type   | Required | Notes                                                                                                                                         |
| ------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | string | No       | Display name. Default: filename                                                                                                               |
| `description` | string | No       | Semantic matching. Use "Use when: ..."                                                                                                        |
| `applyTo`     | string | No       | Glob for auto-attachment. Comma-separated for multiple: `"src/**/*.svelte, src/lib/app.css"`. Without it, loaded only via `description` match |

### `SKILL.md` All Fields

| Field                      | Type    | Required | Notes                                                       |
| -------------------------- | ------- | -------- | ----------------------------------------------------------- |
| `name`                     | string  | **YES**  | MUST match parent directory name. Mismatch = silent failure |
| `description`              | string  | **YES**  | Max 1024 chars. Use "Use when: ..."                         |
| `argument-hint`            | string  | No       | Hint in input                                               |
| `user-invocable`           | boolean | No       | Default `true`                                              |
| `disable-model-invocation` | boolean | No       | Default `false`                                             |
| `context`                  | string  | No       | `inline` (default) or `fork` (isolated subagent)            |

### `.prompt.md` All Fields

| Field           | Type     | Required | Notes                                                           |
| --------------- | -------- | -------- | --------------------------------------------------------------- |
| `description`   | string   | No       | Shown in `/` menu                                               |
| `name`          | string   | No       | Name after `/`. Default: filename                               |
| `argument-hint` | string   | No       | Hint in input                                                   |
| `agent`         | string   | No       | `ask`, `agent`, `plan`, or custom agent. Absent = current agent |
| `model`         | string   | No       | Language model                                                  |
| `tools`         | string[] | No       | Available tools                                                 |

---

## 13. Files That Must Stay in Sync

When changing ANY harness rule or convention, ALL of these must be checked:

```
Rule change
  │
  ├── .agent.md files (apply the rule)
  ├── AGENTS.md (document the rule in tables/sections)
  ├── .github/instructions/*.instructions.md (update tool rules)
  ├── .github/skills/harness-engineering-reference/SKILL.md (THIS FILE)
  ├── .github/copilot-instructions.md (if exists)
  ├── docs/harness-validation-report.md (validation report)
  └── /memories/repo/harness-changelog.md (changelog)
```

---

## 14. Complete Anti-Patterns Catalog

### Structural Anti-Patterns

| Anti-Pattern                                     | Detection         | Fix                                          |
| ------------------------------------------------ | ----------------- | -------------------------------------------- |
| Agent has `handoffs:` but agent not in `agents:` | Static analysis   | Add agent to `agents:` list                  |
| `agents:` declared but `agent` not in `tools:`   | Static analysis   | Add `"agent"` to `tools:`                    |
| `agents: []` with `handoffs:` defined            | Static analysis   | Remove contradiction                         |
| Old tool name in `tools:`                        | grep for old name | Replace with new name(s)                     |
| Read-only agent declares `edit` or `execute`     | Static analysis   | Remove edit/execute from tools               |
| Skill `name:` doesn't match directory name       | Static analysis   | Align name with directory                    |
| Prompt missing `agent:` field                    | Static analysis   | Add explicit agent reference                 |
| `applyTo` with unsupported syntax                | Static analysis   | Use comma-separated string: `"glob1, glob2"` |

### Behavioral Anti-Patterns

| Anti-Pattern                                                 | Detection                   | Fix                                              |
| ------------------------------------------------------------ | --------------------------- | ------------------------------------------------ |
| Rule fixed in agent but not in AGENTS.md table               | Compare agent vs AGENTS.md  | Update AGENTS.md                                 |
| Behavioral rule in `/memories/` instead of agent constraints | Check memory vs constraints | Move to agent constraints                        |
| Agent body >300 lines without skill extraction               | Read agent file             | Extract reference material to SKILL.md           |
| Prose-style agent body without 7-point structure             | Read agent file             | Restructure using 7-point template               |
| Agent with 3+ distinct responsibilities                      | Read agent file             | Split into multiple single-responsibility agents |

### Pipeline Anti-Patterns

| Anti-Pattern                                                        | Detection | Fix                                          |
| ------------------------------------------------------------------- | --------- | -------------------------------------------- |
| Session >30 turns without checkpoint                                | Chronicle | Improve planning constraints                 |
| Same file read >5 times in one session                              | Chronicle | Add instruction with `applyTo` for that file |
| Edits without `npm run check`                                       | Chronicle | Add verification hook or constraint          |
| Failure-side repetition (user frustration + same agent + same file) | Chronicle | Fix agent instructions for that file/pattern |

---

## 15. Chronicle Integration

When available, use `session_store_sql` to detect:

- **Stuck sessions** — many turns, no checkpoints
- **File thrashing** — same file read >5 times across sessions
- **Failure-side repetition** — user frustration + same agent + same file
- **Missing quality gates** — edits without `npm run check`
- **Tool permission gaps** — tools used but not declared by agent
- **Long sessions** — >50 turns indicates planning failure
- **Tool underuse** — `manage_todo_list` never used in multi-edit sessions

See `harness-engineer.agent.md` for complete SQL templates and Chronicle analysis procedures.
