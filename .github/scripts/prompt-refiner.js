#!/usr/bin/env node
/**
 * prompt-refiner.js
 * Rewrites p (AGENTS.md) based on detected failure signatures.
 *
 * Paper Section 3.2, pass 1: "rewrites the prompt p conditioned on the
 * identified failures and the trajectory window."
 *
 * Rules:
 * - Navigation loops → reinforce relevant conventions
 * - Tool-call failures → add explicit instructions for failing tools
 * - Missed exploration → add guidance to consult key files first
 * - NEVER removes structural sections (overview, commands, architecture)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());
const AGENTS_FILE = join(REPO_ROOT, 'AGENTS.md');
const FAILURES_FILE = join(REPO_ROOT, '.pocket_harness', 'failures.json');

function readFailures() {
  if (!existsSync(FAILURES_FILE)) return { failures: [] };
  return JSON.parse(readFileSync(FAILURES_FILE, 'utf-8'));
}

function readAgentsMd() {
  if (!existsSync(AGENTS_FILE)) return '';
  return readFileSync(AGENTS_FILE, 'utf-8');
}

function hasConventionSection(content, sectionName) {
  return content.includes(sectionName);
}

// ── Refinement Rules ──────────────────────────────────────────────────

const REFINEMENT_RULES = [
  // ESM .js imports
  {
    condition: (failures) =>
      failures.some((f) => f.type === 'tool_call_failure' && f.severity === 'high'),
    section: '### ESM .js Extensions',
    text: `\n### ESM .js Extensions\n\n⚠️ **CRITICAL**: All relative imports MUST use \`.js\` extension (NodeNext ESM module resolution).\n\n| Correct | Wrong |\n|---------|-------|\n| \`import { foo } from './bar.js'\` | \`import { foo } from './bar'\` |\n| \`import { baz } from '../../utils/helper.js'\` | \`import { baz } from '../../utils/helper'\` |\n\nThis is enforced by \`tsconfig.base.json\` (\`moduleResolution: "NodeNext"\`).\n`,
  },
  // DI pattern
  {
    condition: (failures) =>
      failures.some((f) => f.type === 'navigation_loop' && f.file && f.file.includes('src/api')),
    section: '### Dependency Injection (req.deps)',
    text: `\n### Dependency Injection (req.deps)\n\n⚠️ **CRITICAL**: Routes MUST access services via \`req.deps\`. Never import \`persistence.service.ts\`, \`minio.service.ts\`, or \`state-machine.ts\` directly in route files.\n\n\`\`\`typescript\n// ✓ CORRECT\nrouter.get('/projects', controller(async (req) => {\n  const projects = await req.deps.repositories.projects.findAll();\n  return { data: projects };\n}));\n\n// ✗ WRONG — never do this\nimport { listProjects } from '../../services/persistence.service.js';\n\`\`\`\n`,
  },
  // Controller + Validate pattern
  {
    condition: (failures) =>
      failures.some((f) => f.type === 'navigation_loop' && f.file && f.file.includes('route.ts')),
    section: '### Controller + Validate Pattern',
    text: `\n### Controller + Validate Pattern\n\n⚠️ Every route MUST use \`controller()\` wrapper + \`validate()\` middleware. Never use manual try/catch in route handlers.\n\n\`\`\`typescript\nrouter.post('/start', validate({ body: startSchema }), controller(async (req) => {\n  const job = await req.deps.jobQueue.createJob('correction');\n  return { data: { jobId: job.id } };\n}));\n\`\`\`\n\n- \`controller(fn)\` — auto-envelopes \`{ ok: true, data }\`, catches errors → \`next(err)\`\n- \`validate({ body?, query?, params? })\` — Zod validation, throws \`ValidationError\` (400) on failure\n`,
  },
  // Error hierarchy
  {
    condition: (failures) => failures.some((f) => f.type === 'tool_call_failure'),
    section: '### Error Hierarchy',
    text: `\n### Error Hierarchy\n\n⚠️ Always use \`HttpError\` subclasses, never \`throw new Error()\`:\n\n| Error Class | HTTP | Use When |\n|-------------|------|----------|\n| \`NotFoundError.forResource(resource, field, value)\` | 404 | Resource not found |\n| \`BadRequestError.missingField(field)\` | 400 | Missing required field |\n| \`ValidationError.fromZod(resource, zodError)\` | 400 | Zod validation fails |\n| \`ConflictError.invalidTransition(from, to)\` | 409 | Invalid state transition |\n| \`InternalServerError.fromError(err)\` | 500 | Unexpected errors (safe fallback) |\n`,
  },
];

// ── Validation ──────────────────────────────────────────────────────────

/**
 * Validates that AGENTS.md still has sane structure after refinement.
 * Returns { valid: boolean, issues: string[] }
 */
function validateAgentsMd(content) {
  const issues = [];

  // Must have at least the core structural sections
  const requiredSections = ['Project Overview', 'Monorepo Structure', 'Key Commands'];
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      issues.push(`Missing required section: "${section}"`);
    }
  }

  // Must not be empty
  if (content.trim().length < 500) {
    issues.push('AGENTS.md seems too short — possible corruption');
  }

  // Must have proper markdown headers
  const headerCount = (content.match(/^## /gm) || []).length;
  if (headerCount < 3) {
    issues.push(`Only ${headerCount} H2 sections found — expected 3+`);
  }

  return { valid: issues.length === 0, issues };
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  const { failures } = readFailures();
  if (failures.length === 0) {
    process.stdout.write(
      JSON.stringify({ refined: false, reason: 'No failure signatures detected.' }) + '\n',
    );
    process.exit(0);
  }

  let agentsMd = readAgentsMd();
  let refined = false;
  const applied = [];

  // Backup current version before any edits
  const backupFile = join(REPO_ROOT, '.pocket_harness', `AGENTS.md.backup.${Date.now()}`);
  writeFileSync(backupFile, agentsMd);

  for (const rule of REFINEMENT_RULES) {
    if (rule.condition(failures) && !hasConventionSection(agentsMd, rule.section)) {
      agentsMd += '\n' + rule.text;
      applied.push(rule.section);
      refined = true;
    }
  }

  if (refined) {
    // Validate before writing
    const validation = validateAgentsMd(agentsMd);
    if (!validation.valid) {
      // Rollback — restore from backup
      writeFileSync(AGENTS_FILE, readFileSync(backupFile, 'utf-8') + '\n');
      process.stdout.write(
        JSON.stringify({
          refined: false,
          rolledBack: true,
          backup: backupFile,
          reason: `Validation failed: ${validation.issues.join('; ')}`,
        }) + '\n',
      );
      process.exit(0);
    }

    writeFileSync(AGENTS_FILE, agentsMd + '\n');
    process.stdout.write(
      JSON.stringify({
        refined: true,
        applied,
        backup: backupFile,
        message: `Applied ${applied.length} refinements to AGENTS.md. Backup saved at ${backupFile}.`,
      }) + '\n',
    );
  } else {
    process.stdout.write(
      JSON.stringify({
        refined: false,
        reason: 'No new conventions to add — all failure patterns already covered.',
      }) + '\n',
    );
  }

  process.exit(0);
}

main();
