import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ApiDocsContent } from "@/components/developers/ApiDocsContent";

describe("ApiDocsContent", () => {
  it("renders authentication, endpoints, and curl examples", () => {
    render(<ApiDocsContent />);

    expect(
      screen.getByRole("heading", { name: /autenticación/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /crear o administrar claves/i }),
    ).toHaveAttribute("href", "/app/desarrolladores/api-keys");
    expect(
      screen.getByRole("heading", { name: /referencia de endpoints/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/listar aseguradoras/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/buscar tarifas/i)).toBeInTheDocument();
    expect(screen.getByText(/consulta de cobertura \(qa\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /descargar openapi\.json/i }),
    ).toHaveAttribute("href", "/openapi.json");
  });

  it("has no critical a11y violations", async () => {
    const { container } = render(<ApiDocsContent />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
