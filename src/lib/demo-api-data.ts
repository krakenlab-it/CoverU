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
