# Pipeline Artifacts

This directory stores workflow artifacts produced by the `engineer` agent.

Each artifact is a markdown file that defines the pipeline steps for an issue:

## Naming Convention

```
.github/artifacts/workflow-{N}.md
```

Where `{N}` is the GitHub issue number.

## Lifecycle

1. **Created** by the `engineer` agent during the initial analysis phase
2. **Read** by the `orquestrador` agent to coordinate the pipeline
3. **Read** by the `planejador` agent to create the implementation plan
4. **Read** by the `revisor` agent to verify plan compliance
5. **Archived** after PR merge — kept for historical traceability

## What Goes in a Workflow

- Task summary and acceptance criteria
- Required domain experts (DevOps, Backend, Frontend, etc.)
- Pipeline steps (Research → Plan → Implement → Review → PR)
- Constraints, risks, and open questions
- References to relevant project conventions

## Example

See `.github/plans/issue-harness-audit-fixes.md` for a complete example.
