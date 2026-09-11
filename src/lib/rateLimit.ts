export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

declare global {
  var __rateLimitStore: Map<string, RateLimitRecord> | undefined;
}

function getStore(): Map<string, RateLimitRecord> {
  if (!global.__rateLimitStore) {
    global.__rateLimitStore = new Map();
  }
  return global.__rateLimitStore;
}

// Periodic cleanup every 60 seconds to prevent memory growth
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const store = getStore();
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 60000).unref?.();
}

/**
 * High-performance sliding rate limiter with automatic cleanup
 */
export function checkRateLimit(
  identifier: string,
  prefix: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  scheduleCleanup();
  const store = getStore();
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetSeconds: windowSeconds,
    };
  }

  if (record.count >= limit) {
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.count += 1;
  const resetSeconds = Math.ceil((record.resetAt - now) / 1000);
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - record.count),
    resetSeconds: Math.max(1, resetSeconds),
  };
}

/**
 * Standard HTTP Rate Limit headers helper
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetSeconds),
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(result.resetSeconds);
  }
  return headers;
}
