import { describe, expect, it } from "vitest";
import { createLogger } from "@/lib/logging/logger";

describe("structured logger", () => {
  it("redacts sensitive keys in metadata", () => {
    const logs: string[] = [];
    const original = console.log;
    console.log = (line: string) => logs.push(line);

    try {
      const logger = createLogger("test");
      logger.info("request", {
        requestId: "abc",
        contact: "user@example.com",
        api_key: "secret-value",
      });
    } finally {
      console.log = original;
    }

    const parsed = JSON.parse(logs[0]) as {
      meta: Record<string, unknown>;
    };
    expect(parsed.meta.api_key).toBe("[REDACTED]");
    expect(parsed.meta.contact).toBe("[REDACTED_EMAIL]");
    expect(parsed.meta.requestId).toBe("abc");
  });
});
