import type { Request, Response, NextFunction } from 'express';
import { createClient, type RedisClientType } from 'redis';

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;

// ── Redis-backed rate limiter ───────────────────────────

let redisClient: RedisClientType | null = null;
let redisAvailable = false;

function getRedis(): RedisClientType {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient.on('error', () => {
      redisAvailable = false;
    });
    redisClient.on('connect', () => {
      redisAvailable = true;
    });
    redisClient.on('end', () => {
      redisAvailable = false;
    });
  }
  return redisClient;
}

// Connect lazily on first request if not already connected
async function ensureRedisConnected(): Promise<boolean> {
  if (redisAvailable) return true;
  try {
    const c = getRedis();
    if (!c.isOpen) {
      await c.connect();
      redisAvailable = true;
    }
    return redisAvailable;
  } catch {
    redisAvailable = false;
    return false;
  }
}

// ── Fallback in-memory store ────────────────────────────

const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore) {
    if (now > record.resetAt) memoryStore.delete(key);
  }
}, 300_000);

// ── Middleware ──────────────────────────────────────────

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = `rate:${req.path}:${req.ip ?? 'unknown'}`;
  const now = Date.now();

  // Try Redis first
  checkRateLimitRedis(key, now)
    .then((allowed) => {
      if (allowed) {
        next();
      } else {
        res.status(429).json({
          success: false,
          error: {
            statusCode: 429,
            message: 'Muitas requisições. Tente novamente em breve.',
            code: 'RATE_LIMITED',
          },
        });
      }
    })
    .catch(() => {
      // Fallback to in-memory store
      checkRateLimitMemory(key, now, res, next);
    });
}

// ── Redis implementation ────────────────────────────────

async function checkRateLimitRedis(key: string, now: number): Promise<boolean> {
  const redisOk = await ensureRedisConnected();
  if (!redisOk) throw new Error('Redis not available');

  const redis = getRedis();
  const windowKey = `${key}:${Math.floor(now / WINDOW_MS)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, Math.ceil(WINDOW_MS / 1000));
  }

  return count <= MAX_REQUESTS;
}

// ── In-memory fallback ─────────────────────────────────

function checkRateLimitMemory(key: string, now: number, res: Response, next: NextFunction): void {
  let record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    memoryStore.set(key, record);
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: {
        statusCode: 429,
        message: 'Muitas requisições. Tente novamente em breve.',
        code: 'RATE_LIMITED',
      },
    });
    return;
  }

  next();
}
