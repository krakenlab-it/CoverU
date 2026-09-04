import { describe, expect, it } from "vitest";
import {
  formatResultsRange,
  paginateArray,
  normalizePage,
  normalizePageSize,
} from "@/lib/marketplace/pagination";

describe("marketplace pagination", () => {
  const items = Array.from({ length: 25 }, (_, i) => `plan-${i + 1}`);

  it("returns first page by default", () => {
    const page = paginateArray(items);
    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(12);
    expect(page.items).toHaveLength(12);
    expect(page.totalCount).toBe(25);
    expect(page.totalPages).toBe(3);
    expect(page.startIndex).toBe(0);
    expect(page.endIndex).toBe(12);
  });

  it("returns requested page and page size", () => {
    const page = paginateArray(items, 2, 24);
    expect(page.page).toBe(2);
    expect(page.pageSize).toBe(24);
    expect(page.items).toEqual(["plan-25"]);
    expect(page.startIndex).toBe(24);
    expect(page.endIndex).toBe(25);
  });

  it("clamps page to last page when out of range", () => {
    const page = paginateArray(items, 99, 12);
    expect(page.page).toBe(3);
    expect(page.items).toHaveLength(1);
  });

  it("normalizes invalid page and page size values", () => {
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage(-1)).toBe(1);
    expect(normalizePageSize(undefined)).toBe(12);
    expect(normalizePageSize(99)).toBe(12);
  });

  it("formats result range in Spanish", () => {
    expect(formatResultsRange(0, 12, 25)).toBe("Mostrando 1–12 de 25");
    expect(formatResultsRange(0, 0, 0)).toBe("Mostrando 0 de 0");
  });
});
