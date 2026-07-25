---
description: "Initiates the improvement/refactoring pipeline. The engineer agent analyzes the improvement and creates a workflow artifact, then hands off to the orchestrator who coordinates planning, implementation, review, and PR. Creates issue, improve/ branch, plans, implements, reviews, and opens PR."
argument-hint: "Describe the desired improvement (e.g., 'Optimize Google Fonts loading...')"
agent: "engineer"
---

# Start Improvement Pipeline

Engineer-first pipeline: the engineer agent creates a workflow artifact at .github/artifacts/workflow-{N}.md, then hands off to the orchestrator. See in `.github/instructions/pipeline-workflow.instructions.md`.

## Procedure

### 1. Analyze (Engineer) Improvement

If the user's description is incomplete, use `vscode_askQuestions` to clarify:

```
- header: "Current Situation"
  question: "What is working poorly or could be better?"
- header: "Expected Improvement"
  question: "What is the desired result after the improvement?"
- header: "Impact"
  question: "Which areas of the site will be affected?"
  options:
    - label: "Only performance/build"
    - label: "Visual/UX"
    - label: "Code/architecture"
    - label: "SEO/accessibility"
```

### 2. Create Workflow Artifact + Issue

Create a GitHub issue in the project with:

**Title:** `improve: [short improvement description]`

**Body:**
```markdown
### Current Situation
[How it is today — what can be improved]

### Proposed Improvement
[What will be done to improve]

### Expected Benefits
- [benefit 1]
- [benefit 2]

### Impact
- **Affected components:** [list]
- **Risk:** [low | medium | high]
- **Build/Deploy:** [yes | no] affects the build process
```

### 3. Hand Off to Orchestrator

🛑 **STOP and wait.** Present the issue to the user and wait for explicit approval before proceeding.



After approval, execute the complete pipeline:

1. Create branch `improve/short-description` from `main`
2. Invoke `planner` (subagent) — for CSS refactoring, consider using the `refactor-css` agent; for performance, consider the `performance-auditor` agent
3. Invoke `implementer` (subagent) to execute the improvement
4. Invoke `reviewer` (subagent) to validate
5. If critical/major → re-plan (max. 3x)
6. Commit with `improve:` + push
7. Create PR with `Closes #N`
8. HITL — wait for PR review

---

## Common Improvement Types

### Performance
- Image optimization (use `otimizar-imagens` skill)
- Fonts: check `display=swap` and `preconnect`
- CSS: check `will-change` and `contain`
- JS chunks: analyze `build/_app/immutable/chunks/`
- Recommended agent: `performance-auditor`

### CSS / Design
- Extract duplicated patterns to `app.css`
- Fix hardcoded colors → design tokens
- Adjust glass-panel, shadows, animations
- Recommended agent: `refactor-css`

### Code / Architecture
- Migrate `export let` → `$props()` (Svelte 5 Runes)
- Reorganize components
- Improve names and documentation
- Recommended agent: `planner` + `implementer`

---

## Commit Template (Improvement)
```
improve(Testimonials): optimize carousel performance
```
