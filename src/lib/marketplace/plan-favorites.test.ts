import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isPlanFavorite,
  readPlanFavorites,
  togglePlanFavorite,
  writePlanFavorites,
} from "@/lib/marketplace/plan-favorites";

const STORAGE_KEY = "coveru-asistente-plan-favorites";

describe("plan favorites", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("reads and writes favorites from localStorage", () => {
    writePlanFavorites(["plan-a", "plan-b"]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify(["plan-a", "plan-b"]),
    );
    expect(readPlanFavorites()).toEqual(["plan-a", "plan-b"]);
  });

  it("returns empty list for invalid stored data", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json");
    expect(readPlanFavorites()).toEqual([]);
  });

  it("toggles favorites on and off", () => {
    expect(togglePlanFavorite("plan-1")).toEqual(["plan-1"]);
    expect(togglePlanFavorite("plan-2")).toEqual(["plan-1", "plan-2"]);
    expect(togglePlanFavorite("plan-1")).toEqual(["plan-2"]);
    expect(readPlanFavorites()).toEqual(["plan-2"]);
  });

  it("checks favorite membership", () => {
    expect(isPlanFavorite("plan-1", ["plan-1", "plan-2"])).toBe(true);
    expect(isPlanFavorite("plan-3", ["plan-1", "plan-2"])).toBe(false);
  });
});
