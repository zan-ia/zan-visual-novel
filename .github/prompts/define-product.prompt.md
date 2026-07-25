---
description: 'Initiates the product definition process — vision, target audience, MVP, success metrics. The software-engineer agent leads the definition using the product-engineering and requirements-engineering skills.'
argument-hint: "Describe the product or initial idea (e.g., 'A web-based visual novel engine...')"
agent: 'software-engineer'
---

# Define Product

Initiates the complete product definition process with the senior software engineer. From initial vision to complete PRD, covering personas, MVP, and success metrics.

## Procedure

### 1. Gather Initial Vision

If the user's description is vague or incomplete, use `vscode_askQuestions` to clarify:

```
- header: "Product"
  question: "What is the product? Describe in one sentence what it does and for whom."
- header: "Problem"
  question: "What real problem does this product solve?"
- header: "Differentiator"
  question: "What makes this product unique? Why would people choose it?"
- header: "Context"
  question: "Is this a new product or an evolution of something existing?"
  options:
    - label: "Brand new product (greenfield)"
    - label: "Evolution of existing product"
    - label: "Legacy system replacement"
```

### 2. Produce Artifacts (in order)

Using the `product-engineering` and `requirements-engineering` skills:

#### a) Vision Document

File: `.github/artifacts/requirements/product-vision.md`

- Problem being solved
- Proposed solution
- Target audience (primary and secondary)
- Competitive differentiators
- Initial scope (MVP)

#### b) Personas

File: `.github/artifacts/requirements/personas.md`

For each persona (minimum 2, maximum 5):

- Name and role
- Demographics and context
- Goals and needs
- Pain points and frustrations
- Typical usage scenario

#### c) PRD (Product Requirements Document)

File: `.github/artifacts/requirements/prd.md`

- Executive summary
- Business objectives
- MVP features (with MoSCoW prioritization)
- Out of scope (v1)
- Success metrics (OKRs)
- Risks and assumptions
- Initial roadmap (high-level view)

### 3. Validate with Stakeholders

🛑 **HITL:** Present each artifact to the user and wait for approval before proceeding to the next. Use `vscode_askQuestions` with approve/review options.

### 4. Prepare for Development

After PRD approval:

1. Create **MVP milestone** on GitHub with approved features
2. Create **epics** for each main feature
3. Optional: Start `gather-requirements` for detailed specification

### 5. Handoff

Present the final summary and offer next steps:

- Start detailed requirements gathering (`/gather-requirements`)
- Start development of the first feature (`/start-feature`)
- Create technical documentation (`/create-documentation`)
