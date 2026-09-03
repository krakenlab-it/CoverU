import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanDetailViewer } from "@/components/marketplace/PlanDetailViewer";
import { getDemoPlanVersionDetail } from "@/lib/demo-api-data";

describe("PlanDetailViewer", () => {
  const detail = getDemoPlanVersionDetail(
    "d1000000-0000-4000-8000-000000000001",
  );

  it("renders policy sections and demo labeling", () => {
    if (!detail?.plan || !detail.insurer || !detail.version) {
      throw new Error("Missing demo detail");
    }

    render(
      <PlanDetailViewer
        plan={detail.plan}
        insurer={detail.insurer}
        version={detail.version}
        coverageClauses={detail.coverage_clauses}
        exclusions={detail.exclusions}
        waitingPeriods={detail.waiting_periods}
        policyDocuments={detail.policy_documents}
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
    expect(
      screen.getByText(/Plan Básico Alpha v1/i),
    ).toBeInTheDocument();
  });
});
