/** Gender values observed in clean/v1.3 tariff matrix */
export const TARIFF_GENDERS = ["any", "femenino", "masculino"] as const;
export type TariffGender = (typeof TARIFF_GENDERS)[number];

/** Regions observed in the clean/v1.3 Ecuador tariff matrix. */
export const TARIFF_REGION_VALUES = [
  "Nacional",
  "Austro",
  "Costa",
  "Sierra",
] as const;
export type TariffRegion = (typeof TARIFF_REGION_VALUES)[number];

export const TARIFF_REGIONS: { value: TariffRegion; label: string }[] =
  TARIFF_REGION_VALUES.map((value) => ({ value, label: value }));

/** Public-facing gender options (the matrix's `any` row is not user-selectable). */
export const GENDER_OPTIONS = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
] as const;
export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];

/** grupo_asegurado values observed in clean/v1.3 tariff matrix */
export const GRUPO_ASEGURADO_OPTIONS = [
  { value: "titular", label: "Titular" },
  { value: "nino_solo", label: "Niño solo" },
] as const;
export type GrupoAsegurado = (typeof GRUPO_ASEGURADO_OPTIONS)[number]["value"];

/** Sparse maternidad dimension on tariffs (Confiamed ConfiPlus) */
export const TARIFF_MATERNIDAD_VALUES = ["Si", "No"] as const;
export type TariffMaternidad = (typeof TARIFF_MATERNIDAD_VALUES)[number];

export function getTariffRegionLabel(value: string): string {
  return TARIFF_REGIONS.find((r) => r.value === value)?.label ?? value;
}

export function isTariffRegion(value: string): value is TariffRegion {
  return (TARIFF_REGION_VALUES as readonly string[]).includes(value);
}

export function getGenderLabel(value: string): string {
  return GENDER_OPTIONS.find((g) => g.value === value)?.label ?? value;
}
