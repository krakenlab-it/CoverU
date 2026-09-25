/**
 * Base URL for Supabase Auth redirects (signup confirm, password recovery).
 * Prefer NEXT_PUBLIC_SITE_URL, then Vercel preview/production host, then localhost.
 */
export function getAuthSiteUrl(): string {
  return resolveAuthSiteUrl();
}

function isHttpOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.origin === value.replace(/\/$/, "")
    );
  } catch {
    return false;
  }
}

/**
 * Resolve the public site origin for auth emails.
 * `browserOrigin` is used when this runs in the browser: `VERCEL_URL` is not
 * inlined into client bundles, so without it password-reset links fall back
 * to localhost.
 */
export function resolveAuthSiteUrl(browserOrigin?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const browser = browserOrigin?.trim();
  if (browser && isHttpOrigin(browser)) {
    return browser.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

export function buildAuthCallbackUrl(
  nextPath: string,
  browserOrigin?: string | null,
): string {
  const base = resolveAuthSiteUrl(browserOrigin);
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  const url = new URL("/auth/callback", base);
  url.searchParams.set("next", next);
  return url.toString();
}
