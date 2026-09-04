import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarketplacePlanCard } from "@/components/marketplace/MarketplacePlanCard";

describe("MarketplacePlanCard", () => {
  const baseProps = {
    planVersionId: "00000000-0000-4000-8000-000000000001",
    planName: "Plan Básico",
    insurerName: "Aseguradora Alpha",
    monthlyPrice: 12500,
    quoteState: "quoted" as const,
    coverageHighlights: ["Hospitalización", "Urgencias"],
    exclusionWarnings: ["Tratamientos cosméticos"],
    waitingPeriodWarnings: ["Carencia 180 días"],
    isSelectedForCompare: false,
    detailHref: "/app/marketplace/plans/test",
    onToggleCompare: vi.fn(),
  };

  it("shows quoted price state", () => {
    render(<MarketplacePlanCard {...baseProps} insurerLogoUrl="/insurers/bmi.png" />);
    expect(screen.getByText(/Cotización/i)).toBeInTheDocument();
    expect(screen.getByText(/12\.500/)).toBeInTheDocument();
    expect(screen.getByText("Aseguradora Alpha")).toBeInTheDocument();
    expect(screen.getByText(/Prima mensual estimada/i)).toBeInTheDocument();
  });

  it("shows exclusion and waiting period warnings", () => {
    render(<MarketplacePlanCard {...baseProps} />);
    expect(screen.getByText(/Exclusiones a considerar/i)).toBeInTheDocument();
    expect(screen.getByText(/Períodos de carencia/i)).toBeInTheDocument();
  });

  it("shows unavailable quote state without price", () => {
    render(
      <MarketplacePlanCard
        {...baseProps}
        monthlyPrice={null}
        quoteState="unavailable"
      />,
    );
    expect(screen.getByText(/Sin tarifa para este perfil/i)).toBeInTheDocument();
  });
});
