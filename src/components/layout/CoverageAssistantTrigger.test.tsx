import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoverageAssistantProvider } from "@/components/coverage/coverage-assistant-context";
import { CoverageAssistantTrigger } from "@/components/layout/CoverageAssistantTrigger";

describe("CoverageAssistantTrigger", () => {
  it("renders nav-assistant glyph and Spanish label", () => {
    render(
      <CoverageAssistantProvider>
        <CoverageAssistantTrigger />
      </CoverageAssistantProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Abrir asistente de cobertura" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Asistente")).toBeInTheDocument();
  });

  it("toggles the assistant panel open state", () => {
    render(
      <CoverageAssistantProvider>
        <CoverageAssistantTrigger />
      </CoverageAssistantProvider>,
    );

    const trigger = screen.getByRole("button", {
      name: /Abrir asistente de cobertura/i,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAccessibleName(/Contraer asistente de cobertura/i);
  });
});
