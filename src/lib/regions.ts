export const CHILE_REGIONS = [
  { value: "metropolitana", label: "Región Metropolitana" },
  { value: "valparaiso", label: "Valparaíso" },
  { value: "biobio", label: "Biobío" },
  { value: "araucania", label: "Araucanía" },
  { value: "los-rios", label: "Los Ríos" },
  { value: "los-lagos", label: "Los Lagos" },
  { value: "antofagasta", label: "Antofagasta" },
  { value: "coquimbo", label: "Coquimbo" },
  { value: "ohiggins", label: "O'Higgins" },
  { value: "maule", label: "Maule" },
] as const;

export type RegionValue = (typeof CHILE_REGIONS)[number]["value"];

export const GENDER_OPTIONS = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];
