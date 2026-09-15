import type Redis from "ioredis";

const memoryStore = new Map<string, { count: number; expiresAt: number }>();
let redis: Redis | null | undefined;

function getRedis() {
  if (redis !== undefined) return redis;
  if (!process.env.REDIS_HOST) return (redis = null);
  // Import lazy para não carregar ioredis quando não há Redis configurado.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const IORedis = require("ioredis") as typeof Redis;
  redis = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  redis.on("error", () => undefined);
  return redis;
}

type Result = { ok: boolean; remaining: number; retryAfterMs?: number };

function memoryRateLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();
  const current = memoryStore.get(key);

  if (!current || current.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) return { ok: false, remaining: 0, retryAfterMs: current.expiresAt - now };

  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

/** Janela fixa. Usa Redis quando disponível (multi-instância); senão memória do processo. */
export async function rateLimitAsync(key: string, limit = 60, windowMs = 60_000): Promise<Result> {
  const client = getRedis();
  if (!client) return memoryRateLimit(key, limit, windowMs);
  try {
    const redisKey = `rl:${key}`;
    const count = await client.incr(redisKey);
    if (count === 1) await client.pexpire(redisKey, windowMs);
    if (count > limit) {
      const ttl = await client.pttl(redisKey);
      return { ok: false, remaining: 0, retryAfterMs: Math.max(ttl, 0) };
    }
    return { ok: true, remaining: limit - count };
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}

export function rateLimit(key: string, limit = 60, windowMs = 60_000): Result {
  return memoryRateLimit(key, limit, windowMs);
}
