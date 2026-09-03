/** Demo region slugs preserved for API/demo data compatibility. */
export const DEMO_REGIONS = [
  { value: "metropolitana", label: "Pichincha (demo)" },
  { value: "valparaiso", label: "Guayas (demo)" },
  { value: "biobio", label: "Azuay (demo)" },
  { value: "araucania", label: "Manabí (demo)" },
  { value: "los-rios", label: "Los Ríos (demo)" },
  { value: "los-lagos", label: "El Oro (demo)" },
  { value: "antofagasta", label: "Esmeraldas (demo)" },
  { value: "coquimbo", label: "Tungurahua (demo)" },
  { value: "ohiggins", label: "Loja (demo)" },
  { value: "maule", label: "Imbabura (demo)" },
] as const;

/** @deprecated Use DEMO_REGIONS — kept for backward compatibility in imports/tests */
export const CHILE_REGIONS = DEMO_REGIONS;

export type RegionValue = (typeof DEMO_REGIONS)[number]["value"];

export const GENDER_OPTIONS = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];

export function getRegionLabel(value: string): string {
  return DEMO_REGIONS.find((r) => r.value === value)?.label ?? value;
}
