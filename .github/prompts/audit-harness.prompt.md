---
description: 'Audits the project harness — agents, instructions, prompts, skills. The orchestrator invokes the harness-audit skill to detect consistency issues, broken references, anti-patterns, and propose improvements.'
argument-hint: "[audit | fix | improve] — what aspect of the harness? (e.g., 'Audit all agent permissions and handoffs')"
agent: 'orchestrator'
---

# Audit Harness

Initiates a complete harness audit using the `harness-audit` skill. Scans all agents, instructions, prompts, and skills for consistency issues, permission violations, broken references, and anti-patterns.

## Procedure

### 1. Define Audit Scope

Use `vscode_askQuestions` to clarify:

```
- header: "Audit Scope"
  question: "What do you want to audit?"
  options:
    - label: "Full Harness"
      description: "All agents, instructions, prompts, and skills"
    - label: "Agent Permissions"
      description: "Tool declarations, handoffs, agents: lists"
    - label: "Cross-References"
      description: "Broken agent names, missing skills, dead links"
    - label: "Chronicle Analysis"
      description: "Session patterns, anti-patterns, KPIs"
```

### 2. Invoke Harness Audit

The orchestrator invokes the `harness-audit` skill (context: fork) to:

1. Run static analysis (Layer 1) — permission matrix for all agents
2. Optionally query Chronicle for session patterns and anti-patterns
3. Cross-reference findings
4. Classify issues by severity (Critical / Major / Minor)
5. Propose specific fixes with file:line references

### 3. Review Findings

The audit returns a structured report with:

- Permission matrix
- Broken references
- Archetype violations
- Model misalignment
- Context budget issues
- Prioritized action items

### 4. Apply Fixes (if requested)

If the user requests fixes, implement changes following the `harness/` branch convention and validate with `npm run check`.

## References

- Harness audit skill: `.github/skills/harness-audit/SKILL.md`
- Harness reference: `.github/skills/harness-engineering-reference/SKILL.md`
- Agent creation rules: `.github/skills/harness-engineering-reference/SKILL.md` §2
- Chronicle integration: `.github/skills/harness-audit/SKILL.md` §10-11
