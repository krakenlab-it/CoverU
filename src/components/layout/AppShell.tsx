import { AppShellNav, type AppNavItem } from "@/components/layout/AppShellNav";
import { DemoAlert } from "@/components/platform/DemoAlert";

const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { href: "/app/marketplace", label: "Marketplace" },
  { href: "/app/marketplace/compare", label: "Comparar" },
  { href: "/app/perfil", label: "Perfil" },
  { href: "/developers", label: "API" },
] as const;

type AppShellProps = {
  children: React.ReactNode;
  organizationName?: string;
  isDemo?: boolean;
  showDemoBanner?: boolean;
};

export function AppShell({
  children,
  organizationName,
  isDemo,
  showDemoBanner,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppShellNav
        items={APP_NAV_ITEMS}
        organizationName={organizationName}
        isDemo={isDemo}
      />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        {showDemoBanner ? <DemoAlert /> : null}
        <div id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </div>
      </div>
    </div>
  );
}
