import type { AppNavItem } from "@/components/layout/AppSidebarNav";

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { href: "/app/marketplace", label: "Marketplace", icon: "marketplace" },
  {
    href: "/app/configuracion/api-keys",
    label: "Configuración",
    icon: "settings",
  },
] as const;

export const SETTINGS_NAV_ITEMS = [
  {
    href: "/app/configuracion/perfil",
    label: "Perfil y organización",
    segment: "perfil",
  },
  {
    href: "/app/configuracion/api-keys",
    label: "API keys",
    segment: "api-keys",
  },
  {
    href: "/app/configuracion/uso",
    label: "Uso",
    segment: "uso",
  },
  {
    href: "/app/configuracion/limites",
    label: "Límites de tasa",
    segment: "limites",
  },
  {
    href: "/app/configuracion/registros",
    label: "Registros",
    segment: "registros",
  },
] as const;

export type SettingsNavSegment =
  (typeof SETTINGS_NAV_ITEMS)[number]["segment"];
