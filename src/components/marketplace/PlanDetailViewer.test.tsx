import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanDetailViewer } from "@/components/marketplace/PlanDetailViewer";

describe("PlanDetailViewer", () => {
  const detail = {
    plan: {
      id: "p1",
      insurer_id: "i1",
      name: "Plan Básico",
      description: "Plan de salud integral",
      coverage_summary: null,
      is_demo: false,
      created_at: "2025-01-01T00:00:00Z",
    },
    insurer: {
      id: "i1",
      name: "Aseguradora Alpha",
      slug: "alpha",
      logo_url: null,
      is_demo: false,
      created_at: "2025-01-01T00:00:00Z",
    },
    version: {
      id: "v1",
      plan_id: "p1",
      version_number: 1,
      label: "Plan Básico v1",
      status: "published" as const,
      effective_from: "2025-01-01",
      effective_to: null,
      published_at: "2025-01-01T00:00:00Z",
      changelog: null,
      is_demo: false,
      created_at: "2025-01-01T00:00:00Z",
    },
    coverageClauses: [
      {
        id: "c1",
        plan_version_id: "v1",
        category: "hospitalizacion",
        title: "Hospitalización",
        description: "Cobertura en red",
        coverage_status: "covered" as const,
        conditions: null,
        sort_order: 1,
        is_demo: false,
        created_at: "2025-01-01T00:00:00Z",
      },
    ],
    exclusions: [],
    waitingPeriods: [],
    policyDocuments: [],
    citations: [
      {
        id: "cit1",
        policy_document_id: "doc1",
        clause_ref: "Art. 4.1",
        excerpt: "Hospitalización en red preferente.",
        page_number: 12,
        is_demo: false,
        created_at: "2025-01-01T00:00:00Z",
      },
    ],
    tariff: {
      id: "t1",
      plan_id: "p1",
      age_min: 30,
      age_max: 40,
      gender: "masculino" as const,
      region: "Costa" as const,
      grupo_asegurado: "titular" as const,
      monthly_price: 92.5,
      deductible: 500,
      copay_pct: null,
      annual_limit: null,
      maternidad: null,
      exclusions: null,
      is_demo: false,
      created_at: "2025-01-01T00:00:00Z",
    },
    filters: { age: 35, gender: "masculino", region: "Costa" as const },
  };

  const baseProps = {
    plan: detail.plan,
    insurer: detail.insurer,
    version: detail.version,
    coverageClauses: detail.coverageClauses,
    exclusions: detail.exclusions,
    waitingPeriods: detail.waitingPeriods,
    policyDocuments: detail.policyDocuments,
    citations: detail.citations,
    tariff: detail.tariff,
    quoteState: "quoted" as const,
    monthlyPrice: 92.5,
    tariffCount: 3,
    filters: detail.filters,
  };

  it("renders premium plan header with insurer hierarchy and tariff", () => {
    render(<PlanDetailViewer {...baseProps} />);

    expect(screen.getByText("Aseguradora Alpha")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Plan Básico" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Plan de salud integral")).toBeInTheDocument();
    expect(screen.getByText(/Plan Básico v1/i)).toBeInTheDocument();
    expect(screen.getByText("Costa")).toBeInTheDocument();
    expect(screen.getByText("Titular")).toBeInTheDocument();
    expect(screen.getByText(/\$92,50/)).toBeInTheDocument();
  });

  it("renders policy sections", () => {
    render(<PlanDetailViewer {...baseProps} />);

    expect(
      screen.getByText(/La redacción de la póliza controla/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Hospitalización" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cubierto")).toBeInTheDocument();
    expect(screen.getByText("Art. 4.1")).toBeInTheDocument();
  });

  it("shows calm typography empty state when coverage data is missing", () => {
    render(
      <PlanDetailViewer
        {...baseProps}
        coverageClauses={[]}
        exclusions={[]}
        waitingPeriods={[]}
        policyDocuments={[]}
        citations={[]}
        tariff={null}
        monthlyPrice={null}
        tariffCount={0}
      />,
    );

    expect(
      screen.getByText(/Detalle de cobertura no disponible/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sin tarifario cargado/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows tariff guidance without inventing prices when no match", () => {
    render(
      <PlanDetailViewer
        {...baseProps}
        tariff={null}
        monthlyPrice={null}
        quoteState="unavailable"
        tariffCount={5}
      />,
    );

    expect(screen.getByText(/5 filas tarifarias/i)).toBeInTheDocument();
    expect(screen.queryByText(/\$92,50/)).not.toBeInTheDocument();
  });
});
