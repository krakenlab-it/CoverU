export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

interface WindowEntry {
  count: number;
  resetAt: number;
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

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.windows.get(key);

    if (!entry || now >= entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.windows.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        limit: this.limit,
        remaining: this.limit - 1,
        resetAt,
      };
    }

    if (entry.count >= this.limit) {
      return {
        allowed: false,
        limit: this.limit,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      limit: this.limit,
      remaining: this.limit - entry.count,
      resetAt: entry.resetAt,
    };
  }
}

const DEFAULT_LIMIT = Number(process.env.API_RATE_LIMIT ?? "100");
const DEFAULT_WINDOW_MS = Number(process.env.API_RATE_WINDOW_MS ?? "60000");

let sharedLimiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!sharedLimiter) {
    sharedLimiter = new InMemoryRateLimiter(DEFAULT_LIMIT, DEFAULT_WINDOW_MS);
  }
  return sharedLimiter;
}

/** Reset shared limiter — for tests only */
export function resetRateLimiterForTests(): void {
  sharedLimiter = null;
}
