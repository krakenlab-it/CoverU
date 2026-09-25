const SAFE_ORIGIN = "https://coveru.internal";

/**
 * Allow only same-app relative paths. Rejects absolute URLs, protocol-relative
 * URLs, and backslash tricks that browsers treat as `//host`.
 */
export function safeInternalPath(
  candidate: string | null | undefined,
  fallback = "/app",
): string {
  if (!candidate) return fallback;

  const value = candidate.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  if (value.includes("\\") || value.includes("\0") || /[\r\n]/.test(value)) {
    return fallback;
  }

  let url: URL;
  try {
    url = new URL(value, SAFE_ORIGIN);
  } catch {
    return fallback;
  }

  if (url.origin !== SAFE_ORIGIN) return fallback;

  return `${url.pathname}${url.search}${url.hash}`;
}
