#!/usr/bin/env node
/**
 * auto-lint.js
 * PostToolUse hook — auto-formats and lints files after every edit.
 *
 * Uses a debounce lock file to avoid running multiple lints simultaneously
 * or in rapid succession (within 3 seconds of the last lint run).
 *
 * For .ts/.tsx files: runs eslint --fix then prettier --write
 * For .json/.md files: runs prettier --write only
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, extname, join } from 'node:path';

const REPO_ROOT = resolve(process.cwd());
const LOCK_FILE = join(REPO_ROOT, '.pocket_harness', 'lint-lock.json');
const DEBOUNCE_MS = 3000; // 3 seconds between lint runs

function readStdinJSON() {
  try {
    if (process.stdin.isTTY) return null;
    const raw = readFileSync(0, 'utf-8');
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function acquireLock() {
  const now = Date.now();
  if (existsSync(LOCK_FILE)) {
    try {
      const lock = JSON.parse(readFileSync(LOCK_FILE, 'utf-8'));
      if (now - lock.ts < DEBOUNCE_MS) {
        return false; // Still within debounce window
      }
    } catch {
      /* corrupt lock — proceed */
    }
  }
  // Ensure directory exists
  const dir = join(REPO_ROOT, '.pocket_harness');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LOCK_FILE, JSON.stringify({ ts: now }));
  return true;
}

function extractFilePaths(hookInput) {
  const { tool_input } = hookInput;
  if (!tool_input) return [];

  const paths = [];
  if (tool_input.filePath) paths.push(tool_input.filePath);
  if (tool_input.replacements) {
    for (const r of tool_input.replacements) {
      if (r.filePath) paths.push(r.filePath);
    }
  }
  // Only process actual files, not temp/chat URIs
  return paths.filter(
    (p) => p && !p.startsWith('untitled:') && !p.startsWith('chat-') && !p.includes('chat-editing'),
  );
}

function shouldLint(filePath) {
  const ext = extname(filePath).toLowerCase();
  return ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html'].includes(ext);
}

function main() {
  const hookInput = readStdinJSON();
  if (!hookInput || !hookInput.tool_name) {
    process.stdout.write(JSON.stringify({}) + '\n');
    process.exit(0);
  }

  const editTools = [
    'edit_file',
    'replace_string_in_file',
    'create_file',
    'multi_replace_string_in_file',
  ];
  if (!editTools.includes(hookInput.tool_name)) {
    process.stdout.write(JSON.stringify({}) + '\n');
    process.exit(0);
  }

  // Debounce: skip if we linted less than 3s ago
  if (!acquireLock()) {
    process.stdout.write(JSON.stringify({}) + '\n');
    process.exit(0);
  }

  const filePaths = extractFilePaths(hookInput);
  const lintableFiles = filePaths.filter(shouldLint);

  if (lintableFiles.length === 0) {
    process.stdout.write(JSON.stringify({}) + '\n');
    process.exit(0);
  }

  const results = [];
  for (const fp of lintableFiles) {
    try {
      const ext = extname(fp).toLowerCase();
      // Prettier for all supported formats
      try {
        execSync(`npx prettier --write "${fp}"`, { cwd: REPO_ROOT, stdio: 'pipe', timeout: 15000 });
      } catch {
        // Prettier may fail on invalid syntax — non-fatal
      }
      // ESLint only for TS/JS
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        try {
          execSync(`npx eslint --fix "${fp}"`, { cwd: REPO_ROOT, stdio: 'pipe', timeout: 15000 });
          results.push(`✓ linted: ${fp}`);
        } catch (eslintErr) {
          // ESLint exit code 1 = lint errors found (expected)
          results.push(`⚠️ lint issues in: ${fp}`);
        }
      } else {
        results.push(`✓ formatted: ${fp}`);
      }
    } catch (err) {
      results.push(`✗ failed: ${fp} (${err.message})`);
    }
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: results.length > 0 ? results.join('\n') : undefined,
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
