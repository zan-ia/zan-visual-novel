---
description: 'Analyzes a development task and produces a structured workflow artifact. The orchestrator invokes the workflow-analysis skill to decompose scope, identify domain experts, estimate complexity, and create a handoff document for the pipeline.'
argument-hint: "Describe the task to analyze (e.g., 'Add real-time collaboration to the VN editor')"
agent: 'orchestrator'
---

# Analyze Workflow

Initiates workflow analysis using the `workflow-analysis` skill. Decomposes a development request into a structured workflow artifact that the orchestrator follows through the Plan→Implement→Review pipeline.

## Procedure

### 1. Understand the Task

Use `vscode_askQuestions` to clarify:

```
- header: "Task Type"
  question: "What type of task is this?"
  options:
    - label: "New Feature"
      description: "Something that doesn't exist yet"
    - label: "Bug Fix"
      description: "Something broken that needs fixing"
    - label: "Improvement"
      description: "Refactoring, optimization, or enhancement"
- header: "Scope"
  question: "What are the boundaries? What is explicitly OUT of scope?"
```

### 2. Run Workflow Analysis

The orchestrator invokes the `workflow-analysis` skill to:

1. Classify the task (bug | feature | improvement)
2. Analyze scope and acceptance criteria
3. Identify required domain experts (DevOps, Backend, Frontend, etc.)
4. Estimate complexity (low | medium | high)
5. Produce a workflow artifact at `.github/artifacts/workflow-{N}.md`

### 3. Review Artifact

The workflow artifact includes:

- Task summary and type
- Complexity estimate
- Domain experts required
- Pipeline steps (Research → Plan → Implement → Review)
- Constraints, risks, and open questions

### 4. Hand Off to Pipeline

After approval, use the `🚀 Start Development` handoff to send the workflow to the orchestrator, who coordinates the Plan→Implement→Review cycle.

## Output

Workflow artifact saved to `.github/artifacts/workflow-{N}.md`

## References

- Workflow analysis skill: `.github/skills/workflow-analysis/SKILL.md`
- Pipeline workflow: `.github/instructions/pipeline-workflow.instructions.md`
