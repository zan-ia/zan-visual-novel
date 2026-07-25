---
description: "Initiates the bugfix pipeline. The engineer agent analyzes the bug and creates a workflow artifact, then hands off to the orchestrator who coordinates planning, implementation, review, and PR."
argument-hint: "Describe the bug found (e.g., 'The header shows wrong colors on mobile...')"
agent: "engineer"
---

# Start Bugfix Pipeline

Engineer-first pipeline: the engineer agent creates a workflow artifact at .github/artifacts/workflow-{N}.md, then hands off to the orchestrator. See in `.github/instructions/pipeline-workflow.instructions.md`.

## Procedure

### 1. Analyze (Engineer) Bug

If the user's description is incomplete or ambiguous, use `vscode_askQuestions` **mandatorily** to clarify:

```
- header: "Steps to Reproduce"
  question: "What exact steps lead to the bug?"
- header: "Expected Behavior"
  question: "What should happen instead of the bug?"
- header: "Environment"
  question: "In which browser/device does the bug occur?"
```

### 2. Create Workflow Artifact + Issue

Create a GitHub issue in the project with:

**Title:** `fix: [short bug description]`

**Body:**

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

[What is happening wrong]

### Environment

- OS: Windows 11
- Browser: Chrome/Edge/Firefox
- Device: Desktop/Mobile
- Branch: main
```

### 3. Hand Off to Orchestrator

🛑 **STOP and wait.** Present the issue to the user and wait for explicit approval before proceeding.



After approval, execute the complete pipeline:

1. Create branch `fix/short-description` from `main`
2. Invoke `planner` (subagent) to analyze and plan
3. Invoke `implementer` (subagent) to fix the bug
4. Invoke `reviewer` (subagent) to validate the fix
5. If critical/major → re-plan (max. 3x)
6. Commit with `fix:` + push
7. Create PR with `Closes #N`
8. HITL — wait for PR review

---

## Commit Template (Bugfix)

```
fix(Header): fix glass-panel colors on mobile

The backdrop-filter was not being applied correctly on
mobile devices due to missing -webkit- prefix.

Fixed by adding the prefix and checking cross-browser
compatibility.

Closes #42
```

---

## References

- Complete pipeline: `.github/instructions/pipeline-workflow.instructions.md`
- Tool usage: `.github/instructions/tool-usage.instructions.md`
- Code conventions: `AGENTS.md`
