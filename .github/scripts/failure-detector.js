#!/usr/bin/env node
/**
 * failure-detector.js
 * Analyzes the trajectory window τ and detects failure signatures.
 *
 * Implements the 4 failure categories from the paper:
 * 1. Navigation loops — repeated edits on same file:line
 * 2. Tool-call failures — tools returning errors
 * 3. Stalled objectives — no state change after N calls
 * 4. Missed exploration — related files not consulted
 *
 * Output: JSON with failures classified by severity.
 * Used as input for the 4 refiners (prompt, subagent, skill, memory).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());
const HARNESS_DIR = join(REPO_ROOT, '.pocket_harness');
const TRAJECTORY_FILE = join(HARNESS_DIR, 'trajectory.jsonl');
const FAILURES_FILE = join(HARNESS_DIR, 'failures.json');

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
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

// ── Detection Heuristics ──────────────────────────────────────────────

function detectNavigationLoops(trajectory) {
  const loops = [];
  const editTools = [
    'replace_string_in_file',
    'edit_file',
    'multi_replace_string_in_file',
    'create_file',
  ];
  const edits = trajectory.filter((e) => editTools.includes(e.tool));

  // Group edits by file path
  const fileGroups = {};
  for (const e of edits) {
    const key = e.input; // already summarized to file path
    if (!fileGroups[key]) fileGroups[key] = [];
    fileGroups[key].push(e);
  }

  for (const [file, events] of Object.entries(fileGroups)) {
    if (events.length >= 5) {
      loops.push({
        type: 'navigation_loop',
        severity: events.length >= 10 ? 'high' : 'medium',
        file,
        count: events.length,
        description: `Repeated edits (${events.length}x) on ${file} — possible loop.`,
      });
    }
  }

  return loops;
}

function detectToolCallFailures(trajectory) {
  const failures = trajectory.filter((e) => e.hasError);
  const errorRate = trajectory.length > 0 ? failures.length / trajectory.length : 0;

  if (errorRate > 0.3) {
    const failTools = {};
    for (const f of failures) {
      failTools[f.tool] = (failTools[f.tool] || 0) + 1;
    }
    const topFailing = Object.entries(failTools).sort((a, b) => b[1] - a[1])[0];

    return [
      {
        type: 'tool_call_failure',
        severity: errorRate > 0.5 ? 'high' : 'medium',
        errorRate: (errorRate * 100).toFixed(0) + '%',
        totalFailures: failures.length,
        totalCalls: trajectory.length,
        topFailingTool: topFailing ? `${topFailing[0]} (${topFailing[1]}x)` : 'unknown',
        description: `High tool-call failure rate: ${(errorRate * 100).toFixed(0)}% (${failures.length}/${trajectory.length}). Top failing: ${topFailing ? topFailing[0] : 'N/A'}.`,
      },
    ];
  }

  return [];
}

function detectStalledObjectives(trajectory, minCallsForStall = 20) {
  if (trajectory.length < minCallsForStall) return [];

  // A stall is when we have many tool calls but no file edits (just reads/searches)
  const editTools = [
    'replace_string_in_file',
    'edit_file',
    'multi_replace_string_in_file',
    'create_file',
  ];
  const readTools = ['read_file', 'grep_search', 'semantic_search', 'list_dir', 'file_search'];
  const edits = trajectory.filter((e) => editTools.includes(e.tool));
  const reads = trajectory.filter((e) => readTools.includes(e.tool));

  const editToReadRatio = edits.length / Math.max(reads.length, 1);

  if (editToReadRatio < 0.2 && trajectory.length >= minCallsForStall) {
    return [
      {
        type: 'stalled_objective',
        severity: 'medium',
        editRatio: editToReadRatio.toFixed(2),
        totalReads: reads.length,
        totalEdits: edits.length,
        description: `Stalled: ${reads.length} reads vs only ${edits.length} edits over ${trajectory.length} calls (ratio: ${editToReadRatio.toFixed(2)}).`,
      },
    ];
  }

  return [];
}

function detectMissedExploration(trajectory) {
  const missed = [];

  // Files that are auto-injected via session-start hook (AGENTS.md)
  // or universally known — never flag as "missed"
  const autoInjectedFiles = ['AGENTS.md'];

  // Key project files that SHOULD be consulted for most tasks.
  // Only flag if the session had 10+ tool calls (indicating a real task).
  const keyFiles = ['SPEC.md', 'PRD.md', 'tsconfig.base.json'];
  const readFiles = trajectory
    .filter((e) => ['read_file', 'grep_search', 'semantic_search', 'file_search'].includes(e.tool))
    .map((e) => e.input);

  // Skip detection entirely if trajectory is small (likely a simple Q&A)
  if (trajectory.length < 10) return missed;

  for (const kf of keyFiles) {
    // Skip auto-injected files — they're already in context
    if (autoInjectedFiles.includes(kf)) continue;

    const wasRead = readFiles.some((rf) => rf && rf.includes(kf));
    if (!wasRead && existsSync(join(REPO_ROOT, kf))) {
      // Only flag if there were actual code edits happening
      const hasEdits = trajectory.some((e) =>
        [
          'replace_string_in_file',
          'edit_file',
          'multi_replace_string_in_file',
          'create_file',
        ].includes(e.tool),
      );
      if (hasEdits) {
        missed.push({
          type: 'missed_exploration',
          severity: 'low',
          file: kf,
          description: `Key file ${kf} was never consulted during this coding session.`,
        });
      }
    }
  }

  return missed;
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  ensureDir(HARNESS_DIR);

  const trajectory = readTrajectory();
  if (trajectory.length === 0) {
    const empty = {
      timestamp: new Date().toISOString(),
      trajectorySize: 0,
      failures: [],
      summary: 'No trajectory data collected yet.',
    };
    writeFileSync(FAILURES_FILE, JSON.stringify(empty, null, 2));
    process.stdout.write(JSON.stringify(empty) + '\n');
    process.exit(0);
  }

  const failures = [
    ...detectNavigationLoops(trajectory),
    ...detectToolCallFailures(trajectory),
    ...detectStalledObjectives(trajectory),
    ...detectMissedExploration(trajectory),
  ];

  const result = {
    timestamp: new Date().toISOString(),
    trajectorySize: trajectory.length,
    failures,
    summary:
      failures.length === 0
        ? 'No failure signatures detected.'
        : `Detected ${failures.length} failure signature(s): ${failures.map((f) => f.type).join(', ')}.`,
    severity: {
      high: failures.filter((f) => f.severity === 'high').length,
      medium: failures.filter((f) => f.severity === 'medium').length,
      low: failures.filter((f) => f.severity === 'low').length,
    },
  };

  writeFileSync(FAILURES_FILE, JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify(result) + '\n');
  process.exit(0);
}

main();
