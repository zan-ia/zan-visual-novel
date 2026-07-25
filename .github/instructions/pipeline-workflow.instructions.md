---
description: 'Use when: working with pipeline agents, prompts, or skills — orchestrating development workflow, creating issues, branches, or PRs via agents. Defines the complete Plan→Implement→Review cycle with HITL, severity classification, and conventions.'
applyTo: '.github/agents/**, .github/prompts/**, .github/skills/**'
---

# Development Pipeline — Workflow

This document defines the complete CI/CD development pipeline workflow managed by Copilot agents. The pipeline implements a **Plan → Implement → Review** cycle with **Human-in-the-Loop (HITL)** at critical points.

---

## Complete Flow

```
USER reports bug/feature/improvement
    │
    ▼
┌─────────────────────────────────────────────────┐
│ ORCHESTRATOR (main agent)                        │
│ ├─ Analyzes request → classifies type            │
│ ├─ Creates ISSUE via #tool:github/create_issue   │
│ ├─ 🛑 HITL: User reviews and approves issue      │
│ ├─ Creates BRANCH: fix|feat|improve/short-desc   │
│ ├─ Invokes PLANNER (subagent)                    │
│ ├─ Invokes IMPLEMENTER (subagent)                │
│ ├─ Invokes REVIEWER (subagent)                   │
│ │   └─ Review loop (max. 3 iterations)           │
│ ├─ Commit + Push                                 │
│ ├─ Creates PR via #tool:github/create_pull_request │
│ ├─ 🛑 HITL: User reviews and merges PR           │
│ └─ Checkout to main branch                       │
└─────────────────────────────────────────────────┘
```

---

## Pipeline Phases

### Phase 0: User Input

The user starts the pipeline through one of the prompts:

- `/start-bugfix` — for bug fixes
- `/start-feature` — for new features
- `/start-improvement` — for improvements and refactoring
- `/start-research` — for research/spike investigations

The orchestrator **MUST** use `vscode_askQuestions` if the user's report is ambiguous or incomplete.

---

### Phase 1: Issue Creation

The orchestrator creates a GitHub issue using `#tool:github/create_issue` with:

**Template for Bugs (`fix:`):**

```markdown
### Bug Description

[Clear and concise description]

### Steps to Reproduce

1.
2.
3.

### Expected Behavior

[What should happen]

### Current Behavior

[What is happening]

### Environment

- OS: Windows 11
- Browser: Chrome
- Branch: main
```

**Template for Features (`feat:`):**

```markdown
### Motivation

[Why this feature is needed]

### Description

[What will be implemented]

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

### References

- [Links, docs, inspirations]
```

**Template for Improvements (`improve:`):**

```markdown
### Current Situation

[How it is today]

### Proposed Improvement

[What will be improved]

### Expected Benefits

[Positive impact of the change]

### Impact

- Affected components: [list]
- Risk: [low | medium | high]
```

🛑 **Mandatory HITL:** After creating the issue, the orchestrator MUST present the issue to the user and wait for explicit approval before proceeding. Use `vscode_askQuestions` with approve/reject/modify options.

---

### Phase 2: Branch Creation

After issue approval, the orchestrator creates a branch from `main`:

**Naming convention:**

| Type        | Prefix     | Example                         |
| ----------- | ---------- | ------------------------------- |
| Bug         | `fix/`     | `fix/fix-header-colors`         |
| Feature     | `feat/`    | `feat/add-pricing-section`      |
| Improvement | `improve/` | `improve/optimize-font-loading` |

Rules:

- Lowercase name, words separated by hyphens
- Max 50 characters
- Derived from the issue title
- ALWAYS create from `main` (clean and updated branch)

```bash
git checkout main
git pull origin main
git checkout -b fix/short-description
```

---

### Phase 3: Planning (subagent `planner`)

The orchestrator invokes the `planner` subagent with:

- Issue number and title
- Complete problem/request description
- Any additional relevant context

The planner:

1. Fetches the GitHub issue via `#tool:github/get_issue` for complete context
2. Explores the codebase to identify relevant files
3. Consults `AGENTS.md`, `docs/INSTITUCIONAL.md`, and applicable instructions
4. Generates a detailed plan with: files to modify, patterns to follow, risks, implementation order
5. Saves to `.github/plans/issue-{N}-{slug}.md`
6. Returns: plan path + short summary (2-3 sentences) + complexity + impacted files

**Example planner return:**

```
📋 Plan: .github/plans/issue-42-fix-header-colors.md
📝 Summary: Fix header colors that diverge between DEV and LIVE.
   Adjust 2 tokens in Header.svelte and verify glass-panel in app.css.
🔧 Complexity: Low
📁 Files: Header.svelte, app.css
```

The orchestrator saves this information to `/memories/session/pipeline-state.md`.

---

### Phase 4: Implementation (subagent `implementer`)

The orchestrator invokes the `implementer` subagent with:

- Plan file path
- Planner summary
- Impacted files

The implementer:

1. Reads the complete plan
2. Executes each step in order, making surgical changes
3. After each file, checks for errors with `get_errors`
4. Runs `npm run check` at the end
5. Runs `npm run build` at the end
6. NEVER modifies `build/` directly
7. Respects ALL conventions: scoped CSS, design tokens, BEM naming, no Tailwind
8. Returns: summary of what was implemented + list of modified files

---

### Phase 5: Review (subagent `reviewer`)

The orchestrator invokes the `reviewer` subagent with:

- Plan file path
- Implementation summary
- List of modified files

The reviewer analyzes the diff (`git diff`) against the plan and verifies:

**Quality Checklist:**

| Dimension           | What to check                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| **Code**            | Scoped CSS, design tokens, BEM naming, Svelte 5 Runes, no Tailwind, no hex hardcoded              |
| **Architecture**    | Correct component composition, no layout breakage, correct imports                                |
| **Design**          | Glass-panel applied, correct typography, MD3 palette, standardized badges and sections            |
| **Readability**     | Descriptive names, clean code, comments where needed                                              |
| **Performance**     | `will-change` only during interaction, `contain` where applicable, no `width`/`height` animations |
| **Maintainability** | Consistent patterns, token reuse, no duplication                                                  |
| **Specificity**     | Low-specificity CSS, no `!important`                                                              |
| **Dependencies**    | Correct Material Symbols, Google Fonts with swap+preconnect, no new CDN deps                      |
| **Tests**           | `npm run check` without errors, clean `npm run build`, acceptance criteria met                    |
| **Accessibility**   | ARIA labels, heading hierarchy, alt texts, `prefers-reduced-motion`                               |

---

### Phase 6: Review Decision

The reviewer classifies each issue found and returns:

```
📊 Review Report — Issue #N

Status: CHANGES_NEEDED

Issues Found:
🔴 CRITICAL (2):
  - Header.svelte: hardcoded color #1a1a2e instead of var(--color-surface)
  - app.css: animation uses 'height' instead of 'transform'

🟡 MAJOR (1):
  - New component doesn't use glass-panel

🟢 MINOR (2):
  - Comment in English (standard is Portuguese)
  - Variable could have a more descriptive name

Recommendation: RE-PLAN (2 critical issues)
```

**Severity Classification:**

| Level           | Definition                                                              |
| --------------- | ----------------------------------------------------------------------- |
| 🔴 **CRITICAL** | Functional bug, security, build breakage, severe architecture violation |
| 🟡 **MAJOR**    | Pattern violation, inconsistent design, degraded performance            |
| 🟢 **MINOR**    | Style, documentation, naming, cosmetic improvements                     |

**Decision Matrix (4 Possible Statuses):**

| Report Status      | Condition                                         | Orchestrator Action                                |
| ------------------ | ------------------------------------------------- | -------------------------------------------------- |
| **APPROVED**       | No issues found                                   | Proceed to Phase 7 (Commit/PR)                     |
| **CHANGES_NEEDED** | Only MINOR                                        | Proceed to Phase 7; document follow-ups in PR body |
| **CHANGES_NEEDED** | CRITICAL or MAJOR present                         | Return to Phase 3 (Re-plan)                        |
| **REJECTED**       | Severe structural issues (e.g., invalid approach) | Return to Phase 3 (Re-plan with new strategy)      |

**Review loop rules:**

1. **Maximum 3 iterations** of the cycle (Phase 3 → 4 → 5 → 6)
2. If the 3rd iteration still has CRITICAL/MAJOR → document known risks in PR and proceed with caveats
3. The orchestrator tracks the iteration counter in `pipeline-state.md`

---

### Phase 7: Commit, Push and PR

🚨 **CRITICAL: PR-Only Mainline Policy.** NEVER merge directly to `main`. Every change — no matter how small — MUST go through a Pull Request. Even if the plan is to merge immediately after creation, a PR MUST be created first. The only commits that should ever land on `main` directly are merge commits created by GitHub when merging a PR.

**Commit messages (Conventional Commits):**

```
fix(Header): fix glass-panel colors to MD3 tokens

Adjusts backgroundColor and borderColor to use CSS variables
instead of hardcoded values. Fixes visual divergence with LIVE.

Closes #42
```

**PR Creation:**

- Use `#tool:github/create_pull_request` to create the PR
- Title: same commit prefix (`fix:`, `feat:`, `improve:`)
- Body: summary of changes + `Closes #N`
- Base: `main` ← Compare: working branch

🛑 **Mandatory HITL:** After creating the PR, the orchestrator MUST present the PR to the user for final review. Do NOT merge automatically.

---

### Phase 8: Finalization

🚨 The orchestrator MUST NOT bypass the PR step under any circumstance. Even harness PRs (`harness/` prefix) follow the same PR-only workflow.

After the PR merge (done by the user via GitHub UI):

```bash
git checkout main
git pull origin main
```

The orchestrator cleans up the pipeline state:

- Updates `/memories/session/pipeline-state.md` with status COMPLETED
- Optional: deletes the local branch (remote is deleted by GitHub on merge)

---

## State Tracking

The orchestrator maintains the `/memories/session/pipeline-state.md` file with:

```markdown
# Pipeline State — Issue #N

- **Issue:** [#N](url) — Title
- **Type:** bug | feature | improvement
- **Branch:** fix|feat|improve/name
- **Current Phase:** planning | implementation | review
- **Review Iteration:** X of 3
- **Plan:** .github/plans/issue-N-slug.md
- **Modified Files:** [list]
- **Status:** IN_PROGRESS | WAITING_HITL | COMPLETED
- **Next Step:** [description]
```

---

## Conventions Summary

| Convention          | Standard                                                              |
| ------------------- | --------------------------------------------------------------------- |
| **Branch**          | `fix/`, `feat/`, `improve/`, `research/` + lowercase slug             |
| **Commit**          | Conventional Commits: `fix:`, `feat:`, `improve:`, `research:`        |
| **PR**              | Include `Closes #N` in body (implementation pipeline only)            |
| **Issue**           | Type-specific template (bug/feature/improvement/research)             |
| **Plan**            | `.github/plans/issue-{N}-{slug}.md`                                   |
| **State**           | `/memories/session/pipeline-state.md`                                 |
| **Review**          | Max. 3 iterations; critical/major → re-plan; minor → document         |
| **HITL**            | Mandatory after issue creation and after PR creation                  |
| **Research Output** | Create/update related GitHub issues (cards) from findings — NOT files |

---

## Research Pipeline (Spike/Investigation)

Research issues (🔬) follow a **different flow** from implementation issues. The output is **not a PR or a file** — it is the **creation and/or update of related GitHub issues** (cards) based on research findings.

### When to Use

- Investigating architecture decisions (ADR research)
- Measuring performance latencies before deciding on an approach
- Evaluating library/framework options
- Any task where the goal is **knowledge**, not code

### Complete Flow

```
USER reports research question
    │
    ▼
┌─────────────────────────────────────────────────┐
│ ORCHESTRATOR (main agent)                        │
│ ├─ Analyzes request → classifies as research     │
│ ├─ Creates RESEARCH ISSUE via                    │
│ │   #tool:github/create_issue (🔬 prefix)        │
│ ├─ 🛑 HITL: User reviews and approves issue      │
│ ├─ Delegates to RESEARCH AGENT (subagent)        │
│ │   ├─ Investigates codebase / measures / reads  │
│ │   ├─ Documents findings in issue comment       │
│ │   └─ Returns: findings + proposed actions      │
│ ├─ 🛑 HITL: User reviews findings                │
│ ├─ Creates/updates RELATED ISSUES (cards) via    │
│ │   #tool:github/create_issue + #tool:github/    │
│ │   update_issue + #tool:github/sub_issue_write  │
│ ├─ Links research issue → related issues         │
│ ├─ Closes research issue with summary comment    │
│ └─ Updates pipeline-state.md → COMPLETED         │
└─────────────────────────────────────────────────┘
```

### Research Issue Template

```markdown
### Context

[Why this research is needed]

### Question

[The specific question to investigate]

### What to Investigate

- [Specific aspect 1]
- [Specific aspect 2]

### Options (if applicable)

| Option | Complexity | Use case |
| ------ | ---------- | -------- |
| A      | Low        | ...      |
| B      | Medium     | ...      |

### How to Validate

[Criteria for deciding the research is complete]

### Dependencies

- Blocks: [issue numbers that depend on this decision]
- Blocked by: [issue numbers that must complete first]

### Expected Output

- Create/update related GitHub issues (cards) based on findings
- Link them as sub-issues or comments to this research issue
- Close this issue with a summary comment linking all created/updated issues
```

### Research Phases

#### R-Phase 1: Issue Creation

The orchestrator creates a research issue using `#tool:github/create_issue` with:

- Title prefix: `🔬 R-XX: [topic]`
- Label: `research` (if available)
- Body: Research issue template (above)

🛑 **Mandatory HITL:** Present the issue to the user for approval.

#### R-Phase 2: Investigation (subagent)

The orchestrator delegates to the appropriate research agent (e.g., `performance-auditor`, `harness-engineer`, `layout-designer`) based on the research domain.

The research agent:

1. Reads the research issue via `#tool:github/get_issue`
2. Investigates the codebase (reads files, measures, analyzes)
3. Documents findings as a **comment on the research issue** via `#tool:github/add_issue_comment`
4. Returns to the orchestrator: structured findings + proposed actions

**Findings comment format:**

```markdown
## 🔍 Research Findings — R-XX

### Summary

[2-3 sentence summary of what was discovered]

### Measurements (if applicable)

| Operation | p50 | p95 | Verdict  |
| --------- | --- | --- | -------- |
| [op name] | Xms | Yms | ✅/⚠️/❌ |

### Recommended Actions

1. **[Action 1]** — [description] → suggests new issue: `feat: ...`
2. **[Action 2]** — [description] → suggests updating issue #N
3. **[Decision]** — [what was decided] → unblocks issue #N

### Proposed New Issues

- [ ] `feat: [description]` — [why]
- [ ] `improve: [description]` — [why]
```

🛑 **Mandatory HITL:** Present findings to the user. The user decides which proposed actions to pursue.

#### R-Phase 3: Create/Update Related Issues

Based on the approved findings, the orchestrator:

1. **Creates new issues** via `#tool:github/create_issue` for each approved action
2. **Updates existing issues** via `#tool:github/update_issue` if research changes their scope or unblocks them
3. **Links as sub-issues** via `#tool:github/sub_issue_write` (method: `add`) to connect research issue → related issues
4. **Adds comments** via `#tool:github/add_issue_comment` on updated issues explaining what the research concluded

#### R-Phase 4: Close Research Issue

The orchestrator closes the research issue via `#tool:github/update_issue` (state: `closed`, state_reason: `completed`) with a final summary comment:

```markdown
## ✅ Research Complete — R-XX

### Decision

[1-2 sentence summary of the decision/outcome]

### Created Issues

- #NN — `feat: ...`
- #NN — `improve: ...`

### Updated Issues

- #NN — [what changed]
- #NN — [unblocked]

### References

- Findings comment: [link to comment]
- Related ADR (if applicable): [link or note that no ADR file is needed]
```

### Research State Tracking

```markdown
# Pipeline State — Research #N

- **Issue:** [#N](url) — 🔬 R-XX: Title
- **Type:** research
- **Research Agent:** performance-auditor | harness-engineer | layout-designer
- **Current Phase:** investigation | hitl_findings | creating_cards | completed
- **Findings:** [link to comment]
- **Created Issues:** [list of issue numbers]
- **Updated Issues:** [list of issue numbers]
- **Status:** IN_PROGRESS | WAITING_HITL | COMPLETED
- **Next Step:** [description]
```

### Rules

- **Output is cards, NOT files** — research issues must produce related GitHub issues (cards), not ADR files or documentation files
- **Findings are documented as issue comments** — not as separate files
- **Every proposed action must become an issue** — if the research suggests an action, create a card for it
- **Link everything** — use sub-issues (`#tool:github/sub_issue_write`) to connect research → related issues
- **HITL after findings** — the user decides which actions to pursue before cards are created
- **Close with summary** — the research issue must be closed with a comment linking all created/updated issues
- **No PR for research** — research issues do not go through the Plan→Implement→Review cycle; they are closed directly after cards are created
