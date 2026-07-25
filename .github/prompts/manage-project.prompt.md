---
description: "Initiates software project management operations — creating issues, milestones, roadmap, metrics, and backlog organization. The software-engineer agent leads using the project-management skill and GitHub MCP."
argument-hint: "Describe the management action (e.g., 'Create MVP v1.0 milestone' or 'Generate Q3 2026 roadmap')"
agent: "software-engineer"
---

# Manage Project

Initiates software project management operations using GitHub Projects, Issues, Milestones, and engineering metrics.

## Procedure

### 1. Identify the Action

Use `vscode_askQuestions` to understand the need:

```
- header: "Action"
  question: "What do you need to do in project management?"
  options:
    - label: "Create/update Roadmap"
    - label: "Create Milestone (release)"
    - label: "Create/manage Issues"
    - label: "Prioritize Backlog"
    - label: "Configure GitHub Project (Kanban)"
    - label: "Generate metrics report"
    - label: "Plan Sprint"
    - label: "Review project status"
  multiSelect: true
```

### 2. Execute the Action

#### Create Roadmap

1. Define quarters and themes
2. List features per period
3. Create corresponding milestones
4. Create Gantt chart (use `diagramming` skill)
5. Save to `.github/artifacts/roadmap.md`

Template in `project-management` skill, Section 3.

#### Create Milestone

1. Define name, target date, description
2. List scope issues
3. Create on GitHub via UI (or MCP if available)
4. Associate existing issues

Template in `project-management` skill, Section 2.

#### Create Issues

1. Identify type: bug, feature, improvement
2. Use appropriate template (`project-management` skill, Section 4)
3. Create via `#tool:github/create_issue`
4. Add labels, milestone, assignee

#### Prioritize Backlog

1. List unprioritized issues
2. Apply framework (MoSCoW, RICE, Value×Effort)
3. Sort by priority
4. Update issues with priority labels

See `product-engineering` skill for prioritization frameworks.

#### Configure GitHub Project (Kanban)

1. Create board with columns: Backlog → Ready → In Progress → In Review → Done
2. Add existing issues
3. Configure automations (`project-management` skill, Section 7)

#### Generate Metrics

1. Collect data from GitHub:
   - Issues opened/closed in period
   - PRs merged, review time
   - Velocity (story points/sprint)
2. Calculate DORA and process metrics (`project-management` skill, Section 6)
3. Generate report at `.github/artifacts/metrics-{period}.md`

### 3. Maintain Traceability

- Every issue linked to a milestone
- PRs with `Closes #N`
- Consistent labels

### 4. Validate

🛑 **HITL:** Present results for user review before applying changes on GitHub.

### 5. Handoff

Offer next steps:
- Start development of a prioritized issue (`/start-feature`)
- Create related documentation (`/create-documentation`)
- Review roadmap (`/manage-project`)
