import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { DeveloperTabs } from "@/components/developers/DeveloperTabs";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { APP_NAV_ITEMS } from "@/lib/settings/navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("AppSidebarNav", () => {
  it("renders primary panel navigation links", () => {
    render(<AppSidebarNav items={APP_NAV_ITEMS} />);

    expect(
      screen.getByRole("navigation", { name: /navegación del panel/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Panel" })).toHaveAttribute(
      "href",
      "/app",
    );
    expect(screen.getByRole("link", { name: "Marketplace" })).toHaveAttribute(
      "href",
      "/app/marketplace",
    );
    expect(
      screen.getByRole("link", { name: "Asistente de cobertura" }),
    ).toHaveAttribute("href", "/app/asistente-cobertura");
    expect(
      screen.getByRole("link", { name: "Desarrolladores" }),
    ).toHaveAttribute("href", "/app/desarrolladores");
    expect(
      screen.getByRole("link", { name: "Configuración" }),
    ).toHaveAttribute("href", "/app/configuracion");
  });

  it("marks the active route with aria-current", () => {
    render(<AppSidebarNav items={APP_NAV_ITEMS} />);
    expect(screen.getByRole("link", { name: "Panel" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("has no critical a11y violations", async () => {
    const { container } = render(<AppSidebarNav items={APP_NAV_ITEMS} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});

describe("SettingsTabs", () => {
  it("renders settings section tabs", () => {
    render(<SettingsTabs />);

    expect(
      screen.getByRole("navigation", { name: /secciones de configuración/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /perfil y organización/i }),
    ).toHaveAttribute("href", "/app/configuracion/perfil");
    expect(screen.getByRole("tab", { name: /límites de tasa/i })).toHaveAttribute(
      "href",
      "/app/configuracion/limites",
    );
  });
});

describe("DeveloperTabs", () => {
  it("renders developer section tabs", () => {
    render(<DeveloperTabs />);

    expect(
      screen.getByRole("navigation", { name: /secciones de desarrolladores/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /claves api/i })).toHaveAttribute(
      "href",
      "/app/desarrolladores/api-keys",
    );
    expect(screen.getByRole("tab", { name: /documentación/i })).toHaveAttribute(
      "href",
      "/app/desarrolladores/docs",
    );
    expect(screen.getByRole("tab", { name: /registros/i })).toHaveAttribute(
      "href",
      "/app/desarrolladores/registros",
    );
  });
});
