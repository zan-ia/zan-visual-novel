import { Router } from 'express';
import { llmGenerateSchema } from '@zan-vn/shared';
import { authenticate } from '../middleware/auth.js';
import { generateCloudLLM, hashPrompt } from '../lib/llm/cloud-llm.js';
import { getRedis } from '../lib/redis.js';

export const llmRouter = Router();

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60; // seconds
const CACHE_TTL = 3600; // 1 hour

// POST /api/v1/llm/generate — Cloud fallback for LLM inference
llmRouter.post('/generate', authenticate, async (req, res) => {
  try {
    const data = llmGenerateSchema.parse(req.body);
    const userId = req.user!.userId;

    // ── Rate limiting (Redis-based) ──────────────────
    const redis = getRedis();
    const rateLimitKey = `llm:ratelimit:${userId}`;

    try {
      const count = await redis.incr(rateLimitKey);
      if (count === 1) {
        await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW);
      }
      if (count > RATE_LIMIT_MAX) {
        res.status(429).json({
          success: false,
          error: {
            statusCode: 429,
            message: 'Muitas requisições. Tente novamente em um minuto.',
            code: 'RATE_LIMITED',
          },
        });
        return;
      }
    } catch {
      // Redis unavailable — skip rate limiting gracefully
    }

    // ── Prompt cache (Redis-based) ───────────────────
    const cacheKey = `llm:cache:${hashPrompt(data.prompt, data.context, data.config)}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch {
      // Redis unavailable — skip cache gracefully
    }

    // ── Generate via cloud LLM ───────────────────────
    const result = await generateCloudLLM(data);

    // ── Store in cache ───────────────────────────────
    try {
      await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch {
      // Redis unavailable — skip cache write gracefully
    }

    res.json(result);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          message: err.errors[0]?.message ?? 'Dados inválidos',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    // Cloud LLM errors (already structured by the service)
    if (err.statusCode && err.code && err.code.startsWith('LLM_')) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          statusCode: err.statusCode,
          message: err.message,
          code: err.code,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});
