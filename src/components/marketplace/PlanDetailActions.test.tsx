import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlanDetailActions } from "@/components/marketplace/PlanDetailActions";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("age=35&region=Costa"),
}));

describe("PlanDetailActions", () => {
  it("renders marketplace navigation and assistant CTA in Spanish", () => {
    render(
      <PlanDetailActions
        planVersionId="v1"
        filters={{ age: 35, region: "Costa" }}
        backQuery="?age=35&region=Costa"
      />,
    );

    expect(
      screen.getByRole("link", { name: /marketplace/i }),
    ).toHaveAttribute("href", "/app/marketplace?age=35&region=Costa");
    expect(
      screen.getByRole("link", { name: /consultar asistente/i }),
    ).toHaveAttribute("href", "#asistente-cobertura");
    expect(
      screen.getByRole("button", { name: /comparar/i }),
    ).toBeInTheDocument();
  });
});
