import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanCard } from "@/components/comparar/PlanCard";
import type { PublicQuoteOffer } from "@/lib/quoters/types";

const OFFER: PublicQuoteOffer = {
  planId: "plan-1",
  planName: "GMM Tarifa 10K - Sierra",
  insurerName: "BMI",
  insurerSlug: "bmi",
  insurerLogoUrl: "/insurers/bmi.png",
  monthlyPrice: 20.32,
  deductible: 10000,
  annualLimit: null,
  region: "Sierra",
  ageMin: 30,
  ageMax: 30,
  gender: "any",
  isDemo: false,
};

describe("PlanCard", () => {
  it("shows the monthly premium, region and age band", () => {
    render(<PlanCard offer={OFFER} />);

    expect(screen.getByText("Prima mensual")).toBeInTheDocument();
    expect(screen.getByText(/20,32/)).toBeInTheDocument();
    expect(screen.getByText("Sierra")).toBeInTheDocument();
    expect(screen.getByText("30 años")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "GMM Tarifa 10K - Sierra" }),
    ).toBeInTheDocument();
  });

  it("shows an em dash when the catalog has no deductible or annual limit", () => {
    render(
      <PlanCard
        offer={{ ...OFFER, deductible: null, annualLimit: null }}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("labels demo rows explicitly", () => {
    render(<PlanCard offer={{ ...OFFER, isDemo: true }} />);

    expect(
      screen.getByTitle("DEMO — datos de ejemplo"),
    ).toBeInTheDocument();
  });

  it("does not label real catalog rows as demo", () => {
    render(<PlanCard offer={OFFER} />);

    expect(screen.queryByTitle(/DEMO/)).not.toBeInTheDocument();
  });
});
