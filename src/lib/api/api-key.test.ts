import { describe, expect, it } from "vitest";
import {
  DEMO_API_KEY,
  extractKeyPrefix,
  hashApiKey,
  verifyApiKey,
} from "@/lib/api/api-key";

describe("api-key", () => {
  it("extracts key prefix", () => {
    expect(extractKeyPrefix("cov_demo_test_key")).toBe("cov_demo");
  });

  it("hashes API keys deterministically", () => {
    const hash1 = hashApiKey(DEMO_API_KEY);
    const hash2 = hashApiKey(DEMO_API_KEY);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("verifies matching keys", () => {
    const hash = hashApiKey(DEMO_API_KEY);
    expect(verifyApiKey(DEMO_API_KEY, hash)).toBe(true);
  });

  it("rejects non-matching keys", () => {
    const hash = hashApiKey(DEMO_API_KEY);
    expect(verifyApiKey("cov_wrong_key", hash)).toBe(false);
  });
});
