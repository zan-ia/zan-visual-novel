import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err.message);
  res.status(500).json({
    success: false,
    error: {
      statusCode: 500,
      message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
      code: 'INTERNAL_ERROR',
    },
  });
}
