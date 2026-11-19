import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ConsentField } from "@/components/leads/ConsentField";
import { LEAD_CONSENT_LABEL } from "@/lib/leads/consent";

describe("ConsentField", () => {
  it("renders the consent label as the checkbox label", () => {
    render(
      <ConsentField id="consent" checked={false} onCheckedChange={() => {}} />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: LEAD_CONSENT_LABEL,
    });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAttribute("aria-invalid", "false");
  });

  it("reports toggles to the parent", () => {
    const onCheckedChange = vi.fn();
    render(
      <ConsentField
        id="consent"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("links the error to the checkbox and marks it invalid", () => {
    render(
      <ConsentField
        id="consent"
        checked={false}
        onCheckedChange={() => {}}
        error="Necesitamos tu consentimiento para contactarte."
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute("aria-describedby", "consent-error");
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Necesitamos tu consentimiento/,
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ConsentField
        id="consent"
        checked
        onCheckedChange={() => {}}
        error="Mensaje de error"
      />,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
