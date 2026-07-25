---
description: "Creates professional technical documentation — ADRs, API docs, README, architecture guides, and technical specifications. The software-engineer agent leads using the technical-documentation skill."
argument-hint: "Describe what to document (e.g., 'ADR about database choice' or 'User API documentation')"
agent: "software-engineer"
---

# Create Documentation

Initiates the creation of professional technical documentation. From ADRs to API documentation, READMEs, and architecture guides.

## Procedure

### 1. Identify Documentation Type

Use `vscode_askQuestions` to understand the need:

```
- header: "Documentation Type"
  question: "What type of documentation do you need to create?"
  options:
    - label: "ADR (Architecture Decision Record)"
    - label: "API Documentation (OpenAPI/Swagger)"
    - label: "Project README"
    - label: "Contribution Guide (CONTRIBUTING)"
    - label: "Architecture Documentation (C4 Model)"
    - label: "Deployment/Operations Guide"
    - label: "CHANGELOG"
    - label: "Other"
  multiSelect: true
- header: "Target Audience"
  question: "Who will read this documentation?"
  options:
    - label: "Team developers"
    - label: "External developers (public API)"
    - label: "Architects and tech leads"
    - label: "Operations/DevOps"
    - label: "Business stakeholders"
```

### 2. Gather Information

Depending on the type:

- **ADR:** Explore architecture decisions, considered alternatives, trade-offs
- **API Docs:** Explore source code, endpoints, data models
- **README:** Explore the project, stack, setup, architecture
- **Guide:** Explore processes, conventions, workflows

Use `task-researcher` if deep code exploration is needed.

### 3. Create the Documentation

Using the `technical-documentation` skill and appropriate templates:

#### ADR → `.github/artifacts/docs/adr/adr-{NNN}-{slug}.md`
- Context, decision, alternatives, consequences

#### API Docs → `.github/artifacts/docs/api/openapi.yaml` or `api.md`
- OpenAPI 3.0 spec or Markdown documentation

#### README → `README.md` (project root)
- Badges, description, stack, setup, usage, docs, contributing, license

#### Architecture → `.github/artifacts/docs/architecture.md`
- C4 Model (Context, Container, Component)
- Use the `diagramming` skill for C4 diagrams

#### CHANGELOG → `CHANGELOG.md`
- Keep a Changelog + Semantic Versioning

### 4. Create Supporting Diagrams

Use the `diagramming` skill to complement:

- **C4 Context** — for architecture documentation
- **ERD** — for database documentation
- **Sequence** — for API/flow documentation

Save to `.github/artifacts/diagrams/` and reference in documentation.

### 5. Review and Validate

- [ ] Technically accurate information?
- [ ] Complete for the target audience?
- [ ] Correct formatting?
- [ ] Valid links and references?

🛑 **HITL:** Present the documentation for user review.

### 6. Update Index

If it's an ADR, update `.github/artifacts/docs/adr/README.md` with the new entry.

If it's new documentation, update README.md with links to the new doc.

### 7. Handoff

Offer next steps:
- Create more documentation (`/create-documentation`)
- Create complementary diagrams (`/create-diagram`)
- Start development (`/start-feature`)
