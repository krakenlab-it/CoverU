import { describe, expect, it } from "vitest";
import { paginate } from "@/lib/api/response";

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("returns correct page slice", () => {
    const { items: page1, meta } = paginate(items, 1, 10);
    expect(page1).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(meta.total).toBe(25);
    expect(meta.total_pages).toBe(3);
  });

  it("returns last page partial results", () => {
    const { items: page3 } = paginate(items, 3, 10);
    expect(page3).toEqual([21, 22, 23, 24, 25]);
  });
});
