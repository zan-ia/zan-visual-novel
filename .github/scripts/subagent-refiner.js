#!/usr/bin/env node
/**
 * subagent-refiner.js
 * CRUD over 𝒢 (sub-agents) — creates, updates, or deletes .agent.md files.
 *
 * Paper Section 3.2, pass 2:
 * - Create: repeated multi-step patterns detected
 * - Update: existing agent failed to handle a specific case
 * - Delete: agent not invoked in 10+ sessions
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());
const AGENTS_DIR = join(REPO_ROOT, '.github', 'agents');
const FAILURES_FILE = join(REPO_ROOT, '.pocket_harness', 'failures.json');
const TRAJECTORY_FILE = join(REPO_ROOT, '.pocket_harness', 'trajectory.jsonl');
const SUBAGENT_STATS_FILE = join(REPO_ROOT, '.pocket_harness', 'subagent-stats.json');

function readFailures() {
  if (!existsSync(FAILURES_FILE)) return { failures: [] };
  return JSON.parse(readFileSync(FAILURES_FILE, 'utf-8'));
}

function readTrajectory() {
  if (!existsSync(TRAJECTORY_FILE)) return [];
  return readFileSync(TRAJECTORY_FILE, 'utf-8').trim().split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function readStats() {
  if (!existsSync(SUBAGENT_STATS_FILE)) return {};
  return JSON.parse(readFileSync(SUBAGENT_STATS_FILE, 'utf-8'));
}

function writeStats(stats) {
  writeFileSync(SUBAGENT_STATS_FILE, JSON.stringify(stats, null, 2));
}

function listAgents() {
  if (!existsSync(AGENTS_DIR)) return [];
  return readdirSync(AGENTS_DIR).filter(f => f.endsWith('.agent.md')).map(f => join(AGENTS_DIR, f));
}

function createAgent(name, description, tools, body) {
  if (!existsSync(AGENTS_DIR)) mkdirSync(AGENTS_DIR, { recursive: true });

  const filePath = join(AGENTS_DIR, `${name}.agent.md`);
  if (existsSync(filePath)) return null; // already exists

  const toolsStr = tools.map(t => `'${t}'`).join(', ');
  const content = `---
description: "${description}"
tools: [${toolsStr}]
user-invocable: true
---
${body}
`;
  writeFileSync(filePath, content);
  return filePath;
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const { failures } = readFailures();
  const trajectory = readTrajectory();
  const stats = readStats();
  const existingAgents = listAgents();
  const actions = [];

  // ── Create: detect patterns that need specialized agents ──────────

  // Pattern: multi-step code-review workflow repeats manually
  const reviewPattern = trajectory.filter(e =>
    (e.tool === 'read_file' || e.tool === 'grep_search') && e.input
  );
  const repeatedReviewFiles = {};
  for (const e of reviewPattern) {
    if (e.input) repeatedReviewFiles[e.input] = (repeatedReviewFiles[e.input] || 0) + 1;
  }
  const heavyReviewFiles = Object.entries(repeatedReviewFiles).filter(([, c]) => c >= 5);
  const hasCodeReviewer = existingAgents.some(a => a.includes('code-reviewer'));

  if (heavyReviewFiles.length >= 3 && !hasCodeReviewer) {
    const path = createAgent(
      'code-reviewer',
      'Use when reviewing code changes, checking conventions, validating patterns. Reviews against 4 criteria: convention compliance, code craft, safety, and project fit.',
      ['read', 'search'],
      `# Code Reviewer\n\nYou review code changes against 4 criteria:\n\n1. **Convention Compliance**: DI pattern (req.deps)? Controller + validate? ESM .js extensions? Error hierarchy used?\n2. **Code Craft**: Types correct? Strict mode? No \`any\`?\n3. **Safety**: Input validation? Error handling? No path traversal?\n4. **Project Fit**: Is the solution idiomatic to the Audiobooker codebase?\n\nReturn a list of issues by severity (critical/high/medium/low).`
    );
    if (path) actions.push({ operation: 'create', agent: 'code-reviewer', path });
    stats['code-reviewer'] = { created: new Date().toISOString(), sessions: 1 };
  }

  // Pattern: test failures → need test-runner agent
  const testFailures = trajectory.filter(e =>
    e.tool === 'run_in_terminal' && e.input && e.input.includes('vitest') && e.hasError
  );
  const hasTestRunner = existingAgents.some(a => a.includes('test-runner'));

  if (testFailures.length >= 3 && !hasTestRunner) {
    const path = createAgent(
      'test-runner',
      'Use when running tests, validating fixes, checking test coverage. Runs vitest and reports failures.',
      ['execute', 'read'],
      `# Test Runner\n\nRun the test suite for files that were changed:\n\n1. Identify changed files from git status\n2. Run \`npx vitest run --reporter=verbose\` in the appropriate workspace (backend/ or frontend/)\n3. Report: pass/fail counts, specific failures with file:line\n4. Suggest fixes for failing tests`
    );
    if (path) actions.push({ operation: 'create', agent: 'test-runner', path });
    stats['test-runner'] = { created: new Date().toISOString(), sessions: 1 };
  }

  // Pattern: complex features without planning → need planner agent
  const hasPlanner = existingAgents.some(a => a.includes('planner'));
  const createFileCount = trajectory.filter(e => e.tool === 'create_file').length;
  if (createFileCount >= 10 && !hasPlanner) {
    const path = createAgent(
      'planner',
      'Use when planning features, breaking down specs, creating task lists. Read-only: analyzes codebase and generates plan.',
      ['read', 'search'],
      `# Planner\n\nAnalyze the codebase and generate an implementation plan:\n\n1. Read relevant docs (SPEC.md, PRD.md, AGENTS.md)\n2. Read existing code patterns in the target area\n3. Generate tasks.md: ordered task list with each task having:\n   - Description\n   - Files to create/edit\n   - Dependencies on other tasks\n   - Estimated complexity (low/medium/high)\n4. Return the plan for review before implementation`
    );
    if (path) actions.push({ operation: 'create', agent: 'planner', path });
    stats['planner'] = { created: new Date().toISOString(), sessions: 1 };
  }

  // Pattern: need coder agent (general implementation)
  const hasCoder = existingAgents.some(a => a.includes('coder'));
  if (createFileCount >= 15 && !hasCoder) {
    const path = createAgent(
      'coder',
      'Use when implementing code, editing files, creating new features. Knows Audiobooker conventions from AGENTS.md.',
      ['read', 'edit', 'search', 'execute'],
      `# Coder (Audiobooker Specialist)\n\nImplement code following Audiobooker conventions:\n\n- DI via req.deps (never import services directly)\n- Controller() + validate() middleware on all routes\n- ESM with .js extensions\n- Error hierarchy: HttpError subclasses\n- Zod for validation\n- Verify with npm test after changes\n\nHandoffs: → code-reviewer (after implementation), → test-runner (to verify)`
    );
    if (path) actions.push({ operation: 'create', agent: 'coder', path });
    stats['coder'] = { created: new Date().toISOString(), sessions: 1 };
  }

  // ── Delete: agents not used in 10+ sessions ──────────────────────
  // (Tracked via stats; skip for now since we just created them)

  // ── Save stats ───────────────────────────────────────────────────
  writeStats(stats);

  if (actions.length === 0) {
    process.stdout.write(JSON.stringify({ refined: false, reason: 'No sub-agent changes needed.' }) + '\n');
  } else {
    process.stdout.write(JSON.stringify({ refined: true, actions }) + '\n');
  }

  process.exit(0);
}

main();
