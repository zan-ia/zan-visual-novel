---
name: agents-engineering
description: "Reference knowledge for designing and operating AI agent systems — agent architectures, prompt engineering, tool design, multi-agent coordination, evaluation, and Continual Harness principles. Use when: designing new agents, improving existing agents, debugging agent behavior, evaluating agent quality, or planning agent pipelines. Activates for: agent design, agent architecture, prompt engineering, tool design, multi-agent, agent evaluation, harness, agent loop, ReAct."
user-invocable: true
disable-model-invocation: false
---

# Agents Engineering — Reference Knowledge

Knowledge for building robust AI agent systems. This is a **knowledge skill** — it provides reference material, not a workflow.

For project-specific harness conventions, see the existing `harness-engineer` agent and the `harness-engineering-reference` skill in this project.

---

## 1. Core Agent Loop

The fundamental cycle every agent follows:

```
1. Receive input (user message, task, or handoff)
2. Build context (system prompt + history + tools + memory)
3. Call LLM → reasoning
4. If tool call → execute tool → add result to context → loop
5. If final response → return to caller
6. Log trajectory (for evaluation and improvement)
```

Variations:

- **ReAct**: Reason + Act in alternating steps (most common)
- **Plan-and-Execute**: Plan first, then execute step-by-step
- **Reflexion**: Self-critique after each step, retry on failure
- **Tree of Thoughts**: Explore multiple paths, pick best

## 2. Agent Archetypes

| Archetype       | Purpose                                                | Tool profile              | Invocation                       |
| --------------- | ------------------------------------------------------ | ------------------------- | -------------------------------- |
| **Coordinator** | Orchestrates multi-agent workflows, manages HITL       | Full toolkit + agent tool | User-facing + subagent-invocable |
| **Worker**      | Executes a pipeline phase with structured input/output | Domain-specific           | Subagent-invocable               |
| **Specialist**  | Deep domain expertise, on-demand                       | Domain tools              | User-invocable or on-demand      |
| **Auditor**     | Read-only analysis, produces reports                   | read, search              | On-demand or post-cycle          |
| **Gatekeeper**  | Enforces rules automatically                           | read, search, hooks       | Automatic                        |

## 3. Prompt Engineering Foundations

### Structure of a good system prompt

1. **Role**: "You are a [role] responsible for [responsibility]"
2. **Constraints**: hard rules, things NEVER to do, ALWAYS to do
3. **Context sources**: where to find information (files, instructions, other agents)
4. **Procedure**: step-by-step workflow with decision points
5. **Output format**: exact structure expected back to caller
6. **Examples**: few-shot demonstrations of correct behavior
7. **Failure modes**: what to do when uncertain, when to ask, when to stop

### Principles

- **Be specific**: "respond in JSON" beats "be structured"
- **Be terse**: long prompts dilute attention
- **Show, don't tell**: examples beat descriptions
- **Number constraints**: "NEVER do X" is stronger than "don't do X"
- **Use delimiters**: separate sections with clear markers (e.g., `---`)

## 4. Tool Design

A well-designed tool:

- **Has a clear, single purpose** (one job per tool)
- **Describes its inputs and outputs explicitly** (parameter types, return shape)
- **Returns structured data** (JSON, not prose)
- **Handles errors gracefully** (returns errors, doesn't throw)
- **Is documented** (description, examples, edge cases)

### Tool description template

```
description: "What the tool does. When to use it. What input format. What it returns."
parameters:
  - name: paramName
    type: string | number | object | array
    description: What this parameter means
    required: true | false
    default: value
```

### Anti-patterns

- **Mega-tool**: one tool does everything (split it)
- **Confusing names**: `processData` is unclear
- **Side effects without warnings**: tools that mutate state should be explicit
- **No error handling**: returning raw exceptions

## 5. Multi-Agent Coordination

### Patterns

| Pattern                 | Description                                       | When to use                                  |
| ----------------------- | ------------------------------------------------- | -------------------------------------------- |
| **Sequential pipeline** | A → B → C, each takes output of previous          | Linear workflows                             |
| **Parallel fan-out**    | One coordinator dispatches many workers           | Independent subtasks                         |
| **Hierarchical**        | Coordinator → sub-coordinators → workers          | Complex multi-stage work                     |
| **Handoff chain**       | Each agent hands off to the next via "labels"     | VS Code Copilot style                        |
| **Blackboard**          | Shared state, agents read/write opportunistically | When coordination is hard to specify upfront |

### Handoff protocol

A handoff should include:

- **Target agent name**
- **Trigger label** (visible to user)
- **Prompt** (the context to pass)
- **Send flag** (true = automatic, false = user-confirmed)
- **Context preservation**: only send what's needed (isolated contexts)

### Context boundaries

- **Isolated context** (subagent): the parent only sees the final result
- **Shared context** (skill): the main agent sees the full skill content
- **Fork mode** (skill with `context: fork`): skill runs in dedicated subagent

## 6. HITL (Human-in-the-Loop)

Where to require human approval:

- **Before destructive actions**: deletes, force pushes, schema migrations
- **Before external side effects**: sending emails, posting to APIs, creating issues
- **At key decision points**: scope changes, architecture choices
- **Before merging**: final review of the PR

In VS Code Copilot, use `vscode/askQuestions` (interactive carousel) — never ask questions in plain text.

## 7. Evaluation

### Types of eval

- **Unit**: does the agent produce correct output for a known input?
- **Regression**: does a change to the agent break previous correct behavior?
- **End-to-end**: does the agent complete the full task?
- **Comparative**: which of two agents/prompts performs better?

### Metrics to track

- **Task completion rate**: % of tasks successfully completed
- **Tool call accuracy**: % of tool calls that are correct
- **Hallucination rate**: % of outputs containing fabricated info
- **Steps to completion**: average and p95
- **Cost per task**: tokens × price
- **User satisfaction**: thumbs up/down, explicit ratings

### Eval-first design

- Build a small eval set BEFORE tuning the prompt
- Measure baseline performance
- Make one change at a time
- Re-run evals to confirm improvement
- Keep evals in the repo (versioned with the agent)

## 8. Continual Harness Principles

(Adapted from arXiv:2605.09998)

A harness that improves itself over time:

1. **Capture**: log every agent interaction (prompts, tool calls, results)
2. **Analyze**: extract patterns (frequent failures, common tool errors, prompt issues)
3. **Propose**: generate improvements with evidence
4. **Implement**: apply changes via the same pipeline
5. **Measure**: verify improvement against evals
6. **Loop**: continuous cycle

Key insight: **the harness is itself a system that benefits from the same engineering practices** as the code it orchestrates.

## 9. Common Agent Anti-Patterns

| Anti-pattern                | Symptom                                       | Fix                                               |
| --------------------------- | --------------------------------------------- | ------------------------------------------------- |
| **Prompt soup**             | System prompt is 10K tokens of mixed concerns | Split into role, constraints, procedure, examples |
| **Tool spam**               | Agent has 50 tools, doesn't know which to use | Group tools; document when to use each            |
| **Loop forever**            | Agent keeps retrying same failing tool        | Add max iterations; detect and break loops        |
| **Lost context**            | Agent forgets earlier conversation            | Use summarization for long contexts               |
| **Hallucinated tool calls** | Agent invents tools that don't exist          | Validate tool names against registry              |
| **Brittle prompts**         | Tiny wording change breaks behavior           | Test with diverse phrasings                       |
| **No ground truth**         | Can't tell if agent improved                  | Build eval set with known answers                 |
| **Black box**               | No visibility into agent reasoning            | Log CoT, tool calls, intermediate state           |

## 10. When to Apply This Skill

Load this skill when:

- Designing a new agent
- Refactoring an existing agent
- Debugging unexpected agent behavior
- Setting up an evaluation harness
- Planning multi-agent coordination
- Building a Continual Harness feedback loop
- Training others on agent design

For this project's specific agents, see the `.github/agents/` directory and the `harness-engineer` agent.
