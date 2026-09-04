import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanPickerSidebar } from "@/components/marketplace/PlanPickerSidebar";
import type { MarketplacePlanResult } from "@/lib/marketplace/types";
import type { Insurer } from "@/lib/types/database";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

const insurers: Insurer[] = [
  {
    id: "ins-bmi",
    name: "BMI",
    slug: "bmi",
    logo_url: null,
    is_demo: false,
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "ins-confiamed",
    name: "Confiamed",
    slug: "confiamed",
    logo_url: null,
    is_demo: false,
    created_at: "2025-01-01T00:00:00Z",
  },
];

const results: MarketplacePlanResult[] = [
  {
    plan: {
      id: "plan-1",
      insurer_id: "ins-bmi",
      name: "SIGMA I150 - Austro",
      description: null,
      coverage_summary: null,
      is_demo: false,
      created_at: "2025-01-01T00:00:00Z",
      natural_key_plan_id: "BMI-SIGMA",
    },
    insurer: insurers[0],
    tariff: null,
    planVersion: {
      id: "pv-1",
      plan_id: "plan-1",
      version_number: 1,
      label: null,
      status: "published",
      effective_from: null,
      effective_to: null,
      published_at: null,
      changelog: null,
      is_demo: false,
      created_at: "2025-01-01T00:00:00Z",
    },
    quoteState: "quoted",
    monthlyPrice: 92.5,
    coverageHighlights: [],
    exclusionWarnings: [],
    waitingPeriodWarnings: [],
    matchedCategories: [],
    maxWaitingDays: null,
  },
  {
    plan: {
      id: "plan-2",
      insurer_id: "ins-confiamed",
      name: "GMM Tarifa 20K - Austro",
      description: null,
      coverage_summary: null,
      is_demo: false,
      created_at: "2025-01-01T00:00:00Z",
      natural_key_plan_id: "CONF-GMM",
    },
    insurer: insurers[1],
    tariff: null,
    planVersion: {
      id: "pv-2",
      plan_id: "plan-2",
      version_number: 1,
      label: null,
      status: "published",
      effective_from: null,
      effective_to: null,
      published_at: null,
      changelog: null,
      is_demo: false,
      created_at: "2025-01-01T00:00:00Z",
    },
    quoteState: "quoted",
    monthlyPrice: 145.75,
    coverageHighlights: [],
    exclusionWarnings: [],
    waitingPeriodWarnings: [],
    matchedCategories: [],
    maxWaitingDays: null,
  },
];

describe("PlanPickerSidebar", () => {
  beforeEach(() => {
    push.mockReset();
    window.localStorage.clear();
  });

  it("renders insurer chips and plan list", () => {
    render(
      <PlanPickerSidebar
        results={results}
        insurers={insurers}
        selectedPlanVersionId="pv-1"
      />,
    );

    expect(screen.getByRole("group", { name: /aseguradora/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /BMI/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confiamed/i })).toBeInTheDocument();
    expect(screen.getByText("SIGMA I150 - Austro")).toBeInTheDocument();
    expect(screen.getByText("GMM Tarifa 20K - Austro")).toBeInTheDocument();
    expect(screen.getByText("2 de 2 planes")).toBeInTheDocument();
  });

  it("filters to favorites stored in localStorage", () => {
    window.localStorage.setItem(
      "coveru-asistente-plan-favorites",
      JSON.stringify(["pv-1"]),
    );

    render(
      <PlanPickerSidebar
        results={results}
        insurers={insurers}
        selectedPlanVersionId="pv-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Solo guardados/i }));

    expect(screen.getByText("SIGMA I150 - Austro")).toBeInTheDocument();
    expect(screen.queryByText("GMM Tarifa 20K - Austro")).not.toBeInTheDocument();
    expect(screen.getByText("1 de 2 planes")).toBeInTheDocument();
  });

  it("applies insurer chip filter via navigation", () => {
    render(
      <PlanPickerSidebar
        results={results}
        insurers={insurers}
        selectedPlanVersionId="pv-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /BMI/i }));

    expect(push).toHaveBeenCalledWith(
      "/app/asistente-cobertura?insurer_id=ins-bmi&plan_version_id=pv-1",
    );
  });
});
