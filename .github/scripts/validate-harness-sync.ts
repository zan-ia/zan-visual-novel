#!/usr/bin/env npx tsx
/**
 * validate-harness-sync.ts
 * SessionStart hook — validates tool references and agent consistency
 * across all .agent.md files in .github/agents/.
 *
 * Flags:
 *   --tool-refs    Validate tool names against known valid Copilot tools
 *   --agent-refs   Validate agent references (handoffs, subagent lists)
 *   (default)      Run all checks
 *
 * Exit codes:
 *   0 — All valid
 *   1 — Violations found (warnings)
 *   2 — Critical violations (agent won't function correctly)
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── Configuration ─────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const AGENTS_DIR = resolve(__dirname, "..", "agents");
const KNOWN_BUILTIN_AGENTS = new Set([
  "Explore",
  "Plan",
  "task-researcher",
  "agent", // default VS Code agent
  "ask", // default VS Code ask mode
]);

// ── Valid Tool Names ──────────────────────────────────────────────────

const VALID_TOOLS_EXACT = new Set([
  // Read
  "read",
  "search",
  "grep_search",
  "semantic_search",
  "file_search",
  // Edit
  "edit",
  "replace_string_in_file",
  "multi_replace_string_in_file",
  "create_file",
  "create_directory",
  "insert_edit_into_file",
  // Execute
  "execute",
  // Web
  "web",
  "browser",
  // Ask
  "vscode/askQuestions",
  // Agent
  "agent",
  // Todo
  "todo",
  // Chronicle
  "session_store_sql",
  // Memory namespaced
  "memory/*",
  "vscode/memory",
  // GitHub MCP namespaced
  "github/*",
]);

const VALID_TOOL_PREFIXES = ["memory/", "github/", "mcp_"];

// Read-only agents (should not have edit/execute)
const READ_ONLY_AGENTS = new Set([
  "planner",
  "reviewer",
  "researcher",
  "performance-auditor",
  "content-creator",
]);

// ── YAML Frontmatter Parser ───────────────────────────────────────────

interface AgentFrontmatter {
  name?: string;
  tools?: string[];
  agents?: string[];
  handoffs?: {
    agent: string;
    label?: string;
    prompt?: string;
    send?: boolean;
  }[];
  user_invocable?: boolean;
  disable_model_invocation?: boolean;
  [key: string]: unknown;
}

function parseFrontmatter(content: string): AgentFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yamlBlock = match[1];
  const result: AgentFrontmatter = {};

  let currentKey: string | null = null;
  let currentList: string[] = [];
  let currentHandoffs: AgentFrontmatter["handoffs"] = [];
  let inHandoffs = false;
  let currentHandoff: Partial<{
    agent: string;
    label: string;
    prompt: string;
    send: boolean;
  }> = {};

  for (const line of yamlBlock.split("\n")) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) continue;

    // Top-level key: value
    const topMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (topMatch && !line.startsWith(" ") && !line.startsWith("\t")) {
      // Flush any pending handoff
      if (inHandoffs && currentHandoff.agent) {
        currentHandoffs.push(
          currentHandoff as {
            agent: string;
            label: string;
            prompt: string;
            send: boolean;
          },
        );
        currentHandoff = {};
      }
      if (currentList.length > 0 && currentKey) {
        if (currentKey === "tools") result.tools = [...currentList];
        else if (currentKey === "agents") result.agents = [...currentList];
        currentList = [];
      }

      currentKey = topMatch[1];
      const value = topMatch[2].trim();

      if (currentKey === "handoffs") {
        inHandoffs = true;
        if (
          currentList.length > 0 &&
          currentKey !== "tools" &&
          currentKey !== "agents"
        ) {
          // flush previous
        }
        continue;
      }

      inHandoffs = false;

      // Simple scalar values
      if (currentKey === "name")
        result.name = value.replace(/^["']|["']$/g, "");
      else if (currentKey === "user-invocable")
        result.user_invocable = value === "true";
      else if (currentKey === "disable-model-invocation")
        result.disable_model_invocation = value === "true";
      continue;
    }

    // List item: `  - "value"` or `  - value`
    if (!inHandoffs) {
      const listMatch = line.match(/^\s+-\s+["']?(.+?)["']?\s*$/);
      if (listMatch && currentKey) {
        currentList.push(listMatch[1].trim());
        continue;
      }
    }

    // Handoff sub-fields
    if (inHandoffs) {
      const handoffStart = line.match(/^\s+-\s+label:\s*["']?(.+?)["']?\s*$/);
      if (handoffStart) {
        if (currentHandoff.agent) {
          currentHandoffs.push(
            currentHandoff as {
              agent: string;
              label: string;
              prompt: string;
              send: boolean;
            },
          );
        }
        currentHandoff = { label: handoffStart[1].trim() };
        continue;
      }

      const agentMatch = line.match(/^\s+agent:\s*["']?(\S+?)["']?\s*$/);
      if (agentMatch) {
        currentHandoff.agent = agentMatch[1].trim();
        continue;
      }

      const promptMatch = line.match(/^\s+prompt:\s*["']?(.+?)["']?\s*$/);
      if (promptMatch) {
        currentHandoff.prompt = promptMatch[1].trim();
        continue;
      }

      const sendMatch = line.match(/^\s+send:\s*(true|false)\s*$/);
      if (sendMatch) {
        currentHandoff.send = sendMatch[1] === "true";
        continue;
      }
    }
  }

  // Flush remaining
  if (inHandoffs && currentHandoff.agent) {
    currentHandoffs.push(
      currentHandoff as {
        agent: string;
        label: string;
        prompt: string;
        send: boolean;
      },
    );
  }
  if (currentList.length > 0 && currentKey) {
    if (currentKey === "tools") result.tools = [...currentList];
    else if (currentKey === "agents") result.agents = [...currentList];
  }
  if (currentHandoffs.length > 0) {
    result.handoffs = currentHandoffs;
  }

  return result;
}

// ── Validation Logic ──────────────────────────────────────────────────

interface Violation {
  agent: string;
  severity: "critical" | "warning";
  rule: string;
  message: string;
}

function isValidTool(tool: string): boolean {
  if (VALID_TOOLS_EXACT.has(tool)) return true;
  for (const prefix of VALID_TOOL_PREFIXES) {
    if (tool.startsWith(prefix)) return true;
  }
  // Wildcard patterns like 'github/*'
  if (tool.endsWith("/*")) {
    const prefix = tool.slice(0, -2);
    if (
      VALID_TOOL_PREFIXES.some(
        (p) => p.startsWith(prefix) || prefix.startsWith(p),
      )
    )
      return true;
  }
  return false;
}

function agentFileExists(name: string): boolean {
  if (KNOWN_BUILTIN_AGENTS.has(name)) return true;
  try {
    const files = readdirSync(AGENTS_DIR);
    return files.includes(`${name}.agent.md`);
  } catch {
    return false;
  }
}

function validateAgent(filePath: string, fm: AgentFrontmatter): Violation[] {
  const violations: Violation[] = [];
  const agentName = fm.name || filePath.replace(/\.agent\.md$/, "");

  // ── Rule 1: All tool names must be valid ────────────────────────
  if (fm.tools) {
    for (const tool of fm.tools) {
      if (!isValidTool(tool)) {
        violations.push({
          agent: agentName,
          severity: "critical",
          rule: "valid-tool-names",
          message: `Unknown tool "${tool}" in tools list. Check for typos or renamed tools.`,
        });
      }
    }
  }

  // ── Rule 2: agents: declared → "agent" must be in tools: ───────
  if (fm.agents !== undefined) {
    // agents is declared (even if empty array)
    if (!fm.tools || !fm.tools.includes("agent")) {
      violations.push({
        agent: agentName,
        severity: "critical",
        rule: "agent-tool-required",
        message: `"agents:" is declared but "agent" tool is missing from tools list. Add "agent" to tools: to enable subagent invocation.`,
      });
    }
  }

  // ── Rule 3: agents: [] + handoffs: → contradiction ─────────────
  if (
    fm.agents !== undefined &&
    fm.agents.length === 0 &&
    fm.handoffs &&
    fm.handoffs.length > 0
  ) {
    violations.push({
      agent: agentName,
      severity: "critical",
      rule: "empty-agents-with-handoffs",
      message: `"agents: []" contradicts "handoffs:" — you cannot handoff to agents when no subagents are allowed. Either add agents to the list or remove handoffs.`,
    });
  }

  // ── Rule 4: All handoff agents must be in agents list ──────────
  if (fm.handoffs && fm.agents) {
    const agentSet = new Set(fm.agents);
    for (const ho of fm.handoffs) {
      if (!agentSet.has(ho.agent)) {
        violations.push({
          agent: agentName,
          severity: "critical",
          rule: "handoff-agent-not-in-list",
          message: `Handoff target "${ho.agent}" is not in the agents: list. Add "${ho.agent}" to agents: or remove the handoff.`,
        });
      }
    }
  }

  // ── Rule 5: All agents: must exist as .agent.md files ──────────
  if (fm.agents) {
    for (const subAgent of fm.agents) {
      if (!agentFileExists(subAgent)) {
        violations.push({
          agent: agentName,
          severity: "warning",
          rule: "unknown-subagent",
          message: `Subagent "${subAgent}" does not have a corresponding .agent.md file and is not a known built-in agent. Known built-ins: ${[...KNOWN_BUILTIN_AGENTS].join(", ")}.`,
        });
      }
    }
  }

  // ── Rule 6: Read-only agents must not have edit/execute ────────
  if (READ_ONLY_AGENTS.has(agentName) && fm.tools) {
    const forbiddenTools = [
      "edit",
      "replace_string_in_file",
      "create_file",
      "create_directory",
      "multi_replace_string_in_file",
      "insert_edit_into_file",
      "execute",
    ];
    for (const tool of fm.tools) {
      if (forbiddenTools.includes(tool)) {
        violations.push({
          agent: agentName,
          severity: "warning",
          rule: "read-only-agent-edit-tool",
          message: `Read-only agent "${agentName}" declares edit/execute tool "${tool}". Read-only agents should only use read/search tools.`,
        });
      }
    }
  }

  return violations;
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const runAll = args.length === 0;
  const runToolRefs = runAll || args.includes("--tool-refs");
  const runAgentRefs = runAll || args.includes("--agent-refs");

  const allViolations: Violation[] = [];
  let agentCount = 0;

  try {
    const files = readdirSync(AGENTS_DIR).filter((f) =>
      f.endsWith(".agent.md"),
    );

    for (const file of files) {
      const filePath = join(AGENTS_DIR, file);
      const content = readFileSync(filePath, "utf-8");
      const fm = parseFrontmatter(content);

      if (!fm) {
        allViolations.push({
          agent: file.replace(".agent.md", ""),
          severity: "critical",
          rule: "parse-error",
          message: `Could not parse YAML frontmatter. Check for valid --- delimiters.`,
        });
        continue;
      }

      agentCount++;
      const violations = validateAgent(filePath, fm);
      allViolations.push(...violations);
    }
  } catch (err) {
    console.error(`Error reading agents directory: ${(err as Error).message}`);
    process.exit(2);
  }

  // ── Output ──────────────────────────────────────────────────────

  const criticals = allViolations.filter((v) => v.severity === "critical");
  const warnings = allViolations.filter((v) => v.severity === "warning");

  // Human-readable output to stderr
  if (allViolations.length === 0) {
    console.error(
      `✅ Harness sync check passed — ${agentCount} agents validated, 0 violations.`,
    );
  } else {
    console.error(
      `\n🔍 Harness Sync Validation — ${agentCount} agents checked`,
    );
    console.error(`${"─".repeat(60)}`);

    if (criticals.length > 0) {
      console.error(`\n❌ CRITICAL (${criticals.length}):`);
      for (const v of criticals) {
        console.error(`  [${v.agent}] ${v.rule}: ${v.message}`);
      }
    }

    if (warnings.length > 0) {
      console.error(`\n⚠️  WARNINGS (${warnings.length}):`);
      for (const v of warnings) {
        console.error(`  [${v.agent}] ${v.rule}: ${v.message}`);
      }
    }

    console.error(`\n${"─".repeat(60)}`);
    console.error(
      `Total: ${criticals.length} critical, ${warnings.length} warnings`,
    );
  }

  // Machine-readable JSON to stdout (for hook consumption)
  const output = {
    agent_count: agentCount,
    violations: allViolations,
    critical_count: criticals.length,
    warning_count: warnings.length,
    passed: allViolations.length === 0,
  };
  console.log(JSON.stringify(output));

  // Exit code
  if (criticals.length > 0) process.exit(2);
  if (warnings.length > 0) process.exit(1);
  process.exit(0);
}

main();
