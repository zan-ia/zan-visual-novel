---
description: 'Initiates the requirements engineering process — elicitation, analysis, specification, and validation of functional requirements, non-functional requirements, and business rules. The software-engineer agent leads using the requirements-engineering skill.'
argument-hint: "Describe the scope for requirements gathering (e.g., 'Authentication and authorization module')"
agent: 'software-engineer'
---

# Gather Requirements

Initiates the complete requirements engineering process. From stakeholder elicitation to detailed specification ready for development.

## Procedure

### 1. Define Scope

Use `vscode_askQuestions` to understand the context:

```
- header: "Scope"
  question: "What is the scope of the requirements gathering?"
- header: "Detail Level"
  question: "What level of detail do you need?"
  options:
    - label: "High-level overview (epics and themes)"
    - label: "User Stories (sprint-ready)"
    - label: "Full specification (SRS IEEE 830)"
- header: "Stakeholders"
  question: "Who are the stakeholders we need to consult?"
```

### 2. Elicit Requirements

Using the `requirements-engineering` skill, Section 1.1:

1. Choose appropriate elicitation technique(s)
2. Conduct the process (interviews via `vscode_askQuestions`, document analysis, etc.)
3. Document raw findings

### 3. Analyze and Classify

Using the `requirements-engineering` skill, Section 1.2:

- **FR (Functional Requirements):** `FR-XXX: The system shall...`
- **NFR (Non-Functional Requirements):** Performance, security, usability, etc.
- **BR (Business Rules):** `BR-XXX: If [condition] → [action]`

### 4. Specify

Choose the appropriate format (`requirements-engineering` skill, Section 1.3):

#### For agile teams:

File: `.github/artifacts/requirements/user-stories.md`

```
User stories with:
- Format: As a [persona], I want [action], So that [benefit]
- Acceptance criteria (Given/When/Then)
- MoSCoW prioritization
- Story point estimates
```

#### For formal documentation:

File: `.github/artifacts/requirements/srs.md`

```
SRS IEEE 830:
1. Introduction (purpose, scope, definitions)
2. General Description (product, functions, users, constraints)
3. Specific Requirements (FR, NFR, interfaces)
4. Appendices
```

### 5. Create Supporting Diagrams

Use the `diagramming` skill to create:

- **Use Case Diagram** — actors and main functionalities
- **State Diagram** — lifecycle of key entities
- **Flowcharts** — critical business processes

Save to `.github/artifacts/diagrams/`.

### 6. Validate

Using the `requirements-engineering` skill, Section 1.4:

- [ ] Completeness — all scenarios covered?
- [ ] Consistency — no contradictory requirements?
- [ ] Feasibility — technically possible?
- [ ] Verifiability — can it be objectively tested?

🛑 **HITL:** Present requirements for user validation. Use `vscode_askQuestions`.

### 7. Create Traceability Matrix

File: `.github/artifacts/requirements/traceability-matrix.md`

| ID     | Requirement | Source      | Priority | Issue | Test |
| ------ | ----------- | ----------- | -------- | ----- | ---- |
| FR-001 | ...         | Stakeholder | Must     | #XX   | —    |

### 8. Create GitHub Issues

Using the `project-management` skill:

1. For each User Story / FR, create a GitHub issue
2. Associate with the corresponding milestone
3. Add appropriate labels (type, priority, size)
4. Link dependencies between issues

### 9. Handoff

Present the summary and offer next steps:

- Start development (`/start-feature`)
- Create technical documentation (`/create-documentation`)
- Create additional diagrams (`/create-diagram`)
