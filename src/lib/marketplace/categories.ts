export const BENEFIT_CATEGORIES = [
  { value: "hospitalizacion", label: "Hospitalización" },
  { value: "urgencias", label: "Urgencias" },
  { value: "ambulatorio", label: "Ambulatorio" },
  { value: "maternidad", label: "Maternidad" },
  { value: "dental", label: "Dental" },
  { value: "medicamentos", label: "Medicamentos" },
] as const;

export type BenefitCategory = (typeof BENEFIT_CATEGORIES)[number]["value"];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BENEFIT_CATEGORIES.map((c) => [c.value, c.label]),
);

export const WAITING_PERIOD_LABELS: Record<string, string> = {
  cirugia_programada: "Cirugía programada",
  maternidad: "Maternidad",
  preexistencia: "Preexistencias",
  dental: "Dental",
  general: "Cobertura general",
};
