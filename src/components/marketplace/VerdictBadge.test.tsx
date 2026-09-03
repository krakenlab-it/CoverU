import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VerdictBadge } from "@/components/marketplace/VerdictBadge";

describe("VerdictBadge", () => {
  it("renders covered verdict", () => {
    render(<VerdictBadge status="covered" />);
    expect(screen.getByText("Cubierto")).toBeInTheDocument();
  });

  it("renders abstained unknown state", () => {
    render(<VerdictBadge status="unknown" abstained />);
    expect(screen.getByText("Sin respuesta en póliza")).toBeInTheDocument();
  });

  it("renders conditional verdict", () => {
    render(<VerdictBadge status="conditional" />);
    expect(screen.getByText("Condicional")).toBeInTheDocument();
  });
});
