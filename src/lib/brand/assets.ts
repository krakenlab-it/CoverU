/**
 * Canonical paths for Sam's CoverÜ visual pack (drop into `public/`).
 * See `public/ASSETS.md` for the full manifest and copy instructions.
 */
export const BRAND_ASSETS = {
  wordmark: "/brand/wordmark.svg",
  wordmarkPng: "/brand/wordmark.png",
  mark: "/brand/mark.svg",
  markPng: "/brand/mark.png",
  lockupHorizontal: "/brand/lockup-horizontal.svg",
  lockupHorizontalPng: "/brand/lockup-horizontal.png",
  lockupStacked: "/brand/lockup-stacked.svg",
  lockupStackedPng: "/brand/lockup-stacked.png",
  lockupOnDark: "/brand/lockup-on-dark.svg",
} as const;

export const FAVICON_ASSETS = {
  favicon: "/favicon.ico",
  icon192: "/icon-192.png",
  icon512: "/icon-512.png",
  appleTouchIcon: "/apple-touch-icon.png",
} as const;

export const SOCIAL_ASSETS = {
  openGraph: "/og-coveru.png",
  twitter: "/twitter-coveru.png",
} as const;

export const ILLUSTRATION_ASSETS = {
  empty: "/illustrations/empty-state.svg",
  emptyPng: "/illustrations/empty-state.png",
  error: "/illustrations/error-state.svg",
  errorPng: "/illustrations/error-state.png",
  loading: "/illustrations/loading.svg",
  loadingPng: "/illustrations/loading.png",
} as const;

export type BrandLogoVariant = "wordmark" | "mark" | "lockup-horizontal" | "lockup-stacked";

export function brandLogoSrc(variant: BrandLogoVariant): string {
  switch (variant) {
    case "mark":
      return BRAND_ASSETS.mark;
    case "lockup-horizontal":
      return BRAND_ASSETS.lockupHorizontal;
    case "lockup-stacked":
      return BRAND_ASSETS.lockupStacked;
    case "wordmark":
    default:
      return BRAND_ASSETS.wordmark;
  }
}

export type StateIllustrationVariant = "empty" | "error" | "loading";

export function stateIllustrationSrc(variant: StateIllustrationVariant): string {
  switch (variant) {
    case "error":
      return ILLUSTRATION_ASSETS.error;
    case "loading":
      return ILLUSTRATION_ASSETS.loading;
    case "empty":
    default:
      return ILLUSTRATION_ASSETS.empty;
  }
}

/** Prefer static OG image when Sam's pack is present; metadata uses this path. */
export function preferredOgImagePath(): string {
  return SOCIAL_ASSETS.openGraph;
}

export function preferredTwitterImagePath(): string {
  return SOCIAL_ASSETS.twitter;
}
