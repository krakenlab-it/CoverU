/** Gender values observed in clean/v1.3 tariff matrix */
export const TARIFF_GENDERS = ["any", "femenino", "masculino"] as const;
export type TariffGender = (typeof TARIFF_GENDERS)[number];

/** Region values observed in clean/v1.3 tariff matrix (Ecuador) */
export const TARIFF_REGIONS = [
  { value: "Nacional", label: "Nacional" },
  { value: "Austro", label: "Austro" },
  { value: "Costa", label: "Costa" },
  { value: "Sierra", label: "Sierra" },
] as const;
export type TariffRegion = (typeof TARIFF_REGIONS)[number]["value"];

/** grupo_asegurado values observed in clean/v1.3 tariff matrix */
export const GRUPO_ASEGURADO_OPTIONS = [
  { value: "titular", label: "Titular" },
  { value: "nino_solo", label: "Niño solo" },
] as const;
export type GrupoAsegurado = (typeof GRUPO_ASEGURADO_OPTIONS)[number]["value"];

/** Sparse maternidad dimension on tariffs (Confiamed ConfiPlus) */
export const TARIFF_MATERNIDAD_VALUES = ["Si", "No"] as const;
export type TariffMaternidad = (typeof TARIFF_MATERNIDAD_VALUES)[number];
