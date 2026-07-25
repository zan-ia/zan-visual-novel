import { Router } from 'express';
import { llmGenerateSchema } from '@zan-vn/shared';
import { authenticate } from '../middleware/auth.js';

export const llmRouter = Router();

// POST /api/v1/llm/generate — Cloud fallback for LLM inference
llmRouter.post('/generate', authenticate, async (req, res) => {
  try {
    const data = llmGenerateSchema.parse(req.body);

    // TODO: Integrate with actual LLM cloud API (e.g., Liquid AI, OpenAI, etc.)
    // For now, return a placeholder that the client can use as fallback

    res.json({
      success: true,
      data: {
        text: '[Serviço de IA em nuvem será integrado aqui — usando modelo local enquanto isso.]',
        modelUsed: data.config.modelType,
        isLocal: false,
        tokensUsed: 0,
        duration: 0,
      },
    });
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
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});
