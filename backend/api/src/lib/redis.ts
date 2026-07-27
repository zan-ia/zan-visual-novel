// =============================================================================
// Redis Client — Singleton with graceful fallback
// =============================================================================
// Provides a singleton Redis client with helpers for caching session tokens.
// All operations have try/catch with silent fallback — Redis never breaks the
// application if unavailable.
// =============================================================================

import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let isAvailable = false;

export function getRedisClient(): RedisClientType {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.on('error', (err) => {
      console.warn('⚠️ Redis connection error:', err.message);
      isAvailable = false;
    });
    client.on('connect', () => { isAvailable = true; });
    client.on('end', () => { isAvailable = false; });
  }
  return client;
}

export async function connectRedis(): Promise<void> {
  try {
    const c = getRedisClient();
    if (!c.isOpen) {
      await c.connect();
      isAvailable = true;
      console.log('✅ Redis connected');
    }
  } catch (err) {
    console.warn('⚠️ Redis not available, falling back to database:', (err as Error).message);
    isAvailable = false;
  }
}

export function isRedisAvailable(): boolean {
  return isAvailable;
}

export async function pingRedis(): Promise<boolean> {
  try {
    if (!isAvailable) return false;
    await getRedisClient().ping();
    return true;
  } catch {
    return false;
  }
}

// ── Cache helpers ───────────────────────────────────────

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!isAvailable) return;
  try {
    await getRedisClient().setEx(key, ttlSeconds, value);
  } catch {
    // silent fallback
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!isAvailable) return null;
  try {
    return await getRedisClient().get(key);
  } catch {
    return null;
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!isAvailable) return;
  try {
    await getRedisClient().del(key);
  } catch {
    // silent fallback
  }
}
