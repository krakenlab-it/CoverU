import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanConditionsPanel } from "@/components/marketplace/PlanConditionsPanel";
import {
  EMPTY_PLAN_CONDITIONS,
  parsePlanConditions,
} from "@/lib/marketplace/plan-conditions";

const ROWS = {
  deductibles: [
    {
      id: "ded-1",
      plan_version_id: "ver-1",
      scope: "individual",
      basis: "por_anio",
      amount: 100,
      notes: "[DEMO] Deducible individual por año.",
      sort_order: 1,
      is_demo: true,
      created_at: "2026-11-19T00:00:00Z",
    },
  ],
  coinsurance: [
    {
      id: "coi-1",
      plan_version_id: "ver-1",
      network: "en_red",
      insurer_pct: 80,
      insured_pct: 20,
      service_category: null,
      notes: null,
      sort_order: 1,
      is_demo: true,
      created_at: "2026-11-19T00:00:00Z",
    },
  ],
  copays: [
    {
      id: "cop-1",
      plan_version_id: "ver-1",
      service_category: "consulta",
      network: "en_red",
      amount: 10,
      notes: null,
      sort_order: 1,
      is_demo: true,
      created_at: "2026-11-19T00:00:00Z",
    },
  ],
  paymentModalities: [
    {
      id: "pay-1",
      plan_version_id: "ver-1",
      method: "debito",
      frequency: "mensual",
      is_default: true,
      payment_url: null,
      notes: "[DEMO] Débito mensual.",
      sort_order: 1,
      is_demo: true,
      created_at: "2026-11-19T00:00:00Z",
    },
  ],
  ceilings: [
    {
      id: "cei-1",
      plan_version_id: "ver-1",
      scope: "por_anio",
      amount: 50000,
      service_category: null,
      notes: null,
      sort_order: 1,
      is_demo: true,
      created_at: "2026-11-19T00:00:00Z",
    },
  ],
};

describe("PlanConditionsPanel", () => {
  it("renders each condition family with its values", () => {
    render(<PlanConditionsPanel conditions={parsePlanConditions(ROWS)} />);

    expect(
      screen.getByRole("heading", { name: "Deducibles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Por persona, por año: $100,00"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("En red: aseguradora 80% · asegurado 20%"),
    ).toBeInTheDocument();
    expect(screen.getByText("Consulta · En red: $10,00")).toBeInTheDocument();
    expect(
      screen.getByText("Débito · Mensual · predeterminada"),
    ).toBeInTheDocument();
    expect(screen.getByText("Por año: $50.000,00")).toBeInTheDocument();
  });

  it("renders the plan version note attached to a condition row", () => {
    render(<PlanConditionsPanel conditions={parsePlanConditions(ROWS)} />);
    expect(screen.getByText(/Deducible individual por año/i)).toBeInTheDocument();
  });

  it("renders nothing when a plan version has no conditions", () => {
    const { container } = render(
      <PlanConditionsPanel conditions={EMPTY_PLAN_CONDITIONS} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("omits a condition family that has no rows", () => {
    render(
      <PlanConditionsPanel
        conditions={{ ...parsePlanConditions(ROWS), copays: [] }}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Copagos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Deducibles" }),
    ).toBeInTheDocument();
  });
});
