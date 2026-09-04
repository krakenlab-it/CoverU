import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InsurerIdentity } from "@/components/insurers/InsurerIdentity";

describe("InsurerIdentity", () => {
  it("renders insurer name with logo when logoUrl is provided", () => {
    const { container } = render(
      <InsurerIdentity
        name="BMI"
        logoUrl="/insurers/bmi.png"
      />,
    );

    expect(screen.getByText("BMI")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("renders name only when logoUrl is missing", () => {
    render(<InsurerIdentity name="Confiamed" />);

    expect(screen.getByText("Confiamed")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("strips demo prefix from display name", () => {
    render(
      <InsurerIdentity
        name="[DEMO] Aseguradora Alpha"
        logoUrl="/insurers/bmi.png"
      />,
    );

    expect(screen.getByText("Aseguradora Alpha")).toBeInTheDocument();
    expect(screen.queryByText(/\[DEMO\]/)).not.toBeInTheDocument();
  });
});
