export type CoveruEnvDiagnostics = {
  route?: string;
  hasUrl: boolean;
  urlHost: string | null;
  hasAnonKey: boolean;
  anonLength: number;
  anonPrefix: string;
  hasServiceRole: boolean;
};

export type AnonKeyKind = "eyJ" | "sb_publishable" | "other" | "empty";

export function getUrlHost(url: string): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function getAnonKeyPrefix(anonKey: string): string {
  if (!anonKey) {
    return "empty";
  }

  return anonKey.slice(0, 8);
}

export function classifyAnonKeyKind(anonKey: string): AnonKeyKind {
  if (!anonKey) {
    return "empty";
  }

  if (anonKey.startsWith("eyJ")) {
    return "eyJ";
  }

  if (anonKey.startsWith("sb_publishable")) {
    return "sb_publishable";
  }

  return "other";
}

export function classifyAnonKeyFromPrefix(prefix: string): AnonKeyKind {
  if (!prefix || prefix === "empty") {
    return "empty";
  }

  if (prefix.startsWith("eyJ")) {
    return "eyJ";
  }

  if (prefix.startsWith("sb_publi")) {
    return "sb_publishable";
  }

  return "other";
}

export function buildCoveruEnvDiagnostics(options: {
  route?: string;
  url?: string;
  anonKey?: string;
  includeServiceRole?: boolean;
} = {}): CoveruEnvDiagnostics {
  const url = options.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey =
    options.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceRole =
    options.includeServiceRole === false
      ? ""
      : (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");

  return {
    route: options.route,
    hasUrl: Boolean(url),
    urlHost: getUrlHost(url),
    hasAnonKey: Boolean(anonKey),
    anonLength: anonKey.length,
    anonPrefix: getAnonKeyPrefix(anonKey),
    hasServiceRole: Boolean(serviceRole),
  };
}

export function logCoveruEnv(
  diagnostics: CoveruEnvDiagnostics,
  level: "info" | "warn" = "info",
): void {
  const payload = JSON.stringify(diagnostics);

  if (level === "warn") {
    console.warn("[coveru-env]", payload);
  } else {
    console.info("[coveru-env]", payload);
  }
}

export type CoveruEnvHealthResponse = {
  ok: boolean;
  hasUrl: boolean;
  urlHost: string | null;
  hasAnonKey: boolean;
  anonLength: number;
  anonPrefix: string;
  hasServiceRole: boolean;
};

export function buildCoveruEnvHealthResponse(
  diagnostics: CoveruEnvDiagnostics,
): CoveruEnvHealthResponse {
  return {
    ok: diagnostics.hasUrl && diagnostics.hasAnonKey,
    hasUrl: diagnostics.hasUrl,
    urlHost: diagnostics.urlHost,
    hasAnonKey: diagnostics.hasAnonKey,
    anonLength: diagnostics.anonLength,
    anonPrefix: diagnostics.anonPrefix,
    hasServiceRole: diagnostics.hasServiceRole,
  };
}
