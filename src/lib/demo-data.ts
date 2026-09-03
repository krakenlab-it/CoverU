import type { ComparisonResult } from "@/lib/types/database";

/**
 * Demo comparison data — unmistakably labeled as example data.
 * Used when Supabase is not configured or for local development.
 */
export const DEMO_COMPARISON_RESULTS: ComparisonResult[] = [
  {
    insurer: {
      id: "demo-insurer-alpha",
      name: "[DEMO] Aseguradora Alpha",
      slug: "demo-alpha",
      logo_url: null,
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
    plan: {
      id: "demo-plan-alpha-basico",
      insurer_id: "demo-insurer-alpha",
      name: "[DEMO] Plan Básico Alpha",
      description:
        "Plan de ejemplo con cobertura hospitalaria básica. No es un producto real.",
      coverage_summary:
        "Hospitalización, urgencias y consultas ambulatorias limitadas.",
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
    tariff: {
      id: "demo-tariff-alpha-1",
      plan_id: "demo-plan-alpha-basico",
      age_min: 18,
      age_max: 65,
      gender: "femenino",
      region: "metropolitana",
      monthly_price: 12500,
      deductible: 50000,
      copay_pct: 20,
      annual_limit: 5000000,
      exclusions: [
        "Tratamientos cosméticos",
        "Medicina alternativa no cubierta",
        "Preexistencias no declaradas",
      ],
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
  },
  {
    insurer: {
      id: "demo-insurer-alpha",
      name: "[DEMO] Aseguradora Alpha",
      slug: "demo-alpha",
      logo_url: null,
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
    plan: {
      id: "demo-plan-alpha-plus",
      insurer_id: "demo-insurer-alpha",
      name: "[DEMO] Plan Plus Alpha",
      description:
        "Plan de ejemplo con mayor cobertura ambulatoria. No es un producto real.",
      coverage_summary:
        "Hospitalización, urgencias, consultas ambulatorias y exámenes.",
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
    tariff: {
      id: "demo-tariff-alpha-2",
      plan_id: "demo-plan-alpha-plus",
      age_min: 18,
      age_max: 65,
      gender: "femenino",
      region: "metropolitana",
      monthly_price: 18900,
      deductible: 30000,
      copay_pct: 15,
      annual_limit: 8000000,
      exclusions: [
        "Tratamientos cosméticos",
        "Medicina alternativa no cubierta",
      ],
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
  },
  {
    insurer: {
      id: "demo-insurer-beta",
      name: "[DEMO] Aseguradora Beta",
      slug: "demo-beta",
      logo_url: null,
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
    plan: {
      id: "demo-plan-beta-essencial",
      insurer_id: "demo-insurer-beta",
      name: "[DEMO] Plan Esencial Beta",
      description:
        "Plan de ejemplo económico. No es un producto real ni precio vigente.",
      coverage_summary: "Urgencias y hospitalización con copago moderado.",
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
    tariff: {
      id: "demo-tariff-beta-1",
      plan_id: "demo-plan-beta-essencial",
      age_min: 18,
      age_max: 65,
      gender: "femenino",
      region: "metropolitana",
      monthly_price: 9800,
      deductible: 60000,
      copay_pct: 25,
      annual_limit: 4000000,
      exclusions: [
        "Cirugías electivas no autorizadas",
        "Tratamientos dentales",
        "Preexistencias",
      ],
      is_demo: true,
      created_at: "2025-01-01T00:00:00Z",
    },
  },
];

export function filterDemoResults(
  age: number,
  gender: string,
  region: string,
): ComparisonResult[] {
  return DEMO_COMPARISON_RESULTS.filter(
    (result) =>
      age >= result.tariff.age_min &&
      age <= result.tariff.age_max &&
      (result.tariff.gender === gender || result.tariff.gender === "any") &&
      (result.tariff.region === region || result.tariff.region === "any"),
  );
}
