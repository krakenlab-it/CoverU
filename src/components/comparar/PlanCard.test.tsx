import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanCard } from "@/components/comparar/PlanCard";
import { DEMO_BADGE_LABEL } from "@/lib/constants";
import { DEMO_COMPARISON_RESULTS } from "@/lib/demo-data";

describe("PlanCard", () => {
  it("shows tú pagas price and demo badge", () => {
    render(<PlanCard result={DEMO_COMPARISON_RESULTS[0]} />);

    expect(screen.getByText("Tú pagas")).toBeInTheDocument();
    expect(screen.getByTitle(DEMO_BADGE_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText(DEMO_COMPARISON_RESULTS[0].plan.name),
    ).toBeInTheDocument();
  });

  it("shows expandable details summary", () => {
    render(<PlanCard result={DEMO_COMPARISON_RESULTS[0]} />);
    expect(screen.getByLabelText("Detalles del plan")).toBeInTheDocument();
  });
});
