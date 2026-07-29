---
name: harness-audit
description: 'Audit and improve the project harness — agents, instructions, prompts, skills. Use when: auditing harness consistency, analyzing Chronicle session data, proposing harness improvements, maintaining agent lifecycle, detecting anti-patterns, or optimizing the development pipeline. Activates for: harness, audit, agent, instruction, prompt, skill, chronicle, KPI, consistency, improvement.'
user-invocable: false
disable-model-invocation: false
context: fork
---

# Harness Audit — Auditoria de Harness

Skill para auditoria e melhoria contínua do harness do projeto (agentes, instruções, prompts, skills). Segue os princípios de Continual Harness (arXiv:2605.09998).

> **Origem:** Absorve o conhecimento do agente `harness-engineer` (descontinuado). Esta skill é invocada pelo `software-engineer` para auditoria entre ciclos do pipeline.

> **Companion skill:** `harness-engineering-reference` — referência canônica de tool names, agent creation rules, e audit checklist.

---

## 1. Role

You audit, maintain, and iteratively refine all harness components (agents, instructions, prompts, skills) following Continual Harness principles. You operate in **auto-learn mode**:

1. **Observe the pipeline passively** — every tool call, every handoff, every artifact written becomes training signal
2. **Extract patterns and anti-patterns** from session data via Chronicle (`session_store_sql`)
3. **Propose improvements** as GitHub issues with quantified evidence (success rate, error patterns, handoff failures)
4. **Self-improve the harness** through a closed feedback loop: observe → analyze → propose → implement → measure

You run **between cycles** (post-PR, weekly review, or triggered by hooks) to analyze accumulated session data and propose the next round of harness improvements.

---

## 2. Agent Taxonomy — Classification System

Every agent in the project harness MUST fit exactly one of these archetypes:

| Archetype       | Purpose                                                                                         | Tool Profile                                                   | Invocation                       | Examples                             |
| --------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------- | ------------------------------------ |
| **Coordinator** | Orchestrates multi-agent workflows, manages HITL gates, tracks pipeline state                   | Full toolkit + agent tool                                      | User-facing + subagent-invocable | `orchestrator`, `software-engineer`  |
| **Worker**      | Executes a specific phase of a pipeline — receives structured input, produces structured output | Domain-specific (edit for implementer, read-only for reviewer) | Subagent-invocable (usually)     | `planner`, `implementer`, `reviewer` |
| **Specialist**  | Deep expertise in one domain, operates independently or on-demand                               | Domain-specific tools                                          | User-invocable or on-demand      | `content-creator`, `refactor-css`    |
| **Auditor**     | Read-only analysis, produces reports, detects issues — NEVER modifies files                     | read, search, specialized analysis tools                       | On-demand or post-cycle          | `reviewer` (review mode)             |
| **Gatekeeper**  | Validates quality gates, enforces conventions, blocks violations                                | read, search, hooks                                            | Automatic (hooks) or on-demand   | _(future: CI validator agent)_       |

### Archetype Decision Tree

```
New agent needed?
├── Does it coordinate multiple other agents?
│   └── YES → Coordinator (needs agent tool, full agents list)
├── Does it execute a step in a predefined pipeline?
│   └── YES → Worker (narrow scope, structured input/output)
├── Does it have deep domain expertise but doesn't orchestrate?
│   └── YES → Specialist (domain tools, on-demand invocation)
├── Is it read-only and produces analysis/reports?
│   └── YES → Auditor (read/search only, NEVER edit/execute)
└── Does it enforce rules automatically?
    └── YES → Gatekeeper (hooks, PreToolUse events)
```

### Archetype Design Rules

| Rule                                                                  | Applies To  | Rationale                                                                  |
| --------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------- |
| Only Coordinators have `handoffs:` to other domain agents             | Coordinator | Workers return results; they don't handoff                                 |
| Workers receive structured context from Coordinator                   | Worker      | Isolated context = no shared memory; all needed data must be in the prompt |
| Specialists declare `agents: []` unless they orchestrate              | Specialist  | Prevents unintended subagent invocation                                    |
| Auditors MUST NOT declare `edit` or `execute`                         | Auditor     | Read-only by definition                                                    |
| Every agent body follows the **7-point prompt structure** (see below) | All         | Consistency, predictability, maintainability                               |

---

## 3. Agent Body Structure — The 7-Point Prompt Engineering Template

Every `.agent.md` body MUST follow this structure:

```markdown
# Agent Name — One-Line Purpose

## Role

[2-4 sentences: who you are, what you do, what makes you different]

- Identity statement ("You are a...")
- Domain expertise
- Primary output type

## Constraints

[ALWAYS/NEVER rules — the most critical section]

- NEVER rules first (what you must NOT do under any circumstances)
- ALWAYS rules second (mandatory behaviors)
- Use bold for emphasis: **NEVER**, **ALWAYS**

## Context Sources

[What information to gather BEFORE acting]

- Prioritized list of files/docs to consult
- Order matters — most authoritative first

## Procedure

[Step-by-step workflow with decision points]

- Numbered steps
- Each step: action → verification → handoff condition
- Include edge case handling ("If X fails, then Y")

## Patterns & Examples

[Concrete code/style patterns — few-shot examples]

- ✅ Correct pattern (with brief explanation)
- ❌ Wrong pattern (with reason why)
- At least 2-3 examples per critical pattern

## Output Format

[Exactly what the agent produces]

- File path, format, structure
- Success criteria ("Complete when X is true")

## Reference Files

[Canonical list of files to consult]

- Absolute paths from workspace root
- Brief description of what each contains
```

### Prompt Engineering Principles

| Principle                 | Application                                          |
| ------------------------- | ---------------------------------------------------- |
| **Chain-of-Thought**      | Procedure section guides reasoning step by step      |
| **Few-Shot Examples**     | Patterns section shows ✅/❌ pairs                   |
| **Constraint Framing**    | NEVER rules before ALWAYS rules                      |
| **Output Specification**  | Define exact format, file path, and success criteria |
| **Edge Case Enumeration** | Procedure branches for failure modes                 |

### Anti-Patterns in Agent Body Writing

| Anti-Pattern                                                     | Why It Fails                                        | Fix                                                                       |
| ---------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| **Prose-style instructions** — long paragraphs without structure | Model skips or misinterprets buried rules           | Use the 7-point template with clear headings                              |
| **Missing constraints** — no NEVER/ALWAYS rules                  | Agent invents solutions outside conventions         | Add explicit NEVER rules for common violations                            |
| **No output format** — "do your best"                            | Ambiguous completion criteria, inconsistent results | Specify file path, format, and "done when" condition                      |
| **Overloaded agent** — 3+ distinct responsibilities              | Context dilution, poor performance on all tasks     | Split into multiple single-responsibility agents                          |
| **Vague role** — "you are a developer"                           | No domain anchoring, generic responses              | Be specific: "You are a React specialist for institutional landing pages" |
| **No edge cases** — happy path only                              | Agent fails silently on unexpected inputs           | Add "If X fails → Y" branches in Procedure                                |

---

## 4. Agent Performance Metrics (KPIs)

### Quantitative KPIs (from Chronicle)

| KPI                         | Query Method                                                              | Healthy Range | Action if Violated                                     |
| --------------------------- | ------------------------------------------------------------------------- | ------------- | ------------------------------------------------------ |
| **Pipeline Success Rate**   | % of issue→PR cycles that complete without critical/major review findings | > 80%         | Investigate planner or implementer instructions        |
| **First-Pass Quality**      | % of reviews with zero critical issues                                    | > 60%         | Improve implementer constraints and patterns           |
| **Review Loop Count**       | Average iterations before PR approval                                     | < 1.5         | If > 2.0, planner is missing key patterns              |
| **Session Turns per Task**  | Average turns per completed issue                                         | < 30          | If > 50, agent instructions too vague or missing skill |
| **Checkpoint Rate**         | % of sessions with at least 1 checkpoint                                  | > 70%         | Low rate = agents not tracking progress                |
| **File Thrash Rate**        | Files with >5 reads in a single session                                   | 0 files       | Add instruction with `applyTo` for that file           |
| **Quality Gate Compliance** | % of edit sessions that ran `npm run check`                               | 100%          | Add hook or enforce in implementer constraints         |

### Qualitative KPIs (from manual review)

| KPI                      | Target                        |
| ------------------------ | ----------------------------- |
| **Constraint Adherence** | 0 violations per session      |
| **Output Completeness**  | 100% of specified outputs     |
| **HITL Compliance**      | 100% of gates respected       |
| **Error Recovery**       | All failures surfaced to user |

### KPI Review Cadence

- **Per-cycle:** Pipeline Success Rate, Review Loop Count, Quality Gate Compliance
- **Weekly:** Session Turns per Task, Checkpoint Rate, File Thrash Rate
- **Monthly:** Full KPI review + harness improvement planning

---

## 5. Context Budget Management

### Context Budget Principles

| Principle                  | Rule                                                           | Rationale                                                                          |
| -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Single Responsibility**  | Each agent does ONE thing                                      | Narrow scope = shorter instructions = more room for task data                      |
| **Fork Heavy Skills**      | Skills that read >5 files → `context: fork`                    | Isolated subagent, only result returned to main context                            |
| **Progressive Disclosure** | Instructions loaded on-demand via `applyTo`, not all always-on | `AGENTS.md` = global (200 lines max), `.instructions.md` = per-file (50-100 lines) |
| **Subagent Isolation**     | Workers run as subagents with `runSubagent`                    | Parent context stays clean; worker gets dedicated context                          |
| **Structured Handoffs**    | Coordinator passes minimal structured data to workers          | Don't dump entire conversation; pass plan path + issue number                      |

### When to Split an Agent

```
Agent body > 300 lines?
├── YES → Does it have >1 distinct responsibility?
│   ├── YES → SPLIT into multiple agents
│   └── NO  → Move reference material to a SKILL.md, keep agent lean
└── NO  → Agent is within healthy size
```

### When to Use `context: fork` for Skills

```
Skill reads >5 files OR produces >100 lines of output?
├── YES → Add `context: fork` to SKILL.md frontmatter
└── NO  → `context: inline` (default) is fine
```

---

## 6. Error Recovery Patterns

### Failure Mode Catalog

| Failure Mode               | Symptom                                                 | Detection                                          | Recovery                                                                                    |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Subagent Timeout**       | `runSubagent` returns no result after 120s              | Coordinator observes missing output                | Retry once with simplified prompt; if still fails, report to user with last successful step |
| **Subagent Hallucination** | Worker edits files not in plan or invents features      | Reviewer detects scope creep                       | Revert changes, re-plan with stricter constraints, re-implement                             |
| **Infinite Review Loop**   | Same critical issue found 3 times                       | Reviewer iteration counter                         | Stop loop, document risks, proceed with caveats (3-iteration max is a hard constraint)      |
| **Build Break**            | `npm run build` fails after implementation              | Implementer detects build failure                  | Fix compilation errors (max 3 attempts), if persistent → escalate to user                   |
| **Missing Context**        | Worker doesn't have enough info to complete task        | Worker returns incomplete result or asks questions | Coordinator enriches prompt with plan path, issue details, file list                        |
| **Stale Plan**             | Plan references files that changed since it was written | Implementer detects mismatch                       | Implementer reports to Coordinator → re-plan                                                |
| **Tool Permission Denied** | Agent tries to use a tool not in its `tools:` list      | System blocks the call                             | Add tool to agent's declaration (if appropriate)                                            |
| **Context Overflow**       | Agent output truncated mid-response                     | Incomplete output, missing sections                | Split task, use `context: fork` skill, or reduce input size                                 |

### Recovery Decision Tree

```
Pipeline step fails
├── Can the current agent fix it?
│   ├── YES → Fix and retry (max 3 attempts per step)
│   └── NO  → Escalate to Coordinator
│       ├── Coordinator can fix? → Fix and resume pipeline
│       └── Coordinator can't fix? → 🛑 HITL: present to user with:
│           - What failed
│           - What was attempted
│           - Recommended next action
```

### Graceful Degradation Principle

When a non-critical step fails, the pipeline SHOULD continue with documented caveats rather than stopping entirely. Only critical failures (build break, security issue, data loss) should block the pipeline.

---

## 7. Harness Versioning Strategy

### Versioning Rules

| Rule                 | Practice                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Git-tracked**      | All `.github/` files are versioned in the same repository                                                                   |
| **Branch isolation** | Harness changes go in `harness/` prefixed branches, separate from feature branches                                          |
| **PR review**        | Harness PRs reviewed by a human (not auto-merged) — harness changes affect ALL agents                                       |
| **Changelog**        | Every harness change documented in `/memories/repo/harness-changelog.md` with: date, files changed, reason, expected impact |
| **Rollback**         | If a harness change degrades performance, revert the commit — changelog provides audit trail                                |

### Harness Change Impact Levels

| Level             | Scope                                                  | Examples                                                    | Review Required                                       |
| ----------------- | ------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------- |
| **P0 — Critical** | Changes agent permissions, tool lists, or `handoffs:`  | Adding `edit` to a read-only agent, changing `agents:` list | Full static analysis + Chronicle check + human review |
| **P1 — Major**    | Changes agent body instructions or constraints         | Rewriting implementer procedure, adding new NEVER rules     | Static analysis + build verify                        |
| **P2 — Minor**    | Typo fixes, wording improvements, non-semantic changes | Fixing a broken link, improving description clarity         | Build verify only                                     |
| **P3 — Cosmetic** | Formatting, whitespace, comment updates                | Adding a missing newline                                    | None                                                  |

---

## 8. Harness Testing Methodology

### Test Levels

| Level                       | What to Test                                                    | How                                                                               | When                                                       |
| --------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **L1 — Static Analysis**    | Frontmatter validity, tool names, cross-references              | Manual audit checklist                                                            | Every harness change                                       |
| **L2 — Build Verify**       | `npm run check` and `npm run build` pass                        | Run both commands                                                                 | Every harness change that touches file paths or tool names |
| **L3 — Dry-Run Pipeline**   | Run a trivial task through the full Plan→Implement→Review cycle | Use a cosmetic change (e.g., "fix typo")                                          | P0 and P1 changes                                          |
| **L4 — Chronicle Baseline** | Compare KPIs before/after harness change                        | Query Chronicle for 7 days before and after change, compare Pipeline Success Rate | P0 changes, monthly review                                 |

### Test Checklist

- [ ] L1: Static audit of ALL agents (not just the changed one) — zero violations
- [ ] L2: `npm run check` passes; `npm run build` succeeds
- [ ] L3 (P0/P1 only): Dry-run pipeline completes without critical issues
- [ ] Changelog entry written in `/memories/repo/harness-changelog.md`
- [ ] AGENTS.md updated if agent tables, tool lists, or conventions changed
- [ ] Validation report updated in `docs/harness-validation-report.md`

---

## 9. Three-Layer Permission Audit

### Layer 1: Static Analysis (Primary — always works)

Read all `.agent.md` frontmatter and cross-reference:

- For each `handoffs:` → agent B: is B in `agents:` list?
- For each `agents:` → agent C: does `C.agent.md` exist?
- `agents: []` + `handoffs:` defined → contradiction
- `tools:` list → are all tool names valid?

Build a permission matrix:

| Agent  | Declared Tools | Declared Subagents | Issues Found |
| ------ | -------------- | ------------------ | ------------ |
| _name_ | _tool list_    | _subagent list_    | _(check)_    |

### Layer 2: Hooks (Future)

JSON hook in `.github/hooks/validate-permissions.json`:

- Fires BEFORE tool/subagent execution (`PreToolUse`, `PreSubagentUse` events)
- Logs BLOCKED attempts to `/memories/repo/permission-violations.md`

### Layer 3: Chronicle Inverted Check (detects over-permissive config)

```sql
SELECT DISTINCT sf.tool_name, s.agent_name
FROM session_files sf
JOIN sessions s ON s.id = sf.session_id
WHERE s.agent_name IS NOT NULL
  AND sf.tool_name IS NOT NULL
ORDER BY s.agent_name, sf.tool_name;
```

→ If a tool appears here that the agent DOESN'T declare → the system allowed it anyway (too permissive).

---

## 10. Chronicle Integration — Session History Analysis

### Available Tables

| Table                 | Key Columns                                                           | What It Reveals                             |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------- |
| `sessions`            | id, cwd, repository, branch, agent_name, created_at                   | Project context, session timeline           |
| `turns`               | session_id, turn_index, user_message, assistant_response              | Conversation flow, message patterns         |
| `session_files`       | session_id, file_path, tool_name                                      | File access hotspots, tool usage patterns   |
| `checkpoints`         | session_id, work_done, technical_details, important_files, next_steps | Session summaries, completion state         |
| `search_index` (FTS5) | content, session_id, source_type                                      | Full-text search across all session content |

### Pattern Extraction (what works well)

```sql
-- Sessions that completed successfully (have checkpoints)
SELECT s.id, s.agent_name, COUNT(c.id) as checkpoint_count
FROM sessions s
JOIN checkpoints c ON c.session_id = s.id
GROUP BY s.id
ORDER BY checkpoint_count DESC;
```

```sql
-- Most productive sessions (many files + checkpoints)
SELECT s.id,
       (SELECT COUNT(*) FROM session_files sf WHERE sf.session_id = s.id) as files_touched,
       (SELECT COUNT(*) FROM checkpoints c WHERE c.session_id = s.id) as checkpoints
FROM sessions s
WHERE checkpoints > 0
ORDER BY files_touched DESC;
```

### Anti-Pattern Detection (what goes wrong)

| Anti-Pattern                                    | Detection Method                                                                                                                                                                          | Harness Fix                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Stuck sessions** — many turns, no checkpoints | `SELECT s.id, COUNT(t.id) as turns FROM sessions s JOIN turns t ON t.session_id = s.id LEFT JOIN checkpoints c ON c.session_id = s.id WHERE c.id IS NULL GROUP BY s.id HAVING turns > 10` | Agent instructions too vague → improve planning constraints       |
| **File thrashing** — same file read repeatedly  | `SELECT file_path, COUNT(*) as reads FROM session_files WHERE tool_name = 'read_file' GROUP BY file_path HAVING reads > 5`                                                                | Missing documentation → create skill or instruction for that file |

### Repetition Detection — Two Distinct Causes

| Type                                                                   | What it looks like                                                                                | Root Cause                                                   | Harness Fix                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Demand-side** — user keeps requesting the same task                  | "Add a testimonial", "Create a new section" across different sessions                             | Missing prompt template or skill                             | Create `.prompt.md` or `SKILL.md`                                   |
| **Failure-side** — user keeps complaining about the same agent mistake | "You forgot X again", "Still not working", "I already told you to Y" in same or adjacent sessions | Agent instructions are incomplete, ambiguous, or conflicting | Fix the agent's `.agent.md` constraints or `.instructions.md` rules |

**Failure-side detection query:**

```sql
SELECT t.session_id, t.turn_index, t.user_message,
       LAG(t.user_message) OVER (PARTITION BY t.session_id ORDER BY t.turn_index) as prev_user_msg
FROM turns t
WHERE t.user_message != ''
  AND (t.user_message LIKE '%again%'
    OR t.user_message LIKE '%still%'
    OR t.user_message LIKE '%já%'
    OR t.user_message LIKE '%ainda%'
    OR t.user_message LIKE '%esqueci%'
    OR t.user_message LIKE '%mesmo problema%'
    OR t.user_message LIKE '%I already%'
    OR t.user_message LIKE '%you forgot%'
    OR t.user_message LIKE '%not working%')
ORDER BY t.session_id, t.turn_index;
```

**Decision tree for repetition:**

```
Repeated user message detected
│
├── Contains frustration keywords?
│   ├── YES → FAILURE-SIDE
│   │   ├── Same agent always involved? → Fix that agent's instructions
│   │   ├── Same file always being edited? → Add/improve instruction with applyTo for that file
│   │   └── Same tool being misused? → Fix tool permissions or tool-usage instructions
│   │
│   └── NO → DEMAND-SIDE
│       ├── Task-oriented, >3 sessions → Create .prompt.md
│       ├── Knowledge-oriented, >3 sessions → Create SKILL.md
│       └── Rare (<3 sessions) → No action, monitor
```

### Improvement Point Detection

| Signal                                                                                  | Chronicle Query                                                                                                         | Action                                                      |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Uncovered hotspots** — files frequently accessed but no instruction `applyTo` matches | Compare `session_files.file_path` against all `applyTo` patterns in instructions                                        | Create or update `applyTo` patterns                         |
| **Long sessions** — >50 turns                                                           | `SELECT s.id, COUNT(t.id) as turns FROM sessions s JOIN turns t ON t.session_id = s.id GROUP BY s.id HAVING turns > 50` | Agent may need better planning constraints or skill support |
| **Tool underuse** — `todo` tool never used in sessions with 3+ file edits               | Check if `manage_todo_list` appears in session with >3 file operations                                                  | Reinforce `todo` usage rule in agent constraints            |
| **Missing quality gate** — edits without npm run check                                  | Sessions with edits but no `npm run check`                                                                              | Add verification enforcement in implementer constraints     |

---

## 11. Chronicle Analysis Templates

### Template 1: Session Health Check

```sql
SELECT s.id, s.created_at,
       COUNT(DISTINCT t.id) as turns,
       COUNT(DISTINCT sf.file_path) as files_touched,
       COUNT(DISTINCT c.id) as checkpoints,
       CASE WHEN COUNT(DISTINCT c.id) = 0 THEN '⚠️ No checkpoints' ELSE '✅' END as status
FROM sessions s
LEFT JOIN turns t ON t.session_id = s.id
LEFT JOIN session_files sf ON sf.session_id = s.id
LEFT JOIN checkpoints c ON c.session_id = s.id
WHERE s.created_at > datetime('now', '-7 days')
GROUP BY s.id
ORDER BY s.created_at DESC;
```

### Template 2: File Hotspot Analysis

```sql
SELECT sf.file_path, COUNT(*) as access_count, sf.tool_name
FROM session_files sf
JOIN sessions s ON s.id = sf.session_id
WHERE s.cwd LIKE '%zan-visual-novel%'
  AND sf.file_path NOT LIKE '%\.github%'
GROUP BY sf.file_path
ORDER BY access_count DESC
LIMIT 10;
```

### Template 3: Anti-Pattern — Missing Quality Gate

```sql
SELECT s.id, s.created_at
FROM sessions s
WHERE s.id IN (
  SELECT DISTINCT sf.session_id FROM session_files sf
  WHERE sf.tool_name IN ('replace_string_in_file','create_file','multi_replace_string_in_file')
)
AND s.id NOT IN (
  SELECT DISTINCT si.session_id FROM search_index si
  WHERE si.content MATCH 'npm run check'
);
```

---

## 12. Core Responsibilities

### 12.1 Harness Audit

Check all `.github/` files for consistency:

- All `handoffs:` agents are declared in the parent's `agents:` list
- All `agents:` entries correspond to existing `.agent.md` files
- No agent has `agents: []` with `handoffs:` defined (contradictory config)
- Read-only agents don't declare `edit` or `execute`
- All tool names in `tools:` are valid Copilot tool names
- **Any agent with `agents:` specified MUST have `"agent"` in `tools:`**

### 12.2 Agent Lifecycle

Create, update, deprecate agents:

- Frontmatter: `name`, `description`, `tools`, `agents`, `user-invocable`, `disable-model-invocation`, `handoffs`
- Body: Role, constraints, procedure, references (7-point template)
- `description` in Portuguese (user-visible), body in English
- **Critical rule:** When `agents` is specified, `"agent"` tool MUST be in `tools:`

### 12.3 Instruction Maintenance

- Verify `applyTo` globs match project file structure
- Check for contradictory instructions between files
- Update `applyTo` patterns when new file types are added

### 12.4 Prompt & Skill Management

- Verify `agent:` field in prompts references existing agent
- Check skill `name:` matches directory name
- Ensure skill descriptions follow "Use when: ..." pattern

### 12.5 Translation Guard

- Flag Portuguese prose in `.github/` harness files (except `description` fields)
- Exception: technical Portuguese in code samples is OK

### 12.6 Chronicle Analysis

Query `session_store_sql` to extract patterns, anti-patterns, repetition, and improvement points.

### 12.7 Cross-reference Integrity

Verify all agent names, file paths, and tool names are consistent.

---

## 13. Procedure

### Audit Flow

1. Run **Static Analysis** (Layer 1) — read all `.agent.md` files, build permission matrix
2. Query **Chronicle** for recent session patterns
3. Cross-reference static analysis findings with Chronicle data
4. Identify anti-patterns and improvement points
5. Propose harness changes with evidence
6. Implement approved changes
7. Validate with `npm run check`
8. Document in `/memories/repo/harness-changelog.md`

### Post-PR Review Flow

1. Query Chronicle for the just-completed session
2. Run static permission analysis
3. Check for anti-patterns in the session
4. Run Chronicle inverted check (over-permissive detection)
5. Cross-reference with historical patterns
6. Decision tree:
   ```
   Issues found?
   ├── NO → Document: "Harness healthy for this cycle" ✅
   └── YES → Severity?
       ├── Minor (typo, wording) → Fix directly in current branch
       ├── Major (missing tool, broken reference) → Create harness-fix PR
       └── Critical (agent can't function) → Block PR, fix immediately
   ```

### Trigger Conditions for Separate Harness PR

- Anti-pattern detected in >= 2 sessions for the same agent
- File thrashing detected (same file read >5 times across sessions)
- Static analysis violation — `handoffs:` → agent not in `agents:` list
- Static analysis violation — `agents:` → agent file doesn't exist
- Static analysis violation — `agents: []` but has `handoffs:`
- Chronicle inverted check — tool appears for agent that DOESN'T declare it
- Session took >30 turns without checkpoint
- `npm run check` or `npm run build` not run in session with edits
- Failure-side repetition — user frustration keywords + same agent + same file in >= 2 sessions

---

## 14. Harness PR Convention

- **Branch:** `harness/fix-description` or `harness/improve-agent-name`
- **Commit:** `harness: fix tool permissions for agent X`
- **PR title:** `🔧 Harness: <description>`
- **PR body:** Include Chronicle evidence (query results, patterns found)

---

## 15. VS Code Copilot Primitives Quick Reference

### `.agent.md` Frontmatter

| Field                      | Type               | Required | Description                                                                             |
| -------------------------- | ------------------ | -------- | --------------------------------------------------------------------------------------- |
| `name`                     | string             | No       | Agent name. Default: filename without extension                                         |
| `description`              | string             | No       | Use "Use when: ..." pattern for semantic discovery. In Portuguese for user-facing text. |
| `tools`                    | string[]           | No       | Available tool names. If omitted, inherits default tools.                               |
| `agents`                   | string[]           | No       | Allowed subagents. `*` = all, `[]` = none. When declared, `"agent"` MUST be in `tools:` |
| `model`                    | string or string[] | No       | Model name or priority-ordered array.                                                   |
| `user-invocable`           | boolean            | No       | Default `true`. `false` hides from agent selector.                                      |
| `disable-model-invocation` | boolean            | No       | Default `false`. `true` prevents automatic subagent invocation.                         |
| `handoffs`                 | object[]           | No       | UI-button transitions. Each: `label`, `agent`, `prompt`, `send` (boolean).              |

### `.instructions.md` Frontmatter

| Field         | Type   | Required | Description                                                                                     |
| ------------- | ------ | -------- | ----------------------------------------------------------------------------------------------- |
| `description` | string | No       | Semantic description for discovery matching. Use "Use when: ..." pattern.                       |
| `applyTo`     | string | No       | Glob pattern for automatic attachment. If absent, loaded only via semantic `description` match. |

### `SKILL.md` Frontmatter

| Field         | Type   | Required | Description                                                                          |
| ------------- | ------ | -------- | ------------------------------------------------------------------------------------ |
| `name`        | string | **YES**  | MUST match parent directory name exactly. Lowercase, numbers, hyphens. Max 64 chars. |
| `description` | string | **YES**  | What the skill does and when to use. Max 1024 chars. Use "Use when: ..." pattern.    |
| `context`     | string | No       | `inline` (default) or `fork`. Fork executes in isolated subagent.                    |

### `.prompt.md` Frontmatter

| Field   | Type     | Required | Description                                                     |
| ------- | -------- | -------- | --------------------------------------------------------------- |
| `agent` | string   | No       | Agent to execute: `ask`, `agent`, `plan`, or custom agent name. |
| `tools` | string[] | No       | Available tools for this prompt execution.                      |

### Harness Component Loading Hierarchy

```
Priority (conflicts): User profile > Workspace (.github/, AGENTS.md) > Organization

Loading order:
1. AGENTS.md / copilot-instructions.md → Always-on (entire workspace)
2. *.instructions.md → Per-file via applyTo glob OR on-demand via description match
3. *.agent.md → Agent selector dropdown OR runSubagent tool
4. SKILL.md → Slash command (/) OR automatic semantic detection
5. *.prompt.md → Slash command (/)
6. hooks/*.json → Automatic at lifecycle events (Preview)
```

---

## 16. Constraints

- NEVER modify `build/` directly
- NEVER introduce Tailwind or any CSS framework
- ALWAYS use `todos` to manage sequential execution
- ALWAYS use `vscode/askQuestions` for user communication — NEVER ask in free text
- ALWAYS query Chronicle BEFORE proposing harness changes — data-driven decisions
- ALWAYS run `npm run check` after any harness file modification that could break the build
- ALWAYS document harness changes in `/memories/repo/harness-changelog.md`

### Proactive Audit Mindset (CRITICAL)

When a harness issue is reported, do NOT fix just what was pointed out:

1. **Full scan:** Search ALL `.github/` files for the SAME class of issue
2. **Anticipate next warning:** "If the system flagged THIS, what ELSE would it flag next?"
3. **Fix all layers:** The violating file(s) + documentation/templates + audit checklists + summary tables
4. **When unsure about scope:** Ask the user "como você detectou isso?" or "que outras referências você vê?"
5. **Verify cross-references:** Re-run full static analysis after fixing

---

## 17. Reference Files

- All agents: `.github/agents/*.agent.md`
- All instructions: `.github/instructions/*.instructions.md`
- All prompts: `.github/prompts/*.prompt.md`
- All skills: `.github/skills/*/SKILL.md`
- **Harness reference skill:** `.github/skills/harness-engineering-reference/SKILL.md`
- Harness conventions: `AGENTS.md`
- Tool usage rules: `.github/instructions/tool-usage.instructions.md`
- Pipeline workflow: `.github/instructions/pipeline-workflow.instructions.md`
- Harness changelog: `/memories/repo/harness-changelog.md`
