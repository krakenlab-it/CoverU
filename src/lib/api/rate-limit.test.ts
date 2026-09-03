import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "@/lib/api/rate-limit";

describe("InMemoryRateLimiter", () => {
  it("allows requests within limit", async () => {
    const limiter = new InMemoryRateLimiter(3, 60_000);
    const r1 = await limiter.check("test-key");
    const r2 = await limiter.check("test-key");
    const r3 = await limiter.check("test-key");

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over limit", async () => {
    const limiter = new InMemoryRateLimiter(2, 60_000);
    await limiter.check("blocked-key");
    await limiter.check("blocked-key");
    const r3 = await limiter.check("blocked-key");

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("isolates keys", async () => {
    const limiter = new InMemoryRateLimiter(1, 60_000);
    await limiter.check("key-a");
    const blocked = await limiter.check("key-a");
    const allowed = await limiter.check("key-b");

    expect(blocked.allowed).toBe(false);
    expect(allowed.allowed).toBe(true);
  });
});
