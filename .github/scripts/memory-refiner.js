#!/usr/bin/env node
/**
 * memory-refiner.js
 * CRUD over ℳ (memory) — fills gaps, updates stale entries, demotes old entries.
 *
 * Paper Section 3.2, pass 4 + Appendix C.1.4 (memory reuse):
 * - Add: gap detected (e.g., bug resolved without documenting)
 * - Update: stale info (e.g., test baseline changed)
 * - Demote: area not visited in 10+ sessions (@archived)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const REPO_ROOT = resolve(process.cwd());
const MEMORIES_DIR = join(REPO_ROOT, 'memories', 'repo');
const SESSION_DIR = join(REPO_ROOT, 'memories', 'session');
const TRAJECTORY_FILE = join(REPO_ROOT, '.pocket_harness', 'trajectory.jsonl');
const FAILURES_FILE = join(REPO_ROOT, '.pocket_harness', 'failures.json');

function readTrajectory() {
  if (!existsSync(TRAJECTORY_FILE)) return [];
  return readFileSync(TRAJECTORY_FILE, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function readFailures() {
  if (!existsSync(FAILURES_FILE)) return { failures: [] };
  return JSON.parse(readFileSync(FAILURES_FILE, 'utf-8'));
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readMemories() {
  ensureDir(MEMORIES_DIR);
  const files = readdirSync(MEMORIES_DIR).filter((f) => f.endsWith('.md'));
  return files.map((f) => {
    const content = readFileSync(join(MEMORIES_DIR, f), 'utf-8');
    const isArchived = content.includes('@archived');
    return { file: f, content, isArchived, size: content.length };
  });
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const trajectory = readTrajectory();
  const { failures } = readFailures();
  const memories = readMemories();
  const actions = [];

  ensureDir(MEMORIES_DIR);
  ensureDir(SESSION_DIR);

  const today = new Date().toISOString().split('T')[0];
  const sessionName = `session-${today}`;

  // ── Add: create session memory with trajectory summary ──────────

  const sessionFile = join(SESSION_DIR, `${sessionName}.md`);
  if (!existsSync(sessionFile) && trajectory.length > 0) {
    const editCount = trajectory.filter((e) =>
      [
        'edit_file',
        'replace_string_in_file',
        'create_file',
        'multi_replace_string_in_file',
      ].includes(e.tool),
    ).length;
    const readCount = trajectory.filter((e) =>
      ['read_file', 'grep_search', 'semantic_search', 'file_search'].includes(e.tool),
    ).length;
    const terminalCount = trajectory.filter((e) => e.tool === 'run_in_terminal').length;
    const errorCount = trajectory.filter((e) => e.hasError).length;

    const sessionMemory = `# Session: ${today}\n\n## Activity Summary\n\n- **Tool calls**: ${trajectory.length} total\n- **Edits**: ${editCount}\n- **Reads**: ${readCount}\n- **Terminal**: ${terminalCount}\n- **Errors**: ${errorCount}\n\n## Failure Signatures\n\n${failures.length > 0 ? failures.map((f) => `- [${f.severity}] ${f.type}: ${f.description}`).join('\n') : '- No failures detected'}\n\n## Files Touched\n\n${[
      ...new Set(trajectory.filter((e) => e.input).map((e) => e.input)),
    ]
      .slice(0, 10)
      .map((f) => `- ${f}`)
      .join('\n')}\n`;
    writeFileSync(sessionFile, sessionMemory);
    actions.push({ operation: 'add', memory: `session/${sessionName}.md`, type: 'session' });
  }

  // ── Update: check if test baseline needs updating ──────────────

  const testCalls = trajectory.filter(
    (e) => e.tool === 'run_in_terminal' && e.input && e.input.includes('vitest'),
  );
  if (testCalls.length > 0) {
    // Try to get current test results
    try {
      const vitestOutput = execSync('npx vitest run --reporter=json 2>&1', {
        encoding: 'utf-8',
        cwd: join(REPO_ROOT, 'backend'),
        timeout: 30000,
      });
      // Check if there's existing baseline memory to update
      const refactoringFile = join(MEMORIES_DIR, 'refactoring-2026-06-14.md');
      if (existsSync(refactoringFile)) {
        const content = readFileSync(refactoringFile, 'utf-8');
        const currentBaseline = content.match(/(\d+)\/(\d+)/);
        if (currentBaseline) {
          const baselineStr = `${currentBaseline[1]}/${currentBaseline[2]}`;
          // Check if baseline changed
          const summaryMatch = content.match(/Backend: \*\*(\d+)\/(\d+)\*\*/);
          if (
            summaryMatch &&
            (summaryMatch[1] !== currentBaseline[1] || summaryMatch[2] !== currentBaseline[2])
          ) {
            actions.push({
              operation: 'update',
              memory: 'refactoring-2026-06-14.md',
              detail: `Baseline changed from ${baselineStr} to ${summaryMatch[1]}/${summaryMatch[2]}`,
              type: 'repo',
            });
          }
        }
      }
    } catch {
      // vitest command failed — likely no tests to run
    }
  }

  // ── Update: add today's findings if there are failures ─────────

  if (failures.length > 0 && !memories.some((m) => m.file.includes('failure-patterns'))) {
    const patternsFile = join(MEMORIES_DIR, 'failure-patterns.md');
    const content = `# Failure Patterns\n\n> Auto-generated by memory-refiner.js\n\n## ${today}\n\n${failures.map((f) => `- [${f.severity}] **${f.type}**: ${f.description}`).join('\n')}\n\n## Root Cause Analysis\n\n(TODO: after 3+ sessions, analyze recurring patterns)\n`;
    writeFileSync(patternsFile, content);
    actions.push({ operation: 'add', memory: 'failure-patterns.md', type: 'repo' });
  }

  // ── Cleanup: archive + delete old session memories ───────────
  // (7 days = archive, 14 days = delete permanently)
  const sessionFiles = existsSync(SESSION_DIR)
    ? readdirSync(SESSION_DIR).filter((f) => f.endsWith('.md'))
    : [];
  for (const sf of sessionFiles) {
    const sp = join(SESSION_DIR, sf);
    const content = readFileSync(sp, 'utf-8');
    const dateMatch = sf.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;

    const daysOld = (Date.now() - new Date(dateMatch[1]).getTime()) / (1000 * 60 * 60 * 24);

    // Archive sessions older than 7 days
    if (daysOld > 7 && !content.includes('@archived')) {
      writeFileSync(sp, `@archived ${today}\n\n${content}`);
      actions.push({
        operation: 'demote',
        memory: `session/${sf}`,
        reason: `${Math.floor(daysOld)} days old — archived`,
      });
    }

    // Delete sessions older than 14 days (keep repo clean)
    if (daysOld > 14) {
      try {
        rmSync(sp);
        actions.push({
          operation: 'delete',
          memory: `session/${sf}`,
          reason: `${Math.floor(daysOld)} days old — deleted`,
        });
      } catch {
        /* file may already be gone */
      }
    }
  }

  if (actions.length === 0) {
    process.stdout.write(
      JSON.stringify({ refined: false, reason: 'No memory changes needed.' }) + '\n',
    );
  } else {
    process.stdout.write(JSON.stringify({ refined: true, actions }) + '\n');
  }

  process.exit(0);
}

main();
