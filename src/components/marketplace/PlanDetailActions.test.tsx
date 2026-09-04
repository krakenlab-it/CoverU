import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoverageAssistantProvider } from "@/components/coverage/coverage-assistant-context";
import { PlanDetailActions } from "@/components/marketplace/PlanDetailActions";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("age=35&region=Costa"),
}));

describe("PlanDetailActions", () => {
  it("renders marketplace navigation and assistant CTA in Spanish", () => {
    render(
      <CoverageAssistantProvider>
        <PlanDetailActions
          planVersionId="v1"
          filters={{ age: 35, region: "Costa" }}
          backQuery="?age=35&region=Costa"
        />
      </CoverageAssistantProvider>,
    );

    expect(
      screen.getByRole("link", { name: /marketplace/i }),
    ).toHaveAttribute("href", "/app/marketplace?age=35&region=Costa");
    expect(
      screen.getByRole("button", { name: /consultar asistente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /comparar/i }),
    ).toBeInTheDocument();
  });

  it("opens the coverage assistant rail from the CTA", () => {
    render(
      <CoverageAssistantProvider>
        <PlanDetailActions
          planVersionId="v1"
          filters={{ age: 35, region: "Costa" }}
          backQuery="?age=35&region=Costa"
        />
        <div data-testid="panel-state" data-open="false" />
      </CoverageAssistantProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /consultar asistente/i }));

    expect(
      screen.getByRole("button", { name: /consultar asistente/i }),
    ).toBeInTheDocument();
  });
});
