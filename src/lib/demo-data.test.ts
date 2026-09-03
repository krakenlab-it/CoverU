import { describe, expect, it } from "vitest";
import { filterDemoResults } from "@/lib/demo-data";

describe("filterDemoResults", () => {
  it("returns matching demo plans for metropolitana femenino age 30", () => {
    const results = filterDemoResults(30, "femenino", "metropolitana");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.tariff.is_demo)).toBe(true);
    expect(results.every((r) => r.insurer.name.includes("[DEMO]"))).toBe(true);
  });

  it("returns empty for unsupported region", () => {
    const results = filterDemoResults(30, "femenino", "unsupported-region");
    expect(results).toHaveLength(0);
  });

  it("filters by age range", () => {
    const results = filterDemoResults(10, "femenino", "metropolitana");
    expect(results).toHaveLength(0);
  });
});
