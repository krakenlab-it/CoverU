import { describe, expect, it } from "vitest";
import {
  GRUPO_ASEGURADO_OPTIONS,
  TARIFF_GENDERS,
  TARIFF_MATERNIDAD_VALUES,
  TARIFF_REGIONS,
} from "@/lib/catalog-enums";

describe("catalog-enums (v1.3 observed values)", () => {
  it("defines tariff gender values from v1.3 matrix", () => {
    expect(TARIFF_GENDERS).toEqual(["any", "femenino", "masculino"]);
  });

  it("defines Ecuador tariff regions from v1.3 matrix", () => {
    expect(TARIFF_REGIONS.map((r) => r.value)).toEqual([
      "Nacional",
      "Austro",
      "Costa",
      "Sierra",
    ]);
  });

  it("defines grupo_asegurado values from v1.3 matrix", () => {
    expect(GRUPO_ASEGURADO_OPTIONS.map((o) => o.value)).toEqual([
      "titular",
      "nino_solo",
    ]);
  });

  it("defines sparse maternidad dimension values", () => {
    expect(TARIFF_MATERNIDAD_VALUES).toEqual(["Si", "No"]);
  });
});
