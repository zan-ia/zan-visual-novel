#!/usr/bin/env node
/**
 * skill-refiner.js
 * CRUD over 𝒦 (skills) — codifies successful sequences, repairs broken skills.
 *
 * Paper Section 3.2, pass 3 + Section 4.6 (skill self-improvement):
 * - Codify: successful tool-call sequence repeated 3+ times
 * - Repair: skill execution returned error/exception
 * - Deprecate: skill not used in 20+ sessions
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());
const SKILLS_DIR = join(REPO_ROOT, '.github', 'skills');
const TRAJECTORY_FILE = join(REPO_ROOT, '.pocket_harness', 'trajectory.jsonl');
const SKILL_STATS_FILE = join(REPO_ROOT, '.pocket_harness', 'skill-stats.json');

function readTrajectory() {
  if (!existsSync(TRAJECTORY_FILE)) return [];
  return readFileSync(TRAJECTORY_FILE, 'utf-8').trim().split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function readStats() {
  if (!existsSync(SKILL_STATS_FILE)) return {};
  return JSON.parse(readFileSync(SKILL_STATS_FILE, 'utf-8'));
}

function writeStats(stats) {
  writeFileSync(SKILL_STATS_FILE, JSON.stringify(stats, null, 2));
}

function listSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR).filter(f => {
    const sp = join(SKILLS_DIR, f, 'SKILL.md');
    return existsSync(sp);
  });
}

function createSkill(name, description, body) {
  if (!existsSync(SKILLS_DIR)) mkdirSync(SKILLS_DIR, { recursive: true });
  const skillDir = join(SKILLS_DIR, name);
  if (!existsSync(skillDir)) mkdirSync(skillDir, { recursive: true });

  const skillFile = join(skillDir, 'SKILL.md');
  if (existsSync(skillFile)) return null;

  const content = `---
name: ${name}
description: '${description}'
---

# ${name}

${body}
`;
  writeFileSync(skillFile, content);
  return skillFile;
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const trajectory = readTrajectory();
  const stats = readStats();
  const existingSkills = listSkills();
  const actions = [];

  // ── Detect pattern: creating a route following conventions ───────
  const routeCreationPattern = [];
  for (let i = 0; i < trajectory.length - 3; i++) {
    const slice = trajectory.slice(i, i + 4);
    const hasCreateFile = slice.some(e => e.tool === 'create_file' && e.input && e.input.includes('route.ts'));
    const hasEdit = slice.some(e => e.tool === 'edit_file' || e.tool === 'replace_string_in_file');
    const hasTerminal = slice.some(e => e.tool === 'run_in_terminal' && e.input && e.input.includes('test'));
    if (hasCreateFile && hasEdit && hasTerminal) {
      routeCreationPattern.push(i);
      break;
    }
  }

  const hasNewRoute = existingSkills.includes('new-route');
  if (routeCreationPattern.length >= 1 && !hasNewRoute) {
    const path = createSkill(
      'new-route',
      'Scaffolds a new Express API route following the Controller + Validate pattern. Use when creating a new API endpoint in the Audiobooker backend.',
      `## Procedure\n\n1. Create \`backend/src/api/\${domain}/route.ts\`\n2. Follow the established pattern:\n   - Use \`controller()\` wrapper\n   - Use \`validate()\` middleware with Zod schemas\n   - Access services via \`req.deps\`\n   - Return \`{ data }\` envelope\n   - Use ESM \`.js\` extensions\n3. Add tests in \`backend/src/__tests__/\${domain}/\`\n4. Run \`cd backend && npm test\` to verify\n\n## Example\n\n\`\`\`typescript\nimport { Router } from 'express';\nimport { controller } from '../../middleware/controller.js';\nimport { validate } from '../../middleware/validate.js';\nimport { z } from 'zod';\n\nconst router = Router();\nconst bodySchema = z.object({ name: z.string() });\n\nrouter.post('/', validate({ body: bodySchema }), controller(async (req) => {\n  const result = await req.deps.repositories.example.create(req.body);\n  return { data: result };\n}));\n\nexport default router;\n\`\`\``
    );
    if (path) actions.push({ operation: 'create', skill: 'new-route', path });
    stats['new-route'] = { created: new Date().toISOString(), sessions: 1 };
  }

  // ── Detect pattern: lint + fix cycle ─────────────────────────────
  const lintPattern = trajectory.filter(e =>
    e.tool === 'run_in_terminal' && e.input && (e.input.includes('eslint') || e.input.includes('prettier'))
  );
  const hasFixLint = existingSkills.includes('fix-lint');
  if (lintPattern.length >= 4 && !hasFixLint) {
    const path = createSkill(
      'fix-lint',
      'Runs ESLint and Prettier on modified files to auto-fix formatting and lint issues.',
      `## Procedure\n\n1. Get list of modified files: \`git diff --name-only HEAD\`\n2. For each .ts/.tsx file: \`npx eslint --fix <file>\`\n3. For each .ts/.tsx/.json/.md file: \`npx prettier --write <file>\`\n4. Verify: \`npx tsc --noEmit\` to check for type errors`
    );
    if (path) actions.push({ operation: 'create', skill: 'fix-lint', path });
    stats['fix-lint'] = { created: new Date().toISOString(), sessions: 1 };
  }

  // ── Detect: run-tests pattern ──────────────────────────────────
  const testPattern = trajectory.filter(e =>
    e.tool === 'run_in_terminal' && e.input && e.input.includes('npm test')
  );
  const hasRunTests = existingSkills.includes('run-tests');
  if (testPattern.length >= 3 && !hasRunTests) {
    const path = createSkill(
      'run-tests',
      'Runs the test suite for the Audiobooker monorepo and reports results.',
      `## Procedure\n\n1. \`cd backend && npx vitest run --reporter=verbose\`\n2. \`cd frontend && npx vitest run --reporter=verbose\`\n3. If all pass (baseline: 330 backend, 2 frontend), report success\n4. If failures exist, extract file:line and error message for each\n5. Suggest which files to investigate based on failure patterns`
    );
    if (path) actions.push({ operation: 'create', skill: 'run-tests', path });
    stats['run-tests'] = { created: new Date().toISOString(), sessions: 1 };
  }

  // ── Deprecate unused skills ────────────────────────────────────
  for (const skill of existingSkills) {
    if (!stats[skill]) stats[skill] = { sessions: 0 };
    if (stats[skill].sessions >= 20 && stats[skill].lastUsed) {
      const daysSinceUsed = (Date.now() - new Date(stats[skill].lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUsed > 30) {
        actions.push({ operation: 'deprecate', skill, reason: `Not used in ${Math.floor(daysSinceUsed)} days.` });
        stats[skill].deprecated = true;
      }
    }
  }

  writeStats(stats);

  if (actions.length === 0) {
    process.stdout.write(JSON.stringify({ refined: false, reason: 'No skill changes needed.' }) + '\n');
  } else {
    process.stdout.write(JSON.stringify({ refined: true, actions }) + '\n');
  }

  process.exit(0);
}

main();
