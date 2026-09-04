import type { AppNavItem } from "@/components/layout/AppSidebarNav";

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { href: "/app", label: "Panel", icon: "dashboard" },
  { href: "/app/marketplace", label: "Marketplace", icon: "marketplace" },
  {
    href: "/app/desarrolladores",
    label: "Desarrolladores",
    icon: "developers",
  },
  {
    href: "/app/configuracion/perfil",
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
    href: "/app/configuracion/limites",
    label: "Límites de tasa",
    segment: "limites",
  },
] as const;

export const DEVELOPER_NAV_ITEMS = [
  {
    href: "/app/desarrolladores",
    label: "Resumen",
    segment: "resumen",
  },
  {
    href: "/app/desarrolladores/api-keys",
    label: "Claves API",
    segment: "api-keys",
  },
  {
    href: "/app/desarrolladores/docs",
    label: "Documentación",
    segment: "docs",
  },
  {
    href: "/app/desarrolladores/uso",
    label: "Uso",
    segment: "uso",
  },
  {
    href: "/app/desarrolladores/registros",
    label: "Registros",
    segment: "registros",
  },
] as const;

export type SettingsNavSegment =
  (typeof SETTINGS_NAV_ITEMS)[number]["segment"];

export type DeveloperNavSegment =
  (typeof DEVELOPER_NAV_ITEMS)[number]["segment"];
