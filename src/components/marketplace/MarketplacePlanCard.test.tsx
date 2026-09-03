import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarketplacePlanCard } from "@/components/marketplace/MarketplacePlanCard";
import { DEMO_BADGE_LABEL } from "@/lib/constants";

describe("MarketplacePlanCard", () => {
  const baseProps = {
    planVersionId: "d1000000-0000-4000-8000-000000000001",
    planName: "[DEMO] Plan Básico Alpha",
    insurerName: "[DEMO] Aseguradora Alpha",
    isDemo: true,
    monthlyPrice: 12500,
    quoteState: "indicative" as const,
    coverageHighlights: ["Hospitalización", "Urgencias"],
    exclusionWarnings: ["Tratamientos cosméticos"],
    waitingPeriodWarnings: ["Carencia 180 días"],
    isSelectedForCompare: false,
    detailHref: "/app/marketplace/plans/test",
    onToggleCompare: vi.fn(),
  };

  it("shows demo labeling and indicative quote state", () => {
    render(<MarketplacePlanCard {...baseProps} />);
    expect(screen.getByTitle(DEMO_BADGE_LABEL)).toBeInTheDocument();
    expect(screen.getByText(/Precio indicativo/i)).toBeInTheDocument();
    expect(screen.getByText(/12\.500/)).toBeInTheDocument();
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
