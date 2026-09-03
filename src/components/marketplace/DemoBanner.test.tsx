import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DemoBanner } from "@/components/marketplace/DemoBanner";
import { DEMO_BADGE_LABEL } from "@/lib/constants";

describe("DemoBanner", () => {
  it("shows prominent demo labeling", () => {
    render(<DemoBanner />);
    expect(screen.getByText(DEMO_BADGE_LABEL)).toBeInTheDocument();
    expect(
      screen.getByText(/No representan productos de seguro reales/i),
    ).toBeInTheDocument();
  });

  it("shows compact demo label", () => {
    render(<DemoBanner compact />);
    expect(screen.getByText(new RegExp(DEMO_BADGE_LABEL))).toBeInTheDocument();
  });
});
