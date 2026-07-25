---
description: "Runs a code review following the 10 quality dimensions. Analyzes diff, specific files, or staged/unstaged changes."
argument-hint: "[optional] Scope: 'diff', 'staged', 'unstaged', or file path"
agent: "reviewer"
---

# Review Code

Run a complete code review following the 10-dimension quality checklist defined in the pipeline.

## Supported Scopes

| Scope            | Description                                        |
| ---------------- | -------------------------------------------------- |
| `diff` (default) | Analyzes changes between current branch and `main` |
| `staged`         | Analyzes only staged changes (git diff --staged)   |
| `unstaged`       | Analyzes unstaged changes (git diff)               |
| `<file>`         | Analyzes a specific file                           |

## Procedure

### 1. Collect the Diff

Depending on scope:

- `diff`: `git diff main...HEAD`
- `staged`: `git diff --staged`
- `unstaged`: `git diff`
- Specific file: read the file and compare with `main`

### 2. Analyze 10 Dimensions

| #   | Dimension           | What to Verify                                                                                |
| --- | ------------------- | --------------------------------------------------------------------------------------------- |
| 1   | **Code**            | Follows project conventions in `.github/instructions/`, no anti-patterns, no hardcoded values |
| 2   | **Architecture**    | Correct file organization, proper imports, existing architecture patterns preserved           |
| 3   | **Design**          | Consistent with project design system, proper token/utility usage, visual consistency         |
| 4   | **Readability**     | Descriptive names, clean code, appropriate comments, no dead code                             |
| 5   | **Performance**     | Efficient rendering, lazy loading where appropriate, compositor-only animations               |
| 6   | **Maintainability** | Patterns consistent with existing code, no duplication, low coupling                          |
| 7   | **Specificity**     | Appropriate selector/scope specificity, no force-overrides, no deep nesting                   |
| 8   | **Dependencies**    | No unauthorized new dependencies, existing dependencies used correctly                        |
| 9   | **Build**           | Project build/lint commands pass without errors or warnings                                   |
| 10  | **Accessibility**   | Semantic structure, ARIA labels, heading hierarchy, alt texts, keyboard navigation            |

### 3. Classify Issues

| Severity        | Criterion                                                | Action                    |
| --------------- | -------------------------------------------------------- | ------------------------- |
| 🔴 **Critical** | Functional bug, broken build, severe visual regression   | Blocks merge — fix before |
| 🟠 **Major**    | Pattern violation, inconsistent design, poor performance | Should be fixed           |
| 🟡 **Minor**    | Style, naming, small improvements                        | Document as follow-up     |

### 4. Generate Report

Report format:

```markdown
## Review Report — [scope]

### Summary

- Files analyzed: N
- Issues found: N (Critical: X, Major: Y, Minor: Z)

### Critical Issues 🔴

| #   | File | Line | Description |
| --- | ---- | ---- | ----------- |

### Major Issues 🟠

| #   | File | Line | Description |
| --- | ---- | ---- | ----------- |

### Minor Issues 🟡

| #   | File | Line | Description |
| --- | ---- | ---- | ----------- |

### Recommendation

[✅ Approved | ⚠️ Approved with caveats | 🔴 Not approved]
```

## References

- Code conventions: `AGENTS.md`
- Design system: `src/lib/app.css`
- Pipeline workflow: `.github/instructions/pipeline-workflow.instructions.md`
- CSS conventions: `.github/instructions/css.instructions.md`
- HTML conventions: `.github/instructions/html.instructions.md`
- Svelte conventions: `.github/instructions/svelte.instructions.md`
- Tool usage rules: `.github/instructions/tool-usage.instructions.md`
