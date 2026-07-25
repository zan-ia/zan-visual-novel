#!/usr/bin/env node
/**
 * trajectory-collector.js
 * PostToolUse hook — accumulates tool call data into the trajectory window τ.
 *
 * Writes to: .pocket_harness/trajectory.jsonl (JSONL format, one line per tool call)
 * Maintains a sliding window of the last F tool calls (default: F=50).
 * Also tracks cumulative session metrics.
 */

import { appendFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());
const HARNESS_DIR = join(REPO_ROOT, '.pocket_harness');
const TRAJECTORY_FILE = join(HARNESS_DIR, 'trajectory.jsonl');
const METRICS_FILE = join(HARNESS_DIR, 'session-metrics.json');
const WINDOW_SIZE = 50; // F steps from the paper

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Reads stdin synchronously. Uses fd 0 (stdin) which is portable across
 * all Unix-like systems. Falls back gracefully if stdin is a TTY or empty.
 */
function readStdinJSON() {
  try {
    // Check if stdin is a TTY (interactive) — if so, skip reading to avoid hanging
    if (process.stdin.isTTY) return null;

    const raw = readFileSync(0, 'utf-8');
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readTrajectory() {
  if (!existsSync(TRAJECTORY_FILE)) return [];
  const raw = readFileSync(TRAJECTORY_FILE, 'utf-8').trim();
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function readMetrics() {
  if (!existsSync(METRICS_FILE))
    return {
      totalToolCalls: 0,
      sessions: 1,
      failures: 0,
      totalDurationMs: 0,
      firstSession: new Date().toISOString(),
      lastSession: new Date().toISOString(),
    };
  const m = JSON.parse(readFileSync(METRICS_FILE, 'utf-8'));
  return {
    totalToolCalls: m.totalToolCalls || 0,
    sessions: m.sessions || 1,
    failures: m.failures || 0,
    totalDurationMs: m.totalDurationMs || 0,
    firstSession: m.firstSession || new Date().toISOString(),
    lastSession: m.lastSession || new Date().toISOString(),
  };
}

/**
 * Summarizes tool input for trajectory storage.
 * Preserves file paths for edit operations (critical for navigation loop detection)
 * and command strings for terminal operations.
 */
function summarizeToolInput(toolName, toolInput) {
  if (!toolInput) return '(no input)';

  // Edit tools — preserve full file path and line range for loop detection
  if (
    toolName === 'replace_string_in_file' ||
    toolName === 'edit_file' ||
    toolName === 'multi_replace_string_in_file'
  ) {
    const filePath = toolInput.filePath || toolInput.replacements?.[0]?.filePath || '';
    const oldStr = toolInput.oldString || toolInput.replacements?.[0]?.oldString || '';
    // Extract first line of oldString for context
    const firstLine = oldStr.split('\n')[0]?.slice(0, 80) || '';
    return filePath;
  }
  if (toolName === 'create_file') {
    return toolInput.filePath || '(unknown)';
  }
  if (toolName === 'run_in_terminal') {
    const cmd = toolInput.command || '';
    // Classify command type for better metrics
    if (cmd.includes('vitest') || cmd.includes('jest')) return `[test] ${cmd.slice(0, 150)}`;
    if (cmd.includes('eslint')) return `[lint] ${cmd.slice(0, 150)}`;
    if (cmd.includes('tsc')) return `[typecheck] ${cmd.slice(0, 150)}`;
    if (cmd.includes('git ')) return `[git] ${cmd.slice(0, 150)}`;
    if (cmd.includes('npm ')) return `[npm] ${cmd.slice(0, 150)}`;
    return cmd.slice(0, 200);
  }
  if (toolName === 'read_file') {
    return `${toolInput.filePath || '?'}:${toolInput.startLine || '?'}-${toolInput.endLine || '?'}`;
  }
  if (toolName === 'grep_search' || toolName === 'semantic_search') {
    return `[search] ${(toolInput.query || '').slice(0, 150)}`;
  }
  if (toolName === 'list_dir') {
    return toolInput.path || '(root)';
  }
  return JSON.stringify(toolInput).slice(0, 200);
}

/**
 * More robust error detection: checks for error indicators in tool responses
 * beyond simple string matching.
 */
function detectToolError(toolName, toolResponse) {
  if (!toolResponse) return false;
  const resp = typeof toolResponse === 'string' ? toolResponse : JSON.stringify(toolResponse);

  // Common error patterns
  const errorPatterns = [
    /error/i,
    /fail/i,
    /exception/i,
    /cannot/i,
    /not found/i,
    /denied/i,
    /timeout/i,
    /refused/i,
    /ENOENT/,
    /EACCES/,
    /EPERM/,
    /ECONNREFUSED/,
  ];

  // But exclude false positives
  const falsePositivePatterns = [
    /no failure/i,
    /no error/i,
    /error-free/i,
    /without error/i,
    /success/i,
  ];

  // Check false positives first
  if (falsePositivePatterns.some((p) => p.test(resp))) return false;

  return errorPatterns.some((p) => p.test(resp));
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const hookInput = readStdinJSON();
  if (!hookInput || !hookInput.tool_name) {
    // No tool data available; emit empty and continue
    process.stdout.write(JSON.stringify({}) + '\n');
    process.exit(0);
  }

  ensureDir(HARNESS_DIR);

  const { tool_name, tool_input, tool_response, tool_use_id, timestamp, session_id } = hookInput;

  // Build trajectory entry with richer data
  const entry = {
    ts: timestamp || new Date().toISOString(),
    session: session_id || 'unknown',
    tool: tool_name,
    input: summarizeToolInput(tool_name, tool_input),
    hasError: detectToolError(tool_name, tool_response),
    useId: tool_use_id || '',
  };

  // Append to trajectory
  appendFileSync(TRAJECTORY_FILE, JSON.stringify(entry) + '\n');

  // Maintain sliding window
  const trajectory = readTrajectory();
  if (trajectory.length > WINDOW_SIZE) {
    const trimmed = trajectory.slice(-WINDOW_SIZE);
    writeFileSync(TRAJECTORY_FILE, trimmed.map((e) => JSON.stringify(e)).join('\n') + '\n');
  }

  // Update session metrics
  const metrics = readMetrics();
  metrics.totalToolCalls++;
  metrics.lastSession = new Date().toISOString();
  if (entry.hasError) metrics.failures++;
  writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));

  // Detect basic failure signatures in the window
  const recentCalls = trajectory.slice(-WINDOW_SIZE);
  const warnings = [];

  // Navigation loop detection: 5+ edits on the same file
  const editCalls = recentCalls.filter((c) =>
    ['replace_string_in_file', 'edit_file', 'multi_replace_string_in_file'].includes(c.tool),
  );
  const fileCounts = {};
  for (const c of editCalls) {
    if (c.input && c.input !== '(no input)') {
      fileCounts[c.input] = (fileCounts[c.input] || 0) + 1;
    }
  }
  for (const [file, count] of Object.entries(fileCounts)) {
    if (count >= 5) {
      warnings.push(`⚠️ Navigation loop detected: ${count} edits on ${file}`);
    }
  }

  // Tool call failure rate
  const errorCount = recentCalls.filter((c) => c.hasError).length;
  if (errorCount > recentCalls.length * 0.3 && recentCalls.length > 5) {
    warnings.push(`⚠️ High error rate: ${errorCount}/${recentCalls.length} tool calls failed`);
  }

  // Output — pass warnings as additionalContext
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext:
        warnings.length > 0
          ? warnings.join('\n')
          : `Trajectory window: ${recentCalls.length}/${WINDOW_SIZE} entries. Errors: ${errorCount}.`,
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
