import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { EmptyState } from "@/components/platform/EmptyState";
import { ErrorState } from "@/components/platform/ErrorState";
import { SkipLink } from "@/components/platform/SkipLink";
import { Button } from "@/components/ui/button";

describe("platform primitives", () => {
  it("renders skip link targeting main content", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", { name: /saltar al contenido/i });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("renders empty and error states with accessible roles", () => {
    render(
      <>
        <EmptyState title="Sin datos" description="Prueba otros filtros." />
        <ErrorState message="Fallo de red" />
      </>,
    );
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo de red");
  });

  it("renders breadcrumbs with current page marker", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/app/marketplace" },
          { label: "Comparar" },
        ]}
      />,
    );
    expect(screen.getByRole("navigation", { name: /ruta de navegación/i })).toBeInTheDocument();
    expect(screen.getByText("Comparar")).toHaveAttribute("aria-current", "page");
  });

  it("has no critical a11y violations for button and skip link", async () => {
    const { container } = render(
      <>
        <SkipLink />
        <Button>Acción</Button>
      </>,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
