import { SITE_NAME } from "@/lib/constants";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://coveru.ec";

export const SITE_LOCALE = "es_EC";

export const DEFAULT_OG_IMAGE = "/og-coveru.png";

export const PUBLIC_ROUTES = [
  "/",
  "/comparar",
  "/nosotros",
  "/agentes",
  "/contacto",
  "/faqs",
  "/developers",
  "/login",
] as const;

export const SITE_DESCRIPTION =
  "Compara planes de seguro de salud en Ecuador con precios claros, límites visibles y datos de demostración hasta integrar aseguradoras reales.";

export const SITE_KEYWORDS = [
  "seguros de salud Ecuador",
  "comparador de seguros",
  "planes de salud",
  "cobertura médica",
  "CoverÜ",
] as const;

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}

export function pageTitle(title?: string): string {
  if (!title) return `${SITE_NAME} — Comparador de seguros de salud`;
  return `${title} | ${SITE_NAME}`;
}
