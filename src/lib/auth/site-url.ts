/**
 * Base URL for Supabase Auth redirects (signup confirm, password recovery).
 * Prefer NEXT_PUBLIC_SITE_URL, then Vercel preview/production host, then localhost.
 */
export function getAuthSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function buildAuthCallbackUrl(nextPath: string): string {
  const base = getAuthSiteUrl();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  const url = new URL("/auth/callback", base);
  url.searchParams.set("next", next);
  return url.toString();
}
