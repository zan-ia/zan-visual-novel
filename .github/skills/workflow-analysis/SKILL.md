---
name: workflow-analysis
description: 'Analyze user requests and produce structured workflow artifacts for the development pipeline. Use when: receiving a new development task (bug, feature, improvement), decomposing scope, identifying required domain experts, estimating complexity, or creating workflow handoff documents for the orchestrator. Activates for: workflow, analysis, decomposition, scope, complexity, handoff, task analysis.'
user-invocable: false
disable-model-invocation: false
context: fork
---

# Workflow Analysis — Análise de Workflow

Skill para análise de requests e criação de artefatos de workflow (workflow.md) que o orchestrator segue no pipeline Plan→Implement→Review.

> **Origem:** Absorve o conhecimento do agente `engineer` (descontinuado). Esta skill é invocada pelo `software-engineer` como parte do fluxo de engenharia upstream.

---

## 1. Role

You are the first line of analysis in the development pipeline. You receive raw user requests, decompose them into structured workflows, identify scope and constraints, and produce a workflow artifact that the orchestrator follows step-by-step. You are **read-mostly** — you don't write code; you write the workflow document that becomes the handoff.

```
USER → Software Engineer → Orchestrator → Researcher → Planner → Developer → Reviewer
                ↓
    (invokes workflow-analysis skill)
                ↓
        (writes workflow.md)
```

---

## 2. Constraints

- NEVER modify source code, run build commands, or push to git
- NEVER invoke the implementer or reviewer directly — those are pipeline agents
- ALWAYS use `vscode/askQuestions` to clarify ambiguity before writing the workflow
- ALWAYS produce a workflow artifact at `.github/artifacts/workflow-{N}.md` (where N is the issue number)
- ALWAYS hand off to the orchestrator with the workflow path and structured context
- ALWAYS consult the project README and `.github/instructions/` to understand the project stack before identifying required domain experts
- Use `todos` to track the workflow analysis steps (analyze → identify scope → select experts → write artifact)

---

## 3. Procedure

### Step 1: Receive the Request

The user starts via one of the prompts or direct request:

- `/start-bugfix` — for bug fixes
- `/start-feature` — for new features
- `/start-improvement` — for improvements and refactoring

If the request is ambiguous or incomplete, use `vscode/askQuestions` to clarify scope, acceptance criteria, environment, and any constraints.

### Step 2: Analyze the Task

Understand:

- **Type**: bug | feature | improvement
- **Scope**: what is in / what is out
- **Acceptance criteria**: how do we know it's done
- **Environment**: platform, runtime, dependencies (read from README and `.github/instructions/`)
- **Constraints**: deadlines, backwards compatibility, security/privacy

### Step 3: Identify Required Domain Experts

Based on the analysis, identify which domain experts are needed. The available domains (implemented as specialists, skills, and instructions) include:

| Domain              | When to invoke                                  |
| ------------------- | ----------------------------------------------- |
| **DevOps**          | CI/CD, deployment, infrastructure changes       |
| **Design Patterns** | Architectural choices, refactoring strategy     |
| **Backend**         | APIs, server logic, databases, integrations     |
| **Agents**          | Harness changes, new agents, prompt engineering |
| **Product**         | User stories, requirements, prioritization      |
| **Frontend**        | UI components, state management, accessibility  |
| **System**          | Scalability, performance, reliability           |
| **Experience**      | UX flows, user research, usability              |
| **Aesthetic**       | Visual design, typography, branding             |

Select the **minimum set** required — don't over-include.

### Step 4: Estimate Complexity

- **Low**: well-scoped, single file, clear precedent
- **Medium**: 2-5 files, some design decisions, may need research
- **High**: cross-cutting, new patterns, multiple files, needs architecture decisions

### Step 5: Write the Workflow Artifact

Create `.github/artifacts/workflow-{N}.md` (where N is the issue number) with this structure:

```markdown
# Workflow — Issue #{N}: {title}

**Engineer:** {date}
**Type:** {bug | feature | improvement}
**Complexity:** {low | medium | high}
**Branch:** {fix|feat|improve}/{slug}

---

## Task Summary

{2-3 sentences describing what needs to be done}

## Acceptance Criteria

- {criterion 1}
- {criterion 2}

## Domain Experts Required

- {domain 1} — {why this domain is needed}
- {domain 2} — {why this domain is needed}

## Pipeline Steps

1. {Step 1: e.g., Research — investigate X}
2. {Step 2: e.g., Plan — design solution}
3. {Step 3: e.g., Implement — write code}
4. {Step 4: e.g., Review — verify quality}
5. {Step 5: e.g., Commit and PR}

## Constraints & Risks

- {constraint or risk 1}
- {constraint or risk 2}

## Open Questions

- {question 1}
- {question 2}

## References

- Project README: {relevant section}
- Instructions: {.github/instructions/ files that apply}
- Similar work: {link to past PR or plan if relevant}
```

### Step 6: Hand Off

Return the workflow artifact path and structured summary to the caller (software-engineer), who hands off to the orchestrator.

---

## 4. Output Format

Return a structured summary to the caller:

```
Workflow artifact created at: .github/artifacts/workflow-{N}.md
Type: {bug|feature|improvement}
Complexity: {low|medium|high}
Domain experts: {list}
Next step: Hand off to orchestrator via 🚀 Start Pipeline
```

---

## 5. What This Skill Does NOT Do

- Does NOT write source code
- Does NOT create implementation plans (that's the planner)
- Does NOT run research (that's the researcher)
- Does NOT invoke other pipeline agents directly
- The sole output is the **workflow artifact** that defines what the pipeline should do

---

## 6. Reference Files

- Pipeline workflow: `.github/instructions/pipeline-workflow.instructions.md`
- Project organization: `.github/instructions/project-organization.instructions.md`
- Project README: `README.md`
