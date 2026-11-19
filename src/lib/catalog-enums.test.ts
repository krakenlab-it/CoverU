import { describe, expect, it } from "vitest";
import {
  GENDER_OPTIONS,
  GRUPO_ASEGURADO_OPTIONS,
  TARIFF_GENDERS,
  TARIFF_MATERNIDAD_VALUES,
  TARIFF_REGIONS,
  TARIFF_REGION_VALUES,
  getGenderLabel,
  getTariffRegionLabel,
  isTariffRegion,
} from "@/lib/catalog-enums";

describe("catalog-enums (v1.3 observed values)", () => {
  it("defines tariff gender values from v1.3 matrix", () => {
    expect(TARIFF_GENDERS).toEqual(["any", "femenino", "masculino"]);
  });

  it("defines Ecuador tariff regions from v1.3 matrix", () => {
    expect(TARIFF_REGION_VALUES).toEqual([
      "Nacional",
      "Austro",
      "Costa",
      "Sierra",
    ]);
    expect(TARIFF_REGIONS.map((r) => r.value)).toEqual([
      "Nacional",
      "Austro",
      "Costa",
      "Sierra",
    ]);
  });

  it("offers only selectable genders to the public quoter", () => {
    expect(GENDER_OPTIONS.map((option) => option.value)).toEqual([
      "femenino",
      "masculino",
    ]);
    expect(GENDER_OPTIONS.map((option) => option.label)).toEqual([
      "Femenino",
      "Masculino",
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

  it("guards Ecuador regions and rejects Chile-era slugs", () => {
    expect(isTariffRegion("Sierra")).toBe(true);
    expect(isTariffRegion("Nacional")).toBe(true);
    expect(isTariffRegion("metropolitana")).toBe(false);
    expect(isTariffRegion("Biobío")).toBe(false);
  });

  it("resolves labels and falls back to the raw value", () => {
    expect(getTariffRegionLabel("Costa")).toBe("Costa");
    expect(getTariffRegionLabel("desconocida")).toBe("desconocida");
    expect(getGenderLabel("femenino")).toBe("Femenino");
    expect(getGenderLabel("any")).toBe("any");
  });
});
