export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  check(key: string, policy?: RateLimitWindow): Promise<RateLimitResult>;
}

interface WindowEntry {
  count: number;
  resetAt: number;
  windowMs: number;
}

export interface RateLimitWindow {
  limit: number;
  windowMs: number;
}

/**
 * In-memory sliding window rate limiter.
 * Suitable for local dev, tests, and single-instance deployments.
 * For multi-instance Vercel production, swap for Upstash Redis via env.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, WindowEntry>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  async check(
    key: string,
    policy?: RateLimitWindow,
  ): Promise<RateLimitResult> {
    const limit = policy?.limit ?? this.limit;
    const windowMs = policy?.windowMs ?? this.windowMs;
    const now = Date.now();
    const entry = this.windows.get(key);

    if (!entry || now >= entry.resetAt || entry.windowMs !== windowMs) {
      const resetAt = now + windowMs;
      this.windows.set(key, { count: 1, resetAt, windowMs });
      return {
        allowed: true,
        limit,
        remaining: Math.max(0, limit - 1),
        resetAt,
      };
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

function readPositiveNumber(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function getDefaultRateLimit(): RateLimitWindow {
  return {
    limit: readPositiveNumber(process.env.API_RATE_LIMIT, 100),
    windowMs: readPositiveNumber(process.env.API_RATE_WINDOW_MS, 60_000),
  };
}

const DEFAULT_POLICY = getDefaultRateLimit();

let sharedLimiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!sharedLimiter) {
    sharedLimiter = new InMemoryRateLimiter(
      DEFAULT_POLICY.limit,
      DEFAULT_POLICY.windowMs,
    );
  }
  return sharedLimiter;
}

/** Reset shared limiter — for tests only */
export function resetRateLimiterForTests(): void {
  sharedLimiter = null;
}
