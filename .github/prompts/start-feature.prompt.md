---
description: "Initiates the new feature pipeline. The engineer agent analyzes the feature and creates a workflow artifact, then hands off to the orchestrator who coordinates planning, implementation, review, and PR."
argument-hint: "Describe the new feature (e.g., 'Add a pricing section with 3 plans...')"
agent: "engineer"
---

# Start Feature Pipeline

Engineer-first pipeline: the engineer agent creates a workflow artifact at .github/artifacts/workflow-{N}.md, then hands off to the orchestrator. See in `.github/instructions/pipeline-workflow.instructions.md`.

## Procedure

### 1. Analyze (Engineer) Feature

If the user's description is incomplete, use `vscode_askQuestions` to clarify:

```
- header: "Feature Scope"
  question: "What are the boundaries of this feature?"
- header: "Acceptance Criteria"
  question: "How will we know the feature is ready?"
- header: "Priority"
  question: "Does this feature replace something existing or is it entirely new?"
  options:
    - label: "Entirely new feature"
    - label: "Replaces/extends something existing"
    - label: "Variation of an existing component"
```

### 2. Create Workflow Artifact + Issue

Create a GitHub issue in the project with:

**Title:** `feat: [short feature description]`

**Body:**

```markdown
### Motivation

[Why is this feature needed? What problem does it solve?]

### Description

[What will be implemented, in detail]

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Reference Design

[Links to inspirations, mockups, or similar components on the site]

### Affected Components

- [list of existing components that will be modified]
```

### 3. Hand Off to Orchestrator

🛑 **STOP and wait.** Present the issue to the user and wait for explicit approval before proceeding.



After approval, execute the complete pipeline:

1. Create branch `feat/short-description` from `main`
2. Invoke `planner` (subagent) — it should consult `criar-section` or `criar-pagina-institucional` skills if it's a new component
3. Invoke `implementer` (subagent) to build the feature
4. Invoke `reviewer` (subagent) to validate
5. If critical/major → re-plan (max. 3x)
6. Commit with `feat:` + push
7. Create PR with `Closes #N`
8. HITL — wait for PR review

---

## Commit Template (Feature)

```
feat(Solutions): add pricing plans section

New Precos.svelte section with 3 plan cards (Basic, Pro, Enterprise).
Each card uses glass-panel with differentiated highlight for the Pro plan.
Integrated into +page.svelte between Solutions and Differential.

Closes #43
```

---

## References

- Complete pipeline: `.github/instructions/pipeline-workflow.instructions.md`
- Tool usage: `.github/instructions/tool-usage.instructions.md`
- Section creation skill: `criar-section`
- Page creation skill: `criar-pagina-institucional`
- Code conventions: `AGENTS.md`
