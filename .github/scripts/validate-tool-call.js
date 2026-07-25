#!/usr/bin/env node
/**
 * validate-tool-call.js
 * PreToolUse hook — security guard that blocks dangerous operations.
 *
 * Rules (from plan Section 5 / 2.21.7):
 * - DENY: rm -rf outside node_modules
 * - DENY: git push --force to protected branches
 * - DENY: editing files in node_modules/
 * - ASK:  editing .env, docker-compose.yml
 * - ASK:  npm publish
 * - ALLOW: everything else
 */

import { readFileSync } from 'node:fs';

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

function main() {
  const hookInput = readStdinJSON();
  if (!hookInput || !hookInput.tool_name) {
    process.stdout.write(JSON.stringify({}) + '\n');
    process.exit(0);
  }

  const { tool_name, tool_input, tool_use_id } = hookInput;
  let decision = 'allow';
  let reason = '';

  // ── DENY rules ───────────────────────────────────────────────────────

  // Block destructive commands
  if (tool_name === 'run_in_terminal') {
    const cmd = (tool_input?.command || '').toLowerCase();

    // rm -rf outside node_modules
    if (cmd.includes('rm -rf') || cmd.includes('rm -r') || cmd.includes('del /f /s')) {
      const isSafeDir = cmd.includes('node_modules') || cmd.includes('.pocket_harness');
      if (!isSafeDir) {
        decision = 'deny';
        reason =
          'Destructive delete command blocked. Use node_modules cleanup or .pocket_harness cleanup instead.';
      }
    }

    // Git force push to protected branches
    if (cmd.includes('git push --force') || cmd.includes('git push -f')) {
      const protectedBranches = ['master', 'main', 'release'];
      const isProtected = protectedBranches.some((b) => cmd.includes(b));
      if (isProtected || !cmd.includes('--branch')) {
        decision = 'deny';
        reason = 'Force push to protected branch blocked. Create a PR instead.';
      }
    }

    // npm publish without confirmation
    if (cmd.includes('npm publish') && !cmd.includes('--dry-run')) {
      decision = 'ask';
      reason = 'Publishing to npm requires explicit confirmation.';
    }
  }

  // Block editing files in node_modules
  if (
    tool_name === 'edit_file' ||
    tool_name === 'replace_string_in_file' ||
    tool_name === 'create_file' ||
    tool_name === 'multi_replace_string_in_file'
  ) {
    const filePaths = tool_input?.filePath
      ? [tool_input.filePath]
      : tool_input?.replacements?.map((r) => r.filePath) || [];
    const hasNodeModules = filePaths.some((p) => p?.includes('node_modules'));
    if (hasNodeModules) {
      decision = 'deny';
      reason = 'Cannot edit files in node_modules.';
    }

    // Ask for sensitive config files
    const sensitiveFiles = [
      '.env',
      '.env.example',
      'docker-compose.yml',
      'docker-compose.yaml',
      'package-lock.json',
    ];
    const hasSensitive = filePaths.some((p) => sensitiveFiles.some((sf) => p?.endsWith(sf)));
    if (hasSensitive && decision === 'allow') {
      decision = 'ask';
      reason = 'Editing sensitive configuration file requires confirmation.';
    }
  }

  // ── Output ──────────────────────────────────────────────────────────

  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason:
        reason || (decision === 'allow' ? 'Operation allowed by security policy.' : ''),
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
