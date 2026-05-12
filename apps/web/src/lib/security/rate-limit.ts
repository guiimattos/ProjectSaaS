const memoryStore = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = memoryStore.get(key);

  if (!current || current.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: current.expiresAt - now };
  }

  current.count += 1;
  memoryStore.set(key, current);
  return { ok: true, remaining: limit - current.count };
}
