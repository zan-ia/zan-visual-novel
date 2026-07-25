#!/usr/bin/env node
/**
 * prompt-auditor.js
 * UserPromptSubmit hook — audits user prompts and enriches with harness context.
 *
 * Runs on every user prompt submit. Lightweight: timeout 5s.
 *
 * Features:
 * - Suggests relevant skills based on prompt keywords
 * - Suggests relevant sub-agents for complex tasks
 * - Alerts if prompt contradicts known project conventions
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

// ── Keyword → Skill Mapping ──────────────────────────────────────────

const SKILL_SUGGESTIONS = [
  {
    keywords: ['rota', 'api', 'endpoint', 'route', 'criar rota'],
    skill: 'new-api-route',
    hint: 'Use a skill `new-api-route` para scaffold de rotas Express com Zod + controller.',
  },
  {
    keywords: ['chain', 'langchain', 'llm', 'prompt', 'system prompt'],
    skill: 'new-chain',
    hint: 'Use a skill `new-chain` para scaffold de chains LangChain (PromptTemplate → LLM → Parser).',
  },
  {
    keywords: ['página', 'page', 'frontend', 'next', 'tela', 'ui'],
    skill: 'new-frontend-page',
    hint: 'Use a skill `new-frontend-page` para scaffold de páginas Next.js com SSE + MUI.',
  },
  {
    keywords: ['pipeline', 'job', 'fila', 'queue', 'stream', 'sse'],
    skill: 'new-pipeline',
    hint: 'Use a skill `new-pipeline` para scaffold de pipelines com job queue + SSE.',
  },
];

const AGENT_SUGGESTIONS = [
  {
    keywords: ['planejar', 'planejamento', 'tasks', 'decompor', 'dividir', 'quebrar em tarefas'],
    agent: 'planner',
    hint: 'Para decompor em tarefas, considere usar o sub-agent `planner`.',
  },
  {
    keywords: ['review', 'revisar', 'revisão', 'auditar', 'code review', 'analisar código'],
    agent: 'code-reviewer',
    hint: 'Para revisão de código, considere usar o sub-agent `code-reviewer` (read-only).',
  },
  {
    keywords: ['testar', 'testes', 'rodar testes', 'executar testes', 'test runner'],
    agent: 'test-runner',
    hint: 'Para executar testes, considere usar o sub-agent `test-runner`.',
  },
  {
    keywords: ['feature', 'épico', 'epic', 'handoff', 'handoff pipeline'],
    agent: 'orchestrator',
    hint: 'Para features complexas, considere o pipeline de handoff via `orchestrator`.',
  },
];

// Anti-patterns that suggest the prompt contradicts project conventions
const CONVENTION_ALERTS = [
  {
    pattern: /import\.\.\/services\/persistence/i,
    warning:
      '⚠️ Evite importar persistence.service diretamente — use req.deps.repositories ou req.deps.persistence.',
  },
  {
    pattern: /import.*from\s+['"]\.\.\/(?!.*\.js['"])/i,
    warning: '⚠️ Lembre-se: imports relativos precisam da extensão .js (NodeNext ESM).',
  },
];

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const hookInput = readStdinJSON();
  if (!hookInput) {
    process.stdout.write(JSON.stringify({}) + '\n');
    process.exit(0);
  }

  const prompt = (hookInput.prompt || '').slice(0, 300);
  if (!prompt) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: '' },
      }) + '\n',
    );
    process.exit(0);
  }

  const lowerPrompt = prompt.toLowerCase();
  const hints = [];

  // Check skill suggestions
  for (const { keywords, hint } of SKILL_SUGGESTIONS) {
    if (keywords.some((kw) => lowerPrompt.includes(kw))) {
      hints.push(`💡 ${hint}`);
      break; // Only suggest the most relevant skill
    }
  }

  // Check agent suggestions
  for (const { keywords, hint } of AGENT_SUGGESTIONS) {
    if (keywords.some((kw) => lowerPrompt.includes(kw))) {
      hints.push(`🤖 ${hint}`);
      break;
    }
  }

  // Check convention alerts
  for (const { pattern, warning } of CONVENTION_ALERTS) {
    if (pattern.test(prompt)) {
      hints.push(warning);
    }
  }

  const context = [`Task: ${prompt.slice(0, 120)}${prompt.length >= 120 ? '...' : ''}`];
  if (hints.length > 0) {
    context.push('', '─── Suggestions ───', ...hints);
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: context.join('\n'),
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
