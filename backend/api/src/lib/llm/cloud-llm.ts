// =============================================================================
// Cloud LLM Service — OpenAI-compatible API wrapper
// =============================================================================
// Generates visual novel narrative continuations using a cloud LLM provider
// (OpenAI, Liquid AI, or any OpenAI-compatible endpoint).
// =============================================================================

import { createHash } from 'node:crypto';
import type { LLMGenerateInput, LLMGenerateResponse } from '@zan-vn/shared';

// ── Configuration ───────────────────────────────────────

const LLM_API_KEY = process.env.LLM_API_KEY ?? '';
const LLM_API_BASE_URL = process.env.LLM_API_BASE_URL ?? 'https://api.openai.com/v1';
const LLM_MODEL = process.env.LLM_MODEL ?? 'gpt-4o-mini';

// ── System prompt for visual novel narration ────────────

const SYSTEM_PROMPT = `Você é um narrador profissional de visual novels em português brasileiro.
Sua função é continuar a narrativa de forma envolvente e imersiva, respeitando:
- O tom e estilo da história atual
- A personalidade e voz de cada personagem
- A ambientação e o clima da cena
- A progressão natural dos eventos

Regras:
- Responda APENAS com o texto da narrativa (diálogos e descrições)
- Não inclua meta-comentários, explicações ou notas do autor
- Mantenha consistência com os personagens e eventos anteriores
- Use linguagem natural e expressiva, adequada ao público brasileiro`;

// ── Types ───────────────────────────────────────────────

interface CloudLLMError {
  statusCode: number;
  message: string;
  code: string;
}

// ── Helpers ─────────────────────────────────────────────

function buildMessages(
  prompt: string,
  context: LLMGenerateInput['context'],
  config: LLMGenerateInput['config'],
) {
  const contextBlock = [
    `Título da história: ${context.storyTitle}`,
    `Cena atual: ${context.currentScene}`,
    context.characterNames.length > 0 ? `Personagens: ${context.characterNames.join(', ')}` : '',
    context.recentHistory.length > 0
      ? `Histórico recente:\n${context.recentHistory.join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return [
    { role: 'system', content: config.systemPrompt || SYSTEM_PROMPT },
    { role: 'user', content: `${contextBlock}\n\nContinue a narrativa: ${prompt}` },
  ];
}

/** Generate a short cache key from prompt + context + config. */
export function hashPrompt(
  prompt: string,
  context: LLMGenerateInput['context'],
  config: LLMGenerateInput['config'],
): string {
  return createHash('sha256')
    .update(prompt + JSON.stringify(context) + JSON.stringify(config))
    .digest('hex')
    .slice(0, 16);
}

// ── Main service ────────────────────────────────────────

/**
 * Generate a narrative continuation using a cloud LLM provider.
 *
 * @param request The validated LLM generate request.
 * @returns The generated narrative response.
 * @throws CloudLLMError on API errors (invalid key, rate limit, etc.)
 */
export async function generateCloudLLM(request: LLMGenerateInput): Promise<LLMGenerateResponse> {
  const startTime = Date.now();

  if (!LLM_API_KEY) {
    const err: CloudLLMError = {
      statusCode: 500,
      message: 'LLM_API_KEY não configurada no servidor',
      code: 'LLM_CONFIG_ERROR',
    };
    throw err;
  }

  const messages = buildMessages(request.prompt, request.context, request.config);

  let res: Response;
  try {
    res = await fetch(`${LLM_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature: request.config.temperature,
        max_tokens: request.config.maxTokens,
        top_p: request.config.topP,
      }),
    });
  } catch (err) {
    const error: CloudLLMError = {
      statusCode: 502,
      message: `Falha ao conectar com o serviço de IA: ${(err as Error).message}`,
      code: 'LLM_CONNECTION_ERROR',
    };
    throw error;
  }

  // ── Handle non-OK responses ──────────────────────────

  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as Record<string, unknown>;
      detail = (body.error as { message?: string })?.message ?? '';
    } catch {
      // ignore parse errors
    }

    const statusCode = res.status;
    if (statusCode === 401) {
      throw {
        statusCode: 500,
        message: 'Chave de API inválida. Verifique LLM_API_KEY.',
        code: 'LLM_AUTH_ERROR',
      } satisfies CloudLLMError;
    }
    if (statusCode === 429) {
      throw {
        statusCode: 429,
        message: 'Limite de requisições da API de IA excedido. Tente novamente em instantes.',
        code: 'LLM_RATE_LIMITED',
      } satisfies CloudLLMError;
    }

    throw {
      statusCode: 502,
      message: `Erro no serviço de IA (${statusCode}): ${detail || 'Erro desconhecido'}`,
      code: 'LLM_PROVIDER_ERROR',
    } satisfies CloudLLMError;
  }

  // ── Parse successful response ─────────────────────────

  let data: {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw {
      statusCode: 502,
      message: 'Resposta inválida do serviço de IA',
      code: 'LLM_RESPONSE_ERROR',
    } satisfies CloudLLMError;
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? '';

  if (!text) {
    throw {
      statusCode: 502,
      message: 'O serviço de IA retornou uma resposta vazia',
      code: 'LLM_EMPTY_RESPONSE',
    } satisfies CloudLLMError;
  }

  return {
    text,
    modelUsed: request.config.modelType,
    isLocal: false,
    tokensUsed: data.usage?.total_tokens ?? 0,
    duration: Date.now() - startTime,
  };
}
