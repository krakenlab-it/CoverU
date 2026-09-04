import { describe, expect, it } from "vitest";
import { formatCatalogDisplayName } from "@/lib/marketplace/display";

describe("formatCatalogDisplayName", () => {
  it("strips demo prefix from catalog names", () => {
    expect(formatCatalogDisplayName("[DEMO] Plan Básico Alpha")).toBe(
      "Plan Básico Alpha",
    );
    expect(formatCatalogDisplayName("Plan Real")).toBe("Plan Real");
  });
});
