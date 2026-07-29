---
name: harness-engineering-reference
description: 'Reference knowledge for harness engineering — tool naming conventions, agent creation rules, proactive audit mindset, and improvement embedding strategies. Use when: auditing harness consistency, creating/modifying agents/instructions/prompts/skills, troubleshooting tool rename alerts, fixing agent permission violations, or learning harness engineering best practices.'
argument-hint: '[audit | create-agent | fix-tools | learn] — what do you need?'
user-invocable: true
disable-model-invocation: false
context: inline
---

# Harness Engineering — Reference Knowledge

Complete reference for maintaining and evolving the Zan.IA project harness (agents, instructions, prompts, skills).

## Companion Skills

| Skill                                              | Purpose                                                                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`model-providers`](./../model-providers/SKILL.md) | Catálogo de modelos OpenCode Go / Zen com análise de custo × capacidade para cada papel do pipeline. **Source of truth** para atribuição de modelos. |

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
name: 'nome-do-agente'
description: 'Portuguese description. Use when: ...'
tools:
  - 'read'
  - 'search'
  - 'agent' # ← REQUIRED if agents: is declared
agents:
  - 'subagent-1'
user-invocable: true
disable-model-invocation: false
handoffs:
  - label: '🔍 Label'
    agent: target-agent
    prompt: 'Instructions for the handoff'
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

## 6. Official VS Code Copilot Primitives — Complete Field Reference

> **Process knowledge (agent taxonomy, 7-point template, KPIs, Chronicle queries, error recovery, versioning):** see `.github/skills/harness-audit/SKILL.md` — the audit skill contains the complete Continual Harness workflow.

### `.agent.md` All Fields

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

See `.github/skills/harness-audit/SKILL.md` for complete SQL templates and Chronicle analysis procedures.
