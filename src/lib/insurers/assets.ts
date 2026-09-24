import type { Insurer } from "@/lib/types/database";

/** Known v1.3 carrier slugs — do not invent additional insurers here. */
export const V13_INSURER_SLUGS = ["bmi", "confiamed", "saludsa"] as const;

export type V13InsurerSlug = (typeof V13_INSURER_SLUGS)[number];

/** Default logo_url values for the v1.3 catalog CSV and migrations. */
export const V13_INSURER_LOGO_URLS: Record<V13InsurerSlug, string> = {
  bmi: "/insurers/bmi.png",
  confiamed: "/insurers/confiamed.png",
  saludsa: "/insurers/saludsa.svg",
};

/** Square mark for BMI compact slots (not stored in logo_url). */
export const BMI_MARK_LOGO_URL = "/insurers/bmi-mark.png";

const SAFE_LOGO_PATH =
  /^\/insurers\/[a-z0-9][a-z0-9._-]*\.(png|svg|webp|jpe?g)$/i;

export function isSafeInsurerLogoPath(url: string): boolean {
  if (!url.startsWith("/insurers/")) return false;
  if (url.includes("..") || url.includes("\\") || url.includes("//")) return false;
  if (url.includes("?") || url.includes("#")) return false;
  return SAFE_LOGO_PATH.test(url);
}

function isV13Slug(slug: string): slug is V13InsurerSlug {
  return (V13_INSURER_SLUGS as readonly string[]).includes(slug);
}

export function resolveInsurerLogoUrl(
  insurer: Pick<Insurer, "logo_url" | "slug">,
  options?: { square?: boolean },
): string | null {
  if (options?.square && insurer.slug === "bmi") {
    return BMI_MARK_LOGO_URL;
  }

  const raw = insurer.logo_url?.trim() ?? "";
  if (raw && isSafeInsurerLogoPath(raw)) {
    return raw;
  }

  if (isV13Slug(insurer.slug)) {
    return V13_INSURER_LOGO_URLS[insurer.slug];
  }

  return null;
}
