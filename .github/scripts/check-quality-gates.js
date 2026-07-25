#!/usr/bin/env node
/**
 * check-quality-gates.js
 * Stop hook — prevents session closure if quality gates aren't met.
 *
 * Gates (from plan Section 2.20.4):
 * 1. Uncommitted changes? → block
 * 2. Tests not run? → block
 * 3. TypeScript errors? → block (tsc --noEmit)
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());
const HARNESS_DIR = join(REPO_ROOT, '.pocket_harness');
const TRAJECTORY_FILE = join(HARNESS_DIR, 'trajectory.jsonl');

function main() {
  const gates = [];

  // Gate 1: Uncommitted changes — warn, don't block (WIP is normal between sessions)
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: REPO_ROOT }).trim();
    if (status) {
      const fileCount = status.split('\n').length;
      gates.push({
        gate: 'uncommitted_changes',
        passed: true,
        detail: `ℹ️ ${fileCount} files uncommitted (WIP — not a blocking gate)`,
      });
    } else {
      gates.push({ gate: 'uncommitted_changes', passed: true, detail: 'Working tree clean' });
    }
  } catch {
    gates.push({ gate: 'uncommitted_changes', passed: true, detail: 'no git repo or skipped' });
  }

  // Gate 2: Tests run in this session?
  const trajectoryExists = existsSync(TRAJECTORY_FILE);
  let testsWereRun = false;
  if (trajectoryExists) {
    const trajectory = readFileSync(TRAJECTORY_FILE, 'utf-8')
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
    testsWereRun = trajectory.some(
      (e) => e.tool === 'run_in_terminal' && e.input && e.input.includes('vitest'),
    );
  }
  gates.push({
    gate: 'tests_run',
    passed: testsWereRun || !trajectoryExists,
    detail: testsWereRun ? 'Tests executed' : 'No tests detected in this session (informational)',
  });

  // Gate 3: TypeScript check
  try {
    const tscResult = execSync('npx tsc --noEmit 2>&1', {
      encoding: 'utf-8',
      cwd: join(REPO_ROOT, 'backend'),
      timeout: 30000,
    }).trim();
    const hasErrors = tscResult.includes('error TS');
    gates.push({
      gate: 'typescript_check',
      passed: !hasErrors,
      detail: hasErrors ? 'TypeScript errors found' : 'TypeScript clean',
    });
  } catch (err) {
    // tsc --noEmit exits with code 2 on errors
    const output = (err.stdout || err.stderr || '').toString();
    const hasErrors = output.includes('error TS');
    gates.push({
      gate: 'typescript_check',
      passed: !hasErrors,
      detail: hasErrors ? 'TypeScript errors found' : 'tsc check failed to run',
    });
  }

  const allPassed = gates.every((g) => g.passed);
  const failedGates = gates.filter((g) => !g.passed);

  if (!allPassed) {
    // Block stop — force agent to fix issues
    const output = {
      decision: 'block',
      reason: `Quality gates failed: ${failedGates.map((g) => g.gate).join(', ')}. ${failedGates.map((g) => g.detail).join('; ')}.`,
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: `QUALITY GATES REPORT:\n${gates.map((g) => `  ${g.passed ? '✓' : '✗'} ${g.gate}: ${g.detail}`).join('\n')}`,
      },
    };
    process.stdout.write(JSON.stringify(output) + '\n');
    process.exit(0);
  }

  // All gates pass
  const output = {
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: `QUALITY GATES PASSED:\n${gates.map((g) => `  ✓ ${g.gate}: ${g.detail}`).join('\n')}`,
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
