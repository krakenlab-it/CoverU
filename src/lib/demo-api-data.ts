import type {
  Citation,
  CoverageClause,
  Exclusion,
  PlanVersion,
  PolicyDocument,
  Quote,
  WaitingPeriod,
} from "@/lib/types/phase1";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";

export const DEMO_ORG_ID = "d0000000-0000-4000-8000-000000000001";

export const DEMO_INSURERS: Insurer[] = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    name: "[DEMO] Aseguradora Alpha",
    slug: "demo-alpha",
    logo_url: null,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    name: "[DEMO] Aseguradora Beta",
    slug: "demo-beta",
    logo_url: null,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_PLANS: Plan[] = [
  {
    id: "b0000000-0000-4000-8000-000000000001",
    insurer_id: "a0000000-0000-4000-8000-000000000001",
    name: "[DEMO] Plan Básico Alpha",
    description:
      "Plan de ejemplo con cobertura hospitalaria básica. No es un producto real.",
    coverage_summary:
      "Hospitalización, urgencias y consultas ambulatorias limitadas.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "b0000000-0000-4000-8000-000000000002",
    insurer_id: "a0000000-0000-4000-8000-000000000001",
    name: "[DEMO] Plan Plus Alpha",
    description:
      "Plan de ejemplo con mayor cobertura ambulatoria. No es un producto real.",
    coverage_summary:
      "Hospitalización, urgencias, consultas ambulatorias y exámenes.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "b0000000-0000-4000-8000-000000000003",
    insurer_id: "a0000000-0000-4000-8000-000000000002",
    name: "[DEMO] Plan Esencial Beta",
    description:
      "Plan de ejemplo económico. No es un producto real ni precio vigente.",
    coverage_summary: "Urgencias y hospitalización con copago moderado.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_TARIFFS: Tariff[] = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    plan_id: "b0000000-0000-4000-8000-000000000001",
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
  {
    id: "c0000000-0000-4000-8000-000000000002",
    plan_id: "b0000000-0000-4000-8000-000000000002",
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
  {
    id: "c0000000-0000-4000-8000-000000000003",
    plan_id: "b0000000-0000-4000-8000-000000000003",
    age_min: 18,
    age_max: 65,
    gender: "femenino",
    region: "metropolitana",
    monthly_price: 9800,
    deductible: 60000,
    copay_pct: 25,
    annual_limit: 4000000,
    exclusions: ["Tratamientos cosméticos", "Medicina alternativa"],
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    plan_id: "b0000000-0000-4000-8000-000000000001",
    age_min: 18,
    age_max: 65,
    gender: "masculino",
    region: "metropolitana",
    monthly_price: 13200,
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
  {
    id: "c0000000-0000-4000-8000-000000000005",
    plan_id: "b0000000-0000-4000-8000-000000000002",
    age_min: 18,
    age_max: 65,
    gender: "masculino",
    region: "metropolitana",
    monthly_price: 19500,
    deductible: 30000,
    copay_pct: 15,
    annual_limit: 8000000,
    exclusions: ["Tratamientos cosméticos"],
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-4000-8000-000000000006",
    plan_id: "b0000000-0000-4000-8000-000000000001",
    age_min: 18,
    age_max: 65,
    gender: "femenino",
    region: "valparaiso",
    monthly_price: 11800,
    deductible: 55000,
    copay_pct: 20,
    annual_limit: 5000000,
    exclusions: ["Tratamientos cosméticos", "Preexistencias no declaradas"],
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "c0000000-0000-4000-8000-000000000007",
    plan_id: "b0000000-0000-4000-8000-000000000003",
    age_min: 18,
    age_max: 65,
    gender: "masculino",
    region: "biobio",
    monthly_price: 9200,
    deductible: 65000,
    copay_pct: 25,
    annual_limit: 4000000,
    exclusions: ["Tratamientos cosméticos"],
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_PLAN_VERSIONS: PlanVersion[] = [
  {
    id: "d1000000-0000-4000-8000-000000000001",
    plan_id: "b0000000-0000-4000-8000-000000000001",
    version_number: 1,
    label: "[DEMO] v1 — Plan Básico Alpha",
    status: "published",
    effective_from: "2025-01-01",
    effective_to: null,
    published_at: "2025-01-01T00:00:00Z",
    changelog: "Versión inicial de demostración.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d1000000-0000-4000-8000-000000000002",
    plan_id: "b0000000-0000-4000-8000-000000000002",
    version_number: 1,
    label: "[DEMO] v1 — Plan Plus Alpha",
    status: "published",
    effective_from: "2025-01-01",
    effective_to: null,
    published_at: "2025-01-01T00:00:00Z",
    changelog: "Versión inicial de demostración.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d1000000-0000-4000-8000-000000000003",
    plan_id: "b0000000-0000-4000-8000-000000000003",
    version_number: 1,
    label: "[DEMO] v1 — Plan Esencial Beta",
    status: "published",
    effective_from: "2025-01-01",
    effective_to: null,
    published_at: "2025-01-01T00:00:00Z",
    changelog: "Versión inicial de demostración.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_COVERAGE_CLAUSES: CoverageClause[] = [
  {
    id: "d2000000-0000-4000-8000-000000000001",
    plan_version_id: "d1000000-0000-4000-8000-000000000001",
    category: "hospitalizacion",
    title: "Hospitalización",
    description: "Cubre hospitalización en red preferente con copago.",
    coverage_status: "covered",
    conditions: "Requiere autorización previa para cirugías programadas.",
    sort_order: 1,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d2000000-0000-4000-8000-000000000002",
    plan_version_id: "d1000000-0000-4000-8000-000000000001",
    category: "urgencias",
    title: "Urgencias",
    description:
      "Atención de urgencia en red y fuera de red con reembolso parcial.",
    coverage_status: "conditional",
    conditions: "Fuera de red: reembolso hasta 70% con tope mensual.",
    sort_order: 2,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d2000000-0000-4000-8000-000000000003",
    plan_version_id: "d1000000-0000-4000-8000-000000000001",
    category: "maternidad",
    title: "Maternidad",
    description: "No incluida en plan básico de demostración.",
    coverage_status: "not_covered",
    conditions: null,
    sort_order: 3,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d2000000-0000-4000-8000-000000000004",
    plan_version_id: "d1000000-0000-4000-8000-000000000002",
    category: "hospitalizacion",
    title: "Hospitalización",
    description: "Cobertura amplia en red preferente y alternativa.",
    coverage_status: "covered",
    conditions: "Sin tope de días en red preferente.",
    sort_order: 1,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d2000000-0000-4000-8000-000000000005",
    plan_version_id: "d1000000-0000-4000-8000-000000000002",
    category: "ambulatorio",
    title: "Consultas ambulatorias",
    description: "Consultas médicas y exámenes de laboratorio.",
    coverage_status: "covered",
    conditions: "Hasta 12 consultas anuales en red.",
    sort_order: 2,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d2000000-0000-4000-8000-000000000006",
    plan_version_id: "d1000000-0000-4000-8000-000000000002",
    category: "maternidad",
    title: "Maternidad",
    description: "Incluye prenatal y parto en red.",
    coverage_status: "conditional",
    conditions: "Carencia de 300 días para parto.",
    sort_order: 3,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d2000000-0000-4000-8000-000000000007",
    plan_version_id: "d1000000-0000-4000-8000-000000000003",
    category: "hospitalizacion",
    title: "Hospitalización",
    description: "Hospitalización básica con copago moderado.",
    coverage_status: "covered",
    conditions: "Red limitada en regiones fuera de RM.",
    sort_order: 1,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d2000000-0000-4000-8000-000000000008",
    plan_version_id: "d1000000-0000-4000-8000-000000000003",
    category: "urgencias",
    title: "Urgencias",
    description: "Solo urgencias en red contratada.",
    coverage_status: "conditional",
    conditions: "Sin cobertura fuera de red.",
    sort_order: 2,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d2000000-0000-4000-8000-000000000009",
    plan_version_id: "d1000000-0000-4000-8000-000000000003",
    category: "dental",
    title: "Dental",
    description: "No incluido en plan esencial.",
    coverage_status: "not_covered",
    conditions: null,
    sort_order: 3,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_EXCLUSIONS: Exclusion[] = [
  {
    id: "d3000000-0000-4000-8000-000000000001",
    plan_version_id: "d1000000-0000-4000-8000-000000000001",
    title: "Tratamientos cosméticos",
    description:
      "Procedimientos estéticos no cubiertos salvo reconstrucción post-trauma.",
    sort_order: 1,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d3000000-0000-4000-8000-000000000002",
    plan_version_id: "d1000000-0000-4000-8000-000000000002",
    title: "Medicina alternativa",
    description: "Homeopatía y terapias no convencionales sin aval médico.",
    sort_order: 1,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d3000000-0000-4000-8000-000000000003",
    plan_version_id: "d1000000-0000-4000-8000-000000000003",
    title: "Tratamientos experimentales",
    description: "Ensayos clínicos y terapias no aprobadas por ISP.",
    sort_order: 1,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_WAITING_PERIODS: WaitingPeriod[] = [
  {
    id: "d4000000-0000-4000-8000-000000000001",
    plan_version_id: "d1000000-0000-4000-8000-000000000001",
    service_category: "cirugia_programada",
    days: 180,
    notes: "Período de carencia de demostración para cirugías electivas.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d4000000-0000-4000-8000-000000000002",
    plan_version_id: "d1000000-0000-4000-8000-000000000002",
    service_category: "maternidad",
    days: 300,
    notes: "Carencia para parto y complicaciones del embarazo.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d4000000-0000-4000-8000-000000000003",
    plan_version_id: "d1000000-0000-4000-8000-000000000003",
    service_category: "general",
    days: 90,
    notes: "Carencia general de demostración.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_POLICY_DOCUMENTS: PolicyDocument[] = [
  {
    id: "d5000000-0000-4000-8000-000000000001",
    plan_version_id: "d1000000-0000-4000-8000-000000000001",
    title: "[DEMO] Condiciones Generales — Plan Básico Alpha v1",
    document_type: "condiciones_generales",
    content:
      "Artículo 4.1 Hospitalización: El asegurado tendrá derecho a hospitalización en la red preferente sujeto al deducible y copago vigentes. Artículo 4.2 Urgencias: Las urgencias médicas están cubiertas en red; fuera de red se reembolsa hasta el 70% con tope. Artículo 5.1 Maternidad: Este plan no incluye cobertura de maternidad. Artículo 6.1 Exclusiones: No se cubren tratamientos cosméticos ni preexistencias no declaradas. Artículo 7.1 Carencias: Cirugías programadas tienen carencia de 180 días desde la vigencia.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d5000000-0000-4000-8000-000000000002",
    plan_version_id: "d1000000-0000-4000-8000-000000000002",
    title: "[DEMO] Condiciones Generales — Plan Plus Alpha v1",
    document_type: "condiciones_generales",
    content:
      "Artículo 4.1 Hospitalización: Cobertura amplia en red preferente y alternativa. Artículo 4.3 Ambulatorio: Hasta 12 consultas anuales. Artículo 5.1 Maternidad: Cobertura condicional con carencia de 300 días. Artículo 6.1 Exclusiones: Medicina alternativa no cubierta.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d5000000-0000-4000-8000-000000000003",
    plan_version_id: "d1000000-0000-4000-8000-000000000003",
    title: "[DEMO] Condiciones Generales — Plan Esencial Beta v1",
    document_type: "condiciones_generales",
    content:
      "Artículo 4.1 Hospitalización: Cobertura básica en red limitada. Artículo 4.2 Urgencias: Solo en red contratada. Artículo 5.1 Dental: No incluido. Artículo 7.1 Carencias: Carencia general de 90 días.",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_CITATIONS: Citation[] = [
  {
    id: "d6000000-0000-4000-8000-000000000001",
    policy_document_id: "d5000000-0000-4000-8000-000000000001",
    clause_ref: "Art. 4.1",
    excerpt:
      "El asegurado tendrá derecho a hospitalización en la red preferente sujeto al deducible y copago vigentes.",
    page_number: 12,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d6000000-0000-4000-8000-000000000002",
    policy_document_id: "d5000000-0000-4000-8000-000000000001",
    clause_ref: "Art. 4.2",
    excerpt:
      "Las urgencias médicas están cubiertas en red; fuera de red se reembolsa hasta el 70% con tope.",
    page_number: 13,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d6000000-0000-4000-8000-000000000003",
    policy_document_id: "d5000000-0000-4000-8000-000000000001",
    clause_ref: "Art. 5.1",
    excerpt: "Este plan no incluye cobertura de maternidad.",
    page_number: 15,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d6000000-0000-4000-8000-000000000004",
    policy_document_id: "d5000000-0000-4000-8000-000000000001",
    clause_ref: "Art. 6.1",
    excerpt:
      "No se cubren tratamientos cosméticos ni preexistencias no declaradas.",
    page_number: 18,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "d6000000-0000-4000-8000-000000000005",
    policy_document_id: "d5000000-0000-4000-8000-000000000001",
    clause_ref: "Art. 7.1",
    excerpt:
      "Cirugías programadas tienen carencia de 180 días desde la vigencia.",
    page_number: 22,
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export const DEMO_QUOTES: Quote[] = [
  {
    id: "d8000000-0000-4000-8000-000000000001",
    organization_id: DEMO_ORG_ID,
    plan_version_id: "d1000000-0000-4000-8000-000000000001",
    tariff_id: "c0000000-0000-4000-8000-000000000001",
    external_ref: "DEMO-QUOTE-001",
    status: "active",
    age: 30,
    gender: "femenino",
    region: "metropolitana",
    monthly_price: 12500,
    metadata: {
      label: "[DEMO] Cotización de ejemplo",
      disclaimer: "No es precio real ni vinculante",
    },
    expires_at: "2026-12-31T23:59:59Z",
    is_demo: true,
    created_at: "2025-01-01T00:00:00Z",
  },
];

export function getLatestPlanVersionForPlan(planId: string): PlanVersion | null {
  const versions = DEMO_PLAN_VERSIONS.filter(
    (v) => v.plan_id === planId && v.status === "published",
  );
  if (versions.length === 0) return null;
  return versions.sort((a, b) => b.version_number - a.version_number)[0];
}

export function findMatchingTariff(
  planId: string,
  filters: { age?: number; gender?: string; region?: string },
): Tariff | null {
  const { age, gender, region } = filters;
  const candidates = DEMO_TARIFFS.filter((t) => t.plan_id === planId);

  if (candidates.length === 0) return null;

  const scored = candidates.map((tariff) => {
    let score = 0;
    if (age != null) {
      if (age >= tariff.age_min && age <= tariff.age_max) score += 3;
      else return { tariff, score: -1 };
    }
    if (gender) {
      if (tariff.gender === gender || tariff.gender === "any") score += 2;
      else return { tariff, score: -1 };
    }
    if (region) {
      if (tariff.region === region || tariff.region === "any") score += 2;
      else return { tariff, score: -1 };
    }
    return { tariff, score };
  });

  const valid = scored.filter((s) => s.score >= 0);
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.score - a.score);
  return valid[0].tariff;
}

export function getDemoPlanVersionDetail(versionId: string) {
  const version = DEMO_PLAN_VERSIONS.find((v) => v.id === versionId);
  if (!version) return null;

  const plan = DEMO_PLANS.find((p) => p.id === version.plan_id);
  const insurer = plan
    ? DEMO_INSURERS.find((i) => i.id === plan.insurer_id)
    : undefined;

  return {
    version,
    plan,
    insurer,
    coverage_clauses: DEMO_COVERAGE_CLAUSES.filter(
      (c) => c.plan_version_id === versionId,
    ),
    exclusions: DEMO_EXCLUSIONS.filter((e) => e.plan_version_id === versionId),
    waiting_periods: DEMO_WAITING_PERIODS.filter(
      (w) => w.plan_version_id === versionId,
    ),
    policy_documents: DEMO_POLICY_DOCUMENTS.filter(
      (d) => d.plan_version_id === versionId,
    ),
    citations: DEMO_CITATIONS.filter((c) =>
      DEMO_POLICY_DOCUMENTS.some(
        (d) => d.id === c.policy_document_id && d.plan_version_id === versionId,
      ),
    ),
  };
}

export function getDemoQuote(quoteId: string, organizationId?: string) {
  const quote = DEMO_QUOTES.find((q) => q.id === quoteId);
  if (!quote) return null;
  if (
    organizationId &&
    quote.organization_id &&
    quote.organization_id !== organizationId
  ) {
    return null;
  }
  return quote;
}
