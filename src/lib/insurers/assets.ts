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

export function resolveInsurerLogoUrl(
  insurer: Pick<Insurer, "logo_url" | "slug">,
  options?: { square?: boolean },
): string | null {
  if (options?.square && insurer.slug === "bmi") {
    return BMI_MARK_LOGO_URL;
  }
  return insurer.logo_url;
}
