# Implementation Plan — Issue #39

**Issue:** [#39](https://github.com/zan-ia/zan-visual-novel/issues/39) — feat: implement Redis session store and refresh token cache
**Type:** feature
**Complexity:** medium
**Date:** 2026-07-27

## Summary

Implement Redis-based caching layer for refresh tokens and rate limiting, using the already-existing Redis service in docker-compose. A new `lib/redis.ts` singleton (following the `lib/storage.ts` pattern) provides auto-reconnecting Redis client. The auth flow stores refresh tokens in both PostgreSQL (canonical) and Redis (cache with 30d TTL). Rate limiter migrates from in-memory `Map` to Redis `INCR`/`EXPIRE`. All Redis operations have try/catch fallback to PostgreSQL/in-memory when Redis is offline. A `POST /api/v1/auth/logout` endpoint is added to invalidate tokens in both stores.

## Important Discovery — Dependency Change

The issue requests installing `ioredis`, but `"redis": "^4.7.0"` (the official `@redis-io` client) **is already a dependency** in `backend/api/package.json`. This plan uses the existing `redis` package to avoid unnecessary dependency churn. The official `redis` v4 client has built-in reconnect, promise support, and all features needed. If `ioredis` is preferred, swap the import in step 3 and update package.json accordingly.

## Files to Modify/Create

| File                                         | Action     | Description                                                        |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| `backend/api/src/lib/redis.ts`               | **CREATE** | Redis client singleton with auto-reconnect, health check, fallback |
| `backend/api/src/routes/auth.routes.ts`      | **MODIFY** | Add Redis cache on login/refresh, add logout endpoint              |
| `backend/api/src/middleware/rate-limiter.ts` | **MODIFY** | Replace in-memory Map with Redis INCR/EXPIRE                       |
| `backend/api/src/server.ts`                  | **MODIFY** | Add Redis ping to health endpoint, init Redis on startup           |
| `backend/api/src/__tests__/health.test.ts`   | **MODIFY** | Update test to expect Redis health field                           |

## Patterns to Follow

- **Singleton pattern** — `lib/storage.ts` (`getStorage()` → `StorageService`). Replicate for Redis: `lib/redis.ts` (`getRedis()` → `RedisClient` wrapper). Same structure: config load → class → singleton getter → reset for tests.
- **Fallback pattern** — `server.ts` `start()` function wraps S3 init in try/catch with `console.warn` fallback. Replicate for Redis: graceful degradation to PG when Redis is offline.
- **Error response format** — All routes use `{ success: false, error: { statusCode, message, code } }`. Logout endpoint must follow same pattern.
- **Route organization** — Existing routes use `authRouter.post('/action', async (req, res) => {...})`. Logout follows same pattern with `authenticate` middleware.

## Redis Key Schema

| Purpose             | Key Pattern                  | Value                        | TTL                  |
| ------------------- | ---------------------------- | ---------------------------- | -------------------- |
| Refresh token cache | `session:{refreshTokenHash}` | `JSON { userId, expiresAt }` | 30 days              |
| Rate limiter        | `ratelimit:{ip}`             | `integer` (INCR counter)     | 60 seconds (sliding) |
| Health              | `ping`                       | —                            | —                    |

> Note: Use a SHA-256 hash of the refresh token as the key to avoid long keys (tokens are 500+ chars). This also prevents token leakage via `KEYS` commands.

## Implementation Order

### Step 1: Create `backend/api/src/lib/redis.ts`

- Read `REDIS_URL` from env, default `redis://localhost:6379`
- Create `RedisClient` class wrapping `createClient()` from the `redis` package
- Auto-reconnect: use `retryStrategy` (exponential backoff, max 10 retries)
- Events: `connect`, `reconnect`, `error`, `end` with `console.log`/`console.warn`
- Methods:
  - `async ping(): Promise<boolean>` — `PING` command, returns false on failure
  - `async set(key: string, value: string, ttlSeconds: number): Promise<void>`
  - `async get(key: string): Promise<string | null>`
  - `async del(key: string): Promise<void>`
  - `async incr(key: string): Promise<number>` — for rate limiter
  - `async expire(key: string, seconds: number): Promise<void>` — for rate limiter
  - `async quit(): Promise<void>` — for graceful shutdown
- Singleton: `let instance: RedisClient | null`, `getRedis()`, `resetRedis()`
- All methods wrap in try/catch, log warning, and throw so callers can fallback

### Step 2: Modify `backend/api/src/server.ts`

- Import `getRedis` from `./lib/redis.js`
- In `start()`:
  - Call `getRedis()` to initialize the client
  - Wrap in try/catch with `console.warn` fallback message
- Update `/api/health` endpoint:
  ```typescript
  app.get('/api/health', async (_req, res) => {
    let redisStatus = 'disconnected';
    try {
      const redis = getRedis();
      redisStatus = (await redis.ping()) ? 'connected' : 'disconnected';
    } catch {
      /* default disconnected */
    }
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: redisStatus,
    });
  });
  ```
- Add `process.on('SIGTERM', ...)` to call `redis.quit()` for graceful shutdown

### Step 3: Modify `backend/api/src/routes/auth.routes.ts`

**3a. Login (`POST /login`)** — after successful PG insert:

```typescript
// Attempt Redis cache (non-blocking)
try {
  const redis = getRedis();
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await redis.set(`session:${hash}`, JSON.stringify({ userId: user.id, expiresAt }), 30 * 86400);
} catch {
  /* Redis offline, cache miss is acceptable */
}
```

**3b. Refresh (`POST /refresh`)** — check Redis cache before PG:

```typescript
// Try Redis cache first
let sessionData: { userId: string; expiresAt: string } | null = null;
try {
  const redis = getRedis();
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const cached = await redis.get(`session:${hash}`);
  if (cached) sessionData = JSON.parse(cached);
} catch { /* Redis offline, fall through to PG */ }

// If not in cache, check PG (and warm cache)
if (!sessionData) {
  const [session] = await getDb()... // existing PG query
  if (session) {
    // Warm cache
    try {
      const redis = getRedis();
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await redis.set(`session:${hash}`, JSON.stringify({ userId: session.userId, expiresAt: session.expiresAt }), 30 * 86400);
    } catch { /* ignore */ }
  }
}
```

- On token rotation (delete old session, insert new): also delete old key from Redis and set new key

**3c. Logout (`POST /logout`)** — new endpoint:

```typescript
authRouter.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { /* 400 */ return; }

    // Delete from PG
    await getDb().delete(schema.userSessions)
      .where(eq(schema.userSessions.refreshToken, refreshToken));

    // Delete from Redis (non-blocking)
    try {
      const redis = getRedis();
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await redis.del(`session:${hash}`);
    } catch { /* ignore */ }

    res.json({ success: true, data: { message: 'Sessão encerrada' } });
  } catch {
    res.status(500).json({ ... });
  }
});
```

### Step 4: Modify `backend/api/src/middleware/rate-limiter.ts`

Current implementation:

```typescript
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;
```

New implementation — Redis-backed with in-memory fallback:

```typescript
import { getRedis } from '../lib/redis.js';

// In-memory fallback when Redis is offline
const fallbackCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = req.ip ?? 'unknown';

  try {
    const redis = getRedis();
    const redisKey = `ratelimit:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, Math.ceil(WINDOW_MS / 1000));
    }
    if (count > MAX_REQUESTS) {
      res.status(429).json({ ... });
      return;
    }
  } catch {
    // Fallback to in-memory
    const now = Date.now();
    let record = fallbackCounts.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + WINDOW_MS };
      fallbackCounts.set(key, record);
    }
    record.count++;
    if (record.count > MAX_REQUESTS) {
      res.status(429).json({ ... });
      return;
    }
  }

  next();
}
```

> ⚠️ The current rate limiter is a synchronous middleware. Changing to async requires updating the Express middleware chain. Express 4.x supports async middleware if errors are caught. The existing `errorHandler` will catch any thrown errors.

Also: cleanup interval for in-memory fallback should be kept.

### Step 5: Modify `backend/api/src/__tests__/health.test.ts`

Update the health check test to accept the optional `redis` field:

```typescript
expect(body).toHaveProperty('status', 'ok');
expect(body).toHaveProperty('timestamp');
expect(body).toHaveProperty('redis');
expect(['connected', 'disconnected']).toContain(body.redis);
```

### Step 6: Install dependencies and verify

```bash
cd backend/api
npm install redis  # or npm install ioredis if preferred
```

Run build/lint:

```bash
npm run typecheck
npm run lint
npm run test
```

## Identified Risks

| Risk                                                                                                      | Impact     | Mitigation                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| **Redis dependency swap confusion** — issue says `ioredis`, but `redis` is already installed              | low        | Note in plan; implementer decides which to use. If using `redis` (already installed), no package.json change needed |
| **Express 4 async middleware** — changing `rateLimiter` from sync to async may cause unhandled rejections | medium     | Ensure all async paths call `next()` or return response. The `errorHandler` middleware catches thrown errors        |
| **Refresh token hash collisions** — SHA-256 of token as Redis key                                         | negligible | SHA-256 collision probability is astronomically low for ~500 char tokens                                            |
| **Rate limiter fallback inconsistency** — Redis and in-memory states diverge during Redis outage          | low        | Acceptable — rate limiter resets on Redis reconnect. Fallback is per-instance only                                  |
| **Health check test flakiness** — test may fail if Redis is not running in CI                             | medium     | Test should accept both `connected` and `disconnected` as valid states                                              |

## Post-Implementation Verification

- [ ] `npm run typecheck` passes without errors
- [ ] `npm run lint` passes without errors
- [ ] `npm run test` passes (health test accepts both Redis states)
- [ ] Docker Compose: `docker compose up -d` → API starts and Redis is `connected` in health check
- [ ] Login stores refresh token in both PG and Redis (verify with `redis-cli KEYS 'session:*'`)
- [ ] Refresh resolves from Redis cache (faster than PG lookup)
- [ ] Logout deletes refresh token from both PG and Redis
- [ ] Rate limiter survives API restart (counts reset, but Redis remains functional)
- [ ] With Redis container stopped, API still works (PG fallback for sessions, in-memory for rate limiter)
