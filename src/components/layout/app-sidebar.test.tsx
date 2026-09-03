import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { APP_NAV_ITEMS } from "@/lib/settings/navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/marketplace",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("AppSidebarNav", () => {
  it("renders primary panel navigation links", () => {
    render(<AppSidebarNav items={APP_NAV_ITEMS} />);

    expect(
      screen.getByRole("navigation", { name: /navegación del panel/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Marketplace" })).toHaveAttribute(
      "href",
      "/app/marketplace",
    );
    expect(screen.getByRole("link", { name: "Comparar" })).toHaveAttribute(
      "href",
      "/app/marketplace/compare",
    );
    expect(
      screen.getByRole("link", { name: "Desarrolladores" }),
    ).toHaveAttribute("href", "/developers");
    expect(
      screen.getByRole("link", { name: "Configuración" }),
    ).toHaveAttribute("href", "/app/configuracion/perfil");
  });

  it("marks the active route with aria-current", () => {
    render(<AppSidebarNav items={APP_NAV_ITEMS} />);
    expect(screen.getByRole("link", { name: "Marketplace" })).toHaveAttribute(
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
    expect(screen.getByRole("tab", { name: /api keys/i })).toHaveAttribute(
      "href",
      "/app/configuracion/api-keys",
    );
  });
});
