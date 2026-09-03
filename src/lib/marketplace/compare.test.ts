import { describe, expect, it } from "vitest";
import {
  canAddToCompare,
  isCompareReady,
  parseCompareIds,
  serializeCompareIds,
  toggleCompareId,
} from "@/lib/marketplace/compare";

describe("marketplace compare", () => {
  const ids = [
    "d1000000-0000-4000-8000-000000000001",
    "d1000000-0000-4000-8000-000000000002",
    "d1000000-0000-4000-8000-000000000003",
    "d1000000-0000-4000-8000-000000000004",
    "d1000000-0000-4000-8000-000000000005",
  ];

  it("parses compare ids from URL param", () => {
    expect(parseCompareIds("a,b,c")).toEqual(["a", "b", "c"]);
    expect(parseCompareIds(null)).toEqual([]);
  });

  it("limits compare ids to 4", () => {
    expect(parseCompareIds(ids.join(","))).toHaveLength(4);
  });

  it("serializes compare ids", () => {
    expect(serializeCompareIds(["a", "b"])).toBe("a,b");
  });

  it("toggles compare selection", () => {
    expect(toggleCompareId([], ids[0])).toEqual([ids[0]]);
    expect(toggleCompareId([ids[0]], ids[0])).toEqual([]);
  });

  it("enforces max compare limit", () => {
    const full = ids.slice(0, 4);
    const check = canAddToCompare(full, "new-id");
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("4");
  });

  it("reports compare ready state", () => {
    expect(isCompareReady([ids[0]])).toBe(false);
    expect(isCompareReady([ids[0], ids[1]])).toBe(true);
    expect(isCompareReady(ids.slice(0, 4))).toBe(true);
  });
});
