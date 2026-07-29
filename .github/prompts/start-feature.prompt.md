---
description: 'Initiates the new feature pipeline. The orchestrator classifies the feature, invokes workflow analysis, then coordinates the Plan→Implement→Review cycle via specialist agents.'
argument-hint: "Describe the new feature (e.g., 'Add a pricing section with 3 plans...')"
agent: 'orchestrator'
---

# Start Feature Pipeline

The orchestrator receives your feature request and orchestrates the complete development pipeline. See `.github/instructions/pipeline-workflow.instructions.md`.

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
2. Invoke `planner` (subagent) to analyze the codebase and generate an implementation plan
3. Invoke `implementer` (subagent) to build the feature
4. Invoke `code-reviewer` (subagent) to validate
5. If critical/major → re-plan (max. 3x)
6. Commit with `feat:` + push
7. Create PR with `Closes #N`
8. HITL — wait for PR review

---

## Commit Template (Feature)

```
feat(scope): add feature description

Brief description of what was implemented.
Key decisions and patterns used.

Closes #N
```

---

## References

- Complete pipeline: `.github/instructions/pipeline-workflow.instructions.md`
- Tool usage: `.github/instructions/tool-usage.instructions.md`
- Code conventions: `AGENTS.md`
