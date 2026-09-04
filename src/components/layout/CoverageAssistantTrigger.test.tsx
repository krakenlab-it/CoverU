import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  COVERAGE_ASSISTANT_TOGGLE_EVENT,
  CoverageAssistantTrigger,
} from "@/components/layout/CoverageAssistantTrigger";

describe("CoverageAssistantTrigger", () => {
  it("renders nav-assistant glyph and Spanish label", () => {
    render(<CoverageAssistantTrigger />);

    expect(
      screen.getByRole("button", { name: "Abrir asistente de cobertura" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Asistente")).toBeInTheDocument();
  });

  it("dispatches toggle event when no onToggle prop", () => {
    const handler = vi.fn();
    window.addEventListener(COVERAGE_ASSISTANT_TOGGLE_EVENT, handler);

    render(<CoverageAssistantTrigger />);
    fireEvent.click(screen.getByTestId("coverage-assistant-trigger"));

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(COVERAGE_ASSISTANT_TOGGLE_EVENT, handler);
  });

  it("calls onToggle when provided", () => {
    const onToggle = vi.fn();

    render(<CoverageAssistantTrigger onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId("coverage-assistant-trigger"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
