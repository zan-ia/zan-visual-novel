---
description: "Creates diagrams and visual artifacts — ERD, sequence, flowchart, class, state, C4 Model, Gantt, mindmap. The software-engineer agent leads using the diagramming skill and integrated Mermaid tools."
argument-hint: "Describe the desired diagram (e.g., 'ERD diagram of the users and orders schema')"
agent: "software-engineer"
---

# Create Diagram

Initiates the creation of professional diagrams using Mermaid. From concept to validated and exported diagram.

## Procedure

### 1. Identify Diagram Type

Use `vscode_askQuestions` to understand the need:

```
- header: "Diagram Type"
  question: "What type of diagram do you need?"
  options:
    - label: "Entity-Relationship (ERD) — data model"
    - label: "Sequence — component interaction"
    - label: "Flowchart — process or algorithm"
    - label: "UML Class — code structure"
    - label: "State — entity lifecycle"
    - label: "C4 Model — architecture (Context/Container/Component)"
    - label: "Mind Map — concept organization"
    - label: "Gantt — timeline/roadmap"
    - label: "Use Case — actors and functionalities"
- header: "Scope"
  question: "What is the scope of the diagram? Describe what should be represented."
```

### 2. Activate Mermaid Tools

Call `activate_mermaid_diagram_tools` to enable:
- `get-syntax-docs-mermaid` — consult syntax
- `mermaid-diagram-validator` — validate code
- `mermaid-diagram-preview` — preview diagram

### 3. Gather Information

Depending on diagram type:

- **ERD:** Entities, attributes, relationships, cardinalities
- **Sequence:** Actors, participants, message flow
- **Flowchart:** Process steps, decisions, conditions
- **Class:** Classes, attributes, methods, inheritance
- **State:** Possible states, transitions, triggers
- **C4:** System, containers, components, relationships
- **Gantt:** Tasks, dates, dependencies, milestones

Use `task-researcher` if code exploration is needed to extract information.

### 4. Create the Diagram

Using the `diagramming` skill:

1. Consult syntax documentation (`get-syntax-docs-mermaid`)
2. Write Mermaid code
3. Validate syntax (`mermaid-diagram-validator`)
4. Fix errors if any
5. Preview (`mermaid-diagram-preview`)
6. Adjust until satisfactory

### 5. Save

- Source code: `.github/artifacts/diagrams/{name}.mmd`
- Optional: export as image (PNG/SVG)

### 6. Document

Add a brief README in the diagrams directory explaining each diagram:

`.github/artifacts/diagrams/README.md`:

```markdown
# Project Diagrams

| File | Type | Description |
|------|------|-------------|
| main-erd.mmd | ERD | Complete data model |
| login-sequence.mmd | Sequence | Authentication flow |
| ...
```

### 7. Integrate with Documentation

If the diagram is part of larger documentation:
- Reference the diagram in the document (link to `.mmd` or image)
- Update relevant documentation

### 8. Handoff

Offer next steps:
- Create another diagram (`/create-diagram`)
- Integrate with documentation (`/create-documentation`)
- Start development based on diagrams (`/start-feature`)
