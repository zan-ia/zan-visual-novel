#!/usr/bin/env node
// harness-state.js
// SessionStart hook - reads current harness state and injects it as additionalContext.
//
// Reads: AGENTS.md, .github/agents/*.agent.md, .github/skills/*/SKILL.md,
//        memories/repo/*.md, .github/prompts/*.prompt.md, .vscode/mcp.json

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// ── Helpers ──────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(process.cwd());
const exists = (p) => existsSync(join(REPO_ROOT, p));
const read = (p) => (exists(p) ? readFileSync(join(REPO_ROOT, p), 'utf-8') : null);
const listFiles = (dir, ext) => {
  const d = join(REPO_ROOT, dir);
  if (!existsSync(d)) return [];
  return readdirSync(d).filter((f) => f.endsWith(ext));
};
const sha256 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const readStdinJSON = () => {
  try {
    const chunks = [];
    process.stdin.setEncoding('utf-8');
    while (true) {
      const chunk = process.stdin.read();
      if (chunk === null) break;
      chunks.push(chunk);
    }
    return JSON.parse(chunks.join(''));
  } catch {
    return {};
  }
};

// ── Collect Harness State ────────────────────────────────────────────────

function collectHarnessState() {
  const state = {
    p: { file: 'AGENTS.md', hash: null, size: 0 },
    p_frontend: { file: 'frontend/.instructions.md', hash: null, size: 0 },
    G: [],
    K: [],
    M: [],
    C: [],
    T: null,
  };

  // p — System Prompt
  const agentsMd = read('AGENTS.md');
  if (agentsMd) {
    state.p.hash = sha256(agentsMd);
    state.p.size = agentsMd.length;
  }
  const frontendMd = read('frontend/.instructions.md');
  if (frontendMd) {
    state.p_frontend.hash = sha256(frontendMd);
    state.p_frontend.size = frontendMd.length;
  }

  // 𝒢 — Sub-agents
  for (const f of listFiles('.github/agents', '.agent.md')) {
    const content = read(join('.github/agents', f));
    state.G.push({ file: f, hash: sha256(content || ''), size: content?.length || 0 });
  }

  // 𝒦 — Skills
  for (const f of listFiles('.github/skills', '')) {
    const skillDir = join('.github/skills', f);
    if (
      existsSync(join(REPO_ROOT, skillDir)) &&
      statSync(join(REPO_ROOT, skillDir)).isDirectory()
    ) {
      const skillMd = read(join(skillDir, 'SKILL.md'));
      state.K.push({ name: f, hash: sha256(skillMd || ''), size: skillMd?.length || 0 });
    }
  }
  // Also check user-profile skills
  const userSkillsDir = join(process.env.HOME || process.env.USERPROFILE || '.', '.agents/skills');
  if (existsSync(userSkillsDir)) {
    for (const f of readdirSync(userSkillsDir)) {
      const sp = join(userSkillsDir, f, 'SKILL.md');
      if (existsSync(sp)) {
        const content = readFileSync(sp, 'utf-8');
        state.K.push({ name: f, source: 'user', hash: sha256(content), size: content.length });
      }
    }
  }

  // ℳ — Memory
  for (const f of listFiles('memories/repo', '.md')) {
    const content = read(join('memories/repo', f));
    state.M.push({ file: f, hash: sha256(content || ''), size: content?.length || 0 });
  }

  // 𝒞 — Prompt Files (Slash Commands)
  for (const f of listFiles('.github/prompts', '.prompt.md')) {
    const content = read(join('.github/prompts', f));
    state.C.push({ file: f, hash: sha256(content || ''), size: content?.length || 0 });
  }

  // 𝒯 — MCP Servers
  const mcpJson = read('.vscode/mcp.json');
  if (mcpJson) {
    try {
      state.T = JSON.parse(mcpJson);
    } catch {
      state.T = { error: 'invalid JSON' };
    }
  }

  return state;
}

// ── Git & Environment Context ────────────────────────────────────────────

function collectEnvContext() {
  const ctx = {};
  try {
    ctx.node = execSync('node --version', { encoding: 'utf-8' }).trim();
  } catch {
    ctx.node = 'unknown';
  }
  try {
    ctx.npm = execSync('npm --version', { encoding: 'utf-8' }).trim();
  } catch {
    ctx.npm = 'unknown';
  }
  try {
    ctx.gitBranch = execSync('git branch --show-current', {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
    }).trim();
  } catch {
    ctx.gitBranch = 'unknown';
  }
  try {
    ctx.gitStatus = execSync('git status --porcelain', {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
    }).trim();
  } catch {
    ctx.gitStatus = '';
  }
  try {
    const dockerPs = execSync('docker ps --format "{{.Names}}" 2>nul', {
      encoding: 'utf-8',
      cwd: REPO_ROOT,
    }).trim();
    ctx.dockerServices = dockerPs ? dockerPs.split('\n') : [];
  } catch {
    ctx.dockerServices = [];
  }
  return ctx;
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const harness = collectHarnessState();
  const env = collectEnvContext();

  // Count total components
  const totalAgents = harness.G.length;
  const totalSkills = harness.K.length;
  const totalMemories = harness.M.length;
  const totalPrompts = harness.C.length;
  const hasMCP = harness.T !== null && !harness.T.error;
  const mcpServerCount = hasMCP ? Object.keys(harness.T.servers || {}).length : 0;

  const contextLines = [
    '=== AUDIOBOOKER HARNESS STATE (ℋ) ===',
    '',
    `p (AGENTS.md): ${harness.p.size} bytes (hash: ${harness.p.hash})`,
    `p (frontend): ${harness.p_frontend.size} bytes (hash: ${harness.p_frontend.hash})`,
    `𝒢 (sub-agents): ${totalAgents} agents registered`,
    `𝒦 (skills): ${totalSkills} skills (${harness.K.filter((k) => k.source === 'user').length} user-profile)`,
    `ℳ (memory): ${totalMemories} entries in memories/repo/`,
    `𝒞 (prompts): ${totalPrompts} slash commands`,
    `𝒯 (MCP): ${mcpServerCount} servers ${hasMCP ? 'configured' : 'not configured'}`,
    `ℒ (model): Copilot native (check model picker for current selection)`,
    '',
    '=== ENVIRONMENT ===',
    `Node: ${env.node}`,
    `npm: ${env.npm}`,
    `Branch: ${env.gitBranch}`,
    `Uncommitted changes: ${env.gitStatus ? 'YES' : 'none'}`,
    `Docker: ${(env.dockerServices || []).join(', ') || 'no services running'}`,
    '',
    '=== QUICK STATUS ===',
    `Harness readiness: ${totalAgents > 0 ? 'agents ready' : '⚠️ no custom agents defined'}`,
    `Skills in repo: ${harness.K.filter((k) => k.source !== 'user').length > 0 ? 'ready' : '⚠️ only user-profile skills'}`,
    `Memory: ${totalMemories > 0 ? 'ready' : '⚠️ no memory entries'}`,
    '',
    'To bootstrap: run /init to generate copilot-instructions.md',
    'To create agents: run /create-agent for each specialized role',
    'Docs: docs/copilot-continual-harness-plan.md',
  ];

  const additionalContext = contextLines.join('\n');

  // Output for the hook — injects as SessionStart.additionalContext
  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext,
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
