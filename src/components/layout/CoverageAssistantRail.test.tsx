import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoverageAssistantProvider } from "@/components/coverage/coverage-assistant-context";
import { CoverageAssistantRail } from "@/components/layout/CoverageAssistantRail";

vi.mock("@/hooks/use-media-query", () => ({
  useIsMobile: () => false,
}));

describe("CoverageAssistantRail", () => {
  it("shows desktop open control when collapsed", () => {
    render(
      <CoverageAssistantProvider>
        <CoverageAssistantRail />
      </CoverageAssistantProvider>,
    );

    expect(
      screen.getByRole("button", { name: /Abrir asistente de cobertura/i }),
    ).toBeInTheDocument();
  });

  it("shows empty-state guidance without plan context when opened", () => {
    render(
      <CoverageAssistantProvider>
        <CoverageAssistantRail />
      </CoverageAssistantProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Abrir asistente de cobertura/i }),
    );

    expect(screen.getByText("Asistente de cobertura")).toBeInTheDocument();
    expect(screen.getByText(/Sin plan seleccionado/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir al marketplace/i }),
    ).toBeInTheDocument();
  });
});
