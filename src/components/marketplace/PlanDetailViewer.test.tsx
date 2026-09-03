import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanDetailViewer } from "@/components/marketplace/PlanDetailViewer";

describe("PlanDetailViewer", () => {
  const detail = {
    plan: {
      id: "p1",
      insurer_id: "i1",
      name: "Plan Básico",
      description: "Plan de salud",
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
  };

  it("renders policy sections", () => {
    render(
      <PlanDetailViewer
        plan={detail.plan}
        insurer={detail.insurer}
        version={detail.version}
        coverageClauses={detail.coverageClauses}
        exclusions={detail.exclusions}
        waitingPeriods={detail.waitingPeriods}
        policyDocuments={detail.policyDocuments}
        citations={detail.citations}
      />,
    );

    expect(
      screen.getByText(/La redacción de la póliza controla/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Hospitalización" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cubierto")).toBeInTheDocument();
    expect(screen.getByText("Art. 4.1")).toBeInTheDocument();
    expect(screen.getByText(/Plan Básico v1/i)).toBeInTheDocument();
  });

  it("shows empty state when coverage data is missing", () => {
    render(
      <PlanDetailViewer
        plan={detail.plan}
        insurer={detail.insurer}
        version={detail.version}
        coverageClauses={[]}
        exclusions={[]}
        waitingPeriods={[]}
        policyDocuments={[]}
        citations={[]}
      />,
    );

    expect(
      screen.getByText(/Detalle de cobertura no disponible/i),
    ).toBeInTheDocument();
  });
});
