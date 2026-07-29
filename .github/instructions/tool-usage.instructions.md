---
description: 'Use when: performing any development task — editing code, running commands, searching files, asking questions, or invoking subagents. Covers strict rules for each Copilot tool including when to use vscode_askQuestions, browser, terminal, edit, search, memory/*, vscode/memory, and subagents.'
applyTo: 'src/**, .github/**'
---

# Tool Usage Rules — Copilot

These rules are **mandatory** for any development task. Non-compliance compromises code quality and security.

---

## 0. Harness Copilot — Customization Primitives Overview

VS Code offers **7 customization primitives** that form the complete Copilot harness. Every pipeline agent MUST know all of them to make correct architecture decisions.

| Primitive              | File                                    | Location                 | Use                                         | Loading                                    |
| ---------------------- | --------------------------------------- | ------------------------ | ------------------------------------------- | ------------------------------------------ |
| **Agent Instructions** | `AGENTS.md` / `copilot-instructions.md` | Root or `.github/`       | Global guidelines for the entire project    | Always-on                                  |
| **File Instructions**  | `*.instructions.md`                     | `.github/instructions/`  | Specific rules per file pattern             | `applyTo` or on-demand via `description`   |
| **Custom Agents**      | `*.agent.md`                            | `.github/agents/`        | Specialized personas with restricted tools  | Agent selector or subagent                 |
| **Prompts**            | `*.prompt.md`                           | `.github/prompts/`       | Single focused task with parameters         | Slash command (`/`)                        |
| **Skills**             | `SKILL.md`                              | `.github/skills/<name>/` | Reusable workflows with packaged assets     | Slash command or automatic detection       |
| **Hooks**              | `*.json`                                | `.github/hooks/`         | Deterministic automation in agent lifecycle | Events (`PreToolUse`, `PostToolUse`, etc.) |
| **MCP Servers**        | Config JSON                             | `.vscode/` or settings   | Integration with external APIs and services | On demand via MCP tools                    |

### How the Harness Works

1. **Discovery:** VS Code scans the configured directories (`.github/instructions/`, `.github/agents/`, `.github/skills/`, `.github/prompts/`, `.github/hooks/`) and loads the found files.
2. **Selection:** For `*.instructions.md`, the system uses the `applyTo` field (glob pattern) to automatically attach when the target file matches. If no `applyTo`, uses `description` for semantic matching.
3. **Priority:** User profile instructions > Workspace instructions > Organization instructions.
4. **Isolated Context:** Custom agents as subagents (`runSubagent`) run in isolated context — the parent agent only receives the final result.
5. **Fork Mode:** Skills with `context: fork` execute in a dedicated subagent, clearing the main conversation context.

### Pipeline Map for the Harness

```
AGENTS.md + *.instructions.md → Guidelines (always available)
       │
       ▼
  orchestrator.agent.md  → Coordinator agent (tools: all, agents: [planner, implementer, reviewer, Explore])
       │
       ├── ▶ planner.agent.md   → Read-only subagent (tools: read, search, web)
       ├── ▶ implementer.agent.md → Executor subagent (tools: read, search, edit, execute)
       ├── ▶ reviewer.agent.md      → Read-only subagent (tools: read, search)
       └── ▶ Explore (built-in)     → Exploration subagent (tools: read, search)

Skills (pipeline-orquestracao, criar-section, etc.) → On-demand workflows
Prompts (/start-bugfix, /start-feature, etc.) → Parameterized tasks
```

---

## 1. `vscode/askQuestions` — User Questions

**🚨 CRITICAL RULE: NEVER ask questions in free text to the user. ALWAYS use the `vscode/askQuestions` tool (interactive carousel). Plain markdown questions are FORBIDDEN — the user cannot answer them in a structured way and the workflow is interrupted.**

`vscode/askQuestions` is a native VS Code tool that displays an **interactive carousel** of questions with clickable options, selects, and free text fields. The user responds with clicks/selections and the answers are mapped back to the agent.

**Use `vscode/askQuestions` mandatorily when:**

- There is **any** ambiguity in the user's request that impacts the task scope
- There are multiple valid approaches with different trade-offs
- The user does not specify design/style/tool preferences
- It is necessary to confirm a decision before proceeding
- User input is needed to continue the workflow

**Carousel rules:**

- Maximum **4 questions** per interaction
- Always offer predefined options (`options`) when possible — reduces friction
- Use `allowFreeformInput: true` to allow open responses (default)
- `header`: short and descriptive (max. 50 characters)
- `question`: concise (max. 200 characters)
- `multiSelect: true` when the user can choose multiple options
- Mark the recommended option with `recommended: true`

```yaml
# ✅ Correct example — interactive carousel
- header: 'Feature Scope'
  question: 'What are the boundaries of this functionality?'
  options:
    - label: 'Frontend only'
      description: 'Only visual components'
      recommended: true
    - label: 'Frontend + backend'
      description: 'Includes endpoints and server logic'
  allowFreeformInput: true

# ✅ Example — multiple choice
- header: 'Responsive Breakpoint'
  question: 'Which breakpoints should I use?'
  multiSelect: true
  options:
    - label: 'Mobile (< 768px)'
    - label: 'Tablet (768px - 1024px)'
    - label: 'Desktop (> 1024px)'
```

**NEVER use `vscode/askQuestions` for:**

- Passwords, tokens, API keys, or secrets (ask the user to type directly in the terminal)
- Trivial questions whose answer is documented in code, AGENTS.md, or docs/INSTITUCIONAL.md

**Example of what NOT to do:**

```markdown
<!-- ❌ FORBIDDEN — free text question -->

Do you prefer I use flexbox or grid for this layout?
```

The correct approach is to use `vscode/askQuestions` with clickable options.

---

## 2. Browser — Navigation Tools

Browser tools are essential for visual verification, documentation research, and UI validation.

### Tool Catalog

| Tool                  | Primary Use                                    |
| --------------------- | ---------------------------------------------- |
| `open_browser_page`   | Open a URL in the integrated browser           |
| `fetch_webpage`       | Fetch textual content from a URL (lighter)     |
| `read_page`           | Get accessibility snapshot of the current page |
| `screenshot_page`     | Capture screenshot of the page or element      |
| `click_element`       | Click an element on the page                   |
| `type_in_page`        | Type text or press keys                        |
| `navigate_page`       | Navigate (url, back, forward, reload)          |
| `run_playwright_code` | Run arbitrary Playwright code                  |
| `handle_dialog`       | Respond to modals (alert, confirm, prompt)     |
| `hover_element`       | Hover over an element                          |
| `drag_element`        | Drag an element                                |

### When to Use Each Tool

**`fetch_webpage`** — documentation and research:

- Check official dependency documentation (Svelte, SvelteKit, Vite, MD3)
- Research solutions for errors or code patterns
- Search for API references and best practices
- ALWAYS validate the URL before fetching

**`open_browser_page` + `read_page`** — visual verification:

- Compare local DEV (`localhost:5173`) with LIVE (production site)
- Check layout, colors, and element positioning
- Reuse existing pages (`forceNew: false`) — avoid opening new ones unnecessarily

**`screenshot_page`** — evidence capture:

- Document visual state before/after changes
- Capture specific elements (`ref` or `selector`)
- For DEV vs LIVE comparison, use the `css-comparison-workflow` skill

**`run_playwright_code`** — advanced automation:

- Extract computed styles from elements (for CSS comparison)
- Execute complex actions requiring conditional logic
- Use `page.evaluate()` to read DOM properties

**`click_element`, `type_in_page`, `navigate_page`** — interaction:

- Test user flows (navigation, scroll, forms)
- Verify interactive component behavior (carousel, accordion)

### General Rules

- ALWAYS validate that the URL is valid and accessible before opening
- Prefer `read_page` (accessibility snapshot) over `screenshot_page` for structure analysis
- For `screenshot_page`, capture specific elements, not the entire page
- Document what was verified and the result

### Example: DEV vs LIVE Visual Verification

```
1. open_browser_page("http://localhost:5173") → pageId: "dev"
2. open_browser_page("https://www.example.com") → pageId: "live"
3. screenshot_page("dev", element="Hero section") → hero-dev.png
4. screenshot_page("live", element="Hero section") → hero-live.png
5. Compare visually → report differences
```

---

## 3. Terminal — `run_in_terminal`

**Security rules:**

- Commands must be **non-destructive** and verified
- Always use `mode=sync` for one-shot commands (build, test, lint)
- Use `mode=async` only for long-running servers (`npm run dev`)
- NEVER run: `rm -rf`, `git push --force`, `npm publish`, or destructive commands without explicit confirmation

**Verification rules:**

- ALWAYS read the complete terminal output
- If there are errors, analyze and fix before proceeding
- Run `npm run check` after each modified file
- Run `npm run build` at the end to ensure clean build
- NEVER modify files in `build/` — all editing must be in `src/`

```powershell
# ✅ Correct — verified commands
npm run check
npm run build
npm run dev

# ❌ Wrong — blind or destructive commands
rm -r build/
git push --force origin main
```

---

## 4. File Editing — `replace_string_in_file`, `insert_edit_into_file`

**Fundamental rule: Read before editing.**

- ALWAYS read the file with `read_file` before editing — minimum 30 lines of context
- Changes must be **minimal and surgical** — never rewrite entire files
- Prefer `replace_string_in_file` (more precise); use `insert_edit_into_file` as fallback
- For multiple edits in the same file, use `replace_string_in_file` sequentially
- Include 3-5 lines of context before and after the `oldString`
- Check for errors with `get_errors` after each edit
- If `oldString` is not found, re-read the file and try again

**Editing flow:**

```
1. read_file (full context)
2. replace_string_in_file (surgical edit)
3. get_errors (verify nothing broke)
4. If error → fix; if OK → next file
```

---

## 5. Search — `grep_search`, `semantic_search`, `file_search`

**Rule: Search before assuming.**

- Use `grep_search` for exact strings and regular expressions
- Use `semantic_search` for concepts and code patterns
- Use `file_search` to locate files by glob pattern
- ALWAYS search before claiming something "does not exist" in the code
- Combine multiple search strategies when needed

```typescript
// ✅ Correct — search before creating
// 1. grep_search to check if similar component already exists
// 2. semantic_search to find related code patterns
// 3. Only then create the new component

// ❌ Wrong — create without checking for duplication
```

---

## 6. Memory — `memory/*` and `vscode/memory`

Use the memory system for:

| Scope                | Use                                   | Example             |
| -------------------- | ------------------------------------- | ------------------- |
| `/memories/session/` | Pipeline state, current task progress | `pipeline-state.md` |
| `/memories/repo/`    | Project conventions, verified builds  | `build-commands.md` |
| `/memories/`         | Persistent user preferences           | `preferences.md`    |

**Pipeline State:** The orchestrator MUST maintain `/memories/session/pipeline-state.md` with:

- Current issue (number, title, URL)
- Current branch
- Pipeline phase (planning | implementation | review)
- Current review iteration
- Next step

---

## 7. Subagents — `runSubagent` and Orchestration Patterns

### 7.1 Core Concepts

Subagents are independent Copilot instances that execute focused work in isolated context. The parent agent invokes a subagent, passes a specific task, and receives only the final result — intermediate context does not pollute the main conversation.

**When to use:**

- Complex tasks requiring isolated context (planning, review)
- Operations that benefit from a specialized agent
- Large-scale exploration tasks (use the `Explore` agent)
- Parallelism: multiple subagents running simultaneously for different perspectives

**Rules:**

- ALWAYS pass complete context in the subagent prompt — they are stateless
- Use `agentName` to select the correct specialized agent
- Subagents are stateless — include ALL necessary information in the prompt
- Prefer the `Explore` agent for complex codebase searches (avoids polluting the main conversation)
- Specify thoroughness: `quick`, `medium`, or `thorough`

---

### 7.2 Subagent Lifecycle

```
Parent Agent (orchestrator)
  │
  ├── 1. Identifies subtask that benefits from isolated context
  ├── 2. Invokes runSubagent(agentName, prompt)
  │       └── Subagent receives FULL context in prompt
  │       └── Subagent executes tools (read, search, edit, ...)
  │       └── Subagent returns SINGLE result (string)
  ├── 3. Parent agent incorporates result and continues
  └── 4. Subagent context is discarded
```

The subagent appears in chat as a collapsible tool call — you can expand to see details.

---

### 7.3 Invocation Control

Each agent's `.agent.md` file controls how it can be invoked:

| Setting                              | Effect                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| `user-invocable: false`              | Agent does NOT appear in agent selector, but can still be a subagent |
| `disable-model-invocation: true`     | Agent CANNOT be invoked as a subagent by other agents                |
| `agents: ["planner", "implementer"]` | Explicit list of allowed subagents (empty `[]` = none, `*` = all)    |
| `tools: ["read", "search"]`          | Restricts the tools available to the agent                           |

**Important:** Explicitly listing an agent in the `agents` array overrides `disable-model-invocation: true`. This allows creating "protected" agents that only a specific coordinator can invoke.

**Example — restricted orchestrator:**

```yaml
# orchestrator.agent.md
tools: ['read', 'search', 'edit', 'execute', 'web']
agents: ['planner', 'implementer', 'reviewer', 'Explore']
```

---

### 7.4 Coordinator + Worker Pattern

This is the main pattern of the landing page pipeline. A coordinator agent (orchestrator) manages the high-level flow and delegates subtasks to specialized subagents (workers). Each worker has tools restricted to its role.

```
orchestrator (coordinates the flow)
  │
  ├── planner (read-only: read, search, web, github/*)
  │     └── Generates plan in .github/plans/
  │
  ├── implementer (executor: read, search, edit, execute)
  │     └── Executes the plan, modifies files, verifies build
  │
  ├── reviewer (read-only: read, search)
  │     └── Analyzes diff, quality checklists, classifies issues
  │
  └── Explore (built-in, read-only: read, search)
        └── Quick codebase exploration
```

**Coordinator + Worker pattern rules:**

- The coordinator NEVER does the workers' job — only manages the flow
- Each worker has ONE role and ONE minimal set of tools
- The coordinator passes COMPLETE context to each worker (issue, plan, diff)
- Workers return only the final result (structured summary)
- The coordinator synthesizes results and decides the next step

---

### 7.5 Multi-Perspective Pattern (Parallel Review)

For code review, you can run multiple subagents in parallel, each with a different perspective:

```
Multi-faceted Reviewer
  ├── (parallel) Correctness: logic errors, edge cases, types
  ├── (parallel) Quality: readability, naming, duplication
  ├── (parallel) Security: input validation, injection risks
  └── (parallel) Architecture: codebase patterns, structural consistency

  └── SYNTHESIZES: prioritizes issues, highlights successes
```

**When to use:** complex reviews with multiple dimensions that benefit from independent perspectives.

---

### 7.6 Nested Subagents

By default, subagents CANNOT create other subagents. To enable:

- Setting: `chat.subagents.allowInvocationsFromSubagents = true`
- Maximum: 5 levels of depth

**When to use:** divide-and-conquer pattern — an agent that breaks a large problem into smaller parts and delegates each part to a new instance of itself.

```yaml
# Example recursive agent
---
name: RecursiveProcessor
tools: ['read', 'search', 'edit']
agents: [RecursiveProcessor]
---
If the list has > 4 items, split in half and delegate each half to a subagent.
If ≤ 4 items, process directly. Merge the results.
```

---

### 7.7 Handoffs — Transitions Between Agents

Handoffs enable creating sequential workflows with guided transitions between agents. After a response, handoff buttons appear for the user to advance to the next agent with pre-filled context.

```yaml
# Example in an agent's frontmatter
---
handoffs:
  - label: 'Start Implementation'
    agent: implementer
    prompt: 'Implement the plan described above.'
    send: false
  - label: 'Review Code'
    agent: reviewer
    prompt: 'Review the code implemented in the previous step.'
    send: false
    model: 'Claude Sonnet 4.6 (copilot)'
---
```

| Field    | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| `label`  | Text displayed on the button                                       |
| `agent`  | Target agent for the transition                                    |
| `prompt` | Pre-filled prompt for the next agent                               |
| `send`   | `true` = sends automatically; `false` = only fills, waits for user |
| `model`  | Specific model for the handoff (optional)                          |

**Handoffs vs Subagents:** Handoffs are interactive (user decides when to advance), subagents are automatic (agent decides when to delegate).

---

### 7.8 Model Selection per Subagent

It is possible to specify which model each subagent uses:

1. **Explicit parameter:** the parent agent specifies the model when invoking `runSubagent`:
   ```
   "Use Claude Sonnet 4.6 in a subagent to review this code."
   ```
2. **Configured in the agent:** the `.agent.md` can define `model` in the frontmatter:
   ```yaml
   model: ['Claude Haiku 4.6 (copilot)', 'Gemini 3 Flash (Preview) (copilot)']
   ```
3. **Inheritance:** if not specified, the subagent uses the same model as the parent agent.

**Rule:** The subagent model cannot exceed the main model's cost tier.

---

### 7.9 Subagents Available in the Project

| Agent                 | user-invocable | agents                                  | Tools                                                                                     | Role                                                                   |
| --------------------- | -------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `orchestrator`        | `true`         | planner, implementer, reviewer, Explore | read, search, edit, execute, web, todo, vscode/askQuestions, agent, github/\*             | Coordinates complete pipeline                                          |
| `planner`             | `true`         | Explore                                 | read, search, web, todo, vscode/askQuestions, agent, github/\*                            | Generates implementation plans (read-only)                             |
| `implementer`         | `true`         | —                                       | read, search, edit, execute, todo, vscode/askQuestions                                    | Executes plans, modifies code                                          |
| `reviewer`            | `true`         | —                                       | read, search, todo, vscode/askQuestions                                                   | Analyzes diffs, quality (read-only)                                    |
| `harness-engineer`    | `true`         | orchestrator                            | read, search, edit, todo, vscode/askQuestions, memory/\*, vscode/memory, agent, github/\* | ⚠️ DEPRECATED — replaced by software-engineer with harness-audit skill |
| `refactor-css`        | `false`        | —                                       | read, search, edit, todo, vscode/askQuestions                                             | Refactors CSS (subagent only)                                          |
| `content-creator`     | `true`         | —                                       | read, search, todo, vscode/askQuestions                                                   | Generates institutional content                                        |
| `layout-designer`     | `true`         | —                                       | read, search, browser, todo, vscode/askQuestions                                          | UI/UX design audit                                                     |
| `performance-auditor` | `true`         | —                                       | read, search, web, browser, todo, vscode/askQuestions, github/\*                          | Audits performance                                                     |
| `Explore` (built-in)  | `true`         | —                                       | read, search                                                                              | Quick codebase exploration                                             |

---

## 8. GitHub MCP — Issue & PR Management

The GitHub MCP server is **built into VS Code Copilot** and enabled via the user setting `github.copilot.chat.githubMcpServer.enabled: true`. No separate `.vscode/mcp.json` or token configuration is needed — VS Code handles authentication via the GitHub Copilot extension.

### Tool Reference

MCP tools are referenced in agent frontmatter as `github/*` (wildcard for all tools) or specific tools like `github/create_issue`. In the agent body, use `#tool:github/<tool_name>` syntax.

| Tool                         | Purpose                                             | Pipeline Phase   |
| ---------------------------- | --------------------------------------------------- | ---------------- |
| `github/create_issue`        | Create a GitHub issue                               | Issue Creation   |
| `github/get_issue`           | Fetch issue details (description, comments, labels) | Planning         |
| `github/list_issues`         | List issues with filters                            | Planning, Review |
| `github/update_issue`        | Update issue (title, body, labels, state)           | Post-merge       |
| `github/add_issue_comment`   | Add a comment to an issue                           | Review, HITL     |
| `github/create_pull_request` | Create a pull request                               | PR Creation      |
| `github/get_pull_request`    | Fetch PR details (status, reviews, CI)              | Review           |
| `github/list_pull_requests`  | List PRs with filters                               | Review           |
| `github/merge_pull_request`  | Merge a pull request                                | Post-HITL        |
| `github/create_branch`       | Create a branch on the remote                       | Branch Creation  |
| `github/get_file_contents`   | Get file contents from a branch/ref                 | Planning         |
| `github/search_code`         | Search code across repositories                     | Planning, Review |

### Agent Tool Permissions

| Agent              | GitHub MCP Access      | Why                                                      |
| ------------------ | ---------------------- | -------------------------------------------------------- |
| `orchestrator`     | `github/*` (all tools) | Creates issues, branches, PRs, merges                    |
| `planner`          | `github/*` (all tools) | Fetches issue details for planning                       |
| `harness-engineer` | `github/*` (all tools) | ⚠️ DEPRECATED — use software-engineer agent instead      |
| `implementer`      | ❌ None                | Only implements code — no GitHub operations              |
| `reviewer`         | ❌ None                | Read-only review — delegates PR creation to orchestrator |
| Other agents       | ❌ None                | No GitHub operations needed                              |

> **Principle of least privilege:** When the exact tool names are verified, replace `github/*` with specific tools (e.g., `github/get_issue`, `github/list_issues` for planner).

### When to Use in the Pipeline

**Issue Creation Phase (orchestrator):**

```
1. Use #tool:github/create_issue to create the issue
2. Use type-specific template (bug/feature/improvement)
3. Add relevant labels via #tool:github/update_issue
```

**Planning Phase (planner):**

```
1. Use #tool:github/get_issue to fetch complete issue details
2. Use #tool:github/get_file_contents if need to check file contents on a branch
```

**PR Creation Phase (orchestrator):**

```
1. Create local branch: git checkout -b fix/short-description
2. Implement + Review (via subagents)
3. Commit + Push
4. Use #tool:github/create_pull_request to create PR with Closes #N
```

**Review Phase (orchestrator/reviewer via handoff):**

```
1. Use #tool:github/get_pull_request to check status checks and CI results
2. Use #tool:github/add_issue_comment to add review comments
```

### Rules

- ALWAYS use the GitHub MCP tools (`#tool:github/*`) for GitHub operations — NEVER use phantom/legacy tool names
- When creating issues, ALWAYS use the type-specific template (bug/feature/improvement)
- When creating PRs, include `Closes #N` in the body (GitHub auto-close)
- For PR review, use `#tool:github/get_pull_request` to check CI status
- NEVER auto-merge — always wait for user approval (HITL)
- After merge, check if the issue was closed automatically; if not, close manually via `#tool:github/update_issue`

### Example: Complete Issue + PR Creation Flow

```
1. #tool:github/create_issue → create bug issue
2. HITL: user approves the issue
3. Create local branch: git checkout -b fix/short-description
4. Implement fix (via implementer subagent)
5. Review (via reviewer subagent)
6. Commit + Push
7. #tool:github/create_pull_request → create PR with Closes #N
8. HITL: user reviews and merges the PR
```

---

## 9. Skills — Fork Mode (`context: fork`)

### 9.1 What is Fork Mode?

By default, when a skill is loaded, its instructions are added to the parent agent's context. For large skills, or those whose intermediate reasoning is not relevant to the rest of the conversation, **fork mode** can be used: the skill executes in a **dedicated subagent** and only the final result returns to the parent agent.

```yaml
---
name: my-skill
description: 'Skill description and when to use.'
context: fork # ← Enables fork mode
---
```

**Status:** Experimental. Requires setting `github.copilot.chat.skillTool.enabled`.

### 9.2 When to Use Fork Mode

| Scenario                                        | Inline (default)         | Fork                    |
| ----------------------------------------------- | ------------------------ | ----------------------- |
| Small skill (< 100 lines)                       | ✅ Ideal                 | ❌ Unnecessary overhead |
| Skill that reads many files                     | ❌ Pollutes context      | ✅ Isolates context     |
| Focused result (summary, report)                | ❌ Intermediate pollutes | ✅ Only final result    |
| Skill that should not influence parent behavior | ❌ May leak context      | ✅ Total isolation      |

**Use `context: fork` for skills that:**

- Read many files or do long investigations
- Produce a focused result (summary, report, small set of edits)
- Should not influence the parent agent's behavior beyond the final result

**Keep inline (default) for skills that:**

- Are small and fast
- Produce contextual information the parent agent needs to proceed
- Are part of the continuous conversation reasoning

### 9.3 Project Skills and Recommended Mode

| Skill                        | Size   | Mode               | Reason                                             |
| ---------------------------- | ------ | ------------------ | -------------------------------------------------- |
| `pipeline-orquestracao`      | Large  | `inline` (default) | The orchestrator needs the full pipeline context   |
| `criar-section`              | Medium | `inline` (default) | Needed to create sections with consistent patterns |
| `criar-pagina-institucional` | Medium | `inline` (default) | Similar to above                                   |
| `css-comparison-workflow`    | Medium | `fork`             | Reads many files, result is a report               |
| `otimizar-imagens`           | Small  | `inline` (default) | Fast, result directly influences code              |
| `seo-otimization`            | Medium | `inline` (default) | Provides SEO knowledge for content generation      |

### 9.4 Progressive Skill Loading

The harness loads skills in 3 levels to keep context efficient:

1. **Discovery** (~100 tokens): The agent reads `name` and `description` from the YAML frontmatter
2. **Instructions** (<5000 tokens): Loads the `SKILL.md` body when relevant
3. **Resources**: Additional files (scripts, templates) on demand when referenced

**In fork mode:** Steps 2 and 3 run in the dedicated subagent — the parent only sees the final result.

### 9.5 Slash Commands: Skills vs Prompts

Both skills and prompts appear as slash commands (`/`) in chat:

| Setting                          | Appears in `/` | Auto-loading |
| -------------------------------- | -------------- | ------------ |
| Default (both omitted)           | ✅ Yes         | ✅ Yes       |
| `user-invocable: false`          | ❌ No          | ✅ Yes       |
| `disable-model-invocation: true` | ✅ Yes         | ❌ No        |
| Both configured                  | ❌ No          | ❌ No        |

### 9.6 Skill Structure in the Project

```
.github/skills/<skill-name>/
├── SKILL.md           # Required (name must match directory)
├── scripts/           # Executable code (within .github/)
├── references/        # Reference documents
└── assets/            # Templates, boilerplate
```

**Rules:**

- The `name` field in SKILL.md MUST match the directory name
- Use relative paths (`./.github/scripts/test.js`) to reference resources
- Keep SKILL.md < 5000 tokens; use reference files for extensive content
- The description should use the pattern "Use when: ..." with keywords for semantic discovery

---

## 10. `todo` — Task List and Sequential Execution

The `todo` tool (VS Code built-in) is the **sequential execution management** tool within a chat session. It displays a task list visible to the user, with trackable status and real-time updates.

### 10.1 Why Use `todo`?

Without `todo`, the agent may:

- Execute steps out of order
- Skip important checks (build, lint)
- Lose track of what has been done
- Leave the user without visibility of progress

With `todo`, the agent:

- Plans execution BEFORE starting — visible structure
- Executes ONE step at a time (only 1 `in-progress` simultaneously)
- Marks each step as `completed` IMMEDIATELY after finishing
- Gives full visibility to the user on progress

### 10.2 When to Use — Golden Rule

**Use `todo` mandatorily for any task with 3+ distinct steps.** If the task has a single step, it is optional but recommended.

Examples of when to use:

- Complete pipeline: 12 orchestrator phases
- Implementation: edit 3+ files, verify build
- Review: verify 10 quality dimensions
- Planning: explore codebase → identify files → write plan
- Content creation: research → draft → review → integrate

### 10.3 How to Use

The agent invokes `manage_todo_list` with an array of todos, each with:

- `id`: sequential number (1, 2, 3...)
- `title`: concise action (3-7 words)
- `status`: `not-started` | `in-progress` | `completed`

**Correct usage flow:**

```
1. manage_todo_list(todos=[{id:1, title:"Read file X", status:"not-started"}, ...])
2. manage_todo_list(todos=[{id:1, title:"Read file X", status:"in-progress"}, ...])
3. [execute the task — read_file, edit, etc.]
4. manage_todo_list(todos=[{id:1, title:"Read file X", status:"completed"}, {id:2, ...}])
5. manage_todo_list(todos=[{id:2, title:"Edit file Y", status:"in-progress"}, ...])
6. [execute...]
7. ... (repeat until all completed)
```

**Strict rules:**

- **NEVER** start working without first creating the todo list
- **NEVER** have more than 1 todo `in-progress` simultaneously
- **ALWAYS** mark as `completed` IMMEDIATELY after finishing the step
- **ALWAYS** include ALL items in the array (existing + new) in each call
- **NEVER** remove items from the list — only change the status

### 10.4 Pipeline Example

```
# Orchestrator starts pipeline
manage_todo_list([
  {id: 1, title: "Classify request", status: "in-progress"},
  {id: 2, title: "Create GitHub issue", status: "not-started"},
  {id: 3, title: "HITL: issue approval", status: "not-started"},
  {id: 4, title: "Create branch", status: "not-started"},
  {id: 5, title: "Planning (subagent)", status: "not-started"},
  {id: 6, title: "Implementation (subagent)", status: "not-started"},
  {id: 7, title: "Review (subagent)", status: "not-started"},
  {id: 8, title: "Commit + Push", status: "not-started"},
  {id: 9, title: "Create PR", status: "not-started"},
  {id: 10, title: "HITL: PR review", status: "not-started"},
  {id: 11, title: "Checkout main", status: "not-started"},
])
```

### 10.5 Integration with the Harness

The `todo` tool must be present in the `tools` lists of ALL pipeline agents:

```yaml
tools:
  - 'read'
  - 'search'
  - 'edit'
  - 'todo' # ← Mandatory for sequential execution
  - 'vscode/askQuestions' # ← Mandatory for user communication
```
