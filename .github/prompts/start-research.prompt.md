---
description: "Initiates a research/spike pipeline. The engineer agent scopes the research question and creates a workflow artifact, then hands off to the orchestrator who delegates investigation."
argument-hint: "Describe the research question (e.g., 'Should we use streaming or Promise for provider interfaces?')"
agent: "engineer"
---

# Start Research Pipeline

Start the research/spike pipeline following the flow defined in `.github/instructions/pipeline-workflow.instructions.md` (Research Pipeline section).

## Procedure

### 1. Understand the Research Question

If the user's description is incomplete, use `vscode_askQuestions` to clarify:

```
- header: "Research Scope"
  question: "What specific question needs to be answered?"
- header: "Success Criteria"
  question: "What evidence will confirm the research is complete?"
- header: "Affected Area"
  question: "Which part of the system does this research affect?"
  options:
    - label: "Architecture / interfaces"
    - label: "Performance / latency"
    - label: "UI / UX"
    - label: "Harness / tooling"
    - label: "External dependencies"
- header: "Blocks"
  question: "Which issues or milestones are blocked by this decision?"
```

### 2. Create Research Issue

Create a GitHub issue using `#tool:github/create_issue` with:

**Title:** `🔬 R-XX: [short research topic]`

**Body:**

```markdown
### Context

[Why this research is needed]

### Question

[The specific question to investigate]

### What to Investigate

- [Specific aspect 1]
- [Specific aspect 2]
- [Specific aspect 3]

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

### 3. HITL — Issue Approval

🛑 **STOP and wait.** Present the research issue to the user and wait for explicit approval before proceeding.

### 4. Delegate to Research Agent

Based on the research domain, delegate to the appropriate agent via `runSubagent`:

| Domain                | Agent                          |
| --------------------- | ------------------------------ |
| Performance / latency | `performance-auditor`          |
| Harness / tooling     | `harness-engineer`             |
| UI / UX               | `layout-designer`              |
| Code architecture     | `planner` (read-only analysis) |

Pass to the subagent:

- Research issue number and title
- Complete question and what to investigate
- Any relevant context from the user

The research agent will:

1. Investigate the codebase
2. Document findings as a comment on the research issue
3. Return: structured findings + proposed actions (new issues to create)

### 5. HITL — Findings Review

🛑 **STOP and wait.** Present the findings to the user. Use `vscode_askQuestions`:

```
- header: "Research Findings"
  question: "The research is complete. Which proposed actions should we create as issues?"
  multiSelect: true
  options:
    - label: "[Action 1 description]"
    - label: "[Action 2 description]"
    - label: "[Action 3 description]"
    - label: "Create all proposed issues"
    - label: "None — just close the research issue"
```

### 6. Create/Update Related Issues

Based on the user's selection:

1. **Create new issues** via `#tool:github/create_issue` for each approved action
2. **Update existing issues** via `#tool:github/update_issue` if research changes scope or unblocks
3. **Link as sub-issues** via `#tool:github/sub_issue_write` (method: `add`) to connect research → related
4. **Add comments** via `#tool:github/add_issue_comment` on updated issues

### 7. Close Research Issue

Close the research issue via `#tool:github/update_issue` (state: `closed`, state_reason: `completed`) with a summary comment:

```markdown
## ✅ Research Complete — R-XX

### Decision

[1-2 sentence summary]

### Created Issues

- #NN — `feat: ...`
- #NN — `improve: ...`

### Updated Issues

- #NN — [what changed]

### References

- Findings comment: [link]
```

### 8. Finalize

Update `/memories/session/pipeline-state.md` with status `COMPLETED`.
