export const COVERU_RED = "#DF0926";

export const DEMO_BADGE_LABEL = "DEMO — datos de ejemplo";

/** Logged-in product / internal naming. */
export const SITE_NAME = "CoverÜ";

/** Public marketing site name (Astro landing). */
export const MARKETING_SITE_NAME = "Cover U";

/** Public marketing header/footer navigation (matches Astro landing). */
export const NAV_LINKS = [
  { href: "/agentes", label: "Agentes" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contacto", label: "Contact" },
] as const;

/** Footer and secondary links beyond the Astro-style header. */
export const FOOTER_EXTRA_LINKS = [
  { href: "/comparar", label: "Comparar planes" },
  { href: "/developers", label: "Desarrolladores" },
] as const;

/** Shared WhatsApp destination for header CTA and floating action button. */
export const WHATSAPP_CONTACT_HREF =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "https://wa.me/593XXXXXXXXX";
