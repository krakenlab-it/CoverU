import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoverageAssistantProvider } from "@/components/coverage/coverage-assistant-context";
import { PlanCoverageAssistantPrompt } from "@/components/marketplace/PlanCoverageAssistantPrompt";

describe("PlanCoverageAssistantPrompt", () => {
  it("renders plan-specific CTA copy", () => {
    render(
      <CoverageAssistantProvider>
        <PlanCoverageAssistantPrompt planName="[DEMO] Plan Básico Alpha" />
      </CoverageAssistantProvider>,
    );

    expect(screen.getByText(/¿Dudas sobre coberturas/i)).toBeInTheDocument();
    expect(
      screen.getByText(/\[DEMO\] Plan Básico Alpha/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Abrir asistente/i }));
  });
});
