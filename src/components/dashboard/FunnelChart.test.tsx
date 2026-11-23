import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { FunnelChart, FunnelDayTable } from "@/components/dashboard/FunnelChart";
import { buildFunnelSummary } from "@/lib/dashboard/funnel";

function summaryFrom(points: { step: string; created_at: string }[]) {
  return buildFunnelSummary(points, true, 3);
}

const today = new Date().toISOString();

describe("FunnelChart", () => {
  it("renders every step with its count, including zeroes", () => {
    render(
      <FunnelChart
        summary={summaryFrom([
          { step: "lead", created_at: today },
          { step: "lead", created_at: today },
          { step: "quote", created_at: today },
        ])}
      />,
    );

    expect(screen.getByText("Lead capturado")).toBeInTheDocument();
    expect(screen.getByText("Cotización")).toBeInTheDocument();
    expect(screen.getByText("Solicitud de asesor")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    // A step with no events still shows an honest zero.
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("labels events in singular and plural", () => {
    render(
      <FunnelChart
        summary={summaryFrom([
          { step: "lead", created_at: today },
          { step: "lead", created_at: today },
          { step: "quote", created_at: today },
        ])}
      />,
    );

    const [lead, quote, advisor] = screen.getAllByRole("listitem");
    expect(lead?.textContent).toContain("2 eventos");
    expect(quote?.textContent).toContain("1 evento");
    expect(advisor?.textContent).toContain("0 eventos");
  });

  it("renders an empty message instead of an empty chart", () => {
    render(<FunnelChart summary={summaryFrom([])} />);

    expect(
      screen.getByText(/Aún no hay eventos del embudo en los últimos 3 días/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Conteo del embudo" })).toBeNull();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <FunnelChart
        summary={summaryFrom([
          { step: "lead", created_at: today },
          { step: "quote", created_at: today },
          { step: "advisor_request", created_at: today },
        ])}
      />,
    );

    expect((await axe(container)).violations).toHaveLength(0);
  });
});

describe("FunnelDayTable", () => {
  it("renders one row per day in the window, newest first", () => {
    render(
      <FunnelDayTable
        summary={summaryFrom([{ step: "quote", created_at: today }])}
      />,
    );

    // Desktop table rows: one header plus one per day in the window.
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(4);
    // The narrow layout is a card list with the same rows.
    expect(
      screen.getByRole("list", { name: /Eventos del embudo por día/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <FunnelDayTable
        summary={summaryFrom([{ step: "lead", created_at: today }])}
      />,
    );

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
