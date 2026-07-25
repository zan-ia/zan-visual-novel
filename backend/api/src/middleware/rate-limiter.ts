import type { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  let record = requestCounts.get(key);

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    requestCounts.set(key, record);
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: { statusCode: 429, message: 'Muitas requisições. Tente novamente em breve.', code: 'RATE_LIMITED' },
    });
    return;
  }

  next();
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts) {
    if (now > record.resetAt) requestCounts.delete(key);
  }
}, 300_000);
