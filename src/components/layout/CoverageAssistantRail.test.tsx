import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoverageAssistantProvider } from "@/components/coverage/coverage-assistant-context";
import { CoverageAssistantRail } from "@/components/layout/CoverageAssistantRail";
import { CoverageAssistantTrigger } from "@/components/layout/CoverageAssistantTrigger";

vi.mock("@/hooks/use-media-query", () => ({
  useIsMobile: () => false,
}));

function DesktopShell() {
  return (
    <CoverageAssistantProvider>
      <CoverageAssistantTrigger />
      <CoverageAssistantRail />
    </CoverageAssistantProvider>
  );
}

describe("CoverageAssistantRail", () => {
  it("opens from the app shell trigger on desktop", () => {
    render(<DesktopShell />);

    fireEvent.click(
      screen.getByRole("button", { name: /Abrir asistente de cobertura/i }),
    );

    expect(screen.getByText("Asistente de cobertura")).toBeInTheDocument();
    expect(screen.getByText(/Sin plan seleccionado/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir al marketplace/i }),
    ).toBeInTheDocument();
  });

  it("collapses from the rail footer control", () => {
    render(<DesktopShell />);

    fireEvent.click(
      screen.getByRole("button", { name: /Abrir asistente de cobertura/i }),
    );

    const rail = screen.getByRole("complementary", {
      name: "Asistente de cobertura",
    });
    fireEvent.click(
      within(rail).getByRole("button", {
        name: /Contraer asistente de cobertura/i,
      }),
    );

    expect(
      screen.getByRole("button", { name: /Abrir asistente de cobertura/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
